import ReactPDF from '@react-pdf/renderer';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// NOTE: This script must stay in sync with src/components/pdf/MiddlemanAgreementPDF.tsx
// (the site's canonical renderer). Both consume the same defaults JSON and config shape.
// The script carries the azure/noir brand theme (tokens mirrored from
// src/components/pdf/pdfTheme.ts, fonts registered from public/fonts/) — pass
// `--theme azure|noir` to pick the palette.

const { Document, Page, Text, View, StyleSheet, Svg, Line, Circle, Ellipse, Path } = ReactPDF;
const h = React.createElement;

// ── Brand font registry (mirrors src/components/pdf/pdfFonts.ts + pdfFontsServer.ts) ──
const PDF_FONT = {
  headlineLight: 'PlayfairDisplay',
  headlineLightBold: 'PlayfairDisplay-Bold',
  bodyLight: 'Lora',
  code: 'JetBrainsMono',
  codeBold: 'JetBrainsMono-Bold',
};

const PDF_FONT_FILES = {
  [PDF_FONT.headlineLight]: 'PlayfairDisplay-Regular.ttf',
  [PDF_FONT.headlineLightBold]: 'PlayfairDisplay-Bold.ttf',
  [PDF_FONT.bodyLight]: 'Lora-Regular.ttf',
  [PDF_FONT.code]: 'JetBrainsMono-Regular.ttf',
  [PDF_FONT.codeBold]: 'JetBrainsMono-Bold.ttf',
};

const PDF_FONT_WEIGHTS = {
  [PDF_FONT.headlineLight]: 400,
  [PDF_FONT.headlineLightBold]: 700,
  [PDF_FONT.bodyLight]: 400,
  [PDF_FONT.code]: 400,
  [PDF_FONT.codeBold]: 700,
};

// ── Theme tokens (mirrors src/components/pdf/pdfTheme.ts) ──
const PDF_THEMES = {
  azure: {
    isNoir: false,
    pageBg: '#F7F2E8',
    textPrimary: '#2B2B36',
    textSecondary: '#55555F',
    headerBg: '#2B2B36',
    headerTitle: '#FAF9F6',
    headerSub: '#B9B3A4',
    cardBg: '#FAF9F6',
    cardBorder: '#DDD6C8',
    tableRowAlt: '#F3EDE1',
    accentColor: '#D95D67',
    accentBg: '#F9E3E2',
    chipBg: '#F4DC95',
    chipBorder: '#2B2B36',
    chipText: '#2B2B36',
    logoBg: '#5A8EB6',
    logoStroke: '#2B2B36',
    logoBody: '#FAF9F6',
    logoEar: '#D95D67',
    logoEye: '#2B2B36',
    logoPupil: '#FAF9F6',
    logoBlush: '#DF8B98',
    footerText: '#8A8474',
    footerRule: '#DDD6C8',
    headlineFont: PDF_FONT.headlineLight,
    headlineBoldFont: PDF_FONT.headlineLightBold,
    bodyFont: PDF_FONT.bodyLight,
    labelFont: PDF_FONT.code,
    labelBoldFont: PDF_FONT.codeBold,
  },
  noir: {
    isNoir: true,
    pageBg: '#08080A',
    textPrimary: '#FAFAFA',
    textSecondary: '#9A9AA6',
    headerBg: '#101014',
    headerTitle: '#FAFAFA',
    headerSub: '#8A8A93',
    cardBg: '#1E1E24',
    cardBorder: '#555562',
    tableRowAlt: '#17171C',
    accentColor: '#FF2A55',
    accentBg: '#2A1219',
    chipBg: '#1E1E24',
    chipBorder: '#FFE600',
    chipText: '#FAFAFA',
    logoBg: '#8A8A93',
    logoStroke: '#FAFAFA',
    logoBody: '#121214',
    logoEar: '#FAFAFA',
    logoEye: '#FAFAFA',
    logoPupil: '#121214',
    logoBlush: '#FFFFFF',
    footerText: '#5A5A66',
    footerRule: '#33333C',
    headlineFont: PDF_FONT.code,
    headlineBoldFont: PDF_FONT.codeBold,
    bodyFont: PDF_FONT.code,
    labelFont: PDF_FONT.code,
    labelBoldFont: PDF_FONT.codeBold,
  },
};

