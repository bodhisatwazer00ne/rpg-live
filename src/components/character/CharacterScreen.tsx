import React from 'react';
import { User, Item, InventoryItem, Badge, AttributeType } from '../../types';
import { RpgWindow } from '../rpg/RpgWindow';
import { PixelButton } from '../rpg/PixelButton';
import { StatBar } from '../rpg/StatBar';
import { CharacterSprite } from '../rpg/CharacterSprite';
import { PixelIcon } from '../rpg/PixelIcon';
import { computeEffectiveAttributes } from '../../services/storage';
import { chiptune } from '../../services/audio';
import { StatRadarChart } from './StatRadarChart';
import { getNextTrainerRankMilestone } from '../../services/gameEngine';

interface CharacterScreenProps {
  user: User;
  items: Item[];
  inventory: InventoryItem[];
  badges: Badge[];
  onAllocateStatPoint: (stat: AttributeType) => void;
  onNavigate?: (screen: string) => void;
}

export const CharacterScreen: React.FC<CharacterScreenProps> = ({
  user,
  items,
  inventory,
  badges,
  onAllocateStatPoint,
  onNavigate,
}) => {
  const effective = computeEffectiveAttributes(user, inventory, items);
  const unlockedBadges = badges.filter((b) => b.unlockedAt);
  const nextRank = getNextTrainerRankMilestone(user.level);

  const statInfo: {
    key: AttributeType;
    label: string;
    name: string;
    color: string;
  }[] = [
    { key: 'str', label: 'STR', name: 'Strength', color: '#991b1b' },
    { key: 'int', label: 'INT', name: 'Intelligence', color: '#1d4ed8' },
    { key: 'end', label: 'END', name: 'Endurance', color: '#15803d' },
    { key: 'res', label: 'RES', name: 'Resilience', color: '#475569' },
    { key: 'dis', label: 'DIS', name: 'Discipline', color: '#b45309' },
    { key: 'wil', label: 'WIL', name: 'Willpower', color: '#7e22ce' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#f5eedb] border-4 border-[#120e1d] p-4 shadow-[4px_4px_0px_#120e1d]">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-[#1e1832] border-2 border-[#120e1d] p-1 flex items-center justify-center">
            <CharacterSprite id={user.avatarId} level={user.level} size={48} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-pixel text-base sm:text-lg text-[#181425]">
                {user.username}
              </h2>
              <span className="font-pixel text-[10px] bg-[#241c38] text-[#fec83e] px-2 py-0.5 border border-[#3e3458]">
                LV. {user.level}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="font-silkscreen text-xs text-[#594d37] font-bold">
                {user.title}
              </span>
              {nextRank && (
                <span className="font-pixel text-[9px] bg-[#241c38] text-[#86efac] px-2 py-0.5 border border-[#120e1d]">
                  NEXT RANK: LV. {nextRank.level} ({nextRank.title})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user.statPoints > 0 && (
            <span className="font-pixel text-xs bg-[#ef4444] text-white px-2.5 py-1 border-2 border-black animate-pulse shadow-[2px_2px_0px_#000]">
              +{user.statPoints} UNALLOCATED PTS
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Vitals breakdown & Character Showcase */}
        <div className="lg:col-span-5 space-y-4">
          {/* Vitals breakdown & Radar Chart */}
          <RpgWindow variant="parchment" title="EXPERIENCE & ATTRIBUTES">
            <div className="space-y-4">
              {/* Radar Chart of current 6 attributes */}
              <div className="bg-[#1f1734] border-2 border-[#120e1d] p-3 shadow-[2px_2px_0px_#120e1d]">
                <div className="text-center font-pixel text-[11px] text-[#fec83e] tracking-widest mb-2 font-bold">
                  ATTRIBUTE RADAR MATRIX
                </div>
                <StatRadarChart stats={effective.total} size={250} />
              </div>

              {/* Level Progress */}
              <div className="space-y-2.5 pt-1">
                <StatBar label="LEVEL PROGRESS (EXP)" current={user.xp} max={user.maxXp} type="xp" />
              </div>
            </div>
          </RpgWindow>
        </div>

        {/* Right Column: In-Depth Attribute Point Allocation */}
        <div className="lg:col-span-7 space-y-4">
          <RpgWindow
            variant="parchment"
            title="ATTRIBUTES"
            subtitle={
              user.statPoints > 0
                ? `${user.statPoints} UNALLOCATED POINTS`
                : undefined
            }
          >
            <div className="space-y-2.5">
              {statInfo.map((stat) => {
                const totalVal = effective.total[stat.key];
                const baseVal = effective.base[stat.key];
                const bonusVal = effective.bonus[stat.key];

                return (
                  <div
                    key={stat.key}
                    className="px-3 py-2 bg-[#fcf8f0] border-2 border-[#120e1d] shadow-[2px_2px_0px_#120e1d] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <PixelIcon name={stat.key} size={18} />
                      <span
                        className="font-pixel text-xs font-bold"
                        style={{ color: stat.color }}
                      >
                        {stat.label} ({stat.name})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right font-pixel">
                        <span className="text-base text-[#141022] font-bold">
                          {totalVal}
                        </span>
                        {bonusVal > 0 && (
                          <span className="text-[9px] text-[#15803d] block">
                            ({baseVal} + {bonusVal} gear)
                          </span>
                        )}
                      </div>

                      {user.statPoints > 0 && (
                        <PixelButton
                          variant="gold"
                          size="sm"
                          aria-label={`Allocate 1 stat point to ${stat.label} ${stat.name}`}
                          onClick={() => {
                            chiptune.playSelect();
                            onAllocateStatPoint(stat.key);
                          }}
                        >
                          +1 PT
                        </PixelButton>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </RpgWindow>

          {/* Badges Preview */}
          <RpgWindow
            variant="parchment"
            title="BADGE CASE"
            headerRight={
              <button
                type="button"
                onClick={() => onNavigate('achievements')}
                aria-label="View full badge case in achievements"
                className="font-pixel text-[10px] text-[#2563eb] hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] p-0.5"
              >
                VIEW FULL CASE ▶
              </button>
            }
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {unlockedBadges.slice(0, 6).map((badge) => (
                <div
                  key={badge.id}
                  className="bg-[#fcf8f0] border-2 border-[#120e1d] p-2 flex items-center gap-2 shadow-[1px_1px_0px_#120e1d]"
                >
                  <PixelIcon name={badge.icon} size={20} />
                  <div>
                    <div className="font-pixel text-[9px] text-[#181425] truncate max-w-[100px]">
                      {badge.name}
                    </div>
                    <div className="font-silkscreen text-[8px] text-[#15803d]">
                      UNLOCKED
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </RpgWindow>
        </div>
      </div>
    </div>
  );
};
