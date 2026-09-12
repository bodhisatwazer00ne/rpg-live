import React from 'react';

export type SpriteAnimation = 'idle' | 'attack' | 'hit' | 'victory' | 'defeat';

export interface CharacterSpriteProps {
  id: string;
  size?: number;
  animation?: SpriteAnimation;
  flipped?: boolean;
  className?: string;
  level?: number;
}

export const CharacterSprite: React.FC<CharacterSpriteProps> = ({
  id,
  size = 96,
  animation = 'idle',
  flipped = false,
  className = '',
  level = 1,
}) => {
  const safeId = typeof id === 'string' && id.trim() ? id.trim() : 'hero_novice';

  const isPlayerHero =
    safeId.startsWith('hero_') ||
    safeId.includes('novice') ||
    safeId.includes('warrior') ||
    safeId.includes('guardian') ||
    safeId.includes('scout') ||
    safeId.includes('monk') ||
    safeId.includes('scholar') ||
    safeId.includes('adventurer') ||
    safeId === 'player_hero' ||
    safeId === 'warrior_male' ||
    safeId === 'mage_female' ||
    safeId === 'rogue_male' ||
    safeId === 'paladin_female';

  const getAnimationClass = () => {
    switch (animation) {
      case 'attack':
        return 'animate-bounce';
      case 'hit':
        return 'animate-pixel-shake animate-hit-flash';
      case 'victory':
        return 'animate-bounce';
      case 'defeat':
        return 'opacity-40 grayscale filter';
      case 'idle':
      default:
        return 'animate-[pulse_3s_ease-in-out_infinite]';
    }
  };

  // Progressive pixel gear upgrades rendered at every single level milestone
  const renderLevelGear = (lvl: number) => {
    if (!isPlayerHero || lvl < 2) return null;

    return (
      <g id="level-progression-gear">
        {/* LVL 2: Copper Wristguards & Bronze Headband Crest */}
        {lvl >= 2 && (
          <g id="gear-lvl-2">
            <rect x="4" y="14" width="3" height="2" fill="#d97706" />
            <rect x="17" y="14" width="3" height="2" fill="#d97706" />
            <rect x="11" y="3" width="2" height="2" fill="#f59e0b" />
          </g>
        )}

        {/* LVL 3: Adventurer's Dagger & Emerald Travel Scarf */}
        {lvl >= 3 && (
          <g id="gear-lvl-3">
            <rect x="6" y="13" width="2" height="4" fill="#94a3b8" />
            <rect x="5" y="13" width="4" height="1" fill="#f59e0b" />
            <rect x="9" y="9" width="6" height="2" fill="#10b981" />
            <rect x="8" y="10" width="2" height="3" fill="#059669" />
          </g>
        )}

        {/* LVL 4: Hardened Shoulder Pauldron & Winged Boots */}
        {lvl >= 4 && (
          <g id="gear-lvl-4">
            <rect x="5" y="9" width="3" height="3" fill="#cbd5e1" />
            <rect x="5" y="10" width="1" height="1" fill="#ffffff" />
            <rect x="7" y="20" width="2" height="2" fill="#f59e0b" />
            <rect x="15" y="20" width="2" height="2" fill="#f59e0b" />
          </g>
        )}

        {/* LVL 5: Emerald Scout Mantle & Twin Silver Daggers */}
        {lvl >= 5 && (
          <g id="gear-lvl-5">
            <rect x="4" y="8" width="2" height="9" fill="#15803d" />
            <rect x="18" y="8" width="2" height="9" fill="#15803d" />
            <rect x="18" y="11" width="2" height="6" fill="#e2e8f0" />
            <rect x="17" y="13" width="4" height="1" fill="#fec83e" />
          </g>
        )}

        {/* LVL 6: Steel Breastplate with Azure Rune & Focus Eyes */}
        {lvl >= 6 && (
          <g id="gear-lvl-6">
            <rect x="8" y="10" width="8" height="5" fill="#94a3b8" />
            <rect x="11" y="11" width="2" height="3" fill="#38bdf8" />
            <rect x="10" y="7" width="1" height="1" fill="#38bdf8" />
            <rect x="14" y="7" width="1" height="1" fill="#38bdf8" />
          </g>
        )}

        {/* LVL 7: Plumed Knight Circlet & Armored Greaves */}
        {lvl >= 7 && (
          <g id="gear-lvl-7">
            <rect x="7" y="3" width="10" height="2" fill="#e2e8f0" />
            <rect x="11" y="0" width="2" height="3" fill="#3b82f6" />
            <rect x="8" y="17" width="3" height="4" fill="#64748b" />
            <rect x="13" y="17" width="3" height="4" fill="#64748b" />
          </g>
        )}

        {/* LVL 8: Crimson Champion Cape & Steel Broadsword */}
        {lvl >= 8 && (
          <g id="gear-lvl-8">
            <rect x="3" y="9" width="3" height="11" fill="#dc2626" />
            <rect x="18" y="9" width="3" height="11" fill="#b91c1c" />
            <rect x="19" y="4" width="2" height="13" fill="#cbd5e1" />
            <rect x="18" y="13" width="4" height="2" fill="#fec83e" />
          </g>
        )}

        {/* LVL 9: Heavy Runic Armor & Enchanted Blade Sparkles */}
        {lvl >= 9 && (
          <g id="gear-lvl-9">
            <rect x="8" y="9" width="8" height="7" fill="#475569" />
            <rect x="9" y="10" width="6" height="5" fill="#64748b" />
            <rect x="11" y="11" width="2" height="3" fill="#f59e0b" />
            <rect x="20" y="2" width="1" height="1" fill="#67e8f9" />
            <rect x="22" y="5" width="1" height="1" fill="#38bdf8" />
          </g>
        )}

        {/* LVL 10: Golden Sun Crest Plume & Radiating Courage Aura */}
        {lvl >= 10 && (
          <g id="gear-lvl-10">
            <rect x="10" y="0" width="4" height="3" fill="#fec83e" />
            <rect x="9" y="2" width="6" height="2" fill="#eab308" />
            <rect x="2" y="12" width="1" height="1" fill="#fde047" />
            <rect x="21" y="14" width="1" height="1" fill="#fde047" />
            <rect x="4" y="3" width="1" height="1" fill="#fde047" />
          </g>
        )}

        {/* LVL 11: Orbiting Arcane Mana Crystals */}
        {lvl >= 11 && (
          <g id="gear-lvl-11">
            <rect x="2" y="5" width="2" height="2" fill="#38bdf8" />
            <rect x="20" y="6" width="2" height="2" fill="#818cf8" />
            <rect x="1" y="15" width="2" height="2" fill="#38bdf8" />
          </g>
        )}

        {/* LVL 12: Master Vanguard Gold Inlay & Blazing Flame Sword */}
        {lvl >= 12 && (
          <g id="gear-lvl-12">
            <rect x="7" y="8" width="10" height="2" fill="#fec83e" />
            <rect x="6" y="9" width="2" height="6" fill="#fec83e" />
            <rect x="16" y="9" width="2" height="6" fill="#fec83e" />
            <rect x="19" y="2" width="2" height="15" fill="#f97316" />
            <rect x="20" y="1" width="1" height="2" fill="#facc15" />
            <rect x="18" y="14" width="4" height="2" fill="#ea580c" />
          </g>
        )}

        {/* LVL 13: Dragonscale Pauldrons & Crimson War Sash */}
        {lvl >= 13 && (
          <g id="gear-lvl-13">
            <rect x="4" y="8" width="4" height="4" fill="#991b1b" />
            <rect x="16" y="8" width="4" height="4" fill="#991b1b" />
            <rect x="8" y="14" width="8" height="2" fill="#ef4444" />
          </g>
        )}

        {/* LVL 14: Star-Forged Shimmer Cape */}
        {lvl >= 14 && (
          <g id="gear-lvl-14">
            <rect x="2" y="8" width="3" height="13" fill="#1e1b4b" />
            <rect x="3" y="10" width="1" height="1" fill="#c084fc" />
            <rect x="19" y="8" width="3" height="13" fill="#1e1b4b" />
            <rect x="20" y="12" width="1" height="1" fill="#c084fc" />
          </g>
        )}

        {/* LVL 15: Grandmaster Paladin Halo & Tower Aegis */}
        {lvl >= 15 && (
          <g id="gear-lvl-15">
            <rect x="8" y="0" width="8" height="1" fill="#fef08a" />
            <rect x="7" y="1" width="2" height="1" fill="#fef08a" />
            <rect x="15" y="1" width="2" height="1" fill="#fef08a" />
            <rect x="2" y="7" width="5" height="11" fill="#38bdf8" />
            <rect x="3" y="9" width="3" height="7" fill="#fef08a" />
          </g>
        )}

        {/* LVL 16: Ascendant Celestial Energy Orbs */}
        {lvl >= 16 && (
          <g id="gear-lvl-16">
            <rect x="1" y="3" width="2" height="2" fill="#06b6d4" />
            <rect x="21" y="3" width="2" height="2" fill="#06b6d4" />
            <rect x="0" y="12" width="2" height="2" fill="#facc15" />
            <rect x="22" y="12" width="2" height="2" fill="#facc15" />
          </g>
        )}

        {/* LVL 17: Titan Crystal Gauntlets & Lightning Sparks */}
        {lvl >= 17 && (
          <g id="gear-lvl-17">
            <rect x="3" y="13" width="3" height="4" fill="#a855f7" />
            <rect x="18" y="13" width="3" height="4" fill="#a855f7" />
            <rect x="1" y="2" width="1" height="2" fill="#e0e7ff" />
            <rect x="22" y="16" width="1" height="2" fill="#e0e7ff" />
          </g>
        )}

        {/* LVL 18: Imperial Royal Crown & Majestic Imperial Mantle */}
        {lvl >= 18 && (
          <g id="gear-lvl-18">
            <rect x="8" y="0" width="8" height="2" fill="#f59e0b" />
            <rect x="8" y="0" width="2" height="1" fill="#fef08a" />
            <rect x="11" y="0" width="2" height="1" fill="#ef4444" />
            <rect x="14" y="0" width="2" height="1" fill="#fef08a" />
            <rect x="2" y="7" width="4" height="14" fill="#581c87" />
            <rect x="18" y="7" width="4" height="14" fill="#581c87" />
          </g>
        )}

        {/* LVL 19: Prismatic Sovereign Flare */}
        {lvl >= 19 && (
          <g id="gear-lvl-19">
            <rect x="0" y="8" width="2" height="2" fill="#f43f5e" />
            <rect x="22" y="8" width="2" height="2" fill="#8b5cf6" />
            <rect x="6" y="0" width="2" height="2" fill="#eab308" />
            <rect x="16" y="0" width="2" height="2" fill="#06b6d4" />
          </g>
        )}

        {/* LVL 20+: Legendary Sovereign Godly Crown & Radiant Golden Cosmos Aura */}
        {lvl >= 20 && (
          <g id="gear-lvl-20">
            <rect x="7" y="0" width="10" height="2" fill="#fef08a" />
            <rect x="6" y="1" width="12" height="1" fill="#f59e0b" />
            <rect x="9" y="0" width="2" height="1" fill="#ef4444" />
            <rect x="13" y="0" width="2" height="1" fill="#3b82f6" />
            <rect x="1" y="1" width="2" height="2" fill="#fef08a" />
            <rect x="21" y="1" width="2" height="2" fill="#fef08a" />
            <rect x="0" y="18" width="2" height="2" fill="#38bdf8" />
            <rect x="22" y="18" width="2" height="2" fill="#ec4899" />
            <rect x="20" y="0" width="3" height="19" fill="#fef08a" />
            <rect x="19" y="10" width="5" height="2" fill="#f59e0b" />
          </g>
        )}
      </g>
    );
  };

  // Helper to render authentic 16x16 pixel grids using SVG rects
  const renderSpriteSvg = () => {
    // 0. NOVICE / ADVENTURER (Starter Hero)
    if (safeId.includes('novice') || safeId === 'hero_novice' || safeId === 'hero_adventurer' || safeId === 'player_hero') {
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className="shape-rendering-crispEdges">
          {/* Hair & Red Adventurer Bandana */}
          <rect x="9" y="2" width="6" height="2" fill="#4a2c11" />
          <rect x="8" y="4" width="8" height="2" fill="#e43b44" />
          <rect x="7" y="5" width="2" height="2" fill="#e43b44" />
          {/* Face */}
          <rect x="8" y="6" width="8" height="4" fill="#fcd2a4" />
          {/* Determined Eyes */}
          <rect x="9" y="7" width="2" height="2" fill="#181425" />
          <rect x="13" y="7" width="2" height="2" fill="#181425" />
          <rect x="10" y="7" width="1" height="1" fill="#ffffff" />
          <rect x="14" y="7" width="1" height="1" fill="#ffffff" />
          {/* Simple Blue Adventurer Tunic */}
          <rect x="7" y="10" width="10" height="7" fill="#2563eb" />
          <rect x="10" y="10" width="4" height="4" fill="#fcd2a4" />
          <rect x="7" y="15" width="10" height="2" fill="#643b1e" />
          <rect x="11" y="15" width="2" height="2" fill="#fec83e" />
          {/* Arms */}
          <rect x="5" y="11" width="2" height="5" fill="#fcd2a4" />
          <rect x="17" y="11" width="2" height="5" fill="#fcd2a4" />
          {/* Sturdy Boots */}
          <rect x="8" y="17" width="3" height="5" fill="#4a2c11" />
          <rect x="13" y="17" width="3" height="5" fill="#4a2c11" />
          {/* Progressive level upgrades */}
          {renderLevelGear(level)}
        </svg>
      );
    }

    // 1. WARRIOR / IRON VANGUARD
    if (safeId.includes('warrior') || safeId === 'hero_warrior' || safeId === 'warrior_male') {
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className="shape-rendering-crispEdges">
          {/* Helm & Red Plume */}
          <rect x="10" y="1" width="4" height="3" fill="#e43b44" />
          <rect x="8" y="3" width="8" height="2" fill="#c0262d" />
          <rect x="7" y="5" width="10" height="6" fill="#8f97a3" />
          <rect x="8" y="7" width="8" height="2" fill="#2b273d" />
          {/* Eyes in visor */}
          <rect x="10" y="7" width="1" height="1" fill="#fec83e" />
          <rect x="13" y="7" width="1" height="1" fill="#fec83e" />
          {/* Shoulder Pauldrons */}
          <rect x="5" y="10" width="4" height="4" fill="#697180" />
          <rect x="15" y="10" width="4" height="4" fill="#697180" />
          {/* Chestplate */}
          <rect x="8" y="10" width="8" height="6" fill="#adb8c6" />
          <rect x="10" y="11" width="4" height="4" fill="#fec83e" />
          {/* Iron Greaves & Boots */}
          <rect x="8" y="16" width="3" height="6" fill="#4d5460" />
          <rect x="13" y="16" width="3" height="6" fill="#4d5460" />
          <rect x="7" y="21" width="4" height="2" fill="#2b273d" />
          <rect x="13" y="21" width="4" height="2" fill="#2b273d" />
          {/* Greatsword in hand */}
          <rect x="18" y="6" width="2" height="13" fill="#cbd5e1" />
          <rect x="17" y="15" width="4" height="1" fill="#fec83e" />
          <rect x="18" y="16" width="2" height="4" fill="#643b1e" />
          {/* Progressive level upgrades */}
          {renderLevelGear(level)}
        </svg>
      );
    }

    // 2. SCHOLAR / ARCANE SAGE
    if (safeId.includes('scholar') || safeId === 'hero_scholar' || safeId === 'mage_female') {
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className="shape-rendering-crispEdges">
          {/* Wizard / Scholar Hood */}
          <rect x="10" y="1" width="4" height="3" fill="#4d3278" />
          <rect x="8" y="3" width="8" height="3" fill="#604094" />
          <rect x="7" y="5" width="10" height="3" fill="#7550b3" />
          {/* Face & Round Glasses */}
          <rect x="8" y="8" width="8" height="3" fill="#fcd2a4" />
          <rect x="9" y="8" width="2" height="2" fill="#3b9eff" />
          <rect x="13" y="8" width="2" height="2" fill="#3b9eff" />
          <rect x="11" y="8" width="2" height="1" fill="#fec83e" />
          {/* Mystic Robes */}
          <rect x="7" y="11" width="10" height="9" fill="#402868" />
          <rect x="11" y="11" width="2" height="9" fill="#fec83e" />
          <rect x="5" y="12" width="3" height="5" fill="#604094" />
          <rect x="16" y="12" width="3" height="5" fill="#604094" />
          {/* Floating Arcane Focus Orb */}
          <rect x="3" y="8" width="3" height="3" fill="#60b0ff" />
          <rect x="4" y="9" width="1" height="1" fill="#ffffff" />
          {/* Robe hem & feet */}
          <rect x="8" y="20" width="8" height="3" fill="#281644" />
          {/* Progressive level upgrades */}
          {renderLevelGear(level)}
        </svg>
      );
    }

    // 3. SCOUT / SWIFT RANGER
    if (safeId.includes('scout') || safeId === 'hero_scout' || safeId === 'rogue_male') {
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className="shape-rendering-crispEdges">
          {/* Green Hood & Mask */}
          <rect x="9" y="2" width="6" height="3" fill="#2d6b3e" />
          <rect x="7" y="4" width="10" height="4" fill="#38854d" />
          {/* Sharp Eyes */}
          <rect x="9" y="7" width="2" height="1" fill="#fff" />
          <rect x="10" y="7" width="1" height="1" fill="#14361c" />
          <rect x="13" y="7" width="2" height="1" fill="#fff" />
          <rect x="14" y="7" width="1" height="1" fill="#14361c" />
          {/* Leather Doublet & Cloak */}
          <rect x="7" y="10" width="10" height="7" fill="#6e4c27" />
          <rect x="9" y="10" width="6" height="7" fill="#422d16" />
          <rect x="5" y="9" width="3" height="8" fill="#2d6b3e" />
          {/* Agile Boots */}
          <rect x="8" y="17" width="3" height="5" fill="#2b1f14" />
          <rect x="13" y="17" width="3" height="5" fill="#2b1f14" />
          {/* Twin daggers */}
          <rect x="17" y="11" width="2" height="6" fill="#cbd5e1" />
          <rect x="17" y="13" width="2" height="1" fill="#fec83e" />
          {/* Progressive level upgrades */}
          {renderLevelGear(level)}
        </svg>
      );
    }

    // 4. GUARDIAN / STEADFAST PALADIN
    if (safeId.includes('guardian') || safeId === 'hero_guardian' || safeId === 'paladin_female') {
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className="shape-rendering-crispEdges">
          {/* Golden Crest Halo */}
          <rect x="9" y="1" width="6" height="2" fill="#fec83e" />
          <rect x="7" y="3" width="10" height="6" fill="#cbd5e1" />
          <rect x="10" y="5" width="4" height="2" fill="#141022" />
          {/* Massive Tower Shield */}
          <rect x="3" y="7" width="6" height="13" fill="#305080" />
          <rect x="4" y="9" width="4" height="9" fill="#507cb0" />
          <rect x="5" y="11" width="2" height="5" fill="#fec83e" />
          {/* Heavy Body Plate */}
          <rect x="9" y="9" width="9" height="8" fill="#94a3b8" />
          <rect x="11" y="10" width="5" height="5" fill="#fec83e" />
          {/* Armored Legs */}
          <rect x="10" y="17" width="4" height="5" fill="#64748b" />
          <rect x="15" y="17" width="3" height="5" fill="#64748b" />
          {/* Progressive level upgrades */}
          {renderLevelGear(level)}
        </svg>
      );
    }

    // 5. MONK / MINDFUL ASCETIC
    if (safeId.includes('monk') || safeId === 'hero_monk') {
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className="shape-rendering-crispEdges">
          {/* Headband & Shaved Head */}
          <rect x="8" y="2" width="8" height="6" fill="#fcd2a4" />
          <rect x="7" y="4" width="10" height="2" fill="#e43b44" />
          {/* Serene Closed Eyes in Meditation */}
          <rect x="9" y="6" width="2" height="1" fill="#4d2b0e" />
          <rect x="13" y="6" width="2" height="1" fill="#4d2b0e" />
          {/* Orange/Saffron Monk Sash */}
          <rect x="8" y="10" width="8" height="7" fill="#d97706" />
          <rect x="7" y="10" width="3" height="4" fill="#b45309" />
          <rect x="10" y="9" width="4" height="2" fill="#fec83e" />
          {/* Wooden prayer beads */}
          <rect x="9" y="8" width="1" height="1" fill="#78350f" />
          <rect x="11" y="8" width="1" height="1" fill="#78350f" />
          <rect x="14" y="8" width="1" height="1" fill="#78350f" />
          {/* Wide stance pants */}
          <rect x="8" y="17" width="3" height="5" fill="#451a03" />
          <rect x="13" y="17" width="3" height="5" fill="#451a03" />
          {/* Progressive level upgrades */}
          {renderLevelGear(level)}
        </svg>
      );
    }

    // --- RIVALS / BOSSES (No player level gear attached) ---

    // 1. PROCRASTOR THE SLOTH IMP
    if (safeId === 'sloth_imp' || safeId.includes('procrastor')) {
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className="shape-rendering-crispEdges">
          {/* Droopy Horns */}
          <rect x="6" y="2" width="2" height="4" fill="#582a72" />
          <rect x="16" y="2" width="2" height="4" fill="#582a72" />
          {/* Sluggish Body */}
          <rect x="6" y="5" width="12" height="10" fill="#7b4299" />
          {/* Droopy Lazy Eyes */}
          <rect x="8" y="8" width="3" height="1" fill="#e8dec8" />
          <rect x="9" y="8" width="1" height="2" fill="#141022" />
          <rect x="13" y="8" width="3" height="1" fill="#e8dec8" />
          <rect x="14" y="8" width="1" height="2" fill="#141022" />
          {/* Sloth belly */}
          <rect x="8" y="12" width="8" height="5" fill="#9f67bd" />
          {/* Snooze Alarm clock held */}
          <rect x="17" y="13" width="5" height="5" fill="#e43b44" />
          <rect x="18" y="14" width="3" height="3" fill="#fff" />
          <rect x="19" y="15" width="1" height="1" fill="#000" />
          {/* Tiny sleepy legs */}
          <rect x="7" y="18" width="4" height="4" fill="#582a72" />
          <rect x="13" y="18" width="4" height="4" fill="#582a72" />
          {/* "Zzz" bubble */}
          <text x="18" y="7" fill="#3b9eff" fontFamily="monospace" fontSize="6" fontWeight="bold">Z</text>
        </svg>
      );
    }

    // 2. SIR BURNOUT / OVERSTRESSED KNIGHT
    if (safeId === 'burnout_knight' || safeId.includes('burnout')) {
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className="shape-rendering-crispEdges">
          {/* Smoke / Steam from overheated brain */}
          <rect x="10" y="1" width="2" height="2" fill="#e43b44" />
          <rect x="13" y="2" width="2" height="2" fill="#fec83e" />
          {/* Jagged, cracked Helm */}
          <rect x="7" y="4" width="10" height="7" fill="#4a151b" />
          {/* Bloodshot Glowing Eyes */}
          <rect x="8" y="7" width="3" height="2" fill="#ff2a38" />
          <rect x="9" y="7" width="1" height="1" fill="#ffffff" />
          <rect x="13" y="7" width="3" height="2" fill="#ff2a38" />
          <rect x="14" y="7" width="1" height="1" fill="#ffffff" />
          {/* Overheating red-hot armor */}
          <rect x="6" y="11" width="12" height="7" fill="#6e2029" />
          <rect x="8" y="12" width="8" height="4" fill="#a8323f" />
          {/* Coffee cup / battery drained */}
          <rect x="3" y="12" width="3" height="4" fill="#fec83e" />
          {/* Spiky Boots */}
          <rect x="7" y="18" width="4" height="5" fill="#300d11" />
          <rect x="13" y="18" width="4" height="5" fill="#300d11" />
        </svg>
      );
    }

    // 3. PHANTOM OF FEEDS / SCROLL WRAITH
    if (safeId === 'scroll_wraith' || safeId.includes('distraction') || safeId.includes('scroll')) {
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className="shape-rendering-crispEdges">
          {/* Floating Dark Hood */}
          <rect x="7" y="2" width="10" height="6" fill="#171926" />
          <rect x="6" y="6" width="12" height="10" fill="#24283b" />
          {/* Glowing Neon App Icon Face (Infinite Feed) */}
          <rect x="9" y="7" width="6" height="4" fill="#00e5ff" />
          <rect x="10" y="8" width="1" height="1" fill="#000" />
          <rect x="13" y="8" width="1" height="1" fill="#000" />
          {/* Glowing Smartphone in Hand */}
          <rect x="16" y="9" width="5" height="9" fill="#0b0f19" />
          <rect x="17" y="10" width="3" height="7" fill="#ff0055" />
          {/* Floating wispy ghost tails */}
          <rect x="6" y="16" width="3" height="5" fill="#171926" />
          <rect x="11" y="17" width="3" height="6" fill="#24283b" />
          <rect x="15" y="16" width="3" height="4" fill="#171926" />
        </svg>
      );
    }

    // 4. IMPOSTER DRAKE / WYRM OF DOUBT
    if (safeId === 'doubt_drake' || safeId.includes('doubt')) {
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className="shape-rendering-crispEdges">
          {/* Dragon Horns */}
          <rect x="6" y="1" width="2" height="3" fill="#1e1838" />
          <rect x="16" y="1" width="2" height="3" fill="#1e1838" />
          {/* Snarling Dragon Head */}
          <rect x="7" y="3" width="10" height="7" fill="#36295e" />
          <rect x="9" y="5" width="2" height="2" fill="#ffd700" />
          <rect x="13" y="5" width="2" height="2" fill="#ffd700" />
          {/* Mirrored Scale Wings */}
          <rect x="1" y="6" width="5" height="7" fill="#4d3b82" />
          <rect x="18" y="6" width="5" height="7" fill="#4d3b82" />
          {/* Drake Body */}
          <rect x="7" y="10" width="10" height="8" fill="#281e46" />
          <rect x="9" y="12" width="6" height="5" fill="#6d54b3" />
          {/* Claws & Tail */}
          <rect x="6" y="18" width="4" height="4" fill="#1e1838" />
          <rect x="14" y="18" width="4" height="4" fill="#1e1838" />
        </svg>
      );
    }

    // 5. GRANDMASTER APEX
    if (safeId === 'apex_sovereign' || safeId.includes('apex')) {
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className="shape-rendering-crispEdges">
          {/* Crown of Sundials & Habit Mastery */}
          <rect x="8" y="1" width="8" height="3" fill="#fec83e" />
          <rect x="11" y="0" width="2" height="3" fill="#ffd700" />
          {/* Regal Mask & Cape */}
          <rect x="8" y="4" width="8" height="5" fill="#f6eedb" />
          <rect x="9" y="6" width="2" height="1" fill="#141022" />
          <rect x="13" y="6" width="2" height="1" fill="#141022" />
          {/* Royal Purple & Gold Mantle */}
          <rect x="6" y="9" width="12" height="9" fill="#592282" />
          <rect x="9" y="9" width="6" height="9" fill="#fec83e" />
          <rect x="11" y="10" width="2" height="8" fill="#141022" />
          {/* Golden Broadsword */}
          <rect x="18" y="4" width="2" height="14" fill="#fec83e" />
          <rect x="17" y="14" width="4" height="2" fill="#ffd700" />
          {/* Royal Greaves */}
          <rect x="8" y="18" width="3" height="5" fill="#d99b16" />
          <rect x="13" y="18" width="3" height="5" fill="#d99b16" />
        </svg>
      );
    }

    // Default Fallback Hero
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} className="shape-rendering-crispEdges">
        <rect x="8" y="3" width="8" height="6" fill="#fcd2a4" />
        <rect x="7" y="2" width="10" height="3" fill="#8b5a2b" />
        <rect x="9" y="5" width="2" height="2" fill="#1a1528" />
        <rect x="13" y="5" width="2" height="2" fill="#1a1528" />
        <rect x="7" y="9" width="10" height="8" fill="#3b9eff" />
        <rect x="8" y="17" width="3" height="5" fill="#1b4d89" />
        <rect x="13" y="17" width="3" height="5" fill="#1b4d89" />
        {renderLevelGear(level)}
      </svg>
    );
  };

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${getAnimationClass()} ${className}`}
      style={{
        transform: flipped ? 'scaleX(-1)' : 'none',
      }}
    >
      {renderSpriteSvg()}
    </div>
  );
};
