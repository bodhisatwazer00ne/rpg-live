import React, { useState, useEffect, useRef } from 'react';
import { User, Rival, Item, InventoryItem, ActiveBattleSession, BattleActionType, BattleLogEntry } from '../../types';
import { RpgWindow } from '../rpg/RpgWindow';
import { PixelButton } from '../rpg/PixelButton';
import { StatBar } from '../rpg/StatBar';
import { CharacterSprite, SpriteAnimation } from '../rpg/CharacterSprite';
import { PixelIcon } from '../rpg/PixelIcon';
import { 
  subscribeToActiveBattle, 
  submitBattleAction, 
  resolveSimultaneousRound, 
  forfeitActiveBattle,
  isTrainerOnline,
  subscribeToTrainerPresence,
  handleBattleOpponentDisconnect,
} from '../../services/firebase';
import { chiptune } from '../../services/audio';

interface SimultaneousBattleArenaProps {
  user: User;
  rival: Rival;
  battleId: string;
  items: Item[];
  inventory: InventoryItem[];
  onVictory: (rival: Rival) => void;
  onDefeat: (rival: Rival) => void;
  onRun: (rival: Rival) => void;
}

export const SimultaneousBattleArena: React.FC<SimultaneousBattleArenaProps> = ({
  user,
  rival,
  battleId,
  onVictory,
  onDefeat,
  onRun,
}) => {
  const [session, setSession] = useState<ActiveBattleSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Animations & FX
  const [playerAnimation, setPlayerAnimation] = useState<SpriteAnimation>('idle');
  const [rivalAnimation, setRivalAnimation] = useState<SpriteAnimation>('idle');
  const [playerDash, setPlayerDash] = useState<boolean>(false);
  const [rivalDash, setRivalDash] = useState<boolean>(false);
  const [shakeScreen, setShakeScreen] = useState<boolean>(false);
  const [flashScreen, setFlashScreen] = useState<boolean>(false);

  // Floating text
  const [playerFloatingText, setPlayerFloatingText] = useState<{ text: string; isCrit?: boolean; isHeal?: boolean } | null>(null);
  const [rivalFloatingText, setRivalFloatingText] = useState<{ text: string; isCrit?: boolean; isHeal?: boolean } | null>(null);

  // Round countdown timer (15 seconds)
  const [timerSeconds, setTimerSeconds] = useState<number>(15);

  // Battle log
  const [logs, setLogs] = useState<BattleLogEntry[]>([
    {
      id: 'init-log',
      text: `⚔️ Live Simultaneous Duel connected! Both trainers fight simultaneously!`,
      type: 'info',
    },
  ]);

  const lastProcessedRoundRef = useRef<number>(0);
  const isResolvingRef = useRef<boolean>(false);

  // 1. Subscribe to the real-time ActiveBattle document
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToActiveBattle(
      battleId,
      (liveBattle) => {
        if (!liveBattle) {
          setLoading(false);
          return;
        }
        setSession(liveBattle);
        setLoading(false);
      },
      (err) => {
        console.warn('Simultaneous battle subscription error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [battleId]);

  // Monitor rival's real-time online presence during active simultaneous battle
  const [isRivalOnline, setIsRivalOnline] = useState<boolean>(true);
  useEffect(() => {
    if (!session || session.status !== 'IN_PROGRESS' || !rival?.id) return;

    const unsubPresence = subscribeToTrainerPresence(rival.id, (online) => {
      setIsRivalOnline(online);
      if (!online) {
        // Automatically award forfeit victory if rival disconnects
        handleBattleOpponentDisconnect(battleId, rival.id);
      }
    });

    return () => unsubPresence();
  }, [battleId, session?.status, rival?.id]);

  // Determine player and rival roles with complete null-safety
  const isPlayer1 = session?.player1?.id === user.id;
  const isPlayer2 = session?.player2?.id === user.id;
  const myState = isPlayer1
    ? session?.player1
    : isPlayer2
    ? session?.player2
    : session?.player1;
  const rivalState = isPlayer1 ? session?.player2 : session?.player1;

  const mySelectedAction =
    myState?.selectedAction?.round === session?.round ? myState?.selectedAction?.action : null;
  const rivalSelectedAction =
    rivalState?.selectedAction?.round === session?.round ? rivalState?.selectedAction?.action : null;

  const hasMyAction = !!mySelectedAction;
  const hasRivalAction = !!rivalSelectedAction;

  // 2. Automated simultaneous resolution when both moves are locked in
  useEffect(() => {
    if (!session || session.status !== 'IN_PROGRESS') return;

    if (hasMyAction && hasRivalAction && !isResolvingRef.current) {
      // Authoritative resolver: Player 1 triggers the deterministic resolution
      if (isPlayer1) {
        isResolvingRef.current = true;
        resolveSimultaneousRound(battleId, session)
          .catch((err) => console.warn('Resolution trigger note:', err))
          .finally(() => {
            setTimeout(() => {
              isResolvingRef.current = false;
            }, 800);
          });
      }
    }
  }, [session, hasMyAction, hasRivalAction, isPlayer1, battleId]);

  // 3. React to new round resolution (animations, sounds, floating damage)
  useEffect(() => {
    if (!session?.lastResolution) return;

    const res = session.lastResolution;
    if (res.round === lastProcessedRoundRef.current) return;
    lastProcessedRoundRef.current = res.round;

    // Trigger simultaneous charge & clash animations
    setPlayerDash(true);
    setRivalDash(true);
    setPlayerAnimation('attack');
    setRivalAnimation('attack');
    chiptune.playAttack();

    setTimeout(() => {
      // Calculate my damage taken vs rival damage taken
      const myDmg = isPlayer1 ? res.player2DamageDealt : res.player1DamageDealt;
      const rivalDmg = isPlayer1 ? res.player1DamageDealt : res.player2DamageDealt;
      const myHeal = isPlayer1 ? res.player1Heal : res.player2Heal;
      const rivalHeal = isPlayer1 ? res.player2Heal : res.player1Heal;
      const hadCrit = res.player1Crit || res.player2Crit;

      if (hadCrit) {
        chiptune.playCrit();
        setShakeScreen(true);
        setFlashScreen(true);
        setTimeout(() => {
          setFlashScreen(false);
          setShakeScreen(false);
        }, 220);
      } else {
        chiptune.playHit();
      }

      setPlayerAnimation('hit');
      setRivalAnimation('hit');

      // Floating text on Player
      if (myHeal > 0) {
        setPlayerFloatingText({ text: `+${myHeal} HP`, isHeal: true });
      } else if (myDmg > 0) {
        setPlayerFloatingText({ text: `-${myDmg} HP`, isCrit: isPlayer1 ? res.player2Crit : res.player1Crit });
      }

      // Floating text on Rival
      if (rivalHeal > 0) {
        setRivalFloatingText({ text: `+${rivalHeal} HP`, isHeal: true });
      } else if (rivalDmg > 0) {
        setRivalFloatingText({ text: `-${rivalDmg} HP`, isCrit: isPlayer1 ? res.player1Crit : res.player2Crit });
      }

      // Append log entry
      setLogs((prev) => [
        ...prev.slice(-6),
        {
          id: `res-${res.round}-${Date.now()}`,
          text: res.summary,
          type: res.player1Crit || res.player2Crit ? 'crit' : 'info',
        },
      ]);

      // Reset positions & text after short duration
      setTimeout(() => {
        setPlayerDash(false);
        setRivalDash(false);
        setPlayerAnimation('idle');
        setRivalAnimation('idle');
        setPlayerFloatingText(null);
        setRivalFloatingText(null);
        setTimerSeconds(15);
      }, 700);
    }, 250);
  }, [session?.lastResolution, isPlayer1]);

  // 4. Round timer countdown
  useEffect(() => {
    if (!session || session.status !== 'IN_PROGRESS') return;
    if (hasMyAction && hasRivalAction) return;

    const timer = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          // Auto-submit action if player hasn't picked yet
          if (!hasMyAction && session) {
            submitBattleAction(battleId, user.id, 'DEFEND', session.round);
          }
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session, hasMyAction, hasRivalAction, battleId, user.id]);

  // Handle action submission
  const handleActionClick = async (action: BattleActionType) => {
    if (!session || session.status !== 'IN_PROGRESS' || hasMyAction) return;
    chiptune.playSelect();
    try {
      await submitBattleAction(battleId, user.id, action, session.round);
    } catch (err) {
      console.warn('Error submitting action:', err);
    }
  };

  // Handle forfeit
  const handleForfeit = async () => {
    chiptune.playCursor();
    try {
      await forfeitActiveBattle(battleId, user.id);
    } catch (err) {
      console.warn('Forfeit note:', err);
    }
    onRun(rival);
  };

  if (loading || !session || !myState || !rivalState) {
    return (
      <div className="bg-[#1b1429] border-4 border-[#120e1d] p-8 text-center text-[#f4eee3] space-y-3 shadow-[4px_4px_0px_#120e1d]">
        <div className="font-pixel text-base text-[#fec83e] animate-pulse">
          SYNCHRONIZING LIVE SIMULTANEOUS ARENA...
        </div>
        <p className="font-silkscreen text-xs text-[#a594c7]">
          Connecting real-time socket with rival trainer {rival.username}...
        </p>
      </div>
    );
  }

  const isResolved = session.status === 'RESOLVED' || session.status === 'FORFEIT';
  const isWinner = session.winnerId === user.id;

  return (
    <div
      className={`space-y-4 select-none relative ${
        shakeScreen ? 'animate-bounce' : ''
      } ${flashScreen ? 'brightness-150' : ''}`}
    >
      {/* ARENA HEADER: Online Simultaneous Banner */}
      <div className="bg-[#181425] border-4 border-[#120e1d] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[#f4eee3] shadow-[4px_4px_0px_#120e1d]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-ping" />
          <span className="font-pixel text-xs text-[#fec83e] tracking-wider">
            LIVE SIMULTANEOUS COMBAT
          </span>
          <span className="font-pixel text-[10px] bg-[#2d1b4e] text-[#a78bfa] px-2 py-0.5 border border-[#5b21b6]">
            ROUND {session.round}
          </span>
          {isRivalOnline ? (
            <span className="hidden sm:inline-flex items-center gap-1 font-pixel text-[9px] bg-[#064e3b] text-[#6ee7b7] px-2 py-0.5 border border-[#047857]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-ping" />
              RIVAL ONLINE
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 font-pixel text-[9px] bg-[#7f1d1d] text-[#fca5a5] px-2 py-0.5 border border-[#b91c1c] animate-pulse">
              ⚠️ RIVAL OFFLINE
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="font-pixel text-xs bg-[#241c38] text-[#fcd34d] px-2.5 py-1 border border-[#3e3458]">
            ⏱ {timerSeconds}s
          </div>
          <button
            onClick={handleForfeit}
            className="font-pixel text-[10px] text-[#ef4444] hover:text-white hover:underline cursor-pointer"
          >
            [FORFEIT DUEL]
          </button>
        </div>
      </div>

      {/* COMBAT STAGE */}
      <div className="relative bg-[#1c2438] border-4 border-[#120e1d] p-4 sm:p-6 overflow-hidden shadow-[4px_4px_0px_#120e1d]">
        {/* Background battle tiles */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* TOP ROW: Rival Character + Rival HP & Status */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 z-10 relative">
          {/* Rival HP Card */}
          <div className="w-full sm:w-64 bg-[#f5eedb] border-4 border-[#120e1d] p-2.5 shadow-[3px_3px_0px_#120e1d]">
            <div className="flex items-center justify-between font-pixel text-xs text-[#181425] mb-1">
              <span className="font-bold">{rivalState.username || rival?.username || 'Rival Trainer'}</span>
              <span className="text-[10px] text-[#2563eb]">LV. {rivalState.level || rival?.level || 1}</span>
            </div>
            <StatBar label="HP" current={rivalState.hp ?? rivalState.maxHp ?? 50} max={rivalState.maxHp || 50} type="hp" />
            <div className="mt-1.5 flex items-center justify-between font-silkscreen text-[9px] text-[#554a37]">
              <span>STATUS:</span>
              <span className={hasRivalAction ? 'text-[#15803d] font-bold' : 'text-[#b45309]'}>
                {hasRivalAction ? '✓ ACTION LOCKED IN' : '⏳ CHOOSING MOVE...'}
              </span>
            </div>
          </div>

          {/* Rival Sprite Container with Dash Movement */}
          <div
            className={`relative flex flex-col items-center transition-transform duration-200 ease-in-out ${
              rivalDash ? '-translate-x-12 sm:-translate-x-20 translate-y-8 scale-110' : ''
            }`}
          >
            {rivalFloatingText && (
              <div
                className={`absolute -top-7 font-pixel text-sm px-2.5 py-0.5 border-2 border-black animate-bounce shadow-[2px_2px_0px_#000] z-30 ${
                  rivalFloatingText.isHeal
                    ? 'bg-[#10b981] text-white'
                    : rivalFloatingText.isCrit
                    ? 'bg-[#fec83e] text-[#181425] font-bold'
                    : 'bg-[#ef4444] text-white'
                }`}
              >
                {rivalFloatingText.text}
              </div>
            )}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 bg-[#2d3a54] border-2 border-[#43557a] flex items-center justify-center p-2 shadow-[inset_2px_2px_0px_#000]">
              <CharacterSprite
                id={rivalState.avatarId || rival?.avatarId || 'hero_novice'}
                level={rivalState.level || rival?.level || 1}
                size={96}
                animation={rivalAnimation}
              />
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Player Sprite with Dash Movement + Player Combat Card */}
        <div className="flex flex-col-reverse sm:flex-row items-center sm:items-end justify-between gap-4 mt-6 z-10 relative">
          {/* Player Sprite Container with Dash Movement */}
          <div
            className={`relative flex flex-col items-center transition-transform duration-200 ease-in-out ${
              playerDash ? 'translate-x-12 sm:translate-x-20 -translate-y-8 scale-110' : ''
            }`}
          >
            {playerFloatingText && (
              <div
                className={`absolute -top-7 font-pixel text-sm px-2.5 py-0.5 border-2 border-black animate-bounce shadow-[2px_2px_0px_#000] z-30 ${
                  playerFloatingText.isHeal
                    ? 'bg-[#10b981] text-white'
                    : playerFloatingText.isCrit
                    ? 'bg-[#fec83e] text-[#181425] font-bold'
                    : 'bg-[#ef4444] text-white'
                }`}
              >
                {playerFloatingText.text}
              </div>
            )}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 bg-[#2d3a54] border-2 border-[#43557a] flex items-center justify-center p-2 shadow-[inset_2px_2px_0px_#000]">
              <CharacterSprite
                id={myState.avatarId || user?.avatarId || 'hero_novice'}
                level={myState.level || user?.level || 1}
                size={96}
                animation={playerAnimation}
                flipped={true}
              />
            </div>
          </div>

          {/* Player HP & Stamina Combat Card */}
          <div className="w-full sm:w-72 bg-[#f5eedb] border-4 border-[#120e1d] p-3 shadow-[3px_3px_0px_#120e1d] space-y-2">
            <div className="flex items-center justify-between font-pixel text-xs text-[#181425]">
              <span className="font-bold">{myState.username || user?.username || 'Trainer'}</span>
              <span className="text-[10px] text-[#2563eb]">LV. {myState.level || user?.level || 1}</span>
            </div>
            <StatBar label="HP" current={myState.hp ?? user?.hp ?? 50} max={myState.maxHp ?? user?.maxHp ?? 50} type="hp" />
            <StatBar label="STAMINA" current={myState.stamina ?? user?.stamina ?? 50} max={myState.maxStamina ?? user?.maxStamina ?? 50} type="stamina" />
            <div className="flex items-center justify-between font-silkscreen text-[9px] text-[#554a37] pt-0.5">
              <span>YOUR ACTION:</span>
              <span className={hasMyAction ? 'text-[#15803d] font-bold' : 'text-[#2563eb]'}>
                {hasMyAction ? `✓ LOCKED IN (${mySelectedAction})` : 'SELECT MOVE BELOW'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BATTLE CHRONICLE & COMMAND MENU */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Battle Log Box */}
        <div className="lg:col-span-6">
          <RpgWindow variant="dark" title="SIMULTANEOUS BATTLE CHRONICLE">
            <div className="h-32 overflow-y-auto space-y-1.5 font-silkscreen text-xs text-[#d1c5e8] bg-[#120e1d] p-2.5 border border-[#271f3b]">
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

        {/* Command Controls */}
        <div className="lg:col-span-6">
          <RpgWindow
            variant="parchment"
            title={
              isResolved
                ? 'DUEL RESOLUTION'
                : hasMyAction
                ? 'WAITING FOR RIVAL MOVE...'
                : 'CHOOSE YOUR ACTION (SIMULTANEOUS):'
            }
          >
            {isResolved ? (
              <div className="text-center space-y-3 py-2">
                <div
                  className={`font-pixel text-base font-bold ${
                    isWinner ? 'text-[#15803d]' : 'text-[#b91c1c]'
                  }`}
                >
                  {isWinner ? '🏆 VICTORY ACHIEVED!' : '💀 DEFEAT IN COMBAT'}
                </div>
                <p className="font-silkscreen text-xs text-[#4b4131]">
                  {session.forfeitById
                    ? isWinner
                      ? `${rivalState.username} went offline or forfeited the match! Victory awarded by default (+80 XP & 50 Gold).`
                      : `You forfeited the match against ${rivalState.username}.`
                    : isWinner
                    ? `You conquered ${rivalState.username} in a live simultaneous duel! Honors: +80 XP & 50 Gold awarded.`
                    : `${rivalState.username} prevailed this duel. Train your attributes and challenge again!`}
                </p>
                <PixelButton
                  variant={isWinner ? 'gold' : 'red'}
                  size="md"
                  className="w-full"
                  onClick={() => {
                    if (isWinner) onVictory(rival);
                    else onDefeat(rival);
                  }}
                >
                  {isWinner ? 'CLAIM VICTORY & RETURN ▶' : 'RETURN TO ARENA ▶'}
                </PixelButton>
              </div>
            ) : hasMyAction ? (
              <div className="text-center py-4 space-y-2 bg-[#f4ebdc] border border-[#cfbe9e] p-3">
                <div className="font-pixel text-xs text-[#15803d] flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#15803d] animate-ping" />
                  YOUR MOVE [{mySelectedAction}] IS LOCKED IN!
                </div>
                <p className="font-silkscreen text-[11px] text-[#5e533e]">
                  {hasRivalAction
                    ? 'Both trainers ready! Resolving simultaneous clash...'
                    : `Waiting for ${rivalState.username} to confirm their move (${timerSeconds}s remaining)...`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <PixelButton
                  variant="gold"
                  size="sm"
                  onClick={() => handleActionClick('STRIKE')}
                  className="w-full justify-start py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <PixelIcon name="sword" size={16} />
                    <div className="text-left">
                      <div className="font-pixel text-[11px] leading-none">STRIKE</div>
                      <div className="font-silkscreen text-[9px] text-[#554a37] leading-none mt-1">12 Stamina</div>
                    </div>
                  </div>
                </PixelButton>

                <PixelButton
                  variant="stone"
                  size="sm"
                  onClick={() => handleActionClick('DEFEND')}
                  className="w-full justify-start py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <PixelIcon name="shield" size={16} />
                    <div className="text-left">
                      <div className="font-pixel text-[11px] leading-none">DEFEND</div>
                      <div className="font-silkscreen text-[9px] text-[#554a37] leading-none mt-1">+15 Stamina</div>
                    </div>
                  </div>
                </PixelButton>

                <PixelButton
                  variant="wood"
                  size="sm"
                  disabled={myState.stamina < 24}
                  onClick={() => handleActionClick('FOCUS_SURGE')}
                  className="w-full justify-start py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <PixelIcon name="star" size={16} />
                    <div className="text-left">
                      <div className="font-pixel text-[11px] leading-none">FOCUS SURGE</div>
                      <div className="font-silkscreen text-[9px] text-[#554a37] leading-none mt-1">24 Stamina • Crit</div>
                    </div>
                  </div>
                </PixelButton>

                <PixelButton
                  variant="parchment"
                  size="sm"
                  onClick={() => handleActionClick('HEAL_POTION')}
                  className="w-full justify-start py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <PixelIcon name="potion-red" size={16} />
                    <div className="text-left">
                      <div className="font-pixel text-[11px] leading-none">ELIXIR</div>
                      <div className="font-silkscreen text-[9px] text-[#554a37] leading-none mt-1">+40 HP</div>
                    </div>
                  </div>
                </PixelButton>
              </div>
            )}
          </RpgWindow>
        </div>
      </div>
    </div>
  );
};
