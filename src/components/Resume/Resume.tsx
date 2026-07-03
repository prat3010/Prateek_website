'use client';

import React, { useState } from 'react';
import type { ResumeData, WorkExperience } from '@/data/resume';
import type { Certificate } from '@/data/certificates';
import { useTheme, useAudience } from '@/context/ThemeContext';
import Scrambler from '@/components/ui/Scrambler';
import type { ScramblerProps } from '@/components/ui/Scrambler';
import ComicPanel from '@/components/ui/ComicPanel';
import { 
  Download, 
  ExternalLink, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Terminal, 
  Cpu, 
  Paintbrush, 
  User, 
  FileText 
} from 'lucide-react';
import styles from './Resume.module.css';

type Persona = 'general' | 'fullstack' | 'ai' | 'creative';

interface ResumeProps {
  resumeData: ResumeData | null;
  certificates: Certificate[];
}

const RESUME_SECTION_TITLE_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'PROFESSIONAL DOSSIER',       noir: 'SERVICE RECORD' },
  business:  { light: 'FREELANCE SERVICE QUOTATION', noir: 'RATE CARD & TERMS' },
};

const RESUME_BUTTON_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'DOWNLOAD PDF',       noir: 'EXPORT DOSSIER' },
  business:  { light: 'DOWNLOAD RATE CARD', noir: 'EXPORT QUOTATION' },
};

