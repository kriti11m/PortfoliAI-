// backend/src/controllers/webhook.controller.ts
import express, { Request, Response } from "express";
import { firestore } from "../config/firebase";

const router = express.Router();

/**
 * GET /webhook/whatsapp
 * Handler for Meta webhook verification during setup.
 * Meta sends: ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
 */
router.get("/whatsapp", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("Webhook verified");
    return res.status(200).send(challenge as string);
  }
  res.sendStatus(403);
});

/**
 * POST /webhook/whatsapp
 * Receives messages from Meta. This minimal example handles text messages only.
 */
router.post("/whatsapp", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    // Meta webhook has a complex envelope; this is a simplified extraction.
    // Real-world: validate signature header and traverse body.entry[].changes[].value
    const entries = body?.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        const messages = value?.messages || [];
        for (const message of messages) {
          const from = message.from; // WhatsApp sender id (phone)
          const type = message.type;
          // text message payload
          if (type === "text") {
            const text = message.text?.body;
            console.log(`Received text from ${from}: ${text}`);

            // Persist raw message to Firestore (conversations collection)
            if (firestore) {
              await firestore
                .collection("conversations")
                .doc(from)
                .collection("messages")
                .add({
                  from,
                  text,
                  type,
                  raw: message,
                  createdAt: new Date().toISOString()
                });
            }
            // TODO: enqueue to convo processor or reply
          }
        }
      }
    }
    // respond 200 quickly to Meta
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook processing error", err);
    res.sendStatus(500);
  }
});

export default router;
