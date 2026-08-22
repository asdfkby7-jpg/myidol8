import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { GameState } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as Record<string, any>).firestoreDatabaseId || '(default)');

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export async function ensureAuthUser(): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err: any) {
    if (err?.code === 'auth/admin-restricted-operation' || err?.message?.includes('admin-restricted-operation')) {
      console.warn('Firebase Anonymous Auth is disabled/restricted. User can sign in via Google or use local storage.');
    } else {
      console.warn('Anonymous auth failed:', err?.message || err);
    }
    return null;
  }
}

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    return res.user;
  } catch (error) {
    console.error('Google Auth Error:', error);
    throw error;
  }
}

export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout Error:', error);
  }
}

// Save Game State to Firestore
export async function saveGameStateToCloud(userId: string, state: GameState): Promise<boolean> {
  if (!userId) return false;
  try {
    const userDocRef = doc(db, 'users', userId, 'gameData', 'state');
    await setDoc(userDocRef, {
      ...state,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Firestore save failed:', error);
    return false;
  }
}

// Load Game State from Firestore
export async function loadGameStateFromCloud(userId: string): Promise<GameState | null> {
  if (!userId) return null;
  try {
    const userDocRef = doc(db, 'users', userId, 'gameData', 'state');
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      // Remove metadata fields before returning
      const { updatedAt, ...cleanState } = data;
      return cleanState as GameState;
    }
    return null;
  } catch (error) {
    console.error('Firestore load failed:', error);
    return null;
  }
}

// Listen to Firestore updates
export function subscribeGameStateFromCloud(userId: string, onUpdate: (state: GameState) => void) {
  if (!userId) return () => {};
  const userDocRef = doc(db, 'users', userId, 'gameData', 'state');
  return onSnapshot(userDocRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      const { updatedAt, ...cleanState } = data;
      onUpdate(cleanState as GameState);
    }
  }, (err) => {
    console.error('Firestore snapshot listener error:', err);
  });
}
