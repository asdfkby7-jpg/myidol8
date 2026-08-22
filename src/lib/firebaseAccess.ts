import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export const OWNER_EMAIL = 'asdfkby7@gmail.com';

/**
 * Check if a given email is authorized to access the app via Google Sign-In
 */
export async function isEmailAuthorized(email: string | null | undefined): Promise<boolean> {
  if (!email || !email.trim()) return false;
  // Any user logged in with a valid Google email account is authorized
  return true;
}

