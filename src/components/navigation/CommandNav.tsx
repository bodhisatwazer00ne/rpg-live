import React from 'react';
import { PixelCursor } from '../rpg/PixelCursor';
import { chiptune } from '../../services/audio';

export type NavScreen = 
  | 'dashboard'
  | 'quests'
  | 'character'
  | 'arena'
  | 'achievements'
  | 'leaderboard'
  | 'settings';

interface CommandNavProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  unallocatedPoints?: number;
  activeQuestsCount?: number;
  incomingChallengesCount?: number;
}

interface NavItem {
  id: NavScreen;
  label: string;
  badge?: number | string;
  shortcut?: string;
}

export const CommandNav: React.FC<CommandNavProps> = ({
  currentScreen,
  onNavigate,
  unallocatedPoints = 0,
  activeQuestsCount = 0,
  incomingChallengesCount = 0,
}) => {
  const items: NavItem[] = [
    { id: 'dashboard', label: 'STATUS' },
    { id: 'quests', label: 'QUESTS', badge: activeQuestsCount > 0 ? activeQuestsCount : undefined },
    { id: 'character', label: 'TRAINER', badge: unallocatedPoints > 0 ? `+${unallocatedPoints}` : undefined },
    {
      id: 'arena',
      label: 'ARENA',
      badge: incomingChallengesCount > 0 ? `⚔ ${incomingChallengesCount}` : undefined,
    },
    { id: 'achievements', label: 'BADGES' },
    { id: 'leaderboard', label: 'RANKINGS' },
    { id: 'settings', label: 'CONFIG' },
  ];

  const handleSelect = (id: NavScreen) => {
    if (id !== currentScreen) {
      chiptune.playSelect();
      onNavigate(id);
    }
  };

  return (
    <>
      {/* DESKTOP / TABLET COMMAND MENU (SIDEBAR OR TOP ROW) */}
      <nav
        aria-label="RPG Main Command Menu"
        className="hidden lg:block w-56 shrink-0"
      >
        <div className="border-4 border-[#120e1d] bg-[#f5eedb] p-3 shadow-[4px_4px_0px_#120e1d] sticky top-4">
          <div className="bg-[#201933] text-[#fec83e] font-pixel text-[10px] px-2 py-1 mb-3 border-2 border-[#120e1d] tracking-wider text-center uppercase">
            COMMAND MENU
          </div>

          <div className="space-y-1 font-pixel text-xs">
            {items.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`${item.label}${item.badge !== undefined ? ` - ${item.badge} pending` : ''}`}
                  onClick={() => handleSelect(item.id)}
                  onMouseEnter={() => chiptune.playCursor()}
                  className={`w-full text-left px-2.5 py-2 min-h-[40px] flex items-center justify-between border-2 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec83e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#120e1d] ${
                    isActive
                      ? 'bg-[#2b2540] text-[#fec83e] border-[#120e1d] translate-x-1 shadow-[2px_2px_0px_#000]'
                      : 'bg-transparent text-[#2b2540] border-transparent hover:bg-[#e8dec8] hover:border-[#120e1d]'
                  }`}
                >
                  <div className="flex items-center">
                    <PixelCursor visible={isActive} />
                    <span className="font-bold">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 border ${
                        item.id === 'character' || item.id === 'arena'
                          ? 'bg-[#ef4444] text-white border-[#7f1d1d] animate-pulse font-bold'
                          : 'bg-[#3b9eff] text-[#052044] border-[#1e40af]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t-2 border-[#d4c5a9] text-center">
            <span className="font-silkscreen text-[9px] text-[#6e634e]">
              REAL LIFE IS THE RPG
            </span>
          </div>
        </div>
      </nav>

      {/* MOBILE HANDHELD COMMAND BAR (STICKY BOTTOM NAV) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1f192f] border-t-4 border-[#0b0814] px-1 py-1.5 shadow-[0px_-4px_0px_#000]"
      >
        <div className="flex items-center justify-between overflow-x-auto gap-1 px-1">
          {items.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${item.label}${item.badge !== undefined ? ` - ${item.badge} pending` : ''}`}
                onClick={() => handleSelect(item.id)}
                className={`relative shrink-0 px-2 py-1.5 min-h-[44px] min-w-[44px] font-pixel text-[9px] flex flex-col items-center justify-center border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec83e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#120e1d] ${
                  isActive
                    ? 'bg-[#fec83e] text-[#2b2540] border-[#000] -translate-y-1 shadow-[2px_2px_0px_#000]'
                    : 'bg-[#2a223e] text-[#d1c5e8] border-[#443860]'
                }`}
              >
                {isActive && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[#fec83e] text-[8px] leading-none">
                    ▼
                  </span>
                )}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 bg-[#ef4444] text-white text-[8px] px-1 rounded-none border border-black">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
