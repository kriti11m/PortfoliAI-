// backend/src/states/convo.manager.ts
import { ConvoService } from "../services/convo.service";
import { TwilioService } from "../services/twilio.service";
import { UserState } from "../types/states.types";
import { firestore } from "../config/firebase";
import { fetchGitHubRepos } from "../services/githubService";
import { generatePortfolio } from "../services/portfolioService";

/**
 * ConversationManager: single entrypoint handleIncomingMessage
 * - loads state
 * - persists messages
 * - routes based on state.step
 */
export class ConversationManager {
  static async handleIncomingMessage(from: string, text: string) {
    try {
      // Save inbound message raw
      await ConvoService.saveMessage(from, { From: from, Body: text });

      // Load user state
      let userState = await ConvoService.getUserState(from);
      if (!userState) {
        // initialize
        userState = {
          step: "collect_name",
          data: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await ConvoService.setUserState(from, userState);
        // Ask name
        await TwilioService.sendMessage(
          from,
          "👋 Hello! Welcome to PortfoliAI — your AI career assistant.\n\nLet's get started. What's your full name?"
        );
        return;
      }

      // route by step
      const step = userState.step;

      if (step === "collect_name") {
        // Save name and update step
        const name = (text || "").trim();
        userState.data = userState.data || {};
        userState.data.name = name;
        userState.step = "collect_role";
        await ConvoService.setUserState(from, userState);
        await ConvoService.upsertDraft(from, { name });
        await TwilioService.sendMessage(from, `Nice to meet you, ${name}! What's your professional role / job title?`);
        return;
      }

      if (step === "collect_role") {
        const role = (text || "").trim();
        userState.data = userState.data || {};
        userState.data.role = role;
        userState.step = "collect_skills";
        await ConvoService.setUserState(from, userState);
        await ConvoService.upsertDraft(from, { role });
        await TwilioService.sendMessage(from, `Got it — you're a "${role}". Now, please list your key skills separated by commas (e.g., Node.js, React, SQL).`);
        return;
      }

      if (step === "collect_skills") {
        const skills = (text || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        userState.data = userState.data || {};
        userState.data.skills = skills;
        userState.step = "collect_bio";
        await ConvoService.setUserState(from, userState);
        await ConvoService.upsertDraft(from, { skills });
        await TwilioService.sendMessage(from, `Great — noted your skills: ${skills.join(", ")}.\n\nPlease write a one-line professional summary / bio (e.g., "Backend developer building scalable Node.js services").`);
        return;
      }

      if (step === "collect_bio") {
        const bio = (text || "").trim();
        userState.data = userState.data || {};
        userState.data.bio = bio;
        userState.step = "collect_projects";
        await ConvoService.setUserState(from, userState);
        await ConvoService.upsertDraft(from, { bio });

        // Provide next options
        await TwilioService.sendMessage(
          from,
          `Bio saved.\n\nNext: would you like to import projects from GitHub or add them manually?\n\nReply with:\n• "import github" — to pull public repos\n• "manual" — to add projects one by one\n• "generate" — to skip projects and build now`
        );
        return;
      }

      if (step === "collect_projects") {
        const low = (text || "").trim().toLowerCase();
        if (low.includes("import") || low.includes("github")) {
          userState.step = "await_github_username";
          await ConvoService.setUserState(from, userState);
          await TwilioService.sendMessage(from, "Please send your GitHub username (e.g., 'octocat'). I will fetch your public repos.");
          return;
        } else if (low.includes("manual")) {
          userState.step = "adding_project";
          await ConvoService.setUserState(from, userState);
          await TwilioService.sendMessage(from, "OK — send the project as: <Title> - <short description>. I'll save each one. Send 'done' when finished.");
          return;
        } else if (low.includes("generate") || low.includes("build")) {
          // Move to building state
          userState.step = "building";
          await ConvoService.setUserState(from, userState);

          await TwilioService.sendMessage(from, "🔧 Generating your portfolio... This may take a moment.");

          try {
            // Generate portfolio
            const { htmlUrl, pdfUrl } = await generatePortfolio(from);
            
            // Update build status
            const buildId = `build_${Date.now()}`;
            if (firestore) {
              await firestore
                .collection("builds")
                .doc(buildId)
                .set({
                  buildId,
                  userId: from,
                  status: "completed",
                  htmlUrl,
                  pdfUrl,
                  createdAt: new Date().toISOString(),
                  completedAt: new Date().toISOString(),
                });
            }

            userState.step = "completed";
            await ConvoService.setUserState(from, userState);

            await TwilioService.sendMessage(
              from, 
              `🎉 Your portfolio is ready!\n\n` +
              `📄 Website: ${htmlUrl}\n` +
              `📑 PDF: ${pdfUrl}\n\n` +
              `Type 'profile' to view your data or 'reset' to start over.`
            );
            
          } catch (error) {
            console.error("Portfolio generation error:", error);
            userState.step = "collect_projects";
            await ConvoService.setUserState(from, userState);
            
            await TwilioService.sendMessage(
              from, 
              "❌ Sorry, there was an error generating your portfolio. Please try again or type 'reset' to start over."
            );
          }
          return;
        } else {
          return TwilioService.sendMessage(
            from,
            "I didn't understand. Reply 'import github' to import repos, 'manual' to add projects, or 'generate' to build the site now."
          );
        }
      }

      if (step === "await_github_username") {
        const username = (text || "").trim().replace(/^github\s+/i, "");
        if (!username) {
          return TwilioService.sendMessage(from, "Please send a valid GitHub username.");
        }

        try {
          // Fetch GitHub repos
          await TwilioService.sendMessage(from, "🔍 Fetching your GitHub repositories...");
          
          const repos = await fetchGitHubRepos(username);
          
          if (repos.length === 0) {
            await TwilioService.sendMessage(from, "No public repositories found. You can type 'manual' to add projects manually or 'generate' to build with current data.");
          } else {
            // Save repos to draft
            const projects = repos.map(repo => ({
              title: repo.name,
              description: repo.description || "No description provided",
              url: repo.html_url,
              language: repo.language,
              stars: repo.stargazers_count
            }));
            
            await ConvoService.upsertDraft(from, { 
              githubUsername: username,
              projects: projects
            });

            await TwilioService.sendMessage(
              from, 
              `✅ Successfully fetched ${repos.length} repositories from GitHub!\n\n` +
              `• ${repos.slice(0, 3).map(r => r.name).join('\n• ')}` +
              `${repos.length > 3 ? `\n... and ${repos.length - 3} more` : ''}\n\n` +
              `Type 'generate' to build your portfolio now or 'manual' to add more projects.`
            );
          }
          
          userState.data = userState.data || {};
          userState.data.githubUsername = username;
          userState.step = "collect_projects";
          await ConvoService.setUserState(from, userState);
          
        } catch (error) {
          console.error("GitHub fetch error:", error);
          await TwilioService.sendMessage(from, "❌ Error fetching GitHub repos. Please check the username and try again.");
        }
        return;
      }

      if (step === "adding_project") {
        const low = (text || "").trim().toLowerCase();
        if (low === "done") {
          userState.step = "collect_projects";
          await ConvoService.setUserState(from, userState);
          return TwilioService.sendMessage(from, "OK — project entry finished. You can add another or type 'generate' to build.");
        }

        // Expect format: Title - description
        const parts = text.split(" - ");
        const title = parts[0]?.trim();
        const desc = parts.slice(1).join(" - ").trim();
        const draft = (await ConvoService.getDraft(from)) || {};
        const projects = draft.projects || [];
        projects.push({ title: title || "Untitled", description: desc || "" });
        await ConvoService.upsertDraft(from, { projects });
        userState.step = "collect_projects";
        await ConvoService.setUserState(from, userState);
        return TwilioService.sendMessage(from, `Saved project "${title}". Add more or type 'generate' to build.`);
      }

      if (step === "completed" || step === "building") {
        const low = (text || "").trim().toLowerCase();
        if (low === "reset") {
          await ConvoService.clearUserState(from);
          await TwilioService.sendMessage(from, "Your profile has been reset. Let's start again — what's your name?");
          return;
        } else if (low === "profile") {
          const draft = await ConvoService.getDraft(from);
          const name = draft?.name || "(not set)";
          const role = draft?.role || "(not set)";
          const skills = (draft?.skills || []).join(", ") || "(not set)";
          const bio = draft?.bio || "(not set)";
          const reply = `👤 Current draft profile:\nName: ${name}\nRole: ${role}\nSkills: ${skills}\nBio: ${bio}`;
          return TwilioService.sendMessage(from, reply);
        } else {
          return TwilioService.sendMessage(from, "I am building or your profile is completed. Type 'profile' to view, or 'reset' to start over.");
        }
      }

      // fallback
      return TwilioService.sendMessage(from, "Sorry, I didn't understand. Type 'help' for options or 'reset' to start over.");
    } catch (err) {
      console.error("ConversationManager.handleIncomingMessage error:", err);
      try {
        await TwilioService.sendMessage(from, "⚠️ Oops — something went wrong on my side. Please try again or type 'reset' to restart.");
      } catch (e) {
        // ignore
      }
    }
  }
}
