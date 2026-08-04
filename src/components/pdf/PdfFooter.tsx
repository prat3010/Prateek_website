import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import type { PDFThemeConfig } from './pdfTheme';
import { PdfGremlinLogo } from './PdfGremlinLogo';

/**
 * Shared fixed footer for commercial PDFs: left label, gremlin mark + page
 * numbers on the right.
 */
interface PdfFooterProps {
  theme: PDFThemeConfig;
  leftText: string;
}

export function PdfFooter({ theme, leftText }: PdfFooterProps) {
  const styles = StyleSheet.create({
    footer: {
      position: 'absolute',
      bottom: 14,
      left: 28,
      right: 28,
      borderTopWidth: 1,
      borderTopColor: theme.footerRule,
      paddingTop: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerText: {
      fontSize: 6.5,
      fontFamily: theme.labelFont,
      letterSpacing: 0.05,
      color: theme.footerText,
    },
    footerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{leftText}</Text>
      <View style={styles.footerRight}>
        <PdfGremlinLogo theme={theme} size={10} />
        <Text
          style={[styles.footerText, { marginLeft: 5 }]}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages} | https://prateeq.in`
          }
        />
      </View>
    </View>
  );
}
