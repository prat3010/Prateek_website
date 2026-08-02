import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import path from 'path';

const styles = StyleSheet.create({
  container: {
    height: 85,
    borderRadius: 4,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  skylineImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.9,
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  overlayBrandCard: {
    position: 'absolute',
    top: 10,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
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

interface SkylineImageHeaderProps {
  title?: string;
  sub?: string;
  theme?: 'azure' | 'noir';
}

export function SkylineImageHeader({
  title = 'PRATEEQ.IN',
  sub = 'FULL-STACK & AI ARCHITECTURE // SCOPING & QUOTATION',
  theme = 'noir'
}: SkylineImageHeaderProps) {
  const isAzure = theme === 'azure';

  // Absolute path for local node / dev environment image loading
  const imagePath = typeof process !== 'undefined' && process.cwd
    ? path.join(process.cwd(), 'public/images/pdf-header-skyline.png')
    : '/images/pdf-header-skyline.png';

  return (
    <View style={[styles.container, { backgroundColor: isAzure ? '#F7F2E8' : '#0F172A' }]}>
      {/* EXACT HAND-DRAWN SKYLINE ARTWORK IMAGE */}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={imagePath} style={styles.skylineImage} />

      {/* CONTRAST OVERLAY FOR HIGH READABILITY */}
      <View style={styles.darkOverlay} />

      {/* OVERLAY BRAND CARD */}
      <View style={[styles.overlayBrandCard, { backgroundColor: isAzure ? '#FFFFFF' : 'rgba(15, 23, 42, 0.92)' }]}>
        <Text style={[styles.brandTitle, { color: isAzure ? '#0F172A' : '#FFFFFF' }]}>{title}</Text>
        <Text style={[styles.brandSub, { color: isAzure ? '#0284C7' : '#38BDF8' }]}>{sub}</Text>
      </View>
    </View>
  );
}
