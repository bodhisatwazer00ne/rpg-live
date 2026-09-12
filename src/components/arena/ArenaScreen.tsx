import React, { useState, useEffect, useMemo } from 'react';
import { User, Rival, Item, InventoryItem, BattleRecord, PublicTrainer, DuelChallenge } from '../../types';
import { PixelButton } from '../rpg/PixelButton';
import { CharacterSprite } from '../rpg/CharacterSprite';
import { BattleArenaScreen } from '../battle/BattleArenaScreen';
import { BattleHistoryView } from './BattleHistoryView';
import { 
  subscribeToPublicTrainers, 
  subscribeToIncomingChallenges, 
  subscribeToOutgoingChallenges,
  sendDuelChallenge, 
  respondToDuelChallenge, 
  deleteDuelChallenge,
  acceptDuelChallengeAndStartBattle,
  isTrainerOnline,
  updateTrainerPresence
} from '../../services/firebase';
import { chiptune } from '../../services/audio';

interface ArenaScreenProps {
  user: User;
  items: Item[];
  inventory: InventoryItem[];
  battleHistory?: BattleRecord[];
  onVictory: (rival: Rival) => void;
  onDefeat: (rival: Rival) => void;
  onRun?: (rival: Rival) => void;
  onUseItemInBattle: (inventoryItemId: string) => void;
}

type ArenaFilter = 'ONLINE_ONLY' | 'ALL' | 'SAME_LEVEL' | 'CHALLENGERS';

