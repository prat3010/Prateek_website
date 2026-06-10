'use client';

import React from 'react';
import styles from '../NoirSkyline.module.css';
import { WobblyPath, WobblyLine, WobblyRect, WobblyPolygon } from '../WobblySVG';
import { LayerProps } from './types';

const BridgeLayer = React.memo(function BridgeLayer({ reducedMotion }: LayerProps) {
  const wobble = !reducedMotion;
  const strength = 3.5;

  // Main Cable Y equation
  const getCableY = (x: number) => {
    if (x < 880) {
      // Left cable: M 880 730 Q 670 820 400 860
      const t = (-7 + Math.sqrt(49 + (880 - x) / 15)) / 2;
      return (1 - t) * (1 - t) * 730 + 2 * (1 - t) * t * 820 + t * t * 860;
    } else {
      // Right cable: M 880 730 Q 1150 820 1480 860
      const t = (-9 + Math.sqrt(81 + (x - 880) / 15)) / 2;
      return (1 - t) * (1 - t) * 730 + 2 * (1 - t) * t * 820 + t * t * 860;
    }
  };

  // Roadway Deck Y equation
  // M 400 854 Q 880 820 1480 854
  const getDeckY = (x: number) => {
    const u = (-8 + Math.sqrt(64 + (x - 400) / 30)) / 2;
    return (1 - u) * (1 - u) * 854 + 2 * (1 - u) * u * 820 + u * u * 854;
  };

  // Generate dynamic suspender lines
  const suspenders = React.useMemo(() => {
    const lines: React.ReactNode[] = [];
    // Left side suspenders (from x=415 to x=835 at 15px intervals)
    for (let x = 415; x <= 835; x += 15) {
      const y1 = getCableY(x);
      const y2 = getDeckY(x);
      lines.push(
        <WobblyLine
          key={`susp-l-${x}`}
          wobble={wobble}
          wobbleStrength={strength}
          x1={x}
          y1={y1}
          x2={x}
          y2={y2}
          stroke="var(--skyline-stroke-fine)"
          strokeWidth="0.7"
          fill="none"
        />
      );
    }
    // Right side suspenders (from x=925 to x=1465 at 15px intervals)
    for (let x = 925; x <= 1465; x += 15) {
      const y1 = getCableY(x);
      const y2 = getDeckY(x);
      lines.push(
        <WobblyLine
          key={`susp-r-${x}`}
          wobble={wobble}
          wobbleStrength={strength}
          x1={x}
          y1={y1}
          x2={x}
          y2={y2}
          stroke="var(--skyline-stroke-fine)"
          strokeWidth="0.7"
          fill="none"
        />
      );
    }
    return lines;
  }, [wobble, strength]);

  // Generate handrail stanchions
  const stanchions = React.useMemo(() => {
    const posts: React.ReactNode[] = [];
    for (let x = 405; x <= 1475; x += 15) {
      if (x >= 845 && x <= 915) continue; // Skip the tower area
      const y = getDeckY(x);
      posts.push(
        <WobblyLine
          key={`stanchion-${x}`}
          wobble={wobble}
          wobbleStrength={strength}
          x1={x}
          y1={y}
          x2={x}
          y2={y - 4.5}
          stroke="var(--skyline-stroke-mid)"
          strokeWidth="0.6"
          fill="none"
        />
      );
    }
    return posts;
  }, [wobble, strength]);

  // Streetlight glow cones
  const streetlightCones = React.useMemo(() => {
    const streetlights = [
      { cx: 546, cy: 830.3 },
      { cx: 646, cy: 825.7 },
      { cx: 746, cy: 822.7 },
      { cx: 846, cy: 821.2 },
      { cx: 954, cy: 821.1 },
      { cx: 1054, cy: 822.2 },
      { cx: 1154, cy: 824.5 },
      { cx: 1254, cy: 827.9 },
      { cx: 1354, cy: 832.3 }
    ];
    return streetlights.map((light, idx) => {
      const roadY = getDeckY(light.cx);
      const points = `${light.cx},${light.cy} ${light.cx - 9},${roadY} ${light.cx + 9},${roadY}`;
      return (
        <WobblyPolygon
          key={`light-cone-${idx}`}
          wobble={wobble}
          wobbleStrength={1.5}
          points={points}
          fill="var(--skyline-light-ray)"
          stroke="none"
        />
      );
    });
  }, [wobble]);

  return (
    <>
      {/* Static Layer */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0 }}>
            <g className={styles.buildingGroup} stroke="var(--skyline-stroke-fg)" strokeWidth="1.8">
              {/* MIDDLE BRIDGE STRUCTURE (Fills the gap between rooftops) */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 850 1250 L 850 780 L 870 730 L 890 730 L 910 780 L 910 1250 Z" className={styles.bldFgBridgeTower} />

              {/* Steel Plate Joint Seams on Tower Legs */}
              <WobblyPath 
                wobble={wobble}
                wobbleStrength={strength}
                d="M 850 750 L 870 750 M 890 750 L 910 750 M 850 780 L 870 780 M 890 780 L 910 780 M 850 810 L 870 810 M 890 810 L 910 810 M 850 840 L 870 840 M 890 840 L 910 840 M 850 870 L 870 870 M 890 870 L 910 870 M 850 900 L 870 900 M 890 900 L 910 900 M 850 930 L 870 930 M 890 930 L 910 930 M 860 730 L 860 935 M 900 730 L 900 935" 
                stroke="var(--skyline-stroke-fine)" 
                strokeWidth="0.8" 
                fill="none" 
              />

              {/* Bridge Tower Structural Steel Trusses */}
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.9" fill="none">
                {/* Inner legs vertical lines */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="730" x2="870" y2="780" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="730" x2="890" y2="780" />
                
                {/* Upper Center Trusses (above deck) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="730" x2="890" y2="760" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="730" x2="870" y2="760" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="760" x2="890" y2="760" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="760" x2="890" y2="790" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="760" x2="870" y2="790" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="850" y1="790" x2="910" y2="790" strokeWidth="1.2" />

                {/* Left Leg Upper Diagonals */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="850" y1="790" x2="870" y2="850" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="790" x2="850" y2="850" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="850" y1="850" x2="870" y2="850" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="850" y1="850" x2="870" y2="910" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="850" x2="850" y2="910" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="850" y1="910" x2="870" y2="910" />

                {/* Right Leg Upper Diagonals */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="790" x2="910" y2="850" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="910" y1="790" x2="890" y2="850" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="850" x2="910" y2="850" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="850" x2="910" y2="910" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="910" y1="850" x2="890" y2="910" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="910" x2="910" y2="910" />

                {/* Lower Inner columns extending below deck */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="850" x2="870" y2="935" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="850" x2="890" y2="935" />

                {/* Lower Center Trusses (below deck, x=870-890) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="850" x2="890" y2="880" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="850" x2="870" y2="880" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="880" x2="890" y2="880" />
                
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="880" x2="890" y2="910" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="880" x2="870" y2="910" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="910" x2="890" y2="910" strokeWidth="1.2" />

                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="910" x2="890" y2="935" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="910" x2="870" y2="935" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="935" x2="890" y2="935" strokeWidth="1.4" />

                {/* Left Leg Lower Diagonals (x=850-870, y=910-935) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="850" y1="910" x2="870" y2="935" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="910" x2="850" y2="935" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="850" y1="935" x2="870" y2="935" strokeWidth="1.2" />

                {/* Right Leg Lower Diagonals (x=890-910, y=910-935) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="910" x2="910" y2="935" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="910" y1="910" x2="890" y2="935" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="935" x2="910" y2="935" strokeWidth="1.2" />
              </g>

              {/* Decorative Art Deco Tower Crown Plates */}
              <g stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" fill="var(--skyline-fill-bg)">
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="864,730 896,730 896,726 864,726" />
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="871,726 889,726 889,720 871,720" />
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="877,720 883,720 880,712" />
              </g>

              {/* Tower Spire Mast and Guy-wires */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="880" y1="712" x2="880" y2="670" stroke="var(--skyline-stroke-fg)" strokeWidth="1.5" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="880" y1="670" x2="864" y2="726" stroke="var(--skyline-stroke-fine)" strokeWidth="0.8" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="880" y1="670" x2="896" y2="726" stroke="var(--skyline-stroke-fine)" strokeWidth="0.8" />

              {/* Detailed double gothic arches */}
              <g fill="none">
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 865 840 A 12 25 0 0 1 895 840" stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 868 840 A 9 20 0 0 1 892 840" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 865 910 A 12 25 0 0 1 895 910" stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 868 910 A 9 20 0 0 1 892 910" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
              </g>

              {/* Concrete Pier / Caisson Base at the Waterline */}
              <g className={styles.bldFgBridgePier} stroke="var(--skyline-stroke-fg)" strokeWidth="1.5">
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="842" y="935" width="76" height="15" rx="2" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="832" y="950" width="96" height="18" rx="3" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="838" y="968" width="84" height="282" />
              </g>

              {/* Art Deco Recessed Panel Grooves on concrete base */}
              <g stroke="var(--skyline-stroke-fine)" strokeWidth="1.0" fill="none">
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="860" y1="968" x2="860" y2="1250" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="880" y1="968" x2="880" y2="1250" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="900" y1="968" x2="900" y2="1250" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="838" y1="990" x2="922" y2="990" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="838" y1="1025" x2="922" y2="1025" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="838" y1="1060" x2="922" y2="1060" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="838" y1="1095" x2="922" y2="1095" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="838" y1="1130" x2="922" y2="1130" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="838" y1="1165" x2="922" y2="1165" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="838" y1="1200" x2="922" y2="1200" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="838" y1="1235" x2="922" y2="1235" />
              </g>

              {/* Protective Harbor Dolphin Piles */}
              <g className={styles.bldFgDolphinPiles} stroke="var(--skyline-stroke-mid)" strokeWidth="1">
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="783" y="934" width="4.5" height="50" rx="1.2" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="791" y="930" width="4.5" height="54" rx="1.2" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="787" y="926" width="4.5" height="58" rx="1.2" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 783 942 L 795.5 942 M 783 944 L 795.5 944 M 783 955 L 795.5 955 M 783 957 L 795.5 957" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" fill="none" />
              </g>
              <g className={styles.bldFgDolphinPiles} stroke="var(--skyline-stroke-mid)" strokeWidth="1">
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="972" y="934" width="4.5" height="50" rx="1.2" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="964" y="930" width="4.5" height="54" rx="1.2" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="968" y="926" width="4.5" height="58" rx="1.2" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 964 942 L 976.5 942 M 964 944 L 976.5 944 M 964 955 L 976.5 955 M 964 957 L 976.5 957" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" fill="none" />
              </g>

              {/* Stylized water reflection ripples */}
              <g stroke="var(--skyline-stroke-fine)" strokeWidth="0.8" fill="none">
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="810" y1="974" x2="950" y2="974" strokeDasharray="6 4" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="825" y1="984" x2="935" y2="984" strokeDasharray="5 5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="840" y1="994" x2="920" y2="994" strokeDasharray="4 6" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="855" y1="1004" x2="905" y2="1004" strokeDasharray="3 7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="865" y1="1014" x2="895" y2="1014" strokeDasharray="2 8" />
              </g>

              {/* Streetlight Glow Cones */}
              {streetlightCones}

              {/* Bridge Cables (Extended ends from 460/1420 to 400/1480) */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 880 730 Q 670 820 400 860" fill="none" strokeWidth="2.2" stroke="var(--skyline-stroke-fg)" />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 880 730 Q 1150 820 1480 860" fill="none" strokeWidth="2.2" stroke="var(--skyline-stroke-fg)" />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 880 726 Q 670 816 400 856" fill="none" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 880 726 Q 1150 816 1480 856" fill="none" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />

              {/* Cable clamps */}
              <g fill="var(--skyline-stroke-fg)" stroke="none">
                <circle cx="500" cy="843.7" r="1.3" />
                <circle cx="530" cy="838.3" r="1.3" />
                <circle cx="560" cy="832.3" r="1.3" />
                <circle cx="590" cy="825.7" r="1.3" />
                <circle cx="620" cy="818.4" r="1.3" />
                <circle cx="650" cy="810.6" r="1.3" />
                <circle cx="680" cy="802.1" r="1.3" />
                <circle cx="710" cy="793.0" r="1.3" />
                <circle cx="740" cy="783.3" r="1.3" />
                <circle cx="770" cy="773.0" r="1.3" />
                <circle cx="800" cy="762.1" r="1.3" />
                <circle cx="830" cy="750.6" r="1.3" />
                <circle cx="930" cy="746.2" r="1.3" />
                <circle cx="960" cy="755.3" r="1.3" />
                <circle cx="990" cy="764.2" r="1.3" />
                <circle cx="1020" cy="772.6" r="1.3" />
                <circle cx="1050" cy="780.7" r="1.3" />
                <circle cx="1080" cy="788.4" r="1.3" />
                <circle cx="1110" cy="795.8" r="1.3" />
                <circle cx="1140" cy="802.8" r="1.3" />
                <circle cx="1170" cy="809.4" r="1.3" />
                <circle cx="1200" cy="815.6" r="1.3" />
                <circle cx="1230" cy="821.5" r="1.3" />
                <circle cx="1260" cy="827.0" r="1.3" />
              </g>

              {/* Vertical Suspender Cables */}
              {suspenders}

              {/* Bridge Roadway Deck (Warren Truss/Steel Girder Structure, Extended) */}
              <g stroke="var(--skyline-stroke-fg)" fill="none">
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 400 854 Q 880 820 1480 854" strokeWidth="1.5" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 400 860 Q 880 826 1480 860" strokeWidth="1.5" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 420 852 L 420 858 M 440 850 L 440 856 M 460 849 L 460 855 M 480 848 L 480 854 M 500 847 L 500 853 M 520 845 L 520 851 M 540 843 L 540 849 M 560 841 L 560 847 M 580 839 L 580 845 M 600 837 L 600 843 M 620 835 L 620 841 M 640 833 L 640 839 M 660 831 L 660 837 M 680 830 L 680 836 M 700 828 L 700 834 M 720 827 L 720 833 M 740 825 L 740 831 M 760 824 L 760 830 M 780 823 L 780 829 M 800 822 L 800 828 M 820 821 L 820 827 M 840 820 L 840 826 M 920 820 L 920 826 M 940 821 L 940 827 M 960 822 L 960 828 M 980 823 L 980 829 M 1000 824 L 1000 830 M 1020 825 L 1020 831 M 1040 827 L 1040 833 M 1060 828 L 1060 834 M 1080 830 L 1080 836 M 1100 831 L 1100 837 M 1120 833 L 1120 839 M 1140 835 L 1140 841 M 1160 837 L 1160 843 M 1180 839 L 1180 845 M 1200 841 L 1200 847 M 1220 843 L 1220 849 M 1240 845 L 1240 851 M 1260 847 L 1260 853 M 1280 848 L 1280 854 M 1300 850 L 1300 856 M 1320 850 L 1320 856 M 1340 858.2 L 1360 854.0 M 1360 854.0 L 1380 858.5 L 1400 851.2 L 1420 856.0 L 1440 848.9 L 1460 853.9 L 1480 848.9" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 400 854.0 L 420 858.2 L 440 850.5 L 460 854.9 L 480 848.1 L 500 852.3 L 520 845.2 L 540 849.5 L 560 842.1 L 580 846.5 L 600 839.2 L 620 843.8 L 640 836.4 L 660 841.1 L 680 833.9 L 700 838.4 L 720 831.2 L 740 836.0 L 760 828.5 L 780 833.1 L 800 825.8 L 820 830.4 L 840 823.1 L 860 827.8" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 900 827.8 L 920 823.1 L 940 830.4 L 960 825.8 L 980 833.1 L 1000 828.5 L 1020 836.0 L 1040 831.2 L 1060 838.4 L 1080 833.9 L 1100 841.1 L 1120 836.4 L 1140 843.8 L 1160 839.2 L 1180 846.5 L 1200 842.1 L 1220 849.5 L 1240 845.2 L 1260 852.3 L 1280 848.1 L 1300 854.9 L 1320 850.5 L 1340 858.2 L 1360 854.0 M 1360 854.0 L 1380 858.5 L 1400 851.2 L 1420 856.0 L 1440 848.9 L 1460 853.9 L 1480 848.9" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
              </g>

              {/* Pedestrian Handrail & Stanchions */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 400 850 Q 880 816 1480 850" fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
              {stanchions}

              {/* Roadway traffic light trails (Static lines, Extended) */}
              <g stroke="none">
                <path d="M 400 856 Q 880 822 1480 856" fill="none" stroke="var(--skyline-traffic-headlight-trail)" strokeWidth="0.8" />
                <path d="M 1480 858 Q 880 824 400 858" fill="none" stroke="var(--skyline-traffic-taillight-trail)" strokeWidth="0.8" />
              </g>

              {/* River waterline (Extended from 460/1420 to 400/1480) */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="400" y1="950" x2="1480" y2="950" stroke="var(--skyline-stroke-fine)" strokeWidth="1" strokeDasharray="8 6" />

              {/* Stylized River Waves/Ripples */}
              <g stroke="var(--skyline-stroke-fine)" strokeWidth="0.8" fill="none">
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 500 960 Q 515 958 530 960 M 570 962 Q 585 960 600 962 M 700 958 Q 715 956 730 958 M 1100 960 Q 1115 958 1130 960 M 1250 962 Q 1265 960 1280 962" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 470 980 Q 490 977 510 980 M 620 978 Q 640 975 660 978 M 760 982 Q 780 979 800 982 M 1180 978 Q 1200 975 1220 978 M 1330 982 Q 1350 979 1370 982" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 530 1005 Q 555 1002 580 1005 M 690 1008 Q 715 1005 740 1008 M 1060 1005 Q 1085 1002 1110 1005 M 1210 1008 Q 1235 1005 1260 1008" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 480 1035 Q 510 1031 540 1035 M 710 1038 Q 740 1034 770 1038 M 980 1035 Q 1010 1031 1040 1035 M 1280 1038 Q 1310 1034 1340 1038" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 580 1065 Q 615 1061 650 1065 M 1080 1065 Q 1115 1061 1150 1065 M 1200 1068 Q 1235 1064 1270 1068" />
              </g>

              {/* Curved Streetlight Poles & Arms */}
              <WobblyPath 
                wobble={wobble}
                wobbleStrength={strength}
                d="M 550 844.3 L 550 832.3 Q 550 830.3 546 830.3 M 650 839.7 L 650 827.7 Q 650 825.7 646 825.7 M 750 836.7 L 750 824.7 Q 750 822.7 746 822.7 M 850 835.2 L 850 823.2 Q 850 821.2 846 821.2 M 950 835.1 L 950 823.1 Q 950 821.1 954 821.1 M 1050 836.2 L 1050 824.2 Q 1050 822.2 1054 822.2 M 1150 838.5 L 1150 826.5 Q 1150 824.5 1154 824.5 M 1250 841.9 L 1250 829.9 Q 1250 827.9 1254 827.9 M 1350 846.3 L 1350 834.3 Q 1350 832.3 1354 832.3"
                stroke="var(--skyline-stroke-mid)"
                strokeWidth="0.8"
                fill="none"
              />

              {/* Hanging Power Lines / Catenary wires (Extended to 400/1480) */}
              <g stroke="var(--skyline-stroke-fine)" strokeWidth="0.8" fill="none">
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 400 820 Q 625 900 850 780" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 400 835 Q 625 915 850 795" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 910 780 Q 1195 915 1480 760" />
              </g>

              {/* Bridge Shadow overlay paths */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 890 730 L 910 780 L 910 1250 L 890 1250 Z" className={styles.shadowHatchFg} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 880 935 L 918 935 L 918 950 L 928 950 L 928 968 L 922 968 L 922 1250 L 880 1250 Z" className={styles.shadowHatchFg} />
            </g>
      </svg>

      {/* Animated Layer (Unfiltered) */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <g fill="var(--skyline-fill-bg)" stroke="var(--skyline-stroke-fg)" strokeWidth="1.8" className={styles.buildingGroup}>
              {/* Warning Beacon at Tower Peak */}
              <circle cx="880" cy="670" r="2.2" className={styles.bridgeBeacon} />

              {/* Bridge Streetlights */}
              <g fill="var(--skyline-bulb-glow)" stroke="none">
                <circle cx="546" cy="830.3" r="1.8" opacity="0.85" />
                <circle cx="646" cy="825.7" r="1.8" opacity="0.85" />
                <circle cx="746" cy="822.7" r="1.8" opacity="0.85" />
                <circle cx="846" cy="821.2" r="1.8" opacity="0.85" />
                <circle cx="954" cy="821.1" r="1.8" opacity="0.85" />
                <circle cx="1054" cy="822.2" r="1.8" opacity="0.85" />
                <circle cx="1154" cy="824.5" r="1.8" opacity="0.85" />
                <circle cx="1254" cy="827.9" r="1.8" opacity="0.85" />
                <circle cx="1354" cy="832.3" r="1.8" opacity="0.85" />
              </g>

              {/* Animated Bridge Traffic Dots (Staggered Outbound Headlights and Inbound Taillights, Extended paths) */}
              <g fill="rgba(250, 250, 250, 0.85)" stroke="none">
                {/* Outbound Headlights (Left to Right, bright white) */}
                <circle cx={reducedMotion ? 588 : 0} cy={reducedMotion ? 841.6 : 0} r="0.9" className={styles.trafficHeadlight}>
                  {!reducedMotion && (
                    <animateMotion dur="14s" repeatCount="indefinite" path="M 400 852 Q 880 822 1480 852" begin="0s" />
                  )}
                </circle>
                <circle cx={reducedMotion ? 1168 : 0} cy={reducedMotion ? 837.6 : 0} r="0.9" className={styles.trafficHeadlight}>
                  {!reducedMotion && (
                    <animateMotion dur="14s" repeatCount="indefinite" path="M 400 852 Q 880 822 1480 852" begin="4.6s" />
                  )}
                </circle>
                <circle cx={reducedMotion ? 750 : 0} cy={reducedMotion ? 828.5 : 0} r="0.9" className={styles.trafficHeadlight}>
                  {!reducedMotion && (
                    <animateMotion dur="14s" repeatCount="indefinite" path="M 400 852 Q 880 822 1480 852" begin="9.2s" />
                  )}
                </circle>
                {/* Fast Car */}
                <circle cx={reducedMotion ? 500 : 0} cy={reducedMotion ? 845.5 : 0} r="0.8" className={styles.trafficHeadlight} opacity="0.8">
                  {!reducedMotion && (
                    <animateMotion dur="10s" repeatCount="indefinite" path="M 400 852 Q 880 822 1480 852" begin="2.5s" />
                  )}
                </circle>
                {/* Slow Car */}
                <circle cx={reducedMotion ? 1350 : 0} cy={reducedMotion ? 848.5 : 0} r="1.1" className={styles.trafficHeadlight}>
                  {!reducedMotion && (
                    <animateMotion dur="20s" repeatCount="indefinite" path="M 400 852 Q 880 822 1480 852" begin="6.8s" />
                  )}
                </circle>

                {/* Inbound Taillights (Right to Left, dim white/grey representing red in monochrome) */}
                <circle cx={reducedMotion ? 979 : 0} cy={reducedMotion ? 824.6 : 0} r="0.8" className={styles.trafficTaillight}>
                  {!reducedMotion && (
                    <animateMotion dur="16s" repeatCount="indefinite" path="M 1480 854 Q 880 824 400 854" begin="0s" />
                  )}
                </circle>
                <circle cx={reducedMotion ? 650 : 0} cy={reducedMotion ? 833.5 : 0} r="0.8" className={styles.trafficTaillight}>
                  {!reducedMotion && (
                    <animateMotion dur="16s" repeatCount="indefinite" path="M 1480 854 Q 880 824 400 854" begin="5.3s" />
                  )}
                </circle>
                <circle cx={reducedMotion ? 1250 : 0} cy={reducedMotion ? 840.5 : 0} r="0.8" className={styles.trafficTaillight}>
                  {!reducedMotion && (
                    <animateMotion dur="16s" repeatCount="indefinite" path="M 1480 854 Q 880 824 400 854" begin="10.6s" />
                  )}
                </circle>
                {/* Fast Car */}
                <circle cx={reducedMotion ? 1050 : 0} cy={reducedMotion ? 828.5 : 0} r="0.7" className={styles.trafficTaillight}>
                  {!reducedMotion && (
                    <animateMotion dur="12s" repeatCount="indefinite" path="M 1480 854 Q 880 824 400 854" begin="3.2s" />
                  )}
                </circle>
                {/* Slow Car */}
                <circle cx={reducedMotion ? 550 : 0} cy={reducedMotion ? 840.5 : 0} r="1.0" className={styles.trafficTaillight}>
                  {!reducedMotion && (
                    <animateMotion dur="22s" repeatCount="indefinite" path="M 1480 854 Q 880 824 400 854" begin="7.8s" />
                  )}
                </circle>
              </g>
            </g>
      </svg>
    </>
  );
});

BridgeLayer.displayName = 'BridgeLayer';

export default BridgeLayer;
