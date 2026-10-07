import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCGHLm-kea_cwYTrqSpVAjl5jtVxGhpjTo",
  authDomain: "amaccstudentrequest-c60df.firebaseapp.com",
  projectId: "amaccstudentrequest",
  storageBucket: "amaccstudentrequest.firebasestorage.app",
  messagingSenderId: "920430909248",
  appId: "1:920430909248:web:450429bf44bb7824278ca5"
};

// Extend Window interface para sa TypeScript
declare global {
  interface Window {
    _firebaseApp?: FirebaseApp;
    _firestoreDb?: Firestore;
    _firebaseAuth?: Auth;
    _firebaseStorage?: FirebaseStorage;
  }
}

// Singleton App
function getFirebaseApp(): FirebaseApp {
  if (typeof window !== "undefined" && window._firebaseApp) {
    return window._firebaseApp;
  }

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  if (typeof window !== "undefined") {
    window._firebaseApp = app;
  }

  return app;
}

// Singleton Firestore with persistence
function getFirestoreDb(app: FirebaseApp): Firestore {
  if (typeof window !== "undefined" && window._firestoreDb) {
    return window._firestoreDb;
  }

  let db: Firestore;

  if (typeof window !== "undefined") {
    try {
      // Try initializing with multi-tab persistence
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch (error) {
      // Already initialized - just get the existing instance
      db = getFirestore(app);
    }
    window._firestoreDb = db;
  } else {
    // Server-side
    db = getFirestore(app);
  }

  return db;
}

// Initialize all services
const app = getFirebaseApp();
const db = getFirestoreDb(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Cache auth and storage too
if (typeof window !== "undefined") {
  window._firebaseAuth = auth;
  window._firebaseStorage = storage;
}

export { app, db, auth, storage, firebaseConfig };