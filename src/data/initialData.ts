import { Item, Badge, Rival, Quest, Specialization, LeaderboardEntry, User } from '../types';

export interface ArchetypeInfo {
  id: Specialization;
  name: string;
  role: string;
  description: string;
  bonuses: string;
  initialAttributes: {
    str: number;
    int: number;
    end: number;
    res: number;
    dis: number;
    wil: number;
  };
  starterWeaponId: string;
}

export const ARCHETYPES: Record<Specialization, ArchetypeInfo> = {
  ADVENTURER: {
    id: 'ADVENTURER',
    name: 'Novice Adventurer',
    role: 'Blank Slate & Pure Potential',
    description: 'Starting from ground zero. All attributes begin at zero and are forged through real-world deeds.',
    bonuses: 'Zero Baseline',
    initialAttributes: { str: 0, int: 0, end: 0, res: 0, dis: 0, wil: 0 },
    starterWeaponId: 'item-blade-training',
  },
  WARRIOR: {
    id: 'WARRIOR',
    name: 'Iron Vanguard',
    role: 'Physical Discipline & Grit',
    description: 'Forged in the fires of heavy lifting, physical training, and relentless stamina.',
    bonuses: '+3 STR, +2 END, +1 RES',
    initialAttributes: { str: 13, int: 8, end: 12, res: 11, dis: 10, wil: 10 },
    starterWeaponId: 'item-blade-training',
  },
  SCHOLAR: {
    id: 'SCHOLAR',
    name: 'Arcane Sage',
    role: 'Deep Knowledge & Intellect',
    description: 'Master of deep focus sessions, literature, technical mastery, and deliberate practice.',
    bonuses: '+4 INT, +2 WIL',
    initialAttributes: { str: 8, int: 14, end: 9, res: 10, dis: 11, wil: 12 },
    starterWeaponId: 'item-quill-focus',
  },
  SCOUT: {
    id: 'SCOUT',
    name: 'Swift Ranger',
    role: 'Habit Consistency & Agility',
    description: 'Never misses a daily habit. Strikes swiftly through routine tasks with pristine precision.',
    bonuses: '+3 DIS, +2 RES, +1 STR',
    initialAttributes: { str: 10, int: 10, end: 10, res: 11, dis: 13, wil: 10 },
    starterWeaponId: 'item-dagger-scout',
  },
  GUARDIAN: {
    id: 'GUARDIAN',
    name: 'Steadfast Guardian',
    role: 'Wellness, Sleep & Endurance',
    description: 'Prioritizes restful recovery, nutrition, hydration, and an impenetrable shield of health.',
    bonuses: '+4 END, +3 RES',
    initialAttributes: { str: 10, int: 9, end: 14, res: 13, dis: 9, wil: 9 },
    starterWeaponId: 'item-shield-buckler',
  },
  MONK: {
    id: 'MONK',
    name: 'Mindful Ascetic',
    role: 'Inner Calm & Willpower',
    description: 'Meditation, emotional regulation, and unshakable mindfulness in the face of all stress.',
    bonuses: '+4 WIL, +2 DIS',
    initialAttributes: { str: 9, int: 11, end: 10, res: 10, dis: 11, wil: 13 },
    starterWeaponId: 'item-staff-focus',
  },
};

