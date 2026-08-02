import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Line } from '@react-pdf/renderer';
import type { ResumeData, MiddlemanAgreementConfig } from '@/data/resume';

interface MiddlemanAgreementPDFProps {
  theme?: 'azure' | 'noir';
  resumeData?: ResumeData | null;
}

export function MiddlemanAgreementPDF({ theme = 'azure', resumeData }: MiddlemanAgreementPDFProps) {
  const isNoir = theme === 'noir';
  const mm: Partial<MiddlemanAgreementConfig> = resumeData?.intake?.middlemanAgreement || {};
  const partnerName = mm.partnerName || '[Partner Name]';
  const effectiveDate = mm.effectiveDate || 'August 2, 2026';
  const devName = mm.developerName || 'Prateeq Sharma';
  const devEmail = mm.developerEmail || '3010prateeksharma@gmail.com';
  const tier1Cut = mm.tier1Commission || '10%';
  const tier2Cut = mm.tier2Commission || '12%';
  const tier3Cut = mm.tier3Commission || '15%';

  const styles = StyleSheet.create({
    page: {
      padding: 28,
      fontFamily: 'Helvetica',
      backgroundColor: isNoir ? '#090D16' : '#FFFFFF',
      fontSize: 8.5,
      color: isNoir ? '#F1F5F9' : '#0F172A',
    },
    headerBanner: {
      height: 50,
      backgroundColor: isNoir ? '#020617' : '#0F172A',
      borderRadius: 4,
      padding: 10,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isNoir ? '#1E293B' : '#334155',
    },
    brandTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: isNoir ? '#38BDF8' : '#FFFFFF',
    },
    brandSub: {
      fontSize: 7.5,
      color: isNoir ? '#94A3B8' : '#CBD5E1',
      marginTop: 2,
    },
    docHeader: {
      borderBottomWidth: 1,
      borderBottomColor: isNoir ? '#1E293B' : '#CBD5E1',
      paddingBottom: 6,
      marginBottom: 10,
    },
    docTitle: {
      fontSize: 13,
      fontFamily: 'Helvetica-Bold',
      color: isNoir ? '#F8FAFC' : '#0F172A',
    },
    docMeta: {
      fontSize: 7.5,
      color: isNoir ? '#94A3B8' : '#64748B',
      marginTop: 2,
    },
    metaCard: {
      backgroundColor: isNoir ? '#0F172A' : '#F8FAFC',
      borderColor: isNoir ? '#1E293B' : '#E2E8F0',
      borderWidth: 1,
      borderRadius: 4,
      padding: 8,
      marginBottom: 10,
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
      color: isNoir ? '#38BDF8' : '#475569',
    },
    metaVal: {
      fontSize: 8,
      color: isNoir ? '#F1F5F9' : '#0F172A',
    },
    sectionTitle: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 9,
      color: isNoir ? '#38BDF8' : '#1E3A8A',
      backgroundColor: isNoir ? '#0F172A' : '#EFF6FF',
      padding: '3 6',
      borderRadius: 3,
      marginBottom: 6,
      marginTop: 4,
    },
    paragraph: {
      fontSize: 8,
      lineHeight: 1.4,
      color: isNoir ? '#CBD5E1' : '#334155',
      marginBottom: 6,
    },
    table: {
      borderColor: isNoir ? '#1E293B' : '#CBD5E1',
      borderWidth: 1,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 10,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: isNoir ? '#0F172A' : '#F1F5F9',
      padding: 5,
      borderBottomWidth: 1,
      borderBottomColor: isNoir ? '#1E293B' : '#CBD5E1',
    },
    tableCellBold: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 7.5,
      color: isNoir ? '#38BDF8' : '#1E293B',
    },
    tableRow: {
      flexDirection: 'row',
      padding: 5,
      borderBottomWidth: 1,
      borderBottomColor: isNoir ? '#0F172A' : '#F8FAFC',
    },
    tableCell: {
      fontSize: 7.5,
      color: isNoir ? '#CBD5E1' : '#334155',
    },
    sigContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    sigBox: {
      width: '48%',
      borderColor: isNoir ? '#1E293B' : '#CBD5E1',
      borderWidth: 1,
      borderRadius: 4,
      padding: 8,
      height: 54,
    },
    sigTitle: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 7,
      color: isNoir ? '#94A3B8' : '#64748B',
      marginBottom: 10,
    },
    footer: {
      position: 'absolute',
      bottom: 18,
      left: 28,
      right: 28,
      borderTopWidth: 1,
      borderTopColor: isNoir ? '#1E293B' : '#E2E8F0',
      paddingTop: 5,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    footerText: {
      fontSize: 7,
      color: isNoir ? '#64748B' : '#94A3B8',
    },
  });

  const renderFooter = (pageNum: number) => (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>SALES PARTNER & MIDDLEMAN AGREEMENT // CONFIDENTIAL</Text>
      <Text style={styles.footerText}>{`Page ${pageNum} of 2 | https://prateeq.in`}</Text>
    </View>
  );

  return (
    <Document title={`${partnerName.replace(/\s+/g, '_')}_Sales_Partner_Agreement_${isNoir ? 'Noir' : 'Azure'}`}>
      {/* PAGE 1 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBanner}>
          <View>
            <Text style={styles.brandTitle}>PRATEEQ.IN</Text>
            <Text style={styles.brandSub}>FULL-STACK & AI ARCHITECTURE // PARTNER FRAMEWORK</Text>
          </View>
          <Svg height="26" width="100">
            <Line x1="0" y1="26" x2="100" y2="26" stroke={isNoir ? '#38BDF8' : '#38BDF8'} strokeWidth="1" />
            <Line x1="15" y1="26" x2="15" y2="10" stroke={isNoir ? '#38BDF8' : '#38BDF8'} strokeWidth="1" />
            <Line x1="15" y1="10" x2="35" y2="10" stroke={isNoir ? '#38BDF8' : '#38BDF8'} strokeWidth="1" />
            <Line x1="35" y1="10" x2="35" y2="26" stroke={isNoir ? '#38BDF8' : '#38BDF8'} strokeWidth="1" />
            <Line x1="45" y1="26" x2="45" y2="4" stroke={isNoir ? '#38BDF8' : '#38BDF8'} strokeWidth="1" />
            <Line x1="45" y1="4" x2="65" y2="4" stroke={isNoir ? '#38BDF8' : '#38BDF8'} strokeWidth="1" />
            <Line x1="65" y1="4" x2="65" y2="26" stroke={isNoir ? '#38BDF8' : '#38BDF8'} strokeWidth="1" />
            <Line x1="75" y1="26" x2="75" y2="14" stroke={isNoir ? '#38BDF8' : '#38BDF8'} strokeWidth="1" />
            <Line x1="75" y1="14" x2="90" y2="14" stroke={isNoir ? '#38BDF8' : '#38BDF8'} strokeWidth="1" />
            <Line x1="90" y1="14" x2="90" y2="26" stroke={isNoir ? '#38BDF8' : '#38BDF8'} strokeWidth="1" />
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
            <Text style={styles.metaVal}>{devEmail}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>1. PURPOSE & ROLES OF ENGAGEMENT</Text>
        <Text style={styles.paragraph}>
          {`This Agreement outlines the commercial terms, commission structure, payment schedules, and operational rules between ${devName} ("Developer") and ${partnerName} ("Sales Representative / Partner") for bringing client web development, custom software, and AI integration projects to the Developer.`}
        </Text>

        <Text style={styles.sectionTitle}>2. COMMISSION TIER STRUCTURE & PAYOUT RATES</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellBold, { width: '40%' }]}>PROJECT TIER & BUDGET RANGE</Text>
            <Text style={[styles.tableCellBold, { width: '30%' }]}>PARTNER COMMISSION</Text>
            <Text style={[styles.tableCellBold, { width: '30%' }]}>PAYOUT TIMELINE</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '40%' }]}>Tier 1: Landing Page (₹25k–₹45k / $300–$550)</Text>
            <Text style={[styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }]}>{tier1Cut}</Text>
            <Text style={[styles.tableCell, { width: '30%' }]}>Within 48h of Client 50% Deposit</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '40%' }]}>Tier 2: Multi-Page Web App (₹45k–₹90k / $550–$1.1k)</Text>
            <Text style={[styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }]}>{tier2Cut}</Text>
            <Text style={[styles.tableCell, { width: '30%' }]}>Within 48h of Client 50% Deposit</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '40%' }]}>Tier 3: SaaS / AI RAG Engine (₹90k–₹1.5L+ / $1.1k+)</Text>
            <Text style={[styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }]}>{tier3Cut}</Text>
            <Text style={[styles.tableCell, { width: '30%' }]}>Within 48h of Client 50% Deposit</Text>
          </View>
        </View>

        {renderFooter(1)}
      </Page>

      {/* PAGE 2 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.docHeader}>
          <Text style={styles.docTitle}>OPERATIONAL RULES & SIGN-OFF</Text>
          <Text style={styles.docMeta}>Prateeq Sharma | Engineering & Custom Web Builds | Page 2 of 2</Text>
        </View>

        <Text style={styles.sectionTitle}>3. CLIENT HANDOFF & PROJECT QUALIFICATION</Text>
        <Text style={styles.paragraph}>
          {`The Partner introduces leads via warm email introduction or the Intake Scoping Form. Once a client signs the Scoping Specification and pays the 50% upfront deposit, the project is officially qualified and the Partner's commission is released within 48 business hours.`}
        </Text>

        <Text style={styles.sectionTitle}>4. NON-CIRCUMVENTION & CONFIDENTIALITY</Text>
        <Text style={styles.paragraph}>
          {`Developer agrees not to solicit or bypass Partner's direct clients without Partner's written consent. Partner agrees to keep Developer's rates, codebases, and technical architecture confidential.`}
        </Text>

        <Text style={styles.sectionTitle}>5. SIGNATURE & AGREEMENT ACCEPTANCE</Text>
        <View style={styles.sigContainer}>
          <View style={styles.sigBox}>
            <Text style={styles.sigTitle}>DEVELOPER SIGNATURE</Text>
            <Text style={styles.paragraph}>{`NAME: ${devName}`}</Text>
            <Text style={styles.paragraph}>{`DATE: ${effectiveDate}`}</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigTitle}>PARTNER SIGNATURE</Text>
            <Text style={styles.paragraph}>{`NAME: ${partnerName}`}</Text>
            <Text style={styles.paragraph}>DATE: _______________</Text>
          </View>
        </View>

        {renderFooter(2)}
      </Page>
    </Document>
  );
}
