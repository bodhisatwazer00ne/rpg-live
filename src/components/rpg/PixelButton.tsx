import React from 'react';
import { chiptune } from '../../services/audio';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'parchment' | 'green' | 'gold' | 'blue' | 'red' | 'dark' | 'stone' | 'wood';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  sound?: boolean;
  children: React.ReactNode;
}

export const PixelButton: React.FC<PixelButtonProps> = ({
  variant = 'parchment',
  size = 'md',
  active = false,
  sound = true,
  className = '',
  onClick,
  onMouseEnter,
  disabled,
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-2.5 py-1 text-[10px] min-h-[36px]',
    md: 'px-3 py-2 text-xs min-h-[44px]',
    lg: 'px-5 py-3 text-sm min-h-[48px]',
  };

  const variantStyles = {
    parchment: 'bg-[#f4ebd9] hover:bg-[#fff7ea] text-[#1c172b] border-[#181425] shadow-[3px_3px_0px_#181425]',
    green: 'bg-[#38b764] hover:bg-[#4dd37b] text-[#0d2a15] border-[#12361d] shadow-[3px_3px_0px_#12361d]',
    gold: 'bg-[#fec83e] hover:bg-[#ffd96a] text-[#3d2a04] border-[#422d05] shadow-[3px_3px_0px_#422d05]',
    blue: 'bg-[#3b9eff] hover:bg-[#60b0ff] text-[#072449] border-[#0e3568] shadow-[3px_3px_0px_#0e3568]',
    red: 'bg-[#e43b44] hover:bg-[#f25860] text-[#ffffff] border-[#3f0c10] shadow-[3px_3px_0px_#3f0c10]',
    dark: 'bg-[#29223c] hover:bg-[#393051] text-[#f4eee3] border-[#130f1e] shadow-[3px_3px_0px_#130f1e]',
    stone: 'bg-[#4e4a59] hover:bg-[#625e6e] text-[#f4eee3] border-[#26232e] shadow-[3px_3px_0px_#26232e]',
    wood: 'bg-[#8a5d3b] hover:bg-[#a67148] text-[#fff6eb] border-[#422915] shadow-[3px_3px_0px_#422915]',
  };

  const focusStyles = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec83e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#120e1d]';
  const activeStyles = active ? 'ring-2 ring-[#fec83e] -translate-y-0.5' : '';
  const disabledStyles = disabled
    ? 'opacity-50 cursor-not-allowed filter grayscale shadow-[1px_1px_0px_#181425] pointer-events-none'
    : 'cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#181425]';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && sound) {
      chiptune.playSelect();
    }
    if (onClick) onClick(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && sound) {
      chiptune.playCursor();
    }
    if (onMouseEnter) onMouseEnter(e);
  };

  return (
    <button
      {...props}
      disabled={disabled}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`font-pixel uppercase tracking-wider border-2 font-bold inline-flex items-center justify-center gap-2 select-none pixel-button ${sizeStyles[size]} ${variantStyles[variant]} ${focusStyles} ${activeStyles} ${disabledStyles} ${className}`}
    >
      {children}
    </button>
  );
};
