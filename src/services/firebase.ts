import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  getDocFromServer,
  Unsubscribe 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  GameState, 
  PublicTrainer, 
  DuelChallenge, 
  User, 
  ActiveBattleSession, 
  BattlePlayerState, 
  BattleActionType, 
  RoundResolution 
} from '../types';
import { 
  collection, 
  query, 
  where, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Critical: initialize with firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connectivity on initial boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting.');
    }
    return false;
  }
}

export interface UsernameAvailabilityResult {
  available: boolean;
  error?: string;
}

// Check if a username is available (case-insensitive) across all accounts
export async function checkUsernameAvailable(
  username: string, 
  currentUserId?: string
): Promise<UsernameAvailabilityResult> {
  const clean = username.trim().toLowerCase();
  if (!clean || clean.length < 3 || clean.length > 20) {
    return { available: false, error: 'Username must be between 3 and 20 characters.' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
    return { available: false, error: 'Only letters, numbers, underscores, and hyphens are allowed.' };
  }
  try {
    const docSnap = await getDoc(doc(db, 'usernames', clean));
    if (!docSnap.exists()) {
      return { available: true };
    }
    const data = docSnap.data();
    if (currentUserId && data?.userId === currentUserId) {
      return { available: true };
    }
    return { available: false, error: `"${username.trim()}" is already claimed by another trainer account.` };
  } catch (error: any) {
    console.warn('Check username query fallback:', error);
    // If Firestore query encounters a temporary network glitch, check local cache
    try {
      const localClaimed = localStorage.getItem('liferpg_claimed_usernames_v1');
      if (localClaimed) {
        const parsed = JSON.parse(localClaimed);
        if (parsed[clean] && parsed[clean] !== currentUserId) {
          return { available: false, error: `"${username.trim()}" is already claimed by another trainer account.` };
        }
      }
    } catch {
      // Ignore local storage parse error
    }
    return { available: true };
  }
}

// Claim a unique username for this user
export async function claimUniqueUsername(
  userId: string, 
  username: string
): Promise<{ success: boolean; error?: string }> {
  const clean = username.trim();
  const cleanLower = clean.toLowerCase();

  if (!clean || clean.length < 3 || clean.length > 20) {
    return { success: false, error: 'Username must be between 3 and 20 characters.' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
    return { success: false, error: 'Username can only contain letters, numbers, hyphens, and underscores.' };
  }

  const currentUid = auth.currentUser?.uid || userId;
  try {
    try {
      const existing = await getDoc(doc(db, 'usernames', cleanLower));
      if (existing.exists()) {
        const data = existing.data();
        if (data.userId !== currentUid) {
          return { success: false, error: 'This username is already taken by another account.' };
        }
      }
    } catch (checkErr) {
      console.warn('Username check warning, proceeding to reserve:', checkErr);
    }

    // Reserve username document in Firestore
    try {
      await setDoc(doc(db, 'usernames', cleanLower), {
        userId: currentUid,
        username: clean,
        createdAt: new Date().toISOString(),
      });
    } catch (setErr) {
      console.warn('Firestore username reservation warning:', setErr);
    }

    // Update user game profile document
    try {
      await setDoc(doc(db, 'users', currentUid), {
        userId: currentUid,
        hasClaimedUsername: true,
        user: {
          username: clean,
        },
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (userErr) {
      console.warn('Firestore user update warning:', userErr);
    }

    // Update local cache
    try {
      localStorage.setItem(`liferpg_username_claimed_${currentUid}`, 'true');
      const localClaimed = localStorage.getItem('liferpg_claimed_usernames_v1');
      const parsed = localClaimed ? JSON.parse(localClaimed) : {};
      parsed[cleanLower] = currentUid;
      localStorage.setItem('liferpg_claimed_usernames_v1', JSON.stringify(parsed));
    } catch (storageErr) {
      console.warn('Local storage cache warning:', storageErr);
    }

    // Update Firebase Auth display name if available
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: clean }).catch(() => {});
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error claiming username:', error);
    return { success: false, error: error.message || 'Failed to claim username. Please try again.' };
  }
}

// Update trainer username and tagline (title) from Config screen
export async function updateTrainerProfile(
  userId: string,
  newUsername: string,
  newTitle: string,
  oldUsername?: string
): Promise<{ success: boolean; error?: string }> {
  const cleanUser = newUsername.trim();
  const cleanLower = cleanUser.toLowerCase();
  const cleanTitle = newTitle.trim() || 'Blank Slate & Pure Potential';

  if (!cleanUser || cleanUser.length < 3 || cleanUser.length > 20) {
    return { success: false, error: 'Username must be between 3 and 20 characters.' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanUser)) {
    return { success: false, error: 'Username can only contain letters, numbers, hyphens, and underscores.' };
  }

  const currentUid = auth.currentUser?.uid || userId;
  const oldLower = (oldUsername || '').trim().toLowerCase();

  try {
    // If username changed, reserve new username and release old
    if (cleanLower !== oldLower) {
      const existing = await getDoc(doc(db, 'usernames', cleanLower));
      if (existing.exists() && existing.data().userId !== currentUid) {
        return { success: false, error: 'This username is already taken by another trainer.' };
      }

      // Reserve new username
      await setDoc(doc(db, 'usernames', cleanLower), {
        userId: currentUid,
        username: cleanUser,
        createdAt: new Date().toISOString(),
      });

      // Release old username doc if valid
      if (oldLower && oldLower !== cleanLower && oldLower !== 'trainer') {
        try {
          await deleteDoc(doc(db, 'usernames', oldLower));
        } catch (delErr) {
          console.warn('Could not release previous username:', delErr);
        }
      }
    }

    // Update user private document
    await setDoc(doc(db, 'users', currentUid), {
      userId: currentUid,
      hasClaimedUsername: true,
      user: {
        username: cleanUser,
        title: cleanTitle,
      },
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Update publicTrainer entry for leaderboard and duels
    await setDoc(doc(db, 'publicTrainers', currentUid), {
      userId: currentUid,
      username: cleanUser,
      title: cleanTitle,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Update Firebase Auth display name
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: cleanUser });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating trainer profile:', error);
    return { success: false, error: error.message || 'Failed to update profile in Firestore.' };
  }
}

// Check if user already claimed a unique username
export async function checkUserHasClaimedUsername(userId: string): Promise<boolean> {
  // Check local cache first for instant response
  try {
    if (localStorage.getItem(`liferpg_username_claimed_${userId}`) === 'true') {
      return true;
    }
  } catch {
    // Ignore local storage error
  }

  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      const claimed = Boolean(data.hasClaimedUsername);
      if (claimed) {
        try {
          localStorage.setItem(`liferpg_username_claimed_${userId}`, 'true');
        } catch {}
      }
      return claimed;
    }
    return false;
  } catch (error) {
    console.warn('Check claimed username fallback:', error);
    try {
      return localStorage.getItem(`liferpg_username_claimed_${userId}`) === 'true';
    } catch {
      return false;
    }
  }
}

// Check if trainer is considered live and online (active in past 75 seconds)
export function isTrainerOnline(trainer?: PublicTrainer | null): boolean {
  if (!trainer) return false;
  if (!trainer.isOnline) return false;
  if (!trainer.lastActive) return false;
  const diff = Date.now() - new Date(trainer.lastActive).getTime();
  return diff >= -5000 && diff < 75000; // 75 seconds threshold
}

// Directly check if a trainer is currently online by querying Firestore document
export async function checkTrainerIsOnline(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const snap = await getDoc(doc(db, 'publicTrainers', userId));
    if (!snap.exists()) return false;
    const data = snap.data() as PublicTrainer;
    return isTrainerOnline(data);
  } catch (err) {
    console.warn('Check trainer online error:', err);
    return false;
  }
}

// Real-time listener for a specific trainer's online presence
export function subscribeToTrainerPresence(
  userId: string,
  onUpdate: (isOnline: boolean) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'publicTrainers', userId),
    (snap) => {
      if (!snap.exists()) {
        onUpdate(false);
        return;
      }
      const data = snap.data() as PublicTrainer;
      onUpdate(isTrainerOnline(data));
    },
    (err) => {
      console.warn('Trainer presence subscription error:', err);
      onUpdate(false);
    }
  );
}

