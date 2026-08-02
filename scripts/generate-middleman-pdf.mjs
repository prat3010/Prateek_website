import ReactPDF from '@react-pdf/renderer';
import React from 'react';
import fs from 'fs';
import path from 'path';

const { Document, Page, Text, View, StyleSheet, Svg, Line } = ReactPDF;
const h = React.createElement;

async function generateMiddlemanAgreementPDF(selectedTheme = 'azure') {
  const resumeJsonPath = path.join(process.cwd(), 'src', 'data', 'resume.json');
  let resumeData = {};
  try {
    resumeData = JSON.parse(fs.readFileSync(resumeJsonPath, 'utf8'));
  } catch (e) {
    console.warn('Could not load resume.json, using defaults:', e);
  }

  const mm = resumeData?.intake?.middlemanAgreement || {};
  const partnerName = mm.partnerName || '[Partner Name]';
  const effectiveDate = mm.effectiveDate || 'August 2, 2026';
  const devName = mm.developerName || 'Prateeq Sharma';
  const devEmail = mm.developerEmail || '3010prateeksharma@gmail.com';
  const tier1Cut = mm.tier1Commission || '10%';
  const tier2Cut = mm.tier2Commission || '12%';
  const tier3Cut = mm.tier3Commission || '15%';

  const isNoir = selectedTheme === 'noir';

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

  const renderFooter = (pageNum) =>
    h(View, { style: styles.footer, fixed: true },
      h(Text, { style: styles.footerText }, 'SALES PARTNER & MIDDLEMAN AGREEMENT // CONFIDENTIAL'),
      h(Text, { style: styles.footerText }, `Page ${pageNum} of 2 | https://prateeq.in`)
    );

  const docElement = h(Document, { title: `${partnerName.replace(/\s+/g, '_')}_Sales_Partner_Agreement_${isNoir ? 'Noir' : 'Azure'}` },
    // PAGE 1
    h(Page, { size: 'A4', style: styles.page },
      h(View, { style: styles.headerBanner },
        h(View, null,
          h(Text, { style: styles.brandTitle }, 'PRATEEQ.IN'),
          h(Text, { style: styles.brandSub }, 'FULL-STACK & AI ARCHITECTURE // PARTNER FRAMEWORK')
        ),
        h(Svg, { height: '26', width: '100' },
          h(Line, { x1: '0', y1: '26', x2: '100', y2: '26', stroke: '#38BDF8', strokeWidth: '1' }),
          h(Line, { x1: '15', y1: '26', x2: '15', y2: '10', stroke: '#38BDF8', strokeWidth: '1' }),
          h(Line, { x1: '15', y1: '10', x2: '35', y2: '10', stroke: '#38BDF8', strokeWidth: '1' }),
          h(Line, { x1: '35', y1: '10', x2: '35', y2: '26', stroke: '#38BDF8', strokeWidth: '1' }),
          h(Line, { x1: '45', y1: '26', x2: '45', y2: '4', stroke: '#38BDF8', strokeWidth: '1' }),
          h(Line, { x1: '45', y1: '4', x2: '65', y2: '4', stroke: '#38BDF8', strokeWidth: '1' }),
          h(Line, { x1: '65', y1: '4', x2: '65', y2: '26', stroke: '#38BDF8', strokeWidth: '1' }),
          h(Line, { x1: '75', y1: '26', x2: '75', y2: '14', stroke: '#38BDF8', strokeWidth: '1' }),
          h(Line, { x1: '75', y1: '14', x2: '90', y2: '14', stroke: '#38BDF8', strokeWidth: '1' }),
          h(Line, { x1: '90', y1: '14', x2: '90', y2: '26', stroke: '#38BDF8', strokeWidth: '1' })
        )
      ),
      h(View, { style: styles.docHeader },
        h(Text, { style: styles.docTitle }, 'SALES PARTNER & MIDDLEMAN PARTNERSHIP AGREEMENT'),
        h(Text, { style: styles.docMeta }, 'Prateeq Sharma | Engineering & Custom Web Builds | REF: PRTQ-PARTNER-2026')
      ),
      h(View, { style: styles.metaCard },
        h(View, { style: styles.metaCol },
          h(Text, { style: styles.metaLabel }, 'EFFECTIVE DATE'),
          h(Text, { style: styles.metaVal }, effectiveDate)
        ),
        h(View, { style: styles.metaCol },
          h(Text, { style: styles.metaLabel }, 'DEVELOPER'),
          h(Text, { style: styles.metaVal }, `${devName} (prateeq.in)`)
        ),
        h(View, { style: styles.metaCol },
          h(Text, { style: styles.metaLabel }, 'PARTNER / SALES REP'),
          h(Text, { style: styles.metaVal }, partnerName)
        ),
        h(View, { style: styles.metaCol },
          h(Text, { style: styles.metaLabel }, 'CONTACT EMAIL'),
          h(Text, { style: styles.metaVal }, devEmail)
        )
      ),
      h(Text, { style: styles.sectionTitle }, '1. PURPOSE & ROLES OF ENGAGEMENT'),
      h(Text, { style: styles.paragraph },
        `This Agreement outlines the commercial terms, commission structure, payment schedules, and operational rules between ${devName} ("Developer") and ${partnerName} ("Sales Representative / Partner") for bringing client web development, custom software, and AI integration projects to the Developer.`
      ),
      h(Text, { style: styles.sectionTitle }, '2. COMMISSION TIER STRUCTURE & PAYOUT RATES'),
      h(View, { style: styles.table },
        h(View, { style: styles.tableHeader },
          h(Text, { style: [styles.tableCellBold, { width: '40%' }] }, 'PROJECT TIER & BUDGET RANGE'),
          h(Text, { style: [styles.tableCellBold, { width: '30%' }] }, 'PARTNER COMMISSION'),
          h(Text, { style: [styles.tableCellBold, { width: '30%' }] }, 'PAYOUT TIMELINE')
        ),
        h(View, { style: styles.tableRow },
          h(Text, { style: [styles.tableCell, { width: '40%' }] }, 'Tier 1: Landing Page (₹25k–₹45k / $300–$550)'),
          h(Text, { style: [styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }] }, tier1Cut),
          h(Text, { style: [styles.tableCell, { width: '30%' }] }, 'Within 48h of Client 50% Deposit')
        ),
        h(View, { style: styles.tableRow },
          h(Text, { style: [styles.tableCell, { width: '40%' }] }, 'Tier 2: Multi-Page Web App (₹45k–₹90k / $550–$1.1k)'),
          h(Text, { style: [styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }] }, tier2Cut),
          h(Text, { style: [styles.tableCell, { width: '30%' }] }, 'Within 48h of Client 50% Deposit')
        ),
        h(View, { style: styles.tableRow },
          h(Text, { style: [styles.tableCell, { width: '40%' }] }, 'Tier 3: SaaS / AI RAG Engine (₹90k–₹1.5L+ / $1.1k+)'),
          h(Text, { style: [styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }] }, tier3Cut),
          h(Text, { style: [styles.tableCell, { width: '30%' }] }, 'Within 48h of Client 50% Deposit')
        )
      ),
      renderFooter(1)
    ),

    // PAGE 2
    h(Page, { size: 'A4', style: styles.page },
      h(View, { style: styles.docHeader },
        h(Text, { style: styles.docTitle }, 'OPERATIONAL RULES & SIGN-OFF'),
        h(Text, { style: styles.docMeta }, 'Prateeq Sharma | Engineering & Custom Web Builds | Page 2 of 2')
      ),
      h(Text, { style: styles.sectionTitle }, '3. CLIENT HANDOFF & PROJECT QUALIFICATION'),
      h(Text, { style: styles.paragraph },
        'The Partner introduces leads via warm email introduction or the Intake Scoping Form. Once a client signs the Scoping Specification and pays the 50% upfront deposit, the project is officially qualified and the Partner\'s commission is released within 48 business hours.'
      ),
      h(Text, { style: styles.sectionTitle }, '4. NON-CIRCUMVENTION & CONFIDENTIALITY'),
      h(Text, { style: styles.paragraph },
        'Developer agrees not to solicit or bypass Partner\'s direct clients without Partner\'s written consent. Partner agrees to keep Developer\'s rates, codebases, and technical architecture confidential.'
      ),
      h(Text, { style: styles.sectionTitle }, '5. SIGNATURE & AGREEMENT ACCEPTANCE'),
      h(View, { style: styles.sigContainer },
        h(View, { style: styles.sigBox },
          h(Text, { style: styles.sigTitle }, 'DEVELOPER SIGNATURE'),
          h(Text, { style: styles.paragraph }, `NAME: ${devName}`),
          h(Text, { style: styles.paragraph }, `DATE: ${effectiveDate}`)
        ),
        h(View, { style: styles.sigBox },
          h(Text, { style: styles.sigTitle }, 'PARTNER SIGNATURE'),
          h(Text, { style: styles.paragraph }, `NAME: ${partnerName}`),
          h(Text, { style: styles.paragraph }, 'DATE: _______________')
        )
      ),
      renderFooter(2)
    )
  );

  const fileName = selectedTheme === 'noir' ? 'Middleman_Partnership_Agreement_Noir.pdf' : 'Middleman_Partnership_Agreement.pdf';
  const outputPath = path.join(process.cwd(), 'public', fileName);
  await ReactPDF.renderToFile(docElement, outputPath);
  console.log(`Successfully generated PDF (${selectedTheme}): ${outputPath}`);
}

async function run() {
  await generateMiddlemanAgreementPDF('azure');
  await generateMiddlemanAgreementPDF('noir');
}

run();
