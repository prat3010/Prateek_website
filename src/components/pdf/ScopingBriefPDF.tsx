import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/data/resume';
import type { QuestionnaireData } from '@/utils/pdfGenerator';
import { SkylineImageHeader } from './SkylineImageHeader';

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    fontSize: 9,
    color: '#0F172A',
  },
  docHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderBottomStyle: 'solid',
    paddingBottom: 6,
    marginBottom: 12,
  },
  docTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  docMeta: {
    fontSize: 7.5,
    color: '#64748B',
    marginTop: 3,
  },
  metadataCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 10,
    marginBottom: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaCol: {
    width: '50%',
    marginBottom: 4,
  },
  metaLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    fontSize: 8,
  },
  metaVal: {
    color: '#0F172A',
    fontSize: 8.5,
  },
  sectionHeader: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1E3A8A',
    backgroundColor: '#EFF6FF',
    padding: '4 8',
    borderRadius: 3,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
    borderLeftStyle: 'solid',
  },
  table: {
    width: '100%',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderBottomStyle: 'solid',
    padding: 6,
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#1E293B',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderBottomStyle: 'solid',
    padding: 6,
    alignItems: 'center',
  },
  tableRowHighlight: {
    backgroundColor: '#F0F9FF',
  },
  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    padding: 7,
    alignItems: 'center',
  },
  colModule: {
    width: '65%',
  },
  colPrice: {
    width: '35%',
    textAlign: 'right',
  },
  moduleTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: '#0F172A',
  },
  moduleDesc: {
    fontSize: 7.5,
    color: '#64748B',
    marginTop: 1,
  },
  priceVal: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: '#0284C7',
  },
  totalTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#FFFFFF',
  },
  totalVal: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#38BDF8',
    textAlign: 'right',
  },
  fieldRow: {
    marginBottom: 6,
    flexDirection: 'row',
  },
  fieldLabel: {
    fontFamily: 'Helvetica-Bold',
    width: '32%',
    color: '#334155',
    fontSize: 8.5,
  },
  fieldVal: {
    width: '68%',
    color: '#0F172A',
    fontSize: 8.5,
  },
  termItem: {
    marginBottom: 6,
    fontSize: 8,
    color: '#334155',
    lineHeight: 1.4,
  },
  sigContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  sigBox: {
    width: '48%',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 8,
    height: 58,
  },
  sigTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: '#64748B',
    marginBottom: 12,
  },
  sigText: {
    fontSize: 8,
    color: '#0F172A',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 28,
    right: 28,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderTopStyle: 'solid',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#94A3B8',
  },
});

interface ScopingBriefPDFProps {
  resumeData?: ResumeData | null;
  data?: QuestionnaireData;
}

