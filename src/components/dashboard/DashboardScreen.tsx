import React from 'react';
import { User, Quest, Badge, Item, InventoryItem } from '../../types';
import { RpgWindow } from '../rpg/RpgWindow';
import { PixelButton } from '../rpg/PixelButton';
import { StatBar } from '../rpg/StatBar';
import { CharacterSprite } from '../rpg/CharacterSprite';
import { PixelIcon } from '../rpg/PixelIcon';
import { formatQuestDeadline } from '../quests/QuestBoardScreen';

interface DashboardScreenProps {
  user: User;
  quests: Quest[];
  badges: Badge[];
  items?: Item[];
  inventory?: InventoryItem[];
  onCompleteQuest: (questId: string) => void;
  onNavigate: (screen: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user,
  quests,
  badges,
  onCompleteQuest,
  onNavigate,
}) => {
  const activeQuests = quests.filter((q) => q.status === 'ACTIVE');
  const unlockedBadges = badges.filter((b) => b.unlockedAt);

  return (
    <div className="space-y-4">
      {/* TOP ROW: TRAINER LEVEL & STATUS + ACHIEVEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Trainer Level & Status */}
        <div className="lg:col-span-5">
          <RpgWindow
            variant="dark"
            title="TRAINER STATUS"
            headerRight={
              <span className="font-pixel text-[10px] text-[#fec83e]">
                LV. {user.level}
              </span>
            }
          >
            <div className="flex flex-col items-center text-center p-2">
              {/* Character Avatar Box with pedestal */}
              <div className="relative w-36 h-36 bg-[#161224] border-4 border-[#0e0a19] flex items-center justify-center p-2 shadow-[inset_3px_3px_0px_#000] mb-3">
                {/* Pedestal platform */}
                <div className="absolute bottom-2 w-28 h-4 bg-[#2f2746] border border-[#443864]" />
                <CharacterSprite id={user.avatarId} level={user.level} size={96} animation="idle" />
              </div>

              {/* Name & Dynamic Rank Title */}
              <h2 className="font-pixel text-base sm:text-lg text-[#fec83e] tracking-wider">
                {user.username}
              </h2>
              <p className="font-silkscreen text-xs text-[#a394c4] mt-0.5">
                {user.title}
              </p>

              {/* Streak Badge */}
              <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 bg-[#231b38] border border-[#3e325c]">
                <PixelIcon name="flame" size={16} />
                <span className="font-pixel text-[11px] text-[#fec83e]">
                  STREAK: {user.streak} {user.streak === 1 ? 'DAY' : 'DAYS'}
                </span>
              </div>

              {/* Level XP Progress */}
              <div className="w-full space-y-2 mt-4 text-left">
                <StatBar
                  label="LEVEL PROGRESS"
                  current={user.xp}
                  max={user.maxXp}
                  type="xp"
                />
              </div>

              {/* Action */}
              <div className="w-full mt-4">
                <PixelButton
                  variant="gold"
                  size="sm"
                  className="w-full"
                  onClick={() => onNavigate('character')}
                >
                  VIEW TRAINER CARD ▶
                </PixelButton>
              </div>
            </div>
          </RpgWindow>
        </div>

        {/* Right Column: Achievements */}
        <div className="lg:col-span-7 flex flex-col">
          <RpgWindow
            variant="parchment"
            title="ACHIEVEMENTS"
            subtitle="Honors unlocked through consistent action"
            headerRight={
              <button
                onClick={() => onNavigate('achievements')}
                className="font-pixel text-[10px] text-[#2563eb] hover:underline cursor-pointer"
              >
                VIEW ALL ({unlockedBadges.length}/{badges.length}) ▶
              </button>
            }
          >
            <div className="space-y-3">
              {/* Progress Summary */}
              <div className="flex items-center justify-between p-2.5 bg-[#ede3ce] border-2 border-[#120e1d]">
                <span className="font-pixel text-xs text-[#181425]">
                  BADGES UNLOCKED
                </span>
                <span className="font-pixel text-xs font-bold text-[#b45309]">
                  {unlockedBadges.length} / {badges.length}
                </span>
              </div>

              {unlockedBadges.length === 0 ? (
                <div className="text-center py-8 bg-[#ede3ce] border-2 border-dashed border-[#b8aa92]">
                  <div className="font-pixel text-xs text-[#3b324d] mb-1">
                    NO BADGES UNLOCKED YET
                  </div>
                  <p className="font-silkscreen text-[11px] text-[#6e634e] max-w-xs mx-auto">
                    Complete your daily tasks and battle rivals to earn your first prestigious achievements!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {unlockedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-2.5 bg-[#fcf8f0] border-2 border-[#181425] p-2.5 shadow-[2px_2px_0px_#181425]"
                    >
                      <div className="w-9 h-9 bg-[#241c38] border border-[#120e1d] flex items-center justify-center shrink-0">
                        <PixelIcon name={badge.icon} size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-pixel text-xs text-[#141022] block truncate font-bold">
                          {badge.name}
                        </span>
                        <p className="font-silkscreen text-[10px] text-[#5e5443] truncate">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </RpgWindow>
        </div>
      </div>

      {/* TODAY'S TASKS SECTION */}
      <RpgWindow
        variant="parchment"
        title="TODAY'S TASKS"
        subtitle="Complete real-world tasks to power up your character"
        headerRight={
          <PixelButton
            variant="parchment"
            size="sm"
            onClick={() => onNavigate('quests')}
          >
            OPEN QUEST BOARD ▶
          </PixelButton>
        }
      >
        {activeQuests.length === 0 ? (
          <div className="text-center py-8 bg-[#ede3ce] border-2 border-dashed border-[#b8aa92]">
            <div className="font-pixel text-sm text-[#3b324d] mb-1">
              ALL TASKS CLEARED FOR TODAY!
            </div>
            <p className="font-silkscreen text-xs text-[#6e634e] mb-4">
              Your discipline is remarkable. Forge new real-world challenges on the Quest Board.
            </p>
            <PixelButton
              variant="green"
              size="md"
              onClick={() => onNavigate('quests')}
            >
              FORGE NEW QUEST
            </PixelButton>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeQuests.slice(0, 6).map((quest) => {
              const deadlineInfo = formatQuestDeadline(quest.deadline, quest.isDaily);

              return (
                <div
                  key={quest.id}
                  className="bg-[#fcf8f0] border-2 border-[#120e1d] p-3.5 shadow-[2px_2px_0px_#120e1d] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-pixel text-[9px] bg-[#e0f2fe] text-[#0369a1] px-1.5 py-0.5 border border-[#bae6fd]">
                          {quest.category}
                        </span>
                        {quest.isDaily && (
                          <span className="font-pixel text-[9px] bg-[#ecfdf5] text-[#065f46] px-1.5 py-0.5 border border-[#6ee7b7] font-bold">
                            DAILY
                          </span>
                        )}
                      </div>
                      <span className="font-pixel text-[10px] text-[#b45309] font-bold">
                        {quest.difficulty === 'EASY'
                          ? '★ EASY'
                          : quest.difficulty === 'MEDIUM'
                          ? '★★ MEDIUM'
                          : quest.difficulty === 'HARD'
                          ? '★★★ HARD'
                          : '★★★★ EPIC'}
                      </span>
                    </div>

                    <h4 className="font-pixel text-xs sm:text-sm text-[#181425] leading-snug">
                      {quest.title}
                    </h4>
                    <p className="font-silkscreen text-[11px] text-[#5e5443] mt-1 leading-relaxed">
                      {quest.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#d4c5a9] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div
                      className={`font-pixel text-[10px] px-2 py-1 border inline-flex items-center gap-1.5 ${
                        deadlineInfo.isOverdue
                          ? 'bg-[#fee2e2] text-[#991b1b] border-[#f87171] font-bold'
                          : deadlineInfo.isToday
                          ? 'bg-[#fef3c7] text-[#92400e] border-[#fcd34d] font-bold'
                          : 'bg-[#f1f5f9] text-[#334155] border-[#cbd5e1]'
                      }`}
                    >
                      <span>{deadlineInfo.label}</span>
                    </div>

                    <PixelButton
                      variant="green"
                      size="sm"
                      onClick={() => onCompleteQuest(quest.id)}
                    >
                      COMPLETE ✓
                    </PixelButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </RpgWindow>
    </div>
  );
};