export const INITIAL_ITEMS: Item[] = [
  // Weapons
  {
    id: 'item-blade-training',
    name: 'Novice Practice Blade',
    description: 'A well-balanced wooden training sword. Builds core strength through deliberate practice.',
    rarity: 'COMMON',
    type: 'WEAPON',
    icon: 'sword',
    price: 40,
    statEffects: { str: 3 },
  },
  {
    id: 'item-quill-focus',
    name: 'Scholar Quill of Focus',
    description: 'Inscribed with ancient runes of concentration. Sharpens thought into pure intellect.',
    rarity: 'COMMON',
    type: 'WEAPON',
    icon: 'quill',
    price: 45,
    statEffects: { int: 3, wil: 1 },
  },
  {
    id: 'item-dagger-scout',
    name: 'Habit-Tracker Dagger',
    description: 'Lightweight and sharp. Designed to swiftly strike through micro-tasks without hesitation.',
    rarity: 'COMMON',
    type: 'WEAPON',
    icon: 'dagger',
    price: 45,
    statEffects: { dis: 3, str: 1 },
  },
  {
    id: 'item-shield-buckler',
    name: 'Oak Recovery Buckler',
    description: 'A sturdy shield crafted from cured oak. Blocks mental exhaustion and physical strain.',
    rarity: 'COMMON',
    type: 'WEAPON',
    icon: 'shield',
    price: 50,
    statEffects: { end: 3, res: 2 },
  },
  {
    id: 'item-staff-focus',
    name: 'Cedar Zen Staff',
    description: 'Smooth wooden staff tuned to mindful breathing and steady contemplation.',
    rarity: 'COMMON',
    type: 'WEAPON',
    icon: 'staff',
    price: 45,
    statEffects: { wil: 3, dis: 1 },
  },
  {
    id: 'item-blade-iron',
    name: 'Forged Iron Broadsword',
    description: 'A heavy double-edged blade symbolizing relentless physical grit.',
    rarity: 'UNCOMMON',
    type: 'WEAPON',
    icon: 'sword',
    price: 120,
    statEffects: { str: 6, end: 2 },
  },
  {
    id: 'item-tome-wisdom',
    name: 'Tome of Deliberate Practice',
    description: 'Pages filled with timeless mental models, logic proofs, and structured study systems.',
    rarity: 'RARE',
    type: 'WEAPON',
    icon: 'book',
    price: 240,
    statEffects: { int: 8, wil: 4 },
  },
  {
    id: 'item-blade-titan',
    name: 'Obsidian Titan Claymore',
    description: 'A legendary colossal blade forged for those who never skip a single workout or sprint.',
    rarity: 'LEGENDARY',
    type: 'WEAPON',
    icon: 'sword',
    price: 600,
    statEffects: { str: 15, end: 6, res: 5 },
  },

  // Armor
  {
    id: 'item-armor-linen',
    name: 'Linen Runner Tunic',
    description: 'Breathable, simple garments ideal for morning strolls and light stretching.',
    rarity: 'COMMON',
    type: 'ARMOR',
    icon: 'shirt',
    price: 35,
    statEffects: { end: 2, res: 1 },
  },
  {
    id: 'item-armor-studded',
    name: 'Studded Leather Vest',
    description: 'Reinforced with iron studs. Buffers against physical soreness and fatigue.',
    rarity: 'UNCOMMON',
    type: 'ARMOR',
    icon: 'vest',
    price: 110,
    statEffects: { end: 4, res: 4 },
  },
  {
    id: 'item-armor-robes',
    name: "Philosopher's Robe",
    description: 'Flowing silk robes woven with calm geometry to repel sensory overload.',
    rarity: 'RARE',
    type: 'ARMOR',
    icon: 'robe',
    price: 220,
    statEffects: { int: 6, wil: 5, res: 3 },
  },
  {
    id: 'item-armor-plate',
    name: "Fortress Aegis Plate",
    description: 'Heavy plate armor granting the wearer an unbreakable shield of habit integrity.',
    rarity: 'EPIC',
    type: 'ARMOR',
    icon: 'chestplate',
    price: 450,
    statEffects: { end: 10, res: 8, dis: 4 },
  },

  // Accessories
  {
    id: 'item-ring-brass',
    name: 'Ring of Daily Cadence',
    description: 'A warm brass band that hums gently when you complete tasks on schedule.',
    rarity: 'COMMON',
    type: 'ACCESSORY',
    icon: 'ring',
    price: 50,
    statEffects: { dis: 3 },
  },
  {
    id: 'item-amulet-focus',
    name: 'Monocle of Hyperfocus',
    description: 'Filters out peripheral distractions and notifications during deep work blocks.',
    rarity: 'UNCOMMON',
    type: 'ACCESSORY',
    icon: 'necklace',
    price: 130,
    statEffects: { int: 4, dis: 3 },
  },
  {
    id: 'item-charm-grit',
    name: 'Medal of Unshakable Grit',
    description: 'Awarded to champions who persevere through failures and steep learning curves.',
    rarity: 'RARE',
    type: 'ACCESSORY',
    icon: 'medal',
    price: 250,
    statEffects: { res: 6, wil: 5 },
  },
  {
    id: 'item-watch-chrono',
    name: 'Pomodoro Chronometer',
    description: 'A pristine brass pocketwatch dividing time into immaculate cycles of effort and rest.',
    rarity: 'EPIC',
    type: 'ACCESSORY',
    icon: 'watch',
    price: 420,
    statEffects: { dis: 8, int: 5, wil: 4 },
  },

  // Specials
  {
    id: 'item-special-banner',
    name: 'Standard of Habitual Mastery',
    description: 'A miniature victory pennant fluttering with the breeze of continuous self-improvement.',
    rarity: 'RARE',
    type: 'SPECIAL',
    icon: 'flag',
    price: 280,
    statEffects: { str: 4, int: 4, dis: 4 },
  },
  {
    id: 'item-special-sigil',
    name: 'Cosmic Discipline Sigil',
    description: 'A glowing celestial seal radiating the pure aura of someone who has mastered their schedule.',
    rarity: 'LEGENDARY',
    type: 'SPECIAL',
    icon: 'star',
    price: 750,
    statEffects: { str: 6, int: 6, end: 6, res: 6, dis: 6, wil: 6 },
  },

  // Consumables
  {
    id: 'item-pot-health',
    name: 'Hydration & Electrolyte Flask',
    description: 'Restores 40 HP immediately during or outside of battle.',
    rarity: 'COMMON',
    type: 'CONSUMABLE',
    icon: 'potion-red',
    price: 20,
    statEffects: {},
    consumableEffect: { hp: 40 },
  },
  {
    id: 'item-pot-stamina',
    name: 'Matcha Stamina Draught',
    description: 'Invigorating green brew that restores 35 Stamina for high-impact battle moves.',
    rarity: 'COMMON',
    type: 'CONSUMABLE',
    icon: 'potion-green',
    price: 25,
    statEffects: {},
    consumableEffect: { stamina: 35 },
  },
  {
    id: 'item-pot-elixir',
    name: 'Restorative Full Elixir',
    description: 'A radiant amber elixir brewed from pure organic nourishment. Restores 80 HP and 50 Stamina.',
    rarity: 'RARE',
    type: 'CONSUMABLE',
    icon: 'potion-amber',
    price: 60,
    statEffects: {},
    consumableEffect: { hp: 80, stamina: 50 },
  },
  {
    id: 'item-scroll-xp',
    name: 'Parchment of Ancient Insights',
    description: 'Reading this lost thesis grants 100 bonus XP instantly to advance your level.',
    rarity: 'UNCOMMON',
    type: 'CONSUMABLE',
    icon: 'scroll',
    price: 80,
    statEffects: {},
    consumableEffect: { xp: 100 },
  },
];

