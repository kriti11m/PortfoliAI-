import express, { Request, Response } from "express";
import { firestore } from "../config/firebase";

const router = express.Router();

/**
 * POST /webhook/whatsapp
 * Twilio WhatsApp Webhook handler.
 *
 * Twilio sends data as x-www-form-urlencoded by default, so make sure
 * you added: app.use(express.urlencoded({ extended: true })); in index.ts
 */
router.post("/whatsapp", async (req: Request, res: Response) => {
  try {
    const from = req.body.From;   // "whatsapp:+919876543210"
    const text = req.body.Body;   // Incoming message text

    console.log(`Received text from ${from}: ${text}`);

    // Save raw message to Firestore
    if (firestore) {
      await firestore
          .collection("conversations")
          .doc(from)
          .collection("messages")
          .add({
            from,
            text,
            timestamp: new Date(),
          });
    }

    // Respond to Twilio (must return 200 quickly)
    return res.status(200).send("Message received");
  } catch (err) {
    console.error("Webhook error:", err);
    return res.sendStatus(500);
  }
});

export default router;
