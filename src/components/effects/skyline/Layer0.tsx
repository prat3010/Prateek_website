'use client';

import React from 'react';
import styles from '../NoirSkyline.module.css';
import type { LayerProps } from './types';
import SkylineDefs from './SkylineDefs';

interface MobileStar {
  top: string;
  left: string;
  size: number;
  type: 1 | 2 | 3;
}

const MOBILE_STARS: MobileStar[] = [
  // Upper sky (top 0% - 25%)
  { top: '3.5%', left: '14%', size: 1.5, type: 1 },
  { top: '5.2%', left: '46%', size: 1.2, type: 2 },
  { top: '4.8%', left: '78%', size: 2.0, type: 3 },
  { top: '7.5%', left: '89%', size: 1.2, type: 1 },
  { top: '9.0%', left: '28%', size: 1.8, type: 2 },
  { top: '11.5%', left: '62%', size: 1.2, type: 3 },
  { top: '13.2%', left: '8%', size: 2.2, type: 1 },
  { top: '15.0%', left: '84%', size: 1.5, type: 2 },
  { top: '17.8%', left: '38%', size: 1.2, type: 3 },
  { top: '20.5%', left: '69%', size: 1.8, type: 1 },
  { top: '22.0%', left: '19%', size: 1.2, type: 2 },
  { top: '24.5%', left: '92%', size: 1.5, type: 3 },

  // Mid sky (top 25% - 50%)
  { top: '26.8%', left: '50%', size: 2.4, type: 1 },
  { top: '29.2%', left: '11%', size: 1.5, type: 2 },
  { top: '31.5%', left: '75%', size: 1.2, type: 3 },
  { top: '34.0%', left: '33%', size: 2.0, type: 1 },
  { top: '36.5%', left: '63%', size: 1.5, type: 2 },
  { top: '38.8%', left: '87%', size: 1.2, type: 3 },
  { top: '41.2%', left: '21%', size: 1.8, type: 1 },
  { top: '43.5%', left: '53%', size: 1.2, type: 2 },
  { top: '45.8%', left: '77%', size: 2.2, type: 3 },
  { top: '48.0%', left: '9%', size: 1.2, type: 1 },

  // Lower sky (top 50% - 68%, above skyline horizon)
  { top: '50.5%', left: '39%', size: 1.5, type: 2 },
  { top: '52.8%', left: '85%', size: 1.8, type: 3 },
  { top: '55.0%', left: '61%', size: 1.2, type: 1 },
  { top: '57.2%', left: '17%', size: 2.0, type: 2 },
  { top: '59.5%', left: '47%', size: 1.5, type: 3 },
  { top: '61.8%', left: '73%', size: 1.2, type: 1 },
  { top: '63.8%', left: '29%', size: 1.8, type: 2 },
  { top: '66.0%', left: '91%', size: 1.2, type: 3 },
  { top: '68.0%', left: '55%', size: 1.4, type: 1 },
];

