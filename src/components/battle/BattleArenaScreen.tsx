import React, { useState, useEffect } from 'react';
import { User, Rival, Item, InventoryItem, BattleState, BattleLogEntry } from '../../types';
import { RpgWindow } from '../rpg/RpgWindow';
import { PixelButton } from '../rpg/PixelButton';
import { StatBar } from '../rpg/StatBar';
import { CharacterSprite, SpriteAnimation } from '../rpg/CharacterSprite';
import { computeEffectiveAttributes } from '../../services/storage';
import { calculateBattleDamage } from '../../services/gameEngine';
import { chiptune } from '../../services/audio';
import { SimultaneousBattleArena } from './SimultaneousBattleArena';

interface BattleArenaScreenProps {
  user: User;
  rival: Rival;
  battleId?: string;
  items: Item[];
  inventory: InventoryItem[];
  onVictory: (rival: Rival) => void;
  onDefeat: (rival: Rival) => void;
  onRun: (rival: Rival) => void;
  onUseItemInBattle: (inventoryItemId: string) => void;
}

type BattleEffectType =
  | 'slash'
  | 'crit_burst'
  | 'energy_beam'
  | 'guard_barrier'
  | 'heal_sparkles'
  | 'rival_claw';

interface ActiveEffect {
  type: BattleEffectType;
  target: 'player' | 'rival';
}

