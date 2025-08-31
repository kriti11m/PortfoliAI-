// backend/src/services/convo.service.ts
import { firestore } from "../config/firebase";

export class ConvoService {
  static async saveMessage(whatsappId: string, payload: any) {
    if (!firestore) return;
    const col = firestore.collection("conversations").doc(whatsappId).collection("messages");
    await col.add({
      ...payload,
      createdAt: new Date().toISOString()
    });
  }

  static async getUserState(whatsappId: string) {
    if (!firestore) return null;
    const userDoc = await firestore.collection("users").doc(whatsappId).get();
    return userDoc.exists ? userDoc.data() : null;
  }

  static async setUserState(whatsappId: string, state: any) {
    if (!firestore) return;
    await firestore.collection("users").doc(whatsappId).set(state, { merge: true });
  }
}
