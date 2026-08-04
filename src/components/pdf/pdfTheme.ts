/**
 * Universal PDF Theme Configuration
 * Defines single visual design tokens applied across all generated PDF proposals & agreements.
 *
 * Two palettes mirror the website's identity:
 * - azure:  pop-art comic palette (warm cream paper, ink text, dust-red accent, ochre chips)
 * - noir:   monochromatic cyber-noir (near-black paper, neon pink accent, neon yellow chips)
 * Typography mirrors the hero "PRATEEQ" branding: Playfair Display (azure) / JetBrains Mono (noir),
 * with Lora body copy in azure and JetBrains Mono labels everywhere.
 */
import { PDF_FONT } from './pdfFonts';

export interface PDFThemeConfig {
  isNoir: boolean;
  pageBg: string;
  textPrimary: string;
  textSecondary: string;
  headerBg: string;
  headerTitle: string;
  headerSub: string;
  cardBg: string;
  cardBorder: string;
  tableRowAlt: string;
  accentColor: string;
  accentBg: string;
  chipBg: string;
  chipBorder: string;
  chipText: string;
  logoBg: string;
  logoStroke: string;
  logoBody: string;
  logoEar: string;
  logoEye: string;
  logoPupil: string;
  logoBlush: string;
  footerText: string;
  footerRule: string;
  headlineFont: string;
  headlineBoldFont: string;
  bodyFont: string;
  labelFont: string;
  labelBoldFont: string;
}

export const PDF_THEMES: Record<'azure' | 'noir', PDFThemeConfig> = {
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

export function getPdfTheme(isNoir: boolean): PDFThemeConfig {
  return isNoir ? PDF_THEMES.noir : PDF_THEMES.azure;
}
