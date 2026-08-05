import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type {
  BaseEngineItem,
  FeatureItem,
  BrandAssetOption,
  GoalArchetype,
  MaintenancePlanOption,
  ResumeData,
} from '@/data/resume';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import { getPdfTheme, type PDFThemeConfig } from './pdfTheme';
import { PdfBrandHeader } from './PdfBrandHeader';
import { PdfFooter } from './PdfFooter';

function cleanPDFText(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/₹/g, 'INR ')
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatPrice(inr: number, usd: number): string {
  if (inr === 0 && usd === 0) return 'INCLUDED';
  return `INR ${inr.toLocaleString('en-IN')} / $${usd}`;
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
      marginBottom: 8,
      marginTop: 8,
      borderLeftWidth: 3,
      borderLeftColor: theme.accentColor,
      letterSpacing: 0.05,
    },
    paragraph: {
      fontSize: 8,
      lineHeight: 1.5,
      color: theme.textSecondary,
      marginBottom: 8,
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
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      padding: '6 5',
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
      padding: '7 5',
      alignItems: 'flex-start',
    },
    tableRowHighlight: {
      backgroundColor: theme.tableRowAlt,
    },
    colEngine: {
      width: '40%',
      borderRightWidth: 1,
      borderRightColor: theme.cardBorder,
      paddingRight: 6,
    },
    colScope: {
      width: '35%',
      borderRightWidth: 1,
      borderRightColor: theme.cardBorder,
      paddingLeft: 6,
      paddingRight: 6,
    },
    colPrice: {
      width: '25%',
      textAlign: 'right',
      paddingLeft: 6,
    },
    colFeatureLabel: {
      width: '27%',
      borderRightWidth: 1,
      borderRightColor: theme.cardBorder,
      paddingRight: 6,
    },
    colFeatureDesc: {
      width: '33%',
      borderRightWidth: 1,
      borderRightColor: theme.cardBorder,
      paddingLeft: 6,
      paddingRight: 6,
    },
    colFeatureTech: {
      width: '25%',
      borderRightWidth: 1,
      borderRightColor: theme.cardBorder,
      paddingLeft: 6,
      paddingRight: 6,
    },
    colFeaturePrice: {
      width: '15%',
      textAlign: 'right',
      paddingLeft: 6,
    },
    colBrandLabel: {
      width: '35%',
      borderRightWidth: 1,
      borderRightColor: theme.cardBorder,
      paddingRight: 6,
    },
    colBrandDesc: {
      width: '45%',
      borderRightWidth: 1,
      borderRightColor: theme.cardBorder,
      paddingLeft: 6,
      paddingRight: 6,
    },
    colBrandPrice: {
      width: '20%',
      textAlign: 'right',
      paddingLeft: 6,
    },
    colGoalLabel: {
      width: '22%',
      borderRightWidth: 1,
      borderRightColor: theme.cardBorder,
      paddingRight: 6,
    },
    colGoalDesc: {
      width: '25%',
      borderRightWidth: 1,
      borderRightColor: theme.cardBorder,
      paddingLeft: 6,
      paddingRight: 6,
    },
    colGoalEngine: {
      width: '25%',
      borderRightWidth: 1,
      borderRightColor: theme.cardBorder,
      paddingLeft: 6,
      paddingRight: 6,
    },
    colGoalAddons: {
      width: '28%',
      paddingLeft: 6,
    },
    colCare: {
      width: '22%',
      borderRightWidth: 1,
      borderRightColor: theme.cardBorder,
      paddingRight: 6,
    },
    colCareIncludes: {
      width: '38%',
      borderRightWidth: 1,
      borderRightColor: theme.cardBorder,
      paddingLeft: 6,
      paddingRight: 6,
    },
    colCareTech: {
      width: '25%',
      borderRightWidth: 1,
      borderRightColor: theme.cardBorder,
      paddingLeft: 6,
      paddingRight: 6,
    },
    colCarePrice: {
      width: '15%',
      textAlign: 'right',
      paddingLeft: 6,
    },
    moduleTitle: {
      fontFamily: theme.labelBoldFont,
      fontSize: 7,
      color: theme.textPrimary,
      letterSpacing: 0.02,
      marginBottom: 2,
    },
    moduleDesc: {
      fontSize: 7,
      color: theme.textSecondary,
      lineHeight: 1.5,
    },
    bullet: {
      fontSize: 6.5,
      color: theme.textSecondary,
      lineHeight: 1.6,
    },
    priceVal: {
      fontFamily: theme.labelBoldFont,
      fontSize: 7.5,
      color: theme.accentColor,
    },
    pricePeriod: {
      fontSize: 6.5,
      color: theme.textSecondary,
      marginTop: 2,
    },
    termItem: {
      marginBottom: 8,
      fontSize: 7.5,
      color: theme.textSecondary,
      lineHeight: 1.5,
    },
    contactBox: {
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 4,
      backgroundColor: theme.cardBg,
      borderLeftWidth: 3,
      borderLeftColor: theme.accentColor,
      padding: 8,
      marginTop: 8,
    },
    contactTitle: {
      fontFamily: theme.labelBoldFont,
      fontSize: 7.5,
      color: theme.accentColor,
      marginBottom: 3,
      letterSpacing: 0.05,
    },
    contactText: {
      fontSize: 7.5,
      color: theme.textSecondary,
      lineHeight: 1.35,
    },
  });
}

