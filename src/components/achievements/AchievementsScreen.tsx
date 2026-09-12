import React, { useState } from 'react';
import { Badge } from '../../types';
import { RpgWindow } from '../rpg/RpgWindow';
import { PixelIcon } from '../rpg/PixelIcon';
import { chiptune } from '../../services/audio';

interface AchievementsScreenProps {
  badges: Badge[];
}

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({ badges }) => {
  const [filter, setFilter] = useState<'ALL' | 'UNLOCKED' | 'LOCKED'>('ALL');

  const unlockedCount = badges.filter((b) => b.unlockedAt).length;

  const filteredBadges = badges.filter((b) => {
    if (filter === 'UNLOCKED') return Boolean(b.unlockedAt);
    if (filter === 'LOCKED') return !b.unlockedAt;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#f5eedb] border-4 border-[#120e1d] p-4 shadow-[4px_4px_0px_#120e1d]">
        <div>
          <h2 className="font-pixel text-base sm:text-lg text-[#181425]">
            HALL OF HONORS & BADGES
          </h2>
          <p className="font-silkscreen text-xs text-[#5e5443] mt-0.5">
            Permanent commemorations of your milestones in discipline, strength, and focus.
          </p>
        </div>

        <div className="font-pixel text-xs bg-[#241c38] text-[#fec83e] px-3 py-2 border-2 border-[#120e1d]">
          MEDALS: {unlockedCount} / {badges.length} ({Math.round((unlockedCount / badges.length) * 100)}%)
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-[#201933] border-4 border-[#120e1d] p-2 font-pixel text-[10px]">
        {(['ALL', 'UNLOCKED', 'LOCKED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              chiptune.playCursor();
              setFilter(f);
            }}
            className={`px-3 py-1.5 border transition-all cursor-pointer ${
              filter === f
                ? 'bg-[#fec83e] text-[#1c172b] border-black font-bold'
                : 'bg-[#2f2549] text-[#e0d6f5] border-[#443864]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredBadges.map((badge) => {
          const isUnlocked = Boolean(badge.unlockedAt);

          return (
            <div
              key={badge.id}
              className={`border-4 border-[#120e1d] p-3.5 shadow-[3px_3px_0px_#120e1d] flex flex-col justify-between transition-all ${
                isUnlocked ? 'bg-[#fcf8f0]' : 'bg-[#e2d8c3] opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 border-2 border-[#120e1d] flex items-center justify-center p-1 ${
                        isUnlocked ? 'bg-[#fef08a]' : 'bg-[#cbd5e1]'
                      }`}
                    >
                      <PixelIcon name={badge.icon} size={22} />
                    </div>
                    <div>
                      <h4 className="font-pixel text-xs text-[#181425] line-clamp-1">
                        {badge.name}
                      </h4>
                      <span className="font-pixel text-[9px] text-[#64748b]">
                        {badge.category}
                      </span>
                    </div>
                  </div>

                  {isUnlocked ? (
                    <span className="font-pixel text-[9px] bg-[#dcfce7] text-[#15803d] px-1.5 py-0.5 border border-[#86efac]">
                      EARNED ✓
                    </span>
                  ) : (
                    <span className="font-pixel text-[9px] bg-[#f1f5f9] text-[#64748b] px-1.5 py-0.5 border border-[#cbd5e1]">
                      LOCKED
                    </span>
                  )}
                </div>

                <p className="font-silkscreen text-xs text-[#524939] mt-2 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#d4c5a9] flex items-center justify-between font-pixel text-[9px] text-[#786c58]">
                <span>CRITERIA: {badge.unlockCondition}</span>
                {isUnlocked && badge.unlockedAt && (
                  <span className="text-[#2563eb]">
                    {new Date(badge.unlockedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
