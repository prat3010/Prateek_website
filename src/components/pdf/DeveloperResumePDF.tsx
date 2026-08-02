import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/data/resume';
import { getSkillsHighlight, type Persona } from '@/lib/skills';
import { SkylineVectorHeader } from './SkylineVectorHeader';

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
      padding: 28,
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
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      color: '#0F172A',
      letterSpacing: 0.5,
    },
    contactLine: {
      fontSize: 8,
      color: '#475569',
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1E3A8A',
      backgroundColor: '#EFF6FF',
      padding: 3,
      borderRadius: 3,
      marginTop: 8,
      marginBottom: 4,
      borderLeftWidth: 3,
      borderLeftColor: '#2563EB',
    },
    summary: {
      fontSize: 8.5,
      color: '#334155',
      marginBottom: 8,
      lineHeight: 1.4,
    },
    skillsText: {
      fontSize: 8,
      color: '#0284C7',
      fontFamily: 'Helvetica-Bold',
      marginBottom: 8,
    },
    expItem: {
      marginBottom: 6,
    },
    expHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    expRole: {
      fontSize: 8.5,
      fontFamily: 'Helvetica-Bold',
      color: '#0F172A',
    },
    expCompany: {
      fontSize: 8,
      color: '#475569',
    },
    expPeriod: {
      fontSize: 7.5,
      color: '#64748B',
    },
    expDesc: {
      fontSize: 8,
      color: '#334155',
      marginBottom: 2,
    },
    bullet: {
      fontSize: 7.5,
      color: '#475569',
      paddingLeft: 6,
      marginBottom: 1.5,
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
        <SkylineVectorHeader
          title={resumeData.name.toUpperCase()}
          sub={`FULL-STACK SOFTWARE ENGINEER // ${activePersona.toUpperCase()} PROFILE`}
          theme="noir"
        />

        {/* Contact Line */}
        <View style={styles.header}>
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
