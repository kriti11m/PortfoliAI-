import express, { Request, Response } from "express";
import { firestore } from "../config/firebase";
import { ConversationManager } from "../states/convo.manager";
import { TwilioService } from "../services/twilio.service";

const router = express.Router();

// GET route for webhook verification (required by Twilio)
router.get("/whatsapp", (req: Request, res: Response) => {
  console.log("Webhook verification request received");
  res.status(200).send("Webhook endpoint is working!");
});

router.post("/whatsapp", async (req: Request, res: Response) => {
  try {
    const from = req.body.From; // e.g. "whatsapp:+9198xxxxxx"
    const body = req.body.Body?.trim(); // User's message
    const messageId = req.body.MessageSid;

    console.log(`Incoming message from ${from}: ${body}`);

    // 1. Save the incoming message in Firestore
    if (firestore && messageId) {
      await firestore
        .collection("conversations")
        .doc(from)
        .collection("messages")
        .doc(messageId)
        .set({
          from,
          body,
          direction: "inbound",
          timestamp: new Date(),
        });
    }

    // 2. Pass the message to Conversation Manager
    await ConversationManager.handleIncomingMessage(from, body);

    // 3. Send quick ACK to Twilio
    res.status(200).send("Message processed");

  } catch (error) {
    console.error("Error in WhatsApp webhook:", error);
    res.status(500).send("Error processing message");
  }
});

export default router;