const Layer0 = React.memo(function Layer0({ isMobile }: LayerProps) {
  // Generate 24 conic rays radiating from the center of the horizon (960, 450)
  const raysCount = 24;
  const raysPath = Array.from({ length: raysCount }).map((_, i) => {
    const angle1 = (i * 360) / raysCount;
    const angle2 = ((i + 0.5) * 360) / raysCount;
    const r = 2500;
    const rad1 = (angle1 * Math.PI) / 180;
    const rad2 = (angle2 * Math.PI) / 180;
    const x1 = 960 + r * Math.cos(rad1);
    const y1 = 450 + r * Math.sin(rad1);
    const x2 = 960 + r * Math.cos(rad2);
    const y2 = 450 + r * Math.sin(rad2);
    return `M 960 450 L ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
  }).join(' ');

  return (
    <>

      {/* Static backdrop SVG */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio={isMobile ? 'xMidYMax meet' : 'xMidYMax slice'} className={styles.staticLayerSvg} style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0 }}>
        <SkylineDefs />

        {/* Sky background layer (uses radial gradient in Popart, transparent in Noir) */}
        <rect width="100%" height="100%" fill="var(--skyline-sky-bg)" />

        {/* Pop-art Conic Sunburst Rays */}
        <path d={raysPath} className={styles.sunburstRays} fill="none" />

        {/* Glowing Noir Full Moon & Clouds */}
        <g pointerEvents="none">
          {/* Soft outer glow */}
          <circle cx="650" cy="250" r="100" fill="url(#moonGlow)" stroke="none" className={styles.moonGlow} />
          {/* Main Moon body */}
          <circle cx="650" cy="250" r="50" fill="rgba(250, 250, 250, 0.12)" stroke="rgba(250, 250, 250, 0.22)" strokeWidth="0.8" className={styles.moonBody} />
          
          {/* Wispy cloud silhouettes passing in front of the moon */}
          <path d="M 500 240 Q 650 260 800 240 Q 650 220 500 240 Z" fill="var(--skyline-cloud-fill)" stroke="none" />
          <path d="M 550 265 Q 670 280 790 265 Q 670 250 550 265 Z" fill="var(--skyline-cloud-fill)" stroke="none" />
          <path d="M 460 215 Q 600 230 740 215 Q 600 200 460 215 Z" fill="var(--skyline-cloud-fill)" stroke="none" />
        </g>
      </svg>

      {/* Dynamic / Animating Sky Overlay SVG */}
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio={isMobile ? 'xMidYMax meet' : 'xMidYMax slice'}
        className={styles.actorLayerSvg}
        style={{ overflow: 'visible' }}
        aria-hidden="true"
      >
        {/* Twinkling Starfield (Desktop) */}
        <g fill="#fafafa" stroke="none" className={styles.desktopStarfield}>
          <circle cx="120" cy="80" r="0.8" className={styles.star1} />
          <circle cx="250" cy="150" r="1.2" className={styles.star2} />
          <circle cx="340" cy="60" r="0.7" className={styles.star3} />
          <circle cx="480" cy="120" r="1.0" className={styles.star1} />
          <circle cx="620" cy="200" r="0.9" className={styles.star2} />
          <circle cx="710" cy="90" r="1.3" className={styles.star3} />
          <circle cx="850" cy="140" r="0.8" className={styles.star1} />
          <circle cx="960" cy="50" r="1.1" className={styles.star2} />
          <circle cx="1050" cy="180" r="0.6" className={styles.star3} />
          <circle cx="1150" cy="70" r="1.2" className={styles.star1} />
          <circle cx="1280" cy="130" r="0.9" className={styles.star2} />
          <circle cx="1380" cy="60" r="0.8" className={styles.star3} />
          <circle cx="1520" cy="90" r="1.1" className={styles.star1} />
          <circle cx="1700" cy="110" r="0.7" className={styles.star2} />
          <circle cx="1820" cy="140" r="1.0" className={styles.star3} />
        </g>

        {/* Detailed Gliding Retro Airship/Dirigible */}
        <g className={styles.blimpGroup}>
          {/* Sweeping Spotlight beam from the front of the gondola */}
          <polygon 
            points="195,212 230,420 320,400" 
            fill="var(--skyline-blimp-spotlight)" 
            className={styles.blimpSpotlight} 
            stroke="none"
          />

          {/* Structural envelope outline */}
          <path d="M 103.6 179.9 L 104.0 177.6 L 104.4 175.2 L 105.5 173.2 L 106.4 171.3 L 108.0 169.6 L 109.6 167.8 L 111.8 166.2 L 114.0 164.6 L 116.9 163.2 L 119.7 161.9 L 122.7 161.0 L 125.8 160.0 L 129.6 159.1 L 133.3 158.2 L 137.5 157.5 L 141.9 156.7 L 146.7 156.3 L 151.3 155.8 L 156.5 155.4 L 161.7 155.0 L 167.5 154.9 L 173.2 154.7 L 177.2 154.6 L 181.2 154.7 L 185.0 154.6 L 189.6 154.4 L 194.4 154.2 L 198.9 154.5 L 203.4 154.8 L 207.7 155.5 L 211.8 156.1 L 215.7 157.0 L 219.8 157.9 L 223.4 158.9 L 226.8 159.8 L 229.7 160.9 L 232.7 162.2 L 235.3 163.6 L 238.0 165.0 L 240.3 166.6 L 242.6 168.2 L 244.5 169.8 L 246.3 171.3 L 248.7 174.2 L 250.1 177.2 L 250.6 180.3 L 250.0 183.2 L 248.4 186.0 L 245.7 188.9 L 244.0 190.4 L 242.3 191.7 L 240.1 193.1 L 237.9 194.6 L 235.4 195.9 L 232.8 197.3 L 229.8 198.6 L 226.8 199.9 L 223.4 200.9 L 219.8 202.0 L 215.8 203.0 L 211.9 203.9 L 207.8 204.4 L 203.7 204.9 L 199.1 205.3 L 194.5 205.8 L 189.6 206.3 L 184.8 206.5 L 180.7 206.4 L 176.6 206.3 L 172.4 206.2 L 166.7 205.8 L 161.2 205.5 L 156.0 205.1 L 151.0 204.9 L 146.3 204.2 L 141.6 203.6 L 137.3 203.1 L 133.2 202.5 L 129.7 201.6 L 126.0 200.5 L 122.7 199.2 L 119.4 198.1 L 116.6 196.7 L 114.0 195.4 L 112.0 194.0 L 109.9 192.5 L 108.2 190.6 L 106.6 188.8 L 105.5 186.7 L 104.4 184.6 L 104.0 182.3 L 103.6 179.9 L 103.6 179.9 Z" fill="var(--skyline-blimp-envelope)" stroke="var(--skyline-blimp-stroke)" strokeWidth="1.2" />
          {/* Long envelope longitudinal panel lines */}
          <path d="M 104.7 179.9 L 109.5 178.7 L 114.5 177.5 L 119.6 176.3 L 124.6 175.3 L 129.4 174.1 L 134.1 173.1 L 138.6 172.3 L 143.1 171.7 L 147.8 171.3 L 152.7 171.4 L 157.6 171.0 L 162.4 170.6 L 167.3 170.4 L 172.2 170.1 L 176.9 169.5 L 181.6 169.2 L 186.6 169.3 L 191.4 169.5 L 196.2 170.1 L 201.0 170.7 L 205.8 171.3 L 210.9 172.2 L 215.9 173.1 L 220.7 173.9 L 225.5 174.7 L 230.3 175.6 L 235.2 176.6 L 240.1 177.9 L 244.9 179.2 L 249.6 180.3" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />
          <path d="M 104.7 179.9 L 109.6 181.1 L 114.6 182.4 L 119.6 183.8 L 124.3 184.7 L 129.1 185.8 L 133.8 186.8 L 138.3 187.7 L 143.1 188.3 L 147.9 189.0 L 152.6 189.7 L 157.3 190.2 L 162.0 190.6 L 166.7 190.6 L 171.6 190.6 L 176.6 190.6 L 181.6 190.2 L 186.4 189.9 L 191.4 189.9 L 196.0 189.5 L 200.8 189.2 L 205.7 189.0 L 210.8 188.3 L 215.7 187.6 L 220.6 186.8 L 225.4 185.9 L 230.2 185.1 L 235.0 183.8 L 239.8 182.7 L 244.7 181.6 L 249.6 180.3" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />
          
          {/* Extra detailed longitudinal panel lines for premium texture */}
          <path d="M 104.2 179.9 L 109.1 179.3 L 114.1 178.7 L 119.2 178.1 L 124.3 177.6 L 129.1 176.9 L 133.8 176.3 L 138.4 175.8 L 142.9 175.5 L 147.6 175.3 L 152.5 175.5 L 157.4 175.6 L 162.3 175.5 L 167.1 175.2 L 172.0 174.9 L 176.8 174.3 L 181.6 174.0 L 186.7 174.1 L 191.6 174.3 L 196.5 174.6 L 201.3 175.0 L 206.2 175.5 L 211.2 176.1 L 216.2 176.6 L 220.9 177.1 L 225.8 177.5 L 230.7 177.9 L 235.5 178.4 L 240.5 179.1 L 245.3 179.8 L 250.1 180.3" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.6" />
          <path d="M 104.2 179.9 L 109.1 180.6 L 114.1 181.2 L 119.2 182.0 L 124.0 182.5 L 128.9 183.0 L 133.7 183.5 L 138.2 183.9 L 142.9 184.2 L 147.7 184.6 L 152.6 185.1 L 157.3 185.7 L 162.0 185.9 L 166.8 185.8 L 171.7 185.5 L 176.7 185.5 L 181.6 185.1 L 186.5 184.9 L 191.5 184.8 L 196.3 184.8 L 201.0 184.8 L 205.9 184.8 L 211.0 184.5 L 215.9 184.2 L 220.8 183.7 L 225.7 183.3 L 230.6 182.8 L 235.4 182.1 L 240.4 181.6 L 245.3 181.1 L 250.1 180.3" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.6" />

          {/* Vertical framing bands (ribs) */}
          <path d="M 130.1 162.5 A 18 18 0 0 0 129.9 198.2" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />
          <path d="M 160.1 154.5 A 26 26 0 0 0 159.6 206" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />
          <path d="M 189.7 154.3 A 26 26 0 0 0 189.7 206.4" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />
          <path d="M 220.4 162.0 A 18 18 0 0 0 220.3 198.2" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />
          {/* Nose cap lines */}
          <path d="M 238.6 171.3 A 11 11 0 0 0 238.2 188.7" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />

          {/* Aerodynamic stabilizers & fins */}
          {/* Top Fin */}
          <path d="M 115.0 170.1 L 111.7 167.8 L 108.3 165.6 L 104.9 163.1 L 101.5 160.5 L 98.3 158.1 L 95.0 155.8 L 91.9 153.3 L 91.5 157.4 L 91.0 161.6 L 90.6 165.7 L 90.2 169.9 L 89.8 174.1 L 89.5 178.3 L 93.5 178.2 L 97.6 178.0 L 101.6 177.9 L 105.7 177.9 L 109.7 178.0 L 113.9 178.0 L 118.1 178.0 L 116.5 174.1 L 115.0 170.1 Z" fill="var(--skyline-blimp-envelope)" stroke="var(--skyline-blimp-stroke)" strokeWidth="1" />
          {/* Top fin hinge and rudder line */}
          <path d="M 95.7 156.4 L 95.2 160.6 L 94.7 165.0 L 94.4 169.4 L 94.0 173.7 L 93.5 178.2" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />

          {/* Bottom Fin */}
          <path d="M 115.1 189.9 L 111.9 192.3 L 108.7 194.9 L 105.3 197.4 L 101.9 199.9 L 98.6 202.5 L 95.4 204.9 L 92.2 207.2 L 91.7 203.1 L 91.3 198.8 L 90.9 194.6 L 90.4 190.5 L 90.0 186.5 L 89.5 182.4 L 93.6 182.3 L 97.6 182.0 L 101.6 181.9 L 105.7 181.9 L 109.8 181.9 L 113.9 181.9 L 118.1 182.0 L 116.6 186.0 L 115.1 189.9 Z" fill="var(--skyline-blimp-envelope)" stroke="var(--skyline-blimp-stroke)" strokeWidth="1" />
          {/* Bottom fin hinge and rudder line */}
          <path d="M 96.1 204.3 L 95.6 199.9 L 95.1 195.3 L 94.7 191.0 L 94.2 186.7 L 93.6 182.3" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />

          {/* Rear Propeller Engine Pod */}
          <path d="M 134.8 202.2 L 139.8 202.0 L 144.8 202.0 L 144.8 205.9 L 139.8 205.8 L 134.9 206.0 L 134.8 202.2 Z" fill="var(--skyline-blimp-envelope)" stroke="var(--skyline-blimp-stroke)" strokeWidth="0.8" />
          {/* Spin blades */}
          <path d="M 130.0 199.2 L 130.2 204.2 L 130.2 209.3" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="1" />

          {/* Gondola Cabin (connected by struts and rigging) */}
          {/* Structural struts */}
          <path d="M 164.4 200.1 L 164.4 204.1" stroke="var(--skyline-blimp-stroke)" strokeWidth="0.8" />
          <path d="M 179.9 200.2 L 179.8 204.3" stroke="var(--skyline-blimp-stroke)" strokeWidth="0.8" />
          <path d="M 194.7 200.2 L 194.8 204.1" stroke="var(--skyline-blimp-stroke)" strokeWidth="0.8" />
          {/* Rigging lines cross bracing */}
          <path d="M 164.4 200.1 L 169.4 201.6 L 174.7 203.1 L 179.8 204.3" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.5" />
          <path d="M 179.9 200.2 L 174.7 201.7 L 169.4 203.0 L 164.4 204.1" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.5" />
          <path d="M 179.9 200.2 L 184.8 201.4 L 189.7 202.9 L 194.8 204.1" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.5" />
          <path d="M 194.7 200.2 L 189.7 201.5 L 184.8 202.9 L 179.8 204.3" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.5" />

          {/* Gondola Body */}
          <path d="M 157.5 204.0 L 161.5 204.0 L 165.4 204.1 L 169.4 204.3 L 173.6 204.4 L 177.7 204.4 L 181.8 204.3 L 185.8 204.3 L 189.7 204.3 L 193.8 204.2 L 197.9 204.0 L 201.9 203.9 L 199.6 207.9 L 197.2 211.9 L 192.9 212.1 L 188.6 212.4 L 184.4 212.5 L 179.8 212.4 L 175.5 212.3 L 171.3 212.2 L 167.2 212.0 L 162.9 212.0 L 160.2 208.0 L 157.5 204.0 Z" fill="var(--skyline-blimp-envelope)" stroke="var(--skyline-blimp-stroke)" strokeWidth="1" />
          {/* Cabin windows */}
          <path d="M 167.4 206.2 L 169.9 206.3 L 172.5 206.4 L 172.6 209.3 L 170.1 209.2 L 167.7 209.1 L 167.4 206.2 Z" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.6" />
          <path d="M 176.6 206.4 L 179.2 206.4 L 181.8 206.4 L 181.9 209.5 L 179.2 209.4 L 176.6 209.4 L 176.6 206.4 Z" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.6" />
          <path d="M 185.8 206.5 L 188.2 206.4 L 190.8 206.4 L 191.0 209.3 L 188.4 209.4 L 186.0 209.5 L 185.8 206.5 Z" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.6" />

          {/* White Tail flashing beacon */}
          <circle cx="89" cy="153" r="1.5" className={styles.blimpBeacon} />
        </g>

        {/* Searchlights sweeping the sky */}
        <g opacity="0.6">
          <polygon 
            points="380,1080 180,0 480,0" 
            fill="var(--skyline-searchlight-left)" 
            className={`${styles.searchlight} ${styles.searchlightLeft}`} 
          />
          <polygon 
            points="1480,1080 1320,0 1620,0" 
            fill="var(--skyline-searchlight-right)" 
            className={`${styles.searchlight} ${styles.searchlightRight}`} 
          />
        </g>

        {/* Flock of gliding pigeons */}
        <g className={styles.flock} fill="none" stroke="var(--skyline-pigeon-stroke)" strokeWidth="0.8">
          {/* Bird 1 */}
          <path d="M 0 0 Q 5 -5 10 0 Q 15 -5 20 0" />
          {/* Bird 2 */}
          <path d="M -25 20 Q -20 15 -15 20 Q -10 15 -5 20" />
          {/* Bird 3 */}
          <path d="M 30 15 Q 35 10 40 15 Q 45 10 50 15" />
        </g>
      </svg>

      {/* Mobile Starfield: distributes twinkling stars across the top half / upper sky on mobile */}
      <div className={styles.mobileStarfield} aria-hidden="true">
        {MOBILE_STARS.map((star, idx) => (
          <span
            key={idx}
            className={`${styles.mobileStar} ${styles[`star${star.type}` as 'star1' | 'star2' | 'star3']}`}
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              ...(star.size >= 2.2 ? { boxShadow: '0 0 3px rgba(250, 250, 250, 0.7)' } : {}),
            }}
          />
        ))}
      </div>
    </>
  );
});

Layer0.displayName = 'Layer0';

export default Layer0;
