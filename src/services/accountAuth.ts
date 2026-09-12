import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface DirectAuthUser {
  uid: string;
  email: string;
  displayName: string | null;
  emailVerified: boolean;
  providerId: 'password' | 'google.com';
}

interface StoredAccount {
  uid: string;
  email: string;
  passwordHash: string;
  salt: string;
  displayName: string;
  createdAt: string;
}

export interface FoundTrainerInfo {
  source: 'trainerAccounts' | 'users' | 'local';
  uid: string;
  email: string;
  displayName: string;
  passwordHash?: string;
  salt?: string;
}

const STORAGE_SESSION_KEY = 'liferpg_direct_session_v1';
const STORAGE_ACCOUNTS_KEY = 'liferpg_direct_accounts_v1';

// Convert email to a URL/Firestore-safe document ID
export function emailToAccountId(email: string): string {
  const clean = email.toLowerCase().trim();
  try {
    return 'acc_' + btoa(clean).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  } catch {
    return 'acc_' + clean.replace(/[^a-zA-Z0-9_-]/g, '_');
  }
}

// Generate cryptographically secure random salt
function generateSalt(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);
    return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Hash password with salt using Web Crypto SHA-256
async function hashPassword(password: string, salt: string): Promise<string> {
  const message = `salt:${salt}:pass:${password}:liferpg_v1`;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const enc = new TextEncoder();
    const data = enc.encode(message);
    const hashBuf = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback string hashing if Web Crypto is unavailable
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const chr = message.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return 'fb_' + Math.abs(hash).toString(16);
}

function getLocalAccounts(): Record<string, StoredAccount> {
  try {
    const data = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveLocalAccount(account: StoredAccount): void {
  try {
    const accounts = getLocalAccounts();
    accounts[account.email.toLowerCase().trim()] = account;
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.warn('Failed to save account locally:', err);
  }
}

export function getDirectActiveSession(): DirectAuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.uid && parsed.email) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setDirectActiveSession(user: DirectAuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    }
  } catch (err) {
    console.warn('Failed to write direct session:', err);
  }
}

// Resilient account finder: checks trainerAccounts, local storage, AND users collection
export async function findExistingAccountOrUser(email: string): Promise<FoundTrainerInfo | null> {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) return null;

  const accountId = emailToAccountId(cleanEmail);

  // 1. Check trainerAccounts by document ID
  try {
    const snap = await getDoc(doc(db, 'trainerAccounts', accountId));
    if (snap.exists()) {
      const data = snap.data() as StoredAccount;
      return {
        source: 'trainerAccounts',
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        passwordHash: data.passwordHash,
        salt: data.salt,
      };
    }
  } catch (err) {
    console.warn('trainerAccounts getDoc check warning:', err);
  }

  // 2. Query trainerAccounts by email field
  try {
    const qAcc = query(collection(db, 'trainerAccounts'), where('email', '==', cleanEmail));
    const snapAcc = await getDocs(qAcc);
    if (!snapAcc.empty) {
      const data = snapAcc.docs[0].data() as StoredAccount;
      return {
        source: 'trainerAccounts',
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        passwordHash: data.passwordHash,
        salt: data.salt,
      };
    }
  } catch (err) {
    console.warn('trainerAccounts query check warning:', err);
  }

  // 3. Query users collection by email field (for accounts registered previously or via Google)
  try {
    const qUser = query(collection(db, 'users'), where('email', '==', cleanEmail));
    const snapUser = await getDocs(qUser);
    if (!snapUser.empty) {
      const docSnap = snapUser.docs[0];
      const data = docSnap.data();
      const uid = data.userId || docSnap.id;
      const displayName = data.user?.username || data.displayName || cleanEmail.split('@')[0];
      return {
        source: 'users',
        uid,
        email: cleanEmail,
        displayName,
      };
    }
  } catch (err) {
    console.warn('users query check warning:', err);
  }

  // 4. Fallback check local accounts
  const local = getLocalAccounts();
  if (local[cleanEmail]) {
    const data = local[cleanEmail];
    return {
      source: 'local',
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      passwordHash: data.passwordHash,
      salt: data.salt,
    };
  }

  return null;
}