export const INITIAL_BADGES: Badge[] = [
  // Progression
  {
    id: 'badge-first-quest',
    name: 'First Step',
    description: 'Completed your very first real-life quest.',
    icon: 'footsteps',
    category: 'Progression',
    unlockCondition: 'Complete 1 quest',
  },
  {
    id: 'badge-quests-10',
    name: 'Deed Champion',
    description: 'Accomplished 10 real-world quests through perseverance.',
    icon: 'crown',
    category: 'Progression',
    unlockCondition: 'Complete 10 quests',
  },
  {
    id: 'badge-quests-25',
    name: 'Habit Vanguard',
    description: 'Conquered 25 habits and real-world duties.',
    icon: 'trophy',
    category: 'Progression',
    unlockCondition: 'Complete 25 quests',
  },
  {
    id: 'badge-quests-50',
    name: 'Centurion of Deeds',
    description: 'Completed 50 real-world quests with relentless consistency.',
    icon: 'star',
    category: 'Progression',
    unlockCondition: 'Complete 50 quests',
  },
  {
    id: 'badge-level-10',
    name: 'Ascendant Trainer',
    description: 'Attained Level 10 through relentless real-world growth.',
    icon: 'star',
    category: 'Progression',
    unlockCondition: 'Reach Character Level 10',
  },
  {
    id: 'badge-level-20',
    name: 'Mythic Paragon',
    description: 'Attained Level 20 and unlocked ultimate sovereign aura.',
    icon: 'crown',
    category: 'Progression',
    unlockCondition: 'Reach Character Level 20',
  },

  // Consistency & Streaks
  {
    id: 'badge-streak-3',
    name: 'Iron Cadence',
    description: 'Maintained a 3-day active productivity streak.',
    icon: 'flame',
    category: 'Discipline',
    unlockCondition: 'Reach a 3-day streak',
  },
  {
    id: 'badge-streak-7',
    name: 'Habitual Architect',
    description: 'Achieved a full 7-day streak of unbroken momentum.',
    icon: 'crown',
    category: 'Discipline',
    unlockCondition: 'Reach a 7-day streak',
  },
  {
    id: 'badge-streak-14',
    name: 'Cadence of Steel',
    description: 'Two full weeks of unbroken daily discipline.',
    icon: 'flame',
    category: 'Discipline',
    unlockCondition: 'Reach a 14-day streak',
  },
  {
    id: 'badge-streak-30',
    name: 'Monastic Discipline',
    description: 'A legendary 30-day streak of uninterrupted personal mastery.',
    icon: 'trophy',
    category: 'Discipline',
    unlockCondition: 'Reach a 30-day streak',
  },

  // Task Completion Categories: Workout
  {
    id: 'badge-cat-workout-1',
    name: 'Iron Initiate',
    description: 'Completed your first physical workout quest.',
    icon: 'biceps',
    category: 'Fitness',
    unlockCondition: 'Complete 1 Workout quest',
  },
  {
    id: 'badge-cat-workout-5',
    name: 'Titan Athlete',
    description: 'Completed 5 rigorous physical workout sessions.',
    icon: 'biceps',
    category: 'Fitness',
    unlockCondition: 'Complete 5 Workout quests',
  },
  {
    id: 'badge-cat-workout-15',
    name: 'Apex Olympian',
    description: 'Completed 15 workout quests, forging elite physical stamina.',
    icon: 'trophy',
    category: 'Fitness',
    unlockCondition: 'Complete 15 Workout quests',
  },

  // Task Completion Categories: Study
  {
    id: 'badge-cat-study-1',
    name: 'Apprentice Scholar',
    description: 'Completed your first focused study or learning session.',
    icon: 'book',
    category: 'Study',
    unlockCondition: 'Complete 1 Study quest',
  },
  {
    id: 'badge-cat-study-5',
    name: 'Deep Polymath',
    description: 'Completed 5 deep study or reading quests.',
    icon: 'brain',
    category: 'Study',
    unlockCondition: 'Complete 5 Study quests',
  },
  {
    id: 'badge-cat-study-15',
    name: 'Grand Archivist',
    description: 'Completed 15 intellectual study and mastery quests.',
    icon: 'trophy',
    category: 'Study',
    unlockCondition: 'Complete 15 Study quests',
  },

  // Task Completion Categories: Discipline
  {
    id: 'badge-cat-discipline-1',
    name: 'Focus Novice',
    description: 'Completed your first daily habit discipline quest.',
    icon: 'watch',
    category: 'Discipline',
    unlockCondition: 'Complete 1 Discipline quest',
  },
  {
    id: 'badge-cat-discipline-5',
    name: 'Unbroken Will',
    description: 'Completed 5 personal discipline and focus quests.',
    icon: 'watch',
    category: 'Discipline',
    unlockCondition: 'Complete 5 Discipline quests',
  },
  {
    id: 'badge-cat-discipline-15',
    name: 'Iron Sovereign',
    description: 'Completed 15 rigorous discipline quests.',
    icon: 'crown',
    category: 'Discipline',
    unlockCondition: 'Complete 15 Discipline quests',
  },

  // Task Completion Categories: Wellness
  {
    id: 'badge-cat-wellness-1',
    name: 'Mindful Seeker',
    description: 'Completed your first mindfulness or recovery quest.',
    icon: 'scroll',
    category: 'Wellness',
    unlockCondition: 'Complete 1 Wellness quest',
  },
  {
    id: 'badge-cat-wellness-5',
    name: 'Zen Voyager',
    description: 'Completed 5 wellness and restorative habit quests.',
    icon: 'scroll',
    category: 'Wellness',
    unlockCondition: 'Complete 5 Wellness quests',
  },
  {
    id: 'badge-cat-wellness-15',
    name: 'Tranquil Sage',
    description: 'Completed 15 wellness quests, achieving inner harmony.',
    icon: 'star',
    category: 'Wellness',
    unlockCondition: 'Complete 15 Wellness quests',
  },

  // Task Completion Categories: Creativity
  {
    id: 'badge-cat-creativity-1',
    name: 'Artisan Spark',
    description: 'Completed your first creative output or craft quest.',
    icon: 'star',
    category: 'Creativity',
    unlockCondition: 'Complete 1 Creativity quest',
  },
  {
    id: 'badge-cat-creativity-5',
    name: 'Visionary Craftsman',
    description: 'Completed 5 imaginative or artistic creation quests.',
    icon: 'trophy',
    category: 'Creativity',
    unlockCondition: 'Complete 5 Creativity quests',
  },
  {
    id: 'badge-cat-creativity-15',
    name: 'Master Creator',
    description: 'Completed 15 creative masterpieces and projects.',
    icon: 'crown',
    category: 'Creativity',
    unlockCondition: 'Complete 15 Creativity quests',
  },

  // Task Completion Categories: Work
  {
    id: 'badge-cat-work-1',
    name: 'Task Operator',
    description: 'Completed your first professional work or career task.',
    icon: 'watch',
    category: 'Work',
    unlockCondition: 'Complete 1 Work quest',
  },
  {
    id: 'badge-cat-work-5',
    name: 'Execution Juggernaut',
    description: 'Completed 5 major work sprint or productivity quests.',
    icon: 'shield',
    category: 'Work',
    unlockCondition: 'Complete 5 Work quests',
  },
  {
    id: 'badge-cat-work-15',
    name: 'Titan of Industry',
    description: 'Completed 15 professional productivity achievements.',
    icon: 'trophy',
    category: 'Work',
    unlockCondition: 'Complete 15 Work quests',
  },

  // Task Difficulty
  {
    id: 'badge-diff-hard-1',
    name: 'Trial of Valor',
    description: 'Conquered your first demanding HARD difficulty quest.',
    icon: 'sword',
    category: 'Difficulty',
    unlockCondition: 'Complete 1 HARD quest',
  },
  {
    id: 'badge-diff-hard-5',
    name: 'Iron Forged',
    description: 'Conquered 5 challenging HARD difficulty quests.',
    icon: 'sword',
    category: 'Difficulty',
    unlockCondition: 'Complete 5 HARD quests',
  },
  {
    id: 'badge-diff-epic-1',
    name: 'Apex Slayer',
    description: 'Conquered a legendary EPIC difficulty quest.',
    icon: 'skull',
    category: 'Difficulty',
    unlockCondition: 'Complete 1 EPIC quest',
  },
  {
    id: 'badge-diff-epic-3',
    name: 'Mythic Conqueror',
    description: 'Conquered 3 monumental EPIC difficulty quests.',
    icon: 'trophy',
    category: 'Difficulty',
    unlockCondition: 'Complete 3 EPIC quests',
  },

  // Combat & Live Multiplayer Arena
  {
    id: 'badge-first-battle',
    name: 'Arena Challenger',
    description: 'Defeated a rival in the Life RPG Battle Arena.',
    icon: 'swords',
    category: 'Combat',
    unlockCondition: 'Win 1 battle against any rival',
  },
  {
    id: 'badge-combat-5',
    name: 'Colosseum Veteran',
    description: 'Won 5 intense arena duels.',
    icon: 'sword',
    category: 'Combat',
    unlockCondition: 'Win 5 arena battles',
  },
  {
    id: 'badge-combat-10',
    name: 'Gladiator Supreme',
    description: 'Won 10 battles against arena challengers.',
    icon: 'trophy',
    category: 'Combat',
    unlockCondition: 'Win 10 arena battles',
  },
  {
    id: 'badge-live-duel-1',
    name: 'Live Duel Victor',
    description: 'Won a live simultaneous online duel against a player in real time.',
    icon: 'crown',
    category: 'Combat',
    unlockCondition: 'Win 1 live simultaneous duel',
  },
  {
    id: 'badge-slayer-boss',
    name: 'Procrastination Vanquisher',
    description: 'Defeated the boss monster Procrastor in battle.',
    icon: 'skull',
    category: 'Combat',
    unlockCondition: 'Defeat Procrastor in Battle Arena',
  },

  // Attribute Milestones
  {
    id: 'badge-strength-20',
    name: 'Titan Physique',
    description: 'Developed true physical conditioning and reached 20 Strength.',
    icon: 'biceps',
    category: 'Stats',
    unlockCondition: 'Reach 20 STR',
  },
  {
    id: 'badge-intellect-20',
    name: 'Grand Polymath',
    description: 'Absorbed deep cognitive knowledge and reached 20 Intelligence.',
    icon: 'brain',
    category: 'Stats',
    unlockCondition: 'Reach 20 INT',
  },
  {
    id: 'badge-endurance-20',
    name: 'Iron Bastion',
    description: 'Forged resilient stamina and reached 20 Endurance.',
    icon: 'shield',
    category: 'Stats',
    unlockCondition: 'Reach 20 END',
  },
  {
    id: 'badge-resilience-20',
    name: 'Unbreakable Aegis',
    description: 'Strengthened mental armor and reached 20 Resilience.',
    icon: 'fortress',
    category: 'Stats',
    unlockCondition: 'Reach 20 RES',
  },
  {
    id: 'badge-discipline-20',
    name: 'Monastic Precision',
    description: 'Cultivated unwavering focus and reached 20 Discipline.',
    icon: 'watch',
    category: 'Stats',
    unlockCondition: 'Reach 20 DIS',
  },
  {
    id: 'badge-willpower-20',
    name: 'Celestial Resolve',
    description: 'Kindled an indomitable soul and reached 20 Willpower.',
    icon: 'flame',
    category: 'Stats',
    unlockCondition: 'Reach 20 WIL',
  },
];

