import React, { useEffect } from 'react';
import { PixelButton } from './PixelButton';
import { PixelIcon } from './PixelIcon';
import { Badge } from '../../types';
import { chiptune } from '../../services/audio';

export interface RewardPayload {
  title: string;
  subtitle?: string;
  xp?: number;
  statGains?: Partial<Record<string, number>>;
  unlockedBadge?: Badge;
}

interface RewardModalProps {
  reward: RewardPayload;
  onClose: () => void;
}

export const RewardModal: React.FC<RewardModalProps> = ({ reward, onClose }) => {
  useEffect(() => {
    chiptune.playQuestComplete();
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
      aria-labelledby="reward-modal-title"
    >
      <div className="relative w-full max-w-sm border-4 border-[#120e1d] bg-[#f5eedb] text-[#1c172b] p-5 shadow-[6px_6px_0px_#000]">
        <div className="text-center mb-4">
          <div id="reward-modal-title" className="inline-block bg-[#38b764] text-[#0d2a15] font-pixel text-xs px-3 py-1 border-2 border-[#12361d] shadow-[2px_2px_0px_#12361d] uppercase font-bold">
            ★ {reward.title} ★
          </div>
          {reward.subtitle && (
            <p className="font-silkscreen text-xs text-[#524939] mt-2">
              {reward.subtitle}
            </p>
          )}
        </div>

        {/* Rewards Box */}
        <div className="bg-[#ede3ce] border-2 border-[#120e1d] p-3 mb-4 space-y-2">
          {reward.xp && (
            <div className="flex items-center justify-between font-pixel text-xs bg-[#f4eee3] p-2 border border-[#d4c5a9]">
              <span className="flex items-center gap-1.5 text-[#1e40af]">
                <PixelIcon name="xp" size={16} /> XP REWARD:
              </span>
              <span className="font-bold text-[#1d4ed8]">+{reward.xp} XP</span>
            </div>
          )}

          {reward.statGains && Object.keys(reward.statGains).length > 0 && (
            <div className="bg-[#f4eee3] p-2 border border-[#d4c5a9]">
              <span className="font-pixel text-[10px] text-[#4b4333] block mb-1">
                ATTRIBUTES HONED:
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(reward.statGains).map(([stat, val]) => (
                  <span
                    key={stat}
                    className="font-pixel text-[10px] bg-[#dcfce7] text-[#166534] px-1.5 py-0.5 border border-[#86efac]"
                  >
                    {stat.toUpperCase()} +{val}
                  </span>
                ))}
              </div>
            </div>
          )}

          {reward.unlockedBadge && (
            <div className="bg-[#fef9c3] border-2 border-[#ca8a04] p-2 mt-2">
              <span className="font-pixel text-[9px] text-[#854d0e] uppercase block">
                BADGE UNLOCKED!
              </span>
              <div className="flex items-center gap-2 mt-1">
                <PixelIcon name="trophy" size={20} />
                <div>
                  <div className="font-pixel text-xs text-[#713f12]">
                    {reward.unlockedBadge.name}
                  </div>
                  <div className="font-silkscreen text-[10px] text-[#854d0e]">
                    {reward.unlockedBadge.description}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <PixelButton variant="green" size="md" className="w-full" onClick={onClose}>
          CONTINUE ▶
        </PixelButton>
      </div>
    </div>
  );
};
