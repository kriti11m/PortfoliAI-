  // backend/src/config/firebase.ts
  import admin from "firebase-admin";

  function initFirebase() {
    if (admin.apps.length) return { firestore: admin.firestore(), storage: admin.storage() };

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";

    if (!projectId || !clientEmail || !privateKey) {
      console.warn("Firestore environment variables missing - skipping initialization.");
      return { firestore: null, storage: null };
    }

    // Private key may have literal \n that need replacing.
    privateKey = privateKey.replace(/\\n/g, "\n");

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      } as admin.ServiceAccount),
      storageBucket: `${projectId}.appspot.com`
    });

    const db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });
    return { firestore: db, storage: admin.storage() };
  }

  const { firestore, storage } = initFirebase();

  export { firestore, storage };