// Update presence for online status (uses setDoc with merge to ensure document existence)
export async function updateTrainerPresence(userId: string, isOnline: boolean): Promise<void> {
  const path = `publicTrainers/${userId}`;
  try {
    await setDoc(
      doc(db, 'publicTrainers', userId),
      {
        userId,
        isOnline,
        lastActive: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    // Fail silently on background heartbeat or unmount
  }
}

// Publish public trainer profile to /publicTrainers for arena and leaderboard
export async function syncPublicTrainerProfile(
  userId: string,
  user: User,
  completedQuestsCount: number,
  defeatedRivalsCount: number,
  equipmentName?: string
): Promise<void> {
  const path = `publicTrainers/${userId}`;
  try {
    const payload: PublicTrainer = {
      userId,
      username: user.username,
      level: user.level,
      title: user.title,
      avatarId: user.avatarId,
      specialization: user.specialization,
      hp: user.hp,
      maxHp: user.maxHp,
      stamina: user.stamina,
      maxStamina: user.maxStamina,
      streak: user.streak,
      xp: user.xp,
      attributes: user.attributes,
      equipmentName: equipmentName || 'Adventurer Equipment',
      questsCleared: completedQuestsCount,
      defeatedRivalsCount,
      isOnline: true,
      lastActive: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'publicTrainers', userId), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Subscribe to all real-world players in /publicTrainers
export function subscribeToPublicTrainers(
  onUpdate: (trainers: PublicTrainer[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'publicTrainers';
  return onSnapshot(
    collection(db, 'publicTrainers'),
    (snap) => {
      const trainers: PublicTrainer[] = [];
      snap.forEach((docSnap) => {
        trainers.push(docSnap.data() as PublicTrainer);
      });
      onUpdate(trainers);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Send a duel challenge to a real player (ONLY when both are online)
export async function sendDuelChallenge(
  targetTrainer: PublicTrainer,
  challenger: User
): Promise<string> {
  // 1. Verify target trainer is currently online in Firestore
  const isTargetOnline = await checkTrainerIsOnline(targetTrainer.userId);
  if (!isTargetOnline) {
    throw new Error(`Trainer ${targetTrainer.username} is currently offline. Both trainers must be online to challenge and play.`);
  }

  // 2. Ensure challenger presence is marked online
  const isChallengerOnline = await checkTrainerIsOnline(challenger.id);
  if (!isChallengerOnline) {
    await updateTrainerPresence(challenger.id, true);
  }

  const challengeId = `chal-${Date.now()}-${challenger.id.slice(0, 5)}`;
  const path = `challenges/${challengeId}`;
  try {
    const payload: DuelChallenge = {
      id: challengeId,
      challengerId: challenger.id,
      challengerName: challenger.username,
      challengerAvatarId: challenger.avatarId,
      challengerLevel: challenger.level,
      challengerTitle: challenger.title,
      challengerStats: {
        hp: challenger.hp,
        maxHp: challenger.maxHp,
        stamina: challenger.stamina,
        maxStamina: challenger.maxStamina,
        attributes: challenger.attributes,
      },
      targetUserId: targetTrainer.userId,
      targetName: targetTrainer.username,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'challenges', challengeId), payload);
    return challengeId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Listen for incoming challenges for the logged-in user
export function subscribeToIncomingChallenges(
  userId: string,
  onUpdate: (challenges: DuelChallenge[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'challenges';
  const q = query(
    collection(db, 'challenges'),
    where('targetUserId', '==', userId),
    where('status', '==', 'PENDING')
  );

  return onSnapshot(
    q,
    (snap) => {
      const challenges: DuelChallenge[] = [];
      snap.forEach((d) => {
        challenges.push(d.data() as DuelChallenge);
      });
      onUpdate(challenges);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Listen for outgoing challenges sent by the logged-in user (to detect acceptance & navigate into live battle)
export function subscribeToOutgoingChallenges(
  challengerId: string,
  onUpdate: (challenges: DuelChallenge[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'challenges';
  const q = query(
    collection(db, 'challenges'),
    where('challengerId', '==', challengerId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const challenges: DuelChallenge[] = [];
      snap.forEach((d) => {
        challenges.push(d.data() as DuelChallenge);
      });
      onUpdate(challenges);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Accept challenge and create a real-time simultaneous battle session (ONLY when both are online)
export async function acceptDuelChallengeAndStartBattle(
  challenge: DuelChallenge,
  currentUser: User
): Promise<string> {
  // 1. Verify challenger is still online in Firestore
  const isChallengerOnline = await checkTrainerIsOnline(challenge.challengerId);
  if (!isChallengerOnline) {
    throw new Error(`Trainer ${challenge.challengerName} has gone offline. Both trainers must be online to play.`);
  }

  // 2. Ensure current user presence is marked online
  const isCurrentUserOnline = await checkTrainerIsOnline(currentUser.id);
  if (!isCurrentUserOnline) {
    await updateTrainerPresence(currentUser.id, true);
  }

  const battleId = `battle-${Date.now()}-${challenge.challengerId.slice(0, 4)}-${currentUser.id.slice(0, 4)}`;
  const battlePath = `activeBattles/${battleId}`;

  try {
    const player1: BattlePlayerState = {
      id: challenge.challengerId,
      username: challenge.challengerName,
      level: challenge.challengerLevel,
      avatarId: challenge.challengerAvatarId,
      title: challenge.challengerTitle,
      hp: challenge.challengerStats.hp,
      maxHp: challenge.challengerStats.maxHp,
      stamina: challenge.challengerStats.stamina,
      maxStamina: challenge.challengerStats.maxStamina,
      attributes: challenge.challengerStats.attributes,
      ready: true,
      selectedAction: null,
      isDefending: false,
    };

    const player2: BattlePlayerState = {
      id: currentUser.id,
      username: currentUser.username,
      level: currentUser.level,
      avatarId: currentUser.avatarId,
      title: currentUser.title,
      hp: currentUser.hp,
      maxHp: currentUser.maxHp,
      stamina: currentUser.stamina,
      maxStamina: currentUser.maxStamina,
      attributes: currentUser.attributes,
      ready: true,
      selectedAction: null,
      isDefending: false,
    };

    const battleSession: ActiveBattleSession = {
      id: battleId,
      challengeId: challenge.id,
      player1,
      player2,
      round: 1,
      status: 'IN_PROGRESS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Create active battle
    await setDoc(doc(db, 'activeBattles', battleId), battleSession);

    // 2. Mark challenge as accepted with battleId
    await updateDoc(doc(db, 'challenges', challenge.id), {
      status: 'ACCEPTED',
      battleId,
      updatedAt: new Date().toISOString(),
    });

    return battleId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, battlePath);
  }
}

// Respond to an incoming challenge (accept or decline)
export async function respondToDuelChallenge(challengeId: string, accept: boolean): Promise<void> {
  const path = `challenges/${challengeId}`;
  try {
    await updateDoc(doc(db, 'challenges', challengeId), {
      status: accept ? 'ACCEPTED' : 'DECLINED',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete / dismiss challenge
export async function deleteDuelChallenge(challengeId: string): Promise<void> {
  const path = `challenges/${challengeId}`;
  try {
    await deleteDoc(doc(db, 'challenges', challengeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Subscribe to a real-time active simultaneous battle session
export function subscribeToActiveBattle(
  battleId: string,
  onUpdate: (battle: ActiveBattleSession | null) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = `activeBattles/${battleId}`;
  return onSnapshot(
    doc(db, 'activeBattles', battleId),
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as ActiveBattleSession);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Submit player's combat move for current round in simultaneous battle
export async function submitBattleAction(
  battleId: string,
  userId: string,
  action: BattleActionType,
  round: number
): Promise<void> {
  const path = `activeBattles/${battleId}`;
  try {
    const battleDocRef = doc(db, 'activeBattles', battleId);
    const snap = await getDoc(battleDocRef);
    if (!snap.exists()) return;

    const battle = snap.data() as ActiveBattleSession;
    const isPlayer1 = battle.player1.id === userId;
    const isPlayer2 = battle.player2.id === userId;

    if (!isPlayer1 && !isPlayer2) return;

    const actionSubmission = {
      action,
      round,
      timestamp: Date.now(),
    };

    if (isPlayer1) {
      await updateDoc(battleDocRef, {
        'player1.selectedAction': actionSubmission,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await updateDoc(battleDocRef, {
        'player2.selectedAction': actionSubmission,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Deterministically resolve simultaneous round when both moves are submitted
export async function resolveSimultaneousRound(
  battleId: string,
  battle: ActiveBattleSession
): Promise<void> {
  const path = `activeBattles/${battleId}`;
  try {
    const p1 = battle.player1;
    const p2 = battle.player2;

    if (!p1.selectedAction || !p2.selectedAction) return;
    if (p1.selectedAction.round !== battle.round || p2.selectedAction.round !== battle.round) return;

    const act1 = p1.selectedAction.action;
    const act2 = p2.selectedAction.action;

    // Damage calculations
    // P1 -> P2
    let p1Dmg = 0;
    let p1Crit = false;
    let p1StaminaSpent = 0;
    let p1Heal = 0;

    if (act1 === 'STRIKE') {
      const baseDmg = Math.max(12, Math.floor((p1.attributes.str * 1.6) + (p1.level * 3)));
      const mitigation = Math.floor((p2.attributes.res * 0.4));
      const defFactor = act2 === 'DEFEND' ? 0.35 : 1.0;
      p1Crit = Math.random() < Math.min(0.35, 0.05 + (p1.attributes.dis * 0.02));
      const critMultiplier = p1Crit ? 1.5 : 1.0;
      p1Dmg = Math.max(5, Math.floor((baseDmg - mitigation) * defFactor * critMultiplier));
      p1StaminaSpent = 12;
    } else if (act1 === 'FOCUS_SURGE') {
      const baseDmg = Math.max(16, Math.floor((p1.attributes.str * 2.0) + (p1.attributes.int * 0.8) + (p1.level * 4)));
      const mitigation = Math.floor((p2.attributes.res * 0.3));
      const defFactor = act2 === 'DEFEND' ? 0.45 : 1.0;
      p1Crit = true;
      p1Dmg = Math.max(10, Math.floor((baseDmg - mitigation) * defFactor * 1.4));
      p1StaminaSpent = 24;
    } else if (act1 === 'HEAL_POTION') {
      p1Heal = Math.min(40, p1.maxHp - p1.hp);
      p1StaminaSpent = 8;
    } else if (act1 === 'DEFEND') {
      p1StaminaSpent = -15; // recovers 15 stamina
    }

    // P2 -> P1
    let p2Dmg = 0;
    let p2Crit = false;
    let p2StaminaSpent = 0;
    let p2Heal = 0;

    if (act2 === 'STRIKE') {
      const baseDmg = Math.max(12, Math.floor((p2.attributes.str * 1.6) + (p2.level * 3)));
      const mitigation = Math.floor((p1.attributes.res * 0.4));
      const defFactor = act1 === 'DEFEND' ? 0.35 : 1.0;
      p2Crit = Math.random() < Math.min(0.35, 0.05 + (p2.attributes.dis * 0.02));
      const critMultiplier = p2Crit ? 1.5 : 1.0;
      p2Dmg = Math.max(5, Math.floor((baseDmg - mitigation) * defFactor * critMultiplier));
      p2StaminaSpent = 12;
    } else if (act2 === 'FOCUS_SURGE') {
      const baseDmg = Math.max(16, Math.floor((p2.attributes.str * 2.0) + (p2.attributes.int * 0.8) + (p2.level * 4)));
      const mitigation = Math.floor((p1.attributes.res * 0.3));
      const defFactor = act1 === 'DEFEND' ? 0.45 : 1.0;
      p2Crit = true;
      p2Dmg = Math.max(10, Math.floor((baseDmg - mitigation) * defFactor * 1.4));
      p2StaminaSpent = 24;
    } else if (act2 === 'HEAL_POTION') {
      p2Heal = Math.min(40, p2.maxHp - p2.hp);
      p2StaminaSpent = 8;
    } else if (act2 === 'DEFEND') {
      p2StaminaSpent = -15;
    }

    // Calculate new HPs
    const newP1Hp = Math.max(0, Math.min(p1.maxHp, p1.hp - p2Dmg + p1Heal));
    const newP2Hp = Math.max(0, Math.min(p2.maxHp, p2.hp - p1Dmg + p2Heal));

    // Calculate new Stamina
    const newP1Stamina = Math.max(0, Math.min(p1.maxStamina, p1.stamina - p1StaminaSpent));
    const newP2Stamina = Math.max(0, Math.min(p2.maxStamina, p2.stamina - p2StaminaSpent));

    // Summary line
    const summary = `Round ${battle.round}: ${p1.username} chose ${act1} (dealt ${p1Dmg} dmg) — ${p2.username} chose ${act2} (dealt ${p2Dmg} dmg)!`;

    const resolution: RoundResolution = {
      round: battle.round,
      player1Action: act1,
      player2Action: act2,
      player1DamageDealt: p1Dmg,
      player2DamageDealt: p2Dmg,
      player1Crit: p1Crit,
      player2Crit: p2Crit,
      player1StaminaSpent: p1StaminaSpent,
      player2StaminaSpent: p2StaminaSpent,
      player1Heal: p1Heal,
      player2Heal: p2Heal,
      summary,
      timestamp: Date.now(),
    };

    const isFinished = newP1Hp <= 0 || newP2Hp <= 0;
    let winnerId: string | null = null;
    let loserId: string | null = null;

    if (isFinished) {
      if (newP1Hp <= 0 && newP2Hp <= 0) {
        winnerId = newP1Hp > newP2Hp ? p1.id : p2.id;
        loserId = winnerId === p1.id ? p2.id : p1.id;
      } else if (newP1Hp <= 0) {
        winnerId = p2.id;
        loserId = p1.id;
      } else {
        winnerId = p1.id;
        loserId = p2.id;
      }
    }

    await updateDoc(doc(db, 'activeBattles', battleId), {
      'player1.hp': newP1Hp,
      'player1.stamina': newP1Stamina,
      'player1.selectedAction': null,
      'player1.isDefending': act1 === 'DEFEND',
      'player2.hp': newP2Hp,
      'player2.stamina': newP2Stamina,
      'player2.selectedAction': null,
      'player2.isDefending': act2 === 'DEFEND',
      round: isFinished ? battle.round : battle.round + 1,
      lastResolution: resolution,
      status: isFinished ? 'RESOLVED' : 'IN_PROGRESS',
      winnerId: winnerId || null,
      loserId: loserId || null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Forfeit active battle
export async function forfeitActiveBattle(battleId: string, userId: string): Promise<void> {
  const path = `activeBattles/${battleId}`;
  try {
    const snap = await getDoc(doc(db, 'activeBattles', battleId));
    if (!snap.exists()) return;
    const battle = snap.data() as ActiveBattleSession;
    const winnerId = battle.player1.id === userId ? battle.player2.id : battle.player1.id;

    await updateDoc(doc(db, 'activeBattles', battleId), {
      status: 'FORFEIT',
      forfeitById: userId,
      winnerId,
      loserId: userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Award default victory when an opponent disconnects or goes offline during an active live battle
export async function handleBattleOpponentDisconnect(
  battleId: string,
  disconnectedUserId: string
): Promise<void> {
  const path = `activeBattles/${battleId}`;
  try {
    const snap = await getDoc(doc(db, 'activeBattles', battleId));
    if (!snap.exists()) return;
    const battle = snap.data() as ActiveBattleSession;
    if (battle.status !== 'IN_PROGRESS') return;

    const winnerId = battle.player1.id === disconnectedUserId ? battle.player2.id : battle.player1.id;
    const summary = `Battle concluded by opponent disconnection: Rival went offline. Both trainers must be online to play.`;

    await updateDoc(doc(db, 'activeBattles', battleId), {
      status: 'RESOLVED',
      winnerId,
      loserId: disconnectedUserId,
      forfeitById: disconnectedUserId,
      lastResolution: {
        round: battle.round,
        player1Action: 'DEFEND',
        player2Action: 'DEFEND',
        player1DamageDealt: 0,
        player2DamageDealt: 0,
        player1Crit: false,
        player2Crit: false,
        player1StaminaSpent: 0,
        player2StaminaSpent: 0,
        player1Heal: 0,
        player2Heal: 0,
        summary,
        timestamp: Date.now(),
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}


// Cloud Persistence: Save User Game State
export async function saveUserStateToCloud(
  userId: string, 
  state: GameState, 
  email?: string | null
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const payload = {
      userId,
      email: email || auth.currentUser?.email || '',
      emailVerified: auth.currentUser?.emailVerified || false,
      user: state.user,
      inventory: state.inventory,
      quests: state.quests,
      badges: state.badges,
      rivals: state.rivals,
      battleHistory: state.battleHistory || [],
      settings: state.settings,
      hasCompletedOnboarding: state.hasCompletedOnboarding,
      hasClaimedUsername: true,
      defeatedRivalsCount: state.defeatedRivalsCount,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', userId), payload, { merge: true });

    // Automatically sync public trainer profile for real-world arena & leaderboard competition
    if (state.user && state.user.username && state.user.username !== 'Trainer') {
      const completedCount = (state.quests || []).filter((q) => q.status === 'COMPLETED').length;
      await syncPublicTrainerProfile(
        userId,
        state.user,
        completedCount,
        state.defeatedRivalsCount || 0
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Cloud Persistence: Load User Game State
export async function loadUserStateFromCloud(userId: string): Promise<GameState | null> {
  const path = `users/${userId}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        user: data.user,
        inventory: data.inventory || [],
        items: [], // hydrated by client catalog
        quests: data.quests || [],
        badges: data.badges || [],
        rivals: data.rivals || [],
        battleHistory: data.battleHistory || [],
        settings: data.settings || {
          soundEnabled: true,
          crtFilterEnabled: false,
          gameboyFilterEnabled: false,
          reducedMotion: false,
        },
        hasCompletedOnboarding: data.hasCompletedOnboarding ?? true,
        defeatedRivalsCount: data.defeatedRivalsCount || 0,
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Real-time synchronization subscription across devices
export function subscribeToUserState(
  userId: string,
  onUpdate: (state: GameState) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = `users/${userId}`;
  return onSnapshot(
    doc(db, 'users', userId),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          user: data.user,
          inventory: data.inventory || [],
          items: [],
          quests: data.quests || [],
          badges: data.badges || [],
          rivals: data.rivals || [],
          battleHistory: data.battleHistory || [],
          settings: data.settings || {
            soundEnabled: true,
            crtFilterEnabled: false,
            gameboyFilterEnabled: false,
            reducedMotion: false,
          },
          hasCompletedOnboarding: data.hasCompletedOnboarding ?? true,
          defeatedRivalsCount: data.defeatedRivalsCount || 0,
        });
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
