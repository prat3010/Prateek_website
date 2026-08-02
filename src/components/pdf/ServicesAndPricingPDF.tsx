import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Line } from '@react-pdf/renderer';
import type { ResumeData } from '@/data/resume';
import { DEFAULT_PDF_THEME } from './pdfTheme';

function cleanPDFText(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/₹/g, 'INR ')
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

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
  skylineHeader: {
    height: 48,
    backgroundColor: DEFAULT_PDF_THEME.headerBg,
    borderRadius: 4,
    marginBottom: 12,
    padding: 10,
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
  metadataCard: {
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
    color: '#475569',
    fontSize: 7.5,
  },
  metaVal: {
    color: '#0F172A',
    fontSize: 8,
  },
  sectionHeader: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
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
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    padding: 5,
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: '#1E293B',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    padding: 5,
    alignItems: 'center',
  },
  tableRowHighlight: {
    backgroundColor: '#F0F9FF',
  },
  colEngine: {
    width: '40%',
  },
  colScope: {
    width: '35%',
  },
  colPrice: {
    width: '25%',
    textAlign: 'right',
  },
  itemTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#0F172A',
  },
  itemDesc: {
    fontSize: 7,
    color: '#64748B',
    marginTop: 1,
  },
  moduleTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#0F172A',
  },
  moduleDesc: {
    fontSize: 7,
    color: '#64748B',
    marginTop: 1,
  },
  priceVal: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#0284C7',
  },
  termItem: {
    marginBottom: 5,
    fontSize: 7.5,
    color: '#334155',
    lineHeight: 1.35,
  },
  contactBox: {
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: '#F8FAFC',
    padding: 8,
    marginTop: 8,
  },
  contactTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#0F172A',
    marginBottom: 3,
  },
  contactText: {
    fontSize: 7.5,
    color: '#475569',
    lineHeight: 1.35,
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
});

interface ServicesAndPricingPDFProps {
  resumeData?: ResumeData | null;
}

