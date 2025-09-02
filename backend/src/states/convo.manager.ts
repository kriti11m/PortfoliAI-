import { ConvoService } from "../services/convo.service";
import { TwilioService } from "../services/twilio.service";
import { UserState } from "../types/states.types";

export class ConversationManager {
  static async handleIncomingMessage(from: string, text: string) {
    let userState = await ConvoService.getUserState(from);

    if (!userState) {
      userState = { step: "collect_name", data: {} };
      await ConvoService.setUserState(from, userState);
      return TwilioService.sendMessage(from, "👋 Hello! Welcome to PortfoliAI - your AI career assistant!\n\nI'm here to help you create your professional profile. Let's get started!\n\nWhat's your name?");
    }

    switch (userState.step) {
      case "collect_name":
        userState.data.name = text;
        userState.step = "collect_role";
        await ConvoService.setUserState(from, userState);
        return TwilioService.sendMessage(from, `Nice to meet you, ${text}! 😊\n\nWhat's your professional role or job title?\n\n(e.g., Software Developer, UI/UX Designer, Data Scientist, etc.)`);

      case "collect_role":
        userState.data.role = text;
        userState.step = "collect_skills";
        await ConvoService.setUserState(from, userState);
        return TwilioService.sendMessage(from, `Awesome! A ${text} - that's exciting! 🚀\n\nNow, please list your key skills separated by commas.\n\n(e.g., JavaScript, React, Node.js, Python)`);

      case "collect_skills":
        userState.data.skills = text.split(",").map(s => s.trim());
        userState.step = "completed";
        await ConvoService.setUserState(from, userState);
        
        // Create a nice summary
        const summary = `🎉 Perfect! Your profile is ready!\n\n📋 Profile Summary:\n• Name: ${userState.data.name}\n• Role: ${userState.data.role}\n• Skills: ${userState.data.skills?.join(", ")}\n\n✅ Your data has been saved successfully!\n\nType "help" anytime for assistance or "reset" to start over.`;
        
        return TwilioService.sendMessage(from, summary);

      case "completed":
        // Handle commands after profile completion
        if (text.toLowerCase() === "reset") {
          await ConvoService.clearUserState(from);
          return TwilioService.sendMessage(from, "🔄 Profile reset! Let's start fresh.\n\nWhat's your name?");
        } else if (text.toLowerCase() === "help") {
          return TwilioService.sendMessage(from, "🤖 PortfoliAI Commands:\n\n• Type 'reset' to create a new profile\n• Type 'profile' to view your current profile\n• Send any message and I'll help you improve your career!");
        } else if (text.toLowerCase() === "profile") {
          const profile = `👤 Your Current Profile:\n\n• Name: ${userState.data.name}\n• Role: ${userState.data.role}\n• Skills: ${userState.data.skills?.join(", ")}`;
          return TwilioService.sendMessage(from, profile);
        } else {
          return TwilioService.sendMessage(from, `Hi ${userState.data.name}! 👋\n\nI can help you with career advice, skill recommendations, or job search tips.\n\nType 'help' for commands or 'profile' to view your info.`);
        }

      default:
        return TwilioService.sendMessage(from, "🤔 Something went wrong. Type 'reset' to start over.");
    }
  }
}
