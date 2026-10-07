
'use client';

/**
 * FIREBASE CLIENT SDK INDEX
 * This file exports initialized Firebase Client SDK instances and custom hooks
 * for direct use in client-side React components.
 */

import { app, db as firestore, auth } from './config';
import { getAuth } from 'firebase/auth';

export { app, firestore, auth, getAuth };

// Re-export hooks from existing infrastructure
export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
