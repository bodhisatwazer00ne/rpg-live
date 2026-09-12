import { 
  User, Quest, Badge, GameState 
} from '../types';
import { 
  calculateXpForLevel,
  getTrainerTitleForLevel,
  getNextTrainerRankMilestone,
  getAvatarForLevel,
  INITIAL_BADGES,
} from '../data/initialData';
import { computeEffectiveAttributes, deriveMaxVitals } from './storage';

export {
  calculateXpForLevel,
  getTrainerTitleForLevel,
  getNextTrainerRankMilestone,
  getAvatarForLevel,
};

export interface LevelUpEvent {
  oldLevel: number;
  newLevel: number;
  oldTitle: string;
  newTitle: string;
  isNewTitle: boolean;
  avatarId?: string;
  statPointsGained: number;
  attributeIncreases: {
    str: number;
    int: number;
    end: number;
    res: number;
    dis: number;
    wil: number;
  };
}

export function applyXpGain(user: User, xpGain: number): { updatedUser: User; levelUpEvent: LevelUpEvent | null } {
  return processXpGain(user, xpGain);
}

export function checkAndUnlockBadges(state: GameState): { updatedBadges: Badge[]; newlyUnlocked: Badge[] } {
  const previousUnlockedIds = new Set(state.badges.filter(b => b.unlockedAt).map(b => b.id));
  const newlyUnlocked = evaluateBadges(state);
  return {
    updatedBadges: state.badges,
    newlyUnlocked,
  };
}

export function resolveQuestCompletion(
  user: User,
  quests: Quest[],
  questId: string
): { updatedUser: User; updatedQuest: Quest; levelUpEvent: LevelUpEvent | null } {
  const quest = quests.find(q => q.id === questId);
  if (!quest) {
    throw new Error(`Quest ${questId} not found`);
  }

  // Update streak and calculate daily streak attribute bonuses
  const { updatedStreak, newDate, streakBonusAwarded } = updateDailyStreak(user);

  // Apply Attribute Rewards from Quest
  let updatedAttrs = { ...user.attributes };
  if (quest.attributeRewards) {
    Object.entries(quest.attributeRewards).forEach(([stat, val]) => {
      const key = stat as keyof typeof updatedAttrs;
      if (typeof updatedAttrs[key] === 'number') {
        updatedAttrs[key] += val;
      }
    });
  }

  // Daily task completion boosts endurance, resilience, discipline, willpower
  if (quest.isDaily) {
    updatedAttrs.end += 1;
    updatedAttrs.res += 1;
    updatedAttrs.dis += 1;
    updatedAttrs.wil += 1;
  }

  // When streak increments on consecutive days, award extra endurance, resilience, discipline, willpower
  if (streakBonusAwarded) {
    updatedAttrs.end += 1;
    updatedAttrs.res += 1;
    updatedAttrs.dis += 1;
    updatedAttrs.wil += 1;
  }

  // HP derived from endurance, willpower, and resilience (cultivated by workout & wellness)
  const { maxHp, maxStamina } = deriveMaxVitals(
    updatedAttrs.end,
    updatedAttrs.dis,
    user.level,
    updatedAttrs.wil,
    updatedAttrs.res
  );

  let updatedUser: User = {
    ...user,
    streak: updatedStreak,
    lastActiveDate: newDate,
    attributes: updatedAttrs,
    maxHp,
    maxStamina,
    hp: Math.min(user.hp + (quest.isDaily ? 5 : 0), maxHp),
    stamina: Math.min(user.stamina + 5, maxStamina),
  };

  // Process XP and Level Up
  const { updatedUser: userAfterXp, levelUpEvent } = processXpGain(updatedUser, quest.xpReward);

  const updatedQuest: Quest = {
    ...quest,
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
  };

  return {
    updatedUser: userAfterXp,
    updatedQuest,
    levelUpEvent,
  };
}