const SinglePlayerBattleArena: React.FC<BattleArenaScreenProps> = ({
  user,
  rival,
  items,
  inventory,
  onVictory,
  onDefeat,
  onRun,
  onUseItemInBattle,
}) => {
  const effective = computeEffectiveAttributes(user, inventory, items);

  // Battle dynamic states
  const [playerHp, setPlayerHp] = useState<number>(user.hp);
  const [playerStamina, setPlayerStamina] = useState<number>(user.stamina);
  const [rivalHp, setRivalHp] = useState<number>(rival.hp);

  const [battleState, setBattleState] = useState<BattleState>('PLAYER_TURN');
  const [isPlayerDefending, setIsPlayerDefending] = useState<boolean>(false);
  const [isRivalDefending, setIsRivalDefending] = useState<boolean>(false);

  // Character Animations & Movement
  const [playerAnimation, setPlayerAnimation] = useState<SpriteAnimation>('idle');
  const [rivalAnimation, setRivalAnimation] = useState<SpriteAnimation>('idle');
  const [playerDash, setPlayerDash] = useState<boolean>(false);
  const [rivalDash, setRivalDash] = useState<boolean>(false);

  // Visual Effects & Screen Reactions
  const [activeEffect, setActiveEffect] = useState<ActiveEffect | null>(null);
  const [shakeScreen, setShakeScreen] = useState<boolean>(false);
  const [flashScreen, setFlashScreen] = useState<boolean>(false);

  // Floating battle popups
  const [playerFloatingText, setPlayerFloatingText] = useState<{ text: string; isCrit?: boolean } | null>(null);
  const [rivalFloatingText, setRivalFloatingText] = useState<{ text: string; isCrit?: boolean } | null>(null);

  // Battle chronicle logs
  const [logs, setLogs] = useState<BattleLogEntry[]>([
    {
      id: 'log-0',
      text: `Battle commenced! Trainer ${user.username} challenges ${rival.username}!`,
      type: 'info',
    },
  ]);

  const addLog = (text: string, type: BattleLogEntry['type']) => {
    setLogs((prev) => [...prev.slice(-4), { id: `log-${Date.now()}-${Math.random()}`, text, type }]);
  };

  // Handle Player ATTACK
  const handlePlayerAttack = () => {
    if (battleState !== 'PLAYER_TURN') return;
    setBattleState('ACTION_SELECTED');
    setIsPlayerDefending(false);

    // 1. Dash player toward enemy
    setPlayerDash(true);
    setPlayerAnimation('attack');
    chiptune.playAttack();

    // 2. Impact on rival
    setTimeout(() => {
      const wellnessBonus =
        (effective.total.str +
          effective.total.int +
          effective.total.end +
          effective.total.res +
          effective.total.dis +
          effective.total.wil) /
        6;
      const { damage, isCrit } = calculateBattleDamage(
        effective.total.str,
        rival.attributes.res,
        false,
        isRivalDefending,
        0.05 + effective.total.dis * 0.015,
        user.level,
        effective.total.dis,
        effective.total.wil,
        wellnessBonus
      );

      // Trigger FX overlay
      setActiveEffect({ type: isCrit ? 'crit_burst' : 'slash', target: 'rival' });
      setRivalHp((prev) => Math.max(0, prev - damage));
      setRivalAnimation('hit');
      chiptune.playHit();

      if (isCrit) {
        chiptune.playCrit();
        setShakeScreen(true);
        setFlashScreen(true);
        setTimeout(() => {
          setFlashScreen(false);
          setShakeScreen(false);
        }, 200);
      }

      setRivalFloatingText({
        text: isCrit ? `★ CRIT! -${damage} HP ★` : `-${damage} HP`,
        isCrit,
      });

      addLog(
        isCrit
          ? `${user.username} struck a CRITICAL BLOW for ${damage} damage!`
          : `${user.username} attacked ${rival.username} for ${damage} damage.`,
        isCrit ? 'crit' : 'player_atk'
      );

      // 3. Return player to baseline
      setTimeout(() => {
        setPlayerDash(false);
        setPlayerAnimation('idle');
      }, 150);

      // 4. Conclude attack round
      setTimeout(() => {
        setRivalAnimation('idle');
        setActiveEffect(null);
        setRivalFloatingText(null);

        if (rivalHp - damage <= 0) {
          triggerVictory();
        } else {
          startEnemyTurn();
        }
      }, 550);
    }, 220);
  };

  // Handle Player SPECIAL SKILL
  const handlePlayerSpecial = () => {
    if (battleState !== 'PLAYER_TURN') return;
    if (playerStamina < 20) {
      addLog('Not enough Stamina! Need 20 Stamina.', 'system');
      return;
    }

    setBattleState('ACTION_SELECTED');
    setPlayerStamina((prev) => Math.max(0, prev - 20));
    setIsPlayerDefending(false);

    chiptune.playCrit();
    setPlayerDash(true);
    setPlayerAnimation('attack');
    setActiveEffect({ type: 'energy_beam', target: 'rival' });
    setShakeScreen(true);
    setFlashScreen(true);

    setTimeout(() => {
      setFlashScreen(false);
      const wellnessBonus =
        (effective.total.str +
          effective.total.int +
          effective.total.end +
          effective.total.res +
          effective.total.dis +
          effective.total.wil) /
        6;
      const { damage, isCrit } = calculateBattleDamage(
        effective.total.int,
        rival.attributes.res,
        true,
        isRivalDefending,
        0.18 + effective.total.dis * 0.02,
        user.level,
        effective.total.dis,
        effective.total.wil,
        wellnessBonus
      );

      setRivalHp((prev) => Math.max(0, prev - damage));
      setRivalAnimation('hit');
      setActiveEffect({ type: 'crit_burst', target: 'rival' });
      chiptune.playHit();

      setRivalFloatingText({
        text: `★ SPECIAL! -${damage} HP ★`,
        isCrit: true,
      });

      addLog(
        `${user.username} unleashed a Mindful Focus Surge on ${rival.username} for ${damage} damage!`,
        'crit'
      );

      setTimeout(() => {
        setPlayerDash(false);
        setPlayerAnimation('idle');
      }, 150);

      setTimeout(() => {
        setRivalAnimation('idle');
        setActiveEffect(null);
        setRivalFloatingText(null);
        setShakeScreen(false);

        if (rivalHp - damage <= 0) {
          triggerVictory();
        } else {
          startEnemyTurn();
        }
      }, 600);
    }, 280);
  };

  // Handle Player DEFEND
  const handlePlayerDefend = () => {
    if (battleState !== 'PLAYER_TURN') return;
    setBattleState('ACTION_SELECTED');
    setIsPlayerDefending(true);

    chiptune.playCursor();
    setActiveEffect({ type: 'guard_barrier', target: 'player' });
    setPlayerFloatingText({ text: '🛡 GUARD UP!' });
    addLog(`${user.username} assumed a defensive posture. Incoming damage reduced!`, 'info');

    setTimeout(() => {
      setActiveEffect(null);
      setPlayerFloatingText(null);
      startEnemyTurn();
    }, 500);
  };

  // Handle Player RECOVER
  const handlePlayerRecover = () => {
    if (battleState !== 'PLAYER_TURN') return;
    setBattleState('ACTION_SELECTED');

    chiptune.playHeal();
    const healAmount = Math.max(12, Math.floor(user.level * 4 + effective.total.wil * 2));
    const staminaRestore = 25;

    setPlayerHp((prev) => Math.min(user.maxHp, prev + healAmount));
    setPlayerStamina((prev) => Math.min(user.maxStamina, prev + staminaRestore));

    setActiveEffect({ type: 'heal_sparkles', target: 'player' });
    setPlayerFloatingText({ text: `+${healAmount} HP ♥` });
    addLog(
      `${user.username} took a deep mindful breath, restoring ${healAmount} HP & ${staminaRestore} Stamina!`,
      'heal'
    );

    setTimeout(() => {
      setActiveEffect(null);
      setPlayerFloatingText(null);
      startEnemyTurn();
    }, 600);
  };

  // Enemy Turn Loop
  const startEnemyTurn = () => {
    setBattleState('ENEMY_TURN');
    setIsRivalDefending(false);

    setTimeout(() => {
      const willSpecial = Math.random() < 0.35;
      const isDefend = Math.random() < 0.15;

      if (isDefend) {
        setIsRivalDefending(true);
        chiptune.playCursor();
        setActiveEffect({ type: 'guard_barrier', target: 'rival' });
        setRivalFloatingText({ text: '🛡 GUARDING!' });
        addLog(`${rival.username} took a guarded stance!`, 'info');

        setTimeout(() => {
          setActiveEffect(null);
          setRivalFloatingText(null);
          setBattleState('PLAYER_TURN');
        }, 500);
        return;
      }

      // Rival lunge attack
      setRivalDash(true);
      setRivalAnimation('attack');
      chiptune.playAttack();

      setTimeout(() => {
        const rivalWellness =
          (rival.attributes.str +
            rival.attributes.int +
            rival.attributes.end +
            rival.attributes.res +
            rival.attributes.dis +
            rival.attributes.wil) /
          6;
        const { damage, isCrit } = calculateBattleDamage(
          rival.attributes.str,
          effective.total.res,
          willSpecial,
          isPlayerDefending,
          0.1,
          rival.level,
          rival.attributes.dis,
          rival.attributes.wil,
          rivalWellness
        );

        setPlayerHp((prev) => Math.max(0, prev - damage));
        setPlayerAnimation('hit');
        setActiveEffect({
          type: willSpecial ? 'crit_burst' : 'rival_claw',
          target: 'player',
        });
        chiptune.playHit();

        if (damage > 15 || isCrit) {
          setShakeScreen(true);
          setFlashScreen(true);
          setTimeout(() => {
            setFlashScreen(false);
            setShakeScreen(false);
          }, 200);
        }

        setPlayerFloatingText({
          text: isCrit ? `CRIT! -${damage} HP` : `-${damage} HP`,
          isCrit,
        });

        addLog(
          willSpecial
            ? `${rival.username} executed ${rival.specialSkillName} dealing ${damage} damage!`
            : `${rival.username} attacked ${user.username} for ${damage} damage.`,
          'enemy_atk'
        );

        setTimeout(() => {
          setRivalDash(false);
          setRivalAnimation('idle');
        }, 150);

        setTimeout(() => {
          setPlayerAnimation('idle');
          setActiveEffect(null);
          setPlayerFloatingText(null);

          if (playerHp - damage <= 0) {
            triggerDefeat();
          } else {
            setBattleState('PLAYER_TURN');
          }
        }, 550);
      }, 250);
    }, 450);
  };

  const triggerVictory = () => {
    setBattleState('VICTORY');
    setPlayerAnimation('victory');
    setRivalAnimation('defeat');
    chiptune.playVictory();
    addLog(`Victory! ${rival.username} was overcome by your disciplined training!`, 'crit');
  };

  const triggerDefeat = () => {
    setBattleState('DEFEAT');
    setPlayerAnimation('defeat');
    chiptune.playDefeat();
    addLog(`${user.username} was exhausted in battle. Rest up and train your habits to return stronger!`, 'system');
  };

  // Helper to render combat FX overlays
  const renderEffectOverlay = (target: 'player' | 'rival') => {
    if (!activeEffect || activeEffect.target !== target) return null;

    switch (activeEffect.type) {
      case 'slash':
        return (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
            <svg viewBox="0 0 100 100" className="w-28 h-28 animate-ping">
              <line x1="15" y1="15" x2="85" y2="85" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
              <line x1="25" y1="5" x2="95" y2="75" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
              <line x1="5" y1="25" x2="75" y2="95" stroke="#fec83e" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
        );
      case 'crit_burst':
        return (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
            <div className="w-24 h-24 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[#fec83e] opacity-75 blur-xs rounded-full animate-ping" />
              <svg viewBox="0 0 100 100" className="w-full h-full animate-spin">
                <polygon points="50,0 63,35 100,50 63,65 50,100 37,65 0,50 37,35" fill="#facc15" />
                <polygon points="50,15 58,40 85,50 58,60 50,85 42,60 15,50 42,40" fill="#ffffff" />
              </svg>
            </div>
          </div>
        );
      case 'energy_beam':
        return (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
            <div className="w-28 h-28 relative flex items-center justify-center">
              <div className="absolute w-full h-full bg-[#38bdf8] opacity-60 rounded-full animate-ping" />
              <div className="absolute w-20 h-20 border-4 border-[#818cf8] rotate-45 animate-pulse" />
              <div className="absolute w-12 h-12 bg-white rotate-12 shadow-[0_0_20px_#38bdf8]" />
            </div>
          </div>
        );
      case 'guard_barrier':
        return (
          <div className="absolute -inset-2 pointer-events-none flex items-center justify-center z-30">
            <div className="w-32 h-32 border-4 border-[#38bdf8] bg-[#0284c7]/30 rounded-lg animate-pulse flex items-center justify-center shadow-[0_0_15px_#38bdf8]">
              <span className="font-pixel text-[10px] text-white bg-[#0369a1] px-2 py-0.5 border border-white">
                SHIELD UP
              </span>
            </div>
          </div>
        );
      case 'heal_sparkles':
        return (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute -top-6 font-pixel text-sm text-[#22c55e] animate-bounce bg-[#120e1d] px-2 py-0.5 border border-[#22c55e]">
                ✦ HEALING ✦
              </div>
              <div className="absolute inset-0 bg-[#22c55e]/25 rounded-full animate-ping" />
            </div>
          </div>
        );
      case 'rival_claw':
        return (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
            <svg viewBox="0 0 100 100" className="w-28 h-28 animate-ping">
              <line x1="85" y1="15" x2="15" y2="85" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
              <line x1="95" y1="25" x2="25" y2="95" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
              <line x1="75" y1="5" x2="5" y2="75" stroke="#fee2e2" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 select-none ${shakeScreen ? 'animate-pixel-shake' : ''}`}>
      {/* BATTLE ARENA STAGE (RETRO BATTLEFIELD VIEW) */}
      <div className="relative w-full bg-[#1e283d] border-4 border-[#120e1d] p-4 sm:p-6 shadow-[6px_6px_0px_#120e1d] min-h-[380px] flex flex-col justify-between overflow-hidden">
        {/* Background Retro Grid Lines / Horizon */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_bottom,#3b82f6_1px,transparent_1px),linear-gradient(to_right,#3b82f6_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* Screen Flash on Impact */}
        {flashScreen && (
          <div className="absolute inset-0 bg-white/40 pointer-events-none z-20 animate-ping" />
        )}

        {/* Victory Celebration Overlay */}
        {battleState === 'VICTORY' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-25 bg-[#120e1d]/40">
            <div className="font-pixel text-xl sm:text-2xl text-[#fec83e] bg-[#181425] border-4 border-[#fec83e] px-5 py-2 shadow-[4px_4px_0px_#000] animate-bounce tracking-widest">
              ★ VICTORY ACHIEVED ★
            </div>
            {/* Falling celebration confetti stars */}
            <div className="w-full flex justify-around opacity-90 mt-4 pointer-events-none">
              <span className="text-[#fec83e] text-2xl animate-bounce">★</span>
              <span className="text-[#86efac] text-xl animate-pulse">✦</span>
              <span className="text-[#60a5fa] text-2xl animate-bounce">★</span>
              <span className="text-[#f472b6] text-xl animate-pulse">✦</span>
              <span className="text-[#fec83e] text-2xl animate-bounce">★</span>
            </div>
          </div>
        )}

        {/* TOP ROW: Rival Character + Rival HP Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 z-10">
          {/* Rival HP Card */}
          <div className="w-full sm:w-64 bg-[#f5eedb] border-4 border-[#120e1d] p-2.5 shadow-[3px_3px_0px_#120e1d]">
            <div className="flex items-center justify-between font-pixel text-xs text-[#181425] mb-1">
              <span className="font-bold">{rival.username}</span>
              <span className="text-[10px] text-[#2563eb]">LV. {rival.level}</span>
            </div>
            <StatBar label="HP" current={rivalHp} max={rival.maxHp} type="hp" />
          </div>

          {/* Rival Sprite Container with Attack Movement & FX */}
          <div
            className={`relative flex flex-col items-center transition-transform duration-200 ease-in-out ${
              rivalDash ? '-translate-x-12 sm:-translate-x-20 translate-y-8 scale-110' : ''
            }`}
          >
            {rivalFloatingText && (
              <div
                className={`absolute -top-7 font-pixel text-sm px-2.5 py-0.5 border-2 border-black animate-bounce shadow-[2px_2px_0px_#000] z-30 ${
                  rivalFloatingText.isCrit
                    ? 'bg-[#fec83e] text-[#181425] font-bold'
                    : 'bg-[#ef4444] text-white'
                }`}
              >
                {rivalFloatingText.text}
              </div>
            )}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 bg-[#2d3a54] border-2 border-[#43557a] flex items-center justify-center p-2 shadow-[inset_2px_2px_0px_#000]">
              <CharacterSprite id={rival.avatarId} level={rival.level} size={96} animation={rivalAnimation} />
              {renderEffectOverlay('rival')}
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Player Sprite with Attack Movement & FX + Player Combat Card */}
        <div className="flex flex-col-reverse sm:flex-row items-center sm:items-end justify-between gap-4 mt-6 z-10">
          {/* Player Sprite Container with Attack Movement & FX */}
          <div
            className={`relative flex flex-col items-center transition-transform duration-200 ease-in-out ${
              playerDash ? 'translate-x-12 sm:translate-x-20 -translate-y-8 scale-110' : ''
            }`}
          >
            {playerFloatingText && (
              <div
                className={`absolute -top-7 font-pixel text-sm px-2.5 py-0.5 border-2 border-black animate-bounce shadow-[2px_2px_0px_#000] z-30 ${
                  playerFloatingText.isCrit
                    ? 'bg-[#fec83e] text-[#181425] font-bold'
                    : 'bg-[#10b981] text-white'
                }`}
              >
                {playerFloatingText.text}
              </div>
            )}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 bg-[#2d3a54] border-2 border-[#43557a] flex items-center justify-center p-2 shadow-[inset_2px_2px_0px_#000]">
              <CharacterSprite
                id={user.avatarId}
                level={user.level}
                size={96}
                animation={playerAnimation}
                flipped={true}
              />
              {renderEffectOverlay('player')}
            </div>
          </div>

          {/* Player HP & Stamina Combat Card */}
          <div className="w-full sm:w-72 bg-[#f5eedb] border-4 border-[#120e1d] p-3 shadow-[3px_3px_0px_#120e1d] space-y-2">
            <div className="flex items-center justify-between font-pixel text-xs text-[#181425]">
              <span className="font-bold">{user.username}</span>
              <span className="text-[10px] text-[#2563eb]">LV. {user.level}</span>
            </div>
            <StatBar label="HP" current={playerHp} max={user.maxHp} type="hp" />
            <StatBar
              label="STAMINA"
              current={playerStamina}
              max={user.maxStamina}
              type="stamina"
            />
          </div>
        </div>
      </div>

      {/* BATTLE COMMANDS & LOG PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Battle Log Box */}
        <div className="lg:col-span-7">
          <RpgWindow variant="dark" title="BATTLE CHRONICLE">
            <div className="h-28 overflow-y-auto space-y-1.5 font-silkscreen text-xs text-[#d1c5e8] bg-[#120e1d] p-2.5 border border-[#271f3b]">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`leading-relaxed ${
                    log.type === 'crit'
                      ? 'text-[#fec83e] font-bold'
                      : log.type === 'player_atk'
                      ? 'text-[#86efac]'
                      : log.type === 'enemy_atk'
                      ? 'text-[#fca5a5]'
                      : log.type === 'heal'
                      ? 'text-[#93c5fd]'
                      : 'text-[#e2e8f0]'
                  }`}
                >
                  ▶ {log.text}
                </div>
              ))}
            </div>
          </RpgWindow>
        </div>

        {/* Command Menu */}
        <div className="lg:col-span-5">
          <RpgWindow
            variant="parchment"
            title={battleState === 'PLAYER_TURN' ? 'CHOOSE MOVE:' : 'RESOLVING ACTION...'}
          >
            {battleState === 'VICTORY' ? (
              <div className="text-center space-y-3 py-2">
                <div className="font-pixel text-sm text-[#15803d]">
                  VICTORY ACHIEVED!
                </div>
                <p className="font-silkscreen text-xs text-[#4b4131]">
                  Honors awarded: +{rival.winRewardXp} XP earned!
                </p>
                <PixelButton
                  variant="gold"
                  size="md"
                  className="w-full"
                  onClick={() => onVictory(rival)}
                >
                  CLAIM VICTORY & RETURN ▶
                </PixelButton>
              </div>
            ) : battleState === 'DEFEAT' ? (
              <div className="text-center space-y-3 py-2">
                <div className="font-pixel text-sm text-[#b91c1c]">
                  TRAINER DEFEATED
                </div>
                <p className="font-silkscreen text-xs text-[#4b4131]">
                  Build up your endurance and resilience through daily habits to return stronger.
                </p>
                <PixelButton
                  variant="red"
                  size="md"
                  className="w-full"
                  onClick={() => onDefeat(rival)}
                >
                  RETREAT & RESTORE ▶
                </PixelButton>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <PixelButton
                  variant="parchment"
                  size="sm"
                  disabled={battleState !== 'PLAYER_TURN'}
                  onClick={handlePlayerAttack}
                >
                  ATTACK
                </PixelButton>

                <PixelButton
                  variant="blue"
                  size="sm"
                  disabled={battleState !== 'PLAYER_TURN' || playerStamina < 20}
                  onClick={handlePlayerSpecial}
                >
                  SPECIAL (-20)
                </PixelButton>

                <PixelButton
                  variant="parchment"
                  size="sm"
                  disabled={battleState !== 'PLAYER_TURN'}
                  onClick={handlePlayerDefend}
                >
                  DEFEND
                </PixelButton>

                <PixelButton
                  variant="green"
                  size="sm"
                  disabled={battleState !== 'PLAYER_TURN'}
                  onClick={handlePlayerRecover}
                >
                  RECOVER
                </PixelButton>

                <PixelButton
                  variant="dark"
                  size="sm"
                  disabled={battleState !== 'PLAYER_TURN'}
                  onClick={() => onRun(rival)}
                >
                  RUN
                </PixelButton>
              </div>
            )}
          </RpgWindow>
        </div>
      </div>
    </div>
  );
};

export const BattleArenaScreen: React.FC<BattleArenaScreenProps> = (props) => {
  if (props.battleId) {
    return (
      <SimultaneousBattleArena
        user={props.user}
        rival={props.rival}
        battleId={props.battleId}
        items={props.items}
        inventory={props.inventory}
        onVictory={props.onVictory}
        onDefeat={props.onDefeat}
        onRun={props.onRun}
      />
    );
  }

  return <SinglePlayerBattleArena {...props} />;
};
