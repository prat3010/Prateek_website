'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import type { ResumeData, WorkExperience } from '@/data/resume';
import type { Certificate } from '@/data/certificates';
import { useTheme } from '@/context/ThemeContext';
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
  FileText,
  Rocket,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { getSkillsHighlight, type Persona } from '@/lib/skills';
import styles from './Resume.module.css';

interface ResumeProps {
  resumeData: ResumeData | null;
  certificates: Certificate[];
}

const RESUME_SECTION_TITLE_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'PROFESSIONAL DOSSIER', noir: 'SERVICE RECORD' },
  business:  { light: 'SERVICES & GUARANTEES', noir: 'SERVICES & GUARANTEES' },
};

const RESUME_BUTTON_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'DOWNLOAD PDF',                    noir: 'EXPORT DOSSIER' },
  business:  { light: 'DOWNLOAD SERVICES & PRICING GUIDE', noir: 'EXPORT SERVICES & PRICING GUIDE' },
};

function Resume({ resumeData, certificates }: ResumeProps) {
  const { isNoir, audience, region } = useTheme();
  const [activePersona, setActivePersona] = useState<Persona>('general');

  const activeAudience = audience || 'developer';

  const activeQuotation = React.useMemo(() => {
    if (!resumeData) return undefined;
    if (region === 'india' && resumeData.quotation_india) {
      return resumeData.quotation_india;
    }
    return resumeData.quotation;
  }, [resumeData, region]);

  if (!resumeData) {
    return null;
  }

  const handleDownloadPDF = () => {
    if (activeAudience === 'business') {
      import('@/utils/pdfGenerator').then(({ generateServicesAndPricingPDF }) => {
        generateServicesAndPricingPDF(resumeData);
      });
    } else {
      import('@/utils/pdfGenerator').then(({ generateResumePDF }) => {
        generateResumePDF(activePersona, resumeData);
      });
    }
  };

  // Get active summary based on persona
  const activeSummary = resumeData.summary[activePersona] || resumeData.summary.general;

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
          <div className={styles.titleContainer}>
            <Scrambler
              texts={RESUME_SECTION_TITLE_TEXTS}
              variant="section-title"
              as="h2"
              className={styles.sectionTitle}
            >
              {activeAudience === 'business'
                ? 'SERVICES & GUARANTEES'
                : (isNoir ? 'SERVICE RECORD' : 'PROFESSIONAL DOSSIER')}
            </Scrambler>
            {activeAudience === 'business' && (
              <p className={styles.sectionSubtitle}>
                For custom feature development, ongoing consulting, or bespoke technical partnership.
              </p>
            )}
          </div>
          
          <div className={styles.actions}>
            <button 
              onClick={handleDownloadPDF} 
              className={styles.printBtn}
              aria-label={
                activeAudience === 'business'
                  ? (isNoir ? 'EXPORT SERVICES & PRICING GUIDE - Download Commercial Services & Rate Card PDF' : 'DOWNLOAD SERVICES & PRICING GUIDE - Download Commercial Services & Rate Card PDF')
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
                  ? (isNoir ? 'EXPORT SERVICES & PRICING GUIDE' : 'DOWNLOAD SERVICES & PRICING GUIDE')
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
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAudience}
                className={styles.resumeContent}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeAudience === 'business' ? (
                  /* ---- Freelance Quotation Layout ---- */
                  <>
                    
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
                        <h4 className={styles.quoteCardLabel}>FIXED SCOPE GUARANTEE</h4>
                        <span className={styles.rateValue}>{activeQuotation?.scopeModel || "Fixed Milestones"}</span>
                        <span className={styles.rateUnit}>No hidden hourly charges</span>
                      </div>

                      <div className={styles.quoteCard}>
                        <h4 className={styles.quoteCardLabel}>FAST DELIVERY SPRINT</h4>
                        <span className={styles.rateValue}>{activeQuotation?.deliverySprint || "1–3 Weeks"}</span>
                        <span className={styles.rateUnit}>Rapid AI-Driven Turnaround</span>
                      </div>

                      <div className={styles.quoteCard}>
                        <h4 className={styles.quoteCardLabel}>POST-LAUNCH WARRANTY</h4>
                        <span className={styles.rateValue}>{activeQuotation?.warrantyModel || "30 Days Included"}</span>
                        <span className={styles.rateUnit}>Maintenance & Handoff</span>
                      </div>
                    </div>

                    {/* Terms and Deliverables */}
                    {/* Build Engines & Pricing Tiers Grid */}
                    <div className={styles.resumeSectionBlock}>
                      <h3 className={styles.blockTitle}>
                        <Cpu size={16} />
                        <span>COMMERCIAL BUILD ENGINES & TIERS</span>
                      </h3>
                      <div className={styles.packageGrid}>
                        <div className={styles.packageCard}>
                          <div>
                            <span className={styles.packageBadge}>Tier 1 • Single Page</span>
                            <h4 className={styles.packageTitle}>Landing Page Engine</h4>
                            <div className={styles.packagePrice}>INR 25k–45k / $300–$550</div>
                            <p className={styles.packageDesc}>High-converting showcase with Framer Motion, lead capture form, mobile responsive layout & SEO schema.</p>
                          </div>
                          <Link href="/scoping?engine=landing" className={styles.packageBtn}>
                            <span>SCOPE TIER 1</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>

                        <div className={styles.packageCard}>
                          <div>
                            <span className={styles.packageBadge}>Tier 2 • Multi-Page</span>
                            <h4 className={styles.packageTitle}>Multi-Page Web App</h4>
                            <div className={styles.packagePrice}>INR 45k–90k / $550–$1.1k</div>
                            <p className={styles.packageDesc}>Next.js 16 App Router, 3–6 pages, headless CMS integration, analytics telemetry & custom visual effects.</p>
                          </div>
                          <Link href="/scoping?engine=multipage" className={styles.packageBtn}>
                            <span>SCOPE TIER 2</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>

                        <div className={styles.packageCard}>
                          <div>
                            <span className={styles.packageBadge}>Tier 3 • Full-Stack</span>
                            <h4 className={styles.packageTitle}>SaaS MVP & App Portal</h4>
                            <div className={styles.packagePrice}>INR 90k–1.5L+ / $1.1k+</div>
                            <p className={styles.packageDesc}>Supabase Auth & Database, Stripe/Razorpay payments, role-gated admin portal & REST API integrations.</p>
                          </div>
                          <Link href="/scoping?engine=saas" className={styles.packageBtn}>
                            <span>SCOPE TIER 3</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>

                        <div className={styles.packageCard}>
                          <div>
                            <span className={styles.packageBadge}>Tier 4 • AI Vector</span>
                            <h4 className={styles.packageTitle}>Enterprise AI RAG Engine</h4>
                            <div className={styles.packagePrice}>INR 1.5L+ / $1.8k+</div>
                            <p className={styles.packageDesc}>Retriever RAG Core, vector search, grounded LLM assistant, clickable citations & team access controls.</p>
                          </div>
                          <Link href="/scoping?goal=ai_rag_app" className={styles.packageBtn}>
                            <span>SCOPE TIER 4</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Monthly SLA Care Plans Grid */}
                    <div className={styles.resumeSectionBlock}>
                      <h3 className={styles.blockTitle}>
                        <ShieldCheck size={16} />
                        <span>MONTHLY INFRASTRUCTURE & SLA CARE PLANS</span>
                      </h3>
                      <div className={styles.careGrid}>
                        <div className={styles.careCard}>
                          <h4 className={styles.careTitle}>Basic Care Plan</h4>
                          <div className={styles.carePrice}>INR 2,500/mo ($30/mo)</div>
                          <p className={styles.careDesc}>Hosting support, daily automated DB backups, security updates & 24/7 uptime monitoring.</p>
                        </div>
                        <div className={styles.careCard}>
                          <h4 className={styles.careTitle}>Standard Care Plan</h4>
                          <div className={styles.carePrice}>INR 6,500/mo ($80/mo)</div>
                          <p className={styles.careDesc}>Includes Basic Care + 2–4 hours monthly developer allocation for text/image updates & page tuning.</p>
                        </div>
                        <div className={styles.careCard}>
                          <h4 className={styles.careTitle}>Premium AI SLA Plan</h4>
                          <div className={styles.carePrice}>INR 15,000/mo ($180/mo)</div>
                          <p className={styles.careDesc}>Priority 24h SLA, AI vector index tuning, latency monitoring & dedicated feature engineering hours.</p>
                        </div>
                      </div>
                    </div>

                    {/* Terms and Deliverables */}
                    <div className={styles.resumeSectionBlock}>
                      <h3 className={styles.blockTitle}>
                        <FileText size={16} />
                        <span>STANDARD ENGAGEMENT TERMS</span>
                      </h3>
                      <p className={styles.summaryText}>{activeQuotation?.paymentTerms || "50% upfront deposit to initiate development, 50% upon final project delivery."}</p>
                    </div>

                    <div className={styles.resumeSectionBlock}>
                      <h3 className={styles.blockTitle}>
                        <Terminal size={16} />
                        <span>SERVICE DELIVERABLES</span>
                      </h3>
                      <ul className={styles.bulletsList}>
                        {(activeQuotation?.deliverables || [
                          "Custom UI Design & Prototype",
                          "Production-ready Next.js / React application",
                          "Supabase backend integration & security setup",
                          "SEO audit & optimization",
                          "30 days of post-launch bug warranty & handoff documentation"
                        ]).map((item, idx) => (
                          <li key={idx} className={styles.bulletItem}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Project Scoping CTA Card */}
                    <div className={styles.scopingCtaCard}>
                      <div className={styles.scopingCtaIcon}>
                        <Rocket size={20} />
                      </div>
                      <h4 className={styles.scopingCtaTitle}>Ready to Scope Your Next Project?</h4>
                      <p className={styles.scopingCtaText}>
                        Launch the Project Scoping Lab & Instant Quote wizard to configure your build tier, add-ons, and care plan in under 2 minutes.
                      </p>
                      <Link href="/scoping" className={styles.scopingCtaBtn}>
                        <Rocket size={16} />
                        <span>Launch Project Scoping Wizard</span>
                      </Link>
                    </div>

                  </>
                ) : (
                  /* ---- Standard Work Experience Timeline ---- */
                  <>
                    
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
                        {getSkillsHighlight(activePersona).map((skill) => (
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

                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </ComicPanel>
        </div>

        {/* ---- Credentials Section (Dev Mode Only) ---- */}
        {activeAudience !== 'business' && certificates.length > 0 && (
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