export function processXpGain(user: User, xpGain: number): { updatedUser: User; levelUpEvent: LevelUpEvent | null } {
  let currentXp = user.xp + xpGain;
  let currentLevel = user.level;
  let maxXp = user.maxXp;
  let statPointsGained = 0;
  const initialLevel = user.level;

  const totalAttrIncreases = { str: 0, int: 0, end: 0, res: 0, dis: 0, wil: 0 };

  while (currentXp >= maxXp) {
    currentXp -= maxXp;
    currentLevel += 1;
    maxXp = calculateXpForLevel(currentLevel);
    statPointsGained += 2;

    // Automatic minor attribute bump based on class or balanced
    totalAttrIncreases.str += 1;
    totalAttrIncreases.int += 1;
    totalAttrIncreases.end += 1;
    totalAttrIncreases.res += 1;
    totalAttrIncreases.dis += 1;
    totalAttrIncreases.wil += 1;
  }

  const updatedAttrs = {
    str: user.attributes.str + totalAttrIncreases.str,
    int: user.attributes.int + totalAttrIncreases.int,
    end: user.attributes.end + totalAttrIncreases.end,
    res: user.attributes.res + totalAttrIncreases.res,
    dis: user.attributes.dis + totalAttrIncreases.dis,
    wil: user.attributes.wil + totalAttrIncreases.wil,
  };

  const { maxHp, maxStamina } = deriveMaxVitals(
    updatedAttrs.end,
    updatedAttrs.dis,
    currentLevel,
    updatedAttrs.wil,
    updatedAttrs.res
  );

  const oldTitle = user.title || getTrainerTitleForLevel(initialLevel);
  const newTitle = getTrainerTitleForLevel(currentLevel);
  const isNewTitle = newTitle !== oldTitle;
  const newAvatarId = getAvatarForLevel(currentLevel, user.avatarId);

  const updatedUser: User = {
    ...user,
    level: currentLevel,
    title: newTitle,
    avatarId: newAvatarId,
    xp: currentXp,
    maxXp,
    // On level-up, fully restore vitals!
    hp: currentLevel > initialLevel ? maxHp : Math.min(user.hp, maxHp),
    maxHp,
    stamina: currentLevel > initialLevel ? maxStamina : Math.min(user.stamina, maxStamina),
    maxStamina,
    statPoints: user.statPoints + statPointsGained,
    attributes: updatedAttrs,
    updatedAt: new Date().toISOString(),
  };

  const levelUpEvent: LevelUpEvent | null = currentLevel > initialLevel ? {
    oldLevel: initialLevel,
    newLevel: currentLevel,
    oldTitle,
    newTitle,
    isNewTitle,
    avatarId: newAvatarId,
    statPointsGained,
    attributeIncreases: totalAttrIncreases,
  } : null;

  return { updatedUser, levelUpEvent };
}

