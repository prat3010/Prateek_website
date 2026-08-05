import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import type { PDFThemeConfig } from './pdfTheme';
import { PdfGremlinLogo } from './PdfGremlinLogo';

/**
 * Shared brand header for commercial PDFs.
 * Mirrors the hero "PRATEEQ" treatment: brand font with wide tracking and a
 * slight rotation on the dark banner, closed by the gremlin logo mark.
 */
interface PdfBrandHeaderProps {
  theme: PDFThemeConfig;
  title: string;
  subtitle: string;
}

export function PdfBrandHeader({ theme, title, subtitle }: PdfBrandHeaderProps) {
  const styles = StyleSheet.create({
    banner: {
      height: 52,
      backgroundColor: theme.headerBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 4,
      marginBottom: 12,
      paddingHorizontal: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    brand: {
      transform: 'rotate(-1.5deg)',
    },
    brandTitle: {
      fontSize: 14,
      fontFamily: theme.headlineBoldFont,
      color: theme.headerTitle,
      letterSpacing: 0.06,
      textTransform: 'uppercase',
    },
    brandAccent: {
      width: 30,
      height: 2,
      backgroundColor: theme.accentColor,
      borderRadius: 1,
      marginTop: 3,
    },
    brandSub: {
      fontSize: 6.5,
      fontFamily: theme.labelFont,
      color: theme.headerSub,
      marginTop: 4,
      letterSpacing: 0.08,
      textTransform: 'uppercase',
    },
  });

  return (
    <View style={styles.banner}>
      <View style={styles.brand}>
        <Text style={styles.brandTitle}>{title}</Text>
        <View style={styles.brandAccent} />
        <Text style={styles.brandSub}>{subtitle}</Text>
      </View>
      <PdfGremlinLogo theme={theme} size={34} />
    </View>
  );
}