export const INITIAL_RIVALS: Rival[] = [];

export const INITIAL_QUESTS: Quest[] = [];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [];

// Helper to compute XP required for next level using classic RPG exponential curve
export function calculateXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.35, level - 1));
}

/**
 * Derives the trainer's title based on character level, progressing from Novice
 * upward to legendary ranks as real-world accomplishments accumulate.
 */
export function getTrainerTitleForLevel(level: number): string {
  if (level >= 25) return 'Legendary Sovereign';
  if (level >= 20) return 'Mythic Conqueror';
  if (level >= 18) return 'Ascendant Titan';
  if (level >= 15) return 'Grandmaster Paragon';
  if (level >= 12) return 'Master Vanguard';
  if (level >= 10) return 'Champion of Will';
  if (level >= 9) return 'Resilient Crusader';
  if (level >= 8) return 'Disciplined Veteran';
  if (level >= 7) return 'Skilled Combatant';
  if (level >= 6) return 'Adept Pathfinder';
  if (level >= 5) return 'Adept Challenger';
  if (level >= 4) return 'Apprentice Practitioner';
  if (level >= 3) return 'Apprentice Striver';
  if (level >= 2) return 'Novice Aspirant';
  return 'Novice Adventurer';
}

/**
 * Returns the next upcoming title milestone for the player.
 */
