'use client';

import React, { useState } from 'react';
import { X, Download, Moon, Sun, Shield, Sparkles } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import { generateMiddlemanAgreementPDF } from '@/utils/pdfGenerator';
import type { ResumeData, MiddlemanAgreementConfig } from '@/data/resume';
import styles from './MiddlemanAgreementModal.module.css';

interface MiddlemanAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData?: ResumeData | null;
}

export default function MiddlemanAgreementModal({
  isOpen,
  onClose,
  resumeData,
}: MiddlemanAgreementModalProps) {
  const [activeTheme, setActiveTheme] = useState<'azure' | 'noir'>('azure');

  if (!isOpen) return null;

  const mm: Partial<MiddlemanAgreementConfig> = resumeData?.intake?.middlemanAgreement || {};
  const partnerName = mm.partnerName || '[Partner Name]';
  const effectiveDate = mm.effectiveDate || 'August 2, 2026';
  const devName = mm.developerName || 'Prateeq Sharma';
  const devEmail = mm.developerEmail || '3010prateeksharma@gmail.com';
  const tier1Cut = mm.tier1Commission || '10%';
  const tier2Cut = mm.tier2Commission || '12%';
  const tier3Cut = mm.tier3Commission || '15%';
  const recurringCut = mm.recurringCommission || '10%';

  const disbursementRules = mm.disbursementRules || [
    "Rule 3.1 (No Out-of-Pocket Liability): Developer will never pay commissions out-of-pocket prior to client funds clearing bank accounts.",
    "Rule 3.2 (Proportional Payout Schedule): 50% of Commission disbursed within 48 business hours of receiving Client's 50% Upfront Deposit. 50% disbursed upon receiving Client's Final 50% Balance.",
    "Rule 3.3 (Cancellations & Defaults): In the event of a client default or partial scope cancellation, commission is calculated strictly on net funds actually collected and retained."
  ];

  const confidentialityRules = mm.confidentialityRules || [
    "Rule 4.1 (Non-Circumvention): Partner agrees not to bypass Developer or refer introduced clients to alternative software developers without express written consent.",
    "Rule 4.2 (Codebase & IP Ownership): All codebase assets, databases, and intellectual property remain the property of Developer until 100% of project contract fees are paid by Client.",
    "Rule 4.3 (Confidentiality & Non-Disclosure): Both parties agree to keep project quotes, client contact information, and internal commercial terms strictly confidential."
  ];

  const handleDownloadPDF = () => {
    generateMiddlemanAgreementPDF(activeTheme, resumeData);
  };

  return (
    <Portal>
      <div className={styles.overlay} onClick={onClose}>
        <div
          className={styles.modalContainer}
          data-theme={activeTheme}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className={styles.modalHeader}>
            <div className={styles.brandBadge}>
              <Sparkles size={14} />
              <span>PRATEEQ.IN | SALES PARTNER BRIEF</span>
            </div>

            {/* Theme Toggle Pills */}
            <div className={styles.themeToggleGroup}>
              <button
                type="button"
                className={`${styles.themeBtn} ${activeTheme === 'azure' ? styles.themeBtnActive : ''}`}
                onClick={() => setActiveTheme('azure')}
              >
                <Moon size={13} />
                <span>Cyber-Noir</span>
              </button>
              <button
                type="button"
                className={`${styles.themeBtn} ${activeTheme === 'noir' ? styles.themeBtnActive : ''}`}
                onClick={() => setActiveTheme('noir')}
              >
                <Sun size={13} />
                <span>Vintage Paper</span>
              </button>
            </div>

            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div 
            className={styles.modalBody}
            data-lenis-prevent
            data-lenis-prevent-touch
            data-lenis-prevent-wheel
          >
            <h2 className={styles.docTitle}>FREELANCE SALES & BUSINESS BROKER AGREEMENT</h2>
            <div className={styles.docSubtitle}>
              Official commercial terms, commission structure, and non-circumvention rules for business partners.
            </div>

            {/* Metadata Box */}
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span>EFFECTIVE DATE:</span>
                <strong>{effectiveDate}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>DEVELOPER:</span>
                <strong>{devName} (prateeq.in)</strong>
              </div>
              <div className={styles.metaItem}>
                <span>SALES REP / PARTNER:</span>
                <strong>{partnerName}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>CONTACT EMAIL:</span>
                <strong>{devEmail}</strong>
              </div>
            </div>

            {/* Section 1 */}
            <div className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>1. PURPOSE & ROLES OF ENGAGEMENT</h3>
              <p className={styles.paragraph}>
                This Agreement outlines the commercial terms, commission structure, payment schedules, and operational rules between {devName} (&quot;Developer&quot;) and {partnerName} (&quot;Sales Representative / Partner&quot;) for bringing client web development, custom software, and AI integration projects to the Developer.
              </p>
              <p className={styles.paragraph}>
                <strong>Partner Responsibilities:</strong> Lead Generation, Client Outreach, Discovery Brief Distribution, and securing signed brief &amp; deposit.
              </p>
              <p className={styles.paragraph}>
                <strong>Developer Responsibilities:</strong> Fixed-Price Scoping, Full-Stack/AI Building, Staging Hosting, QA, and Technical Alignment Call Support.
              </p>
            </div>

            {/* Section 2 */}
            <div className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>2. COMMISSION & COMPENSATION STRUCTURE</h3>
              <p className={styles.paragraph}>
                Commission is calculated as a percentage of net contract value (excluding third-party hosting/API fees):
              </p>
              <table className={styles.tableContainer}>
                <thead>
                  <tr>
                    <th>PROJECT TIER &amp; SCOPE RANGE</th>
                    <th>COMMISSION (%)</th>
                    <th>ESTIMATED PAYOUT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Tier 1: High-Converting Landing Page (₹25,000 – ₹45,000 / $300 – $550)</td>
                    <td><strong>{tier1Cut}</strong></td>
                    <td>₹2,500 – ₹4,500 ($30 – $55)</td>
                  </tr>
                  <tr>
                    <td>Tier 2: Custom Multi-Page Website (₹45,000 – ₹90,000 / $550 – $1,100)</td>
                    <td><strong>{tier2Cut}</strong></td>
                    <td>₹5,400 – ₹10,800 ($66 – $132)</td>
                  </tr>
                  <tr>
                    <td>Tier 3/4: Full-Stack Web App / AI RAG (₹90,000 – ₹2.5L+ / $1,100 – $3,000+)</td>
                    <td><strong>{tier3Cut}</strong></td>
                    <td>₹13,500 – ₹37,500+ ($165 – $450+)</td>
                  </tr>
                </tbody>
              </table>
              <p className={styles.paragraph}>
                <strong>Recurring Monthly Care Cut:</strong> For any client subscribing to a Monthly Tech Care Plan (₹10,000/mo or $150/mo), Partner receives a <strong>{recurringCut} recurring monthly commission</strong> (₹1,000/mo) for as long as the retainer remains active.
              </p>
            </div>

            {/* Section 3 */}
            <div className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>3. PAYMENT DISBURSEMENT &amp; TIMELINE RULES</h3>
              {disbursementRules.map((rule: string, idx: number) => (
                <p key={idx} className={styles.paragraph}>{rule}</p>
              ))}
            </div>

            {/* Section 4 */}
            <div className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>4. NON-CIRCUMVENTION &amp; CONFIDENTIALITY</h3>
              {confidentialityRules.map((rule: string, idx: number) => (
                <p key={idx} className={styles.paragraph}>{rule}</p>
              ))}
            </div>

            {/* Section 5 */}
            <div className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>5. SIGNATURE &amp; ACCEPTANCE BLOCK</h3>
              <div className={styles.sigGrid}>
                <div className={styles.sigBox}>
                  <div className={styles.sigRole}>DEVELOPER SIGNATURE</div>
                  <div><strong>NAME:</strong> {devName}</div>
                  <div><strong>TITLE:</strong> Principal Engineer &amp; Lead Architect</div>
                  <div><strong>DATE:</strong> {effectiveDate}</div>
                </div>
                <div className={styles.sigBox}>
                  <div className={styles.sigRole}>PARTNER / SALES REP SIGNATURE</div>
                  <div><strong>NAME:</strong> {partnerName}</div>
                  <div><strong>TITLE:</strong> Sales Representative &amp; Partner</div>
                  <div><strong>DATE:</strong> _______________</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className={styles.modalFooter}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--modal-muted)' }}>
              <Shield size={16} />
              <span>Theme: <strong>{activeTheme === 'azure' ? 'Cyber-Noir (Azure)' : 'Vintage Paper (Noir)'}</strong></span>
            </div>
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={handleDownloadPDF}
            >
              <Download size={16} />
              <span>Download Themed PDF Agreement</span>
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