interface ServicesAndPricingPDFProps {
  resumeData?: ResumeData | null;
  isNoir?: boolean;
}

export function ServicesAndPricingPDF({ resumeData, isNoir }: ServicesAndPricingPDFProps) {
  const theme = getPdfTheme(!!isNoir);
  const styles = createStyles(theme);
  const intakeConfig = resumeData?.intake;

  // All sections resolve from live Supabase data (via intakeConfig) with JSON fallback.
  // No hardcoded rows — adding/editing anything in the Synchronizer auto-updates the PDF.
  const engines: BaseEngineItem[] = intakeConfig?.engines?.length
    ? intakeConfig.engines
    : questionnaireDefaults.engines;

  const features: FeatureItem[] = intakeConfig?.features?.length
    ? intakeConfig.features
    : (questionnaireDefaults.features as FeatureItem[]);

  const brandAssets: BrandAssetOption[] = intakeConfig?.brandAssets?.length
    ? intakeConfig.brandAssets
    : (questionnaireDefaults.brandAssets as BrandAssetOption[]);

  const goals: GoalArchetype[] = intakeConfig?.goals?.length
    ? intakeConfig.goals
    : (questionnaireDefaults.goals as GoalArchetype[]);

  const maintenancePlans: MaintenancePlanOption[] = intakeConfig?.maintenancePlans?.length
    ? intakeConfig.maintenancePlans
    : questionnaireDefaults.maintenancePlans;

  const terms: string[] = intakeConfig?.termsAndConditions?.length
    ? intakeConfig.termsAndConditions
    : [
        '1. Payment Milestone Structure: 50% Upfront Deposit required to initiate development & architecture setup. 50% Final Balance prior to domain mapping & production handover.',
        '2. Scope Creep & Change Orders: Features requested after contract sign-off not in original specification will be quoted separately under a Phase 2 add-on contract.',
        '3. Revision Policy: Includes up to 2 rounds of comprehensive design/layout revisions. Revision requests must be provided in writing within 5 business days of draft delivery.',
        '4. Client Dependencies: Timeline countdown begins ONLY after receiving all required client assets (copy, logo, media, API keys). Client delays extend final delivery date accordingly.',
        '5. Intellectual Property (IP) Transfer: 100% Intellectual Property and codebase ownership transfer to Client upon receipt of final payment.',
        '6. Infrastructure & API Costs: Hosting (Vercel), Database (Supabase), Domain Registration, and API fees (Resend/OpenAI) are billed directly to client-owned accounts.',
        '7. Guaranteed Response SLA: Standard response time commitment within 24 hours for all active clients.',
      ];

  const FOOTER_TEXT = 'COMMERCIAL SERVICES, PRICING & T&C GUIDE // PRATEEQ.IN';

  function engineLabel(engineId: string): string {
    const engine = engines.find((e) => e.id === engineId);
    return engine ? `${engine.tier}: ${engine.title}` : engineId;
  }

  return (
    <Document title="Prateeq_Sharma_Services_And_Pricing_Guide">

      {/* PAGE 1 — Base Architecture Engines */}
      <Page size="A4" style={styles.page}>
        <PdfBrandHeader
          theme={theme}
          title="PRATEEQ.IN"
          subtitle="FULL-STACK & AI ARCHITECTURE // COMMERCIAL RATE CARD"
        />

        <View style={styles.docHeader}>
          <Text style={styles.docTitle}>COMMERCIAL SERVICES, PACKAGES & RATE CARD</Text>
          <Text style={styles.docMeta}>
            Prateeq Sharma | Principal Engineer & Lead Architect | REF: PRTQ-RATES-2026
          </Text>
        </View>

        <View style={styles.metadataCard}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>DOCUMENT ISSUE DATE</Text>
            <Text style={styles.metaVal}>
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>ENGINEERING DIRECT</Text>
            <Text style={styles.metaVal}>prateeqsharma@gmail.com</Text>
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
          {engines.map((engine, idx) => (
            <View
              key={engine.id}
              wrap={false}
              style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowHighlight] : styles.tableRow}
            >
              <View style={styles.colEngine}>
                <Text style={styles.moduleTitle}>{engine.tier}: {engine.title}</Text>
                <Text style={styles.moduleDesc}>{engine.laymanDescription}</Text>
              </View>
              <View style={styles.colScope}>
                <Text style={styles.moduleDesc}>{engine.techSpecs}</Text>
              </View>
              <View style={styles.colPrice}>
                <Text style={styles.priceVal}>{formatPrice(engine.priceINR, engine.priceUSD)}</Text>
              </View>
            </View>
          ))}
        </View>

        <PdfFooter theme={theme} leftText={FOOTER_TEXT} />
      </Page>

      {/* PAGE 2 — Feature Add-Ons + Brand & Content Services */}
      <Page size="A4" style={styles.page}>

        <Text style={[styles.sectionHeader, { marginTop: 0 }]}>2. FEATURE ADD-ON MODULES</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colFeatureLabel]}>ADD-ON MODULE</Text>
            <Text style={[styles.tableHeaderCell, styles.colFeatureDesc]}>WHAT IT DELIVERS</Text>
            <Text style={[styles.tableHeaderCell, styles.colFeatureTech]}>TECHNICAL STACK</Text>
            <Text style={[styles.tableHeaderCell, styles.colFeaturePrice]}>ADD-ON PRICE</Text>
          </View>
          {features.map((feature, idx) => (
            <View
              key={feature.id}
              wrap={false}
              style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowHighlight] : styles.tableRow}
            >
              <View style={styles.colFeatureLabel}>
                <Text style={styles.moduleTitle}>{feature.label}</Text>
              </View>
              <View style={styles.colFeatureDesc}>
                <Text style={styles.moduleDesc}>{feature.laymanDescription}</Text>
              </View>
              <View style={styles.colFeatureTech}>
                <Text style={styles.moduleDesc}>{feature.techSpecs}</Text>
              </View>
              <View style={styles.colFeaturePrice}>
                <Text style={styles.priceVal}>{formatPrice(feature.priceINR, feature.priceUSD)}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeader}>3. BRAND & CONTENT SERVICES</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colBrandLabel]}>SERVICE TIER</Text>
            <Text style={[styles.tableHeaderCell, styles.colBrandDesc]}>DESCRIPTION</Text>
            <Text style={[styles.tableHeaderCell, styles.colBrandPrice]}>PRICE</Text>
          </View>
          {brandAssets.map((asset, idx) => (
            <View
              key={asset.id}
              wrap={false}
              style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowHighlight] : styles.tableRow}
            >
              <View style={styles.colBrandLabel}>
                <Text style={styles.moduleTitle}>{asset.label}</Text>
              </View>
              <View style={styles.colBrandDesc}>
                <Text style={styles.moduleDesc}>{asset.description}</Text>
              </View>
              <View style={styles.colBrandPrice}>
                <Text style={styles.priceVal}>{formatPrice(asset.priceINR, asset.priceUSD)}</Text>
              </View>
            </View>
          ))}
        </View>

        <PdfFooter theme={theme} leftText={FOOTER_TEXT} />
      </Page>

      {/* PAGE 3 — Goal Archetypes + Care Plans */}
      <Page size="A4" style={styles.page}>

        <Text style={[styles.sectionHeader, { marginTop: 0 }]}>4. PROJECT GOAL ARCHETYPES & RECOMMENDED CONFIGURATIONS</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colGoalLabel]}>PROJECT GOAL</Text>
            <Text style={[styles.tableHeaderCell, styles.colGoalDesc]}>DESCRIPTION</Text>
            <Text style={[styles.tableHeaderCell, styles.colGoalEngine]}>RECOMMENDED ENGINE</Text>
            <Text style={[styles.tableHeaderCell, styles.colGoalAddons]}>COMPULSORY ADD-ONS</Text>
          </View>
          {goals.map((goal, idx) => (
            <View
              key={goal.id}
              wrap={false}
              style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowHighlight] : styles.tableRow}
            >
              <View style={styles.colGoalLabel}>
                <Text style={styles.moduleTitle}>{cleanPDFText(goal.label)}</Text>
              </View>
              <View style={styles.colGoalDesc}>
                <Text style={styles.moduleDesc}>{goal.description}</Text>
              </View>
              <View style={styles.colGoalEngine}>
                <Text style={styles.moduleDesc}>{engineLabel(goal.recommendedEngineId)}</Text>
              </View>
              <View style={styles.colGoalAddons}>
                {goal.compulsoryFeatureLabels.length > 0
                  ? goal.compulsoryFeatureLabels.map((label, i) => (
                      <Text key={i} style={styles.bullet}>• {label}</Text>
                    ))
                  : (
                      <Text style={styles.moduleDesc}>
                        Client-defined scope — convey your requirements to receive a bespoke quote.
                      </Text>
                    )
                }
              </View>
            </View>
          ))}
        </View>

        <PdfFooter theme={theme} leftText={FOOTER_TEXT} />
      </Page>

      {/* PAGE 4 — Care Plans + T&C + Quality Guarantee + CTA */}
      <Page size="A4" style={styles.page}>

        <Text style={[styles.sectionHeader, { marginTop: 0 }]}>5. MONTHLY INFRASTRUCTURE & SLA CARE PLANS</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colCare]}>CARE PLAN</Text>
            <Text style={[styles.tableHeaderCell, styles.colCareIncludes]}>INCLUDED SERVICES</Text>
            <Text style={[styles.tableHeaderCell, styles.colCareTech]}>TECHNICAL SCOPE</Text>
            <Text style={[styles.tableHeaderCell, styles.colCarePrice]}>MONTHLY</Text>
          </View>
          {maintenancePlans.map((plan, idx) => (
            <View
              key={plan.id}
              wrap={false}
              style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowHighlight] : styles.tableRow}
            >
              <View style={styles.colCare}>
                <Text style={styles.moduleTitle}>{plan.name}</Text>
                <Text style={styles.moduleDesc}>{cleanPDFText(plan.badge)}</Text>
              </View>
              <View style={styles.colCareIncludes}>
                {plan.includes.map((item, i) => (
                  <Text key={i} style={styles.bullet}>• {item}</Text>
                ))}
              </View>
              <View style={styles.colCareTech}>
                <Text style={styles.moduleDesc}>{plan.techSpecs}</Text>
              </View>
              <View style={styles.colCarePrice}>
                <Text style={styles.priceVal}>{formatPrice(plan.priceINR, plan.priceUSD)}</Text>
                {plan.period ? <Text style={styles.pricePeriod}>{plan.period}</Text> : null}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.docHeader}>
          <Text style={styles.docTitle}>STANDARD COMMERCIAL TERMS & CONDITIONS</Text>
          <Text style={styles.docMeta}>
            Prateeq Sharma | Engineering & Custom Web Builds | REF: PRTQ-RATES-2026
          </Text>
        </View>

        <Text style={styles.sectionHeader}>6. ENGAGEMENT TERMS & CODEBASE HANDOVER POLICY</Text>
        <View style={{ marginBottom: 10 }}>
          {terms.map((term, idx) => (
            <Text key={idx} style={styles.termItem}>{cleanPDFText(term)}</Text>
          ))}
        </View>

        <Text style={styles.sectionHeader}>7. QUALITY GUARANTEES & RESPONSE COMMITMENTS</Text>
        <Text style={styles.paragraph}>
          Every project is built with production-ready TypeScript, modular architecture, responsive design, and
          aggressive server-side performance optimisation. We commit to a maximum 24-hour response SLA for all
          commercial inquiries and active projects.
        </Text>

        <View style={styles.contactBox}>
          <Text style={styles.contactTitle}>READY TO SCOPE YOUR PROJECT?</Text>
          <Text style={styles.contactText}>
            Launch our interactive Project Scoping Lab & Instant Quote wizard at https://prateeq.in/scoping to
            configure your build tier, select custom add-on modules, and generate your customised line-item
            quotation in under 2 minutes.
          </Text>
          <Text style={[styles.contactText, { marginTop: 4, fontFamily: theme.labelBoldFont }]}>
            Direct Engineering Email: prateeqsharma@gmail.com | Web: https://prateeq.in
          </Text>
        </View>

        <PdfFooter theme={theme} leftText={FOOTER_TEXT} />
      </Page>

    </Document>
  );
}
