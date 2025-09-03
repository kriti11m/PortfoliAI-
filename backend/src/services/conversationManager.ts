import { firestore } from "../config/firebase";
import { TwilioService } from "./twilio.service";
import { generatePortfolio } from "./portfolioService";

interface UserState {
    state: string;
    name?: string;
    role?: string;
    skills?: string[];
    github?: string;
    linkedinPdf?: string;
    resume?: string;
}

export class ConversationManager {
    static async handleMessage(userId: string, message: string) {
        if (!firestore) {
            throw new Error("Firestore is not initialized");
        }

        const stateRef = firestore.collection("profiles").doc(userId);
        const stateDoc = await stateRef.get();

        let userState: UserState = { state: "start" };

        if (stateDoc.exists) {
            userState = (stateDoc.data() as UserState) || { state: "start" };
        }

        const lowerMsg = message.trim().toLowerCase();

        // 🆕 Restart session if user says "hi" anytime
        if (lowerMsg === "hi") {
            await stateRef.set({ state: "await_name" });
            return TwilioService.sendMessage(userId, "👋 Hi! Let’s build your portfolio.\nWhat’s your name?");
        }

        switch (userState.state) {
            case "await_name":
                await stateRef.set({ ...userState, state: "await_role", name: message });
                await TwilioService.sendMessage(userId, `Nice to meet you, ${message}! 🙌 What role do you work in?`);
                break;

            case "await_role":
                await stateRef.set({ ...userState, state: "await_skills", role: message });
                await TwilioService.sendMessage(userId, "Awesome! 🚀 Now list your key skills (comma separated).");
                break;

            case "await_skills":
                await stateRef.set({ ...userState, state: "await_links", skills: message.split(",").map(s => s.trim()) });
                await TwilioService.sendMessage(
                    userId,
                    "Perfect ✅\nNow please share:\n- Your GitHub link\n- Your LinkedIn resume PDF (URL)\n- Or any resume link\n\n(You can send them one by one)."
                );
                break;

            case "await_links":
                // Save GitHub / LinkedIn / Resume links depending on input
                let updates: Partial<UserState> = {};
                if (message.includes("github.com")) {
                    updates.github = message;
                    await TwilioService.sendMessage(userId, "✅ GitHub saved!");
                } else if (message.endsWith(".pdf") && message.includes("linkedin")) {
                    updates.linkedinPdf = message;
                    await TwilioService.sendMessage(userId, "✅ LinkedIn PDF saved!");
                } else if (message.endsWith(".pdf") || message.includes("resume")) {
                    updates.resume = message;
                    await TwilioService.sendMessage(userId, "✅ Resume saved!");
                } else {
                    await TwilioService.sendMessage(userId, "⚠️ Please send a valid GitHub link, LinkedIn PDF, or resume link.");
                    return;
                }

                const newState = { ...userState, ...updates };

                // If we have at least GitHub or Resume, move to generate
                if (newState.github || newState.resume || newState.linkedinPdf) {
                    await stateRef.set({ ...newState, state: "generate" });
                    await TwilioService.sendMessage(userId, "Generating your portfolio now... ⏳");

                    const { htmlUrl, pdfUrl } = await generatePortfolio(userId);
                    await TwilioService.sendMessage(userId, `🎉 Here’s your portfolio:\n🌐 ${htmlUrl}\n📄 ${pdfUrl}`);

                    await stateRef.set({ ...newState, state: "completed" });
                } else {
                    await stateRef.set({ ...newState, state: "await_links" });
                }
                break;

            case "completed":
                await TwilioService.sendMessage(userId, "✅ Portfolio already generated! Type 'hi' to start a new one.");
                break;

            default:
                await TwilioService.sendMessage(userId, "Type 'hi' to begin creating your portfolio.");
                await stateRef.set({ state: "start" });
                break;
        }
    }
}