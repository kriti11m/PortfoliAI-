// backend/src/services/convo.service.ts
import { firestore } from "../config/firebase";
import { UserState, ProfileData } from "../types/states.types";

const USERS_COL = "user_states";
const CONV_COL = "conversations";
const PROFILES_COL = "profiles";

export class ConvoService {
  static async getUserState(from: string): Promise<UserState | null> {
    if (!firestore) return null;
    try {
      const doc = await firestore.collection(USERS_COL).doc(from).get();
      if (!doc.exists) return null;
      return doc.data() as UserState;
    } catch (err) {
      console.error("ConvoService.getUserState error:", err);
      return null;
    }
  }

  static async setUserState(from: string, statePartial: Partial<UserState>) {
    if (!firestore) {
      console.warn("Firestore not initialized");
      return;
    }
    try {
      const now = new Date().toISOString();
      await firestore.collection(USERS_COL).doc(from).set(
        {
          ...statePartial,
          updatedAt: now,
        },
        { merge: true }
      );
    } catch (err) {
      console.error("ConvoService.setUserState error:", err);
    }
  }

  static async clearUserState(from: string) {
    if (!firestore) return;
    try {
      await firestore.collection(USERS_COL).doc(from).delete();
    } catch (err) {
      console.error("ConvoService.clearUserState error:", err);
    }
  }

  static async saveMessage(from: string, payload: any) {
    if (!firestore) return;
    try {
      const msgId = payload.MessageSid || firestore.collection(CONV_COL).doc().id;
      await firestore.collection(CONV_COL).doc(from).collection("messages").doc(msgId).set({
        from,
        body: payload.Body ?? payload.body ?? null,
        raw: payload,
        direction: "inbound",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("ConvoService.saveMessage error:", err);
    }
  }

  // Draft profile helpers: single doc at profiles/{from}/draft
  static async upsertDraft(from: string, partial: Partial<ProfileData>) {
    if (!firestore) return;
    try {
      const now = new Date().toISOString();
      await firestore
        .collection(PROFILES_COL)
        .doc(from)
        .collection("draft")
        .doc("profile")
        .set({ ...partial, updatedAt: now }, { merge: true });
    } catch (err) {
      console.error("ConvoService.upsertDraft error:", err);
    }
  }

  static async getDraft(from: string): Promise<ProfileData | null> {
    if (!firestore) return null;
    try {
      const doc = await firestore.collection(PROFILES_COL).doc(from).collection("draft").doc("profile").get();
      return doc.exists ? (doc.data() as ProfileData) : null;
    } catch (err) {
      console.error("ConvoService.getDraft error:", err);
      return null;
    }
  }
}
