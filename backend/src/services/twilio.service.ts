import twilio from "twilio";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export class TwilioService {
  static async sendMessage(to: string, message: string) {
    try {
      const result = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER, // e.g., "whatsapp:+14155238886"
        to: to,
        body: message,
      });
      console.log(`✅ Message sent to ${to}: ${message}`);
      return result;
    } catch (error) {
      console.error("❌ Error sending message:", error);
      throw error;
    }
  }
}
