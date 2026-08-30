import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/data/resume';
import type { QuestionnaireData } from '@/utils/pdfGenerator';
import { formatPricePair, type Currency } from '@/lib/pricing';
import { getPdfTheme, cleanPDFText, type PDFThemeConfig } from './pdfTheme';
import { PdfBrandHeader } from './PdfBrandHeader';
import { PdfFooter } from './PdfFooter';

export interface ProposalExecutiveBriefPDFProps {
  resumeData?: ResumeData | null;
  data?: QuestionnaireData;
  isNoir?: boolean;
  currency?: Currency;
}

function createStyles(theme: PDFThemeConfig) {
  return StyleSheet.create({
    page: {
      paddingTop: 20,
      paddingBottom: 24,
      paddingLeft: 24,
      paddingRight: 24,
      fontFamily: theme.bodyFont,
      backgroundColor: theme.pageBg,
      fontSize: 8,
      color: theme.textPrimary,
    },
    docHeader: {
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      paddingBottom: 4,
      marginBottom: 8,
    },
    docTitle: {
      fontSize: 10.5,
      fontFamily: theme.headlineBoldFont,
      color: theme.textPrimary,
      textTransform: 'uppercase',
      letterSpacing: 0.04,
    },
    docMeta: {
      fontSize: 6.5,
      fontFamily: theme.labelFont,
      color: theme.textSecondary,
      marginTop: 2,
      letterSpacing: 0.04,
    },
    gridTwoCol: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    card: {
      backgroundColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 4,
      padding: 7,
      flex: 1,
    },
    sectionLabel: {
      fontSize: 7,
      fontFamily: theme.labelBoldFont,
      color: theme.chipText,
      backgroundColor: theme.chipBg,
      borderColor: theme.chipBorder,
      borderWidth: 1,
      padding: '2 5',
      borderRadius: 3,
      marginBottom: 5,
      borderLeftWidth: 3,
      borderLeftColor: theme.accentColor,
      letterSpacing: 0.04,
      textTransform: 'uppercase',
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2.5,
    },
    metaKey: {
      fontFamily: theme.labelBoldFont,
      color: theme.textSecondary,
      fontSize: 6.5,
    },
    metaValue: {
      fontFamily: theme.bodyFont,
      color: theme.textPrimary,
      fontSize: 7.5,
    },
    tierPillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 3,
    },
    tierPill: {
      backgroundColor: theme.tableRowAlt,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 3,
      padding: '2 5',
      fontSize: 6.5,
      fontFamily: theme.labelFont,
      color: theme.textPrimary,
    },
    table: {
      width: '100%',
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      backgroundColor: theme.headerBg,
      padding: '4 6',
    },
    tableHeaderText: {
      fontFamily: theme.labelBoldFont,
      fontSize: 6.5,
      color: theme.headerTitle,
      textTransform: 'uppercase',
    },
    tableRow: {
      flexDirection: 'row',
      padding: '4 6',
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
      backgroundColor: theme.cardBg,
    },
    tableRowAlt: {
      flexDirection: 'row',
      padding: '4 6',
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
      backgroundColor: theme.tableRowAlt,
    },
    tableCol1: { width: '55%' },
    tableCol2: { width: '20%', textAlign: 'center' },
    tableCol3: { width: '25%', textAlign: 'right' },
    totalBar: {
      backgroundColor: theme.accentBg,
      borderColor: theme.accentColor,
      borderWidth: 1,
      borderRadius: 4,
      padding: '6 8',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    totalLabel: {
      fontFamily: theme.labelBoldFont,
      fontSize: 7.5,
      color: theme.textPrimary,
      textTransform: 'uppercase',
      letterSpacing: 0.04,
    },
    totalValue: {
      fontFamily: theme.labelBoldFont,
      fontSize: 10,
      color: theme.accentColor,
    },
    timelineGrid: {
      flexDirection: 'row',
      gap: 6,
    },
    timelineCard: {
      flex: 1,
      backgroundColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 3,
      padding: 5,
    },
    timelineStepNumber: {
      fontSize: 6.5,
      fontFamily: theme.labelBoldFont,
      color: theme.accentColor,
      marginBottom: 2,
    },
    timelineStepTitle: {
      fontSize: 7,
      fontFamily: theme.labelBoldFont,
      color: theme.textPrimary,
      marginBottom: 2,
    },
    timelineStepDesc: {
      fontSize: 6,
      color: theme.textSecondary,
      lineHeight: 1.3,
    },
  });
}

