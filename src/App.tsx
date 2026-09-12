import React, { useState, useEffect, useRef } from 'react';
import {
  GameState,
  AttributeType,
  Quest,
  Rival,
  GameSettings,
  BattleRecord,
  User,
  InventoryItem,
  Specialization,
} from './types';
import {
  loadGameState,
  saveGameState,
  resetGameState,
  initializeNewGame,
  deriveMaxVitals,
  createInitialState,
} from './services/storage';
import { INITIAL_ITEMS, ARCHETYPES, INITIAL_BADGES } from './data/initialData';
import {
  resolveQuestCompletion,
  checkAndUnlockBadges,
  applyXpGain,
  LevelUpEvent,
} from './services/gameEngine';
import { chiptune } from './services/audio';
import {
  saveUserStateToCloud,
  loadUserStateFromCloud,
  subscribeToUserState,
  checkUserHasClaimedUsername,
  syncPublicTrainerProfile,
  updateTrainerProfile,
  updateTrainerPresence,
  subscribeToIncomingChallenges,
} from './services/firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { AuthHomePage } from './components/auth/AuthHomePage';
import { ClaimUsernameModal } from './components/auth/ClaimUsernameModal';

import { TopBar } from './components/navigation/TopBar';
import { CommandNav, NavScreen } from './components/navigation/CommandNav';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { LevelUpModal } from './components/rpg/LevelUpModal';
import { RewardModal, RewardPayload } from './components/rpg/RewardModal';

import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { QuestBoardScreen } from './components/quests/QuestBoardScreen';
import { CharacterScreen } from './components/character/CharacterScreen';
import { ArenaScreen } from './components/arena/ArenaScreen';
import { AchievementsScreen } from './components/achievements/AchievementsScreen';
import { LeaderboardScreen } from './components/leaderboard/LeaderboardScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';

