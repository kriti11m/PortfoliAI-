// backend/src/controllers/webhook.controller.ts
import express, { Request, Response } from "express";
import { firestore } from "../config/firebase";
import { ConversationManager } from "../states/convo.manager";

const router = express.Router();

// GET route (health/verification quick check)
router.get("/whatsapp", (req: Request, res: Response) => {
  console.log("GET /webhook/whatsapp verification check");
  res.status(200).send("Webhook endpoint is working");
});

router.post("/whatsapp", async (req: Request, res: Response) => {
  try {
    const from = req.body.From as string; // "whatsapp:+919..."
    const body = (req.body.Body || req.body.Body) as string;
    const messageId = req.body.MessageSid as string | undefined;

    console.log("Webhook POST /whatsapp:", { from, body, messageId });

    // Persist incoming message quickly (best-effort). ConvoService will also save.
    if (firestore && from) {
      try {
        const msgDoc = firestore.collection("conversations").doc(from).collection("messages");
        const id = messageId || msgDoc.doc().id;
        await msgDoc.doc(id).set({
          from,
          body,
          direction: "inbound",
          timestamp: new Date().toISOString(),
          raw: req.body,
        });
      } catch (e) {
        console.warn("Failed to persist webhook message (non-fatal):", e);
      }
    }

    // Handle the message in converation manager (don't await long processing for Twilio ack)
    // but we will await here because we want deterministic message replies via Twilio before sending 200.
    await ConversationManager.handleIncomingMessage(from, body);

    // Quick ACK to Twilio
    return res.status(200).send("Message processed");
  } catch (err) {
    console.error("Error in /webhook/whatsapp:", err);
    return res.status(500).send("Webhook error");
  }
});

export default router;
