import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Line } from '@react-pdf/renderer';
import type { ResumeData } from '@/data/resume';
import type { QuestionnaireData } from '@/utils/pdfGenerator';

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    fontSize: 9,
    color: '#0F172A',
  },
  skylineHeader: {
    height: 52,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    marginBottom: 14,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  brandSub: {
    fontSize: 7.5,
    color: '#94A3B8',
    marginTop: 3,
    letterSpacing: 0.5,
  },
  docHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderBottomStyle: 'solid',
    paddingBottom: 6,
    marginBottom: 12,
  },
  docTitle: {
    fontSize: 14,
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
  tableRowSelected: {
    backgroundColor: '#F0F9FF',
  },
  colCheck: {
    width: '10%',
  },
  colTier: {
    width: '45%',
    paddingRight: 6,
  },
  colScope: {
    width: '45%',
  },
  checkBadge: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#0284C7',
  },
  tierName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: '#0F172A',
  },
  tierScope: {
    fontSize: 8,
    color: '#475569',
  },
  featRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderBottomStyle: 'solid',
  },
  featName: {
    fontSize: 8,
    color: '#1E293B',
    width: '65%',
  },
  badgeIncluded: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: '#0369A1',
    backgroundColor: '#E0F2FE',
    padding: '2 6',
    borderRadius: 3,
  },
  badgeExcluded: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: '#94A3B8',
    backgroundColor: '#F1F5F9',
    padding: '2 6',
    borderRadius: 3,
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
    marginTop: 16,
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

  const budgetTiers = [
    { title: "Tier 1: High-Converting Landing Page", price: "₹25,000 – ₹45,000 ($300 – $550)", scope: "Responsive Motion UI, SEO Engine, Lead Contact Form, ReCAPTCHA Protection" },
    { title: "Tier 2: Custom Multi-Page Web App", price: "₹45,000 – ₹90,000 ($550 – $1,100)", scope: "Multi-page App, Supabase Auth, Client Portal, Headless Blog CMS" },
    { title: "Tier 3: Full-Stack Web App / AI RAG", price: "₹90,000 – ₹1.5L+ ($1,100 – $2,000+)", scope: "Full-Stack SaaS MVP, Private AI RAG Search Engine, Admin Dashboard" },
    { title: "Custom Scope / Infrastructure", price: "Enterprise Quote", scope: "Bespoke Microservices, Custom AI Pipelines, Enterprise SLA" }
  ];

  const featureOptions = intakeConfig?.featureOptions || [
    "Contact Form / Lead Capture (ReCAPTCHA Protected)",
    "Payment Gateway (Stripe/Razorpay)",
    "User Auth & Client Portal (Google/Magic Link)",
    "Headless Blog / CMS Content Management",
    "Private AI Knowledge Base / Vector Search (RAG)",
    "Admin Dashboard & Role Access Control",
    "Automated Email Workflows (Resend Transactional)",
    "Privacy-Compliant Analytics & Visitor Telemetry"
  ];

  const terms = intakeConfig?.termsAndConditions || [
    "1. Payment Milestone Structure: 50% Upfront Deposit required to initiate design mockups & architecture setup. 30% Milestone Payment upon design approval & core build. 20% Final Payment prior to domain mapping & production deployment.",
    "2. Scope Creep & Change Orders: Any feature, page, or integration requested after signing that is not listed in Section 2 will be classified as a 'Change Order' and quoted separately under a Phase 2 add-on contract.",
    "3. Revision Policy: Includes up to 2 rounds of comprehensive design/layout revisions. Revision requests must be provided in writing within 5 business days of draft delivery.",
    "4. Client Dependencies: Timeline countdown begins ONLY after receiving all required client assets (text, logo, media, API credentials). Client delays in asset delivery will extend final delivery date accordingly.",
    "5. Intellectual Property (IP) Ownership: 100% Intellectual Property and code ownership transfer to Client upon receipt of final payment.",
    "6. Infrastructure & Hosting: Hosting (Vercel), Database (Supabase), Domain Registration, and API costs (OpenAI/Resend) are billed directly to client-owned accounts. Developer is not liable for third-party outages.",
    "7. Post-Launch Warranty: Includes 30 days of complimentary technical support & bug fixes post-launch. Continued support is available under a Monthly Care Plan."
  ];

  const renderFooter = (pageNum: number) => (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>CONFIDENTIAL SCOPING BRIEF // GENERATED BY PRATEEQ.IN SCOPING LAB</Text>
      <Text style={styles.footerText}>Page {pageNum} of 3 | https://prateeq.in</Text>
    </View>
  );

  return (
    <Document title={`${data?.companyName || 'Client'}_Scoping_Brief_Agreement`}>
      {/* ================= PAGE 1 ================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.skylineHeader}>
          <View>
            <Text style={styles.brandTitle}>PRATEEQ.IN</Text>
            <Text style={styles.brandSub}>FULL-STACK & AI ARCHITECTURE // SCOPING SPECIFICATION</Text>
          </View>
          <Svg height="30" width="120">
            <Line x1="0" y1="30" x2="120" y2="30" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="10" y1="30" x2="10" y2="18" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="10" y1="18" x2="22" y2="18" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="22" y1="18" x2="22" y2="30" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="30" y1="30" x2="30" y2="10" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="30" y1="10" x2="45" y2="10" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="37.5" y1="10" x2="37.5" y2="4" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="45" y1="10" x2="45" y2="30" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="55" y1="30" x2="55" y2="15" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="55" y1="15" x2="70" y2="15" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="70" y1="15" x2="70" y2="30" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="80" y1="30" x2="80" y2="8" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="80" y1="8" x2="95" y2="8" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="95" y1="8" x2="95" y2="30" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="102" y1="30" x2="102" y2="20" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="102" y1="20" x2="114" y2="20" stroke="#38BDF8" strokeWidth="1" />
            <Line x1="114" y1="20" x2="114" y2="30" stroke="#38BDF8" strokeWidth="1" />
          </Svg>
        </View>

        <View style={styles.docHeader}>
          <Text style={styles.docTitle}>CLIENT DISCOVERY & SCOPING SPECIFICATION</Text>
          <Text style={styles.docMeta}>Prateeq Sharma | Engineering & Custom Web Builds | REF: PRTQ-SCOPE-2026</Text>
        </View>

        <View style={styles.metadataCard}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>DATE</Text>
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
            <Text style={styles.metaLabel}>TARGET LAUNCH DEADLINE</Text>
            <Text style={styles.metaVal}>{data?.timeline || 'Standard Turnaround (2–4 Weeks)'}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>1. BUSINESS OBJECTIVES & TARGET PERSONA</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Primary Business Goal:</Text>
          <Text style={styles.fieldVal}>{data?.projectGoal || 'Lead Generation & Direct Sales'}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Target Audience / Persona:</Text>
          <Text style={styles.fieldVal}>{data?.targetAudience || 'Tech Founders, SMB Owners, B2B Clients'}</Text>
        </View>

        <View style={{ marginTop: 8 }}>
          <Text style={styles.sectionHeader}>2. COMMERCIAL INVESTMENT TIERS (SELECT TARGET TIER)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colCheck]}>SELECT</Text>
              <Text style={[styles.tableHeaderCell, styles.colTier]}>TIER & COMMERCIAL VALUE</Text>
              <Text style={[styles.tableHeaderCell, styles.colScope]}>INCLUDED ARCHITECTURE SCOPE</Text>
            </View>
            {budgetTiers.map((tier, idx) => {
              const isSelected = data?.budgetRange?.includes(tier.title) || data?.budgetRange?.includes(tier.price) || (idx === 1 && !data?.budgetRange);
              return (
                <View key={idx} style={[styles.tableRow, isSelected ? styles.tableRowSelected : {}]}>
                  <View style={styles.colCheck}>
                    <Text style={styles.checkBadge}>{isSelected ? '[ ✓ ]' : '[   ]'}</Text>
                  </View>
                  <View style={styles.colTier}>
                    <Text style={styles.tierName}>{tier.title}</Text>
                    <Text style={{ fontSize: 7.5, color: '#0284C7', marginTop: 1 }}>{tier.price}</Text>
                  </View>
                  <View style={styles.colScope}>
                    <Text style={styles.tierScope}>{tier.scope}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {renderFooter(1)}
      </Page>

      {/* ================= PAGE 2 ================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.docHeader}>
          <Text style={styles.docTitle}>TECHNICAL ARCHITECTURE MATRIX & BRAND INVENTORY</Text>
          <Text style={styles.docMeta}>Prateeq Sharma | Engineering & Custom Web Builds | Page 2 of 3</Text>
        </View>

        <Text style={styles.sectionHeader}>3. TECHNICAL SCOPE MATRIX & FEATURE CHECKLIST</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '70%' }]}>FUNCTIONAL MODULE / FEATURE</Text>
            <Text style={[styles.tableHeaderCell, { width: '30%', textAlign: 'right' }]}>SCOPE STATUS</Text>
          </View>
          {featureOptions.map((feat, idx) => {
            const isSelected = data?.features?.includes(feat) || data?.features?.some(f => feat.toLowerCase().includes(f.toLowerCase())) || idx < 3;
            return (
              <View key={idx} style={styles.featRow}>
                <Text style={styles.featName}>{feat}</Text>
                <Text style={isSelected ? styles.badgeIncluded : styles.badgeExcluded}>
                  {isSelected ? '✓ INCLUDED IN SCOPE' : 'OUT OF SCOPE'}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionHeader}>4. BRAND ASSET & CONTENT INVENTORY</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Brand Assets Status:</Text>
          <Text style={styles.fieldVal}>{data?.assetsStatus || 'All Brand Assets Ready (Logo SVG, Copywriting, Media)'}</Text>
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
        <View style={{ marginBottom: 12 }}>
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
