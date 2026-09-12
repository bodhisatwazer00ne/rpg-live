import React from 'react';

interface StatBarProps {
  label: string;
  current: number;
  max: number;
  type?: 'hp' | 'xp' | 'stamina' | 'stat';
  showValues?: boolean;
  className?: string;
}

export const StatBar: React.FC<StatBarProps> = ({
  label,
  current,
  max,
  type = 'stat',
  showValues = true,
  className = '',
}) => {
  const percentage = Math.max(0, Math.min(100, Math.round((current / (max || 1)) * 100)));

  const getBarColor = () => {
    switch (type) {
      case 'hp':
        if (percentage > 50) return 'bg-[#38b764]';
        if (percentage > 25) return 'bg-[#fec83e]';
        return 'bg-[#e43b44]';
      case 'xp':
        return 'bg-[#3b9eff]';
      case 'stamina':
        return 'bg-[#00c090]';
      case 'stat':
      default:
        return 'bg-[#a359ff]';
    }
  };

  const getTrackBg = () => {
    switch (type) {
      case 'hp':
        return 'bg-[#351a23]';
      case 'xp':
        return 'bg-[#15233b]';
      case 'stamina':
        return 'bg-[#142d27]';
      default:
        return 'bg-[#211a33]';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1 font-pixel text-[10px] sm:text-xs">
        <span className="tracking-wider uppercase font-bold text-[#f7efde] flex items-center gap-1.5">
          <span
            className={`w-2 h-2 inline-block border border-black ${
              type === 'hp' ? 'bg-[#e43b44]' : type === 'xp' ? 'bg-[#3b9eff]' : 'bg-[#fec83e]'
            }`}
          />
          {label}
        </span>
        {showValues && (
          <span className="font-rpg text-sm sm:text-base text-[#f7efde]/90">
            {current} <span className="opacity-60">/</span> {max}
          </span>
        )}
      </div>

      {/* Chunky Outer Bevel Track */}
      <div
        className={`relative h-4 w-full border-2 border-[#120e1d] ${getTrackBg()} p-0.5 shadow-[inset_2px_2px_0px_#000]`}
      >
        {/* Animated Bar Fill */}
        <div
          className={`h-full ${getBarColor()} transition-all duration-300 ease-out border-r border-[#120e1d]`}
          style={{ width: `${percentage}%` }}
        />

        {/* Pixel Scanline Dithering Effect on Bar */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(255,255,255,0.25)_0%,transparent_50%,rgba(0,0,0,0.25)_100%)]" />
      </div>
    </div>
  );
};