export function ProposalExecutiveBriefPDF({
  resumeData,
  data,
  isNoir = false,
  currency = 'INR',
}: ProposalExecutiveBriefPDFProps) {
  const theme = getPdfTheme(isNoir);
  const styles = createStyles(theme);

  const companyName = cleanPDFText(data?.companyName || 'Client Organization');
  const projectGoal = cleanPDFText(data?.projectGoal || 'Custom High-Performance Digital Platform');
  const businessKPI = cleanPDFText(data?.businessKPI || 'Rapid market validation & sub-second latency');
  const engineName = cleanPDFText(data?.projectCategory || 'Full-Stack Web & AI Application');
  const timeline = cleanPDFText(data?.timeline || '3-4 Weeks Turnaround');
  const maintenancePlan = cleanPDFText(data?.maintenancePlan || 'Managed 99.9% Production SLA');

  const totalBuildINR = data?.totalBuildCostINR || 250000;
  const totalBuildUSD = data?.totalBuildCostUSD || 3000;
  const careCostINR = data?.maintenanceCostINR || 25000;
  const careCostUSD = data?.maintenanceCostUSD || 300;

  const totalBuildFormatted =
    currency === 'USD'
      ? formatPricePair(totalBuildINR, totalBuildUSD, 'USD')
      : formatPricePair(totalBuildINR, totalBuildUSD, 'INR');

  const careFormatted =
    currency === 'USD'
      ? formatPricePair(careCostINR, careCostUSD, 'USD')
      : formatPricePair(careCostINR, careCostUSD, 'INR');

  return (
    <Document title={`${companyName} - Executive Pitch Brief`} author={resumeData?.name || 'Prateek Sharma'}>
      <Page size="A4" style={styles.page}>
        <PdfBrandHeader
          theme={theme}
          title="PRATEEQ"
          subtitle="EXECUTIVE PROJECT BRIEF & INVESTMENT PITCH"
        />

        <View style={styles.docHeader}>
          <Text style={styles.docTitle}>{companyName} — Executive Overview</Text>
          <Text style={styles.docMeta}>
            GENERATED FOR LEADERSHIP & CAPITAL ALLOCATION • TIMELINE: {timeline.toUpperCase()}
          </Text>
        </View>

        {/* Vision & Business KPI Card Grid */}
        <View style={styles.gridTwoCol}>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Executive Objective</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Strategic Goal:</Text>
              <Text style={styles.metaValue}>{projectGoal}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Business KPI:</Text>
              <Text style={styles.metaValue}>{businessKPI}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Architecture Tiers</Text>
            <View style={styles.tierPillRow}>
              <Text style={styles.tierPill}>Edge CDN & WAF</Text>
              <Text style={styles.tierPill}>Next.js 16 App Router</Text>
              <Text style={styles.tierPill}>Retriever RAG Engine</Text>
              <Text style={styles.tierPill}>pgvector Storage</Text>
              <Text style={styles.tierPill}>Razorpay Escrow</Text>
            </View>
          </View>
        </View>

        {/* Investment & Deliverables Table */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderText, styles.tableCol1]}>Deliverable Item</Text>
            <Text style={[styles.tableHeaderText, styles.tableCol2]}>Delivery Milestone</Text>
            <Text style={[styles.tableHeaderText, styles.tableCol3]}>Allocation</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.metaValue, styles.tableCol1]}>{engineName}</Text>
            <Text style={[styles.metaKey, styles.tableCol2]}>Phase 1 & 2</Text>
            <Text style={[styles.metaValue, styles.tableCol3]}>Included</Text>
          </View>

          <View style={styles.tableRowAlt}>
            <Text style={[styles.metaValue, styles.tableCol1]}>
              Modular Feature Suite ({data?.features?.length || 4} Core Capabilities)
            </Text>
            <Text style={[styles.metaKey, styles.tableCol2]}>Phase 2 & 3</Text>
            <Text style={[styles.metaValue, styles.tableCol3]}>Included</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.metaValue, styles.tableCol1]}>
              Post-Launch SLA Retainer ({maintenancePlan})
            </Text>
            <Text style={[styles.metaKey, styles.tableCol2]}>Monthly</Text>
            <Text style={[styles.metaValue, styles.tableCol3]}>{careFormatted}/mo</Text>
          </View>
        </View>

        {/* Investment Total Bar */}
        <View style={styles.totalBar}>
          <Text style={styles.totalLabel}>Total Fixed Scope Investment (50% Milestone Split):</Text>
          <Text style={styles.totalValue}>{totalBuildFormatted}</Text>
        </View>

        {/* 4-Stage Delivery Schedule */}
        <Text style={styles.sectionLabel}>4-Stage Accelerated Sprint Delivery</Text>
        <View style={styles.timelineGrid}>
          <View style={styles.timelineCard}>
            <Text style={styles.timelineStepNumber}>01 ARCHITECTURE</Text>
            <Text style={styles.timelineStepTitle}>Discovery & Schema</Text>
            <Text style={styles.timelineStepDesc}>Data modeling, API contracts, and cryptographic SOW freeze.</Text>
          </View>

          <View style={styles.timelineCard}>
            <Text style={styles.timelineStepNumber}>02 ENGINEERING</Text>
            <Text style={styles.timelineStepTitle}>Core Implementation</Text>
            <Text style={styles.timelineStepDesc}>Vector retrieval, UI components, and authentication pipelines.</Text>
          </View>

          <View style={styles.timelineCard}>
            <Text style={styles.timelineStepNumber}>03 STAGING & QA</Text>
            <Text style={styles.timelineStepTitle}>Client Review</Text>
            <Text style={styles.timelineStepDesc}>End-to-end integration, performance audit, and user acceptance.</Text>
          </View>

          <View style={styles.timelineCard}>
            <Text style={styles.timelineStepNumber}>04 PRODUCTION</Text>
            <Text style={styles.timelineStepTitle}>Launch & IP Transfer</Text>
            <Text style={styles.timelineStepDesc}>Zero-downtime cutover, SLA activation, and full IP handover.</Text>
          </View>
        </View>

        <PdfFooter theme={theme} leftText="EXECUTIVE PROJECT BRIEF — STRICTLY CONFIDENTIAL" />
      </Page>
    </Document>
  );
}