function getPdfTheme(isNoir) {
  return isNoir ? PDF_THEMES.noir : PDF_THEMES.azure;
}

let fontsRegistered = false;
function registerPdfFonts() {
  if (fontsRegistered) return;
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  Object.entries(PDF_FONT_FILES).forEach(([family, file]) => {
    const ttf = fs.readFileSync(path.join(scriptDir, '..', 'public', 'fonts', file));
    ReactPDF.Font.register({
      family,
      fonts: [
        {
          src: `data:font/ttf;base64,${ttf.toString('base64')}`,
          fontWeight: PDF_FONT_WEIGHTS[family],
        },
      ],
    });
  });
  fontsRegistered = true;
}

function fillTokens(text, tokens) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => tokens[key] ?? match);
}

function fmtINR(n) {
  return `INR ${Number(n).toLocaleString('en-IN')}`;
}

function fmtUSD(n) {
  return `$${Number(n).toLocaleString('en-US')}`;
}

function bandRange(band) {
  if (band.minINR == null) return `Up to ${fmtINR(band.maxINR ?? 0)} / ${fmtUSD(band.maxUSD ?? 0)}`;
  if (band.maxINR == null) return `${fmtINR(band.minINR)}+ / ${fmtUSD(band.minUSD ?? 0)}+`;
  return `${fmtINR(band.minINR)}\u2013${fmtINR(band.maxINR)} / ${fmtUSD(band.minUSD ?? 0)}\u2013${fmtUSD(band.maxUSD ?? 0)}`;
}

function parsePct(value) {
  return parseInt(String(value).replace('%', '').trim(), 10) || 0;
}