function LifeRpgApp() {
  const { firebaseUser, isVerified, loading: authLoading, signOutUser } = useAuth();
  const [gameState, setGameState] = useState<GameState>(() => loadGameState());
  const [currentScreen, setCurrentScreen] = useState<NavScreen>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Unique username verification & claim status across all accounts
  const [hasClaimedUsername, setHasClaimedUsername] = useState<boolean | null>(null);
  const [checkingUsernameStatus, setCheckingUsernameStatus] = useState<boolean>(true);

  // Incoming duel challenges for live arena notifications
  const [incomingDuelChallenges, setIncomingDuelChallenges] = useState<any[]>([]);

  // Modals
  const [levelUpEvent, setLevelUpEvent] = useState<LevelUpEvent | null>(null);
  const [activeReward, setActiveReward] = useState<RewardPayload | null>(null);

  // Avoid circular saves during remote cloud sync updates
  const isSyncingFromCloud = useRef(false);

  // Switch in-memory state cleanly when auth session changes to guarantee strict user data isolation
  useEffect(() => {
    isSyncingFromCloud.current = true;
    if (firebaseUser) {
      setGameState(loadGameState(firebaseUser.uid));
    } else {
      setGameState(createInitialState('Trainer', 'user_guest'));
    }
    const timer = setTimeout(() => {
      isSyncingFromCloud.current = false;
    }, 250);
    return () => clearTimeout(timer);
  }, [firebaseUser?.uid]);

  // Verify whether the logged in user has claimed their unique username
  useEffect(() => {
    if (!firebaseUser) {
      setHasClaimedUsername(null);
      setCheckingUsernameStatus(false);
      return;
    }

    let isMounted = true;
    setCheckingUsernameStatus(true);

    checkUserHasClaimedUsername(firebaseUser.uid)
      .then((claimed) => {
        if (!isMounted) return;
        setHasClaimedUsername(claimed);
        setCheckingUsernameStatus(false);
      })
      .catch((err) => {
        console.warn('Check claimed username status error:', err);
        if (!isMounted) return;
        setHasClaimedUsername(false);
        setCheckingUsernameStatus(false);
      });

    return () => {
      isMounted = false;
    };
  }, [firebaseUser?.uid]);

  // CLOUD SYNC: Load & Subscribe to cloud state when user is authenticated & claimed unique username
  useEffect(() => {
    if (!firebaseUser || !hasClaimedUsername) {
      return;
    }

    let isMounted = true;
    const uid = firebaseUser.uid;

    // Load initial cloud state
    loadUserStateFromCloud(uid)
      .then((cloudState) => {
        if (!isMounted) return;

        if (cloudState && cloudState.user) {
          isSyncingFromCloud.current = true;
          const base = createInitialState('Trainer', uid);
          const user = { ...base.user, ...cloudState.user, id: uid };

          const { maxHp, maxStamina } = deriveMaxVitals(
            user.attributes?.end || 0,
            user.attributes?.dis || 0,
            user.level || 1,
            user.attributes?.wil || 0,
            user.attributes?.res || 0
          );
          user.maxHp = maxHp;
          user.maxStamina = maxStamina;

          const hydrated: GameState = {
            ...base,
            ...cloudState,
            user,
            quests: cloudState.quests || [],
            items: INITIAL_ITEMS,
            battleHistory: cloudState.battleHistory || [],
            hasClaimedUsername: true,
          };

          setGameState(hydrated);
          saveGameState(hydrated, uid);

          // Sync public trainer profile for real-world arena & leaderboard
          const completedCount = (hydrated.quests || []).filter((q) => q.status === 'COMPLETED').length;
          syncPublicTrainerProfile(
            uid,
            user,
            completedCount,
            hydrated.defeatedRivalsCount || 0
          ).catch((e) => console.warn('Public trainer sync:', e));

          setTimeout(() => {
            isSyncingFromCloud.current = false;
          }, 300);
        }
      })
      .catch((err) => {
        console.error('Error fetching initial cloud state:', err);
      });

    // Real-time synchronization across all devices
    const unsubscribe = subscribeToUserState(
      uid,
      (remoteState) => {
        if (!isMounted || !remoteState || !remoteState.user) return;
        isSyncingFromCloud.current = true;

        const base = createInitialState('Trainer', uid);
        const user = { ...base.user, ...remoteState.user, id: uid };
        const { maxHp, maxStamina } = deriveMaxVitals(
          user.attributes?.end || 0,
          user.attributes?.dis || 0,
          user.level || 1,
          user.attributes?.wil || 0,
          user.attributes?.res || 0
        );
        user.maxHp = maxHp;
        user.maxStamina = maxStamina;

        const synced: GameState = {
          ...base,
          ...remoteState,
          user,
          quests: remoteState.quests || [],
          items: INITIAL_ITEMS,
          battleHistory: remoteState.battleHistory || [],
          hasClaimedUsername: true,
        };

        setGameState(synced);
        saveGameState(synced, uid);

        setTimeout(() => {
          isSyncingFromCloud.current = false;
        }, 300);
      },
      (err) => {
        console.warn('Realtime subscription notification:', err);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [firebaseUser?.uid, hasClaimedUsername]);

  // Continuous app-wide online presence tracking for authenticated trainers
  useEffect(() => {
    if (!firebaseUser?.uid || !hasClaimedUsername) return;
    const uid = firebaseUser.uid;

    // Immediately mark as online upon authentication
    updateTrainerPresence(uid, true);

    // Heartbeat every 30 seconds while the application is active
    const heartbeatInterval = setInterval(() => {
      updateTrainerPresence(uid, true);
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTrainerPresence(uid, true);
      } else {
        updateTrainerPresence(uid, false);
      }
    };

    const handleBeforeUnload = () => {
      updateTrainerPresence(uid, false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateTrainerPresence(uid, false);
    };
  }, [firebaseUser?.uid, hasClaimedUsername]);

  // App-wide listener for incoming challenges to alert user and badge the Arena tab
  useEffect(() => {
    if (!firebaseUser?.uid || !hasClaimedUsername) {
      setIncomingDuelChallenges([]);
      return;
    }

    const unsub = subscribeToIncomingChallenges(
      firebaseUser.uid,
      (challenges) => {
        setIncomingDuelChallenges(challenges);
        if (challenges.length > 0) {
          chiptune.playLevelUp();
        }
      },
      (err) => {
        console.warn('App challenges listener error:', err);
      }
    );

    return () => unsub();
  }, [firebaseUser?.uid, hasClaimedUsername]);

  // Persist local state and push to Firestore when authenticated & claimed username
  useEffect(() => {
    saveGameState(gameState, firebaseUser?.uid);

    if (
      firebaseUser &&
      hasClaimedUsername &&
      !isSyncingFromCloud.current &&
      gameState.user.id === firebaseUser.uid
    ) {
      saveUserStateToCloud(firebaseUser.uid, gameState, firebaseUser.email);
    }
  }, [gameState, firebaseUser?.uid, hasClaimedUsername]);

  // Audio setup according to settings
  useEffect(() => {
    chiptune.isEnabled = gameState.settings.soundEnabled;
  }, [gameState.settings.soundEnabled]);

  // Helper to trigger badge unlock checks
  const runBadgeChecks = (state: GameState) => {
    const { updatedBadges, newlyUnlocked } = checkAndUnlockBadges(state);
    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach((b) => {
        state = {
          ...state,
          user: {
            ...state.user,
            xp: state.user.xp + (b.xpReward || 60),
          },
        };
      });
      state = { ...state, badges: updatedBadges };
    }
    return { state, newlyUnlocked };
  };

  // Onboarding Complete handler
  const handleOnboardingComplete = (username: string) => {
    const freshState = initializeNewGame(username);
    setGameState(freshState);
    setCurrentScreen('dashboard');
  };

  // Complete a Quest
  const handleCompleteQuest = (questId: string) => {
    const { updatedUser, updatedQuest, levelUpEvent: lvlEvt } = resolveQuestCompletion(
      gameState.user,
      gameState.quests,
      questId
    );

    const updatedQuests = gameState.quests.map((q) => (q.id === questId ? updatedQuest : q));
    let nextState: GameState = {
      ...gameState,
      user: updatedUser,
      quests: updatedQuests,
    };

    const { state: evaluatedState, newlyUnlocked } = runBadgeChecks(nextState);
    nextState = evaluatedState;

    setGameState(nextState);

    setActiveReward({
      title: 'QUEST CLEARED!',
      subtitle: updatedQuest.title,
      xp: updatedQuest.xpReward,
      statGains: updatedQuest.attributeRewards,
      unlockedBadge: newlyUnlocked[0] || undefined,
    });

    if (lvlEvt) {
      setTimeout(() => {
        setLevelUpEvent(lvlEvt);
      }, 500);
    }
  };

  // Create a Custom Quest
  const handleCreateQuest = (newQuestData: Omit<Quest, 'id' | 'status' | 'completedAt'>) => {
    const newQuest: Quest = {
      ...newQuestData,
      id: `quest-custom-${Date.now()}`,
      status: 'ACTIVE',
    };

    setGameState((prev) => ({
      ...prev,
      quests: [newQuest, ...prev.quests],
    }));
  };

  // Delete / Abandon Quest
  const handleDeleteQuest = (questId: string) => {
    setGameState((prev) => ({
      ...prev,
      quests: prev.quests.filter((q) => q.id !== questId),
    }));
  };

  // Allocate Stat Point
  const handleAllocateStatPoint = (attr: AttributeType) => {
    if (gameState.user.statPoints <= 0) return;

    const currentVal = gameState.user.attributes[attr] || 0;
    const newAttributes = {
      ...gameState.user.attributes,
      [attr]: currentVal + 1,
    };

    const { maxHp, maxStamina } = deriveMaxVitals(
      newAttributes.end,
      newAttributes.dis,
      gameState.user.level,
      newAttributes.wil,
      newAttributes.res
    );

    const updatedUser = {
      ...gameState.user,
      statPoints: gameState.user.statPoints - 1,
      attributes: newAttributes,
      maxHp,
      maxStamina,
      hp: Math.min(gameState.user.hp + 2, maxHp),
      stamina: Math.min(gameState.user.stamina + 2, maxStamina),
    };

    let nextState: GameState = {
      ...gameState,
      user: updatedUser,
    };

    const { state: evaluatedState } = runBadgeChecks(nextState);
    setGameState(evaluatedState);
    chiptune.playLevelUp();
  };

  // Use Consumable Item
  const handleUseConsumable = (itemId: string): boolean => {
    const item = gameState.items.find((i) => i.id === itemId);
    const invItem = gameState.inventory.find((i) => i.itemId === itemId && i.quantity > 0);

    if (!item || !invItem) return false;

    let updatedUser = { ...gameState.user };

    if (item.statEffects) {
      if (item.statEffects.hp) {
        updatedUser.hp = Math.min(updatedUser.hp + item.statEffects.hp, updatedUser.maxHp);
      }
      if (item.statEffects.stamina) {
        updatedUser.stamina = Math.min(updatedUser.stamina + item.statEffects.stamina, updatedUser.maxStamina);
      }
    }

    const updatedInventory = gameState.inventory
      .map((i) => {
        if (i.itemId === itemId) {
          return { ...i, quantity: i.quantity - 1 };
        }
        return i;
      })
      .filter((i) => i.quantity > 0);

    setGameState((prev) => ({
      ...prev,
      user: updatedUser,
      inventory: updatedInventory,
    }));

    chiptune.playHeal();
    return true;
  };

  // Battle Victory
  const handleBattleVictory = (rival: Rival) => {
    const { updatedUser: xpUser, levelUpEvent: lvlEvt } = applyXpGain(
      gameState.user,
      rival.winRewardXp
    );

    let updatedUser = { ...xpUser };
    updatedUser.hp = updatedUser.maxHp;
    updatedUser.stamina = updatedUser.maxStamina;

    const newRecord: BattleRecord = {
      id: `battle-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      rivalId: rival.id,
      rivalName: rival.username,
      rivalAvatarId: rival.avatarId,
      rivalLevel: rival.level,
      rivalTitle: rival.title,
      result: 'VICTORY',
      date: new Date().toISOString(),
      xpEarned: rival.winRewardXp,
      details: `Victoriously out-disciplined ${rival.username} (LV. ${rival.level}) in duel combat.`,
    };

    const nextState: GameState = {
      ...gameState,
      user: updatedUser,
      defeatedRivalsCount: (gameState.defeatedRivalsCount || 0) + 1,
      battleHistory: [newRecord, ...(gameState.battleHistory || [])],
    };

    const { state: evaluatedState, newlyUnlocked } = runBadgeChecks(nextState);
    setGameState(evaluatedState);

    setActiveReward({
      title: 'ARENA VICTORY!',
      subtitle: `Defeated ${rival.username}!`,
      xp: rival.winRewardXp,
      unlockedBadge: newlyUnlocked[0] || undefined,
    });

    if (lvlEvt) {
      setTimeout(() => {
        setLevelUpEvent(lvlEvt);
      }, 600);
    }

    setCurrentScreen('arena');
  };

  // Battle Defeat
  const handleBattleDefeat = (rival?: Rival) => {
    const newRecord: BattleRecord | null = rival
      ? {
          id: `battle-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          rivalId: rival.id,
          rivalName: rival.username,
          rivalAvatarId: rival.avatarId,
          rivalLevel: rival.level,
          rivalTitle: rival.title,
          result: 'DEFEAT',
          date: new Date().toISOString(),
          xpEarned: 0,
          details: `Defeated by ${rival.username} (LV. ${rival.level}). Rebuild resilience through daily habits.`,
        }
      : null;

    setGameState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        hp: Math.floor(prev.user.maxHp * 0.5),
        stamina: Math.floor(prev.user.maxStamina * 0.5),
      },
      battleHistory: newRecord
        ? [newRecord, ...(prev.battleHistory || [])]
        : (prev.battleHistory || []),
    }));
    setCurrentScreen('arena');
  };

  // Battle Fled / Run
  const handleBattleRun = (rival?: Rival) => {
    if (!rival) return;
    const newRecord: BattleRecord = {
      id: `battle-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      rivalId: rival.id,
      rivalName: rival.username,
      rivalAvatarId: rival.avatarId,
      rivalLevel: rival.level,
      rivalTitle: rival.title,
      result: 'FLED',
      date: new Date().toISOString(),
      xpEarned: 0,
      details: `Tactically retreated from combat with ${rival.username}.`,
    };
    setGameState((prev) => ({
      ...prev,
      battleHistory: [newRecord, ...(prev.battleHistory || [])],
    }));
  };

  // Settings update
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setGameState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings,
      },
    }));
  };

  // Trainer profile (username & tagline) update
  const handleUpdateUserProfile = async (updates: { username: string; title: string }) => {
    const cleanUsername = updates.username.trim();
    const cleanTitle = updates.title.trim() || 'Blank Slate & Pure Potential';

    if (firebaseUser) {
      const res = await updateTrainerProfile(
        firebaseUser.uid,
        cleanUsername,
        cleanTitle,
        gameState.user.username
      );
      if (!res.success) {
        throw new Error(res.error || 'Failed to update profile.');
      }
    }

    setGameState((prev) => {
      const updatedUser: User = {
        ...prev.user,
        username: cleanUsername,
        title: cleanTitle,
        updatedAt: new Date().toISOString(),
      };
      const updatedState: GameState = {
        ...prev,
        user: updatedUser,
      };
      saveGameState(updatedState);
      return updatedState;
    });
  };

  // Reset Game
  const handleResetGame = () => {
    const fresh = resetGameState();
    setGameState(fresh);
    setCurrentScreen('dashboard');
  };

  // Export Save
  const handleExportSave = () => {
    return JSON.stringify(gameState, null, 2);
  };

  // Import Save
  const handleImportSave = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.user && parsed.quests && parsed.inventory) {
        setGameState(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Handle unique username claim & starter character creation
  const handleClaimSuccess = async (
    username: string, 
    avatarId: string
  ) => {
    if (!firebaseUser) return;

    const arch = ARCHETYPES.ADVENTURER;
    const initialAttrs = arch.initialAttributes;
    const { maxHp, maxStamina } = deriveMaxVitals(
      initialAttrs.end,
      initialAttrs.dis,
      1,
      initialAttrs.wil,
      initialAttrs.res
    );

    const cleanUser: User = {
      id: firebaseUser.uid,
      username: username,
      title: arch.role,
      level: 1,
      xp: 0,
      maxXp: 100,
      hp: maxHp,
      maxHp: maxHp,
      stamina: maxStamina,
      maxStamina: maxStamina,
      specialization: arch.id,
      avatarId: avatarId,
      streak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      statPoints: 0,
      attributes: initialAttrs,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const starterWeapon = INITIAL_ITEMS.find((it) => it.id === arch.starterWeaponId) || INITIAL_ITEMS[0];
    const starterPotion = INITIAL_ITEMS.find((it) => it.id === 'item-potion-minor') || INITIAL_ITEMS[2];

    const inventory: InventoryItem[] = [
      {
        id: `inv-${Date.now()}-1`,
        itemId: starterWeapon.id,
        quantity: 1,
      },
      {
        id: `inv-${Date.now()}-2`,
        itemId: starterPotion.id,
        quantity: 2,
      },
    ];

    const cleanState: GameState = {
      user: cleanUser,
      inventory,
      items: INITIAL_ITEMS,
      quests: [], // No sample quests! Purely user-created real habits
      badges: INITIAL_BADGES,
      rivals: [], // No sample rivals! Purely real-world players in the arena
      settings: {
        soundEnabled: true,
        crtFilterEnabled: false,
        gameboyFilterEnabled: false,
        reducedMotion: false,
      },
      hasCompletedOnboarding: true,
      hasClaimedUsername: true,
      defeatedRivalsCount: 0,
      battleHistory: [], // Clean battle history
    };

    setGameState(cleanState);
    saveGameState(cleanState, firebaseUser.uid);

    try {
      await saveUserStateToCloud(firebaseUser.uid, cleanState, firebaseUser.email);
      await syncPublicTrainerProfile(
        firebaseUser.uid,
        cleanUser,
        0,
        0,
        starterWeapon.name
      );
    } catch (e) {
      console.error('Failed to initialize cloud state:', e);
    }

    setHasClaimedUsername(true);
  };

  const activeQuestsCount = gameState.quests.filter((q) => q.status === 'ACTIVE').length;

  // 1. Loading screen while auth or username archives are verified
  if (authLoading || (firebaseUser && checkingUsernameStatus)) {
    return (
      <div className="min-h-screen bg-[#0f0c1a] flex flex-col items-center justify-center font-silkscreen text-[#f4eee3] p-4 select-none">
        <div className="w-12 h-12 bg-[#e43b44] border-2 border-[#fff] flex items-center justify-center mb-3 animate-pulse shadow-[4px_4px_0px_#000]">
          <span className="font-pixel text-lg text-white font-bold">L</span>
        </div>
        <div className="font-pixel text-xs text-[#fec83e] animate-pulse">
          CONNECTING TO REALM ARCHIVES...
        </div>
        <p className="font-silkscreen text-xs text-[#8f85a3] mt-2 text-center">
          Verifying trainer accounts & arena records
        </p>
      </div>
    );
  }

  // 2. Unauthenticated: Home page is strictly the Sign in / Log in Page
  if (!firebaseUser) {
    return <AuthHomePage />;
  }

  // 3. Authenticated: Has not yet claimed unique username across all accounts
  if (!hasClaimedUsername) {
    return (
      <ClaimUsernameModal
        userId={firebaseUser.uid}
        currentUsername={firebaseUser.displayName || ''}
        onClaimSuccess={handleClaimSuccess}
        onSignOut={signOutUser}
      />
    );
  }

  // 4. Authenticated & Claimed: Full Life RPG Application
  return (
    <div
      className={`min-h-screen bg-[#0f0c1a] text-[#f4eee3] flex flex-col font-silkscreen ${
        gameState.settings.crtFilterEnabled ? 'crt-scanlines' : ''
      }`}
    >
      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* ONBOARDING MODAL IF BRAND NEW TRAINER */}
      {!gameState.hasCompletedOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}

      {/* LEVEL UP CELEBRATION MODAL */}
      {levelUpEvent && (
        <LevelUpModal
          event={levelUpEvent}
          onClose={() => setLevelUpEvent(null)}
        />
      )}

      {/* REWARD / QUEST COMPLETION MODAL */}
      {activeReward && (
        <RewardModal
          reward={activeReward}
          onClose={() => setActiveReward(null)}
        />
      )}

      {/* TOP STATUS BAR WITH USER AUTH & CLOUD WIDGET */}
      <TopBar
        user={gameState.user}
        settings={gameState.settings}
        onUpdateSettings={handleUpdateSettings}
        onNavigate={(screen) => setCurrentScreen(screen as NavScreen)}
        activeTab={currentScreen}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* TOP NOTIFICATION BANNER FOR LIVE DUEL CHALLENGE (WHEN OUTSIDE ARENA) */}
      {incomingDuelChallenges.length > 0 && currentScreen !== 'arena' && (
        <div className="max-w-7xl w-full mx-auto px-2 sm:px-4 pt-2">
          <div className="bg-[#fffbeb] border-4 border-[#dc2626] p-3 shadow-[4px_4px_0px_#120e1d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#dc2626] animate-ping shrink-0" />
              <div>
                <div className="font-pixel text-xs sm:text-sm text-[#991b1b] font-bold">
                  ⚔ LIVE ARENA CHALLENGE RECEIVED!
                </div>
                <div className="font-silkscreen text-[11px] text-[#7f1d1d] mt-0.5">
                  Trainer <span className="font-bold">{incomingDuelChallenges[0].challengerName}</span> (Lv.{incomingDuelChallenges[0].challengerLevel}) challenges you to an online duel!
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                chiptune.playSelect();
                setCurrentScreen('arena');
              }}
              className="w-full sm:w-auto font-pixel text-xs bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-2 border-2 border-[#7f1d1d] shadow-[2px_2px_0px_#000] shrink-0"
            >
              GO TO ARENA & PLAY ▶
            </button>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT WITH DESKTOP COMMAND MENU + CONTENT CANVAS */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 pb-20 lg:pb-8 flex flex-col lg:flex-row gap-4">
        {/* DESKTOP COMMAND MENU */}
        <CommandNav
          currentScreen={currentScreen}
          onNavigate={(screen) => setCurrentScreen(screen)}
          unallocatedPoints={gameState.user.statPoints}
          activeQuestsCount={activeQuestsCount}
          incomingChallengesCount={incomingDuelChallenges.length}
        />

        {/* SCREEN VIEWS */}
        <section className="flex-1 min-w-0" aria-label="Main Application Screen">
          {currentScreen === 'dashboard' && (
            <DashboardScreen
              user={gameState.user}
              quests={gameState.quests}
              badges={gameState.badges}
              items={gameState.items}
              inventory={gameState.inventory}
              onCompleteQuest={handleCompleteQuest}
              onNavigate={(s) => setCurrentScreen(s as NavScreen)}
            />
          )}

          {currentScreen === 'quests' && (
            <QuestBoardScreen
              quests={gameState.quests}
              onCompleteQuest={handleCompleteQuest}
              onCreateQuest={handleCreateQuest}
              onDeleteQuest={handleDeleteQuest}
            />
          )}

          {currentScreen === 'character' && (
            <CharacterScreen
              user={gameState.user}
              items={gameState.items}
              inventory={gameState.inventory}
              badges={gameState.badges}
              onAllocateStatPoint={handleAllocateStatPoint}
              onNavigate={(s) => setCurrentScreen(s as NavScreen)}
            />
          )}

          {(currentScreen === 'arena' || (currentScreen as string) === 'rivals' || (currentScreen as string) === 'battle') && (
            <ArenaScreen
              user={gameState.user}
              items={gameState.items}
              inventory={gameState.inventory}
              battleHistory={gameState.battleHistory || []}
              onVictory={handleBattleVictory}
              onDefeat={handleBattleDefeat}
              onRun={handleBattleRun}
              onUseItemInBattle={handleUseConsumable}
            />
          )}

          {currentScreen === 'achievements' && (
            <AchievementsScreen badges={gameState.badges} />
          )}

          {currentScreen === 'leaderboard' && (
            <LeaderboardScreen
              user={gameState.user}
              quests={gameState.quests}
              badges={gameState.badges}
            />
          )}

          {currentScreen === 'settings' && (
            <SettingsScreen
              settings={gameState.settings}
              user={gameState.user}
              onUpdateSettings={handleUpdateSettings}
              onUpdateUserProfile={handleUpdateUserProfile}
              onResetGame={handleResetGame}
              onExportSave={handleExportSave}
              onImportSave={handleImportSave}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )}
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LifeRpgApp />
    </AuthProvider>
  );
}