export function getNextTrainerRankMilestone(level: number): { level: number; title: string } | null {
  const milestones = [
    { level: 2, title: 'Novice Aspirant' },
    { level: 3, title: 'Apprentice Striver' },
    { level: 4, title: 'Apprentice Practitioner' },
    { level: 5, title: 'Adept Challenger' },
    { level: 6, title: 'Adept Pathfinder' },
    { level: 7, title: 'Skilled Combatant' },
    { level: 8, title: 'Disciplined Veteran' },
    { level: 9, title: 'Resilient Crusader' },
    { level: 10, title: 'Champion of Will' },
    { level: 12, title: 'Master Vanguard' },
    { level: 15, title: 'Grandmaster Paragon' },
    { level: 18, title: 'Ascendant Titan' },
    { level: 20, title: 'Mythic Conqueror' },
    { level: 25, title: 'Legendary Sovereign' },
  ];
  return milestones.find((m) => m.level > level) || null;
}

/**
 * Evolves player character sprite as trainer reaches higher level tiers.
 */
export function getAvatarForLevel(level: number, currentAvatar?: string): string {
  // If user has chosen a specific class or hero variant
  if (!currentAvatar || currentAvatar === 'hero_novice' || currentAvatar === 'player_hero' || currentAvatar.includes('novice')) {
    if (level >= 15) return 'hero_guardian';
    if (level >= 10) return 'hero_warrior';
    if (level >= 5) return 'hero_scout';
    return 'hero_novice';
  }
  return currentAvatar;
}

