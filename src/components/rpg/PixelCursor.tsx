import React from 'react';

interface PixelCursorProps {
  color?: string;
  className?: string;
  visible?: boolean;
}

export const PixelCursor: React.FC<PixelCursorProps> = ({
  color = '#e43b44',
  className = '',
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <span
      className={`inline-block font-pixel text-xs animate-cursor select-none mr-1.5 ${className}`}
      style={{ color }}
      aria-hidden="true"
    >
      ▶
    </span>
  );
};
