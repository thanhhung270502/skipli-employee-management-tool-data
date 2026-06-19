import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore | undefined;

export const initializeFirebase = (): admin.firestore.Firestore | undefined => {
  if (admin.apps.length === 0) {
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined;

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });

      console.log('✅ Firebase Admin initialized');
      db = admin.firestore();
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin:', error instanceof Error ? error.message : error);
      console.warn('⚠️ Server will run, but database queries will fail. Please provide valid Firebase credentials in .env');
    }
  } else {
    db = admin.firestore();
  }

  return db;
};

export const getDb = (): admin.firestore.Firestore => {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return db;
};

export { admin };
