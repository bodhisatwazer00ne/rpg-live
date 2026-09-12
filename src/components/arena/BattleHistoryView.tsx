import React, { useState, useMemo } from 'react';
import { BattleRecord } from '../../types';
import { CharacterSprite } from '../rpg/CharacterSprite';
import { PixelButton } from '../rpg/PixelButton';
import { chiptune } from '../../services/audio';

interface BattleHistoryViewProps {
  battleHistory: BattleRecord[];
  onReturnToRoster: () => void;
}

type HistoryFilter = 'ALL' | 'VICTORIES' | 'DEFEATS';

export const BattleHistoryView: React.FC<BattleHistoryViewProps> = ({
  battleHistory,
  onReturnToRoster,
}) => {
  const [filter, setFilter] = useState<HistoryFilter>('ALL');

  // Compute stats
  const totalBattles = battleHistory.length;
  const victories = useMemo(
    () => battleHistory.filter((b) => b.result === 'VICTORY').length,
    [battleHistory]
  );
  const defeats = useMemo(
    () => battleHistory.filter((b) => b.result === 'DEFEAT').length,
    [battleHistory]
  );
  const fled = useMemo(
    () => battleHistory.filter((b) => b.result === 'FLED').length,
    [battleHistory]
  );
  const totalXp = useMemo(
    () => battleHistory.reduce((acc, b) => acc + (b.xpEarned || 0), 0),
    [battleHistory]
  );
  const winRate = useMemo(() => {
    const decided = victories + defeats;
    if (decided === 0) return 0;
    return Math.round((victories / decided) * 100);
  }, [victories, defeats]);

  // Filtered list
  const filteredRecords = useMemo(() => {
    return battleHistory.filter((record) => {
      if (filter === 'VICTORIES') return record.result === 'VICTORY';
      if (filter === 'DEFEATS') return record.result === 'DEFEAT';
      return true;
    });
  }, [battleHistory, filter]);

  // Format date nicely
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent Match';
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#f5eedb] border-4 border-[#120e1d] p-4 shadow-[4px_4px_0px_#120e1d]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs bg-[#2b2540] text-[#fec83e] px-2 py-0.5 border border-[#141022]">
              CHRONICLES
            </span>
            <h2 className="font-pixel text-base sm:text-lg text-[#181425]">
              ARENA BATTLE HISTORY
            </h2>
          </div>
          <p className="font-silkscreen text-xs text-[#5e5443] mt-1">
            Historic record of duels, victories, and tactical retreats against fellow habit trackers.
          </p>
        </div>

        <PixelButton
          variant="parchment"
          size="sm"
          onClick={() => {
            chiptune.playSelect();
            onReturnToRoster();
          }}
        >
          ◀ RETURN TO ROSTER
        </PixelButton>
      </div>

      {/* STATS OVERVIEW BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        <div className="bg-[#fcf8f0] border-2 border-[#120e1d] p-3 shadow-[2px_2px_0px_#120e1d] text-center">
          <span className="font-silkscreen text-[10px] text-[#6b5c46] block uppercase">
            Total Duels
          </span>
          <span className="font-pixel text-base sm:text-lg text-[#181425] font-bold">
            {totalBattles}
          </span>
        </div>

        <div className="bg-[#fcf8f0] border-2 border-[#120e1d] p-3 shadow-[2px_2px_0px_#120e1d] text-center">
          <span className="font-silkscreen text-[10px] text-[#15803d] block uppercase">
            Victories
          </span>
          <span className="font-pixel text-base sm:text-lg text-[#15803d] font-bold">
            🏆 {victories}
          </span>
        </div>

        <div className="bg-[#fcf8f0] border-2 border-[#120e1d] p-3 shadow-[2px_2px_0px_#120e1d] text-center">
          <span className="font-silkscreen text-[10px] text-[#b91c1c] block uppercase">
            Defeats
          </span>
          <span className="font-pixel text-base sm:text-lg text-[#b91c1c] font-bold">
            💀 {defeats}
          </span>
        </div>

        <div className="bg-[#fcf8f0] border-2 border-[#120e1d] p-3 shadow-[2px_2px_0px_#120e1d] text-center">
          <span className="font-silkscreen text-[10px] text-[#854d0e] block uppercase">
            Win Rate
          </span>
          <span className="font-pixel text-base sm:text-lg text-[#b45309] font-bold">
            {winRate}%
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-[#fcf8f0] border-2 border-[#120e1d] p-3 shadow-[2px_2px_0px_#120e1d] text-center">
          <span className="font-silkscreen text-[10px] text-[#2563eb] block uppercase">
            XP Earned
          </span>
          <span className="font-pixel text-base sm:text-lg text-[#2563eb] font-bold">
            +{totalXp} XP
          </span>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#d4c5a9] pb-2">
        <div className="flex items-center gap-1.5 font-pixel text-[10px]">
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
            ALL DUELS ({totalBattles})
          </button>
          <button
            onClick={() => {
              chiptune.playSelect();
              setFilter('VICTORIES');
            }}
            className={`px-3 py-1.5 border-2 cursor-pointer transition-colors ${
              filter === 'VICTORIES'
                ? 'bg-[#15803d] text-white border-[#12361d] shadow-[2px_2px_0px_#000]'
                : 'bg-[#ede3ce] text-[#2b2540] border-[#d4c5a9] hover:bg-[#dfd3bc]'
            }`}
          >
            VICTORIES ({victories})
          </button>
          <button
            onClick={() => {
              chiptune.playSelect();
              setFilter('DEFEATS');
            }}
            className={`px-3 py-1.5 border-2 cursor-pointer transition-colors ${
              filter === 'DEFEATS'
                ? 'bg-[#b91c1c] text-white border-[#580d12] shadow-[2px_2px_0px_#000]'
                : 'bg-[#ede3ce] text-[#2b2540] border-[#d4c5a9] hover:bg-[#dfd3bc]'
            }`}
          >
            DEFEATS ({defeats})
          </button>
        </div>

        <span className="font-silkscreen text-[11px] text-[#71634d]">
          Showing {filteredRecords.length} recorded {filteredRecords.length === 1 ? 'match' : 'matches'}
        </span>
      </div>

      {/* MATCHES LIST OR EMPTY STATE */}
      {filteredRecords.length === 0 ? (
        <div className="bg-[#fcf8f0] border-4 border-[#120e1d] p-8 text-center space-y-4 shadow-[4px_4px_0px_#120e1d]">
          <div className="w-16 h-16 bg-[#201933] border-2 border-[#120e1d] mx-auto flex items-center justify-center text-2xl">
            ⚔
          </div>
          <div>
            <h3 className="font-pixel text-sm sm:text-base text-[#181425]">
              NO MATCHES FOUND
            </h3>
            <p className="font-silkscreen text-xs text-[#6b5c46] mt-1 max-w-md mx-auto">
              {filter === 'ALL'
                ? 'You have not participated in any arena duels yet. Challenge trainers on the roster to build your battle history!'
                : `No duels found under the ${filter.toLowerCase()} filter.`}
            </p>
          </div>
          <PixelButton
            variant="gold"
            size="md"
            onClick={() => {
              chiptune.playSelect();
              onReturnToRoster();
            }}
          >
            ⚔ VIEW TRAINER ROSTER & DUEL
          </PixelButton>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => {
            const isVictory = record.result === 'VICTORY';
            const isDefeat = record.result === 'DEFEAT';

            return (
              <div
                key={record.id}
                className="bg-[#fcf8f0] border-4 border-[#120e1d] p-3 sm:p-4 shadow-[3px_3px_0px_#120e1d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 transition-transform hover:-translate-y-0.5"
              >
                {/* Left: Avatar + Details */}
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  <div className="w-14 h-14 bg-[#181425] border-2 border-[#120e1d] p-1 shrink-0 flex items-center justify-center relative">
                    <CharacterSprite
                      id={record.rivalAvatarId || 'hero_novice'}
                      level={record.rivalLevel || 1}
                      size={44}
                    />
                    <span className="absolute -bottom-1 -right-1 font-pixel text-[8px] bg-[#201933] text-[#fec83e] px-1 border border-black">
                      LV.{record.rivalLevel}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isVictory ? (
                        <span className="font-pixel text-[9px] bg-[#dcfce7] text-[#15803d] px-2 py-0.5 border border-[#86efac] font-bold shadow-[1px_1px_0px_#15803d]">
                          ★ VICTORY
                        </span>
                      ) : isDefeat ? (
                        <span className="font-pixel text-[9px] bg-[#fee2e2] text-[#b91c1c] px-2 py-0.5 border border-[#fca5a5] font-bold shadow-[1px_1px_0px_#b91c1c]">
                          ✕ DEFEAT
                        </span>
                      ) : (
                        <span className="font-pixel text-[9px] bg-[#fef3c7] text-[#b45309] px-2 py-0.5 border border-[#fde68a] font-bold shadow-[1px_1px_0px_#b45309]">
                          ◀ RETREATED
                        </span>
                      )}

                      <h3 className="font-pixel text-xs sm:text-sm text-[#181425] truncate">
                        vs. {record.rivalName}
                      </h3>

                      <span className="font-silkscreen text-[11px] text-[#6b5c46] truncate hidden md:inline">
                        ({record.rivalTitle})
                      </span>
                    </div>

                    <p className="font-silkscreen text-xs text-[#4b3e2b] mt-1 line-clamp-2">
                      {record.details || (isVictory ? 'Claimed victory in habit arena combat.' : 'Fought honorably.')}
                    </p>

                    <span className="font-silkscreen text-[10px] text-[#8c7b64] block mt-1">
                      Duel Date: {formatDate(record.date)}
                    </span>
                  </div>
                </div>

                {/* Right: Honors & XP Badge */}
                <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#e2d5ba]">
                  {isVictory ? (
                    <div className="font-pixel text-xs text-[#15803d] bg-[#dcfce7] border border-[#86efac] px-2.5 py-1.5 text-center shadow-[2px_2px_0px_#15803d]">
                      +{record.xpEarned} XP AWARDED
                    </div>
                  ) : (
                    <div className="font-pixel text-xs text-[#64748b] bg-[#ede3ce] border border-[#c4b59a] px-2.5 py-1.5 text-center">
                      0 XP (DEFEAT)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER ACTION */}
      <div className="pt-2 text-center">
        <PixelButton
          variant="parchment"
          size="md"
          onClick={() => {
            chiptune.playSelect();
            onReturnToRoster();
          }}
        >
          ◀ RETURN TO TRAINER ARENA ROSTER
        </PixelButton>
      </div>
    </div>
  );
};
