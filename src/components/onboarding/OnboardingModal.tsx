import React, { useState } from 'react';
import { PixelButton } from '../rpg/PixelButton';
import { CharacterSprite } from '../rpg/CharacterSprite';
import { chiptune } from '../../services/audio';

interface OnboardingModalProps {
  onComplete: (username: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [name, setName] = useState<string>('Trainer');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    chiptune.playLevelUp();
    onComplete(name.trim() || 'Trainer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-6 select-none overflow-y-auto">
      <div className="relative w-full max-w-md border-4 border-[#120e1d] bg-[#f5eedb] text-[#1c172b] p-5 sm:p-7 shadow-[6px_6px_0px_#000]">
        {/* Retro Corner Rivets */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-[#d4c5a9]" />
        <div className="absolute top-2 right-2 w-2 h-2 bg-[#d4c5a9]" />
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-[#d4c5a9]" />
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-[#d4c5a9]" />

        {/* Header */}
        <div className="text-center mb-4">
          <span className="inline-block bg-[#2b2540] text-[#fec83e] font-pixel text-[10px] px-3 py-1 border-2 border-[#141022]">
            TRAINER REGISTRY • NEW ADVENTURE
          </span>
          <h1 className="font-pixel text-lg sm:text-xl mt-3 text-[#181425]">
            WELCOME TO LIFE RPG
          </h1>
          <p className="font-silkscreen text-xs text-[#6e5d42] mt-1">
            Real life is the gameplay. The pixel RPG is your motivation.
          </p>
        </div>

        {/* Hero Sprite & Philosophy Card */}
        <div className="bg-[#ede3ce] border-2 border-[#120e1d] p-3 mb-4 flex items-center gap-4">
          <div className="w-18 h-18 bg-[#181425] border-2 border-[#120e1d] flex items-center justify-center p-1 shrink-0">
            <CharacterSprite id="hero_novice" size={60} />
          </div>
          <div className="text-left">
            <h2 className="font-pixel text-xs text-[#181425]">RANK: NOVICE ADVENTURER</h2>
            <p className="font-silkscreen text-[11px] text-[#423725] mt-1 leading-snug">
              Every trainer begins from ground zero. Complete real-world quests to level up and advance your title toward legendary ranks!
            </p>
          </div>
        </div>

        {/* Username Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[#ede3ce] border-2 border-[#120e1d] p-3.5">
            <label className="block font-pixel text-xs text-[#2b2540] mb-2 uppercase">
              Enter Trainer Codename:
            </label>
            <input
              type="text"
              maxLength={16}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your trainer name..."
              className="w-full bg-[#fcf8f0] border-2 border-[#181425] p-2.5 font-pixel text-sm text-[#181425] focus:outline-none focus:ring-2 focus:ring-[#fec83e]"
              autoFocus
            />
          </div>

          {/* Starting Baseline Stats Preview: ALL ZERO */}
          <div className="bg-[#ede3ce] border-2 border-[#120e1d] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-[10px] text-[#1c172b]">
                STARTING ATTRIBUTES
              </span>
              <span className="font-pixel text-[9px] bg-[#e0d6be] px-1.5 py-0.5 border border-[#c4b59a] text-[#554a37]">
                ZERO BASELINE
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1 text-center font-pixel text-[9px]">
              <div className="bg-[#fcf8f0] p-1.5 border border-[#d4c5a9]">
                <div className="text-[#991b1b]">STR</div>
                <div className="font-bold text-sm text-[#181425]">0</div>
              </div>
              <div className="bg-[#fcf8f0] p-1.5 border border-[#d4c5a9]">
                <div className="text-[#1d4ed8]">INT</div>
                <div className="font-bold text-sm text-[#181425]">0</div>
              </div>
              <div className="bg-[#fcf8f0] p-1.5 border border-[#d4c5a9]">
                <div className="text-[#15803d]">END</div>
                <div className="font-bold text-sm text-[#181425]">0</div>
              </div>
              <div className="bg-[#fcf8f0] p-1.5 border border-[#d4c5a9]">
                <div className="text-[#475569]">RES</div>
                <div className="font-bold text-sm text-[#181425]">0</div>
              </div>
              <div className="bg-[#fcf8f0] p-1.5 border border-[#d4c5a9]">
                <div className="text-[#b45309]">DIS</div>
                <div className="font-bold text-sm text-[#181425]">0</div>
              </div>
              <div className="bg-[#fcf8f0] p-1.5 border border-[#d4c5a9]">
                <div className="text-[#7e22ce]">WIL</div>
                <div className="font-bold text-sm text-[#181425]">0</div>
              </div>
            </div>

            <p className="font-silkscreen text-[10px] text-[#5e513b] mt-2 text-center">
              Complete quests in real life to forge your stats from 0 upward!
            </p>
          </div>

          {/* Action Button */}
          <PixelButton
            type="submit"
            variant="green"
            size="lg"
            className="w-full"
            onClick={() => handleSubmit()}
          >
            START ADVENTURE ▶
          </PixelButton>
        </form>
      </div>
    </div>
  );
};
