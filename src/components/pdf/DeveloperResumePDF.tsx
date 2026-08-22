import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/data/resume';
import { getSkillsHighlight, type Persona } from '@/lib/skills';
import { getPdfTheme, scaleBodyFont, cleanPDFText, type PDFThemeConfig } from './pdfTheme';
import { PdfBrandHeader } from './PdfBrandHeader';
import { PdfFooter } from './PdfFooter';

import resumeDefaults from '@/data/resume.json';

interface DeveloperResumePDFProps {
  activePersona?: Persona;
  resumeData?: ResumeData | null;
  isNoir?: boolean;
}

const personaSubtitles: Record<Persona, string> = {
  general: 'SOLUTIONS ARCHITECT',
  fullstack: 'FULL-STACK ENGINEER',
  ai: 'AI ORCHESTRATION & RAG',
  creative: 'PRODUCT & MOTION DESIGN',
};

function createStyles(theme: PDFThemeConfig) {
  return StyleSheet.create({
    page: {
      paddingTop: 24,
      paddingBottom: 32,
      paddingLeft: 28,
      paddingRight: 28,
      fontFamily: theme.bodyFont,
      backgroundColor: theme.pageBg,
      fontSize: scaleBodyFont(theme, 8.5),
      color: theme.textPrimary,
    },
    contactCard: {
      backgroundColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 4,
      padding: 8,
      marginBottom: 10,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    contactItem: {
      width: '32%',
      marginBottom: 3,
    },
    contactLabel: {
      fontFamily: theme.labelBoldFont,
      color: theme.textSecondary,
      fontSize: 6.5,
      letterSpacing: 0.05,
      textTransform: 'uppercase',
    },
    contactValue: {
      color: theme.textPrimary,
      fontSize: scaleBodyFont(theme, 7.5),
      fontFamily: theme.labelFont,
      marginTop: 1,
    },
    sectionHeader: {
      fontSize: scaleBodyFont(theme, 8),
      fontFamily: theme.labelBoldFont,
      color: theme.chipText,
      backgroundColor: theme.chipBg,
      borderColor: theme.chipBorder,
      borderWidth: 1,
      padding: '3 6',
      borderRadius: 3,
      marginBottom: 6,
      marginTop: 6,
      borderLeftWidth: 3,
      borderLeftColor: theme.accentColor,
      letterSpacing: 0.05,
    },
    summaryCard: {
      backgroundColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderLeftWidth: 3,
      borderLeftColor: theme.accentColor,
      borderRadius: 4,
      padding: 8,
      marginBottom: 8,
    },
    summaryText: {
      fontSize: scaleBodyFont(theme, 8),
      lineHeight: 1.45,
      color: theme.textPrimary,
    },
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 8,
    },
    skillBadge: {
      backgroundColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 3,
      padding: '3 6',
      marginRight: 4,
      marginBottom: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    skillDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.accentColor,
      marginRight: 4,
    },
    skillText: {
      fontSize: scaleBodyFont(theme, 7.5),
      fontFamily: theme.labelBoldFont,
      color: theme.textPrimary,
    },
    expItem: {
      backgroundColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderLeftWidth: 3,
      borderLeftColor: theme.accentColor,
      borderRadius: 4,
      padding: 8,
      marginBottom: 8,
    },
    expHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    expRole: {
      fontSize: scaleBodyFont(theme, 9.5),
      fontFamily: theme.headlineBoldFont,
      color: theme.textPrimary,
    },
    expPeriod: {
      fontSize: 6.5,
      fontFamily: theme.labelBoldFont,
      color: theme.chipText,
      backgroundColor: theme.chipBg,
      borderColor: theme.chipBorder,
      borderWidth: 1,
      padding: '2 5',
      borderRadius: 2,
    },
    expCompany: {
      fontSize: scaleBodyFont(theme, 8),
      fontFamily: theme.labelBoldFont,
      color: theme.accentColor,
      marginBottom: 4,
    },
    bulletRow: {
      flexDirection: 'row',
      marginTop: 2,
      marginBottom: 2,
      alignItems: 'flex-start',
    },
    bulletDot: {
      fontSize: scaleBodyFont(theme, 8),
      color: theme.accentColor,
      marginRight: 4,
      lineHeight: 1.4,
    },
    bulletText: {
      fontSize: scaleBodyFont(theme, 7.8),
      lineHeight: 1.4,
      color: theme.textSecondary,
      flex: 1,
    },
    eduItem: {
      backgroundColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 4,
      padding: 8,
      marginBottom: 6,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    eduDegree: {
      fontSize: scaleBodyFont(theme, 8.5),
      fontFamily: theme.headlineBoldFont,
      color: theme.textPrimary,
    },
    eduSchool: {
      fontSize: scaleBodyFont(theme, 7.5),
      fontFamily: theme.labelFont,
      color: theme.textSecondary,
      marginTop: 2,
    },
    eduPeriod: {
      fontSize: 6.5,
      fontFamily: theme.labelBoldFont,
      color: theme.textSecondary,
    },
  });
}

export function DeveloperResumePDF({ activePersona = 'ai', resumeData, isNoir = false }: DeveloperResumePDFProps) {
  const theme = getPdfTheme(isNoir);
  const styles = createStyles(theme);
  const data = (resumeData || resumeDefaults) as unknown as ResumeData;

  const highlightItems = getSkillsHighlight(activePersona);
  const rawSummary = typeof data.summary === 'object' && data.summary !== null
    ? data.summary[activePersona] || data.summary.general
    : String(data.summary || '');
  const personaSummary = cleanPDFText(rawSummary);

  const subLabel = personaSubtitles[activePersona] || 'DEVELOPER RESUME';
  const leftFooterText = `PRATEEQ SHARMA — RESUME (${subLabel})`;

  return (
    <Document title={`${cleanPDFText(data.name)}_Resume_${activePersona}`}>
      <Page size="A4" style={styles.page}>
        {/* Hero Brand Header */}
        <PdfBrandHeader
          theme={theme}
          title={cleanPDFText(data.name || 'PRATEEQ SHARMA')}
          subtitle={`DEVELOPER RESUME // ${subLabel}`}
        />

        {/* Contact Metadata Card */}
        <View style={styles.contactCard}>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>{cleanPDFText(data.email)}</Text>
          </View>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Phone</Text>
            <Text style={styles.contactValue}>{cleanPDFText(data.phone)}</Text>
          </View>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Website</Text>
            <Text style={styles.contactValue}>{cleanPDFText(data.website || 'https://prateeq.in')}</Text>
          </View>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>GitHub</Text>
            <Text style={styles.contactValue}>{cleanPDFText(data.github)}</Text>
          </View>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>LinkedIn</Text>
            <Text style={styles.contactValue}>{cleanPDFText(data.linkedin)}</Text>
          </View>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Location</Text>
            <Text style={styles.contactValue}>India (Remote Worldwide)</Text>
          </View>
        </View>

        {/* Executive Summary */}
        <Text style={styles.sectionHeader}>EXECUTIVE SUMMARY</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>{personaSummary}</Text>
        </View>

        {/* Core Capabilities / Skills */}
        <Text style={styles.sectionHeader}>CORE TECHNICAL COMPETENCIES</Text>
        <View style={styles.skillsContainer}>
          {highlightItems.map((skill, idx) => (
            <View key={idx} style={styles.skillBadge}>
              <View style={styles.skillDot} />
              <Text style={styles.skillText}>{cleanPDFText(skill)}</Text>
            </View>
          ))}
        </View>

        {/* Professional Experience */}
        <Text style={styles.sectionHeader}>PROFESSIONAL EXPERIENCE</Text>
        {data.experience?.map((exp, idx) => (
          <View key={idx} style={styles.expItem}>
            <View style={styles.expHeader}>
              <Text style={styles.expRole}>{cleanPDFText(exp.role)}</Text>
              <Text style={styles.expPeriod}>{cleanPDFText(exp.period)}</Text>
            </View>
            <Text style={styles.expCompany}>
              {cleanPDFText(exp.company)} — {cleanPDFText(exp.location)}
            </Text>
            {exp.bullets?.map((b, bIdx) => {
              const text = typeof b === 'object' && b !== null
                ? b[activePersona] || b.general
                : String(b || '');
              return (
                <View key={bIdx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{cleanPDFText(text)}</Text>
                </View>
              );
            })}
          </View>
        ))}

        {/* Education */}
        <Text style={styles.sectionHeader}>EDUCATION</Text>
        {data.education?.map((edu, idx) => (
          <View key={idx} style={styles.eduItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eduDegree}>{cleanPDFText(edu.school)}</Text>
              <Text style={styles.eduSchool}>
                {cleanPDFText(edu.degree)} — {cleanPDFText(edu.location)}
              </Text>
            </View>
            <Text style={styles.eduPeriod}>{cleanPDFText(edu.period)}</Text>
          </View>
        ))}

        {/* Page Footer */}
        <PdfFooter theme={theme} leftText={leftFooterText} />
      </Page>
    </Document>
  );
}