// ── Brand header + footer (mirrors PdfBrandHeader.tsx / PdfFooter.tsx / PdfGremlinLogo.tsx) ──
function gremlinLogo(theme, size) {
  return h(Svg, { viewBox: '0 0 100 100', width: size, height: size },
    h(Circle, { cx: '50', cy: '50', r: '38', fill: theme.logoBg }),
    h(Path, { d: 'M 26,45 L 32,50 L 26,55', fill: 'none', stroke: theme.logoStroke, strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
    h(Line, { x1: '35', y1: '55', x2: '43', y2: '55', stroke: theme.logoStroke, strokeWidth: 3.5, strokeLinecap: 'round' }),
    h(Line, { x1: '15', y1: '72', x2: '85', y2: '72', stroke: theme.logoStroke, strokeWidth: 3.5, strokeLinecap: 'round' }),
    h(Path, { d: 'M 32,72 C 32,46 68,46 68,72', fill: theme.logoBody, stroke: theme.logoStroke, strokeWidth: 3.5, strokeLinecap: 'round' }),
    h(Path, { d: 'M 32,48 L 12,38 Q 24,53 36,55', fill: theme.logoEar, stroke: theme.logoStroke, strokeWidth: 3, strokeLinejoin: 'round' }),
    h(Path, { d: 'M 68,48 L 88,38 Q 76,53 64,55', fill: theme.logoEar, stroke: theme.logoStroke, strokeWidth: 3, strokeLinejoin: 'round' }),
    h(Circle, { cx: '43', cy: '58', r: '6.5', fill: theme.logoEye }),
    h(Circle, { cx: '45', cy: '55.5', r: '2.5', fill: theme.logoPupil }),
    h(Circle, { cx: '57', cy: '58', r: '6.5', fill: theme.logoEye }),
    h(Circle, { cx: '59', cy: '55.5', r: '2.5', fill: theme.logoPupil }),
    h(Ellipse, { cx: '37', cy: '63', rx: '3.5', ry: '2', fill: theme.logoBlush }),
    h(Ellipse, { cx: '63', cy: '63', rx: '3.5', ry: '2', fill: theme.logoBlush })
  );
}

function brandHeader(theme, title, subtitle) {
  const headerStyles = StyleSheet.create({
    banner: {
      height: 52,
      backgroundColor: theme.headerBg,
      borderRadius: 4,
      marginBottom: 12,
      paddingHorizontal: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    brand: {
      transform: 'rotate(-1.5deg)',
    },
    brandTitle: {
      fontSize: 14,
      fontFamily: theme.headlineBoldFont,
      color: theme.headerTitle,
      letterSpacing: 0.06,
      textTransform: 'uppercase',
    },
    brandAccent: {
      width: 30,
      height: 2,
      backgroundColor: theme.accentColor,
      marginTop: 3,
    },
    brandSub: {
      fontSize: 6.5,
      fontFamily: theme.labelFont,
      color: theme.headerSub,
      marginTop: 4,
      letterSpacing: 0.08,
      textTransform: 'uppercase',
    },
  });

  return h(View, { style: headerStyles.banner },
    h(View, { style: headerStyles.brand },
      h(Text, { style: headerStyles.brandTitle }, title),
      h(View, { style: headerStyles.brandAccent }),
      h(Text, { style: headerStyles.brandSub }, subtitle)
    ),
    gremlinLogo(theme, 34)
  );
}

function pdfFooter(theme, leftText) {
  const footerStyles = StyleSheet.create({
    footer: {
      position: 'absolute',
      bottom: 14,
      left: 28,
      right: 28,
      borderTopWidth: 1,
      borderTopColor: theme.footerRule,
      paddingTop: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerText: {
      fontSize: 6.5,
      fontFamily: theme.labelFont,
      letterSpacing: 0.05,
      color: theme.footerText,
    },
    footerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

  return h(View, { style: footerStyles.footer, fixed: true },
    h(Text, { style: footerStyles.footerText }, leftText),
    h(View, { style: footerStyles.footerRight },
      gremlinLogo(theme, 10),
      h(Text, { style: [footerStyles.footerText, { marginLeft: 5 }], render: ({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages} | https://prateeq.in` })
    )
  );
}

async function generateMiddlemanAgreementPDF({ configPath, outputPath, theme }) {
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

  registerPdfFonts();
  const themeConfig = getPdfTheme(theme === 'noir');

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const defaultsPath = path.join(scriptDir, '..', 'src', 'data', 'middlemanAgreementDefaults.json');
  const defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'));
  const scalars = defaults.scalars;

  const commissionPath = path.join(scriptDir, '..', 'src', 'data', 'commissionConfig.json');
  const commissionConfig = JSON.parse(fs.readFileSync(commissionPath, 'utf8'));
  const commissionBands = commissionConfig.bands;
  const disbursementWindow = commissionConfig.disbursementWindow;
  const commissionExample = commissionConfig.example;

  const mm = resumeData?.intake?.middlemanAgreement || {};
  const cutFor = (bandId) => {
    const band = commissionBands.find((b) => b.id === bandId);
    return band ? `${band.rate}%` : undefined;
  };
  const partnerName = mm.partnerName || scalars.partnerName || '[Partner Name]';
  const partnerEmail = (mm.partnerEmail || scalars.partnerEmail || '').trim();
  const presentDateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const effectiveDate = mm.effectiveDate && mm.effectiveDate.trim() ? mm.effectiveDate : presentDateStr;
  const devName = mm.developerName || scalars.developerName || 'Prateeq Sharma';
  const devEmail = mm.developerEmail || scalars.developerEmail || 'prateeqsharma@gmail.com';
  const tier1Cut = mm.tier1Commission || scalars.tier1Commission || cutFor('A') || '10%';
  const tier2Cut = mm.tier2Commission || scalars.tier2Commission || cutFor('B') || '12%';
  const tier3Cut = mm.tier3Commission || scalars.tier3Commission || cutFor('C') || '15%';
  const recurringCut = mm.recurringCommission || scalars.recurringCommission || `${commissionConfig.recurringRate}%`;
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
      paddingTop: 24,
      paddingBottom: 32,
      paddingLeft: 28,
      paddingRight: 28,
      fontFamily: themeConfig.bodyFont,
      backgroundColor: themeConfig.pageBg,
      fontSize: 8.5,
      color: themeConfig.textPrimary,
    },
    docHeader: {
      borderBottomWidth: 1,
      borderBottomColor: themeConfig.cardBorder,
      paddingBottom: 5,
      marginBottom: 10,
    },
    docTitle: {
      fontSize: 11,
      fontFamily: themeConfig.headlineBoldFont,
      color: themeConfig.textPrimary,
      textTransform: 'uppercase',
      letterSpacing: 0.04,
    },
    docMeta: {
      fontSize: 7,
      fontFamily: themeConfig.labelFont,
      color: themeConfig.textSecondary,
      marginTop: 2,
      letterSpacing: 0.05,
    },
    metaCard: {
      backgroundColor: themeConfig.cardBg,
      borderColor: themeConfig.cardBorder,
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
      fontFamily: themeConfig.labelBoldFont,
      color: themeConfig.textSecondary,
      fontSize: 6.5,
      letterSpacing: 0.05,
    },
    metaVal: {
      fontSize: 8,
      color: themeConfig.textPrimary,
    },
    sectionTitle: {
      fontFamily: themeConfig.labelBoldFont,
      fontSize: 8,
      color: themeConfig.chipText,
      backgroundColor: themeConfig.chipBg,
      borderColor: themeConfig.chipBorder,
      borderWidth: 1,
      padding: '3 6',
      borderRadius: 3,
      marginBottom: 8,
      marginTop: 8,
      borderLeftWidth: 3,
      borderLeftColor: themeConfig.accentColor,
      letterSpacing: 0.05,
    },
    paragraph: {
      fontSize: 8,
      lineHeight: 1.5,
      color: themeConfig.textSecondary,
      marginBottom: 8,
    },
    bulletRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    bulletDot: {
      width: 10,
      fontSize: 8,
      lineHeight: 1.5,
      color: themeConfig.accentColor,
    },
    bulletText: {
      flex: 1,
      fontSize: 8,
      lineHeight: 1.5,
      color: themeConfig.textSecondary,
    },
    table: {
      width: '100%',
      borderColor: themeConfig.cardBorder,
      borderWidth: 1,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 12,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: themeConfig.tableRowAlt,
      padding: '6 5',
      borderBottomWidth: 1,
      borderBottomColor: themeConfig.cardBorder,
    },
    tableCellBold: {
      fontFamily: themeConfig.labelBoldFont,
      fontSize: 6.5,
      color: themeConfig.textPrimary,
      letterSpacing: 0.04,
    },
    tableRow: {
      flexDirection: 'row',
      padding: '7 5',
      borderBottomWidth: 1,
      borderBottomColor: themeConfig.tableRowAlt,
    },
    tableCell: {
      fontSize: 7.5,
      color: themeConfig.textSecondary,
    },
    signatureSection: {
      marginTop: 10,
    },
    signatureGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    signatureBox: {
      width: '48%',
      borderColor: themeConfig.cardBorder,
      borderWidth: 1,
      borderRadius: 4,
      padding: 7,
      backgroundColor: themeConfig.cardBg,
    },
    signatureTitle: {
      fontFamily: themeConfig.labelBoldFont,
      fontSize: 6.5,
      color: themeConfig.textSecondary,
      marginBottom: 10,
      letterSpacing: 0.05,
    },
    signatureLine: {
      fontSize: 7.5,
      color: themeConfig.textPrimary,
      marginTop: 2,
    },
    agreedBox: {
      marginTop: 8,
      backgroundColor: themeConfig.cardBg,
      borderColor: themeConfig.cardBorder,
      borderLeftWidth: 3,
      borderLeftColor: themeConfig.accentColor,
      borderWidth: 1,
      borderRadius: 4,
      padding: 8,
    },
    agreedTitle: {
      fontFamily: themeConfig.labelBoldFont,
      fontSize: 7,
      color: themeConfig.accentColor,
      marginBottom: 3,
      letterSpacing: 0.05,
    },
    agreedText: {
      fontSize: 7.5,
      lineHeight: 1.5,
      color: themeConfig.textSecondary,
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
      const commissionRows = commissionBands.map((band) =>
        h(View, { key: `band_${band.id}`, style: [styles.tableRow, band.id === 'C' ? { borderBottomWidth: 0 } : {}] },
          h(Text, { style: [styles.tableCell, { width: '40%', borderRightWidth: 1, borderRightColor: themeConfig.cardBorder, paddingRight: 6 }] }, `Tier ${band.id}: ${band.label} (${bandRange(band)})`),
          h(Text, { style: [styles.tableCell, { width: '30%', fontFamily: themeConfig.labelBoldFont, borderRightWidth: 1, borderRightColor: themeConfig.cardBorder, paddingLeft: 6, paddingRight: 6 }] },
            band.id === 'A' ? tier1Cut : band.id === 'B' ? tier2Cut : tier3Cut),
          h(Text, { style: [styles.tableCell, { width: '30%', paddingLeft: 6 }] }, `Within ${disbursementWindow} of Client 50% Deposit`)
        )
      );
      const exampleTotal = Math.round(commissionExample.contractValueINR * parsePct(tier3Cut) / 100);
      const exampleSplit = Math.round(exampleTotal / 2);
      const exampleDeposit = Math.round(commissionExample.contractValueINR / 2);

      children.push(
        h(View, { key: 'commission_block' },
          h(View, { style: styles.table },
            h(View, { style: styles.tableHeader },
              h(Text, { style: [styles.tableCellBold, { width: '40%', borderRightWidth: 1, borderRightColor: themeConfig.cardBorder, paddingRight: 6 }] }, 'PROJECT TIER & BUDGET RANGE'),
              h(Text, { style: [styles.tableCellBold, { width: '30%', borderRightWidth: 1, borderRightColor: themeConfig.cardBorder, paddingLeft: 6, paddingRight: 6 }] }, 'PARTNER COMMISSION'),
              h(Text, { style: [styles.tableCellBold, { width: '30%', paddingLeft: 6 }] }, 'PAYOUT TIMELINE')
            ),
            ...commissionRows,
            h(View, { key: 'recurring', style: [styles.tableRow, { borderBottomWidth: 0 }] },
              h(Text, { style: [styles.tableCell, { width: '40%', borderRightWidth: 1, borderRightColor: themeConfig.cardBorder, paddingRight: 6 }] }, 'Recurring Care Plan (ongoing)'),
              h(Text, { style: [styles.tableCell, { width: '30%', fontFamily: themeConfig.labelBoldFont, borderRightWidth: 1, borderRightColor: themeConfig.cardBorder, paddingLeft: 6, paddingRight: 6 }] }, recurringCut),
              h(Text, { style: [styles.tableCell, { width: '30%', paddingLeft: 6 }] }, 'Monthly on cleared Net Funds')
            )
          ),
          h(View, { style: styles.agreedBox },
            h(Text, { style: styles.agreedTitle }, 'WORKED COMMISSION EXAMPLE'),
            h(Text, { style: styles.agreedText },
              `Illustrative only: a SaaS contract signed at ${fmtINR(commissionExample.contractValueINR)} falls in Tier ${commissionExample.tier} (${tier3Cut}). Total commission is ${tier3Cut} × ${fmtINR(commissionExample.contractValueINR)} = ${fmtINR(exampleTotal)}. It is paid 50% (${fmtINR(exampleSplit)}) within ${disbursementWindow} after the client's 50% deposit (${fmtINR(exampleDeposit)}) clears, and 50% (${fmtINR(exampleSplit)}) after the final balance clears.`
            )
          )
        )
      );
    }

    if (isSignature) {
      children.push(
        h(View, { key: 'signature_block', style: [styles.signatureSection, { wrap: false }] },
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
              h(Text, { style: styles.signatureLine }, `EMAIL: ${partnerEmail || '_______________'}`),
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
      brandHeader(themeConfig, 'PRATEEQ.IN', 'FULL-STACK & AI ARCHITECTURE // PARTNER FRAMEWORK'),
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
      pdfFooter(themeConfig, 'SALES PARTNER & MIDDLEMAN AGREEMENT // CONFIDENTIAL')
    )
  );

  const outputPathResolved = outputPath || path.join(process.cwd(), 'public', 'Middleman_Partnership_Agreement.pdf');
  await ReactPDF.renderToFile(docElement, outputPathResolved);
  console.log(`Successfully generated PDF (${themeConfig.isNoir ? 'noir' : 'azure'}): ${outputPathResolved}`);
}

function parseArgs(argv) {
  const args = { configPath: null, outputPath: null, theme: 'azure' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--config' && argv[i + 1]) args.configPath = argv[i + 1];
    if (argv[i] === '--out' && argv[i + 1]) args.outputPath = argv[i + 1];
    if (argv[i] === '--theme' && argv[i + 1]) args.theme = argv[i + 1];
  }
  return args;
}

async function run() {
  const { configPath, outputPath, theme } = parseArgs(process.argv.slice(2));
  await generateMiddlemanAgreementPDF({ configPath, outputPath, theme });
}

run();
