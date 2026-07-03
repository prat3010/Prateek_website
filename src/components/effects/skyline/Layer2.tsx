'use client';

import React from 'react';
import styles from '../NoirSkyline.module.css';
import { WobblyPath, WobblyLine, WobblyRect, WobblyPolygon } from '../WobblySVG';
import { LayerProps } from './types';
import RealtimeClock from './RealtimeClock';

const Layer2 = React.memo(function Layer2({ reducedMotion }: LayerProps) {
  const wobble = !reducedMotion; // Enable midground wobble with pathCache protection
  const strength = 3.0; // Medium midground wobble
  return (
    <>
      {/* Static Layer */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" className={styles.staticLayerSvg} style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="hatch-mid" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(250, 250, 250, 0.15)" strokeWidth="1.0" />
          </pattern>
          <pattern id="hatch-mid-black" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(26, 26, 46, 0.15)" strokeWidth="1.0" />
          </pattern>
        </defs>
        {/* Midground buildings (Solid fill masks Layer 1) */}
        <g className={styles.buildingGroup} stroke="var(--skyline-stroke-mid)" strokeWidth="1.2">
          {/* Far Left block */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M -1000 1080 L -1000 730 L -330 730 L -330 760 L -80 760 L -80 790 L 80 790 L 80 1080 Z" className={styles.bldMidFarLeft} />

          {/* HOTEL Neon Sign on far-left building facade */}
          <g className={styles.hotelNeonText}>
            {/* Supporting brackets */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="-240" y1="658" x2="-230" y2="658" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="-240" y1="718" x2="-230" y2="718" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" />
            {/* Sign board background */}
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="-243" y="655" width="13" height="68" rx="1" fill="var(--skyline-billboard-bg)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
            {/* Letters */}
            <text x="-236.5" y="667">H</text>
            <text x="-236.5" y="679">O</text>
            <text x="-236.5" y="691">T</text>
            <text x="-236.5" y="703">E</text>
            <text x="-236.5" y="715">L</text>
          </g>

          {/* Staggered double-tower (Left) */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 120 1080 L 120 680 L 190 680 L 190 620 L 260 620 L 260 1080 Z" className={styles.bldMidStaggered} />
          {/* Staggered double-tower rooftop AC Unit */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none">
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="140" y="668" width="16" height="12" />
            <circle cx="148" cy="674" r="4" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="148" y1="670" x2="148" y2="678" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="144" y1="674" x2="152" y2="674" />
          </g>
          {/* Staggered tower curved vent pipe */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 235 620 L 235 612 Q 235 608 230 608 Q 226 608 226 612" fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
          
          {/* Localized brick textures on staggered tower and flatiron */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" fill="none" opacity="0.5">
            {/* Cluster 1: Staggered tower */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="130" y1="710" x2="145" y2="710" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="135" y1="715" x2="150" y2="715" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="128" y1="720" x2="140" y2="720" />
          </g>
          {/* Double cornices & vertical ribs for Staggered Tower */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="117" y1="680" x2="193" y2="680" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="120" y1="685" x2="190" y2="685" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="187" y1="620" x2="263" y2="620" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="190" y1="625" x2="260" y2="625" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="135" y1="685" x2="135" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="175" y1="685" x2="175" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="205" y1="625" x2="205" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="245" y1="625" x2="245" y2="1080" />
          </g>
          {/* Window grid outlines on Left Tower */}
          <g strokeWidth="0.8" fill="none">
            <g className={styles.glowingWindowPink} strokeDasharray="2.5 8">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="150" y1="700" x2="150" y2="1000" />
            </g>
            <g className={styles.glowingWindowCyan} strokeDasharray="2.5 8">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="210" y1="640" x2="210" y2="1000" strokeDashoffset="3" />
            </g>
            <g className={styles.glowingWindowDim} strokeDasharray="2.5 8">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="170" y1="700" x2="170" y2="1000" strokeDashoffset="5" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="230" y1="640" x2="230" y2="1000" strokeDashoffset="1" />
            </g>
          </g>

          {/* Left Gap Building (Gap 0a: x=415-475) */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 415 1080 L 415 710 L 425 710 L 425 670 L 465 670 L 465 710 L 475 710 L 475 1080 Z" className={styles.bldMidLeftGap} />
          {/* Cornices & facade ribs for Left Gap Building */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="412" y1="710" x2="478" y2="710" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="415" y1="715" x2="475" y2="715" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="422" y1="670" x2="468" y2="670" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="425" y1="675" x2="465" y2="675" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="435" y1="675" x2="435" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="455" y1="675" x2="455" y2="1080" />
          </g>
          {/* Window grid outlines on Left Gap Building */}
          <g strokeWidth="0.8" fill="none">
            <g className={styles.glowingWindowDim} strokeDasharray="3 9">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="435" y1="685" x2="435" y2="1000" strokeDashoffset="4" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="455" y1="685" x2="455" y2="1000" strokeDashoffset="1" />
            </g>
          </g>

          {/* Flatiron wedge tower (Left-Center) */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 475 1080 L 475 665 L 505 640 L 525 640 L 540 665 L 540 1080 Z" className={styles.bldMidFlatiron} />
          {/* Double cornices & additional ribbing for Flatiron wedge */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="502" y1="640" x2="528" y2="640" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="505" y1="645" x2="525" y2="645" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="472" y1="665" x2="543" y2="665" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="475" y1="670" x2="540" y2="670" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="483" y1="670" x2="483" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="532" y1="670" x2="532" y2="1080" />
          </g>
          {/* Flatiron vertical wedge lines */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="505" y1="640" x2="505" y2="1080" stroke="var(--skyline-stroke-mid)" fill="none" opacity="0.8" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="525" y1="640" x2="525" y2="1080" stroke="var(--skyline-stroke-mid)" fill="none" opacity="0.8" />
          <g stroke="var(--skyline-stroke-fine)" strokeWidth="0.8" strokeDasharray="2 10" fill="none">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="490" y1="675" x2="490" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="515" y1="655" x2="515" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="530" y1="675" x2="530" y2="1080" />
          </g>

          {/* BAR Neon Sign on Flatiron building */}
          <g className={styles.barNeonSign}>
            {/* Supporting brackets */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="495" y1="678" x2="505" y2="678" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="495" y1="718" x2="505" y2="718" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" />
            {/* Sign board background */}
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="492" y="675" width="13" height="47" rx="1" fill="var(--skyline-billboard-bg)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
            {/* Letters */}
            <text x="498.5" y="687" textAnchor="middle">B</text>
            <text x="498.5" y="700.5" textAnchor="middle">A</text>
            <text x="498.5" y="714" textAnchor="middle">R</text>
          </g>

          {/* Localized brick texture: Flatiron */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" fill="none" opacity="0.5">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="520" y1="740" x2="535" y2="740" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="515" y1="745" x2="530" y2="745" />
          </g>

          {/* Citigroup-style Slanted Roof (Center-Right) */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 680 1080 L 680 690 L 760 610 L 790 610 L 790 1080 Z" className={styles.bldMidCitigroup} />
          {/* Glowing neon trace line along Citigroup roof slope */}
          <line x1="680" y1="690" x2="760" y2="610" stroke="none" className={styles.citigroupNeonRoofTrace} />
          {/* Parallel slanted cornice & center rib for Citigroup */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="680" y1="700" x2="750" y2="630" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="757" y1="610" x2="793" y2="610" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="760" y1="615" x2="790" y2="615" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="730" y1="640" x2="730" y2="1080" />
          </g>
          {/* Citigroup shoulder AC Unit */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none">
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="770" y="598" width="16" height="12" />
            <circle cx="778" cy="604" r="4" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="778" y1="600" x2="778" y2="608" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="774" y1="604" x2="782" y2="604" />
          </g>
          {/* Citigroup internal floor and column depth */}
          <g opacity="0.15" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" fill="none">
            {/* Internal columns */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="710" y1="660" x2="710" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="750" y1="620" x2="750" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="775" y1="610" x2="775" y2="1080" />
            {/* Internal floors */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="680" y1="720" x2="790" y2="720" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="680" y1="760" x2="790" y2="760" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="680" y1="800" x2="790" y2="800" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="680" y1="840" x2="790" y2="840" />
          </g>
          {/* Citibank window grids */}
          <g strokeWidth="0.8" fill="none">
            <g className={styles.glowingWindowCyan} strokeDasharray="3 10">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="700" y1="695" x2="700" y2="1000" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="740" y1="655" x2="740" y2="1000" strokeDashoffset="4" />
            </g>
            <g className={styles.glowingWindowDim} strokeDasharray="3 10">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="720" y1="675" x2="720" y2="1000" strokeDashoffset="7" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="760" y1="635" x2="760" y2="1000" strokeDashoffset="2" />
            </g>
          </g>
          {/* Citigroup window silhouettes */}
          <g fill="var(--skyline-stroke-mid)" stroke="none" opacity="0.6">
            {/* Desk lamp at x=700, y=750 */}
            <path d="M 698 750 L 702 750 L 701 745 L 703 745 A 2 2 0 0 0 697 745 L 699 745 Z" />
            {/* Potted plant at x=740, y=730 */}
            <path d="M 738 730 L 742 730 L 741 726 L 743 724 A 1.5 1.5 0 0 0 737 724 L 739 726 Z" />
          </g>

          {/* Glowing Clock Tower (11:45 PM Detective Time) */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1250 1080 L 1250 590 L 1300 590 L 1300 1080 Z" className={styles.bldMidClock} />
          {/* Top dome and spire cap */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1255 590 L 1255 570 Q 1275 550 1295 570 L 1295 590" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="550" x2="1275" y2="530" strokeWidth="1" />
          {/* Clock tower shoulder TV Yagi Antenna */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0" fill="none">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1297" y1="590" x2="1297" y2="560" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1292" y1="565" x2="1302" y2="565" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1294" y1="573" x2="1300" y2="573" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1295" y1="581" x2="1299" y2="581" />
          </g>
          {/* Realtime Clock Face */}
          <RealtimeClock wobble={wobble} strength={strength} />
          {/* Clock Face Details (Roman marker lines at 12, 3, 6, 9) */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="571" x2="1275" y2="573" stroke="var(--skyline-clock-details)" strokeWidth="0.8" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1284" y1="580" x2="1282" y2="580" stroke="var(--skyline-clock-details)" strokeWidth="0.8" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="589" x2="1275" y2="587" stroke="var(--skyline-clock-details)" strokeWidth="0.8" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1266" y1="580" x2="1268" y2="580" stroke="var(--skyline-clock-details)" strokeWidth="0.8" />
          {/* Ring border for aesthetic */}
          <circle cx="1275" cy="580" r="12" fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" />
          {/* Clock Tower windows */}
          <g strokeWidth="0.8" fill="none">
            <g className={styles.glowingWindow} strokeDasharray="4 8">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1265" y1="610" x2="1265" y2="1000" />
            </g>
            <g className={styles.glowingWindowDim} strokeDasharray="4 8">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1285" y1="610" x2="1285" y2="1000" strokeDashoffset="4" />
            </g>
            {/* Clock window horizontal division panes */}
            <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" opacity="0.6">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1260" y1="620" x2="1270" y2="620" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1260" y1="640" x2="1270" y2="640" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1260" y1="660" x2="1270" y2="660" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1280" y1="620" x2="1290" y2="620" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1280" y1="640" x2="1290" y2="640" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1280" y1="660" x2="1290" y2="660" />
            </g>
          </g>

          {/* Extra window grid lights in midground layer */}
          <g strokeWidth="0.8" fill="none">
            <g className={styles.glowingWindowPink} strokeDasharray="3 10">
              {/* Staggered window lights on Citigroup slanted roof building */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="708" y1="700" x2="708" y2="1000" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="752" y1="660" x2="752" y2="1000" strokeDashoffset="5" />
            </g>
            <g className={styles.glowingWindowCyan} strokeDasharray="3 10">
              {/* Staggered windows on Staggered double-tower left */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="140" y1="720" x2="140" y2="1000" strokeDashoffset="2" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="220" y1="670" x2="220" y2="1000" strokeDashoffset="6" />
            </g>
            <g className={styles.glowingWindowDim} strokeDasharray="3 10">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="732" y1="680" x2="732" y2="1000" strokeDashoffset="3" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="772" y1="640" x2="772" y2="1000" strokeDashoffset="1" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="160" y1="740" x2="160" y2="1000" strokeDashoffset="4" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="240" y1="690" x2="240" y2="1000" strokeDashoffset="7" />
            </g>
          </g>

          {/* Right Gap Building (Gap 2d: x=1300-1460) */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1300 1080 L 1300 680 L 1380 680 L 1380 630 L 1460 630 L 1460 1080 Z" className={styles.bldMidRightGap} />
          {/* Cornices & facade ribs for Right Gap Building */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1297" y1="680" x2="1383" y2="680" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1300" y1="685" x2="1380" y2="685" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1377" y1="630" x2="1463" y2="630" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1380" y1="635" x2="1460" y2="635" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1340" y1="685" x2="1340" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="635" x2="1420" y2="1080" />
          </g>
          {/* Window grid outlines on Right Gap Building */}
          <g strokeWidth="0.8" fill="none">
            <g className={styles.glowingWindow} strokeDasharray="3 9">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1340" y1="695" x2="1340" y2="1000" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="645" x2="1420" y2="1000" strokeDashoffset="4" />
            </g>
          </g>

          {/* Medium Tower with Water Tower on roof & Neon Sign (Right) */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1490 1080 L 1490 670 L 1610 670 L 1610 1080 Z" className={styles.bldMidWaterTower} />
          {/* Double cornices & vertical ribs for Hotel building */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1487" y1="670" x2="1613" y2="670" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="675" x2="1610" y2="675" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1502" y1="645" x2="1543" y2="645" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1505" y1="650" x2="1540" y2="650" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1520" y1="675" x2="1520" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1580" y1="675" x2="1580" y2="1080" />
          </g>
          {/* Hotel windows grid */}
          <g strokeWidth="0.8" fill="none">
            <g className={styles.glowingWindowPink} strokeDasharray="2.5 8">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1510" y1="690" x2="1510" y2="1000" />
            </g>
            <g className={styles.glowingWindowCyan} strokeDasharray="2.5 8">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1550" y1="690" x2="1550" y2="1000" strokeDashoffset="3" />
            </g>
            <g className={styles.glowingWindowPink} strokeDasharray="2.5 8">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1590" y1="690" x2="1590" y2="1000" strokeDashoffset="6" />
            </g>
            <g className={styles.glowingWindowDim} strokeDasharray="2.5 8">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1530" y1="690" x2="1530" y2="1000" strokeDashoffset="4" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1570" y1="690" x2="1570" y2="1000" strokeDashoffset="1" />
            </g>
          </g>
          {/* Roof-top details: Mechanical room */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1505 670 L 1505 645 L 1540 645 L 1540 670 Z" />

          {/* ── NEW: Narrow Tower (Gap 1b: x=650-680) ── */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 650 1080 L 650 620 L 658 580 L 672 580 L 680 620 L 680 1080 Z" className={styles.bldMidNarrow} />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="650" y1="620" x2="680" y2="620" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="658" y1="580" x2="672" y2="580" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="665" y1="580" x2="665" y2="1080" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" strokeDasharray="2 8" fill="none" opacity="0.8" />
          {/* Antenna mast */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="665" y1="580" x2="665" y2="540" />

          {/* ── NEW: Glass Office Tower (Gap 2b: x=950-1030) ── */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 950 1080 L 950 600 L 960 600 L 960 560 L 990 560 L 990 520 L 1000 520 L 1000 560 L 1030 560 L 1030 600 L 1040 600 L 1040 1080 Z" className={styles.bldMidGlass} />
          {/* Double cornices for Glass Office Tower setbacks */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="947" y1="600" x2="963" y2="600" strokeWidth="1.0" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1027" y1="600" x2="1043" y2="600" strokeWidth="1.0" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="957" y1="560" x2="993" y2="560" strokeWidth="1.0" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="997" y1="560" x2="1033" y2="560" strokeWidth="1.0" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="987" y1="520" x2="1003" y2="520" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="990" y1="525" x2="1000" y2="525" />
          </g>
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="950" y1="600" x2="1040" y2="600" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="960" y1="560" x2="1030" y2="560" />
          {/* Vertical mullions */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" strokeDasharray="3 7" opacity="0.8">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="970" y1="600" x2="970" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="990" y1="560" x2="990" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1010" y1="600" x2="1010" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1020" y1="600" x2="1020" y2="1080" />
          </g>
          {/* Windows */}
          <g strokeWidth="0.8" fill="none">
            <g className={styles.glowingWindowCyan} strokeDasharray="2.5 9">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="975" y1="610" x2="975" y2="1000" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1015" y1="610" x2="1015" y2="1000" strokeDashoffset="4" />
            </g>
            <g className={styles.glowingWindowDim} strokeDasharray="2.5 9">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="995" y1="570" x2="995" y2="1000" strokeDashoffset="6" />
            </g>
          </g>

          {/* ── NEW: Slim Spire (Gap 2c: x=1055-1095) ── */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1055 1080 L 1055 660 L 1065 660 L 1065 580 L 1075 500 L 1085 580 L 1085 660 L 1095 660 L 1095 1080 Z" className={styles.bldMidSlimSpire} />
          {/* Double cornices for Slim Spire */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1052" y1="660" x2="1068" y2="660" strokeWidth="1.0" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1082" y1="660" x2="1098" y2="660" strokeWidth="1.0" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1062" y1="580" x2="1088" y2="580" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1065" y1="585" x2="1085" y2="585" />
          </g>
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1055" y1="660" x2="1095" y2="660" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1065" y1="580" x2="1085" y2="580" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1075" y1="500" x2="1075" y2="580" />
          <g strokeWidth="0.8" fill="none">
            <g className={styles.glowingWindowDim} strokeDasharray="2 10">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1075" y1="670" x2="1075" y2="1000" />
            </g>
          </g>

          {/* ── NEW: Far Right Tower (Gap 3a: x=1700-1780) ── */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1700 1080 L 1700 650 L 1730 650 L 1730 600 L 1750 600 L 1750 650 L 1780 650 L 1780 1080 Z" className={styles.bldMidFarRight} />
          {/* Double cornices for Far Right Tower */}
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1697" y1="650" x2="1733" y2="650" strokeWidth="1.0" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1747" y1="650" x2="1783" y2="650" strokeWidth="1.0" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1727" y1="600" x2="1753" y2="600" strokeWidth="1.2" stroke="var(--skyline-stroke-fg)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1730" y1="605" x2="1750" y2="605" />
          </g>
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1700" y1="650" x2="1780" y2="650" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1730" y1="600" x2="1750" y2="600" />
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" strokeDasharray="3 8" opacity="0.8">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1720" y1="660" x2="1720" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1740" y1="610" x2="1740" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1760" y1="660" x2="1760" y2="1080" />
          </g>
          {/* Windows */}
          <g strokeWidth="0.8" fill="none">
            <g className={styles.glowingWindow} strokeDasharray="3 10">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1725" y1="660" x2="1725" y2="1000" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1755" y1="660" x2="1755" y2="1000" strokeDashoffset="4" />
            </g>
          </g>

          {/* ── NEW: Edge Building (Gap 3b: x=1850-1930) ── */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1850 1080 L 1850 680 L 1930 680 L 1930 720 L 2010 720 L 2010 660 L 2070 660 L 2070 700 L 2170 700 L 2170 650 L 2920 650 L 2920 1080 Z" className={styles.bldMidEdge} />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1850" y1="680" x2="1930" y2="680" />
          {/* Rooftop mast */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1890" y1="680" x2="1890" y2="620" />
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" strokeDasharray="2 8" opacity="0.8">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1870" y1="690" x2="1870" y2="1080" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1910" y1="690" x2="1910" y2="1080" />
          </g>
          <g strokeWidth="0.8" fill="none">
            <g className={styles.glowingWindowDim} strokeDasharray="3 10">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1880" y1="690" x2="1880" y2="1000" strokeDashoffset="3" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1900" y1="690" x2="1900" y2="1000" strokeDashoffset="7" />
            </g>
          </g>

          {/* Shadow overlay paths for wobbly hatching depth */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 155 1080 L 155 680 L 190 680 L 190 1080 Z" className={styles.shadowHatchMid} />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 225 1080 L 225 620 L 260 620 L 260 1080 Z" className={styles.shadowHatchMid} />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 735 1080 L 735 635 L 760 610 L 790 610 L 790 1080 Z" className={styles.shadowHatchMid} />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1275 1080 L 1275 590 L 1300 590 L 1300 1080 Z" className={styles.shadowHatchMid} />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1550 1080 L 1550 670 L 1610 670 L 1610 1080 Z" className={styles.shadowHatchMid} />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 665 1080 L 665 580 L 672 580 L 680 620 L 680 1080 Z" className={styles.shadowHatchMid} />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 995 1080 L 995 560 L 1000 560 L 1030 560 L 1030 600 L 1040 600 L 1040 1080 Z" className={styles.shadowHatchMid} />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1075 1080 L 1075 500 L 1085 580 L 1085 660 L 1095 660 L 1095 1080 Z" className={styles.shadowHatchMid} />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1740 1080 L 1740 600 L 1750 600 L 1750 650 L 1780 650 L 1780 1080 Z" className={styles.shadowHatchMid} />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1890 1080 L 1890 680 L 1930 680 L 1930 720 L 2010 720 L 2010 660 L 2070 660 L 2070 700 L 2170 700 L 2170 650 L 2920 650 L 2920 1080 Z" className={styles.shadowHatchMid} />
          
          {/* New midground buildings shadow hatches */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 445 1080 L 445 670 L 465 670 L 465 710 L 475 710 L 475 1080 Z" className={styles.shadowHatchMid} />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1340 1080 L 1340 680 L 1380 680 L 1380 1080 Z M 1420 1080 L 1420 630 L 1460 630 L 1460 1080 Z" className={styles.shadowHatchMid} />
        </g>

        {/* Distant Background Shoreline / Docks at the Waterline (y = 938 to 950) */}
        <g className={styles.buildingGroup} stroke="var(--skyline-stroke-fg)" strokeWidth="1.8">
          <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0" fill="var(--skyline-fill-bg)">
            {/* Horizontal concrete seawall slab */}
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="-1000" y="938" width="3920" height="12" fill="var(--skyline-fill-bg)" className={styles.buildingGroup} stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" />

            {/* Coping stone horizontal accent line */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="-1000" y1="944" x2="2920" y2="944" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />

            {/* Vertical concrete block joint lines */}
            {Array.from({ length: 160 }).map((_, i) => {
              const x = -1000 + i * 25;
              return x > -1000 && x < 2920 ? (
                <WobblyLine key={`seawall-seam-${i}`} wobble={wobble} wobbleStrength={strength} x1={x} y1="938" x2={x} y2="950" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" />
              ) : null;
            })}

            {/* Miniature dock streetlights */}
            {/* Spaced along the promenade: x = 485, 755, 985, 1225 */}
            {[485, 755, 985, 1225].map((x, i) => (
              <g key={`dock-light-${i}`} stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none">
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1={x} y1="938" x2={x} y2="918" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d={`M ${x} 918 Q ${x} 914 ${x + 3} 914`} />
                <circle cx={x + 3} cy={915} r="1" fill="var(--skyline-bulb-glow)" stroke="none" />
              </g>
            ))}

            {/* Mooring Bollards spaced along the edge of the seawall */}
            {[510, 590, 710, 790, 955, 1035, 1115, 1195, 1320].map((x, i) => (
              <g key={`bollard-${i}`} stroke="var(--skyline-stroke-fg)" strokeWidth="0.8">
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1={x - 2} y1="934" x2={x + 2} y2="934" strokeWidth="1.0" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1={x} y1="934" x2={x} y2="938" strokeWidth="1.4" />
              </g>
            ))}

            {/* Stacked Cargo Crates on the docks */}
            {/* Left crates (near Warehouse 1) */}
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="502" y="930" width="8" height="8" />
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="510" y="932" width="6" height="6" />
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="503" y="924" width="6" height="6" />
            {/* Right crates (near Warehouse 4) */}
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="1318" y="930" width="8" height="8" />
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="1319" y="922" width="8" height="8" />
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="1326" y="932" width="6" height="6" />

            {/* Left side warehouses */}
            {/* Warehouse 1 (Pitched roof) */}
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="470" y="918" width="30" height="20" />
            <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="470,918 485,906 500,918" />
            
            {/* Warehouse 2 (Flat roof with small skylight) */}
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="575" y="922" width="35" height="16" />
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="588" y="918" width="9" height="4" />

            {/* Distant Gantry Crane 1 (Left) */}
            <g strokeWidth="0.8">
              {/* Legs */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 520 938 L 535 893 L 550 938" fill="none" />
              {/* Boom arm */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="508" y1="893" x2="565" y2="878" />
              {/* Upper support tower & trusses */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="535" y1="893" x2="535" y2="868" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="535" y1="868" x2="565" y2="878" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="535" y1="868" x2="508" y2="893" />
              {/* Cabin block */}
              <WobblyRect wobble={wobble} wobbleStrength={strength} x="529" y="893" width="12" height="8" />
            </g>

            {/* Moored Cargo Ship (Center-Left) */}
            <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 625 938 L 690 938 L 685 926 L 630 926 Z" />
            {/* Superstructure & Funnel */}
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="668" y="912" width="14" height="14" />
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="674" y="904" width="4" height="8" />
            {/* Cargo containers on deck */}
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="636" y="918" width="12" height="8" />
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="650" y="918" width="12" height="8" />

            {/* Right side warehouses */}
            {/* Warehouse 3 (Pitched roof) */}
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="1335" y="916" width="45" height="22" />
            <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="1335,916 1357.5,904 1380,916" />

            {/* Warehouse 4 (Flat roof) */}
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="1385" y="922" width="30" height="16" />

            {/* Distant Gantry Crane 2 (Right) */}
            <g strokeWidth="0.8">
              {/* Legs */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1260 938 L 1275 893 L 1290 938" fill="none" />
              {/* Boom arm */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1235" y1="878" x2="1292" y2="893" />
              {/* Upper support tower & trusses */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="893" x2="1275" y2="868" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="868" x2="1235" y2="878" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="868" x2="1292" y2="893" />
              {/* Cabin block */}
              <WobblyRect wobble={wobble} wobbleStrength={strength} x="1269" y="893" width="12" height="8" />
            </g>
          </g>

          {/* River water body under the bridge */}
          <WobblyRect wobble={wobble} wobbleStrength={strength} x="-1000" y="950" width="3920" height="500" fill="var(--skyline-river-fill)" stroke="none" />
        </g>
      </svg>

      {/* Animated Layer (Unfiltered) */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* HOTEL Neon Sign (Blade Sign hanging off the left edge of Hotel building x=1490) */}
        <g stroke="none" fill="none">
          {/* Supporting brackets */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1475" y1="685" x2="1490" y2="685" stroke="var(--skyline-stroke-mid)" strokeWidth="1" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1475" y1="745" x2="1490" y2="745" stroke="var(--skyline-stroke-mid)" strokeWidth="1" fill="none" />
          
          {/* Sign board background */}
          <WobblyRect wobble={wobble} wobbleStrength={strength} x="1474" y="680" width="12" height="70" fill="var(--skyline-billboard-bg)" stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" className={styles.hotelSignBoard} />
          
          {/* Neon Letters */}
          <g className={styles.hotelNeonText} fill="none" stroke="none">
            <text x="1480" y="694" textAnchor="middle">H</text>
            <text x="1480" y="707" textAnchor="middle">O</text>
            <text x="1480" y="720" textAnchor="middle">T</text>
            <text x="1480" y="733" textAnchor="middle">E</text>
            <text x="1480" y="746" textAnchor="middle">L</text>
          </g>
        </g>

        {/* Chugging Tugboat (Moving behind buildings) */}
        <g className={styles.tugboatTransit}>
          <g className={styles.tugboatBobbing}>
            <g className={styles.bldFgTugboat}>
              {/* Tugboat hull */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1030 950 L 1070 950 L 1065 941 L 1035 941 Z" fill="var(--skyline-tugboat-hull)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
              {/* Cabin */}
              <WobblyRect wobble={wobble} wobbleStrength={strength} x="1040" y="933" width="16" height="8" fill="var(--skyline-tugboat-cabin)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
              {/* Cabin window */}
              <WobblyRect
                wobble={wobble}
                wobbleStrength={strength}
                x="1043"
                y="935"
                width="4"
                height="4"
                className={styles.tugboatWindow}
                fill="var(--skyline-bulb-glow)"
                stroke="none"
              />
              {/* Smokestack */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1052" y1="933" x2="1052" y2="926" stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" />
              {/* Smoke puffs */}
              <circle cx="1052" cy="924" r="1.5" className={styles.smokePuff1} fill="none" stroke="var(--skyline-tugboat-smoke)" strokeWidth="0.8" />
              <circle cx="1052" cy="924" r="1.5" className={styles.smokePuff2} fill="none" stroke="var(--skyline-tugboat-smoke)" strokeWidth="0.8" />
              <circle cx="1052" cy="924" r="1.5" className={styles.smokePuff3} fill="none" stroke="var(--skyline-tugboat-smoke)" strokeWidth="0.8" />
              {/* Propeller wake wave ripples */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1026 947 Q 1010 945 995 948" className={styles.tugboatWake1} fill="none" stroke="var(--skyline-stroke-fine)" strokeWidth="0.8" />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1020 951 Q 1005 950 988 953" className={styles.tugboatWake2} fill="none" stroke="var(--skyline-stroke-fine)" strokeWidth="0.8" />
            </g>
          </g>
        </g>

        {/* Slower Sailboat (Drifting in background) */}
        <g className={styles.sailboatTransit}>
          <g className={styles.sailboatBobbing}>
            <g>
              {/* Sailboat hull */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1030 950 L 1070 950 L 1075 943 L 1025 943 Z" fill="var(--skyline-sailboat-hull)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
              {/* Mast */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1050" y1="943" x2="1050" y2="905" stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" />
              {/* Main Sail */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1050 908 L 1050 940 L 1032 940 Z" fill="var(--skyline-sailboat-sail)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
              {/* Jib Sail */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1052 914 L 1052 940 L 1064 940 Z" fill="var(--skyline-sailboat-sail)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
              {/* Wake */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1076 948 Q 1090 947 1100 950" className={styles.sailboatWake} fill="none" stroke="var(--skyline-stroke-fine)" strokeWidth="0.8" />
            </g>
          </g>
        </g>

        {/* Speedy Speedboat (Foreground, fast transit) */}
        <g className={styles.speedboatTransit}>
          <g className={styles.speedboatBobbing}>
            <g>
              {/* Speedboat hull */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1032 950 L 1068 950 L 1073 944 L 1045 944 Z" fill="var(--skyline-speedboat-hull)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
              {/* Windshield */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1047 944 L 1052 939 L 1060 939 L 1059 944 Z" fill="var(--skyline-speedboat-windshield)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
              {/* Antenna mast */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1058" y1="939" x2="1058" y2="932" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />
              {/* Speedboat wakes */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1030 948 Q 1010 944 985 949" className={styles.speedboatWake1} fill="none" stroke="var(--skyline-stroke-fine)" strokeWidth="1" />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1028 951 Q 1005 948 975 955" className={styles.speedboatWake2} fill="none" stroke="var(--skyline-stroke-fine)" strokeWidth="1" />
            </g>
          </g>
        </g>

        {/* Asynchronous Flickering Window Cells (Layer 2 - Unfiltered for performance) */}
        <g strokeWidth="1.0" fill="none">
          {/* Staggered double-tower (Left) */}
          <line x1="170" y1="780" x2="170" y2="783" className={styles.windowFlicker2} />
          <line x1="210" y1="730" x2="210" y2="733" className={styles.windowFlicker4} />

          {/* Hotel building */}
          <line x1="1530" y1="720" x2="1530" y2="723" className={styles.windowFlicker1} />
          <line x1="1570" y1="760" x2="1570" y2="763" className={styles.windowFlicker3} />

          {/* Left Gap Building */}
          <line x1="435" y1="720" x2="435" y2="723" className={styles.windowFlicker2} />
          <line x1="455" y1="760" x2="455" y2="763" className={styles.windowFlicker4} />

          {/* Right Gap Building */}
          <line x1="1340" y1="730" x2="1340" y2="733" className={styles.windowFlicker1} />
          <line x1="1420" y1="690" x2="1420" y2="693" className={styles.windowFlicker3} />
        </g>
      </svg>
    </>
  );
});

Layer2.displayName = 'Layer2';

export default Layer2;