export const ArenaScreen: React.FC<ArenaScreenProps> = ({
  user,
  items,
  inventory,
  battleHistory = [],
  onVictory,
  onDefeat,
  onRun,
  onUseItemInBattle,
}) => {
  const [realTrainers, setRealTrainers] = useState<PublicTrainer[]>([]);
  const [incomingChallenges, setIncomingChallenges] = useState<DuelChallenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active battle rival and session ID if currently in simultaneous combat
  const [activeBattleRival, setActiveBattleRival] = useState<Rival | null>(null);
  const [activeBattleId, setActiveBattleId] = useState<string | null>(null);

  // Challenge dispatch feedback modal / toast
  const [dispatchedChallengeMsg, setDispatchedChallengeMsg] = useState<string | null>(null);

  // Active screen view: trainer roster vs battle history chronicles
  const [viewMode, setViewMode] = useState<'ROSTER' | 'HISTORY'>('ROSTER');

  // Filter for matching trainers
  const [filter, setFilter] = useState<ArenaFilter>('ONLINE_ONLY');

  // Ensure current user's presence is marked as online when entering the arena
  useEffect(() => {
    updateTrainerPresence(user.id, true);
  }, [user.id]);

  // Subscribe to real-world players in the Arena
  useEffect(() => {
    const unsubTrainers = subscribeToPublicTrainers(
      (trainers) => {
        // Filter out current user
        setRealTrainers(trainers.filter((t) => t.userId !== user.id));
        setLoading(false);
      },
      (err) => {
        console.warn('Public trainers subscription note:', err);
        setLoading(false);
      }
    );

    return () => unsubTrainers();
  }, [user.id]);

  // Subscribe to real-time incoming challenges directed to current user
  useEffect(() => {
    const unsubChallenges = subscribeToIncomingChallenges(
      user.id,
      (challenges) => {
        setIncomingChallenges(challenges);
        if (challenges.length > 0) {
          chiptune.playLevelUp();
        }
      },
      (err) => {
        console.warn('Incoming challenges subscription note:', err);
      }
    );

    return () => unsubChallenges();
  }, [user.id]);

  // Subscribe to outgoing challenges (when accepted by rival, automatically enter live battle)
  useEffect(() => {
    const unsubOutgoing = subscribeToOutgoingChallenges(user.id, (outgoingList) => {
      const accepted = outgoingList.find((c) => c.status === 'ACCEPTED' && c.battleId);
      if (accepted && accepted.battleId && !activeBattleId) {
        chiptune.playLevelUp();
        let rival: Rival = {
          id: accepted.targetUserId,
          username: accepted.targetName,
          title: 'Arena Contender',
          avatarId: 'warrior-1',
          level: user.level,
          hp: 50,
          maxHp: 50,
          stamina: 50,
          maxStamina: 50,
          attributes: user.attributes,
          equipmentName: 'Battle Gear',
          bio: 'Online Rival',
          difficulty: 'ADEPT',
          winRewardXp: 80,
          winRewardGold: 50,
          specialSkillName: 'Simultaneous Clash',
          streak: 1,
          acceptanceQuote: 'The duel has commenced!',
          status: 'ONLINE',
        };
        const found = realTrainers.find((t) => t.userId === accepted.targetUserId);
        if (found) {
          rival = convertPublicTrainerToRival(found);
        }
        setActiveBattleId(accepted.battleId);
        setActiveBattleRival(rival);
      }
    });

    return () => unsubOutgoing();
  }, [user.id, realTrainers, activeBattleId, user.attributes, user.level]);

  // Convert a PublicTrainer to a combat Rival for real-world duels
  const convertPublicTrainerToRival = (pt: PublicTrainer): Rival => {
    const isUnderdog = pt.level < user.level;
    const isChallenger = pt.level > user.level;

    let difficulty: Rival['difficulty'] = 'ADEPT';
    if (isUnderdog) difficulty = 'NOVICE';
    else if (isChallenger) difficulty = 'VETERAN';

    return {
      id: pt.userId,
      username: pt.username,
      title: pt.title,
      avatarId: pt.avatarId,
      level: pt.level,
      hp: pt.hp || pt.maxHp,
      maxHp: pt.maxHp,
      stamina: pt.stamina || pt.maxStamina,
      maxStamina: pt.maxStamina,
      attributes: pt.attributes,
      equipmentName: pt.equipmentName || 'Battle Gear',
      bio: `${pt.questsCleared} habit quests cleared | ${pt.streak} day streak`,
      difficulty,
      winRewardXp: 50 + pt.level * 35,
      winRewardGold: 0,
      specialSkillName: `${pt.specialization || 'Habit'} Surge`,
      streak: pt.streak,
      acceptanceQuote: 'I cultivate my discipline daily in the real world. Let us spar with honor!',
      status: 'ONLINE',
    };
  };

  // Convert a DuelChallenge to a combat Rival
  const convertChallengeToRival = (chal: DuelChallenge): Rival => {
    return {
      id: chal.challengerId,
      username: chal.challengerName,
      title: chal.challengerTitle || 'Adventurer',
      avatarId: chal.challengerAvatarId,
      level: chal.challengerLevel,
      hp: chal.challengerStats?.maxHp || 40,
      maxHp: chal.challengerStats?.maxHp || 40,
      stamina: chal.challengerStats?.maxStamina || 45,
      maxStamina: chal.challengerStats?.maxStamina || 45,
      attributes: chal.challengerStats?.attributes || {
        str: chal.challengerLevel * 2,
        int: chal.challengerLevel * 2,
        end: chal.challengerLevel * 2,
        res: chal.challengerLevel * 2,
        dis: chal.challengerLevel * 2,
        wil: chal.challengerLevel * 2,
      },
      equipmentName: 'Adventurer Gear',
      bio: 'Real-world player duel challenger',
      difficulty: chal.challengerLevel > user.level ? 'VETERAN' : 'ADEPT',
      winRewardXp: 60 + chal.challengerLevel * 35,
      winRewardGold: 0,
      specialSkillName: 'Real-World Focus Strike',
      acceptanceQuote: `I have issued you a challenge! Let's see your discipline in action!`,
      status: 'ONLINE',
    };
  };

  // Filtered real-world trainers list
  const filteredTrainers = useMemo(() => {
    return realTrainers.filter((trainer) => {
      if (filter === 'ONLINE_ONLY') return isTrainerOnline(trainer);
      if (filter === 'SAME_LEVEL') return trainer.level === user.level;
      if (filter === 'CHALLENGERS') return trainer.level > user.level;
      return true;
    });
  }, [realTrainers, filter, user.level]);

  const onlineTrainersCount = useMemo(() => {
    return realTrainers.filter((t) => isTrainerOnline(t)).length;
  }, [realTrainers]);

  // Handle challenging a real-world player (ONLY when both are online)
  const handleChallengePlayer = async (targetTrainer: PublicTrainer) => {
    chiptune.playSelect();
    if (!isTrainerOnline(targetTrainer)) {
      chiptune.playHit();
      setDispatchedChallengeMsg(
        `Trainer ${targetTrainer.username} is currently offline. Both trainers must be online to challenge and play.`
      );
      return;
    }
    try {
      await sendDuelChallenge(targetTrainer, user);
      setDispatchedChallengeMsg(
        `Challenge successfully broadcast to ${targetTrainer.username}! Both trainers are online. When they accept, the arena duel will commence.`
      );
    } catch (err: any) {
      chiptune.playHit();
      setDispatchedChallengeMsg(
        err?.message || 'Could not broadcast challenge. Both trainers must be online to duel.'
      );
    }
  };

  // Accept incoming challenge and launch simultaneous battle (ONLY when both are online)
  const handleAcceptIncomingChallenge = async (chal: DuelChallenge) => {
    chiptune.playHit();
    const challengerTrainer = realTrainers.find((t) => t.userId === chal.challengerId);
    if (challengerTrainer && !isTrainerOnline(challengerTrainer)) {
      chiptune.playHit();
      setDispatchedChallengeMsg(
        `Trainer ${chal.challengerName} has gone offline. Both trainers must be online to play.`
      );
      return;
    }

    try {
      const battleId = await acceptDuelChallengeAndStartBattle(chal, user);
      const rival = convertChallengeToRival(chal);
      setActiveBattleId(battleId);
      setActiveBattleRival(rival);
    } catch (err: any) {
      chiptune.playHit();
      setDispatchedChallengeMsg(
        err?.message || `Trainer ${chal.challengerName} has gone offline. Both trainers must be online to duel.`
      );
    }
  };

  // Decline incoming challenge
  const handleDeclineIncomingChallenge = async (chal: DuelChallenge) => {
    chiptune.playCursor();
    try {
      await respondToDuelChallenge(chal.id, false);
      await deleteDuelChallenge(chal.id);
    } catch (err) {
      console.warn('Error declining challenge:', err);
    }
  };

  // If in combat, render the BattleArenaScreen against the real rival
  if (activeBattleRival) {
    return (
      <div className="space-y-3 select-none">
        {/* Top return banner */}
        <div className="flex items-center justify-between bg-[#181425] border-2 border-[#120e1d] px-3 py-1.5 text-[#f4eee3]">
          <span className="font-pixel text-[10px] text-[#fec83e]">
            {activeBattleId ? '⚡ LIVE SIMULTANEOUS MULTIPLAYER DUEL: ' : 'REAL PLAYER SPAR: '}
            {user.username} (LV. {user.level}) vs {activeBattleRival.username} (LV. {activeBattleRival.level})
          </span>
          <button
            onClick={() => {
              setActiveBattleRival(null);
              setActiveBattleId(null);
            }}
            className="font-pixel text-[9px] text-[#e43b44] hover:underline cursor-pointer"
          >
            [FORFEIT / RETURN TO ROSTER]
          </button>
        </div>

        <BattleArenaScreen
          user={user}
          rival={activeBattleRival}
          battleId={activeBattleId || undefined}
          items={items}
          inventory={inventory}
          onVictory={(rival) => {
            onVictory(rival);
            setActiveBattleRival(null);
            setActiveBattleId(null);
          }}
          onDefeat={(rival) => {
            onDefeat(rival);
            setActiveBattleRival(null);
            setActiveBattleId(null);
          }}
          onRun={(rival) => {
            chiptune.playCursor();
            if (onRun) onRun(rival);
            setActiveBattleRival(null);
            setActiveBattleId(null);
          }}
          onUseItemInBattle={onUseItemInBattle}
        />
      </div>
    );
  }

  // If viewing previous battle chronicles
  if (viewMode === 'HISTORY') {
    return (
      <BattleHistoryView
        battleHistory={battleHistory}
        onReturnToRoster={() => setViewMode('ROSTER')}
      />
    );
  }

  return (
    <div className="space-y-4 select-none">
      {/* ARENA HEADER BANNER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#f5eedb] border-4 border-[#120e1d] p-4 shadow-[4px_4px_0px_#120e1d]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs bg-[#e43b44] text-white px-2 py-0.5 border border-[#7f1d1d]">
              REAL-TIME ARENA
            </span>
            <h2 className="font-pixel text-base sm:text-lg text-[#181425]">
              TRAINER BATTLE ARENA
            </h2>
          </div>
          <p className="font-silkscreen text-xs text-[#5e5443] mt-1">
            Challenge real-world players registered in the Guild. Duel live opponents or spar with their calibrated avatars.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="font-pixel text-xs bg-[#201933] text-[#fec83e] px-3 py-2 border-2 border-[#120e1d] shadow-[2px_2px_0px_#000]">
            YOUR BRACKET: LV. {user.level}
          </div>

          <PixelButton
            variant="gold"
            size="sm"
            onClick={() => {
              chiptune.playSelect();
              setViewMode('HISTORY');
            }}
          >
            📜 PREVIOUS BATTLES ({battleHistory.length})
          </PixelButton>
        </div>
      </div>

      {/* DISPATCH CONFIRMATION POPUP */}
      {dispatchedChallengeMsg && (
        <div className="bg-[#dbeafe] border-4 border-[#120e1d] p-3.5 flex items-center justify-between gap-2 shadow-[4px_4px_0px_#120e1d]">
          <span className="font-silkscreen text-xs text-[#1e40af]">
            {dispatchedChallengeMsg}
          </span>
          <PixelButton
            variant="dark"
            size="sm"
            onClick={() => setDispatchedChallengeMsg(null)}
          >
            DISMISS
          </PixelButton>
        </div>
      )}

      {/* REAL-TIME INCOMING CHALLENGES FROM REAL PLAYERS */}
      {incomingChallenges.map((chal) => {
        const challengerTrainer = realTrainers.find((t) => t.userId === chal.challengerId);
        const isChallengerOnline = challengerTrainer ? isTrainerOnline(challengerTrainer) : true;

        return (
          <div
            key={chal.id}
            className={`border-4 border-[#120e1d] p-4 sm:p-5 shadow-[4px_4px_0px_#120e1d] ${
              isChallengerOnline ? 'bg-[#fffbeb] animate-pulse' : 'bg-[#f1ece1]'
            }`}
          >
            {/* Header Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 font-pixel text-[10px] sm:text-xs px-2.5 py-1 border shadow-[2px_2px_0px_#000] ${
                    isChallengerOnline
                      ? 'bg-[#dc2626] text-white border-[#7f1d1d]'
                      : 'bg-[#6b7280] text-white border-[#374151]'
                  }`}
                >
                  {isChallengerOnline && <span className="w-2 h-2 rounded-full bg-[#fef08a] animate-ping" />}
                  {isChallengerOnline ? '⚔ REAL-TIME DUEL CHALLENGE RECEIVED!' : '⚠️ CHALLENGE RECEIVED (CHALLENGER OFFLINE)'}
                </span>
                <span className="font-pixel text-[10px] sm:text-xs text-[#854d0e] bg-[#fef08a] px-2 py-0.5 border border-[#ca8a04]">
                  LV. {chal.challengerLevel} REAL PLAYER
                </span>
              </div>
              {isChallengerOnline ? (
                <span className="inline-flex items-center gap-1 font-pixel text-[9px] bg-[#dcfce7] text-[#166534] px-2 py-0.5 border border-[#86efac]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-ping" />
                  ONLINE NOW
                </span>
              ) : (
                <span className="font-pixel text-[9px] bg-[#e5e7eb] text-[#4b5563] px-2 py-0.5 border border-[#9ca3af]">
                  ✕ CURRENTLY OFFLINE
                </span>
              )}
            </div>

            {/* Body Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-3 pt-3 border-t-2 border-[#e7d8b8]">
              <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#181425] border-2 border-[#120e1d] p-1 shrink-0 flex items-center justify-center shadow-[inset_2px_2px_0px_#000] relative">
                  <CharacterSprite id={chal.challengerAvatarId} level={chal.challengerLevel} size={54} />
                  <span className="absolute -bottom-2 font-pixel text-[8px] sm:text-[9px] bg-[#201933] text-[#fec83e] px-1.5 border border-[#120e1d]">
                    LV.{chal.challengerLevel}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-pixel text-xs sm:text-sm text-[#181425] font-bold">
                      {chal.challengerName}
                    </h3>
                    <span className="font-silkscreen text-[11px] text-[#6b5c46]">
                      ({chal.challengerTitle || 'Real Player'})
                    </span>
                  </div>

                  <div className="bg-[#ede3ce] border border-[#d4c5a9] p-2 sm:p-2.5 mt-2 font-silkscreen text-xs text-[#453823] leading-relaxed italic">
                    {isChallengerOnline
                      ? '"I challenge you to a duel of discipline and habit power!"'
                      : 'Challenger is currently offline. Both players must be online to play.'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0">
                {isChallengerOnline ? (
                  <PixelButton
                    variant="green"
                    size="md"
                    className="flex-1 md:flex-initial"
                    onClick={() => handleAcceptIncomingChallenge(chal)}
                  >
                    ⚔ ACCEPT DUEL & PLAY ▶
                  </PixelButton>
                ) : (
                  <PixelButton
                    variant="stone"
                    size="md"
                    disabled={true}
                    className="flex-1 md:flex-initial opacity-60 cursor-not-allowed"
                  >
                    ✕ OFFLINE (CANNOT PLAY)
                  </PixelButton>
                )}
                <PixelButton
                  variant="dark"
                  size="md"
                  className="flex-1 md:flex-initial"
                  onClick={() => handleDeclineIncomingChallenge(chal)}
                >
                  ✕ DECLINE
                </PixelButton>
              </div>
            </div>
          </div>
        );
      })}

      {/* FILTER TABS */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#d4c5a9] pb-2">
        <div className="flex flex-wrap items-center gap-1 font-pixel text-[10px]">
          <button
            onClick={() => {
              chiptune.playSelect();
              setFilter('ONLINE_ONLY');
            }}
            className={`px-3 py-1.5 border-2 cursor-pointer transition-colors ${
              filter === 'ONLINE_ONLY'
                ? 'bg-[#15803d] text-white border-[#120e1d] shadow-[2px_2px_0px_#000]'
                : 'bg-[#ede3ce] text-[#2b2540] border-[#d4c5a9] hover:bg-[#dfd3bc]'
            }`}
          >
            ● ONLINE NOW ({onlineTrainersCount})
          </button>
          <button
            onClick={() => {
              chiptune.playSelect();
              setFilter('ALL');
            }}
            className={`px-3 py-1.5 border-2 cursor-pointer transition-colors ${
              filter === 'ALL'
                ? 'bg-[#201933] text-[#fec83e] border-[#120e1d] shadow-[2px_2px_0px_#000]'
                : 'bg-[#ede3ce] text-[#2b2540] border-[#d4c5a9] hover:bg-[#dfd3bc]'
            }`}
          >
            ALL TRAINERS ({realTrainers.length})
          </button>
          <button
            onClick={() => {
              chiptune.playSelect();
              setFilter('SAME_LEVEL');
            }}
            className={`px-3 py-1.5 border-2 cursor-pointer transition-colors ${
              filter === 'SAME_LEVEL'
                ? 'bg-[#201933] text-[#fec83e] border-[#120e1d] shadow-[2px_2px_0px_#000]'
                : 'bg-[#ede3ce] text-[#2b2540] border-[#d4c5a9] hover:bg-[#dfd3bc]'
            }`}
          >
            SAME LEVEL (LV. {user.level})
          </button>
          <button
            onClick={() => {
              chiptune.playSelect();
              setFilter('CHALLENGERS');
            }}
            className={`px-3 py-1.5 border-2 cursor-pointer transition-colors ${
              filter === 'CHALLENGERS'
                ? 'bg-[#201933] text-[#fec83e] border-[#120e1d] shadow-[2px_2px_0px_#000]'
                : 'bg-[#ede3ce] text-[#2b2540] border-[#d4c5a9] hover:bg-[#dfd3bc]'
            }`}
          >
            CHALLENGERS (LV. {user.level + 1}+)
          </button>
        </div>

        <span className="font-silkscreen text-[11px] text-[#71634d]">
          Both trainers must be online to challenge and play
        </span>
      </div>

      {/* REAL TRAINERS ROSTER */}
      {loading ? (
        <div className="p-8 text-center font-pixel text-xs text-[#6b5c46] animate-pulse">
          SCANNING REALM FOR REGISTERED TRAINERS...
        </div>
      ) : filteredTrainers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTrainers.map((trainer) => {
            const isSameLevel = trainer.level === user.level;
            const isHigher = trainer.level > user.level;
            const isOnline = isTrainerOnline(trainer);

            return (
              <div
                key={trainer.userId}
                className="bg-[#fcf8f0] border-4 border-[#120e1d] p-4 shadow-[4px_4px_0px_#120e1d] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-[#181425] border-2 border-[#120e1d] p-1 flex items-center justify-center shrink-0">
                        <CharacterSprite id={trainer.avatarId} level={trainer.level} size={54} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-pixel text-xs text-[#181425]">
                            {trainer.username}
                          </h3>
                          {isOnline ? (
                            <span className="flex items-center gap-1 font-pixel text-[8px] text-[#15803d] bg-[#dcfce7] px-1.5 py-0.5 border border-[#86efac]">
                              <span className="w-1.5 h-1.5 bg-[#22c55e] inline-block rounded-full animate-ping" />
                              ONLINE NOW
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 font-pixel text-[8px] text-[#64748b] bg-[#f1f5f9] px-1.5 py-0.5 border border-[#cbd5e1]">
                              <span className="w-1.5 h-1.5 bg-[#94a3b8] inline-block rounded-full" />
                              OFFLINE
                            </span>
                          )}
                        </div>
                        <p className="font-silkscreen text-[11px] text-[#6b5c46]">
                          {trainer.title}
                        </p>
                        {trainer.streak > 0 && (
                          <span className="inline-block mt-0.5 font-pixel text-[8px] bg-[#ffedd5] text-[#c2410c] px-1 py-0.2 border border-[#fed7aa]">
                            🔥 {trainer.streak}-DAY HABIT STREAK
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-pixel text-xs font-bold bg-[#201933] text-[#fec83e] px-2 py-0.5 border border-[#120e1d] inline-block">
                        LV. {trainer.level}
                      </div>
                      <div className="mt-1">
                        {isSameLevel ? (
                          <span className="font-pixel text-[8px] bg-[#dcfce7] text-[#15803d] px-1 py-0.5 border border-[#86efac]">
                            EQUAL MATCH
                          </span>
                        ) : isHigher ? (
                          <span className="font-pixel text-[8px] bg-[#fee2e2] text-[#b91c1c] px-1 py-0.5 border border-[#fca5a5]">
                            CHALLENGER (+{trainer.level - user.level})
                          </span>
                        ) : (
                          <span className="font-pixel text-[8px] bg-[#dbeafe] text-[#1d4ed8] px-1 py-0.5 border border-[#93c5fd]">
                            UNDERDOG (-{user.level - trainer.level})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Combat Stats Preview */}
                  <div className="grid grid-cols-3 gap-1.5 mt-3 text-center font-pixel text-[9px]">
                    <div className="bg-[#ede3ce] p-1 border border-[#c4b59a]">
                      <span className="text-[#6e5d42] block">HP</span>
                      <span className="font-bold text-[#181425]">{trainer.maxHp}</span>
                    </div>
                    <div className="bg-[#ede3ce] p-1 border border-[#c4b59a]">
                      <span className="text-[#6e5d42] block">STAMINA</span>
                      <span className="font-bold text-[#2563eb]">{trainer.maxStamina}</span>
                    </div>
                    <div className="bg-[#ede3ce] p-1 border border-[#c4b59a]">
                      <span className="text-[#6e5d42] block">QUESTS</span>
                      <span className="font-bold text-[#15803d]">{trainer.questsCleared} Cleared</span>
                    </div>
                  </div>
                </div>

                {/* Actions: Challenge Live Duel (ONLY when both are online) */}
                <div className="mt-4 pt-3 border-t border-[#d4c5a9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  {isOnline ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 font-pixel text-[10px] text-[#15803d]">
                        <span className="w-2 h-2 rounded-full bg-[#15803d] animate-ping" />
                        READY FOR LIVE DUEL
                      </span>
                      <PixelButton
                        variant="red"
                        size="sm"
                        onClick={() => handleChallengePlayer(trainer)}
                        className="w-full sm:w-auto"
                      >
                        ⚔ CHALLENGE LIVE DUEL ▶
                      </PixelButton>
                    </>
                  ) : (
                    <>
                      <span className="font-silkscreen text-[9px] text-[#857463]">
                        Both trainers must be online to challenge and play.
                      </span>
                      <PixelButton
                        variant="stone"
                        size="sm"
                        disabled={true}
                        className="opacity-60 cursor-not-allowed w-full sm:w-auto"
                      >
                        ✕ OFFLINE (CANNOT DUEL)
                      </PixelButton>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State: No other real players yet */
        <div className="bg-[#f5eedb] border-4 border-[#120e1d] p-6 text-center space-y-4 shadow-[4px_4px_0px_#120e1d]">
          <div className="w-16 h-16 mx-auto bg-[#181425] border-2 border-[#120e1d] p-1 flex items-center justify-center">
            <CharacterSprite id={user.avatarId} size={48} />
          </div>
          <div>
            <h3 className="font-pixel text-sm text-[#181425] font-bold">
              ARENA AWAITING REAL-WORLD CONTENDERS
            </h3>
            <p className="font-silkscreen text-xs text-[#5e5443] max-w-md mx-auto mt-1.5 leading-relaxed">
              You are registered and ready in the arena! This multiplayer roster is powered exclusively by real-world players. As soon as another player registers an account and claims their call-sign, their live avatar and stats will appear here instantly.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <div className="px-3 py-1.5 bg-[#ede3ce] border-2 border-[#c4b59a] font-pixel text-[10px] text-[#4b3e2b]">
              ⚔ REAL PLAYERS ONLY • NO MOCK BOTS
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