export function ServicesAndPricingPDF({ resumeData }: ServicesAndPricingPDFProps) {
  const intakeConfig = resumeData?.intake;

  const terms = intakeConfig?.termsAndConditions || [
    "1. Payment Milestone Structure: 50% Upfront Deposit required to initiate development & architecture setup. 50% Final Balance prior to domain mapping & production handover.",
    "2. Scope Creep & Change Orders: Features requested after contract sign-off not in original specification will be quoted separately under a Phase 2 add-on contract.",
    "3. Revision Policy: Includes up to 2 rounds of comprehensive design/layout revisions. Revision requests must be provided in writing within 5 business days of draft delivery.",
    "4. Client Dependencies: Timeline countdown begins ONLY after receiving all required client assets (copy, logo, media, API keys). Client delays extend final delivery date accordingly.",
    "5. Intellectual Property (IP) Transfer: 100% Intellectual Property and codebase ownership transfer to Client upon receipt of final payment.",
    "6. Infrastructure & API Costs: Hosting (Vercel), Database (Supabase), Domain Registration, and API fees (Resend/OpenAI) are billed directly to client-owned accounts.",
    "7. Guaranteed Response SLA: Standard response time commitment within 24 hours for all active clients."
  ];

  const renderFooter = () => (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>COMMERCIAL SERVICES, PRICING & T&C GUIDE // PRATEEQ.IN</Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages} | https://prateeq.in`}
      />
    </View>
  );

  return (
    <Document title="Prateeq_Sharma_Services_And_Pricing_Guide">
      {/* ================= PAGE 1 ================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.skylineHeader}>
          <View>
            <Text style={styles.brandTitle}>PRATEEQ.IN</Text>
            <Text style={styles.brandSub}>FULL-STACK & AI ARCHITECTURE // COMMERCIAL RATE CARD</Text>
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
          <Text style={styles.docTitle}>COMMERCIAL SERVICES, PACKAGES & RATE CARD</Text>
          <Text style={styles.docMeta}>Prateeq Sharma | Principal Engineer & Lead Architect | REF: PRTQ-RATES-2026</Text>
        </View>

        <View style={styles.metadataCard}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>DOCUMENT ISSUE DATE</Text>
            <Text style={styles.metaVal}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>ENGINEERING DIRECT</Text>
            <Text style={styles.metaVal}>3010prateeksharma@gmail.com</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>PORTFOLIO WEBSITE</Text>
            <Text style={styles.metaVal}>https://prateeq.in</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>COMMERCIAL TERMS</Text>
            <Text style={styles.metaVal}>50% Upfront Deposit / 50% Delivery</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>1. BASE ARCHITECTURE ENGINES & BUILD TIERS</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colEngine]}>BUILD TIER & ENGINE</Text>
            <Text style={[styles.tableHeaderCell, styles.colScope]}>DELIVERABLE SCOPE</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>COMMERCIAL VALUE</Text>
          </View>

          <View style={styles.tableRow} wrap={false}>
            <View style={styles.colEngine}>
              <Text style={styles.moduleTitle}>Tier 1: High-Converting Landing Page</Text>
              <Text style={styles.moduleDesc}>Single-page responsive showcase for products or services</Text>
            </View>
            <View style={styles.colScope}>
              <Text style={styles.moduleDesc}>Custom Framer Motion, Lead Intake Form, Mobile Responsive, SEO Schema</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.priceVal}>INR 25k–45k / $300–$550</Text>
            </View>
          </View>

          <View style={[styles.tableRow, styles.tableRowHighlight]} wrap={false}>
            <View style={styles.colEngine}>
              <Text style={styles.moduleTitle}>Tier 2: Multi-Page Web App Engine</Text>
              <Text style={styles.moduleDesc}>Full corporate profile, services, and dynamic content pages</Text>
            </View>
            <View style={styles.colScope}>
              <Text style={styles.moduleDesc}>Next.js 16 App Router, Multi-Page Routing, CMS Integration, Telemetry</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.priceVal}>INR 45k–90k / $550–$1.1k</Text>
            </View>
          </View>

          <View style={styles.tableRow} wrap={false}>
            <View style={styles.colEngine}>
              <Text style={styles.moduleTitle}>Tier 3: SaaS MVP & Custom Web Application</Text>
              <Text style={styles.moduleDesc}>Interactive web application with auth & database backend</Text>
            </View>
            <View style={styles.colScope}>
              <Text style={styles.moduleDesc}>Supabase Database & Auth, Payment Gateway (Stripe/Razorpay), Admin Dashboard</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.priceVal}>INR 90k–1.5L+ / $1.1k+</Text>
            </View>
          </View>

          <View style={[styles.tableRow, styles.tableRowHighlight]} wrap={false}>
            <View style={styles.colEngine}>
              <Text style={styles.moduleTitle}>Tier 4: Enterprise AI RAG Platform</Text>
              <Text style={styles.moduleDesc}>Custom AI Assistant, Vector Search & Knowledge Base RAG</Text>
            </View>
            <View style={styles.colScope}>
              <Text style={styles.moduleDesc}>Retriever RAG Core, Vector Database, Hybrid Search, Citations, Admin Analytics</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.priceVal}>INR 1.5L+ / $1.8k+</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeader}>2. MONTHLY INFRASTRUCTURE & SLA CARE PLANS</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '35%' }]}>CARE PLAN</Text>
            <Text style={[styles.tableHeaderCell, { width: '45%' }]}>INCLUDED SERVICES</Text>
            <Text style={[styles.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>MONTHLY</Text>
          </View>
          <View style={styles.tableRow} wrap={false}>
            <View style={{ width: '35%' }}>
              <Text style={styles.moduleTitle}>Basic Care Plan</Text>
              <Text style={styles.moduleDesc}>Recommended for Landing Pages</Text>
            </View>
            <View style={{ width: '45%' }}>
              <Text style={styles.moduleDesc}>Hosting support, daily DB backups, security patches, uptime monitoring</Text>
            </View>
            <View style={{ width: '20%', textAlign: 'right' }}>
              <Text style={styles.priceVal}>INR 2,500 / $30</Text>
            </View>
          </View>
          <View style={[styles.tableRow, styles.tableRowHighlight]} wrap={false}>
            <View style={{ width: '35%' }}>
              <Text style={styles.moduleTitle}>Standard Care Plan</Text>
              <Text style={styles.moduleDesc}>Recommended for Web Apps & CMS</Text>
            </View>
            <View style={{ width: '45%' }}>
              <Text style={styles.moduleDesc}>Everything in Basic + 2-4h monthly dev time for content/layout updates</Text>
            </View>
            <View style={{ width: '20%', textAlign: 'right' }}>
              <Text style={styles.priceVal}>INR 6,500 / $80</Text>
            </View>
          </View>
          <View style={styles.tableRow} wrap={false}>
            <View style={{ width: '35%' }}>
              <Text style={styles.moduleTitle}>Premium AI & Dev SLA</Text>
              <Text style={styles.moduleDesc}>Recommended for SaaS & RAG Engines</Text>
            </View>
            <View style={{ width: '45%' }}>
              <Text style={styles.moduleDesc}>Priority 24h SLA, AI index tuning, dedicated monthly feature dev hours</Text>
            </View>
            <View style={{ width: '20%', textAlign: 'right' }}>
              <Text style={styles.priceVal}>INR 15,000 / $180</Text>
            </View>
          </View>
        </View>

        {renderFooter()}
      </Page>

      {/* ================= PAGE 2 ================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.docHeader}>
          <Text style={styles.docTitle}>STANDARD COMMERCIAL TERMS & CONDITIONS</Text>
          <Text style={styles.docMeta}>Prateeq Sharma | Engineering & Custom Web Builds | Page 2 of 2</Text>
        </View>

        <Text style={styles.sectionHeader}>3. ENGAGEMENT TERMS & CODEBASE HANDOVER POLICY</Text>
        <View style={{ marginBottom: 10 }}>
          {terms.map((term, idx) => (
            <Text key={idx} style={styles.termItem}>{cleanPDFText(term)}</Text>
          ))}
        </View>

        <Text style={styles.sectionHeader}>4. QUALITY GUARANTEES & RESPONSE COMMITMENTS</Text>
        <Text style={styles.paragraph}>
          Every project is built with production-ready TypeScript, modular architecture, responsive design, and aggressive server-side performance optimization. We commit to a maximum 24-hour response SLA for all commercial inquiries and active projects.
        </Text>

        <View style={styles.contactBox}>
          <Text style={styles.contactTitle}>READY TO SCOPE YOUR PROJECT?</Text>
          <Text style={styles.contactText}>
            Launch our interactive Scoping Brief Wizard at https://prateeq.in to configure your build tier, select custom add-on modules, and generate your customized line-item quotation in under 2 minutes.
          </Text>
          <Text style={[styles.contactText, { marginTop: 4, fontFamily: 'Helvetica-Bold' }]}>
            Direct Engineering Email: 3010prateeksharma@gmail.com | Web: https://prateeq.in
          </Text>
        </View>

        {renderFooter()}
      </Page>
    </Document>
  );
}
