import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/data/resume';
import type { QuestionnaireData } from '@/utils/pdfGenerator';
import { getPdfTheme, type PDFThemeConfig } from './pdfTheme';
import { PdfBrandHeader } from './PdfBrandHeader';
import { PdfFooter } from './PdfFooter';

/**
 * Sanitizes strings for React-PDF fonts:
 * 1. Replaces non-Latin Rupee symbol (₹) with 'INR '
 * 2. Strips unicode emoji glyphs that render as broken boxes
 */
function cleanPDFText(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/₹/g, 'INR ')
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
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
    metadataCard: {
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
      color: theme.textPrimary,
      fontSize: 8,
    },
    sectionHeader: {
      fontSize: 8,
      fontFamily: theme.labelBoldFont,
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
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      padding: 5,
    },
    tableHeaderCell: {
      fontFamily: theme.labelBoldFont,
      fontSize: 6.5,
      color: theme.textPrimary,
      letterSpacing: 0.05,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.tableRowAlt,
      padding: 5,
      alignItems: 'center',
    },
    tableRowHighlight: {
      backgroundColor: theme.tableRowAlt,
    },
    tableTotalRow: {
      flexDirection: 'row',
      backgroundColor: theme.headerBg,
      padding: 6,
      alignItems: 'center',
    },
    colModule: {
      width: '62%',
    },
    colPrice: {
      width: '38%',
      textAlign: 'right',
    },
    moduleTitle: {
      fontFamily: theme.labelBoldFont,
      fontSize: 7,
      color: theme.textPrimary,
      letterSpacing: 0.02,
    },
    moduleDesc: {
      fontSize: 7,
      color: theme.textSecondary,
      marginTop: 1,
    },
    priceVal: {
      fontFamily: theme.labelBoldFont,
      fontSize: 7.5,
      color: theme.accentColor,
    },
    totalTitle: {
      fontFamily: theme.labelBoldFont,
      fontSize: 7.5,
      color: theme.headerTitle,
      letterSpacing: 0.04,
    },
    totalVal: {
      fontFamily: theme.labelBoldFont,
      fontSize: 9,
      color: theme.accentColor,
      textAlign: 'right',
    },
    fieldRow: {
      marginBottom: 5,
      flexDirection: 'row',
    },
    fieldLabel: {
      fontFamily: theme.labelBoldFont,
      width: '30%',
      color: theme.textSecondary,
      fontSize: 7,
      letterSpacing: 0.03,
    },
    fieldVal: {
      width: '70%',
      color: theme.textPrimary,
      fontSize: 8,
      lineHeight: 1.3,
    },
    termItem: {
      marginBottom: 5,
      fontSize: 7.5,
      color: theme.textSecondary,
      lineHeight: 1.35,
    },
    sigContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    sigBox: {
      width: '48%',
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 4,
      padding: 7,
      height: 52,
      backgroundColor: theme.cardBg,
    },
    sigTitle: {
      fontFamily: theme.labelBoldFont,
      fontSize: 6.5,
      color: theme.textSecondary,
      marginBottom: 8,
      letterSpacing: 0.05,
    },
    sigText: {
      fontSize: 7.5,
      color: theme.textPrimary,
      marginTop: 1,
    },
  });
}

interface ScopingBriefPDFProps {
  resumeData?: ResumeData | null;
  data?: QuestionnaireData;
  isNoir?: boolean;
}