export function updateDailyStreak(user: User): { updatedStreak: number; newDate: string; streakBonusAwarded: boolean } {
  const today = new Date().toISOString().split('T')[0];
  if (user.lastActiveDate === today) {
    return { updatedStreak: user.streak, newDate: today, streakBonusAwarded: false };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let newStreak = user.streak;
  let streakBonusAwarded = false;

  if (user.lastActiveDate === yesterday) {
    newStreak += 1;
    streakBonusAwarded = true;
  } else {
    newStreak = 1;
  }

  return { updatedStreak: newStreak, newDate: today, streakBonusAwarded };
}

export function evaluateBadges(state: GameState, lastCompletedQuestId?: string): Badge[] {
  const newlyUnlocked: Badge[] = [];
  const completedQuests = state.quests.filter((q) => q.status === 'COMPLETED');
  const completedCount = completedQuests.length;
  const effective = computeEffectiveAttributes(state.user, state.inventory, state.items);

  // Category counts
  const workoutCount = completedQuests.filter((q) => q.category === 'WORKOUT').length;
  const studyCount = completedQuests.filter((q) => q.category === 'STUDY').length;
  const disciplineCount = completedQuests.filter((q) => q.category === 'DISCIPLINE').length;
  const wellnessCount = completedQuests.filter((q) => q.category === 'WELLNESS').length;
  const creativityCount = completedQuests.filter((q) => q.category === 'CREATIVITY').length;
  const workCount = completedQuests.filter((q) => q.category === 'WORK').length;

  // Difficulty counts
  const hardCount = completedQuests.filter((q) => q.difficulty === 'HARD').length;
  const epicCount = completedQuests.filter((q) => q.difficulty === 'EPIC').length;

  // Ensure current user's badges list has all initial badges known
  const existingBadgeIds = new Set(state.badges.map((b) => b.id));
  const fullBadgesList = [
    ...state.badges,
    ...INITIAL_BADGES.filter((b) => !existingBadgeIds.has(b.id)),
  ];

  const updatedBadges = fullBadgesList.map((badge) => {
    if (badge.unlockedAt) return badge; // already unlocked

    let shouldUnlock = false;

    // Progression
    if (badge.id === 'badge-first-quest' && completedCount >= 1) shouldUnlock = true;
    else if (badge.id === 'badge-quests-10' && completedCount >= 10) shouldUnlock = true;
    else if (badge.id === 'badge-quests-25' && completedCount >= 25) shouldUnlock = true;
    else if (badge.id === 'badge-quests-50' && completedCount >= 50) shouldUnlock = true;
    else if (badge.id === 'badge-level-10' && state.user.level >= 10) shouldUnlock = true;
    else if (badge.id === 'badge-level-20' && state.user.level >= 20) shouldUnlock = true;

    // Consistency & Streaks
    else if (badge.id === 'badge-streak-3' && state.user.streak >= 3) shouldUnlock = true;
    else if (badge.id === 'badge-streak-7' && state.user.streak >= 7) shouldUnlock = true;
    else if (badge.id === 'badge-streak-14' && state.user.streak >= 14) shouldUnlock = true;
    else if (badge.id === 'badge-streak-30' && state.user.streak >= 30) shouldUnlock = true;

    // Category: Workout
    else if (badge.id === 'badge-cat-workout-1' && workoutCount >= 1) shouldUnlock = true;
    else if (badge.id === 'badge-cat-workout-5' && workoutCount >= 5) shouldUnlock = true;
    else if (badge.id === 'badge-cat-workout-15' && workoutCount >= 15) shouldUnlock = true;

    // Category: Study
    else if (badge.id === 'badge-cat-study-1' && studyCount >= 1) shouldUnlock = true;
    else if (badge.id === 'badge-cat-study-5' && studyCount >= 5) shouldUnlock = true;
    else if (badge.id === 'badge-cat-study-15' && studyCount >= 15) shouldUnlock = true;

    // Category: Discipline
    else if (badge.id === 'badge-cat-discipline-1' && disciplineCount >= 1) shouldUnlock = true;
    else if (badge.id === 'badge-cat-discipline-5' && disciplineCount >= 5) shouldUnlock = true;
    else if (badge.id === 'badge-cat-discipline-15' && disciplineCount >= 15) shouldUnlock = true;

    // Category: Wellness
    else if (badge.id === 'badge-cat-wellness-1' && wellnessCount >= 1) shouldUnlock = true;
    else if (badge.id === 'badge-cat-wellness-5' && wellnessCount >= 5) shouldUnlock = true;
    else if (badge.id === 'badge-cat-wellness-15' && wellnessCount >= 15) shouldUnlock = true;

    // Category: Creativity
    else if (badge.id === 'badge-cat-creativity-1' && creativityCount >= 1) shouldUnlock = true;
    else if (badge.id === 'badge-cat-creativity-5' && creativityCount >= 5) shouldUnlock = true;
    else if (badge.id === 'badge-cat-creativity-15' && creativityCount >= 15) shouldUnlock = true;

    // Category: Work
    else if (badge.id === 'badge-cat-work-1' && workCount >= 1) shouldUnlock = true;
    else if (badge.id === 'badge-cat-work-5' && workCount >= 5) shouldUnlock = true;
    else if (badge.id === 'badge-cat-work-15' && workCount >= 15) shouldUnlock = true;

    // Difficulty
    else if (badge.id === 'badge-diff-hard-1' && hardCount >= 1) shouldUnlock = true;
    else if (badge.id === 'badge-diff-hard-5' && hardCount >= 5) shouldUnlock = true;
    else if (badge.id === 'badge-diff-epic-1' && epicCount >= 1) shouldUnlock = true;
    else if (badge.id === 'badge-diff-epic-3' && epicCount >= 3) shouldUnlock = true;

    // Combat & Arena
    else if (badge.id === 'badge-first-battle' && state.defeatedRivalsCount >= 1) shouldUnlock = true;
    else if (badge.id === 'badge-combat-5' && state.defeatedRivalsCount >= 5) shouldUnlock = true;
    else if (badge.id === 'badge-combat-10' && state.defeatedRivalsCount >= 10) shouldUnlock = true;
    else if (badge.id === 'badge-live-duel-1' && state.defeatedRivalsCount >= 1) shouldUnlock = true;

    // Attribute Milestones
    else if (badge.id === 'badge-strength-20' && effective.total.str >= 20) shouldUnlock = true;
    else if (badge.id === 'badge-intellect-20' && effective.total.int >= 20) shouldUnlock = true;
    else if (badge.id === 'badge-endurance-20' && effective.total.end >= 20) shouldUnlock = true;
    else if (badge.id === 'badge-resilience-20' && effective.total.res >= 20) shouldUnlock = true;
    else if (badge.id === 'badge-discipline-20' && effective.total.dis >= 20) shouldUnlock = true;
    else if (badge.id === 'badge-willpower-20' && effective.total.wil >= 20) shouldUnlock = true;

    if (shouldUnlock) {
      const unlocked = { ...badge, unlockedAt: new Date().toISOString() };
      newlyUnlocked.push(unlocked);
      return unlocked;
    }

    return badge;
  });

  state.badges = updatedBadges;
  return newlyUnlocked;
}

export function calculateBattleDamage(
  attackerStr: number,
  defenderRes: number,
  isSpecial: boolean,
  isDefending: boolean,
  critChance: number = 0.1,
  attackerLevel: number = 1,
  attackerDis: number = 0,
  attackerWil: number = 0,
  attackerWellnessBonus: number = 0
): { damage: number; isCrit: boolean } {
  const lvl = Math.max(1, attackerLevel);

  // Attack power incorporates Strength, Discipline, Willpower, and Wellness (overall physical-mental vitality)
  // Base attack power formula:
  const attackRating = attackerStr * 1.0 + attackerDis * 0.4 + attackerWil * 0.35 + attackerWellnessBonus * 0.25;

  const baseDamage = isSpecial
    ? (14 + lvl * 4.2 + attackRating * 1.7) - (defenderRes * 0.3)
    : (8 + lvl * 2.8 + attackRating * 1.35) - (defenderRes * 0.35);

  const variance = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
  let finalDamage = Math.max(isSpecial ? 12 : 7, Math.floor(baseDamage + variance));

  const isCrit = Math.random() < critChance;
  if (isCrit) {
    finalDamage = Math.floor(finalDamage * 1.55);
  }

  if (isDefending) {
    finalDamage = Math.max(3, Math.floor(finalDamage * 0.5));
  }

  return { damage: finalDamage, isCrit };
}
