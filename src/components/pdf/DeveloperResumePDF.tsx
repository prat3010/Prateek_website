import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/data/resume';
import { getSkillsHighlight, type Persona } from '@/lib/skills';

interface DeveloperResumePDFProps {
  activePersona: Persona;
  resumeData: ResumeData;
}

export function DeveloperResumePDF({ activePersona, resumeData }: DeveloperResumePDFProps) {
  const highlightItems = getSkillsHighlight(activePersona);
  const personaSummary = typeof resumeData.summary === 'object' && resumeData.summary !== null
    ? resumeData.summary[activePersona] || resumeData.summary.general
    : String(resumeData.summary || '');

  const styles = StyleSheet.create({
    page: {
      padding: 32,
      fontFamily: 'Helvetica',
      backgroundColor: '#FFFFFF',
      fontSize: 9,
      color: '#1E293B',
      lineHeight: 1.35,
    },
    header: {
      borderBottomWidth: 1.5,
      borderBottomColor: '#0F172A',
      paddingBottom: 8,
      marginBottom: 12,
    },
    name: {
      fontSize: 20,
      fontFamily: 'Helvetica-Bold',
      color: '#0F172A',
      letterSpacing: 0.5,
    },
    contactLine: {
      fontSize: 8.5,
      color: '#475569',
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#0F172A',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      borderBottomWidth: 0.75,
      borderBottomColor: '#CBD5E1',
      paddingBottom: 2,
      marginTop: 10,
      marginBottom: 6,
    },
    summary: {
      fontSize: 8.5,
      color: '#334155',
      marginBottom: 6,
      lineHeight: 1.4,
    },
    skillsText: {
      fontSize: 8.5,
      color: '#1E293B',
      marginBottom: 6,
    },
    expItem: {
      marginBottom: 8,
    },
    expHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    expRole: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#0F172A',
    },
    expPeriod: {
      fontSize: 8,
      color: '#64748B',
    },
    expCompany: {
      fontSize: 8.5,
      fontFamily: 'Helvetica-Oblique',
      color: '#475569',
      marginBottom: 3,
    },
    bullet: {
      fontSize: 8,
      color: '#334155',
      marginLeft: 6,
      marginBottom: 2,
    },
    eduItem: {
      marginBottom: 4,
    },
    eduDegree: {
      fontSize: 8.5,
      fontFamily: 'Helvetica-Bold',
      color: '#0F172A',
    },
    eduSchool: {
      fontSize: 8,
      color: '#475569',
    },
  });

  return (
    <Document title={`${resumeData.name}_Resume_${activePersona}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{resumeData.name}</Text>
          <Text style={styles.contactLine}>
            {resumeData.email}  |  {resumeData.website}  |  GitHub: {resumeData.github}  |  LinkedIn: {resumeData.linkedin}
          </Text>
        </View>

        {/* Executive Summary */}
        <Text style={styles.sectionTitle}>EXECUTIVE SUMMARY</Text>
        <Text style={styles.summary}>{personaSummary}</Text>

        {/* Technical Skills */}
        <Text style={styles.sectionTitle}>CORE TECHNICAL COMPETENCIES</Text>
        <Text style={styles.skillsText}>{highlightItems.join('  •  ')}</Text>

        {/* Experience */}
        <Text style={styles.sectionTitle}>PROFESSIONAL EXPERIENCE</Text>
        {resumeData.experience?.map((exp, idx) => (
          <View key={idx} style={styles.expItem}>
            <View style={styles.expHeader}>
              <Text style={styles.expRole}>{exp.role}</Text>
              <Text style={styles.expPeriod}>{exp.period}</Text>
            </View>
            <Text style={styles.expCompany}>{exp.company}  —  {exp.location}</Text>
            {exp.bullets?.map((b, bIdx) => {
              const text = typeof b === 'object' && b !== null
                ? b[activePersona] || b.general
                : String(b || '');
              return <Text key={bIdx} style={styles.bullet}>• {text}</Text>;
            })}
          </View>
        ))}

        {/* Education */}
        <Text style={styles.sectionTitle}>EDUCATION</Text>
        {resumeData.education?.map((edu, idx) => (
          <View key={idx} style={styles.eduItem}>
            <Text style={styles.eduDegree}>{edu.school}</Text>
            <Text style={styles.eduSchool}>{edu.degree}  —  {edu.location}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
