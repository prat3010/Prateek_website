'use client';

import React from 'react';
import styles from '../NoirSkyline.module.css';
import { WobblyPath, WobblyLine } from '../WobblySVG';
import { LayerProps } from './types';

const Layer1_5 = React.memo(function Layer1_5({ reducedMotion }: LayerProps) {
  const wobble = !reducedMotion;
  const strength = 2.5; // Far midground wobble (between Layer 1 and Layer 2)
  return (
    <>
      {/* Static Layer */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0 }}>
        <g className={styles.buildingGroup} stroke="var(--skyline-stroke-mid)" strokeWidth="1.2">
          {/* Blocky Spire (Center-Left) */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 330 1080 L 330 710 L 370 710 L 370 540 L 373 540 L 373 450 L 377 450 L 377 540 L 380 540 L 380 710 L 420 710 L 420 1080 Z" className={styles.bldMidBlockySpire} />
          {/* Double cornices & vertical ribs for Blocky Spire */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="327" y1="710" x2="373" y2="710" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="330" y1="715" x2="370" y2="715" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="377" y1="710" x2="423" y2="710" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="380" y1="715" x2="420" y2="715" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="367" y1="540" x2="383" y2="540" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="370" y1="545" x2="380" y2="545" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="350" y1="715" x2="350" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="400" y1="715" x2="400" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="373" y1="545" x2="373" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="377" y1="545" x2="377" y2="1080" />
          </g>

          {/* Slab Building */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 565 1080 L 565 690 L 640 690 L 640 1080 Z" className={styles.bldMidSlab} />
          {/* Double cornice and vertical ribs for Slab Building */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="562" y1="695" x2="643" y2="695" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="590" y1="695" x2="590" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="610" y1="695" x2="610" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="630" y1="695" x2="630" y2="1080" />
          </g>
          {/* Roof cornice line */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="562" y1="690" x2="643" y2="690" strokeWidth="1.4" />
          {/* Horizontal floor bands */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" opacity="0.8">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="565" y1="730" x2="640" y2="730" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="565" y1="770" x2="640" y2="770" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="565" y1="810" x2="640" y2="810" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="565" y1="850" x2="640" y2="850" />
          </g>
          {/* Window columns */}
          <g strokeWidth="0.8" fill="none">
            <g className={styles.glowingWindow} strokeDasharray="3 9">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="580" y1="700" x2="580" y2="1000" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="620" y1="700" x2="620" y2="1000" strokeDashoffset="5" />
            </g>
            <g className={styles.glowingWindowDim} strokeDasharray="3 9">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="600" y1="700" x2="600" y2="1000" strokeDashoffset="2" />
            </g>
          </g>

          {/* Wide Warehouse */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 830 1080 L 830 720 L 930 720 L 930 1080 Z" className={styles.bldMidWarehouse} />
          {/* Sawtooth roof detail */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 830 720 L 855 695 L 855 720 L 880 695 L 880 720 L 905 695 L 905 720 L 930 720" fill="var(--skyline-fill-bg)" />
          {/* Internal pillars */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" opacity="0.8">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="855" y1="720" x2="855" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="880" y1="720" x2="880" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="905" y1="720" x2="905" y2="1080" />
          </g>
          {/* Windows */}
          <g strokeWidth="0.8" fill="none">
            <g className={styles.glowingWindow} strokeDasharray="4 10">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="845" y1="730" x2="845" y2="1000" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="895" y1="730" x2="895" y2="1000" strokeDashoffset="5" />
            </g>
            <g className={styles.glowingWindowDim} strokeDasharray="4 10">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="730" x2="870" y2="1000" strokeDashoffset="3" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="920" y1="730" x2="920" y2="1000" strokeDashoffset="7" />
            </g>
          </g>

          {/* Block Tower with setbacks */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1110 1080 L 1110 650 L 1140 650 L 1140 590 L 1210 590 L 1210 650 L 1240 650 L 1240 1080 Z" className={styles.bldMidSetbacks} />
          {/* Double cornices & vertical ribs for Block Tower Setbacks */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1107" y1="650" x2="1143" y2="650" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1110" y1="655" x2="1140" y2="655" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1207" y1="650" x2="1243" y2="650" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1210" y1="655" x2="1240" y2="655" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1137" y1="590" x2="1213" y2="590" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1140" y1="595" x2="1210" y2="595" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1125" y1="655" x2="1125" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1225" y1="655" x2="1225" y2="1080" />
          </g>
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" opacity="0.8">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1175" y1="590" x2="1175" y2="530" />
            {/* Horizontal window lines */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1150" y1="605" x2="1200" y2="605" strokeDasharray="4 6" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1150" y1="620" x2="1200" y2="620" strokeDasharray="4 6" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1150" y1="635" x2="1200" y2="635" strokeDasharray="4 6" />
          </g>

          {/* Shadow overlay paths for wobbly hatching depth */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 375 1080 L 375 450 L 377 450 L 377 540 L 380 540 L 380 710 L 420 710 L 420 1080 Z" className={styles.shadowHatchMid} />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 602.5 1080 L 602.5 690 L 640 690 L 640 1080 Z" className={styles.shadowHatchMid} />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 880 1080 L 880 720 L 930 720 L 930 1080 Z" className={styles.shadowHatchMid} />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1175 1080 L 1175 590 L 1210 590 L 1210 650 L 1240 650 L 1240 1080 Z" className={styles.shadowHatchMid} />
        </g>
      </svg>
    </>
  );
});

Layer1_5.displayName = 'Layer1_5';

export default Layer1_5;