export function ScopingBriefPDF({ resumeData, data }: ScopingBriefPDFProps) {
  const intakeConfig = resumeData?.intake;

  const totalINR = data?.totalBuildCostINR || 143000;
  const totalUSD = data?.totalBuildCostUSD || 1710;
  const maintenanceINR = data?.maintenanceCostINR ?? 6500;
  const maintenanceUSD = data?.maintenanceCostUSD ?? 80;

  const terms = intakeConfig?.termsAndConditions || [
    "1. Payment Milestone Structure: 50% Upfront Deposit required to initiate design mockups & architecture setup. 30% Milestone Payment upon design approval & core build. 20% Final Payment prior to domain mapping & production deployment.",
    "2. Scope Creep & Change Orders: Any feature, page, or integration requested after signing that is not listed in Section 2 will be classified as a 'Change Order' and quoted separately under a Phase 2 add-on contract.",
    "3. Revision Policy: Includes up to 2 rounds of comprehensive design/layout revisions. Revision requests must be provided in writing within 5 business days of draft delivery.",
    "4. Client Dependencies: Timeline countdown begins ONLY after receiving all required client assets (text, logo, media, API credentials). Client delays in asset delivery will extend final delivery date accordingly.",
    "5. Intellectual Property (IP) Ownership: 100% Intellectual Property and code ownership transfer to Client upon receipt of final payment.",
    "6. Infrastructure & Hosting: Hosting (Vercel), Database (Supabase), Domain Registration, and API costs (OpenAI/Resend) are billed directly to client-owned accounts. Developer is not liable for third-party outages.",
    "7. Maintenance Retainer & SLA: Selected Care Plan is billed monthly post-launch. Includes defined SLA response times, automated backups, and dedicated monthly development hours."
  ];

  const renderFooter = (pageNum: number) => (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>CONFIDENTIAL SCOPING BRIEF & QUOTATION // GENERATED BY PRATEEQ.IN SCOPING LAB</Text>
      <Text style={styles.footerText}>Page {pageNum} of 3 | https://prateeq.in</Text>
    </View>
  );

  return (
    <Document title={`${data?.companyName || 'Client'}_Itemized_Scoping_Proposal`}>
      {/* ================= PAGE 1 ================= */}
      <Page size="A4" style={styles.page}>
        <SkylineImageHeader
          title="PRATEEQ.IN"
          sub="FULL-STACK & AI ARCHITECTURE // SCOPING & QUOTATION"
          theme="noir"
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
            <Text style={styles.metaVal}>{data?.companyName || '___________________________'}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>CONTACT EMAIL</Text>
            <Text style={styles.metaVal}>{data?.contactEmail || '___________________________'}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>PHONE / WHATSAPP</Text>
            <Text style={styles.metaVal}>{data?.contactPhone || '___________________________'}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>TARGET LAUNCH SPRINT</Text>
            <Text style={styles.metaVal}>{data?.timeline || 'Standard Turnaround (2–4 Weeks)'}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>1. BUSINESS OBJECTIVES & AUDIENCE PERSONA</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Primary Business Goal:</Text>
          <Text style={styles.fieldVal}>{data?.projectGoal || 'Lead Generation & Direct Sales'}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Target Audience Persona:</Text>
          <Text style={styles.fieldVal}>{data?.targetAudience || 'Tech Founders, SMB Owners, B2B Clients'}</Text>
        </View>

        <Text style={styles.sectionHeader}>2. ITEMIZED COMMERCIAL INVESTMENT SUMMARY</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colModule]}>ARCHITECTURE ENGINE & MODULE LINE ITEMS</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>COMMERCIAL VALUE</Text>
          </View>

          <View style={[styles.tableRow, styles.tableRowHighlight]}>
            <View style={styles.colModule}>
              <Text style={styles.moduleTitle}>Base Architecture Engine ({data?.projectCategory || 'Multi-Page Web App Engine'})</Text>
              <Text style={styles.moduleDesc}>Next.js 16 App Router, Responsive Motion UI, Telemetry, SEO Schema, Vercel Setup</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.priceVal}>Base Included</Text>
            </View>
          </View>

          {data?.features?.map((feat, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={styles.colModule}>
                <Text style={styles.moduleTitle}>{feat}</Text>
                <Text style={styles.moduleDesc}>Production-grade module integration & automated testing</Text>
              </View>
              <View style={styles.colPrice}>
                <Text style={styles.priceVal}>Included in Scope</Text>
              </View>
            </View>
          ))}

          <View style={styles.tableRow}>
            <View style={styles.colModule}>
              <Text style={styles.moduleTitle}>Brand Identity & Copywriting Readiness</Text>
              <Text style={styles.moduleDesc}>{data?.assetsStatus || 'All Brand Assets Ready'}</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.priceVal}>Included</Text>
            </View>
          </View>

          <View style={styles.tableTotalRow}>
            <View style={styles.colModule}>
              <Text style={styles.totalTitle}>ESTIMATED TOTAL BUILD INVESTMENT</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.totalVal}>{`₹${totalINR.toLocaleString()} / $${totalUSD.toLocaleString()}`}</Text>
            </View>
          </View>
        </View>

        {renderFooter(1)}
      </Page>

      {/* ================= PAGE 2 ================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.docHeader}>
          <Text style={styles.docTitle}>MONTHLY MAINTENANCE & INFRASTRUCTURE CARE</Text>
          <Text style={styles.docMeta}>Prateeq Sharma | Engineering & Custom Web Builds | Page 2 of 3</Text>
        </View>

        <Text style={styles.sectionHeader}>3. MONTHLY MAINTENANCE RETAINER & SLA PLAN</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '60%' }]}>SELECTED CARE PLAN & SCOPE</Text>
            <Text style={[styles.tableHeaderCell, { width: '40%', textAlign: 'right' }]}>MONTHLY RETAINER</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowHighlight]}>
            <View style={{ width: '60%' }}>
              <Text style={styles.moduleTitle}>{data?.maintenancePlan || 'Standard Care Plan'}</Text>
              <Text style={styles.moduleDesc}>Hosting support, daily DB backups, security updates, 2-4h monthly dev time</Text>
            </View>
            <View style={{ width: '40%', textAlign: 'right' }}>
              <Text style={styles.priceVal}>{maintenanceINR > 0 ? `₹${maintenanceINR.toLocaleString()}/mo ($${maintenanceUSD}/mo)` : 'Complimentary 30-Day Warranty'}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeader}>4. BRAND ASSET & CONTENT INVENTORY</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Brand Assets Status:</Text>
          <Text style={styles.fieldVal}>{data?.assetsStatus || 'All Brand Assets Ready'}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Visual & Competitor Inspo:</Text>
          <Text style={styles.fieldVal}>{data?.inspirationLinks || 'Stripe.com, Vercel.com'}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Additional Scope Notes:</Text>
          <Text style={styles.fieldVal}>{data?.additionalNotes || 'None specified'}</Text>
        </View>

        {renderFooter(2)}
      </Page>

      {/* ================= PAGE 3 ================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.docHeader}>
          <Text style={styles.docTitle}>STANDARD ENGAGEMENT TERMS & SIGN-OFF</Text>
          <Text style={styles.docMeta}>Prateeq Sharma | Engineering & Custom Web Builds | Page 3 of 3</Text>
        </View>

        <Text style={styles.sectionHeader}>5. STANDARD COMMERCIAL TERMS & CONDITIONS (T&C)</Text>
        <View style={{ marginBottom: 10 }}>
          {terms.map((term, idx) => (
            <Text key={idx} style={styles.termItem}>{term}</Text>
          ))}
        </View>

        <Text style={styles.sectionHeader}>6. SIGNATURE & ACCEPTANCE SIGN-OFF</Text>
        <View style={styles.sigContainer}>
          <View style={styles.sigBox}>
            <Text style={styles.sigTitle}>CLIENT AUTHORIZED SIGNATURE</Text>
            <Text style={styles.sigText}>NAME: {data?.companyName || '______________________'}</Text>
            <Text style={styles.sigText}>DATE: _______________</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigTitle}>DEVELOPER AUTHORIZED SIGNATURE</Text>
            <Text style={styles.sigText}>NAME: Prateeq Sharma</Text>
            <Text style={styles.sigText}>TITLE: Principal Engineer & Lead Architect</Text>
            <Text style={styles.sigText}>DATE: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          </View>
        </View>

        {renderFooter(3)}
      </Page>
    </Document>
  );
}
