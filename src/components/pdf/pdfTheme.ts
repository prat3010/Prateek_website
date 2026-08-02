/**
 * Universal PDF Theme Configuration
 * Defines single visual design tokens applied across all generated PDF proposals & agreements.
 */

export interface PDFThemeConfig {
  pageBg: string;
  textPrimary: string;
  textSecondary: string;
  headerBg: string;
  headerTitle: string;
  headerSub: string;
  cardBg: string;
  cardBorder: string;
  accentColor: string;
  accentBg: string;
}

export const DEFAULT_PDF_THEME: PDFThemeConfig = {
  pageBg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  headerBg: '#0F172A',
  headerTitle: '#FFFFFF',
  headerSub: '#94A3B8',
  cardBg: '#F8FAFC',
  cardBorder: '#E2E8F0',
  accentColor: '#0284C7',
  accentBg: '#E0F2FE',
};
