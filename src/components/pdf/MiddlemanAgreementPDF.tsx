import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData, MiddlemanAgreementConfig } from '@/data/resume';
import { getPdfTheme, scaleBodyFont, type PDFThemeConfig } from './pdfTheme';
import { PdfBrandHeader } from './PdfBrandHeader';
import { PdfFooter } from './PdfFooter';
import {
  COMMISSION_BANDS,
  COMMISSION_DISBURSEMENT_WINDOW,
  COMMISSION_EXAMPLE,
  RECURRING_COMMISSION_RATE,
  type CommissionBand,
} from '@/lib/commission';
import middlemanAgreementDefaults from '@/data/middlemanAgreementDefaults.json';

interface MiddlemanAgreementPDFProps {
  resumeData?: ResumeData | null;
  isNoir?: boolean;
}

interface MiddlemanSection {
  key: string;
  heading: string;
  lines: string[];
}

function fillTokens(text: string, tokens: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => tokens[key] ?? match);
}

function fmtINR(n: number): string {
  return `INR ${n.toLocaleString('en-IN')}`;
}

function fmtUSD(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

function bandRange(band: CommissionBand): string {
  if (band.minINR == null) return `Up to ${fmtINR(band.maxINR ?? 0)} / ${fmtUSD(band.maxUSD ?? 0)}`;
  if (band.maxINR == null) return `${fmtINR(band.minINR)}+ / ${fmtUSD(band.minUSD ?? 0)}+`;
  return `${fmtINR(band.minINR)}–${fmtINR(band.maxINR)} / ${fmtUSD(band.minUSD ?? 0)}–${fmtUSD(band.maxUSD ?? 0)}`;
}

function parsePct(value: string): number {
  return parseInt(value.replace('%', '').trim(), 10) || 0;
}

function cutFor(bandId: string): string | undefined {
  const band = COMMISSION_BANDS.find((b) => b.id === bandId);
  return band ? `${band.rate}%` : undefined;
}

function createStyles(theme: PDFThemeConfig) {
  return StyleSheet.create({
    page: {
      paddingTop: 24,
      paddingBottom: 32,
      paddingLeft: 28,
      paddingRight: 28,
      fontFamily: theme.bodyFont,
      backgroundColor: theme.pageBg,
      fontSize: scaleBodyFont(theme, 8.5),
      color: theme.textPrimary,
    },
    docHeader: {
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      paddingBottom: 5,
      marginBottom: 10,
    },
    docTitle: {
      fontSize: 11,
      fontFamily: theme.headlineBoldFont,
      color: theme.textPrimary,
      textTransform: 'uppercase',
      letterSpacing: 0.04,
    },
    docMeta: {
      fontSize: 7,
      fontFamily: theme.labelFont,
      color: theme.textSecondary,
      marginTop: 2,
      letterSpacing: 0.05,
    },
    metaCard: {
      backgroundColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 4,
      padding: 8,
      marginBottom: 12,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    metaCol: {
      width: '50%',
      marginBottom: 3,
    },
    metaLabel: {
      fontFamily: theme.labelBoldFont,
      color: theme.textSecondary,
      fontSize: 6.5,
      letterSpacing: 0.05,
    },
    metaVal: {
      fontSize: scaleBodyFont(theme, 8),
      color: theme.textPrimary,
    },
    sectionTitle: {
      fontFamily: theme.labelBoldFont,
      fontSize: scaleBodyFont(theme, 8),
      color: theme.chipText,
      backgroundColor: theme.chipBg,
      borderColor: theme.chipBorder,
      borderWidth: 1,
      padding: '3 6',
      borderRadius: 3,
      marginBottom: 8,
      marginTop: 8,
      borderLeftWidth: 3,
      borderLeftColor: theme.accentColor,
      letterSpacing: 0.05,
    },
    paragraph: {
      fontSize: scaleBodyFont(theme, 8),
      lineHeight: 1.5,
      color: theme.textSecondary,
      marginBottom: 8,
    },
    bulletRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    bulletDot: {
      width: 10,
      fontSize: scaleBodyFont(theme, 8),
      lineHeight: 1.5,
      color: theme.accentColor,
    },
    bulletText: {
      flex: 1,
      fontSize: scaleBodyFont(theme, 8),
      lineHeight: 1.5,
      color: theme.textSecondary,
    },
    table: {
      width: '100%',
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 12,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: theme.tableRowAlt,
      padding: '6 5',
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    tableCellBold: {
      fontFamily: theme.labelBoldFont,
      fontSize: scaleBodyFont(theme, 6.5),
      color: theme.textPrimary,
      letterSpacing: 0.04,
    },
    tableRow: {
      flexDirection: 'row',
      padding: '7 5',
      borderBottomWidth: 1,
      borderBottomColor: theme.tableRowAlt,
    },
    tableCell: {
      fontSize: scaleBodyFont(theme, 7.5),
      color: theme.textSecondary,
    },
    signatureSection: {
      marginTop: 10,
    },
    signatureGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    signatureBox: {
      width: '48%',
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 4,
      padding: 7,
      backgroundColor: theme.cardBg,
    },
    signatureTitle: {
      fontFamily: theme.labelBoldFont,
      fontSize: scaleBodyFont(theme, 6.5),
      color: theme.textSecondary,
      marginBottom: 10,
      letterSpacing: 0.05,
    },
    signatureLine: {
      fontSize: scaleBodyFont(theme, 7.5),
      color: theme.textPrimary,
      marginTop: 2,
    },
    agreedBox: {
      marginTop: 8,
      backgroundColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderLeftWidth: 3,
      borderLeftColor: theme.accentColor,
      borderWidth: 1,
      borderRadius: 4,
      padding: 8,
    },
    agreedTitle: {
      fontFamily: theme.labelBoldFont,
      fontSize: scaleBodyFont(theme, 7),
      color: theme.accentColor,
      marginBottom: 3,
      letterSpacing: 0.05,
    },
    agreedText: {
      fontSize: scaleBodyFont(theme, 7.5),
      lineHeight: 1.5,
      color: theme.textSecondary,
    },
  });
}

export function MiddlemanAgreementPDF({ resumeData, isNoir }: MiddlemanAgreementPDFProps) {
  const theme = getPdfTheme(!!isNoir);
  const styles = createStyles(theme);
  const mm: Partial<MiddlemanAgreementConfig> = resumeData?.intake?.middlemanAgreement || {};
  const defaults = middlemanAgreementDefaults as {
    scalars: Record<string, string>;
    sections: MiddlemanSection[];
  };
  const scalars = defaults.scalars;

  const partnerName = mm.partnerName || scalars.partnerName || '[Partner Name]';
  const partnerEmail = mm.partnerEmail || scalars.partnerEmail || '';
  const presentDateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const effectiveDate = mm.effectiveDate && mm.effectiveDate.trim() ? mm.effectiveDate : presentDateStr;
  const devName = mm.developerName || scalars.developerName || 'Prateeq Sharma';
  const devEmail = mm.developerEmail || scalars.developerEmail || 'prateeqsharma@gmail.com';
  const tier1Cut = mm.tier1Commission || scalars.tier1Commission || cutFor('A') || '10%';
  const tier2Cut = mm.tier2Commission || scalars.tier2Commission || cutFor('B') || '12%';
  const tier3Cut = mm.tier3Commission || scalars.tier3Commission || cutFor('C') || '15%';
  const recurringCut = mm.recurringCommission || scalars.recurringCommission || `${RECURRING_COMMISSION_RATE}%`;
  const agreedElectronically = mm.agreedElectronically || scalars.agreedElectronically || '';

  const tokens: Record<string, string> = {
    developerName: devName,
    partnerName,
    partnerEmail,
    developerEmail: devEmail,
    effectiveDate,
  };

  const sections: MiddlemanSection[] = (mm.sections && mm.sections.length ? mm.sections : defaults.sections).map((s) => ({
    key: s.key,
    heading: fillTokens(s.heading, tokens),
    lines: s.lines.map((line) => fillTokens(line, tokens)),
  }));

  const renderSection = (section: MiddlemanSection, index: number) => {
    const isCommission = section.key === 'commission';
    const isSignature = section.key === 'signature';

    return (
      <View key={section.key || index}>
        <Text style={styles.sectionTitle}>{section.heading}</Text>
        {section.lines.map((line, lineIdx) => {
          const isBullet = line.startsWith('- ');
          return isBullet ? (
            <View key={lineIdx} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>{'\u2022'}</Text>
              <Text style={styles.bulletText}>{line.slice(2)}</Text>
            </View>
          ) : (
            <Text key={lineIdx} style={styles.paragraph}>{line}</Text>
          );
        })}

        {isCommission && (
          <View>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellBold, { width: '40%', borderRightWidth: 1, borderRightColor: theme.cardBorder, paddingRight: 6 }]}>PROJECT TIER & BUDGET RANGE</Text>
                <Text style={[styles.tableCellBold, { width: '30%', borderRightWidth: 1, borderRightColor: theme.cardBorder, paddingLeft: 6, paddingRight: 6 }]}>PARTNER COMMISSION</Text>
                <Text style={[styles.tableCellBold, { width: '30%', paddingLeft: 6 }]}>PAYOUT TIMELINE</Text>
              </View>
              {COMMISSION_BANDS.map((band) => (
                <View key={band.id} style={[styles.tableRow, band.id === 'C' ? { borderBottomWidth: 0 } : {}]}>
                  <Text style={[styles.tableCell, { width: '40%', borderRightWidth: 1, borderRightColor: theme.cardBorder, paddingRight: 6 }]}>{`Tier ${band.id}: ${band.label} (${bandRange(band)})`}</Text>
                  <Text style={[styles.tableCell, { width: '30%', fontFamily: theme.labelBoldFont, borderRightWidth: 1, borderRightColor: theme.cardBorder, paddingLeft: 6, paddingRight: 6 }]}>
                    {band.id === 'A' ? tier1Cut : band.id === 'B' ? tier2Cut : tier3Cut}
                  </Text>
                  <Text style={[styles.tableCell, { width: '30%', paddingLeft: 6 }]}>{`Within ${COMMISSION_DISBURSEMENT_WINDOW} of Client 50% Deposit`}</Text>
                </View>
              ))}
              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.tableCell, { width: '40%', borderRightWidth: 1, borderRightColor: theme.cardBorder, paddingRight: 6 }]}>Recurring Care Plan (ongoing)</Text>
                <Text style={[styles.tableCell, { width: '30%', fontFamily: theme.labelBoldFont, borderRightWidth: 1, borderRightColor: theme.cardBorder, paddingLeft: 6, paddingRight: 6 }]}>{recurringCut}</Text>
                <Text style={[styles.tableCell, { width: '30%', paddingLeft: 6 }]}>Monthly on cleared Net Funds</Text>
              </View>
            </View>
            <View style={styles.agreedBox}>
              <Text style={styles.agreedTitle}>WORKED COMMISSION EXAMPLE</Text>
              <Text style={styles.agreedText}>
                {`Illustrative only: a SaaS contract signed at ${fmtINR(COMMISSION_EXAMPLE.contractValueINR)} falls in Tier ${COMMISSION_EXAMPLE.tier} (${tier3Cut}). Total commission is ${tier3Cut} × ${fmtINR(COMMISSION_EXAMPLE.contractValueINR)} = ${fmtINR(Math.round(COMMISSION_EXAMPLE.contractValueINR * parsePct(tier3Cut) / 100))}. It is paid 50% (${fmtINR(Math.round(Math.round(COMMISSION_EXAMPLE.contractValueINR * parsePct(tier3Cut) / 100) / 2))}) within ${COMMISSION_DISBURSEMENT_WINDOW} after the client's 50% deposit (${fmtINR(Math.round(COMMISSION_EXAMPLE.contractValueINR / 2))}) clears, and 50% (${fmtINR(Math.round(Math.round(COMMISSION_EXAMPLE.contractValueINR * parsePct(tier3Cut) / 100) / 2))}) after the final balance clears.`}
              </Text>
            </View>
          </View>
        )}

        {isSignature && (
          <View wrap={false}>
            <View style={styles.signatureGrid}>
              <View style={styles.signatureBox}>
                <Text style={styles.signatureTitle}>DEVELOPER SIGNATURE</Text>
                <Text style={styles.signatureLine}>{`NAME: ${devName}`}</Text>
                <Text style={styles.signatureLine}>{`DATE: ${effectiveDate}`}</Text>
                <Text style={styles.signatureLine}>SIGN: _______________</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text style={styles.signatureTitle}>PARTNER / SALES REP SIGNATURE</Text>
                <Text style={styles.signatureLine}>{`NAME: ${partnerName}`}</Text>
                <Text style={styles.signatureLine}>{`EMAIL: ${partnerEmail || '_______________'}`}</Text>
                <Text style={styles.signatureLine}>DATE: _______________</Text>
                <Text style={styles.signatureLine}>SIGN: _______________</Text>
              </View>
            </View>
            {agreedElectronically && (
              <View style={styles.agreedBox}>
                <Text style={styles.agreedTitle}>AGREED ELECTRONICALLY</Text>
                <Text style={styles.agreedText}>{agreedElectronically}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <Document title={`${partnerName.replace(/\s+/g, '_')}_Sales_Partner_Agreement`}>
      <Page size="A4" style={styles.page}>
        <PdfBrandHeader
          theme={theme}
          title="PRATEEQ.IN"
          subtitle="FULL-STACK & AI ARCHITECTURE // PARTNER FRAMEWORK"
        />

        <View style={styles.docHeader}>
          <Text style={styles.docTitle}>SALES PARTNER & MIDDLEMAN PARTNERSHIP AGREEMENT</Text>
          <Text style={styles.docMeta}>Prateeq Sharma | Engineering & Custom Web Builds | REF: PRTQ-PARTNER-2026</Text>
        </View>

        <View style={styles.metaCard}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>EFFECTIVE DATE</Text>
            <Text style={styles.metaVal}>{effectiveDate}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>DEVELOPER</Text>
            <Text style={styles.metaVal}>{`${devName} (prateeq.in)`}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>PARTNER / SALES REP</Text>
            <Text style={styles.metaVal}>{partnerName}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>CONTACT EMAIL</Text>
            <Text style={styles.metaVal}>{`${devEmail}${partnerEmail ? ` / ${partnerEmail}` : ''}`}</Text>
          </View>
        </View>

        {sections.map(renderSection)}

        <PdfFooter theme={theme} leftText="SALES PARTNER & MIDDLEMAN AGREEMENT // CONFIDENTIAL" />
      </Page>
    </Document>
  );
}
