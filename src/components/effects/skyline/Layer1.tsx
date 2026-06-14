'use client';

import React from 'react';
import styles from '../NoirSkyline.module.css';
import { WobblyPath, WobblyLine, WobblyRect, WobblyPolygon } from '../WobblySVG';
import { LayerProps } from './types';

const Layer1 = React.memo(function Layer1({ reducedMotion }: LayerProps) {
  const wobble = !reducedMotion;
  const strength = 2.0; // Subtle background wobble
  return (
    <>
      {/* Static Layer */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="hatch-bg" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(250, 250, 250, 0.08)" strokeWidth="0.8" />
          </pattern>
          <pattern id="hatch-bg-black" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(26, 26, 46, 0.08)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <g className={styles.buildingGroup} stroke="var(--skyline-stroke-bg)" strokeWidth="0.8">
          {/* Left distant skyscrapers */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M -1000 1080 L -1000 820 L -350 820 L -350 800 L -330 800 L -330 760 L -310 760 L -310 700 L -270 700 L -270 760 L -250 760 L -250 800 L -230 800 L -230 820 L -120 820 L -120 740 L -70 740 L -70 780 L -50 780 L -50 1080 Z M 50 1080 L 50 780 L 90 780 L 90 740 L 120 740 L 120 1080 Z" className={styles.bldBgSkyscrapers} />
          {/* Elevator Penthouse & Chimney Stack */}
          <WobblyRect wobble={wobble} wobbleStrength={strength} x="100" y="725" width="14" height="15" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="117" y1="740" x2="117" y2="720" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="115" y1="720" x2="119" y2="720" fill="none" />

          {/* Left Ziggurat Vertical Ribs */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="-300" y1="700" x2="-300" y2="1080" strokeDasharray="3 6" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="-280" y1="700" x2="-280" y2="1080" strokeDasharray="3 6" fill="none" />

          {/* Mid-Century Tower Vertical Ribs */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="-105" y1="740" x2="-105" y2="1080" strokeDasharray="2 5" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="-90" y1="740" x2="-90" y2="1080" strokeDasharray="2 5" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="-75" y1="740" x2="-75" y2="1080" strokeDasharray="2 5" fill="none" />

          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="90" y1="740" x2="90" y2="780" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="60" y1="780" x2="60" y2="1080" strokeDasharray="2 8" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="75" y1="780" x2="75" y2="1080" strokeDasharray="2 8" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="105" y1="740" x2="105" y2="1080" strokeDasharray="2 8" fill="none" />
          {/* Horizontal Cornices on Right block */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="50" y1="785" x2="90" y2="785" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="90" y1="745" x2="120" y2="745" fill="none" />
          
          {/* Stepped Needle Tower (Left-Mid) */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 220 1080 L 220 720 L 230 720 L 230 650 L 240 650 L 240 540 L 246 540 L 246 450 L 250 450 L 250 350 L 254 350 L 254 450 L 258 450 L 258 540 L 264 540 L 264 650 L 274 650 L 274 720 L 284 720 L 284 1080 Z" className={styles.bldBgNeedle} />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="220" y1="720" x2="284" y2="720" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="230" y1="650" x2="274" y2="650" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="240" y1="540" x2="264" y2="540" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="235" y1="720" x2="235" y2="1080" strokeDasharray="3 6" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="269" y1="720" x2="269" y2="1080" strokeDasharray="3 6" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="245" y1="650" x2="245" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="259" y1="650" x2="259" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="252" y1="280" x2="252" y2="650" />
          {/* Stepped Needle Tower Gooseneck Ventilation Pipe */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 235 720 L 235 712 Q 235 708 231 708 Q 227 708 227 712" fill="none" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />
          
          {/* Chrysler-inspired Arched Spire Tower (Left-Center) */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 450 1080 L 450 670 L 458 640 L 468 640 L 468 590 L 478 590 L 478 535 L 488 500 L 498 340 L 508 500 L 518 535 L 518 590 L 528 590 L 528 640 L 538 640 L 546 670 L 546 1080 Z" className={styles.bldBgChrysler} />
          {/* Chrysler internal details */}
          {/* Nested arches */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 478 535 A 10 10 0 0 1 518 535" />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 482 535 A 8 8 0 0 1 514 535" />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 486 535 A 6 6 0 0 1 510 535" />
          
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 468 590 A 20 20 0 0 1 528 590" />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 473 590 A 17 17 0 0 1 523 590" />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 478 590 A 14 14 0 0 1 518 590" />
          
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 458 640 A 40 40 0 0 1 538 640" />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 463 640 A 35 35 0 0 1 533 640" />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 470 640 A 30 30 0 0 1 526 640" />
          
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 488 500 A 10 10 0 0 1 508 500" />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 491 500 A 7 7 0 0 1 505 500" />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 494 500 A 4 4 0 0 1 502 500" />

          {/* Double-line cornices */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="450" y1="670" x2="546" y2="670" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="450" y1="673" x2="546" y2="673" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="458" y1="640" x2="538" y2="640" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="458" y1="643" x2="538" y2="643" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="468" y1="590" x2="528" y2="590" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="468" y1="593" x2="528" y2="593" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="478" y1="535" x2="518" y2="535" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="478" y1="538" x2="518" y2="538" />

          {/* Spire sunburst lines */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="498" y1="340" x2="498" y2="500" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="498" y1="340" x2="480" y2="480" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="498" y1="340" x2="490" y2="480" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="498" y1="340" x2="506" y2="480" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="498" y1="340" x2="516" y2="480" />
     
          {/* Empire State Building (Center) */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 920 1080 L 920 830 L 928 830 L 928 750 L 928 750 L 938 750 L 938 610 L 946 610 L 946 460 L 954 460 L 954 320 L 960 320 L 960 460 L 968 460 L 968 610 L 976 610 L 976 750 L 986 750 L 986 830 L 994 830 L 994 1080 Z" className={styles.bldBgEmpire} />
          {/* Empire State Details */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="920" y1="830" x2="994" y2="830" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="920" y1="833" x2="994" y2="833" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="928" y1="750" x2="986" y2="750" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="928" y1="753" x2="986" y2="753" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="938" y1="610" x2="976" y2="610" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="938" y1="613" x2="976" y2="613" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="946" y1="460" x2="968" y2="460" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="946" y1="463" x2="968" y2="463" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="957" y1="240" x2="957" y2="460" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="946" y1="460" x2="968" y2="460" strokeDasharray="2 3" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="938" y1="610" x2="976" y2="610" strokeDasharray="2 3" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="957" y1="460" x2="957" y2="830" opacity="0.4" />
          {/* Vertical Mullion Ribs */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="935" y1="830" x2="935" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="945" y1="750" x2="945" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="950" y1="610" x2="950" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="954" y1="460" x2="954" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="966" y1="460" x2="966" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="970" y1="610" x2="970" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="975" y1="750" x2="975" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="985" y1="830" x2="985" y2="1080" />
          {/* Additional ESB Mullions */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="949" y1="460" x2="949" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="953" y1="460" x2="953" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="961" y1="460" x2="961" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="965" y1="460" x2="965" y2="1080" />
          {/* Glass depth horizontal floor lines for ESB */}
          <g opacity="0.2" stroke="var(--skyline-stroke-fine)" strokeWidth="0.6">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="946" y1="490" x2="968" y2="490" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="946" y1="520" x2="968" y2="520" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="946" y1="550" x2="968" y2="550" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="946" y1="580" x2="968" y2="580" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="938" y1="630" x2="976" y2="630" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="938" y1="660" x2="976" y2="660" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="938" y1="690" x2="976" y2="690" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="938" y1="720" x2="976" y2="720" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="928" y1="770" x2="986" y2="770" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="928" y1="800" x2="986" y2="800" />
          </g>
     
          {/* Flat top tower with twin antenna (Right-Mid) */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1290 1080 L 1290 620 L 1420 620 L 1420 1080 Z" className={styles.bldBgFlatTop} />
          {/* Flat top tower decorative dentil cornice */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1290" y1="624" x2="1420" y2="624" strokeDasharray="2 3" stroke="var(--skyline-stroke-fine)" />
          {/* Flat top tower satellite dish */}
          <g stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" fill="none">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1410" y1="620" x2="1412" y2="610" />
            <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1406 606 A 6 6 0 0 1 1418 614" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1412" y1="610" x2="1415" y2="606" />
          </g>
          {/* Flat Top Rooftop Water Tower (Highly Detailed, scaled foreground design) */}
          <g>
            {/* Trestle Support Legs */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1328" y1="620" x2="1330" y2="605" strokeWidth="0.8" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1340" y1="620" x2="1338" y2="605" strokeWidth="0.8" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1332" y1="620" x2="1333" y2="605" strokeWidth="0.5" opacity="0.6" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1336" y1="620" x2="1335" y2="605" strokeWidth="0.5" opacity="0.6" />
            
            {/* Cross Bracing */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1330" y1="605" x2="1338" y2="612" strokeWidth="0.5" opacity="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1338" y1="605" x2="1330" y2="612" strokeWidth="0.5" opacity="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1330" y1="612" x2="1340" y2="620" strokeWidth="0.5" opacity="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1338" y1="612" x2="1328" y2="620" strokeWidth="0.5" opacity="0.5" />
            
            {/* Horizontal Struts */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1330" y1="612" x2="1338" y2="612" strokeWidth="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1329" y1="605" x2="1339" y2="605" strokeWidth="1.0" />
            
            {/* Center Pipe */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1334" y1="605" x2="1334" y2="620" strokeWidth="1.2" />
            
            {/* Tank Barrel Body */}
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="1328" y="588" width="12" height="17" className={styles.bldBgWaterTank1Body} />
            
            {/* Vertical Staves (Planks) */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1330" y1="588" x2="1330" y2="605" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1332" y1="588" x2="1332" y2="605" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1334" y1="588" x2="1334" y2="605" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1336" y1="588" x2="1336" y2="605" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1338" y1="588" x2="1338" y2="605" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            
            {/* Horizontal Steel Hoops */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1328" y1="591" x2="1340" y2="591" strokeWidth="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1328" y1="596" x2="1340" y2="596" strokeWidth="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1328" y1="601" x2="1340" y2="601" strokeWidth="0.5" />
            
            {/* Conical Roof */}
            <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="1327,588 1334,580 1341,588" className={styles.bldBgWaterTank1Roof} />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1334" y1="580" x2="1327" y2="588" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1334" y1="580" x2="1330" y2="588" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1334" y1="580" x2="1334" y2="588" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1334" y1="580" x2="1338" y2="588" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1334" y1="580" x2="1341" y2="588" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            
            {/* Finial Peak */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1334" y1="580" x2="1334" y2="576" strokeWidth="0.6" />
            <circle cx="1334" cy="576" r="0.6" fill="var(--skyline-stroke-fg)" stroke="none" />
            
            {/* Side Ladder */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1325" y1="609" x2="1325" y2="586" strokeWidth="0.4" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1326.5" y1="609" x2="1326.5" y2="586" strokeWidth="0.4" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1325" y1="588" x2="1326.5" y2="588" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1325" y1="591" x2="1326.5" y2="591" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1325" y1="594" x2="1326.5" y2="594" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1325" y1="597" x2="1326.5" y2="597" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1325" y1="600" x2="1326.5" y2="600" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1325" y1="603" x2="1326.5" y2="603" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1325" y1="606" x2="1326.5" y2="606" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
          </g>

          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1350" y1="620" x2="1350" y2="540" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1390" y1="620" x2="1390" y2="520" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1310" y1="620" x2="1310" y2="1080" strokeDasharray="5 5" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1340" y1="620" x2="1340" y2="1080" strokeDasharray="5 5" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1360" y1="620" x2="1360" y2="1080" strokeDasharray="5 5" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1380" y1="620" x2="1380" y2="1080" strokeDasharray="5 5" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1400" y1="620" x2="1400" y2="1080" strokeDasharray="5 5" />
     
          {/* Steeped Block Tower (Far Right) */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1720 1080 L 1720 740 L 1735 740 L 1735 680 L 1750 680 L 1750 580 L 1790 580 L 1790 680 L 1805 680 L 1805 740 L 1820 740 L 1820 1080 Z" className={styles.bldBgStepped} />
          {/* Stepped Block Tower cornices dentils */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1750" y1="584" x2="1790" y2="584" strokeDasharray="1.5 2.5" stroke="var(--skyline-stroke-fine)" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1735" y1="684" x2="1805" y2="684" strokeDasharray="1.5 2.5" stroke="var(--skyline-stroke-fine)" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1720" y1="744" x2="1820" y2="744" strokeDasharray="1.5 2.5" stroke="var(--skyline-stroke-fine)" />
          {/* Stepped Block Tower Ventilation Pipe */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1742" y1="680" x2="1742" y2="662" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1740" y1="662" x2="1744" y2="662" />

          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1720" y1="740" x2="1820" y2="740" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1720" y1="743" x2="1820" y2="743" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1735" y1="680" x2="1805" y2="680" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1735" y1="683" x2="1805" y2="683" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1750" y1="580" x2="1790" y2="580" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1750" y1="583" x2="1790" y2="583" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1760" y1="580" x2="1760" y2="1080" strokeDasharray="2 6" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1770" y1="580" x2="1770" y2="1080" strokeDasharray="2 6" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1780" y1="580" x2="1780" y2="1080" strokeDasharray="2 6" />
          {/* Stepped Block Tower Vertical Ribs */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1740" y1="680" x2="1740" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1755" y1="580" x2="1755" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1765" y1="580" x2="1765" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1775" y1="580" x2="1775" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1785" y1="580" x2="1785" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1800" y1="680" x2="1800" y2="1080" />
     
          {/* ── NEW: Art Deco Tower (Gap 1: x=140-200) ── */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 140 1080 L 140 700 L 155 700 L 155 660 L 170 660 L 170 620 L 175 580 L 180 620 L 195 620 L 195 660 L 200 660 L 200 1080 Z" className={styles.bldBgArtDecoGap1} />
          {/* Art Deco Shoulder Rooftop Water Tower (Highly Detailed, scaled foreground design) */}
          <g>
            {/* Trestle Support Legs */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="183" y1="620" x2="185" y2="605" strokeWidth="0.8" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="193" y1="620" x2="191" y2="605" strokeWidth="0.8" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="186.5" y1="620" x2="187" y2="605" strokeWidth="0.5" opacity="0.6" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="189.5" y1="620" x2="189" y2="605" strokeWidth="0.5" opacity="0.6" />
            
            {/* Cross Bracing */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="185" y1="605" x2="191" y2="612" strokeWidth="0.5" opacity="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="191" y1="605" x2="185" y2="612" strokeWidth="0.5" opacity="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="185" y1="612" x2="193" y2="620" strokeWidth="0.5" opacity="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="191" y1="612" x2="183" y2="620" strokeWidth="0.5" opacity="0.5" />
            
            {/* Horizontal Struts */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="185" y1="612" x2="191" y2="612" strokeWidth="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="184" y1="605" x2="192" y2="605" strokeWidth="1.0" />
            
            {/* Center Pipe */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="189" y1="605" x2="189" y2="620" strokeWidth="1.2" />
            
            {/* Tank Barrel Body */}
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="183" y="588" width="12" height="17" className={styles.bldBgWaterTank3Body} />
            
            {/* Vertical Staves (Planks) */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="185" y1="588" x2="185" y2="605" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="187" y1="588" x2="187" y2="605" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="189" y1="588" x2="189" y2="605" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="191" y1="588" x2="191" y2="605" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="193" y1="588" x2="193" y2="605" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            
            {/* Horizontal Steel Hoops */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="183" y1="591" x2="195" y2="591" strokeWidth="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="183" y1="596" x2="195" y2="596" strokeWidth="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="183" y1="601" x2="195" y2="601" strokeWidth="0.5" />
            
            {/* Conical Roof */}
            <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="182,588 189,580 196,588" className={styles.bldBgWaterTank3Roof} />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="189" y1="580" x2="182" y2="588" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="189" y1="580" x2="186" y2="588" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="189" y1="580" x2="189" y2="588" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="189" y1="580" x2="192" y2="588" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="189" y1="580" x2="196" y2="588" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            
            {/* Finial Peak */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="189" y1="580" x2="189" y2="576" strokeWidth="0.6" />
            <circle cx="189" cy="576" r="0.6" fill="var(--skyline-stroke-fg)" stroke="none" />
            
            {/* Side Ladder */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="180" y1="608" x2="180" y2="586" strokeWidth="0.4" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="181.5" y1="608" x2="181.5" y2="586" strokeWidth="0.4" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="180" y1="588" x2="181.5" y2="588" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="180" y1="591" x2="181.5" y2="591" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="180" y1="594" x2="181.5" y2="594" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="180" y1="597" x2="181.5" y2="597" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="180" y1="600" x2="181.5" y2="600" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="180" y1="603" x2="181.5" y2="603" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="180" y1="606" x2="181.5" y2="606" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
          </g>

          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="140" y1="700" x2="200" y2="700" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="140" y1="703" x2="200" y2="703" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="155" y1="660" x2="195" y2="660" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="155" y1="663" x2="195" y2="663" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="170" y1="620" x2="195" y2="620" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="170" y1="623" x2="195" y2="623" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="160" y1="700" x2="160" y2="1080" strokeDasharray="2 7" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="180" y1="700" x2="180" y2="1080" strokeDasharray="2 7" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="170" y1="660" x2="170" y2="1080" strokeDasharray="2 7" />
          {/* Masonry relief chevrons */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 171 630 L 175 635 L 179 630" fill="none" />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 171 636 L 175 641 L 179 636" fill="none" />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 171 642 L 175 647 L 179 642" fill="none" />

          {/* ── NEW: Slim Needle Spire (Gap 2a: x=630-670) ── */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 630 1080 L 630 640 L 640 640 L 640 520 L 650 400 L 660 520 L 660 640 L 670 640 L 670 1080 Z" className={styles.bldBgSlimNeedleGap2a} />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="630" y1="640" x2="670" y2="640" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="630" y1="643" x2="670" y2="643" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="640" y1="520" x2="660" y2="520" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="640" y1="523" x2="660" y2="523" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="650" y1="400" x2="650" y2="520" />
          {/* Glowing neon spire line in Noir mode */}
          <line x1="650" y1="400" x2="650" y2="520" stroke="none" className={styles.neonSpireTrace} />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="645" y1="640" x2="645" y2="1080" strokeDasharray="2 8" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="655" y1="640" x2="655" y2="1080" strokeDasharray="2 8" />

          {/* ── NEW: Twin Tower Complex (Gap 2b: x=740-840) ── */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 740 1080 L 740 590 L 780 590 L 780 1080 Z" className={styles.bldBgTwinLeft} />
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 800 1080 L 800 550 L 840 550 L 840 1080 Z" className={styles.bldBgTwinRight} />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="740" y1="590" x2="780" y2="590" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="740" y1="593" x2="780" y2="593" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="800" y1="550" x2="840" y2="550" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="800" y1="553" x2="840" y2="553" fill="none" />
          {/* Twin tower connecting skybridge */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="780" y1="680" x2="800" y2="680" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="780" y1="685" x2="800" y2="685" fill="none" />
          {/* Glowing neon skybridge line in Noir mode */}
          <line x1="781" y1="682" x2="799" y2="682" stroke="none" className={styles.skybridgeNeonTrace} />
          {/* Internal columns */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="755" y1="590" x2="755" y2="1080" strokeDasharray="2 7" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="765" y1="590" x2="765" y2="1080" strokeDasharray="2 7" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="815" y1="550" x2="815" y2="1080" strokeDasharray="2 7" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="825" y1="550" x2="825" y2="1080" strokeDasharray="2 7" fill="none" />
          {/* Twin tower internal depth horizontal lines */}
          <g opacity="0.2" stroke="var(--skyline-stroke-fine)" strokeWidth="0.6">
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="740" y1="630" x2="780" y2="630" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="740" y1="660" x2="780" y2="660" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="740" y1="700" x2="780" y2="700" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="740" y1="740" x2="780" y2="740" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="800" y1="590" x2="840" y2="590" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="800" y1="630" x2="840" y2="630" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="800" y1="670" x2="840" y2="670" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="800" y1="710" x2="840" y2="710" />
          </g>
          {/* Recessed central window slots */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="758" y1="590" x2="758" y2="1080" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="762" y1="590" x2="762" y2="1080" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="818" y1="550" x2="818" y2="1080" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="822" y1="550" x2="822" y2="1080" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" fill="none" />
          {/* Additional vertical panel lines */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="750" y1="590" x2="750" y2="1080" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="770" y1="590" x2="770" y2="1080" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="810" y1="550" x2="810" y2="1080" fill="none" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="830" y1="550" x2="830" y2="1080" fill="none" />
          {/* Antenna on taller tower */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="820" y1="550" x2="820" y2="480" fill="none" />

          {/* ── NEW: Setback Office Block (Gap 3a: x=1050-1140) ── */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1030 1080 L 1030 680 L 1070 680 L 1070 600 L 1100 600 L 1100 530 L 1110 530 L 1110 600 L 1140 600 L 1140 1080 Z" className={styles.bldBgSetbackGap3a} />
          {/* Large recessed arched facade window bay on Setback Office Block */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1080 750 L 1080 630 A 25 25 0 0 1 1130 630 L 1130 750" fill="none" stroke="var(--skyline-stroke-fg)" strokeWidth="1.0" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1080" y1="650" x2="1130" y2="650" fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1080" y1="680" x2="1130" y2="680" fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1080" y1="710" x2="1130" y2="710" fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1095" y1="610" x2="1095" y2="750" fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1115" y1="610" x2="1115" y2="750" fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />

          {/* Setback Office Rooftop Water Tower (Highly Detailed, scaled foreground design) */}
          <g>
            {/* Trestle Support Legs */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1078" y1="600" x2="1080" y2="585" strokeWidth="0.8" fill="none" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1090" y1="600" x2="1088" y2="585" strokeWidth="0.8" fill="none" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1082" y1="600" x2="1083" y2="585" strokeWidth="0.5" opacity="0.6" fill="none" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1086" y1="600" x2="1085" y2="585" strokeWidth="0.5" opacity="0.6" fill="none" />
            
            {/* Cross Bracing */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1080" y1="585" x2="1088" y2="592" strokeWidth="0.5" opacity="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1088" y1="585" x2="1080" y2="592" strokeWidth="0.5" opacity="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1080" y1="592" x2="1090" y2="600" strokeWidth="0.5" opacity="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1088" y1="592" x2="1078" y2="600" strokeWidth="0.5" opacity="0.5" />
            
            {/* Horizontal Struts */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1080" y1="592" x2="1088" y2="592" strokeWidth="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1079" y1="585" x2="1089" y2="585" strokeWidth="1.0" />
            
            {/* Center Pipe */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1084" y1="585" x2="1084" y2="600" strokeWidth="1.2" />
            
            {/* Tank Barrel Body */}
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="1078" y="568" width="12" height="17" className={styles.bldBgWaterTank2Body} />
            
            {/* Vertical Staves (Planks) */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1080" y1="568" x2="1080" y2="585" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1082" y1="568" x2="1082" y2="585" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1084" y1="568" x2="1084" y2="585" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1086" y1="568" x2="1086" y2="585" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1088" y1="568" x2="1088" y2="585" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            
            {/* Horizontal Steel Hoops */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1078" y1="571" x2="1090" y2="571" strokeWidth="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1078" y1="575" x2="1090" y2="575" strokeWidth="0.5" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1078" y1="579" x2="1090" y2="579" strokeWidth="0.5" />
            
            {/* Conical Roof */}
            <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="1077,568 1084,560 1091,568" className={styles.bldBgWaterTank2Roof} />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1084" y1="560" x2="1077" y2="568" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1084" y1="560" x2="1080" y2="568" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1084" y1="560" x2="1084" y2="568" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1084" y1="560" x2="1088" y2="568" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1084" y1="560" x2="1091" y2="568" strokeWidth="0.4" stroke="var(--skyline-stroke-fine)" />
            
            {/* Finial Peak */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1084" y1="560" x2="1084" y2="556" strokeWidth="0.6" />
            <circle cx="1084" cy="556" r="0.6" fill="var(--skyline-stroke-fg)" stroke="none" />
            
            {/* Side Ladder */}
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1075" y1="589" x2="1075" y2="566" strokeWidth="0.4" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1076.5" y1="589" x2="1076.5" y2="566" strokeWidth="0.4" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1075" y1="568" x2="1076.5" y2="568" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1075" y1="571" x2="1076.5" y2="571" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1075" y1="574" x2="1076.5" y2="574" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1075" y1="577" x2="1076.5" y2="577" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1075" y1="580" x2="1076.5" y2="580" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1075" y1="583" x2="1076.5" y2="583" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
            <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1075" y1="586" x2="1076.5" y2="586" strokeWidth="0.3" stroke="var(--skyline-stroke-mid)" />
          </g>

          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1030" y1="680" x2="1140" y2="680" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1030" y1="683" x2="1140" y2="683" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1070" y1="600" x2="1140" y2="600" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1070" y1="603" x2="1140" y2="603" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1060" y1="680" x2="1060" y2="1080" strokeDasharray="3 6" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1080" y1="600" x2="1080" y2="1080" strokeDasharray="3 6" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1120" y1="600" x2="1120" y2="1080" strokeDasharray="3 6" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1130" y1="680" x2="1130" y2="1080" strokeDasharray="3 6" />

          {/* ── NEW: Narrow Deco Tower (Gap 3b: x=1200-1260) ── */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1200 1080 L 1200 640 L 1215 640 L 1215 560 L 1225 520 L 1235 560 L 1245 560 L 1245 640 L 1260 640 L 1260 1080 Z" className={styles.bldBgNarrowDecoGap3b} />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1200" y1="640" x2="1260" y2="640" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1200" y1="643" x2="1260" y2="643" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1215" y1="560" x2="1245" y2="560" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1215" y1="563" x2="1245" y2="563" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1225" y1="520" x2="1225" y2="560" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1220" y1="640" x2="1220" y2="1080" strokeDasharray="2 8" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1240" y1="640" x2="1240" y2="1080" strokeDasharray="2 8" />
          {/* Facade Ribs */}
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1215" y1="560" x2="1215" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1225" y1="560" x2="1225" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1235" y1="560" x2="1235" y2="1080" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1245" y1="560" x2="1245" y2="1080" />

          {/* ── NEW: Background Block Tower (Gap 1b: x=530-595) ── */}
          <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 530 1080 L 530 650 L 595 650 L 595 1080 Z" className={styles.bldBgBlockGap1b} />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="530" y1="650" x2="595" y2="650" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="530" y1="653" x2="595" y2="653" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="550" y1="650" x2="550" y2="1080" strokeDasharray="3 6" />
          <WobblyLine wobble={wobble} wobbleStrength={strength} x1="575" y1="650" x2="575" y2="1080" strokeDasharray="3 6" />

          {/* Distant Inhabited Window Grids (office lights) */}
          <g fill="none">
            {/* Empire State windows - Glowing */}
            <g className={styles.glowingWindowPink} strokeWidth="1.0" strokeDasharray="2.5 8">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="942" y1="610" x2="942" y2="830" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="966" y1="610" x2="966" y2="830" strokeDashoffset="4" />
            </g>
            {/* Empire State windows - Dim */}
            <g className={styles.glowingWindowDim} strokeWidth="1.0" strokeDasharray="2.5 8">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="948" y1="610" x2="948" y2="830" strokeDashoffset="2" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="972" y1="610" x2="972" y2="830" strokeDashoffset="6" />
            </g>

            {/* Chrysler windows - Glowing */}
            <g className={styles.glowingWindowCyan} strokeWidth="1.0" strokeDasharray="2 7">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="474" y1="670" x2="474" y2="1000" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="514" y1="670" x2="514" y2="1000" strokeDashoffset="3" />
            </g>
            {/* Chrysler windows - Dim */}
            <g className={styles.glowingWindowDim} strokeWidth="1.0" strokeDasharray="2 7">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="482" y1="670" x2="482" y2="1000" strokeDashoffset="5" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="522" y1="670" x2="522" y2="1000" strokeDashoffset="1" />
            </g>

            {/* Stepped Needle Tower windows */}
            <g className={styles.glowingWindowPink} strokeWidth="0.8" strokeDasharray="3 9">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="242" y1="720" x2="242" y2="1000" />
            </g>
            <g className={styles.glowingWindowDim} strokeWidth="0.8" strokeDasharray="3 9">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="262" y1="720" x2="262" y2="1000" strokeDashoffset="4" />
            </g>

            {/* Background Block Tower windows */}
            <g className={styles.glowingWindowCyan} strokeWidth="0.8" strokeDasharray="3 9">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="550" y1="660" x2="550" y2="1000" />
            </g>
            <g className={styles.glowingWindowDim} strokeWidth="0.8" strokeDasharray="3 9">
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="575" y1="660" x2="575" y2="1000" strokeDashoffset="4" />
            </g>

            {/* Shadow overlay paths for wobbly hatching depth */}
            {/* Left Ziggurat & Mid-Century Tower shadows */}
            <WobblyPath wobble={wobble} wobbleStrength={strength} d="M -290 1080 L -290 700 L -270 700 L -270 760 L -250 760 L -250 800 L -230 800 L -230 820 L -230 1080 Z" className={styles.shadowHatchBg} fill="url(#hatch-bg)" stroke="none" />
            <WobblyPath wobble={wobble} wobbleStrength={strength} d="M -85 1080 L -85 740 L -70 740 L -70 780 L -50 780 L -50 1080 Z" className={styles.shadowHatchBg} fill="url(#hatch-bg)" stroke="none" />

            <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 498 1080 L 498 340 L 508 500 L 518 535 L 518 590 L 528 590 L 528 640 L 538 640 L 546 670 L 546 1080 Z" className={styles.shadowHatchBg} />
            <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 957 1080 L 957 320 L 960 320 L 960 460 L 968 460 L 968 610 L 976 610 L 976 750 L 986 750 L 986 830 L 994 830 L 994 1080 Z" className={styles.shadowHatchBg} />
            <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 252 1080 L 252 350 L 254 350 L 254 450 L 258 450 L 258 540 L 264 540 L 264 650 L 274 650 L 274 720 L 284 720 L 284 1080 Z" className={styles.shadowHatchBg} />
            <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 760 1080 L 760 590 L 780 590 L 780 1080 Z" className={styles.shadowHatchBg} />
            {/* Twin tower slots shading */}
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="758.5" y="590" width="3" height="490" className={styles.shadowHatchBg} fill="url(#hatch-bg)" stroke="none" />
            <WobblyRect wobble={wobble} wobbleStrength={strength} x="818.5" y="550" width="3" height="530" className={styles.shadowHatchBg} fill="url(#hatch-bg)" stroke="none" />
            <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 820 1080 L 820 550 L 840 550 L 840 1080 Z" className={styles.shadowHatchBg} />
            <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1370 1080 L 1370 620 L 1420 620 L 1420 1080 Z" className={styles.shadowHatchBg} />
            <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1770 1080 L 1770 580 L 1790 580 L 1790 680 L 1805 680 L 1805 740 L 1820 740 L 1820 1080 Z" className={styles.shadowHatchBg} />
            <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 170 1080 L 170 620 L 195 620 L 195 660 L 200 660 L 200 1080 Z" className={styles.shadowHatchBg} />
            <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1095 1080 L 1095 530 L 1100 530 L 1110 530 L 1110 600 L 1140 600 L 1140 1080 Z" className={styles.shadowHatchBg} />
            <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1230 1080 L 1230 520 L 1235 560 L 1245 560 L 1245 640 L 1260 640 L 1260 1080 Z" className={styles.shadowHatchBg} />
            <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 562.5 1080 L 562.5 650 L 595 650 L 595 1080 Z" className={styles.shadowHatchBg} />
          </g>
        </g>
      </svg>

      {/* Animated Layer (Unfiltered) */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* Asynchronous Flickering Window Cells (Layer 1 - Unfiltered for performance) */}
        <g strokeWidth="1.0" fill="none">
          {/* Empire State */}
          <line x1="950" y1="650" x2="950" y2="653" className={styles.windowFlicker1} />
          <line x1="950" y1="710" x2="950" y2="713" className={styles.windowFlicker3} />
          <line x1="966" y1="550" x2="966" y2="553" className={styles.windowFlicker2} />
          <line x1="966" y1="780" x2="966" y2="783" className={styles.windowFlicker4} />
          
          {/* Chrysler */}
          <line x1="488" y1="600" x2="488" y2="603" className={styles.windowFlicker2} />
          <line x1="508" y1="560" x2="508" y2="563" className={styles.windowFlicker4} />

          {/* Flat top tower */}
          <line x1="1360" y1="680" x2="1360" y2="683" className={styles.windowFlicker1} />
          <line x1="1380" y1="750" x2="1380" y2="753" className={styles.windowFlicker3} />
          <line x1="1340" y1="820" x2="1340" y2="823" className={styles.windowFlicker2} />
          <line x1="1400" y1="710" x2="1400" y2="713" className={styles.windowFlicker4} />

          {/* Stepped block tower */}
          <line x1="1760" y1="630" x2="1760" y2="633" className={styles.windowFlicker1} />
          <line x1="1780" y1="700" x2="1780" y2="703" className={styles.windowFlicker3} />

          {/* NEW: Art Deco tower */}
          <line x1="170" y1="680" x2="170" y2="683" className={styles.windowFlicker2} />

          {/* NEW: Twin towers */}
          <line x1="755" y1="650" x2="755" y2="653" className={styles.windowFlicker1} />
          <line x1="825" y1="610" x2="825" y2="613" className={styles.windowFlicker4} />

          {/* NEW: Setback office */}
          <line x1="1080" y1="640" x2="1080" y2="643" className={styles.windowFlicker3} />
          <line x1="1120" y1="700" x2="1120" y2="703" className={styles.windowFlicker1} />

          {/* NEW: Narrow Deco tower */}
          <line x1="1220" y1="680" x2="1220" y2="683" className={styles.windowFlicker2} />

          {/* NEW: Background Block tower */}
          <line x1="550" y1="680" x2="550" y2="683" className={styles.windowFlicker3} />
        </g>

        {/* Aviation Warning Beacons (Red flashing lights on spire tips) */}
        <g stroke="none">
          <circle cx="957" cy="240" r="2.5" className={styles.beaconRed1} fill="#ff3b30" stroke="none" />
          <circle cx="498" cy="340" r="2.5" className={styles.beaconRed2} fill="#ff3b30" stroke="none" />
          <circle cx="820" cy="480" r="2.0" className={styles.beaconRed3} fill="#ff3b30" stroke="none" />
          <circle cx="252" cy="280" r="2.0" className={styles.beaconRed1} fill="#ff3b30" stroke="none" />
          <circle cx="650" cy="400" r="2.0" className={styles.beaconRed2} fill="#ff3b30" stroke="none" />
          <circle cx="1225" cy="520" r="2.0" className={styles.beaconRed3} fill="#ff3b30" stroke="none" />
        </g>
      </svg>
    </>
  );
});

Layer1.displayName = 'Layer1';

export default Layer1;