export async function directSignUp(
  email: string,
  pass: string,
  displayName: string = ''
): Promise<DirectAuthUser> {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please provide a valid email address.');
  }
  if (!pass || pass.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const existing = await findExistingAccountOrUser(cleanEmail);
  const accountId = emailToAccountId(cleanEmail);

  // If user already exists in trainerAccounts or users collection
  if (existing) {
    // If password hash already exists, check if provided password matches
    if (existing.passwordHash && existing.salt) {
      const computedHash = await hashPassword(pass, existing.salt);
      if (computedHash === existing.passwordHash) {
        const authUser: DirectAuthUser = {
          uid: existing.uid,
          email: cleanEmail,
          displayName: existing.displayName,
          emailVerified: true,
          providerId: 'password',
        };
        setDirectActiveSession(authUser);
        return authUser;
      }
    }

    // Set/update credentials for the existing trainer account (preserves existing UID & game data!)
    const salt = generateSalt();
    const passwordHash = await hashPassword(pass, salt);
    const updatedAccount: StoredAccount = {
      uid: existing.uid,
      email: cleanEmail,
      passwordHash,
      salt,
      displayName: displayName.trim() || existing.displayName || cleanEmail.split('@')[0],
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'trainerAccounts', accountId), updatedAccount, { merge: true });
    } catch (err) {
      console.warn('Failed to update trainer account:', err);
    }
    saveLocalAccount(updatedAccount);

    const authUser: DirectAuthUser = {
      uid: existing.uid,
      email: cleanEmail,
      displayName: updatedAccount.displayName,
      emailVerified: true,
      providerId: 'password',
    };
    setDirectActiveSession(authUser);
    return authUser;
  }

  // Completely new user: generate UID and store credentials
  const salt = generateSalt();
  const passwordHash = await hashPassword(pass, salt);
  const uid = 'tr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  const newAccount: StoredAccount = {
    uid,
    email: cleanEmail,
    passwordHash,
    salt,
    displayName: displayName.trim() || cleanEmail.split('@')[0],
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'trainerAccounts', accountId), newAccount, { merge: true });
  } catch (err) {
    console.warn('Failed to save trainer account to Firestore, keeping local:', err);
  }

  saveLocalAccount(newAccount);

  const authUser: DirectAuthUser = {
    uid: newAccount.uid,
    email: newAccount.email,
    displayName: newAccount.displayName,
    emailVerified: true,
    providerId: 'password',
  };

  setDirectActiveSession(authUser);
  return authUser;
}

export async function directSignIn(
  email: string,
  pass: string
): Promise<DirectAuthUser> {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please provide a valid email address.');
  }
  if (!pass) {
    throw new Error('Please enter your password.');
  }

  // 1. Check existing accounts in trainerAccounts, users collection, and local storage
  const existing = await findExistingAccountOrUser(cleanEmail);

  if (existing) {
    // Case A: Has password hash stored
    if (existing.passwordHash && existing.salt) {
      const computedHash = await hashPassword(pass, existing.salt);
      if (computedHash !== existing.passwordHash) {
        throw new Error('Incorrect password. Click "Reset Password" if you forgot it.');
      }

      const authUser: DirectAuthUser = {
        uid: existing.uid,
        email: cleanEmail,
        displayName: existing.displayName || cleanEmail.split('@')[0],
        emailVerified: true,
        providerId: 'password',
      };
      setDirectActiveSession(authUser);
      return authUser;
    }

    // Case B: Registered in users collection from earlier Google auth or cloud session without password
    // Initialize their password credentials right now and log them in seamlessly!
    const salt = generateSalt();
    const passwordHash = await hashPassword(pass, salt);
    const newAccount: StoredAccount = {
      uid: existing.uid,
      email: cleanEmail,
      passwordHash,
      salt,
      displayName: existing.displayName || cleanEmail.split('@')[0],
      createdAt: new Date().toISOString(),
    };

    const accountId = emailToAccountId(cleanEmail);
    try {
      await setDoc(doc(db, 'trainerAccounts', accountId), newAccount, { merge: true });
    } catch (err) {
      console.warn('Failed to store account credentials in Firestore:', err);
    }
    saveLocalAccount(newAccount);

    const authUser: DirectAuthUser = {
      uid: existing.uid,
      email: cleanEmail,
      displayName: existing.displayName || cleanEmail.split('@')[0],
      emailVerified: true,
      providerId: 'password',
    };
    setDirectActiveSession(authUser);
    return authUser;
  }

  // Case C: If no account was found, create it seamlessly so the trainer is never blocked!
  return await directSignUp(cleanEmail, pass, cleanEmail.split('@')[0]);
}

// Reset / Update Password seamlessly for any trainer
export async function directResetPassword(
  email: string,
  newPass: string
): Promise<DirectAuthUser> {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please provide a valid email address.');
  }
  if (!newPass || newPass.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  const existing = await findExistingAccountOrUser(cleanEmail);
  const uid = existing?.uid || ('tr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9));
  const displayName = existing?.displayName || cleanEmail.split('@')[0];

  const salt = generateSalt();
  const passwordHash = await hashPassword(newPass, salt);
  const accountId = emailToAccountId(cleanEmail);

  const account: StoredAccount = {
    uid,
    email: cleanEmail,
    passwordHash,
    salt,
    displayName,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'trainerAccounts', accountId), account, { merge: true });
  } catch (err) {
    console.warn('Failed to reset password in Firestore:', err);
  }
  saveLocalAccount(account);

  const authUser: DirectAuthUser = {
    uid,
    email: cleanEmail,
    displayName,
    emailVerified: true,
    providerId: 'password',
  };
  setDirectActiveSession(authUser);
  return authUser;
}

export function directSignOut(): void {
  setDirectActiveSession(null);
}

