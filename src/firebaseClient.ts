import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { createUserRecord, getUserByFirebaseUid } from './api/authApi';

// Read Vite env variables. Ensure these are set in frontend/.env when running locally.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

// HMR-safe initialization: only initialize if not already initialized
if (!getApps().length) {
  if (firebaseConfig.apiKey) {
    try {
      initializeApp(firebaseConfig);
    } catch (err) {
      // Ignore initialize errors during HMR or if already initialized
      // but log for visibility
      // console.warn('Firebase initializeApp warning:', err);
    }
  }
}

const auth = getAuth();

export async function signUpWithEmail({ name, email, password, role = 'student' }: { name: string; email: string; password: string; role?: string; }) {
  if (!firebaseConfig.apiKey) {
    throw new Error('Firebase is not configured. Set VITE_FIREBASE_API_KEY and other env vars.');
  }

  // Create the user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update display name in Firebase
  if (name) {
    await updateProfile(user, { displayName: name });
  }

  // Save the user in our backend MongoDB users collection
  // Send firebaseUid so backend knows this user is Firebase-authenticated
  const userRecord = {
    name,
    email,
    firebaseUid: user.uid,
    role,
    createdAt: new Date().toISOString()
  };

  await createUserRecord(userRecord);

  return { firebaseUser: user, userRecord };
}

export async function signInWithEmail({ email, password }: { email: string; password: string; }) {
  if (!firebaseConfig.apiKey) {
    throw new Error('Firebase is not configured. Set VITE_FIREBASE_API_KEY and other env vars.');
  }

  const userCredential = await signInWithEmailAndPassword(getAuth(), email, password);
  const user = userCredential.user;

  // Try to fetch the application user record from backend. If missing, create it.
  try {
    const appUser = await getUserByFirebaseUid(user.uid);
    return { firebaseUser: user, appUser };
  } catch (err: any) {
    // If backend responded 404 or couldn't find the user, create a minimal record
    if (err?.response?.status === 404) {
      const userRecord = {
        name: user.displayName || '',
        email: user.email,
        firebaseUid: user.uid,
        role: 'student',
        createdAt: new Date().toISOString()
      };
      const appUser = await createUserRecord(userRecord);
      return { firebaseUser: user, appUser };
    }
    throw err;
  }
}

export async function signInWithGoogle() {
  // Login-only Google sign-in: do not auto-create an app user.
  if (!firebaseConfig.apiKey) {
    throw new Error('Firebase is not configured. Set VITE_FIREBASE_API_KEY and other env vars.');
  }

  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(getAuth(), provider);
  const user = result.user;

  // Attempt to fetch existing app user. If none exists, sign out and throw an error.
  try {
    const appUser = await getUserByFirebaseUid(user.uid);
    return { firebaseUser: user, appUser };
  } catch (err: any) {
    // If app user not found, immediately sign out the Firebase session and inform caller
    if (err?.response?.status === 404) {
      try { await firebaseSignOut(getAuth()); } catch (e) { /* ignore */ }
      throw new Error('No account found for this Google account. Please sign up first.');
    }
    // Other errors: sign out and rethrow
    try { await firebaseSignOut(getAuth()); } catch (e) { /* ignore */ }
    throw err;
  }
}

export async function signUpWithGoogle() {
  // Signup flow: sign in with Google and create app user if missing.
  if (!firebaseConfig.apiKey) {
    throw new Error('Firebase is not configured. Set VITE_FIREBASE_API_KEY and other env vars.');
  }

  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(getAuth(), provider);
  const user = result.user;

  // Try to fetch app user; if missing, create one.
  try {
    const appUser = await getUserByFirebaseUid(user.uid);
    return { firebaseUser: user, appUser };
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const userRecord = {
        name: user.displayName || '',
        email: user.email,
        firebaseUid: user.uid,
        role: 'student',
        createdAt: new Date().toISOString()
      };
      const appUser = await createUserRecord(userRecord);
      return { firebaseUser: user, appUser };
    }
    throw err;
  }
}

export async function signOut() {
  return firebaseSignOut(getAuth());
}

export function onAuthChange(callback: (user: any) => void) {
  return onAuthStateChanged(getAuth(), callback);
}
