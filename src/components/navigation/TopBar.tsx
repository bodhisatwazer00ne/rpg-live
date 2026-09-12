import React from 'react';
import { User, GameSettings } from '../../types';
import { PixelIcon } from '../rpg/PixelIcon';
import { chiptune } from '../../services/audio';
import { AccountHeaderWidget } from '../auth/AccountHeaderWidget';

interface TopBarProps {
  user: User;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onNavigate: (tab: string) => void;
  activeTab: string;
  onOpenAuthModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  settings,
  onUpdateSettings,
  onNavigate,
  activeTab,
  onOpenAuthModal,
}) => {
  const toggleSound = () => {
    const nextVal = !settings.soundEnabled;
    chiptune.isEnabled = nextVal;
    onUpdateSettings({ soundEnabled: nextVal });
    if (nextVal) chiptune.playSelect();
  };

  const toggleCrt = () => {
    chiptune.playSelect();
    onUpdateSettings({ crtFilterEnabled: !settings.crtFilterEnabled });
  };

  return (
    <header className="w-full bg-[#181425] border-b-4 border-[#0b0814] text-[#f4eee3] px-3 py-2 select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Brand / Logo (Keyboard accessible button) */}
        <button 
          type="button"
          onClick={() => onNavigate('dashboard')}
          aria-label="Life RPG Home - Return to Dashboard"
          className="flex items-center gap-2 cursor-pointer group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec83e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#181425] p-1"
        >
          <div className="w-7 h-7 bg-[#e43b44] border-2 border-[#fff] flex items-center justify-center shadow-[2px_2px_0px_#000] group-hover:rotate-6 transition-transform">
            <span className="font-pixel text-xs text-white">L</span>
          </div>
          <div>
            <h1 className="font-pixel text-xs sm:text-sm tracking-wider text-[#fec83e] flex items-center gap-1.5">
              LIFE RPG
              <span className="text-[9px] text-[#38b764] bg-[#0d2a15] px-1 py-0.2 border border-[#257142]">
                v1.0
              </span>
            </h1>
          </div>
        </button>

        {/* Global Player Quick Stats Bar & User Auth Widget */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-pixel text-[10px] sm:text-xs">
          {/* Level */}
          <div className="bg-[#241c38] px-2 py-1 border border-[#3e3458] flex items-center gap-1">
            <span className="text-[#a359ff]">LV.</span>
            <span className="text-[#f4eee3] font-bold">{user.level}</span>
          </div>

          {/* Streak */}
          <div 
            title="Current unbroken active habit streak"
            aria-label={`Current habit streak: ${user.streak} days`}
            className="bg-[#241c38] px-2 py-1 border border-[#3e3458] flex items-center gap-1 text-[#f97316]"
          >
            <PixelIcon name="flame" size={14} />
            <span>{user.streak}D</span>
          </div>

          {/* Sound Mute/Unmute toggle */}
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={settings.soundEnabled}
            aria-label={settings.soundEnabled ? 'Mute Chiptune Sound' : 'Enable Chiptune Sound'}
            title={settings.soundEnabled ? 'Mute Chiptune Sound' : 'Enable Chiptune Sound'}
            className={`px-2 py-1.5 min-h-[36px] sm:min-h-[30px] border text-[9px] cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec83e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#181425] ${
              settings.soundEnabled
                ? 'bg-[#2b4c33] border-[#38b764] text-[#86efac]'
                : 'bg-[#401f24] border-[#e43b44] text-[#fca5a5]'
            }`}
          >
            {settings.soundEnabled ? 'SFX: ON' : 'SFX: OFF'}
          </button>

          {/* CRT Retro scanlines filter toggle */}
          <button
            type="button"
            onClick={toggleCrt}
            aria-pressed={settings.crtFilterEnabled}
            aria-label="Toggle retro CRT scanline overlay"
            title="Toggle retro CRT scanline overlay"
            className={`px-2 py-1.5 min-h-[36px] sm:min-h-[30px] border text-[9px] cursor-pointer hidden md:inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec83e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#181425] ${
              settings.crtFilterEnabled
                ? 'bg-[#1e3a5f] border-[#3b9eff] text-[#93c5fd]'
                : 'bg-[#241c38] border-[#3e3458] text-[#94a3b8]'
            }`}
          >
            CRT
          </button>

          {/* Account Profile & Cloud Sync Widget */}
          <AccountHeaderWidget onOpenAuthModal={onOpenAuthModal} />
        </div>
      </div>
    </header>
  );
};

