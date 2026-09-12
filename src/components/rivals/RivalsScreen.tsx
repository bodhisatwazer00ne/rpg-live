import React from 'react';
import { Rival, User } from '../../types';
import { RpgWindow } from '../rpg/RpgWindow';
import { PixelButton } from '../rpg/PixelButton';
import { CharacterSprite } from '../rpg/CharacterSprite';
import { chiptune } from '../../services/audio';

interface RivalsScreenProps {
  user: User;
  rivals: Rival[];
  onStartBattle: (rivalId: string) => void;
}

export const RivalsScreen: React.FC<RivalsScreenProps> = ({
  user,
  rivals,
  onStartBattle,
}) => {
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'BOSS':
        return 'bg-[#fef08a] text-[#854d0e] border-[#eab308]';
      case 'MASTER':
        return 'bg-[#f3e8ff] text-[#7e22ce] border-[#c084fc]';
      case 'VETERAN':
        return 'bg-[#dbeafe] text-[#1e40af] border-[#93c5fd]';
      case 'ADEPT':
        return 'bg-[#dcfce7] text-[#15803d] border-[#86efac]';
      case 'NOVICE':
      default:
        return 'bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#f5eedb] border-4 border-[#120e1d] p-4 shadow-[4px_4px_0px_#120e1d]">
        <div>
          <h2 className="font-pixel text-base sm:text-lg text-[#181425]">
            RIVALS & INTERNAL FOES
          </h2>
          <p className="font-silkscreen text-xs text-[#5e5443] mt-0.5">
            Test your real-world progress against personified productivity hurdles in turn-based combat.
          </p>
        </div>

        <div className="font-pixel text-xs bg-[#201933] text-[#fec83e] px-3 py-2 border-2 border-[#120e1d]">
          YOUR LEVEL: LV. {user.level}
        </div>
      </div>

      {/* Rivals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rivals.map((rival) => {
          const isHigherLevel = rival.level > user.level;

          return (
            <div
              key={rival.id}
              className="bg-[#fcf8f0] border-4 border-[#120e1d] p-4 shadow-[4px_4px_0px_#120e1d] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-[#1e1832] border-2 border-[#120e1d] p-1 flex items-center justify-center shrink-0">
                      <CharacterSprite id={rival.avatarId} size={48} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-pixel text-xs sm:text-sm text-[#181425]">
                          {rival.username}
                        </h3>
                      </div>
                      <p className="font-silkscreen text-xs text-[#b45309]">
                        {rival.title}
                      </p>
                      <span className="font-pixel text-[10px] text-[#2563eb] mt-0.5 inline-block">
                        LV. {rival.level}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`font-pixel text-[9px] px-2 py-0.5 border ${getDifficultyBadge(
                      rival.difficulty
                    )}`}
                  >
                    {rival.difficulty}
                  </span>
                </div>

                {/* Bio quote */}
                <div className="mt-3 p-2.5 bg-[#ede3ce] border border-[#d4c5a9]">
                  <p className="font-silkscreen text-[11px] text-[#423826] italic">
                    {rival.bio}
                  </p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-1 mt-3 text-center font-pixel text-[9px]">
                  <div className="bg-[#f5eedb] p-1 border border-[#d4c5a9]">
                    <span className="text-[#991b1b] block">HP</span>
                    <span className="font-bold text-[#141022]">{rival.maxHp}</span>
                  </div>
                  <div className="bg-[#f5eedb] p-1 border border-[#d4c5a9]">
                    <span className="text-[#991b1b] block">STR</span>
                    <span className="font-bold text-[#141022]">{rival.attributes.str}</span>
                  </div>
                  <div className="bg-[#f5eedb] p-1 border border-[#d4c5a9]">
                    <span className="text-[#475569] block">RES</span>
                    <span className="font-bold text-[#141022]">{rival.attributes.res}</span>
                  </div>
                  <div className="bg-[#f5eedb] p-1 border border-[#d4c5a9]">
                    <span className="text-[#7e22ce] block">SPECIAL</span>
                    <span className="font-bold text-[#141022]">{rival.attributes.int}</span>
                  </div>
                </div>
              </div>

              {/* Challenge Footer */}
              <div className="mt-4 pt-3 border-t-2 border-[#d4c5a9] flex items-center justify-between">
                <div className="font-pixel text-[9px] text-[#6b5c46]">
                  VICTORY: <span className="text-[#1d4ed8]">+{rival.winRewardXp} XP</span>
                </div>

                <PixelButton
                  variant={isHigherLevel ? 'red' : 'gold'}
                  size="sm"
                  onClick={() => {
                    chiptune.playAttack();
                    onStartBattle(rival.id);
                  }}
                >
                  CHALLENGE
                </PixelButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
