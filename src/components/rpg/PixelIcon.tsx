import React from 'react';

interface PixelIconProps {
  name: string;
  size?: number;
  className?: string;
}

export const PixelIcon: React.FC<PixelIconProps> = ({ name, size = 20, className = '' }) => {
  const renderIconSvg = () => {
    switch (name.toLowerCase()) {
      // Attributes
      case 'str':
      case 'biceps':
      case 'sword':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="shape-rendering-crispEdges">
            <rect x="13" y="1" width="2" height="2" fill="#cbd5e1" />
            <rect x="11" y="3" width="2" height="2" fill="#cbd5e1" />
            <rect x="9" y="5" width="2" height="2" fill="#cbd5e1" />
            <rect x="7" y="7" width="2" height="2" fill="#94a3b8" />
            <rect x="5" y="9" width="2" height="2" fill="#94a3b8" />
            <rect x="3" y="9" width="4" height="2" fill="#fec83e" />
            <rect x="5" y="7" width="2" height="4" fill="#fec83e" />
            <rect x="3" y="11" width="2" height="2" fill="#78350f" />
            <rect x="1" y="13" width="2" height="2" fill="#fec83e" />
          </svg>
        );

      case 'int':
      case 'brain':
      case 'quill':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="shape-rendering-crispEdges">
            <rect x="11" y="1" width="3" height="3" fill="#60a5fa" />
            <rect x="9" y="4" width="3" height="3" fill="#3b82f6" />
            <rect x="7" y="7" width="3" height="3" fill="#2563eb" />
            <rect x="5" y="10" width="3" height="3" fill="#1d4ed8" />
            <rect x="3" y="13" width="2" height="2" fill="#fec83e" />
            <rect x="1" y="14" width="2" height="2" fill="#1e1b4b" />
          </svg>
        );

      case 'end':
      case 'shield':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="shape-rendering-crispEdges">
            <rect x="3" y="2" width="10" height="2" fill="#38b764" />
            <rect x="2" y="4" width="12" height="5" fill="#257142" />
            <rect x="3" y="9" width="10" height="3" fill="#257142" />
            <rect x="4" y="12" width="8" height="2" fill="#154227" />
            <rect x="6" y="14" width="4" height="1" fill="#154227" />
            <rect x="7" y="5" width="2" height="5" fill="#fec83e" />
            <rect x="5" y="6" width="6" height="2" fill="#fec83e" />
          </svg>
        );

      case 'res':
      case 'fortress':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="shape-rendering-crispEdges">
            <rect x="2" y="3" width="3" height="4" fill="#94a3b8" />
            <rect x="7" y="3" width="2" height="4" fill="#94a3b8" />
            <rect x="11" y="3" width="3" height="4" fill="#94a3b8" />
            <rect x="2" y="7" width="12" height="7" fill="#64748b" />
            <rect x="6" y="10" width="4" height="4" fill="#1e293b" />
          </svg>
        );

      case 'dis':
      case 'clock':
      case 'watch':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="shape-rendering-crispEdges">
            <rect x="4" y="2" width="8" height="2" fill="#fec83e" />
            <rect x="2" y="4" width="12" height="8" fill="#fef08a" />
            <rect x="4" y="12" width="8" height="2" fill="#fec83e" />
            <rect x="7" y="5" width="2" height="4" fill="#1e1b4b" />
            <rect x="7" y="8" width="4" height="2" fill="#1e1b4b" />
          </svg>
        );

      case 'wil':
      case 'flame':
      case 'star':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="shape-rendering-crispEdges">
            <rect x="7" y="1" width="2" height="3" fill="#fec83e" />
            <rect x="5" y="4" width="6" height="3" fill="#f97316" />
            <rect x="4" y="7" width="8" height="5" fill="#ef4444" />
            <rect x="6" y="8" width="4" height="4" fill="#fef08a" />
            <rect x="5" y="12" width="6" height="2" fill="#991b1b" />
          </svg>
        );

      // Gold / Currency
      case 'gold':
      case 'coins':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="shape-rendering-crispEdges">
            <rect x="4" y="2" width="8" height="2" fill="#fec83e" />
            <rect x="2" y="4" width="12" height="8" fill="#fcd34d" />
            <rect x="4" y="12" width="8" height="2" fill="#d97706" />
            <rect x="7" y="5" width="2" height="6" fill="#78350f" />
            <rect x="6" y="6" width="4" height="2" fill="#78350f" />
            <rect x="6" y="9" width="4" height="1" fill="#78350f" />
          </svg>
        );

      // XP / Level Star
      case 'xp':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="shape-rendering-crispEdges">
            <rect x="7" y="1" width="2" height="3" fill="#60a5fa" />
            <rect x="3" y="5" width="10" height="2" fill="#3b82f6" />
            <rect x="5" y="7" width="6" height="3" fill="#2563eb" />
            <rect x="4" y="10" width="3" height="4" fill="#1d4ed8" />
            <rect x="9" y="10" width="3" height="4" fill="#1d4ed8" />
          </svg>
        );

      // Consumables
      case 'potion-red':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="shape-rendering-crispEdges">
            <rect x="6" y="1" width="4" height="2" fill="#a1a1aa" />
            <rect x="7" y="3" width="2" height="2" fill="#e4e4e7" />
            <rect x="4" y="5" width="8" height="9" fill="#ef4444" />
            <rect x="5" y="7" width="2" height="4" fill="#fca5a5" />
          </svg>
        );

      case 'potion-green':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="shape-rendering-crispEdges">
            <rect x="6" y="1" width="4" height="2" fill="#a1a1aa" />
            <rect x="7" y="3" width="2" height="2" fill="#e4e4e7" />
            <rect x="4" y="5" width="8" height="9" fill="#10b981" />
            <rect x="5" y="7" width="2" height="4" fill="#a7f3d0" />
          </svg>
        );

      case 'potion-gold':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="shape-rendering-crispEdges">
            <rect x="6" y="1" width="4" height="2" fill="#d97706" />
            <rect x="7" y="3" width="2" height="2" fill="#fef08a" />
            <rect x="4" y="5" width="8" height="9" fill="#f59e0b" />
            <rect x="5" y="7" width="2" height="4" fill="#fef3c7" />
          </svg>
        );

      case 'scroll':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="shape-rendering-crispEdges">
            <rect x="2" y="3" width="12" height="10" fill="#fef3c7" />
            <rect x="4" y="5" width="8" height="1" fill="#78350f" />
            <rect x="4" y="7" width="6" height="1" fill="#78350f" />
            <rect x="4" y="9" width="7" height="1" fill="#78350f" />
            <rect x="1" y="2" width="2" height="12" fill="#d97706" />
            <rect x="13" y="2" width="2" height="12" fill="#d97706" />
          </svg>
        );

      case 'book':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="shape-rendering-crispEdges">
            <rect x="2" y="2" width="12" height="12" fill="#7c3aed" />
            <rect x="4" y="3" width="9" height="10" fill="#f8fafc" />
            <rect x="2" y="2" width="2" height="12" fill="#5b21b6" />
            <rect x="5" y="5" width="6" height="1" fill="#475569" />
            <rect x="5" y="8" width="5" height="1" fill="#475569" />
          </svg>
        );

      case 'crown':
      case 'trophy':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="shape-rendering-crispEdges">
            <rect x="2" y="4" width="2" height="7" fill="#f59e0b" />
            <rect x="7" y="2" width="2" height="9" fill="#f59e0b" />
            <rect x="12" y="4" width="2" height="7" fill="#f59e0b" />
            <rect x="3" y="9" width="10" height="4" fill="#fbbf24" />
            <rect x="5" y="10" width="2" height="2" fill="#ef4444" />
            <rect x="9" y="10" width="2" height="2" fill="#3b82f6" />
          </svg>
        );

      case 'skull':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="shape-rendering-crispEdges">
            <rect x="4" y="2" width="8" height="8" fill="#e2e8f0" />
            <rect x="5" y="5" width="2" height="2" fill="#0f172a" />
            <rect x="9" y="5" width="2" height="2" fill="#0f172a" />
            <rect x="7" y="7" width="2" height="1" fill="#0f172a" />
            <rect x="5" y="10" width="6" height="4" fill="#cbd5e1" />
            <rect x="6" y="11" width="1" height="2" fill="#0f172a" />
            <rect x="8" y="11" width="1" height="2" fill="#0f172a" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="shape-rendering-crispEdges">
            <rect x="2" y="2" width="12" height="12" fill="#64748b" />
            <rect x="4" y="4" width="8" height="8" fill="#94a3b8" />
          </svg>
        );
    }
  };

  return <span className={`inline-flex items-center justify-center ${className}`}>{renderIconSvg()}</span>;
};
