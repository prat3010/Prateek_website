import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData, MiddlemanAgreementConfig } from '@/data/resume';
import { getPdfTheme, type PDFThemeConfig } from './pdfTheme';
import { PdfBrandHeader } from './PdfBrandHeader';
import { PdfFooter } from './PdfFooter';
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

function createStyles(theme: PDFThemeConfig) {
  return StyleSheet.create({
    page: {
      paddingTop: 24,
      paddingBottom: 32,
      paddingLeft: 28,
      paddingRight: 28,
      fontFamily: theme.bodyFont,
      backgroundColor: theme.pageBg,
      fontSize: 8.5,
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
      fontSize: 8,
      color: theme.textPrimary,
    },
    sectionTitle: {
      fontFamily: theme.labelBoldFont,
      fontSize: 8,
      color: theme.chipText,
      backgroundColor: theme.chipBg,
      borderColor: theme.chipBorder,
      borderWidth: 1,
      padding: '3 6',
      borderRadius: 3,
      marginBottom: 6,
      marginTop: 4,
      borderLeftWidth: 3,
      borderLeftColor: theme.accentColor,
      letterSpacing: 0.05,
    },
    paragraph: {
      fontSize: 8,
      lineHeight: 1.4,
      color: theme.textSecondary,
      marginBottom: 8,
    },
    bulletRow: {
      flexDirection: 'row',
      marginBottom: 3,
    },
    bulletDot: {
      width: 10,
      fontSize: 8,
      lineHeight: 1.4,
      color: theme.accentColor,
    },
    bulletText: {
      flex: 1,
      fontSize: 8,
      lineHeight: 1.4,
      color: theme.textSecondary,
    },
    table: {
      width: '100%',
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 10,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: theme.tableRowAlt,
      padding: 5,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    tableCellBold: {
      fontFamily: theme.labelBoldFont,
      fontSize: 6.5,
      color: theme.textPrimary,
      letterSpacing: 0.04,
    },
    tableRow: {
      flexDirection: 'row',
      padding: 5,
      borderBottomWidth: 1,
      borderBottomColor: theme.tableRowAlt,
    },
    tableCell: {
      fontSize: 7.5,
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
      fontSize: 6.5,
      color: theme.textSecondary,
      marginBottom: 8,
      letterSpacing: 0.05,
    },
    signatureLine: {
      fontSize: 7.5,
      color: theme.textPrimary,
      marginTop: 1,
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
      fontSize: 7,
      color: theme.accentColor,
      marginBottom: 3,
      letterSpacing: 0.05,
    },
    agreedText: {
      fontSize: 7.5,
      lineHeight: 1.4,
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
  const devEmail = mm.developerEmail || scalars.developerEmail || '3010prateeksharma@gmail.com';
  const tier1Cut = mm.tier1Commission || scalars.tier1Commission || '10%';
  const tier2Cut = mm.tier2Commission || scalars.tier2Commission || '12%';
  const tier3Cut = mm.tier3Commission || scalars.tier3Commission || '15%';
  const recurringCut = mm.recurringCommission || scalars.recurringCommission || '10%';
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
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellBold, { width: '40%' }]}>PROJECT TIER & BUDGET RANGE</Text>
              <Text style={[styles.tableCellBold, { width: '30%' }]}>PARTNER COMMISSION</Text>
              <Text style={[styles.tableCellBold, { width: '30%' }]}>PAYOUT TIMELINE</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '40%' }]}>Tier 1: Landing Page (INR 25k–45k / $300–$550)</Text>
              <Text style={[styles.tableCell, { width: '30%', fontFamily: theme.labelBoldFont }]}>{tier1Cut}</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>Within 48h of Client 50% Deposit</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '40%' }]}>Tier 2: Multi-Page Web App (INR 45k–90k / $550–$1.1k)</Text>
              <Text style={[styles.tableCell, { width: '30%', fontFamily: theme.labelBoldFont }]}>{tier2Cut}</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>Within 48h of Client 50% Deposit</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '40%' }]}>Tier 3: SaaS / AI RAG Engine (INR 90k–1.5L+ / $1.1k+)</Text>
              <Text style={[styles.tableCell, { width: '30%', fontFamily: theme.labelBoldFont }]}>{tier3Cut}</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>Within 48h of Client 50% Deposit</Text>
            </View>
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.tableCell, { width: '40%' }]}>Recurring Care Plan (ongoing)</Text>
              <Text style={[styles.tableCell, { width: '30%', fontFamily: theme.labelBoldFont }]}>{recurringCut}</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>Monthly on cleared Net Funds</Text>
            </View>
          </View>
        )}

        {isSignature && (
          <View>
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
                <Text style={styles.signatureLine}>{`EMAIL: ${partnerEmail}`}</Text>
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
