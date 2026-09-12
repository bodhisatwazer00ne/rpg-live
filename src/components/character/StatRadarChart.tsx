import React from 'react';
import { AttributeType } from '../../types';

interface StatRadarChartProps {
  stats: Record<AttributeType, number>;
  size?: number;
}

interface StatPoint {
  key: AttributeType;
  label: string;
  name: string;
  value: number;
  color: string;
}

export const StatRadarChart: React.FC<StatRadarChartProps> = ({ stats, size = 260 }) => {
  const statDefs: { key: AttributeType; label: string; name: string; color: string }[] = [
    { key: 'str', label: 'STR', name: 'Strength', color: '#dc2626' },
    { key: 'int', label: 'INT', name: 'Intelligence', color: '#2563eb' },
    { key: 'end', label: 'END', name: 'Endurance', color: '#16a34a' },
    { key: 'res', label: 'RES', name: 'Resilience', color: '#475569' },
    { key: 'dis', label: 'DIS', name: 'Discipline', color: '#d97706' },
    { key: 'wil', label: 'WIL', name: 'Willpower', color: '#9333ea' },
  ];

  const center = size / 2;
  const radius = (size / 2) - 34; // Generous radius while keeping comfortable margin

  // Determine scale maximum (at least 15, or highest stat + 3)
  const maxVal = Math.max(15, ...statDefs.map((s) => (stats[s.key] || 0) + 3));

  const numAxes = statDefs.length;
  const angleStep = (Math.PI * 2) / numAxes;

  // Compute vertex coordinates for an arbitrary ratio (0..1) at a given axis index
  const getCoordinates = (index: number, ratio: number) => {
    // Start at top (-PI/2)
    const angle = -Math.PI / 2 + index * angleStep;
    const r = radius * Math.min(1, Math.max(0.04, ratio));
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Label coordinates positioned neatly outside the outer ring
  const getLabelCoordinates = (index: number) => {
    const angle = -Math.PI / 2 + index * angleStep;
    const labelRadius = radius + 18;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
    };
  };

  // Concentric radar grid rings (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const gridPolygons = gridLevels.map((lvl) => {
    return statDefs
      .map((_, i) => {
        const { x, y } = getCoordinates(i, lvl);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  // Player stats polygon
  const statPoints = statDefs.map((s, i) => {
    const val = stats[s.key] || 0;
    const ratio = val / maxVal;
    return getCoordinates(i, ratio);
  });

  const statPolygonString = statPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="flex flex-col items-center select-none w-full">
      <div className="relative bg-[#140f21] border-2 border-[#120e1d] p-1 shadow-[inset_0_0_12px_rgba(0,0,0,0.6)] w-full flex justify-center">
        {/* Subtle retro scanline pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#2a2046_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none opacity-30" />

        <svg
          width={size}
          height={size}
          className="overflow-visible block"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background grid concentric web */}
          {gridPolygons.map((points, idx) => (
            <polygon
              key={`grid-${idx}`}
              points={points}
              fill={idx === gridPolygons.length - 1 ? 'rgba(28, 21, 46, 0.4)' : 'none'}
              stroke={idx === gridPolygons.length - 1 ? '#4a3d6d' : '#2d2447'}
              strokeWidth={idx === gridPolygons.length - 1 ? '1.2' : '0.8'}
              strokeDasharray={idx < gridPolygons.length - 1 ? '2,3' : undefined}
            />
          ))}

          {/* Radial axis lines */}
          {statDefs.map((_, i) => {
            const outer = getCoordinates(i, 1.0);
            return (
              <line
                key={`axis-${i}`}
                x1={center}
                y1={center}
                x2={outer.x}
                y2={outer.y}
                stroke="#372b57"
                strokeWidth="0.8"
              />
            );
          })}

          {/* Player stats filled radar polygon */}
          <polygon
            points={statPolygonString}
            fill="rgba(254, 200, 62, 0.28)"
            stroke="#fec83e"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="filter drop-shadow-[0_0_3px_rgba(254,200,62,0.3)] transition-all duration-300"
          />

          {/* Clean, compact vertex plot points */}
          {statPoints.map((pt, i) => {
            const stat = statDefs[i];
            return (
              <g key={`point-${i}`}>
                {/* Outer crisp border circle - reduced radius from 4.5 to 2.2 */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="2.4"
                  fill="#fec83e"
                  stroke="#120e1d"
                  strokeWidth="1"
                />
                {/* Micro accent core dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="1.1"
                  fill={stat.color}
                />
              </g>
            );
          })}

          {/* Clean Stat Labels */}
          {statDefs.map((stat, i) => {
            const pos = getLabelCoordinates(i);
            const val = stats[stat.key] || 0;
            // Text anchor calculation based on horizontal position
            let anchor: 'middle' | 'start' | 'end' = 'middle';
            let xOffset = 0;
            if (pos.x < center - 8) {
              anchor = 'end';
              xOffset = -2;
            } else if (pos.x > center + 8) {
              anchor = 'start';
              xOffset = 2;
            }

            return (
              <g key={`lbl-${stat.key}`}>
                <text
                  x={pos.x + xOffset}
                  y={pos.y - 1}
                  textAnchor={anchor}
                  fill={stat.color}
                  className="font-pixel text-[9px] font-bold select-none drop-shadow-[1px_1px_0px_#000]"
                >
                  {stat.label}
                </text>
                <text
                  x={pos.x + xOffset}
                  y={pos.y + 8}
                  textAnchor={anchor}
                  fill="#e2e8f0"
                  className="font-silkscreen text-[8px] select-none drop-shadow-[1px_1px_0px_#000]"
                >
                  {val}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Radar Legend Footer */}
      <div className="w-full mt-2 pt-1.5 border-t border-[#362b54] grid grid-cols-3 gap-1 font-silkscreen text-[9px] text-[#cbd5e1]">
        {statDefs.map((s) => (
          <div key={s.key} className="flex items-center justify-between px-1.5 py-0.5 bg-[#1a142c] border border-[#2d2249]">
            <span style={{ color: s.color }} className="font-pixel font-bold text-[8px]">
              {s.label}
            </span>
            <span className="text-[#fec83e] font-pixel text-[9px]">{stats[s.key] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
