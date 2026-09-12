import React, { useState, useEffect } from 'react';
import { Quest, QuestCategory, QuestDifficulty, AttributeType } from '../../types';
import { RpgWindow } from '../rpg/RpgWindow';
import { PixelButton } from '../rpg/PixelButton';
import { chiptune } from '../../services/audio';

export function formatQuestDeadline(deadline?: string, isDaily?: boolean): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
} {
  if (isDaily && !deadline) {
    return {
      label: 'Daily Task (Resets at midnight)',
      isOverdue: false,
      isToday: true,
    };
  }

  if (!deadline) {
    return {
      label: 'No time limit set',
      isOverdue: false,
      isToday: false,
    };
  }

  try {
    const d = new Date(deadline);
    if (isNaN(d.getTime())) {
      return {
        label: isDaily ? `Daily • ${deadline}` : `Deadline: ${deadline}`,
        isOverdue: false,
        isToday: false,
      };
    }

    const now = new Date();
    const isOverdue = d.getTime() < now.getTime();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const dateStr = d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });

    let label = '';
    if (isToday) {
      label = isOverdue
        ? `Overdue (Due today at ${timeStr})`
        : `Due today at ${timeStr}`;
    } else if (isOverdue) {
      label = `Overdue: ${dateStr} at ${timeStr}`;
    } else {
      label = `Deadline: ${dateStr} at ${timeStr}`;
    }

    if (isDaily) {
      label = `Daily Task • ${label}`;
    }

    return { label, isOverdue, isToday };
  } catch {
    return {
      label: `Deadline: ${deadline}`,
      isOverdue: false,
      isToday: false,
    };
  }
}

interface QuestBoardScreenProps {
  quests: Quest[];
  onCompleteQuest: (questId: string) => void;
  onCreateQuest: (newQuest: Omit<Quest, 'id' | 'status' | 'completedAt'>) => void;
  onDeleteQuest?: (questId: string) => void;
}

