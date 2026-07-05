'use client';

export default function SkylinePlaceholder() {
  return (
    <svg
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMax slice"
      className="skyline-placeholder-svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ph-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--skyline-bg-top, #0a0a12)" />
          <stop offset="100%" stopColor="var(--skyline-bg-bottom, #14141e)" />
        </linearGradient>
        <linearGradient id="ph-fog" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--skyline-fog-bottom, rgba(20,20,30,0))" />
          <stop offset="100%" stopColor="var(--skyline-fog-top, rgba(20,20,30,0.6))" />
        </linearGradient>
      </defs>

      <rect width="1920" height="1080" fill="url(#ph-bg)" />

      {/* Layer 0 — faint distant blocks */}
      <g fill="var(--skyline-layer-far, #191925)" opacity="0.4">
        {[
          [0, 520, 120, 560], [120, 550, 80, 530], [200, 480, 140, 600],
          [340, 530, 100, 550], [440, 500, 160, 580], [600, 540, 90, 540],
          [690, 460, 110, 620], [800, 520, 130, 560], [930, 490, 100, 590],
          [1030, 540, 80, 540], [1110, 480, 120, 600], [1230, 530, 90, 550],
          [1320, 500, 140, 580], [1460, 520, 100, 560], [1560, 470, 130, 610],
          [1690, 530, 80, 550], [1770, 500, 150, 580],
        ].map(([x, y, w, h], i) => (
          <rect key={`f${i}`} x={x} y={y} width={w} height={h} rx={2} />
        ))}
      </g>

      {/* Layer 1 — midground blocks with occasional peaks */}
      <g fill="var(--skyline-layer-mid, #222233)" opacity="0.6">
        {[
          [50, 400, 100, 680], [150, 350, 60, 730], [210, 420, 140, 660],
          [350, 380, 80, 700], [430, 340, 120, 740], [550, 410, 100, 670],
          [650, 360, 70, 720], [720, 440, 130, 640], [850, 400, 90, 680],
          [940, 350, 110, 730], [1050, 420, 80, 660], [1130, 380, 140, 700],
          [1270, 340, 100, 740], [1370, 410, 90, 670], [1460, 370, 130, 710],
          [1590, 430, 80, 650], [1670, 380, 110, 700], [1780, 400, 140, 680],
        ].map(([x, y, w, h], i) => (
          <rect key={`m${i}`} x={x} y={y} width={w} height={h} rx={1} />
        ))}
      </g>

      {/* Layer 2 — foreground blocks, darker */}
      <g fill="var(--skyline-layer-fg, #0d0d18)" opacity="0.85">
        {[
          [0, 500, 80, 580], [80, 450, 120, 630], [200, 520, 90, 560],
          [290, 470, 110, 610], [400, 440, 70, 640], [470, 510, 130, 570],
          [600, 460, 100, 620], [700, 530, 80, 550], [780, 480, 140, 600],
          [920, 440, 110, 640], [1030, 500, 90, 580], [1120, 460, 130, 620],
          [1250, 520, 80, 560], [1330, 470, 120, 610], [1450, 440, 100, 640],
          [1550, 500, 110, 580], [1660, 460, 90, 620], [1750, 520, 170, 560],
        ].map(([x, y, w, h], i) => (
          <rect key={`fg${i}`} x={x} y={y} width={w} height={h} rx={1} />
        ))}
      </g>

      {/* A few lit windows on foreground */}
      <g fill="var(--skyline-window, rgba(255,200,100,0.15))">
        {[
          [100, 470, 6, 10], [110, 490, 6, 10], [150, 470, 6, 10],
          [310, 500, 6, 10], [330, 520, 6, 10], [420, 480, 6, 10],
          [490, 530, 6, 10], [510, 550, 6, 10], [620, 490, 6, 10],
          [810, 510, 6, 10], [830, 530, 6, 10], [950, 480, 6, 10],
          [1140, 490, 6, 10], [1160, 510, 6, 10], [1350, 500, 6, 10],
          [1470, 470, 6, 10], [1570, 520, 6, 10], [1680, 490, 6, 10],
        ].map(([x, y, w, h], i) => (
          <rect key={`w${i}`} x={x} y={y} width={w} height={h} rx={1} />
        ))}
      </g>

      {/* Fog gradient overlay near horizon */}
      <rect width="1920" height="300" y="480" fill="url(#ph-fog)" opacity="0.5" />
    </svg>
  );
}
