import React from 'react';

interface RpgWindowProps {
  title?: string;
  subtitle?: string;
  variant?: 'parchment' | 'dark' | 'gold' | 'blue';
  className?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}

export const RpgWindow: React.FC<RpgWindowProps> = ({
  title,
  subtitle,
  variant = 'parchment',
  className = '',
  headerRight,
  children,
  id,
}) => {
  const bgStyles = {
    parchment: 'bg-[#f6efe2] text-[#221c35] border-[#181425]',
    dark: 'bg-[#1f192f] text-[#f4eee3] border-[#100c1c]',
    gold: 'bg-[#fcedbf] text-[#221c35] border-[#4a2e0a]',
    blue: 'bg-[#1e2b45] text-[#e8f1ff] border-[#0c1424]',
  };

  const titleBarStyles = {
    parchment: 'bg-[#2b2540] text-[#f7efde] border-[#181425]',
    dark: 'bg-[#141022] text-[#fcedbf] border-[#0b0814]',
    gold: 'bg-[#6b4716] text-[#ffea9f] border-[#422a08]',
    blue: 'bg-[#121c30] text-[#78b7ff] border-[#09101c]',
  };

  return (
    <div
      id={id}
      className={`relative border-4 rounded-none shadow-[4px_4px_0px_#141022] ${bgStyles[variant]} ${className}`}
    >
      {/* Corner Pixel Rivets */}
      <div className="absolute top-1 left-1 w-2 h-2 bg-[#d2c4aa]/50 pointer-events-none" />
      <div className="absolute top-1 right-1 w-2 h-2 bg-[#d2c4aa]/50 pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-2 h-2 bg-[#d2c4aa]/50 pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-2 h-2 bg-[#d2c4aa]/50 pointer-events-none" />

      {/* Header Banner if title present */}
      {(title || headerRight) && (
        <div
          className={`flex items-center justify-between px-3 py-2 border-b-4 select-none ${titleBarStyles[variant]}`}
        >
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-[#fec83e] border border-[#141022] shadow-[1px_1px_0px_#000]" />
            <div>
              <h3 className="font-pixel text-xs tracking-wider uppercase font-bold">
                {title}
              </h3>
              {subtitle && (
                <p className="font-rpg text-sm opacity-80 leading-none mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
        </div>
      )}

      {/* Content Container */}
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  );
};
