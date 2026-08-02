import React from 'react';
import { View, Text, Svg, Path, Line, Rect, G, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  container: {
    height: 76,
    borderRadius: 4,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  overlayBrandCard: {
    position: 'absolute',
    top: 10,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 4,
    padding: '6 10',
    zIndex: 10,
  },
  brandTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  brandSub: {
    fontSize: 7,
    color: '#38BDF8',
    marginTop: 2,
    letterSpacing: 0.5,
  },
});

interface SkylineVectorHeaderProps {
  title?: string;
  sub?: string;
  theme?: 'azure' | 'noir';
}

export function SkylineVectorHeader({
  title = 'PRATEEQ.IN',
  sub = 'FULL-STACK & AI ARCHITECTURE // SCOPING & QUOTATION',
  theme = 'noir'
}: SkylineVectorHeaderProps) {
  const isAzure = theme === 'azure';
  const bgColor = isAzure ? '#F7F2E8' : '#0F172A';
  const strokeColor = isAzure ? '#1E293B' : '#38BDF8';
  const fillColor = isAzure ? '#E2E8F0' : '#1E293B';
  const accentColor = '#0284C7';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* FULL VECTOR SVG SKYLINE */}
      <Svg viewBox="0 0 1200 240" style={{ width: '100%', height: '100%' }}>
        {/* Background Grids & Hatch Lines */}
        <G stroke={strokeColor} strokeWidth="0.5" opacity={0.3}>
          <Line x1="0" y1="200" x2="1200" y2="200" />
          <Line x1="0" y1="220" x2="1200" y2="220" />
        </G>

        {/* 1. DISTANT ZIGGURAT & SKYSCRAPERS */}
        <G stroke={strokeColor} strokeWidth="0.8" fill={fillColor} opacity={0.85}>
          {/* Left Distant Skyscraper Group */}
          <Path d="M 40 240 L 40 120 L 90 120 L 90 100 L 110 100 L 110 70 L 140 70 L 140 100 L 160 100 L 160 120 L 220 120 L 220 240 Z" />
          <Line x1="125" y1="70" x2="125" y2="35" stroke={accentColor} strokeWidth="1.2" />

          {/* Stepped Needle Tower */}
          <Path d="M 320 240 L 320 110 L 330 110 L 330 75 L 340 75 L 340 45 L 346 45 L 346 25 L 350 25 L 350 8 L 354 8 L 354 25 L 358 25 L 358 45 L 364 45 L 364 75 L 374 75 L 374 110 L 384 110 L 384 240 Z" fill={isAzure ? '#CBD5E1' : '#0F172A'} />
          <Line x1="352" y1="8" x2="352" y2="2" stroke={accentColor} strokeWidth="1.5" />

          {/* Mid-City Towers */}
          <Path d="M 450 240 L 450 90 L 520 90 L 520 60 L 560 60 L 560 90 L 610 90 L 610 240 Z" />
          <Rect x="525" y="70" width="10" height="12" fill={strokeColor} />

          {/* Right Skyline Block */}
          <Path d="M 750 240 L 750 85 L 820 85 L 820 50 L 860 50 L 860 85 L 940 85 L 940 240 Z" />
          <Line x1="840" y1="50" x2="840" y2="15" stroke={strokeColor} strokeWidth="1" />
          <Line x1="835" y1="15" x2="845" y2="15" stroke={strokeColor} strokeWidth="1" />
        </G>

        {/* 2. SKYSCRAPER WINDOW RIBS & DETAILS */}
        <G stroke={strokeColor} strokeWidth="0.5" strokeDasharray="2 4" opacity={0.6}>
          <Line x1="65" y1="120" x2="65" y2="240" />
          <Line x1="180" y1="120" x2="180" y2="240" />
          <Line x1="335" y1="110" x2="335" y2="240" />
          <Line x1="369" y1="110" x2="369" y2="240" />
          <Line x1="480" y1="90" x2="480" y2="240" />
          <Line x1="580" y1="90" x2="580" y2="240" />
          <Line x1="780" y1="85" x2="780" y2="240" />
          <Line x1="900" y1="85" x2="900" y2="240" />
        </G>

        {/* 3. AIRSHIP / BLIMP WITH SEARCHLIGHT */}
        <G stroke={accentColor} strokeWidth="1" fill="none">
          {/* Airship Body */}
          <Path d="M 580 30 C 620 15, 680 15, 710 30 C 680 45, 620 45, 580 30 Z" fill={isAzure ? '#93C5FD' : '#0284C7'} opacity={0.8} />
          {/* Tail Fins */}
          <Path d="M 575 25 L 565 18 L 585 28 Z" fill={accentColor} />
          <Path d="M 575 35 L 565 42 L 585 32 Z" fill={accentColor} />
          {/* Gondola */}
          <Rect x="635" y="42" width="20" height="5" fill={strokeColor} />
          {/* Searchlight Beam Cone */}
          <Path d="M 645 47 L 550 180 L 720 180 Z" fill={accentColor} opacity={0.12} />
        </G>

        {/* 4. SUSPENSION BRIDGE & CABLE TOWERS */}
        <G stroke={strokeColor} strokeWidth="1.2" fill="none">
          {/* Bridge Roadway Deck */}
          <Line x1="0" y1="190" x2="1200" y2="190" strokeWidth="2" />
          <Line x1="0" y1="196" x2="1200" y2="196" strokeWidth="0.8" />

          {/* Main Bridge Towers */}
          <G strokeWidth="1.5" fill={fillColor}>
            {/* Tower 1 */}
            <Path d="M 240 190 L 240 90 L 255 60 L 270 90 L 270 190 Z" />
            <Line x1="240" y1="120" x2="270" y2="120" />
            <Line x1="240" y1="150" x2="270" y2="150" />
            {/* Tower 2 */}
            <Path d="M 980 190 L 980 90 L 995 60 L 1010 90 L 1010 190 Z" />
            <Line x1="980" y1="120" x2="1010" y2="120" />
            <Line x1="980" y1="150" x2="1010" y2="150" />
          </G>

          {/* Suspension Main Cables */}
          <Path d="M 0 140 Q 120 175 255 60 Q 610 180 995 60 Q 1110 175 1200 140" stroke={accentColor} strokeWidth="1.5" />

          {/* Vertical Suspender Cables */}
          <G stroke={strokeColor} strokeWidth="0.5" opacity={0.7}>
            <Line x1="60" y1="155" x2="60" y2="190" />
            <Line x1="120" y1="168" x2="120" y2="190" />
            <Line x1="180" y1="140" x2="180" y2="190" />
            <Line x1="330" y1="110" x2="330" y2="190" />
            <Line x1="420" y1="145" x2="420" y2="190" />
            <Line x1="510" y1="165" x2="510" y2="190" />
            <Line x1="610" y1="172" x2="610" y2="190" />
            <Line x1="710" y1="165" x2="710" y2="190" />
            <Line x1="810" y1="145" x2="810" y2="190" />
            <Line x1="900" y1="110" x2="900" y2="190" />
            <Line x1="1050" y1="145" x2="1050" y2="190" />
            <Line x1="1120" y1="160" x2="1120" y2="190" />
          </G>
        </G>
      </Svg>

      {/* OVERLAY BRAND CARD */}
      <View style={[styles.overlayBrandCard, { backgroundColor: isAzure ? '#FFFFFF' : 'rgba(15, 23, 42, 0.92)' }]}>
        <Text style={[styles.brandTitle, { color: isAzure ? '#0F172A' : '#FFFFFF' }]}>{title}</Text>
        <Text style={[styles.brandSub, { color: isAzure ? '#0284C7' : '#38BDF8' }]}>{sub}</Text>
      </View>
    </View>
  );
}