function Resume({ resumeData, certificates }: ResumeProps) {
  const { isNoir } = useTheme();
  const { audience } = useAudience();
  const [activePersona, setActivePersona] = useState<Persona>('general');

  const activeAudience = audience || 'developer';

  if (!resumeData) {
    return null;
  }

  const handleDownloadPDF = () => {
    if (activeAudience === 'business') {
      import('@/utils/pdfGenerator').then(({ generateQuotationPDF }) => {
        generateQuotationPDF(resumeData);
      });
    } else {
      import('@/utils/pdfGenerator').then(({ generateResumePDF }) => {
        generateResumePDF(activePersona, resumeData);
      });
    }
  };

  // Get active summary based on persona
  const activeSummary = resumeData.summary[activePersona] || resumeData.summary.general;

  // Filter skills based on persona category
  const getSkillsHighlight = () => {
    switch (activePersona) {
      case 'fullstack':
        return ['API Architecture', 'Database Engineering', 'Algorithmic Translation', 'Data Analysis', 'Stack-on-Demand'];
      case 'ai':
        return ['AI Agent Orchestration', 'Structured Prompting', 'AI Dev Workflows', 'API Architecture', 'Python'];
      case 'creative':
        return ['Product Strategy & UX', 'Design to Code', 'Privacy Sandboxing', 'Stack-on-Demand'];
      default:
        return ['AI Agent Orchestration', 'Database Engineering', 'Product Strategy & UX', 'Algorithmic Translation', 'Stack-on-Demand'];
    }
  };

  // Helper to render bullet points based on the active persona
  const renderBullet = (bullet: WorkExperience['bullets'][number]) => {
    const text = bullet[activePersona] || bullet.general;
    return text;
  };

  // Format date helper (e.g. 2026-06-12 -> Jun 2026)
  const formatCertDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <section id="resume" className={styles.resumeSection} aria-label="Professional Dossier">
      <div className={styles.container}>
        
        {/* ---- Header & Action Bar ---- */}
        <div className={styles.sectionHeader}>
          <Scrambler
            texts={RESUME_SECTION_TITLE_TEXTS}
            variant="section-title"
            as="h2"
            className={styles.sectionTitle}
          >
            {activeAudience === 'business'
              ? (isNoir ? 'RATE CARD & TERMS' : 'FREELANCE SERVICE QUOTATION')
              : (isNoir ? 'SERVICE RECORD' : 'PROFESSIONAL DOSSIER')}
          </Scrambler>
          
          <div className={styles.actions}>
            <button 
              onClick={handleDownloadPDF} 
              className={styles.printBtn}
              aria-label={
                activeAudience === 'business'
                  ? (isNoir ? 'EXPORT QUOTATION - Download Quotation Rate Card PDF' : 'DOWNLOAD RATE CARD - Download Quotation Rate Card PDF')
                  : (isNoir ? 'EXPORT DOSSIER - Download ATS Resume as PDF' : 'DOWNLOAD PDF - Download ATS Resume as PDF')
              }
            >
              <Download size={18} />
              <Scrambler
                texts={RESUME_BUTTON_TEXTS}
                variant="nav-label"
                as="span"
              >
                {activeAudience === 'business'
                  ? (isNoir ? 'EXPORT QUOTATION' : 'DOWNLOAD RATE CARD')
                  : (isNoir ? 'EXPORT DOSSIER' : 'DOWNLOAD PDF')}
              </Scrambler>
            </button>
          </div>
        </div>

        {/* ---- Agent Sync log status ---- */}
        {resumeData.lastSynced && (
          <div className={styles.agentTicker}>
            <div className={styles.tickerTag}>
              <Terminal size={14} className={styles.pulse} />
              <span>SYNC_AGENT</span>
            </div>
            <div className={styles.tickerText}>
              <span>STATUS: ACTIVE | LAST SYNCED: {new Date(resumeData.lastSynced.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} | CHANGE: {resumeData.lastSynced.summary}</span>
            </div>
          </div>
        )}

        {/* ---- Interactive Persona Switcher (Hidden in Business Mode) ---- */}
        {activeAudience !== 'business' && (
          <div className={styles.personaBar}>
            <div className={styles.personaLabel}>
              <span>{isNoir ? 'SELECT FILTER:' : 'VIEW PERSONA:'}</span>
            </div>
            <div className={styles.personaButtons}>
              {(['general', 'fullstack', 'ai', 'creative'] as Persona[]).map((persona) => (
                <button
                  key={persona}
                  onClick={() => setActivePersona(persona)}
                  className={`${styles.personaBtn} ${activePersona === persona ? styles.active : ''}`}
                >
                  {persona === 'general' && <User size={14} />}
                  {persona === 'fullstack' && <Cpu size={14} />}
                  {persona === 'ai' && <Terminal size={14} />}
                  {persona === 'creative' && <Paintbrush size={14} />}
                  <span>
                    {persona === 'general' && 'General'}
                    {persona === 'fullstack' && 'Fullstack Dev'}
                    {persona === 'ai' && 'AI Orchestration'}
                    {persona === 'creative' && 'Creative'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---- Main Resume / Quotation Layout ---- */}
        <div className={styles.resumeCardWrapper}>
          <ComicPanel tilt={1} className={styles.resumePaper} staticDots>
            {activeAudience === 'business' ? (
              /* ---- Freelance Quotation Layout ---- */
              <div className={styles.resumeContent}>
                
                {/* Header Info */}
                <div className={styles.resumeHeader}>
                  <div className={styles.mainInfo}>
                    <h2 className={styles.name}>{resumeData.name}</h2>
                    <p className={styles.title}>Freelance Services & Rate Card</p>
                  </div>
                  <div className={styles.contactInfo}>
                    <span>{resumeData.email}</span>
                    <span>{resumeData.phone}</span>
                    <span>
                      <a href={resumeData.website} target="_blank" rel="noopener noreferrer" className={styles.link}>
                        {resumeData.website.replace('https://', '')} <ExternalLink size={12} />
                      </a>
                    </span>
                  </div>
                </div>

                <hr className={styles.divider} />

                {/* Rate Card Grid */}
                <div className={styles.quoteGrid}>
                  <div className={styles.quoteCard}>
                    <h4 className={styles.quoteCardLabel}>ESTIMATED HOURLY RATE</h4>
                    <span className={styles.rateValue}>{resumeData.quotation?.hourlyRate || "$50"}</span>
                    <span className={styles.rateUnit}>per hour</span>
                  </div>

                  <div className={styles.quoteCard}>
                    <h4 className={styles.quoteCardLabel}>STANDARD DAY RATE (8H)</h4>
                    <span className={styles.rateValue}>{resumeData.quotation?.dayRate || "$350"}</span>
                    <span className={styles.rateUnit}>per day</span>
                  </div>
                </div>

                {/* Terms and Deliverables */}
                <div className={styles.resumeSectionBlock}>
                  <h3 className={styles.blockTitle}>
                    <FileText size={16} />
                    <span>STANDARD ENGAGEMENT TERMS</span>
                  </h3>
                  <p className={styles.summaryText}>{resumeData.quotation?.paymentTerms || "50% upfront, 30% after design/milestone 1, 20% on final delivery."}</p>
                </div>

                <div className={styles.resumeSectionBlock}>
                  <h3 className={styles.blockTitle}>
                    <Terminal size={16} />
                    <span>SERVICE DELIVERABLES</span>
                  </h3>
                  <ul className={styles.bulletsList}>
                    {(resumeData.quotation?.deliverables || [
                      "Custom UI Design & Prototype",
                      "Production-ready Next.js / React application",
                      "Supabase backend integration & security setup",
                      "SEO audit & optimization",
                      "3 months of support & maintenance"
                    ]).map((item, idx) => (
                      <li key={idx} className={styles.bulletItem}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call to action scrolling to Contact form */}
                <div className={styles.quoteActionWrapper}>
                  <button
                    onClick={() => {
                      const el = document.getElementById('contact');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={styles.quoteActionBtn}
                  >
                    <span>REQUEST CUSTOM QUOTE</span>
                  </button>
                </div>

              </div>
            ) : (
              /* ---- Standard Work Experience Timeline ---- */
              <div className={styles.resumeContent}>
                
                {/* Header Info */}
                <div className={styles.resumeHeader}>
                  <div className={styles.mainInfo}>
                    <h2 className={styles.name}>{resumeData.name}</h2>
                    <p className={styles.title}>{resumeData.title}</p>
                  </div>
                  <div className={styles.contactInfo}>
                    <span>{resumeData.email}</span>
                    <span>{resumeData.phone}</span>
                    <span>
                      <a href={resumeData.website} target="_blank" rel="noopener noreferrer" className={styles.link}>
                        {resumeData.website.replace('https://', '')} <ExternalLink size={12} />
                      </a>
                    </span>
                  </div>
                </div>

                <hr className={styles.divider} />

                {/* Summary Section */}
                <div className={styles.resumeSectionBlock}>
                  <h3 className={styles.blockTitle}>
                    <FileText size={16} />
                    <span>PROFESSIONAL SUMMARY</span>
                  </h3>
                  <p className={styles.summaryText}>{activeSummary}</p>
                </div>

                {/* Dynamic Skills Highlights */}
                <div className={styles.resumeSectionBlock}>
                  <h3 className={styles.blockTitle}>
                    <Terminal size={16} />
                    <span>CORE CAPABILITIES</span>
                  </h3>
                  <div className={styles.skillsList}>
                    {getSkillsHighlight().map((skill) => (
                      <span key={skill} className={styles.skillTag}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Experience Section */}
                <div className={styles.resumeSectionBlock}>
                  <h3 className={styles.blockTitle}>
                    <Briefcase size={16} />
                    <span>WORK EXPERIENCE</span>
                  </h3>
                  <div className={styles.timeline}>
                    {resumeData.experience.map((exp) => (
                      <div key={exp.id} className={styles.timelineItem}>
                        <div className={styles.timelineHeader}>
                          <div>
                            <h4 className={styles.roleTitle}>{exp.role}</h4>
                            <span className={styles.companyName}>{exp.company}</span>
                          </div>
                          <div className={styles.meta}>
                            <span className={styles.period}>{exp.period}</span>
                            <span className={styles.location}>{exp.location}</span>
                          </div>
                        </div>
                        <ul className={styles.bulletsList}>
                          {exp.bullets.map((bullet, idx) => (
                            <li key={idx} className={styles.bulletItem}>
                              {renderBullet(bullet)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education Section */}
                <div className={styles.resumeSectionBlock}>
                  <h3 className={styles.blockTitle}>
                    <GraduationCap size={16} />
                    <span>EDUCATION</span>
                  </h3>
                  <div className={styles.educationGrid}>
                    {resumeData.education.map((edu, idx) => (
                      <div key={idx} className={styles.educationItem}>
                        <div className={styles.eduHeader}>
                          <h4 className={styles.schoolName}>{edu.school}</h4>
                          <span className={styles.eduPeriod}>{edu.period}</span>
                        </div>
                        <p className={styles.degree}>{edu.degree} &mdash; <span className={styles.eduLoc}>{edu.location}</span></p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </ComicPanel>
        </div>

        {/* ---- Credentials Section ---- */}
        {certificates.length > 0 && (
          <div className={styles.certsWrapper}>
            <h3 className={styles.certsTitle}>
              <Award size={22} />
              <span>VERIFIED CREDENTIALS</span>
            </h3>
            <div className={styles.certsGrid}>
              {certificates.map((cert) => (
                <div key={cert.id} className={styles.certCard}>
                  <ComicPanel tilt={-1} className={styles.certPaper} staticDots>
                    <div className={styles.certContent}>
                      <div className={styles.certMeta}>
                        <span className={styles.certIssuer}>{cert.issuer}</span>
                        <span className={styles.certDate}>{formatCertDate(cert.date)}</span>
                      </div>
                      <h4 className={styles.certName}>{cert.title}</h4>
                      {cert.credentialId && (
                        <p className={styles.certId}>ID: <code>{cert.credentialId}</code></p>
                      )}
                      <div className={styles.certFooter}>
                        <div className={styles.certTags}>
                          {cert.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className={styles.certTag}>#{tag}</span>
                          ))}
                        </div>
                        {cert.verifyUrl && (
                          <a 
                            href={cert.verifyUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={styles.verifyLink}
                            aria-label={`Verify credential for ${cert.title}`}
                          >
                            <span>VERIFY</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </ComicPanel>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default React.memo(Resume);
