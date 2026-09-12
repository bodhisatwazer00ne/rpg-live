import React, { useEffect } from 'react';
import { PixelButton } from './PixelButton';
import { CharacterSprite } from './CharacterSprite';
import { LevelUpEvent } from '../../services/gameEngine';
import { chiptune } from '../../services/audio';

interface LevelUpModalProps {
  event: LevelUpEvent;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ event, onClose }) => {
  useEffect(() => {
    chiptune.playLevelUp();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 select-none backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="levelup-modal-title"
    >
      <div className="relative w-full max-w-md border-4 border-[#120e1d] bg-[#fcedbf] text-[#1c172b] p-5 shadow-[6px_6px_0px_#000]">
        {/* Rivets */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-[#d97706]" />
        <div className="absolute top-2 right-2 w-2 h-2 bg-[#d97706]" />
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-[#d97706]" />
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-[#d97706]" />

        {/* Title Badge */}
        <div className="text-center mb-3">
          <span className="inline-block bg-[#e43b44] text-white font-pixel text-xs px-3 py-1 border-2 border-[#120e1d] shadow-[2px_2px_0px_#000] animate-pulse">
            ★ LEVEL UP! ★
          </span>
          <h2 id="levelup-modal-title" className="font-pixel text-xl sm:text-2xl mt-2 tracking-wider text-[#451a03]">
            LV. {event.oldLevel} ▶ LV. {event.newLevel}
          </h2>

          {/* Evolved Avatar Showcase */}
          <div className="my-2.5 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-[#1e1832] border-2 border-[#120e1d] flex items-center justify-center p-1 shadow-[inset_2px_2px_0px_#000]">
              <CharacterSprite
                id={event.avatarId || 'hero_novice'}
                level={event.newLevel}
                size={72}
                animation="victory"
              />
            </div>
            <span className="font-pixel text-[9px] text-[#b45309] bg-[#fef08a] px-2 py-0.5 border border-[#ca8a04] mt-1">
              NEW AVATAR GEAR EQUIPPED!
            </span>
          </div>

          <p className="font-silkscreen text-xs text-[#78350f] mt-1">
            Your real-world productivity forged new strength & evolved your gear!
          </p>
        </div>

        {/* Title / Rank Evolution Announcement */}
        {event.newTitle && (
          <div className="bg-[#241c38] border-2 border-[#120e1d] p-2.5 mb-3 text-center shadow-[inset_2px_2px_0px_#000]">
            <span className="font-silkscreen text-[9px] text-[#86efac] tracking-widest block uppercase">
              {event.isNewTitle ? '★ NEW TRAINER RANK ATTAINED ★' : 'TRAINER RANK'}
            </span>
            <span className="font-pixel text-sm sm:text-base text-[#fec83e] tracking-wider font-bold">
              {event.newTitle}
            </span>
          </div>
        )}

        {/* Stat increases breakdown */}
        <div className="bg-[#fef9c3] border-2 border-[#b45309] p-3 mb-4 shadow-[inset_2px_2px_0px_#fde047]">
          <h4 className="font-pixel text-[10px] text-[#78350f] uppercase mb-2 border-b border-[#ca8a04] pb-1">
            ATTRIBUTE INCREASES
          </h4>

          <div className="grid grid-cols-2 gap-2 font-pixel text-xs">
            <div className="flex items-center justify-between p-1 bg-[#fef08a]/60 border border-[#eab308]">
              <span className="text-[#991b1b]">STR</span>
              <span className="text-[#15803d]">+{event.attributeIncreases.str}</span>
            </div>
            <div className="flex items-center justify-between p-1 bg-[#fef08a]/60 border border-[#eab308]">
              <span className="text-[#1d4ed8]">INT</span>
              <span className="text-[#15803d]">+{event.attributeIncreases.int}</span>
            </div>
            <div className="flex items-center justify-between p-1 bg-[#fef08a]/60 border border-[#eab308]">
              <span className="text-[#15803d]">END</span>
              <span className="text-[#15803d]">+{event.attributeIncreases.end}</span>
            </div>
            <div className="flex items-center justify-between p-1 bg-[#fef08a]/60 border border-[#eab308]">
              <span className="text-[#475569]">RES</span>
              <span className="text-[#15803d]">+{event.attributeIncreases.res}</span>
            </div>
            <div className="flex items-center justify-between p-1 bg-[#fef08a]/60 border border-[#eab308]">
              <span className="text-[#b45309]">DIS</span>
              <span className="text-[#15803d]">+{event.attributeIncreases.dis}</span>
            </div>
            <div className="flex items-center justify-between p-1 bg-[#fef08a]/60 border border-[#eab308]">
              <span className="text-[#7e22ce]">WIL</span>
              <span className="text-[#15803d]">+{event.attributeIncreases.wil}</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#ca8a04] flex items-center justify-between font-pixel text-[10px] text-[#854d0e]">
            <span>STAT POINTS EARNED:</span>
            <span className="text-sm text-[#b45309] font-bold">+{event.statPointsGained} PTS</span>
          </div>
          <div className="text-[10px] font-silkscreen text-[#78350f] mt-1">
            Full HP & Stamina restored!
          </div>
        </div>

        {/* Claim button */}
        <PixelButton
          variant="gold"
          size="lg"
          className="w-full text-center"
          onClick={onClose}
        >
          CLAIM GLORY ▶
        </PixelButton>
      </div>
    </div>
  );
};
