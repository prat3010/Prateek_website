import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Line } from '@react-pdf/renderer';
import type { ResumeData, MiddlemanAgreementConfig } from '@/data/resume';
import { DEFAULT_PDF_THEME } from './pdfTheme';
import middlemanAgreementDefaults from '@/data/middlemanAgreementDefaults.json';

interface MiddlemanAgreementPDFProps {
  resumeData?: ResumeData | null;
}

interface MiddlemanSection {
  key: string;
  heading: string;
  lines: string[];
}

function fillTokens(text: string, tokens: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => tokens[key] ?? match);
}

export function MiddlemanAgreementPDF({ resumeData }: MiddlemanAgreementPDFProps) {
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

  const styles = StyleSheet.create({
    page: {
      paddingTop: 24,
      paddingBottom: 32,
      paddingLeft: 28,
      paddingRight: 28,
      fontFamily: 'Helvetica',
      backgroundColor: DEFAULT_PDF_THEME.pageBg,
      fontSize: 8.5,
      color: DEFAULT_PDF_THEME.textPrimary,
    },
    headerBanner: {
      height: 48,
      backgroundColor: DEFAULT_PDF_THEME.headerBg,
      borderRadius: 4,
      padding: 10,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    brandTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: DEFAULT_PDF_THEME.headerTitle,
      letterSpacing: 0.8,
    },
    brandSub: {
      fontSize: 7,
      color: DEFAULT_PDF_THEME.headerSub,
      marginTop: 2,
      letterSpacing: 0.5,
    },
    docHeader: {
      borderBottomWidth: 1,
      borderBottomColor: '#CBD5E1',
      paddingBottom: 5,
      marginBottom: 10,
    },
    docTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: '#0F172A',
      textTransform: 'uppercase',
    },
    docMeta: {
      fontSize: 7.5,
      color: '#64748B',
      marginTop: 2,
    },
    metaCard: {
      backgroundColor: '#F8FAFC',
      borderColor: '#E2E8F0',
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
      fontFamily: 'Helvetica-Bold',
      fontSize: 7.5,
      color: '#475569',
    },
    metaVal: {
      fontSize: 8,
      color: '#0F172A',
    },
    sectionTitle: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 9,
      color: '#1E3A8A',
      backgroundColor: '#EFF6FF',
      padding: '3 6',
      borderRadius: 3,
      marginBottom: 6,
      marginTop: 4,
      borderLeftWidth: 3,
      borderLeftColor: '#2563EB',
    },
    paragraph: {
      fontSize: 8,
      lineHeight: 1.4,
      color: '#334155',
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
      color: '#2563EB',
    },
    bulletText: {
      flex: 1,
      fontSize: 8,
      lineHeight: 1.4,
      color: '#334155',
    },
    table: {
      width: '100%',
      borderColor: '#CBD5E1',
      borderWidth: 1,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 10,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#F1F5F9',
      padding: 5,
      borderBottomWidth: 1,
      borderBottomColor: '#CBD5E1',
    },
    tableCellBold: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 7.5,
      color: '#1E293B',
    },
    tableRow: {
      flexDirection: 'row',
      padding: 5,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
    },
    tableCell: {
      fontSize: 7.5,
      color: '#334155',
    },
    footer: {
      position: 'absolute',
      bottom: 14,
      left: 28,
      right: 28,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
      paddingTop: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    footerText: {
      fontSize: 7,
      color: '#94A3B8',
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
      borderColor: '#CBD5E1',
      borderWidth: 1,
      borderRadius: 4,
      padding: 7,
    },
    signatureTitle: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 7,
      color: '#64748B',
      marginBottom: 8,
    },
    signatureLine: {
      fontSize: 7.5,
      color: '#0F172A',
      marginTop: 1,
    },
    agreedBox: {
      marginTop: 8,
      backgroundColor: '#F8FAFC',
      borderColor: '#CBD5E1',
      borderWidth: 1,
      borderRadius: 4,
      padding: 8,
    },
    agreedTitle: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 7.5,
      color: '#0284C7',
      marginBottom: 3,
    },
    agreedText: {
      fontSize: 7.5,
      lineHeight: 1.4,
      color: '#475569',
    },
  });

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
              <Text style={[styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }]}>{tier1Cut}</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>Within 48h of Client 50% Deposit</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '40%' }]}>Tier 2: Multi-Page Web App (INR 45k–90k / $550–$1.1k)</Text>
              <Text style={[styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }]}>{tier2Cut}</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>Within 48h of Client 50% Deposit</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '40%' }]}>Tier 3: SaaS / AI RAG Engine (INR 90k–1.5L+ / $1.1k+)</Text>
              <Text style={[styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }]}>{tier3Cut}</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>Within 48h of Client 50% Deposit</Text>
            </View>
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.tableCell, { width: '40%' }]}>Recurring Care Plan (ongoing)</Text>
              <Text style={[styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }]}>{recurringCut}</Text>
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
        <View style={styles.headerBanner}>
          <View>
            <Text style={styles.brandTitle}>PRATEEQ.IN</Text>
            <Text style={styles.brandSub}>FULL-STACK & AI ARCHITECTURE // PARTNER FRAMEWORK</Text>
          </View>
          <Svg height="26" width="100">
            <Line x1="0" y1="26" x2="100" y2="26" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="15" y1="26" x2="15" y2="10" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="15" y1="10" x2="35" y2="10" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="35" y1="10" x2="35" y2="26" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="45" y1="26" x2="45" y2="4" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="45" y1="4" x2="65" y2="4" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="65" y1="4" x2="65" y2="26" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="75" y1="26" x2="75" y2="14" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="75" y1="14" x2="90" y2="14" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="90" y1="14" x2="90" y2="26" stroke="#38BDF8" strokeWidth="1" />
          </Svg>
        </View>

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

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>SALES PARTNER & MIDDLEMAN AGREEMENT // CONFIDENTIAL</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
              `Page ${pageNumber} of ${totalPages} | https://prateeq.in`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
