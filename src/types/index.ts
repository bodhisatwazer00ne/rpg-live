export type AttributeType = 'str' | 'int' | 'end' | 'res' | 'dis' | 'wil';

export interface AttributeScores {
  str: number; // Strength - physical battle attack & workout quests
  int: number; // Intelligence - special ability power & learning/study
  end: number; // Endurance - max HP & physical stamina
  res: number; // Resilience - battle defense & grit/consistency
  dis: number; // Discipline - max stamina, crit strike chance & habits
  wil: number; // Willpower - recovery move efficacy & overcoming fatigue
}

export type Specialization = 'ADVENTURER' | 'WARRIOR' | 'SCHOLAR' | 'SCOUT' | 'GUARDIAN' | 'MONK';

export interface User {
  id: string;
  username: string;
  title: string;
  avatarId: string;
  specialization: Specialization;
  level: number;
  xp: number;
  maxXp: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  gold?: number;
  streak: number;
  lastActiveDate: string;
  statPoints: number; // Unallocated points from level up
  attributes: AttributeScores;
  createdAt: string;
  updatedAt: string;
}

export type QuestDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
export type QuestCategory = 'WORKOUT' | 'STUDY' | 'DISCIPLINE' | 'WELLNESS' | 'CREATIVITY' | 'WORK';

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  xpReward: number;
  goldReward?: number;
  attributeRewards: Partial<Record<AttributeType, number>>;
  status: 'ACTIVE' | 'COMPLETED';
  deadline?: string;
  completedAt?: string;
  isDaily?: boolean;
}

export type ItemRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type ItemType = 'WEAPON' | 'ARMOR' | 'ACCESSORY' | 'SPECIAL' | 'CONSUMABLE';

export interface Item {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  type: ItemType;
  icon: string;
  price?: number;
  statEffects: Partial<Record<AttributeType, number>>;
  consumableEffect?: {
    hp?: number;
    stamina?: number;
    xp?: number;
  };
}

export interface InventoryItem {
  id: string;
  itemId: string;
  quantity: number;
  equippedSlot?: 'WEAPON' | 'ARMOR' | 'ACCESSORY' | 'SPECIAL';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlockCondition: string;
  unlockedAt?: string;
  xpReward?: number;
  goldReward?: number;
}

export interface Rival {
  id: string;
  username: string;
  title: string;
  avatarId: string;
  level: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  attributes: AttributeScores;
  equipmentName: string;
  bio: string;
  difficulty: 'NOVICE' | 'ADEPT' | 'VETERAN' | 'MASTER' | 'BOSS';
  winRewardXp: number;
  winRewardGold?: number;
  specialSkillName: string;
  streak?: number;
  acceptanceQuote?: string;
  status?: 'ONLINE' | 'IN_TRAINING' | 'LOOKING_FOR_DUEL';
  isIncomingChallenge?: boolean;
}

export type BattleState = 
  | 'INTRO'
  | 'PLAYER_TURN'
  | 'ACTION_SELECTED'
  | 'ANIMATION'
  | 'DAMAGE_RESOLUTION'
  | 'ENEMY_TURN'
  | 'ENEMY_ANIMATION'
  | 'ENEMY_RESOLUTION'
  | 'CHECK_BATTLE_END'
  | 'VICTORY'
  | 'DEFEAT';

export interface BattleLogEntry {
  id: string;
  text: string;
  type: 'info' | 'player_atk' | 'enemy_atk' | 'heal' | 'crit' | 'system';
}

export interface BattleRecord {
  id: string;
  rivalId: string;
  rivalName: string;
  rivalAvatarId: string;
  rivalLevel: number;
  rivalTitle: string;
  result: 'VICTORY' | 'DEFEAT' | 'FLED';
  date: string;
  xpEarned: number;
  details?: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  title: string;
  avatarId: string;
  level: number;
  xp: number;
  badgesCount: number;
  streak: number;
  isCurrentUser?: boolean;
}

export interface GameSettings {
  soundEnabled: boolean;
  crtFilterEnabled: boolean;
  gameboyFilterEnabled: boolean;
  reducedMotion: boolean;
}

export interface GameState {
  user: User;
  inventory: InventoryItem[];
  items: Item[];
  quests: Quest[];
  badges: Badge[];
  rivals: Rival[];
  settings: GameSettings;
  hasCompletedOnboarding: boolean;
  hasClaimedUsername?: boolean;
  defeatedRivalsCount: number;
  battleHistory: BattleRecord[];
}

export interface PublicTrainer {
  userId: string;
  username: string;
  level: number;
  title: string;
  avatarId: string;
  specialization: Specialization;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  streak: number;
  xp: number;
  attributes: AttributeScores;
  equipmentName?: string;
  questsCleared: number;
  defeatedRivalsCount: number;
  isOnline?: boolean;
  lastActive?: string;
  updatedAt: string;
}

export interface DuelChallenge {
  id: string;
  challengerId: string;
  challengerName: string;
  challengerAvatarId: string;
  challengerLevel: number;
  challengerTitle: string;
  challengerStats: {
    hp: number;
    maxHp: number;
    stamina: number;
    maxStamina: number;
    attributes: AttributeScores;
  };
  targetUserId: string;
  targetName: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
  battleId?: string;
  createdAt: string;
  updatedAt: string;
}

export type BattleActionType = 'STRIKE' | 'DEFEND' | 'FOCUS_SURGE' | 'HEAL_POTION';

export interface BattleActionSubmission {
  action: BattleActionType;
  round: number;
  timestamp: number;
}

export interface BattlePlayerState {
  id: string;
  username: string;
  level: number;
  avatarId: string;
  title: string;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  attributes: AttributeScores;
  selectedAction?: BattleActionSubmission | null;
  isDefending?: boolean;
  ready: boolean;
}

export interface RoundResolution {
  round: number;
  player1Action: BattleActionType;
  player2Action: BattleActionType;
  player1DamageDealt: number;
  player2DamageDealt: number;
  player1Crit: boolean;
  player2Crit: boolean;
  player1StaminaSpent: number;
  player2StaminaSpent: number;
  player1Heal: number;
  player2Heal: number;
  summary: string;
  timestamp: number;
}

export interface ActiveBattleSession {
  id: string;
  challengeId?: string;
  player1: BattlePlayerState;
  player2: BattlePlayerState;
  round: number;
  status: 'WAITING_FOR_ACCEPT' | 'IN_PROGRESS' | 'RESOLVED' | 'FORFEIT';
  winnerId?: string | null;
  loserId?: string | null;
  lastResolution?: RoundResolution | null;
  forfeitById?: string | null;
  createdAt: string;
  updatedAt: string;
}


