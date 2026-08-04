import React from 'react';
import { Svg, Circle, Ellipse, Line, Path } from '@react-pdf/renderer';
import type { PDFThemeConfig } from './pdfTheme';

/**
 * The site's gremlin logo (as drawn in Navbar.tsx) ported to react-pdf SVG.
 * Colors follow the active azure/noir theme tokens.
 */
interface PdfGremlinLogoProps {
  theme: PDFThemeConfig;
  size?: number;
}

export function PdfGremlinLogo({ theme, size = 34 }: PdfGremlinLogoProps) {
  return (
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      <Circle cx="50" cy="50" r="38" fill={theme.logoBg} />
      <Path
        d="M 26,45 L 32,50 L 26,55"
        fill="none"
        stroke={theme.logoStroke}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="35"
        y1="55"
        x2="43"
        y2="55"
        stroke={theme.logoStroke}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <Line
        x1="15"
        y1="72"
        x2="85"
        y2="72"
        stroke={theme.logoStroke}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <Path
        d="M 32,72 C 32,46 68,46 68,72"
        fill={theme.logoBody}
        stroke={theme.logoStroke}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <Path
        d="M 32,48 L 12,38 Q 24,53 36,55"
        fill={theme.logoEar}
        stroke={theme.logoStroke}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path
        d="M 68,48 L 88,38 Q 76,53 64,55"
        fill={theme.logoEar}
        stroke={theme.logoStroke}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Circle cx="43" cy="58" r="6.5" fill={theme.logoEye} />
      <Circle cx="45" cy="55.5" r="2.5" fill={theme.logoPupil} />
      <Circle cx="57" cy="58" r="6.5" fill={theme.logoEye} />
      <Circle cx="59" cy="55.5" r="2.5" fill={theme.logoPupil} />
      <Ellipse cx="37" cy="63" rx="3.5" ry="2" fill={theme.logoBlush} />
      <Ellipse cx="63" cy="63" rx="3.5" ry="2" fill={theme.logoBlush} />
    </Svg>
  );
}
