import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken) {
  console.warn("TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set in env.");
}

const client = twilio(accountSid || "", authToken || "");

export class TwilioService {
  static async sendMessage(to: string, message: string) {
    if (!fromNumber) {
      console.warn("TWILIO_WHATSAPP_NUMBER not configured - cannot send message");
      return null;
    }
    try {
      const res = await client.messages.create({
        from: fromNumber,
        to,
        body: message,
      });
      console.log(`Twilio: sent message to ${to} sid=${res.sid}`);
      return res;
    } catch (err: any) {
      if (err.code === 63038) {
        console.warn("Daily message limit exceeded. Please upgrade your Twilio account or wait 24 hours.");
        return null; // Don't crash the app
      }
      console.error("TwilioService.sendMessage error:", err);
      throw err;
    }
  }

  // optional helper for sending media in future
  static async sendMediaMessage(to: string, body: string, mediaUrl: string[]) {
    if (!fromNumber) throw new Error("TWILIO_WHATSAPP_NUMBER not configured");
    try {
      const res = await client.messages.create({
        from: fromNumber,
        to,
        body,
        mediaUrl,
      });
      return res;
    } catch (err: any) {
      if (err.code === 63038) {
        console.warn("Daily message limit exceeded for media message.");
        return null;
      }
      console.error("TwilioService.sendMediaMessage error:", err);
      throw err;
    }
  }
}