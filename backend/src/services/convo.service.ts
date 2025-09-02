import { firestore } from "../config/firebase";
import { UserState } from "../types/states.types";

export class ConvoService {
  static async getUserState(from: string): Promise<UserState | null> {
    try {
      if (!firestore) return null;
      
      const doc = await firestore
        .collection("user_states")
        .doc(from)
        .get();
      
      if (doc.exists) {
        return doc.data() as UserState;
      }
      return null;
    } catch (error) {
      console.error("Error getting user state:", error);
      return null;
    }
  }

  static async setUserState(from: string, state: UserState): Promise<void> {
    try {
      if (!firestore) {
        console.warn("Firestore not configured, cannot save user state");
        return;
      }
      
      await firestore
        .collection("user_states")
        .doc(from)
        .set(state);
    } catch (error) {
      console.error("Error setting user state:", error);
    }
  }

  static async clearUserState(from: string): Promise<void> {
    try {
      if (!firestore) {
        console.warn("Firestore not configured, cannot clear user state");
        return;
      }
      
      await firestore
        .collection("user_states")
        .doc(from)
        .delete();
    } catch (error) {
      console.error("Error clearing user state:", error);
    }
  }
}
