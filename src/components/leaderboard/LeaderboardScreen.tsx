import React, { useState, useEffect } from 'react';
import { User, Quest, Badge, PublicTrainer } from '../../types';
import { RpgWindow } from '../rpg/RpgWindow';
import { CharacterSprite } from '../rpg/CharacterSprite';
import { PixelIcon } from '../rpg/PixelIcon';
import { subscribeToPublicTrainers } from '../../services/firebase';

interface LeaderboardScreenProps {
  user: User;
  quests: Quest[];
  badges: Badge[];
}

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatarId: string;
  title: string;
  specialization: string;
  level: number;
  streak: number;
  questsCleared: number;
  isPlayer?: boolean;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  user,
  quests,
}) => {
  const [realTrainers, setRealTrainers] = useState<PublicTrainer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const completedQuestsCount = quests.filter((q) => q.status === 'COMPLETED').length;

  useEffect(() => {
    const unsub = subscribeToPublicTrainers(
      (trainers) => {
        setRealTrainers(trainers);
        setLoading(false);
      },
      (err) => {
        console.warn('Leaderboard public trainer subscription note:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Format and merge player with real world trainers
  const playerInList = realTrainers.find((t) => t.userId === user.id);

  const allEntries: Omit<LeaderboardEntry, 'rank'>[] = realTrainers.map((t) => ({
    id: t.userId,
    name: t.username,
    avatarId: t.avatarId,
    title: t.title,
    specialization: t.specialization || 'ADVENTURER',
    level: t.level,
    streak: t.streak,
    questsCleared: t.questsCleared,
    isPlayer: t.userId === user.id,
  }));

  // If player not yet persisted in public list, add current player
  if (!playerInList) {
    allEntries.push({
      id: user.id,
      name: user.username,
      avatarId: user.avatarId,
      title: user.title,
      specialization: user.specialization,
      level: user.level,
      streak: user.streak,
      questsCleared: completedQuestsCount,
      isPlayer: true,
    });
  }

  // Sort by Level DESC, then Quests Cleared DESC, then Streak DESC
  const sortedEntries: LeaderboardEntry[] = allEntries
    .sort((a, b) => b.level - a.level || b.questsCleared - a.questsCleared || b.streak - a.streak)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const playerRank = sortedEntries.find((e) => e.isPlayer)?.rank || 1;

  return (
    <div className="space-y-4 select-none">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#f5eedb] border-4 border-[#120e1d] p-4 shadow-[4px_4px_0px_#120e1d]">
        <div>
          <h2 className="font-pixel text-base sm:text-lg text-[#181425]">
            GLOBAL REAL-WORLD TRAINER RANKINGS
          </h2>
          <p className="font-silkscreen text-xs text-[#5e5443] mt-0.5">
            Real players ranked by level, habit consistency streak, and verified quest completions.
          </p>
        </div>

        <div className="font-pixel text-xs bg-[#241c38] text-[#fec83e] px-3 py-2 border-2 border-[#120e1d] shadow-[2px_2px_0px_#000]">
          YOUR STANDING: #{playerRank} OF {sortedEntries.length} REAL PLAYERS
        </div>
      </div>

      {/* Leaderboard Table */}
      <RpgWindow variant="parchment" title="REAL TRAINERS HALL OF FAME">
        {loading ? (
          <div className="p-8 text-center font-pixel text-xs text-[#6b5c46] animate-pulse">
            LOADING REAL-TIME GLOBAL TRAINER RANKINGS...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-pixel text-xs">
              <thead>
                <tr className="bg-[#ede3ce] border-b-2 border-[#120e1d] text-left text-[10px] text-[#554a37]">
                  <th className="p-2.5">RANK</th>
                  <th className="p-2.5">TRAINER</th>
                  <th className="p-2.5">SPECIALIZATION</th>
                  <th className="p-2.5 text-center">LEVEL</th>
                  <th className="p-2.5 text-center">STREAK</th>
                  <th className="p-2.5 text-right">HABIT QUESTS</th>
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((entry) => {
                  const isPlayer = entry.isPlayer;

                  return (
                    <tr
                      key={entry.id}
                      className={`border-b border-[#d4c5a9] transition-colors ${
                        isPlayer
                          ? 'bg-[#fef9c3] font-bold border-l-4 border-l-[#ca8a04]'
                          : 'hover:bg-[#fcf8f0]'
                      }`}
                    >
                      {/* Rank */}
                      <td className="p-2.5">
                        <span
                          className={`inline-block w-6 h-6 leading-6 text-center text-[10px] border ${
                            entry.rank === 1
                              ? 'bg-[#fef08a] text-[#854d0e] border-[#ca8a04]'
                              : entry.rank === 2
                              ? 'bg-[#e2e8f0] text-[#334155] border-[#94a3b8]'
                              : entry.rank === 3
                              ? 'bg-[#fed7aa] text-[#7c2d12] border-[#ea580c]'
                              : 'bg-[#f1f5f9] text-[#64748b] border-[#cbd5e1]'
                          }`}
                        >
                          #{entry.rank}
                        </span>
                      </td>

                      {/* Trainer Info */}
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#1e1832] border border-[#120e1d] p-0.5 shrink-0 flex items-center justify-center">
                            <CharacterSprite id={entry.avatarId} size={28} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#181425]">{entry.name}</span>
                              {isPlayer && (
                                <span className="text-[8px] bg-[#38b764] text-[#0d2a15] px-1 border border-[#257142]">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="font-silkscreen text-[10px] text-[#6b5c46] block">
                              {entry.title}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Specialization */}
                      <td className="p-2.5 font-silkscreen text-[11px] text-[#3b82f6]">
                        {entry.specialization}
                      </td>

                      {/* Level */}
                      <td className="p-2.5 text-center">
                        <span className="text-[#1d4ed8]">LV. {entry.level}</span>
                      </td>

                      {/* Streak */}
                      <td className="p-2.5 text-center">
                        <span className="text-[#ea580c] flex items-center justify-center gap-1">
                          <PixelIcon name="flame" size={14} /> {entry.streak}D
                        </span>
                      </td>

                      {/* Quests */}
                      <td className="p-2.5 text-right font-silkscreen text-xs text-[#15803d]">
                        {entry.questsCleared} Cleared
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </RpgWindow>
    </div>
  );
};
