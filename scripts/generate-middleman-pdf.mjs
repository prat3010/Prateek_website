import ReactPDF from '@react-pdf/renderer';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// NOTE: This script must stay in sync with src/components/pdf/MiddlemanAgreementPDF.tsx
// (the site's canonical renderer). Both consume the same defaults JSON and config shape.

const { Document, Page, Text, View, StyleSheet, Svg, Line } = ReactPDF;
const h = React.createElement;

function fillTokens(text, tokens) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => tokens[key] ?? match);
}

async function generateMiddlemanAgreementPDF({ configPath, outputPath }) {
  let resumeData = {};
  if (configPath) {
    try {
      resumeData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      console.warn('Could not load --config JSON, falling back to resume.json:', e);
    }
  }
  if (!resumeData?.intake?.middlemanAgreement) {
    const resumeJsonPath = path.join(process.cwd(), 'src', 'data', 'resume.json');
    try {
      resumeData = JSON.parse(fs.readFileSync(resumeJsonPath, 'utf8'));
    } catch (e) {
      console.warn('Could not load resume.json, using defaults:', e);
    }
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const defaultsPath = path.join(scriptDir, '..', 'src', 'data', 'middlemanAgreementDefaults.json');
  const defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'));
  const scalars = defaults.scalars;

  const mm = resumeData?.intake?.middlemanAgreement || {};
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

  const tokens = {
    developerName: devName,
    partnerName,
    partnerEmail,
    developerEmail: devEmail,
    effectiveDate,
  };

  const sections = (mm.sections && mm.sections.length ? mm.sections : defaults.sections).map((s) => ({
    key: s.key,
    heading: fillTokens(s.heading, tokens),
    lines: s.lines.map((line) => fillTokens(line, tokens)),
  }));

  const styles = StyleSheet.create({
    page: {
      padding: 28,
      fontFamily: 'Helvetica',
      backgroundColor: '#FFFFFF',
      fontSize: 8.5,
      color: '#0F172A',
    },
    headerBanner: {
      height: 50,
      backgroundColor: '#0F172A',
      borderRadius: 4,
      padding: 10,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#334155',
    },
    brandTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: '#FFFFFF',
    },
    brandSub: {
      fontSize: 7.5,
      color: '#94A3B8',
      marginTop: 2,
    },
    docHeader: {
      borderBottomWidth: 1,
      borderBottomColor: '#CBD5E1',
      paddingBottom: 6,
      marginBottom: 10,
    },
    docTitle: {
      fontSize: 13,
      fontFamily: 'Helvetica-Bold',
      color: '#0F172A',
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
      color: '#475569',
    },
    metaVal: {
      fontSize: 8,
      color: '#0F172A',
    },
    sectionTitle: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 9,
      color: '#0284C7',
      backgroundColor: '#E0F2FE',
      padding: '3 6',
      borderRadius: 3,
      marginBottom: 6,
      marginTop: 8,
    },
    paragraph: {
      fontSize: 8,
      lineHeight: 1.4,
      color: '#475569',
      marginBottom: 6,
    },
    bulletRow: {
      flexDirection: 'row',
      marginBottom: 3,
    },
    bulletDot: {
      width: 10,
      fontSize: 8,
      lineHeight: 1.4,
      color: '#0284C7',
    },
    bulletText: {
      flex: 1,
      fontSize: 8,
      lineHeight: 1.4,
      color: '#475569',
    },
    table: {
      borderColor: '#CBD5E1',
      borderWidth: 1,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 10,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#F8FAFC',
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
      borderBottomColor: '#F8FAFC',
    },
    tableCell: {
      fontSize: 7.5,
      color: '#475569',
    },
    footer: {
      position: 'absolute',
      bottom: 18,
      left: 28,
      right: 28,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
      paddingTop: 5,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    footerText: {
      fontSize: 7,
      color: '#94A3B8',
    },
    signatureGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    signatureBox: {
      width: '48%',
    },
    signatureTitle: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 8,
      color: '#0F172A',
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
      paddingBottom: 4,
    },
    signatureLine: {
      fontSize: 8.5,
      color: '#475569',
      marginBottom: 6,
    },
    agreedBox: {
      marginTop: 8,
      backgroundColor: '#F8FAFC',
      borderColor: '#E2E8F0',
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

  const renderSection = (section, index) => {
    const isCommission = section.key === 'commission';
    const isSignature = section.key === 'signature';

    const children = [
      h(Text, { key: 'title', style: styles.sectionTitle }, section.heading),
      ...section.lines.map((line, lineIdx) => {
        const isBullet = line.startsWith('- ');
        return isBullet
          ? h(View, { key: `line_${lineIdx}`, style: styles.bulletRow },
              h(Text, { style: styles.bulletDot }, '\u2022'),
              h(Text, { style: styles.bulletText }, line.slice(2))
            )
          : h(Text, { key: `line_${lineIdx}`, style: styles.paragraph }, line);
      }),
    ];

    if (isCommission) {
      children.push(
        h(View, { key: 'commission_table', style: styles.table },
          h(View, { style: styles.tableHeader },
            h(Text, { style: [styles.tableCellBold, { width: '40%' }] }, 'PROJECT TIER & BUDGET RANGE'),
            h(Text, { style: [styles.tableCellBold, { width: '30%' }] }, 'PARTNER COMMISSION'),
            h(Text, { style: [styles.tableCellBold, { width: '30%' }] }, 'PAYOUT TIMELINE')
          ),
          h(View, { style: styles.tableRow },
            h(Text, { style: [styles.tableCell, { width: '40%' }] }, 'Tier 1: Landing Page (INR 25k–45k / $300–$550)'),
            h(Text, { style: [styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }] }, tier1Cut),
            h(Text, { style: [styles.tableCell, { width: '30%' }] }, 'Within 48h of Client 50% Deposit')
          ),
          h(View, { style: styles.tableRow },
            h(Text, { style: [styles.tableCell, { width: '40%' }] }, 'Tier 2: Multi-Page Web App (INR 45k–90k / $550–$1.1k)'),
            h(Text, { style: [styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }] }, tier2Cut),
            h(Text, { style: [styles.tableCell, { width: '30%' }] }, 'Within 48h of Client 50% Deposit')
          ),
          h(View, { style: styles.tableRow },
            h(Text, { style: [styles.tableCell, { width: '40%' }] }, 'Tier 3: SaaS / AI RAG Engine (INR 90k–1.5L+ / $1.1k+)'),
            h(Text, { style: [styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }] }, tier3Cut),
            h(Text, { style: [styles.tableCell, { width: '30%' }] }, 'Within 48h of Client 50% Deposit')
          ),
          h(View, { style: [styles.tableRow, { borderBottomWidth: 0 }] },
            h(Text, { style: [styles.tableCell, { width: '40%' }] }, 'Recurring Care Plan (ongoing)'),
            h(Text, { style: [styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }] }, recurringCut),
            h(Text, { style: [styles.tableCell, { width: '30%' }] }, 'Monthly on cleared Net Funds')
          )
        )
      );
    }

    if (isSignature) {
      children.push(
        h(View, { key: 'signature_block', style: null },
          h(View, { style: styles.signatureGrid },
            h(View, { style: styles.signatureBox },
              h(Text, { style: styles.signatureTitle }, 'DEVELOPER SIGNATURE'),
              h(Text, { style: styles.signatureLine }, `NAME: ${devName}`),
              h(Text, { style: styles.signatureLine }, `DATE: ${effectiveDate}`),
              h(Text, { style: styles.signatureLine }, 'SIGN: _______________')
            ),
            h(View, { style: styles.signatureBox },
              h(Text, { style: styles.signatureTitle }, 'PARTNER / SALES REP SIGNATURE'),
              h(Text, { style: styles.signatureLine }, `NAME: ${partnerName}`),
              h(Text, { style: styles.signatureLine }, `EMAIL: ${partnerEmail}`),
              h(Text, { style: styles.signatureLine }, 'DATE: _______________'),
              h(Text, { style: styles.signatureLine }, 'SIGN: _______________')
            )
          ),
          agreedElectronically
            ? h(View, { key: 'agreed_electronically', style: styles.agreedBox },
                h(Text, { style: styles.agreedTitle }, 'AGREED ELECTRONICALLY'),
                h(Text, { style: styles.agreedText }, agreedElectronically)
              )
            : null
        )
      );
    }

    return h(View, { key: section.key || index }, children);
  };

  const docElement = h(Document, { title: `${partnerName.replace(/\s+/g, '_')}_Sales_Partner_Agreement` },
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
          h(Text, { style: styles.metaVal }, `${devEmail}${partnerEmail ? ` / ${partnerEmail}` : ''}`)
        )
      ),
      ...sections.map(renderSection),
      h(View, { style: styles.footer, fixed: true },
        h(Text, { style: styles.footerText }, 'SALES PARTNER & MIDDLEMAN AGREEMENT // CONFIDENTIAL'),
        h(Text, { style: styles.footerText, render: ({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages} | https://prateeq.in` })
      )
    )
  );

  const outputPathResolved = outputPath || path.join(process.cwd(), 'public', 'Middleman_Partnership_Agreement.pdf');
  await ReactPDF.renderToFile(docElement, outputPathResolved);
  console.log(`Successfully generated PDF: ${outputPathResolved}`);
}

function parseArgs(argv) {
  const args = { configPath: null, outputPath: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--config' && argv[i + 1]) args.configPath = argv[i + 1];
    if (argv[i] === '--out' && argv[i + 1]) args.outputPath = argv[i + 1];
  }
  return args;
}

async function run() {
  const { configPath, outputPath } = parseArgs(process.argv.slice(2));
  await generateMiddlemanAgreementPDF({ configPath, outputPath });
}

run();
