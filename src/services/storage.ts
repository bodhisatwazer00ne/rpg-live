import { 
  User, Quest, Item, InventoryItem, Badge, Rival, GameSettings, AttributeType, Specialization, GameState 
} from '../types';
import { 
  INITIAL_ITEMS, INITIAL_BADGES, INITIAL_RIVALS, INITIAL_QUESTS, 
  ARCHETYPES, calculateXpForLevel, getTrainerTitleForLevel, getAvatarForLevel 
} from '../data/initialData';

export function getStorageKey(userId?: string): string {
  return userId ? `LIFE_RPG_STATE_V2_${userId}` : 'LIFE_RPG_STATE_V2_GUEST';
}

export function clearLocalGameState(userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getStorageKey(userId));
  } catch (e) {
    console.error('Failed to clear Life RPG local state', e);
  }
}

export function createInitialState(
  username: string = 'Trainer',
  userId: string = 'user_player'
): GameState {
  // All attributes start strictly at zero - power is forged through real-world actions!
  const initialAttrs: Record<AttributeType, number> = {
    str: 0,
    int: 0,
    end: 0,
    res: 0,
    dis: 0,
    wil: 0,
  };

  const starterPotion = INITIAL_ITEMS.find(i => i.id === 'item-pot-health') || INITIAL_ITEMS[16];

  const { maxHp, maxStamina } = deriveMaxVitals(
    initialAttrs.end,
    initialAttrs.dis,
    1,
    initialAttrs.wil,
    initialAttrs.res
  );

  const user: User = {
    id: userId,
    username: username.trim() || 'Trainer',
    title: 'Novice Adventurer',
    avatarId: 'hero_novice',
    specialization: 'ADVENTURER',
    level: 1,
    xp: 0,
    maxXp: calculateXpForLevel(1),
    hp: maxHp,
    maxHp: maxHp,
    stamina: maxStamina,
    maxStamina: maxStamina,
    gold: 0,
    streak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    statPoints: 0,
    attributes: initialAttrs,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Starter inventory with training supplies
  const inventory: InventoryItem[] = [
    {
      id: 'inv-starter-blade',
      itemId: 'item-blade-training',
      quantity: 1,
    },
    {
      id: 'inv-starter-potion',
      itemId: starterPotion.id,
      quantity: 2,
    },
  ];

  return {
    user,
    inventory,
    items: INITIAL_ITEMS,
    quests: INITIAL_QUESTS,
    badges: INITIAL_BADGES,
    rivals: INITIAL_RIVALS,
    settings: {
      soundEnabled: true,
      crtFilterEnabled: false,
      gameboyFilterEnabled: false,
      reducedMotion: false,
    },
    hasCompletedOnboarding: false,
    defeatedRivalsCount: 0,
    battleHistory: [],
  };
}

export function initializeNewGame(
  username: string
): GameState {
  const state = createInitialState(username);
  state.hasCompletedOnboarding = true;
  saveGameState(state);
  return state;
}

export function resetGameState(userId?: string): GameState {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(getStorageKey(userId));
    } catch (e) {
      console.error(e);
    }
  }
  return createInitialState('Trainer', userId);
}

export function loadGameState(userId?: string): GameState {
  if (typeof window === 'undefined') {
    return createInitialState('Trainer', userId);
  }

  try {
    const key = getStorageKey(userId);
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      const base = createInitialState('Trainer', userId || parsed.user?.id);
      const user = { ...base.user, ...(parsed.user || {}) };

      // Ensure points/vitals are calibrated according to level
      // Health HP improves on endurance, willpower, and resilience (cultivated by workout & wellness)
      const { maxHp, maxStamina } = deriveMaxVitals(
        user.attributes?.end || 0,
        user.attributes?.dis || 0,
        user.level || 1,
        user.attributes?.wil || 0,
        user.attributes?.res || 0
      );
      user.maxHp = maxHp;
      user.maxStamina = maxStamina;
      user.hp = Math.min(typeof user.hp === 'number' ? user.hp : maxHp, maxHp);
      user.stamina = Math.min(typeof user.stamina === 'number' ? user.stamina : maxStamina, maxStamina);

      // Calibrate level title progression if missing
      if (!user.title) {
        user.title = getTrainerTitleForLevel(user.level || 1);
      }
      user.avatarId = getAvatarForLevel(user.level || 1, user.avatarId);

      // Hydrate initial quest metadata (such as deadlines and daily flags) into saved quests if missing
      const quests = (parsed.quests || base.quests).map((q: any) => {
        const initQ = base.quests.find((bq) => bq.id === q.id);
        if (initQ) {
          return {
            ...q,
            deadline: q.deadline || initQ.deadline,
            isDaily: q.isDaily ?? initQ.isDaily,
          };
        }
        return q;
      });

      return {
        ...base,
        ...parsed,
        user,
        quests,
        battleHistory: parsed.battleHistory || base.battleHistory || [],
        items: INITIAL_ITEMS, // ensure latest catalog
      };
    }
  } catch (e) {
    console.error('Failed to load Life RPG saved state', e);
  }

  return createInitialState('Trainer', userId);
}

export function saveGameState(state: GameState, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey(userId || state.user?.id);
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to persist Life RPG state', e);
  }
}

// Compute total effective attributes including equipment stat bonuses
export function computeEffectiveAttributes(user: User, inventory: InventoryItem[], items: Item[]): {
  base: Record<AttributeType, number>;
  bonus: Record<AttributeType, number>;
  total: Record<AttributeType, number>;
} {
  const base = { ...user.attributes };
  const bonus: Record<AttributeType, number> = { str: 0, int: 0, end: 0, res: 0, dis: 0, wil: 0 };

  const itemMap = new Map<string, Item>(items.map(i => [i.id, i]));

  inventory.forEach(invItem => {
    if (invItem.equippedSlot) {
      const item = itemMap.get(invItem.itemId);
      if (item && item.statEffects) {
        Object.entries(item.statEffects).forEach(([stat, val]) => {
          const key = stat as AttributeType;
          if (bonus[key] !== undefined && typeof val === 'number') {
            bonus[key] += val;
          }
        });
      }
    }
  });

  const total: Record<AttributeType, number> = {
    str: base.str + bonus.str,
    int: base.int + bonus.int,
    end: base.end + bonus.end,
    res: base.res + bonus.res,
    dis: base.dis + bonus.dis,
    wil: base.wil + bonus.wil,
  };

  return { base, bonus, total };
}

// Calculate max HP and Stamina derived from level and effective stats
// Health (HP) improves with Endurance, Willpower, and Resilience (forged through Workout and Wellness)
// Stamina improves with Discipline and Endurance
export function deriveMaxVitals(
  endTotal: number,
  disTotal: number,
  level: number = 1,
  wilTotal: number = 0,
  resTotal: number = 0
): { maxHp: number; maxStamina: number } {
  const lvl = Math.max(1, level);
  return {
    maxHp: 26 + lvl * 6 + Math.round(endTotal * 2.2 + wilTotal * 1.5 + resTotal * 1.3),
    maxStamina: 30 + lvl * 4 + disTotal * 2.5 + Math.round(endTotal * 1.0),
  };
}