export function ScopingBriefPDF({ resumeData, data, isNoir }: ScopingBriefPDFProps) {
  const theme = getPdfTheme(!!isNoir);
  const styles = createStyles(theme);
  const intakeConfig = resumeData?.intake;

  const totalINR = data?.totalBuildCostINR || 143000;
  const totalUSD = data?.totalBuildCostUSD || 1710;
  const maintenanceINR = data?.maintenanceCostINR ?? 6500;
  const maintenanceUSD = data?.maintenanceCostUSD ?? 80;

  const terms = intakeConfig?.termsAndConditions || [
    "1. Payment Milestone Structure: 50% Upfront Deposit required to initiate development & architecture setup. 50% Final Balance prior to domain mapping & production handover.",
    "2. Scope Creep & Change Orders: Any feature, page, or integration requested after signing that is not listed in Section 2 will be classified as a 'Change Order' and quoted separately under a Phase 2 add-on contract.",
    "3. Revision Policy: Includes up to 2 rounds of comprehensive design/layout revisions. Revision requests must be provided in writing within 5 business days of draft delivery.",
    "4. Client Dependencies: Timeline countdown begins ONLY after receiving all required client assets (text, logo, media, API credentials). Client delays in asset delivery will extend final delivery date accordingly.",
    "5. Intellectual Property (IP) Ownership: 100% Intellectual Property and code ownership transfer to Client upon receipt of final payment.",
    "6. Infrastructure & Hosting: Hosting (Vercel), Database (Supabase), Domain Registration, and API costs (OpenAI/Resend) are billed directly to client-owned accounts. Developer is not liable for third-party outages.",
    "7. Maintenance Retainer & SLA: Selected Care Plan is billed monthly post-launch. Includes defined SLA response times, automated backups, and dedicated monthly development hours."
  ];

  const companyName = cleanPDFText(data?.companyName) || 'Client Company';
  const projectGoal = cleanPDFText(data?.projectGoal) || 'Lead Generation & Direct Sales';
  const targetAudience = cleanPDFText(data?.targetAudience) || 'Tech Founders, SMB Owners, B2B Clients';
  const projectCategory = cleanPDFText(data?.projectCategory) || 'Multi-Page Web App Engine';
  const assetsStatus = cleanPDFText(data?.assetsStatus) || 'All Brand Assets Ready';

  return (
    <Document title={`${companyName.replace(/\s+/g, '_')}_Itemized_Scoping_Proposal`}>
      {/* ================= PAGE 1 ================= */}
      <Page size="A4" style={styles.page}>
        <PdfBrandHeader
          theme={theme}
          title="PRATEEQ.IN"
          subtitle="FULL-STACK & AI ARCHITECTURE // SCOPING & QUOTATION"
        />

        <View style={styles.docHeader}>
          <Text style={styles.docTitle}>EXECUTIVE COMMERCIAL PROPOSAL & SCOPING SPECIFICATION</Text>
          <Text style={styles.docMeta}>Prateeq Sharma | Engineering & Custom Web Builds | REF: PRTQ-QUOTE-2026</Text>
        </View>

        <View style={styles.metadataCard}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>PROPOSAL DATE</Text>
            <Text style={styles.metaVal}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>CLIENT / COMPANY</Text>
            <Text style={styles.metaVal}>{companyName}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>CONTACT EMAIL</Text>
            <Text style={styles.metaVal}>{cleanPDFText(data?.contactEmail) || '___________________________'}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>PHONE / WHATSAPP</Text>
            <Text style={styles.metaVal}>{cleanPDFText(data?.contactPhone) || '___________________________'}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>TARGET LAUNCH SPRINT</Text>
            <Text style={styles.metaVal}>{cleanPDFText(data?.timeline) || 'Standard Turnaround (2–4 Weeks)'}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>1. BUSINESS OBJECTIVES & AUDIENCE PERSONA</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Primary Business Goal:</Text>
          <Text style={styles.fieldVal}>{projectGoal}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Target Audience Persona:</Text>
          <Text style={styles.fieldVal}>{targetAudience}</Text>
        </View>

        <Text style={styles.sectionHeader}>2. ITEMIZED COMMERCIAL INVESTMENT SUMMARY</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colModule]}>ARCHITECTURE ENGINE & MODULE LINE ITEMS</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>COMMERCIAL VALUE</Text>
          </View>

          <View style={[styles.tableRow, styles.tableRowHighlight]} wrap={false}>
            <View style={styles.colModule}>
              <Text style={styles.moduleTitle}>Base Architecture Engine ({projectCategory})</Text>
              <Text style={styles.moduleDesc}>Next.js 16 App Router, Responsive Motion UI, Telemetry, SEO Schema, Vercel Setup</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.priceVal}>Base Included</Text>
            </View>
          </View>

          {data?.features?.map((feat, idx) => (
            <View key={idx} style={styles.tableRow} wrap={false}>
              <View style={styles.colModule}>
                <Text style={styles.moduleTitle}>{cleanPDFText(feat)}</Text>
                <Text style={styles.moduleDesc}>Production-grade module integration & automated testing</Text>
              </View>
              <View style={styles.colPrice}>
                <Text style={styles.priceVal}>Included in Scope</Text>
              </View>
            </View>
          ))}

          <View style={styles.tableRow} wrap={false}>
            <View style={styles.colModule}>
              <Text style={styles.moduleTitle}>Brand Identity & Copywriting Readiness</Text>
              <Text style={styles.moduleDesc}>{assetsStatus}</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.priceVal}>Included</Text>
            </View>
          </View>

          <View style={styles.tableTotalRow} wrap={false}>
            <View style={styles.colModule}>
              <Text style={styles.totalTitle}>ESTIMATED TOTAL BUILD INVESTMENT</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.totalVal}>{`INR ${totalINR.toLocaleString()} / $${totalUSD.toLocaleString()}`}</Text>
            </View>
          </View>
        </View>

        <PdfFooter theme={theme} leftText="CONFIDENTIAL SCOPING BRIEF & QUOTATION // GENERATED BY PRATEEQ.IN SCOPING LAB" />
      </Page>

      {/* ================= PAGE 2 ================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.docHeader}>
          <Text style={styles.docTitle}>MONTHLY MAINTENANCE & INFRASTRUCTURE CARE</Text>
          <Text style={styles.docMeta}>Prateeq Sharma | Engineering & Custom Web Builds | Section 3 & 4</Text>
        </View>

        <Text style={styles.sectionHeader}>3. MONTHLY MAINTENANCE RETAINER & SLA PLAN</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '60%' }]}>SELECTED CARE PLAN & SCOPE</Text>
            <Text style={[styles.tableHeaderCell, { width: '40%', textAlign: 'right' }]}>MONTHLY RETAINER</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowHighlight]} wrap={false}>
            <View style={{ width: '60%' }}>
              <Text style={styles.moduleTitle}>{cleanPDFText(data?.maintenancePlan) || 'Standard Care Plan'}</Text>
              <Text style={styles.moduleDesc}>Hosting support, daily DB backups, security updates, 2-4h monthly dev time</Text>
            </View>
            <View style={{ width: '40%', textAlign: 'right' }}>
              <Text style={styles.priceVal}>{maintenanceINR > 0 ? `INR ${maintenanceINR.toLocaleString()}/mo ($${maintenanceUSD}/mo)` : 'Complimentary 30-Day Warranty'}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeader}>4. BRAND ASSET & CONTENT INVENTORY</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Brand Assets Status:</Text>
          <Text style={styles.fieldVal}>{assetsStatus}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Visual & Competitor Inspo:</Text>
          <Text style={styles.fieldVal}>{cleanPDFText(data?.inspirationLinks) || 'None provided'}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Additional Scope Notes:</Text>
          <Text style={styles.fieldVal}>{cleanPDFText(data?.additionalNotes) || 'None specified'}</Text>
        </View>

        <PdfFooter theme={theme} leftText="CONFIDENTIAL SCOPING BRIEF & QUOTATION // GENERATED BY PRATEEQ.IN SCOPING LAB" />
      </Page>

      {/* ================= PAGE 3 ================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.docHeader}>
          <Text style={styles.docTitle}>STANDARD ENGAGEMENT TERMS & SIGN-OFF</Text>
          <Text style={styles.docMeta}>Prateeq Sharma | Engineering & Custom Web Builds | Section 5 & 6</Text>
        </View>

        <Text style={styles.sectionHeader}>5. STANDARD COMMERCIAL TERMS & CONDITIONS (T&C)</Text>
        <View style={{ marginBottom: 10 }}>
          {terms.map((term, idx) => (
            <Text key={idx} style={styles.termItem}>{cleanPDFText(term)}</Text>
          ))}
        </View>

        <Text style={styles.sectionHeader}>6. SIGNATURE & ACCEPTANCE SIGN-OFF</Text>
        <View style={styles.sigContainer}>
          <View style={styles.sigBox}>
            <Text style={styles.sigTitle}>CLIENT AUTHORIZED SIGNATURE</Text>
            <Text style={styles.sigText}>NAME: {companyName}</Text>
            <Text style={styles.sigText}>DATE: _______________</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigTitle}>DEVELOPER AUTHORIZED SIGNATURE</Text>
            <Text style={styles.sigText}>NAME: Prateeq Sharma</Text>
            <Text style={styles.sigText}>TITLE: Principal Engineer & Lead Architect</Text>
            <Text style={styles.sigText}>DATE: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          </View>
        </View>

        <PdfFooter theme={theme} leftText="CONFIDENTIAL SCOPING BRIEF & QUOTATION // GENERATED BY PRATEEQ.IN SCOPING LAB" />
      </Page>
    </Document>
  );
}