export const QuestBoardScreen: React.FC<QuestBoardScreenProps> = ({
  quests,
  onCompleteQuest,
  onCreateQuest,
  onDeleteQuest,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [isCreatingQuest, setIsCreatingQuest] = useState<boolean>(false);

  // Form State for Forge Quest
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<QuestCategory>('WORKOUT');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('MEDIUM');
  const [isDaily, setIsDaily] = useState<boolean>(false);
  const [hasDeadline, setHasDeadline] = useState<boolean>(false);
  const [deadline, setDeadline] = useState<string>('');

  // Handle Escape key to close Forge Quest modal
  useEffect(() => {
    if (!isCreatingQuest) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreatingQuest(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreatingQuest]);

  const categories = ['ALL', 'DAILY TASKS', 'WORKOUT', 'STUDY', 'DISCIPLINE', 'WELLNESS', 'WORK', 'CREATIVITY'];

  const filteredQuests = quests.filter((q) => {
    const matchesStatus = q.status === statusFilter;
    let matchesCategory = true;
    if (selectedCategory === 'DAILY TASKS') {
      matchesCategory = !!q.isDaily;
    } else if (selectedCategory !== 'ALL') {
      matchesCategory = q.category === selectedCategory;
    }
    return matchesStatus && matchesCategory;
  });

  const getDifficultyRewards = (diff: QuestDifficulty) => {
    switch (diff) {
      case 'EASY':
        return { xp: 50 };
      case 'MEDIUM':
        return { xp: 100 };
      case 'HARD':
        return { xp: 180 };
      case 'EPIC':
        return { xp: 320 };
    }
  };

  // Attribute mappings scaled by difficulty:
  // - EASY: 1x base points (sub-stats +1)
  // - MEDIUM: 2x base points (sub-stats +1)
  // - HARD: 3x base points (sub-stats +2)
  // - EPIC: 5x base points (sub-stats +3)
  // Categories:
  // - STUDY: improves Intelligence (int) & Resilience (res)
  // - WORKOUT: improves Strength (str), Endurance (end), Resilience (res)
  // - DISCIPLINE: related with consistency and deadlines -> Discipline (dis) & Resilience (res)
  // - WELLNESS: health (sleep, water, habits) -> improves ALL attributes scaled with difficulty
  // - WORK: improves Intelligence (int), Endurance (end), Willpower (wil), Resilience (res)
  // - CREATIVITY: gives special power (amplifies Willpower wil & Intelligence int)
  const getCategoryAttributes = (cat: QuestCategory, diff: QuestDifficulty): Partial<Record<AttributeType, number>> => {
    const mainBonus = diff === 'EASY' ? 1 : diff === 'MEDIUM' ? 2 : diff === 'HARD' ? 3 : 5;
    const subBonus = diff === 'EASY' ? 1 : diff === 'MEDIUM' ? 1 : diff === 'HARD' ? 2 : 3;
    const allStatsBonus = diff === 'EASY' ? 1 : diff === 'MEDIUM' ? 1 : diff === 'HARD' ? 2 : 3;

    switch (cat) {
      case 'WORKOUT':
        return { str: mainBonus, end: subBonus, res: subBonus };
      case 'STUDY':
        return { int: mainBonus, res: subBonus };
      case 'DISCIPLINE':
        return { dis: mainBonus, res: subBonus };
      case 'WELLNESS':
        return {
          str: allStatsBonus,
          int: allStatsBonus,
          end: allStatsBonus,
          res: allStatsBonus,
          dis: allStatsBonus,
          wil: allStatsBonus,
        };
      case 'WORK':
        return { int: mainBonus, end: subBonus, wil: subBonus, res: subBonus };
      case 'CREATIVITY':
        return { wil: mainBonus, int: mainBonus };
      default:
        return { wil: mainBonus };
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const { xp } = getDifficultyRewards(difficulty);

    onCreateQuest({
      title: title.trim(),
      description: description.trim() || 'Real-world accomplishment.',
      category,
      difficulty,
      xpReward: xp,
      goldReward: 0,
      attributeRewards: getCategoryAttributes(category, difficulty),
      isDaily,
      deadline: hasDeadline && deadline ? deadline : undefined,
    });

    chiptune.playSelect();
    setTitle('');
    setDescription('');
    setIsDaily(false);
    setHasDeadline(false);
    setDeadline('');
    setIsCreatingQuest(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#f5eedb] border-4 border-[#120e1d] p-4 shadow-[4px_4px_0px_#120e1d]">
        <div>
          <h2 className="font-pixel text-base sm:text-lg text-[#181425]">
            NOTICE BOARD OF DEEDS
          </h2>
          <p className="font-silkscreen text-xs text-[#63553e] mt-0.5">
            Turn tasks into legendary RPG deeds. Real-world effort builds real character.
          </p>
        </div>

        <PixelButton
          variant="gold"
          size="md"
          onClick={() => {
            chiptune.playSelect();
            setIsCreatingQuest(true);
          }}
        >
          + FORGE NEW QUEST
        </PixelButton>
      </div>

      {/* Categories & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#201933] border-4 border-[#120e1d] p-2.5">
        <div className="flex flex-wrap items-center gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={selectedCategory === cat}
              onClick={() => {
                chiptune.playCursor();
                setSelectedCategory(cat);
              }}
              className={`font-pixel text-[10px] px-2.5 py-1.5 border transition-all cursor-pointer min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec83e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#201933] ${
                selectedCategory === cat
                  ? 'bg-[#fec83e] text-[#1c172b] border-black font-bold'
                  : 'bg-[#2f2549] text-[#e0d6f5] border-[#443864] hover:bg-[#3d325b]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Toggle */}
        <div className="flex items-center gap-1 font-pixel text-[10px]">
          <button
            type="button"
            aria-pressed={statusFilter === 'ACTIVE'}
            onClick={() => {
              chiptune.playCursor();
              setStatusFilter('ACTIVE');
            }}
            className={`px-2.5 py-1.5 border cursor-pointer min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec83e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#201933] ${
              statusFilter === 'ACTIVE'
                ? 'bg-[#38b764] text-[#0d2a15] border-black font-bold'
                : 'bg-[#2f2549] text-[#e0d6f5] border-[#443864]'
            }`}
          >
            ACTIVE
          </button>
          <button
            type="button"
            aria-pressed={statusFilter === 'COMPLETED'}
            onClick={() => {
              chiptune.playCursor();
              setStatusFilter('COMPLETED');
            }}
            className={`px-2.5 py-1.5 border cursor-pointer min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec83e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#201933] ${
              statusFilter === 'COMPLETED'
                ? 'bg-[#38b764] text-[#0d2a15] border-black font-bold'
                : 'bg-[#2f2549] text-[#e0d6f5] border-[#443864]'
            }`}
          >
            COMPLETED
          </button>
        </div>
      </div>

      {/* Quest List in Tile Format - One Below Another */}
      {filteredQuests.length === 0 ? (
        <RpgWindow variant="parchment">
          <div className="text-center py-12">
            <div className="font-pixel text-sm text-[#181425] mb-2">
              NO QUESTS FOUND IN THIS CATEGORY
            </div>
            <p className="font-silkscreen text-xs text-[#6e634e] mb-4">
              The bulletin is quiet. Add a new goal to continue your training.
            </p>
            <PixelButton
              variant="green"
              size="md"
              onClick={() => setIsCreatingQuest(true)}
            >
              FORGE NEW QUEST
            </PixelButton>
          </div>
        </RpgWindow>
      ) : (
        <div className="flex flex-col gap-3.5">
          {filteredQuests.map((quest) => {
            const isCompleted = quest.status === 'COMPLETED';
            const deadlineInfo = formatQuestDeadline(quest.deadline, quest.isDaily);

            return (
              <div
                key={quest.id}
                className={`relative border-4 border-[#120e1d] p-4 sm:p-5 shadow-[4px_4px_0px_#120e1d] flex flex-col justify-between transition-all ${
                  isCompleted
                    ? 'bg-[#e5dcc7] opacity-80'
                    : 'bg-[#fcf8f0] hover:translate-x-0.5 hover:-translate-y-0.5'
                }`}
              >
                <div>
                  {/* Category, Daily Badge, Difficulty Tag & Delete */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-pixel text-[9px] sm:text-[10px] bg-[#dbeafe] text-[#1e40af] px-2 py-0.5 border border-[#93c5fd] tracking-wider">
                        {quest.category}
                      </span>
                      {quest.isDaily && (
                        <span className="font-pixel text-[9px] sm:text-[10px] bg-[#ecfdf5] text-[#065f46] px-2 py-0.5 border border-[#6ee7b7] font-bold">
                          DAILY TASK
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-pixel text-[10px] sm:text-[11px] text-[#b45309] tracking-widest font-bold">
                        {quest.difficulty === 'EASY'
                          ? '★ EASY'
                          : quest.difficulty === 'MEDIUM'
                          ? '★★ MEDIUM'
                          : quest.difficulty === 'HARD'
                          ? '★★★ HARD'
                          : '★★★★ EPIC'}
                      </span>
                      {onDeleteQuest && !isCompleted && (
                        <button
                          type="button"
                          onClick={() => onDeleteQuest(quest.id)}
                          title={`Abandon quest: ${quest.title}`}
                          aria-label={`Abandon quest: ${quest.title}`}
                          className="font-pixel text-xs text-[#991b1b] hover:text-[#dc2626] cursor-pointer px-1.5 py-0.5 hover:bg-[#fee2e2] transition-colors border border-transparent hover:border-[#fca5a5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Task Name */}
                  <h3
                    className={`font-pixel text-sm sm:text-base text-[#181425] leading-snug ${
                      isCompleted ? 'line-through text-[#6b6254]' : ''
                    }`}
                  >
                    {quest.title}
                  </h3>

                  {/* Task Description */}
                  <p className="font-silkscreen text-xs text-[#524939] mt-1.5 leading-relaxed">
                    {quest.description}
                  </p>
                </div>

                {/* Footer Row: Time Limit / Deadline and Complete action (NO points displayed) */}
                <div className="mt-4 pt-3 border-t-2 border-[#d4c5a9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Time limit or Deadline Display */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`font-pixel text-[11px] sm:text-xs px-2.5 py-1.5 border flex items-center gap-1.5 ${
                        isCompleted
                          ? 'bg-[#e2d8c0] text-[#786c57] border-[#c0b396]'
                          : deadlineInfo.isOverdue
                          ? 'bg-[#fee2e2] text-[#991b1b] border-[#f87171] font-bold'
                          : deadlineInfo.isToday
                          ? 'bg-[#fef3c7] text-[#92400e] border-[#fcd34d] font-bold'
                          : 'bg-[#f1f5f9] text-[#334155] border-[#cbd5e1]'
                      }`}
                    >
                      <span>{deadlineInfo.label}</span>
                    </div>
                  </div>

                  {/* Completion Action Button */}
                  <div>
                    {!isCompleted ? (
                      <PixelButton
                        variant="green"
                        size="sm"
                        aria-label={`Complete quest: ${quest.title}`}
                        onClick={() => onCompleteQuest(quest.id)}
                      >
                        COMPLETE ✓
                      </PixelButton>
                    ) : (
                      <span className="font-pixel text-[10px] text-[#15803d] bg-[#dcfce7] px-3 py-1.5 border-2 border-[#86efac] font-bold">
                        CLEARED ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORGE NEW QUEST MODAL */}
      {isCreatingQuest && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 select-none backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forge-quest-modal-title"
        >
          <div className="relative w-full max-w-md border-4 border-[#120e1d] bg-[#f5eedb] text-[#1c172b] p-4 sm:p-5 shadow-[6px_6px_0px_#000] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 border-b-2 border-[#d4c5a9] pb-2">
              <h3 id="forge-quest-modal-title" className="font-pixel text-sm text-[#181425]">
                FORGE REAL-LIFE QUEST
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingQuest(false)}
                aria-label="Close quest forge dialog"
                className="font-pixel text-xs text-[#ef4444] cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444] p-1"
              >
                ✕ CLOSE
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3 font-pixel text-xs">
              {/* Task Title */}
              <div>
                <label htmlFor="quest-title-input" className="block text-[10px] text-[#2b2540] mb-1">
                  QUEST TITLE / TASK NAME:
                </label>
                <input
                  id="quest-title-input"
                  type="text"
                  required
                  placeholder="e.g., 45-Min Workout / Finish Biology Chapter"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#fcf8f0] border-2 border-[#120e1d] p-2 font-pixel text-xs text-[#181425] focus:outline-none focus:ring-2 focus:ring-[#fec83e]"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="quest-desc-input" className="block text-[10px] text-[#2b2540] mb-1">
                  DESCRIPTION / OBJECTIVE:
                </label>
                <textarea
                  id="quest-desc-input"
                  rows={2}
                  placeholder="Specific parameters for victory..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#fcf8f0] border-2 border-[#120e1d] p-2 font-silkscreen text-xs text-[#181425] focus:outline-none focus:ring-2 focus:ring-[#fec83e]"
                />
              </div>

              {/* Category & Difficulty */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="quest-category-select" className="block text-[10px] text-[#2b2540] mb-1">
                    CATEGORY:
                  </label>
                  <select
                    id="quest-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as QuestCategory)}
                    className="w-full bg-[#fcf8f0] border-2 border-[#120e1d] p-1.5 font-pixel text-[10px] text-[#181425] focus:outline-none focus:ring-2 focus:ring-[#fec83e]"
                  >
                    <option value="WORKOUT">WORKOUT</option>
                    <option value="STUDY">STUDY</option>
                    <option value="DISCIPLINE">DISCIPLINE</option>
                    <option value="WELLNESS">WELLNESS</option>
                    <option value="WORK">WORK</option>
                    <option value="CREATIVITY">CREATIVITY</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="quest-difficulty-select" className="block text-[10px] text-[#2b2540] mb-1">
                    DIFFICULTY:
                  </label>
                  <select
                    id="quest-difficulty-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as QuestDifficulty)}
                    className="w-full bg-[#fcf8f0] border-2 border-[#120e1d] p-1.5 font-pixel text-[10px] text-[#181425] focus:outline-none focus:ring-2 focus:ring-[#fec83e]"
                  >
                    <option value="EASY">★ EASY</option>
                    <option value="MEDIUM">★★ MEDIUM</option>
                    <option value="HARD">★★★ HARD</option>
                    <option value="EPIC">★★★★ EPIC</option>
                  </select>
                </div>
              </div>

              {/* Daily Task Setting */}
              <div className="bg-[#ede3ce] border-2 border-[#120e1d] p-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDaily}
                    onChange={(e) => setIsDaily(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#38b764] cursor-pointer"
                  />
                  <div>
                    <div className="font-pixel text-[11px] text-[#181425] font-bold">
                      SET AS DAILY QUEST / DAILY TASK
                    </div>
                    <div className="font-silkscreen text-[10px] text-[#5e533e] mt-0.5">
                      Repeats every day to build long-term real-life habits.
                    </div>
                  </div>
                </label>
              </div>

              {/* Deadline Setting Option with Date & Time picker */}
              <div className="bg-[#ede3ce] border-2 border-[#120e1d] p-2.5 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasDeadline}
                    onChange={(e) => {
                      setHasDeadline(e.target.checked);
                      if (e.target.checked && !deadline) {
                        const now = new Date();
                        now.setHours(23, 59, 0, 0);
                        const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                          .toISOString()
                          .slice(0, 16);
                        setDeadline(iso);
                      }
                    }}
                    className="mt-0.5 h-4 w-4 accent-[#3b82f6] cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-pixel text-[11px] text-[#181425] font-bold">
                      SET DEADLINE (DATE & TIME)
                    </div>
                    <div className="font-silkscreen text-[10px] text-[#5e533e] mt-0.5">
                      Specify an exact date and time limit for completion.
                    </div>
                  </div>
                </label>

                {hasDeadline && (
                  <div className="pt-2 border-t border-[#c8bba3]">
                    <label htmlFor="quest-deadline-input" className="block text-[10px] text-[#2b2540] mb-1">
                      SELECT DEADLINE DATE & TIME:
                    </label>
                    <input
                      id="quest-deadline-input"
                      type="datetime-local"
                      required={hasDeadline}
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-[#fcf8f0] border-2 border-[#120e1d] p-2 font-pixel text-xs text-[#181425] focus:outline-none focus:ring-2 focus:ring-[#fec83e]"
                    />
                  </div>
                )}
              </div>

              {/* Form Submit & Cancel Actions */}
              <div className="flex gap-2 pt-2">
                <PixelButton
                  type="button"
                  variant="parchment"
                  size="md"
                  onClick={() => setIsCreatingQuest(false)}
                >
                  CANCEL
                </PixelButton>
                <PixelButton type="submit" variant="gold" size="md" className="flex-1">
                  PIN TO BOARD ▶
                </PixelButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
