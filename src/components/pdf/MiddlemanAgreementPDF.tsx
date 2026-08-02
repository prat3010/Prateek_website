import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData, MiddlemanAgreementConfig } from '@/data/resume';
import { SkylineVectorHeader } from './SkylineVectorHeader';

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
    docHeader: {
      borderBottomWidth: 1,
      borderBottomColor: isNoir ? '#1E293B' : '#CBD5E1',
      paddingBottom: 6,
      marginBottom: 10,
    },
    docTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: isNoir ? '#F8FAFC' : '#0F172A',
      textTransform: 'uppercase',
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
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: isNoir ? '#38BDF8' : '#1E3A8A',
      backgroundColor: isNoir ? '#0F172A' : '#EFF6FF',
      padding: '3 6',
      borderRadius: 3,
      marginTop: 8,
      marginBottom: 6,
    },
    paragraph: {
      marginBottom: 5,
      lineHeight: 1.35,
      color: isNoir ? '#CBD5E1' : '#334155',
    },
    bullet: {
      marginBottom: 3,
      paddingLeft: 8,
      lineHeight: 1.3,
      color: isNoir ? '#94A3B8' : '#475569',
    },
    bold: {
      fontFamily: 'Helvetica-Bold',
      color: isNoir ? '#F8FAFC' : '#0F172A',
    },
    table: {
      marginTop: 6,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isNoir ? '#1E293B' : '#CBD5E1',
      borderRadius: 4,
      overflow: 'hidden',
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: isNoir ? '#020617' : '#F1F5F9',
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
      paddingTop: 4,
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
        <SkylineVectorHeader
          title="PRATEEQ.IN"
          sub="FULL-STACK & AI ARCHITECTURE // PARTNER FRAMEWORK"
          theme={theme}
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
