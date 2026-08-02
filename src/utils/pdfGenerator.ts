import { jsPDF } from 'jspdf';
import type { ResumeData, MiddlemanAgreementConfig } from '../data/resume';
import { getSkillsHighlight, type Persona } from '../lib/skills';

export function generateResumePDF(activePersona: Persona, resumeData: ResumeData) {
  // 1. Initialize A4 Document (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Page Dimensions & Offsets
  const pageWidth = 210;
  const leftMargin = 20;
  const rightMargin = 20;
  const contentWidth = pageWidth - leftMargin - rightMargin; // 170mm
  let y = 20; // Vertical pointer in mm

  // Helper to draw horizontal dividers
  const drawDivider = () => {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);
    doc.line(leftMargin, y, pageWidth - rightMargin, y);
    y += 5;
  };

  // Helper to check and handle page breaks
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > 280) {
      doc.addPage();
      y = 20;
      return true; // Page was added
    }
    return false;
  };

  // Helper to write wrapped body text block
  const drawTextParagraph = (text: string, fontSize = 9.5, isBold = false) => {
    doc.setFont('Helvetica', isBold ? 'Bold' : 'Normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(40, 40, 40);
    
    // Split text to fit inside margins
    const lines: string[] = doc.splitTextToSize(text, contentWidth);
    
    lines.forEach((line) => {
      checkPageBreak(fontSize * 0.45);
      doc.text(line, leftMargin, y);
      y += fontSize * 0.45; // Line height spacing
    });
    y += 2; // Paragraph bottom gap
  };

  // ─── 1. HEADER SECTION ───
  // Name
  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  // Use a hybrid legal/stage name for job applications to prevent background-check confusion
  const displayNameForResume = resumeData.name === "Prateeq Sharma" ? "Prateek 'Prateeq' Sharma" : resumeData.name;
  doc.text(displayNameForResume, leftMargin, y);
  y += 7;

  // Title
  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90); // Muted slate gray
  doc.text(resumeData.title.toUpperCase(), leftMargin, y);
  y += 6;

  // Contact Info Row
  doc.setFont('Helvetica', 'Normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  const contactText = `${resumeData.email}  |  ${resumeData.phone}  |  prateeq.in`;
  doc.text(contactText, leftMargin, y);
  y += 5;
  
  drawDivider();

  // ─── 2. PROFESSIONAL SUMMARY ───
  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text('PROFESSIONAL SUMMARY', leftMargin, y);
  y += 2;
  drawDivider();

  const summary = resumeData.summary[activePersona] || resumeData.summary.general;
  drawTextParagraph(summary, 9.5);
  y += 4;

  // ─── 3. CORE CAPABILITIES ───
  checkPageBreak(15);
  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text('CORE CAPABILITIES', leftMargin, y);
  y += 2;
  drawDivider();

  // Get active skills array
  const activeSkills = getSkillsHighlight(activePersona);
  doc.setFont('Helvetica', 'Normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(activeSkills.join('  •  '), leftMargin, y);
  y += 9;

  // ─── 4. WORK EXPERIENCE ───
  checkPageBreak(20);
  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text('WORK EXPERIENCE', leftMargin, y);
  y += 2;
  drawDivider();

  resumeData.experience.forEach((exp) => {
    // Check page break before starting a job entry (Role, dates, company, location takes approx 15mm)
    checkPageBreak(15);

    // Role Title & Period Row
    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    doc.text(exp.role, leftMargin, y);
    
    doc.setFont('Helvetica', 'Normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(exp.period, pageWidth - rightMargin, y, { align: 'right' });
    y += 4.5;

    // Company & Location Row
    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(9);
    doc.setTextColor(90, 110, 150); // Accent blue color
    doc.text(exp.company, leftMargin, y);
    
    doc.setFont('Helvetica', 'Italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(exp.location, pageWidth - rightMargin, y, { align: 'right' });
    y += 5.5;

    // Bullet Points
    exp.bullets.forEach((bullet) => {
      const text = bullet[activePersona] || bullet.general;
      const wrappedBullet: string[] = doc.splitTextToSize(text, contentWidth - 6);
      const neededHeight = wrappedBullet.length * 4.5 + 2;

      // Check page break before rendering this bullet point to prevent orphan bullet lines
      checkPageBreak(neededHeight);

      // Draw bullet character
      doc.setFont('Helvetica', 'Bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text('•', leftMargin + 2, y);

      // Draw bullet text offset to the right
      doc.setFont('Helvetica', 'Normal');
      doc.setFontSize(9.5);
      doc.setTextColor(40, 40, 40);
      
      wrappedBullet.forEach((line) => {
        doc.text(line, leftMargin + 6, y);
        y += 4.5;
      });
      y += 1; // Gap between bullets
    });
    y += 3;
  });

  // ─── 5. EDUCATION ───
  checkPageBreak(20);
  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text('EDUCATION', leftMargin, y);
  y += 2;
  drawDivider();

  resumeData.education.forEach((edu) => {
    // Check page break before starting an education entry (Approx 12mm)
    checkPageBreak(12);

    // School Name & Period
    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(edu.school, leftMargin, y);
    
    doc.setFont('Helvetica', 'Normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(edu.period, pageWidth - rightMargin, y, { align: 'right' });
    y += 4.5;

    // Degree & Location
    doc.setFont('Helvetica', 'Normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`${edu.degree}  —  ${edu.location}`, leftMargin, y);
    y += 6;
  });

  // 6. Trigger Direct File Download
  doc.save(`Prateek_Sharma_Resume_${activePersona}.pdf`);
}

export function generateQuotationPDF(resumeData: ResumeData, region: 'india' | 'global' = 'global') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const leftMargin = 20;
  const rightMargin = 20;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  let y = 20;

  const drawDivider = () => {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);
    doc.line(leftMargin, y, pageWidth - rightMargin, y);
    y += 5;
  };

  const drawTextParagraph = (text: string, fontSize = 9.5) => {
    doc.setFont('Helvetica', 'Normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(40, 40, 40);
    const lines: string[] = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      if (y + 5 > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, leftMargin, y);
      y += fontSize * 0.45;
    });
    y += 2;
  };

  // Header
  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text(resumeData.name, leftMargin, y);
  y += 7;

  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text('FREELANCE SERVICES & RATE CARD', leftMargin, y);
  y += 6;

  doc.setFont('Helvetica', 'Normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`${resumeData.email}  |  ${resumeData.phone}  |  prateeq.in`, leftMargin, y);
  y += 5;
  drawDivider();

  // Engagement Brief
  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('ENGAGEMENT BRIEF', leftMargin, y);
  y += 2;
  drawDivider();
  
  const briefText = "I partner directly with businesses to build high-performance products, custom web architectures, and smooth design systems. My focus is on eliminating agency overhead and delivering high-velocity, clean, and search-optimized platforms that drive actual business outcomes.";
  drawTextParagraph(briefText, 10);
  y += 5;

  // Rate Card & High-Trust Guarantees
  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('ENGAGEMENT MODEL & VALUE GUARANTEES', leftMargin, y);
  y += 2;
  drawDivider();

  const quoteSource = (region === 'india' && resumeData.quotation_india) ? resumeData.quotation_india : resumeData.quotation;
  const scopeModel = quoteSource?.scopeModel || "Fixed-Price Milestones (No hidden hourly charges)";
  const deliverySprint = quoteSource?.deliverySprint || "1 to 3 Weeks Turnaround Sprint";
  const warrantyModel = quoteSource?.warrantyModel || "Included 30-Day Post-Launch Support & Warranty";
  const terms = quoteSource?.paymentTerms || "50% upfront deposit to initiate development, 50% upon final project delivery.";

  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);

  doc.text(`* Fixed Scope Guarantee: `, leftMargin, y);
  doc.setFont('Helvetica', 'Normal');
  doc.text(scopeModel, leftMargin + 45, y);
  y += 5.5;

  doc.setFont('Helvetica', 'Bold');
  doc.text(`* Fast Delivery Sprint: `, leftMargin, y);
  doc.setFont('Helvetica', 'Normal');
  doc.text(deliverySprint, leftMargin + 45, y);
  y += 5.5;

  doc.setFont('Helvetica', 'Bold');
  doc.text(`* Post-Launch Warranty: `, leftMargin, y);
  doc.setFont('Helvetica', 'Normal');
  doc.text(warrantyModel, leftMargin + 45, y);
  y += 7.5;

  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Standard Payment Terms:', leftMargin, y);
  y += 4.5;
  drawTextParagraph(terms, 9.5);
  y += 5;

  // Deliverables checklist
  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('STANDARD SERVICE DELIVERABLES', leftMargin, y);
  y += 2;
  drawDivider();

  const deliverables = quoteSource?.deliverables || [
    "Custom UI Design & Interactive Prototype",
    "Production-ready Next.js / React application",
    "Supabase database engineering & security setups",
    "Search Engine Optimization (SEO) & Web Telemetry setup",
    "30 days of post-launch support & handoff documentation"
  ];

  deliverables.forEach((item) => {
    if (y + 10 > 280) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(10);
    doc.text('[x]', leftMargin, y);
    doc.setFont('Helvetica', 'Normal');
    doc.setFontSize(9.5);
    doc.text(item, leftMargin + 10, y);
    y += 6.5;
  });

  doc.save(`${resumeData.name.replace(/\s+/g, '_')}_Service_Quotation.pdf`);
}

export interface QuestionnaireData {
  companyName?: string;
  contactEmail?: string;
  contactPhone?: string;
  projectGoal?: string;
  targetAudience?: string;
  projectCategory?: string;
  features?: string[];
  assetsStatus?: string;
  inspirationLinks?: string;
  timeline?: string;
  budgetRange?: string;
  additionalNotes?: string;
}

export function generateQuestionnairePDF(resumeData?: ResumeData | null, data?: QuestionnaireData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const leftMargin = 18;
  const rightMargin = 18;
  const contentWidth = pageWidth - leftMargin - rightMargin; // 174mm
  let y = 16;

  const intakeConfig = resumeData?.intake;

  const drawSkylineBanner = (startY: number) => {
    // Top Banner Fill
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(leftMargin, startY, contentWidth, 18, 'F');

    // Vector Skyline Contour Silhouette on right of banner
    doc.setDrawColor(56, 189, 248); // Cyan Accent
    doc.setLineWidth(0.35);

    const base = startY + 18;
    const bX = leftMargin + contentWidth - 62;
    doc.line(bX, base, bX, base - 7);
    doc.line(bX, base - 7, bX + 5, base - 7);
    doc.line(bX + 5, base - 7, bX + 5, base - 11);
    doc.line(bX + 5, base - 11, bX + 11, base - 11);
    doc.line(bX + 11, base - 11, bX + 11, base - 5);
    doc.line(bX + 11, base - 5, bX + 16, base - 5);
    doc.line(bX + 16, base - 5, bX + 16, base - 13);
    doc.line(bX + 16, base - 13, bX + 22, base - 13);
    doc.line(bX + 19, base - 13, bX + 19, base - 16); // Spire Antenna
    doc.line(bX + 22, base - 13, bX + 22, base - 8);
    doc.line(bX + 22, base - 8, bX + 30, base - 8);
    doc.line(bX + 30, base - 8, bX + 30, base - 12);
    doc.line(bX + 30, base - 12, bX + 38, base - 12);
    doc.line(bX + 38, base - 12, bX + 38, base - 6);
    doc.line(bX + 38, base - 6, bX + 46, base - 6);
    doc.line(bX + 46, base - 6, bX + 46, base - 14);
    doc.line(bX + 46, base - 14, bX + 54, base - 14);
    doc.line(bX + 54, base - 14, bX + 54, base);

    // Banner Text Branding
    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('PRATEEQ.IN', leftMargin + 5, startY + 7);

    doc.setFont('Helvetica', 'Normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('FULL-STACK & AI ARCHITECTURE // SCOPING SPECIFICATION', leftMargin + 5, startY + 13);
  };

  const drawHeader = (title: string, pageNum: number) => {
    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(title, leftMargin, y);
    y += 4.5;

    doc.setFont('Helvetica', 'Normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Prateeq Sharma | Engineering & Custom Web Builds | Page ${pageNum} of 3 | REF: PRTQ-SCOPE-2026`, leftMargin, y);
    y += 4;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(leftMargin, y, pageWidth - rightMargin, y);
    y += 5.5;
  };

  const drawFooterMicroLine = () => {
    const footY = 282;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(leftMargin, footY, pageWidth - rightMargin, footY);

    doc.setFont('Helvetica', 'Normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('CONFIDENTIAL SCOPING BRIEF // GENERATED BY PRATEEQ.IN SCOPING LAB', leftMargin, footY + 4);
    doc.text('https://prateeq.in', pageWidth - rightMargin - 24, footY + 4);
  };

  const addSectionTitle = (title: string) => {
    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);
    doc.text(title, leftMargin, y);
    y += 3.5;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(leftMargin, y, pageWidth - rightMargin, y);
    y += 4.5;
  };

  const addFieldRow = (label: string, value?: string, defaultLine = '_____________________________________________') => {
    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`${label}:`, leftMargin, y);
    
    doc.setFont('Helvetica', 'Normal');
    doc.setTextColor(15, 23, 42);
    const textVal = value && value.trim() ? value.trim() : defaultLine;
    const lines: string[] = doc.splitTextToSize(textVal, contentWidth - 48);
    doc.text(lines[0] || defaultLine, leftMargin + 48, y);
    y += 5;
  };

  // ================= PAGE 1 =================
  drawSkylineBanner(y);
  y += 22;
  drawHeader('CLIENT DISCOVERY & SCOPING SPECIFICATION', 1);

  // Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(leftMargin, y, contentWidth, 22, 'FD');
  
  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`DATE: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, leftMargin + 4, y + 6);
  doc.text(`CLIENT / COMPANY: ${data?.companyName || '___________________________'}`, leftMargin + 60, y + 6);
  doc.text(`EMAIL: ${data?.contactEmail || '___________________________'}`, leftMargin + 4, y + 13);
  doc.text(`PHONE: ${data?.contactPhone || '___________________________'}`, leftMargin + 60, y + 13);
  doc.text(`TARGET LAUNCH: ${data?.timeline || '___________________________'}`, leftMargin + 4, y + 19);
  y += 26;

  // Section 1: Business Identity & Objectives
  addSectionTitle('1. BUSINESS OBJECTIVE & TARGET PERSONA');
  addFieldRow('Primary Business Goal', data?.projectGoal);
  addFieldRow('Target Audience / Persona', data?.targetAudience);
  y += 3;

  // Section 2: Investment Tiers Table (TIER-FIRST FLOW)
  addSectionTitle('2. COMMERCIAL INVESTMENT TIERS (SELECT TARGET TIER)');

  const budgetTiers = intakeConfig?.budgetTiers || [
    "Tier 1: High-Converting Landing Page (₹25,000 – ₹45,000 / $300 – $550)",
    "Tier 2: Custom Multi-Page Web App (₹45,000 – ₹90,000 / $550 – $1,100)",
    "Tier 3: Full-Stack Web App / AI RAG (₹90,000 – ₹1.5L+ / $1,100 – $2,000+)",
    "Custom Scope / Enterprise Infrastructure"
  ];

  // Table Box Header
  const tableStartY = y;
  doc.setFillColor(241, 245, 249);
  doc.rect(leftMargin, y, contentWidth, 6.5, 'F');
  
  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('TIER & VALUE RANGE', leftMargin + 4, y + 4.5);
  doc.text('INCLUDED ARCHITECTURE SCOPE', leftMargin + 104, y + 4.5);
  y += 6.5;

  const tierRows = [
    [budgetTiers[0], "Responsive Motion UI, SEO Engine, Contact Form, ReCAPTCHA"],
    [budgetTiers[1], "Multi-page App, Supabase Auth, Client Portal, Headless Blog CMS"],
    [budgetTiers[2], "Full-Stack SaaS MVP, Private AI RAG Search Engine, Admin Dashboard"],
    [budgetTiers[3], "Bespoke Microservices, Custom AI Pipelines, Enterprise SLA"]
  ];

  tierRows.forEach((row) => {
    const isSelected = data?.budgetRange?.includes(row[0]) || row[0] === data?.budgetRange;
    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(8);
    doc.setTextColor(isSelected ? 2 : 51, isSelected ? 132 : 65, isSelected ? 199 : 85);
    doc.text(isSelected ? '[✓]' : '[  ]', leftMargin + 4, y + 4.5);
    
    doc.setFont('Helvetica', isSelected ? 'Bold' : 'Normal');
    doc.setTextColor(15, 23, 42);
    const col1Lines = doc.splitTextToSize(row[0], 92);
    doc.text(col1Lines, leftMargin + 12, y + 4.5);
    
    const col2Lines = doc.splitTextToSize(row[1], 66);
    doc.text(col2Lines, leftMargin + 104, y + 4.5);

    y += Math.max(col1Lines.length * 4.5, col2Lines.length * 4.5, 7);
  });

  doc.setDrawColor(203, 213, 225);
  doc.rect(leftMargin, tableStartY, contentWidth, y - tableStartY);
  drawFooterMicroLine();

  // ================= PAGE 2 =================
  doc.addPage();
  y = 18;
  drawHeader('TECHNICAL SCOPE MATRIX & BRAND INVENTORY', 2);

  // Section 3: Technical Scope & Feature Matrix
  addSectionTitle('3. TECHNICAL ARCHITECTURE MATRIX & FEATURE CHECKLIST');

  const featureOptions = intakeConfig?.featureOptions || [
    "Contact Form / Lead Capture (ReCAPTCHA Protected)",
    "Payment Gateway (Stripe/Razorpay)",
    "User Auth & Client Portal (Google/Magic Link)",
    "Headless Blog / CMS Content Management",
    "Private AI Knowledge Base / Vector Search (RAG)",
    "Admin Dashboard & Role Access Control",
    "Automated Email Workflows (Resend Transactional)",
    "Privacy-Compliant Analytics & Visitor Telemetry"
  ];

  const featTableStart = y;
  doc.setFillColor(241, 245, 249);
  doc.rect(leftMargin, y, contentWidth, 6.5, 'F');
  
  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('FUNCTIONAL MODULE / FEATURE', leftMargin + 4, y + 4.5);
  doc.text('SCOPE STATUS', leftMargin + 124, y + 4.5);
  y += 6.5;

  featureOptions.forEach((feat) => {
    const isSelected = data?.features?.includes(feat) || data?.features?.some(f => feat.toLowerCase().includes(f.toLowerCase()));
    
    doc.setFont('Helvetica', isSelected ? 'Bold' : 'Normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    const featLines = doc.splitTextToSize(feat, 114);
    doc.text(featLines, leftMargin + 4, y + 4.5);

    doc.setFont('Helvetica', 'Bold');
    doc.setTextColor(isSelected ? 2 : 100, isSelected ? 132 : 116, isSelected ? 199 : 139);
    doc.text(isSelected ? '[✓ INCLUDED IN SCOPE]' : '[   OUT OF SCOPE   ]', leftMargin + 124, y + 4.5);

    y += Math.max(featLines.length * 4.5, 6.5);
  });

  doc.setDrawColor(203, 213, 225);
  doc.rect(leftMargin, featTableStart, contentWidth, y - featTableStart);
  y += 5;

  // Section 4: Brand Asset Readiness
  addSectionTitle('4. BRAND ASSET & CONTENT INVENTORY');
  addFieldRow('Brand Assets Status', data?.assetsStatus);
  addFieldRow('Visual & Competitor Inspo', data?.inspirationLinks);
  addFieldRow('Additional Notes / Scope', data?.additionalNotes, 'None specified');
  
  drawFooterMicroLine();

  // ================= PAGE 3 =================
  doc.addPage();
  y = 18;
  drawHeader('STANDARD ENGAGEMENT TERMS & SIGN-OFF', 3);

  addSectionTitle('5. STANDARD TERMS & CONDITIONS (T&C)');

  const terms = intakeConfig?.termsAndConditions || [
    "1. Payment Milestone Structure: 50% Upfront Deposit required to initiate design mockups & architecture setup. 30% Milestone Payment upon design approval & core build. 20% Final Payment prior to domain mapping & production deployment.",
    "2. Scope Creep & Change Orders: Any feature, page, or integration requested after signing that is not listed in Section 3 will be classified as a 'Change Order' and quoted separately under a Phase 2 add-on contract.",
    "3. Revision Policy: Includes up to 2 rounds of comprehensive design/layout revisions. Revision requests must be provided in writing within 5 business days of draft delivery.",
    "4. Client Dependencies: Timeline countdown begins ONLY after receiving all required client assets (text, logo, media, API credentials). Client delays in asset delivery will extend final delivery date accordingly.",
    "5. Intellectual Property (IP) Ownership: 100% Intellectual Property and code ownership transfer to Client upon receipt of final payment.",
    "6. Infrastructure & Hosting: Hosting (Vercel), Database (Supabase), Domain Registration, and API costs (OpenAI/Resend) are billed directly to client-owned accounts. Developer is not liable for third-party outages.",
    "7. Post-Launch Warranty: Includes 30 days of complimentary technical support & bug fixes post-launch. Continued support is available under a Monthly Care Plan."
  ];

  terms.forEach((term) => {
    doc.setFont('Helvetica', 'Normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const lines: string[] = doc.splitTextToSize(term, contentWidth);
    lines.forEach((line: string) => {
      doc.text(line, leftMargin, y);
      y += 4.2;
    });
    y += 2.5;
  });

  y += 4;
  addSectionTitle('SIGNATURE & ACCEPTANCE BLOCK');
  y += 2;

  // Signature Boxes
  doc.setDrawColor(203, 213, 225);
  doc.rect(leftMargin, y, 80, 24);
  doc.rect(leftMargin + 90, y, 84, 24);

  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CLIENT AUTHORIZED SIGNATURE', leftMargin + 4, y + 5);
  doc.text(`NAME: ${data?.companyName || '______________________'}`, leftMargin + 4, y + 14);
  doc.text('DATE: _______________', leftMargin + 4, y + 20);

  doc.text('DEVELOPER SIGNATURE', leftMargin + 94, y + 5);
  doc.text('NAME: Prateeq Sharma', leftMargin + 94, y + 14);
  doc.text(`DATE: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, leftMargin + 94, y + 20);

  drawFooterMicroLine();

  doc.save(`${(data?.companyName || 'Client').replace(/\s+/g, '_')}_Scoping_Brief_Agreement.pdf`);
}

export function generateMiddlemanAgreementPDF(theme: 'azure' | 'noir' = 'azure', resumeData?: ResumeData | null) {
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
    "Rule 3.2 (Proportional Payout Schedule): 50% of Commission disbursed within 24 hours of receiving Client's 50% Upfront Deposit. 50% disbursed upon receiving Client's Final 50% Balance.",
    "Rule 3.3 (Cancellations & Defaults): In the event of a client default or partial scope cancellation, commission is calculated strictly on net funds actually collected and retained."
  ];

  const confidentialityRules = mm.confidentialityRules || [
    "Rule 4.1 (Non-Circumvention): Partner agrees not to bypass Developer or refer introduced clients to alternative software developers without express written consent.",
    "Rule 4.2 (Codebase & IP Ownership): All codebase assets, databases, and intellectual property remain the property of Developer until 100% of project contract fees are paid by Client.",
    "Rule 4.3 (Confidentiality & Non-Disclosure): Both parties agree to keep project quotes, client contact information, and internal commercial terms strictly confidential."
  ];

  const isAzure = theme === 'azure';

  // Palette settings
  const titleColor: [number, number, number] = isAzure ? [2, 132, 199] : [180, 83, 9]; // Azure Sky / Noir Amber
  const headerBgColor: [number, number, number] = isAzure ? [240, 249, 255] : [254, 243, 199];
  const tableHeaderBgColor: [number, number, number] = isAzure ? [224, 242, 254] : [253, 230, 138];
  const borderColor: [number, number, number] = isAzure ? [186, 230, 253] : [245, 158, 11]; // Light border
  const textColor: [number, number, number] = [30, 41, 59];

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const leftMargin = 18;
  const rightMargin = 18;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  let y = 18;

  const drawHeader = (title: string, pageNum: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
    doc.text(title, leftMargin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${devName} | Sales Partner Agreement (${isAzure ? 'Cyber-Noir Azure' : 'Vintage Paper'}) | Page ${pageNum} of 2`, leftMargin, y);
    y += 4;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(leftMargin, y, pageWidth - rightMargin, y);
    y += 6;
  };

  const addSectionTitle = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
    doc.text(title, leftMargin, y);
    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(leftMargin, y, pageWidth - rightMargin, y);
    y += 5;
  };

  const addParagraph = (text: string, fontSize = 8.5) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      doc.text(line, leftMargin, y);
      y += 4.2;
    });
    y += 2.5;
  };

  // ================= PAGE 1 =================
  drawHeader('FREELANCE SALES & BUSINESS BROKER AGREEMENT', 1);

  // Metadata Box
  doc.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.rect(leftMargin, y, contentWidth, 20, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`EFFECTIVE DATE: ${effectiveDate}`, leftMargin + 4, y + 6);
  doc.text(`DEVELOPER: ${devName} (prateeq.in)`, leftMargin + 85, y + 6);
  doc.text(`PARTNER / SALES REP: ${partnerName}`, leftMargin + 4, y + 13);
  doc.text(`CONTACT EMAIL: ${devEmail}`, leftMargin + 85, y + 13);
  y += 24;

  // Section 1
  addSectionTitle('1. PURPOSE & ROLES OF ENGAGEMENT');
  addParagraph(
    `This Agreement outlines the commercial terms, commission structure, payment schedules, and operational rules between ${devName} ("Developer") and ${partnerName} ("Sales Representative / Partner") for bringing client web development, custom software, and AI integration projects to the Developer.`
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  doc.text('Partner Responsibilities:', leftMargin, y);
  y += 4.5;
  addParagraph('- Lead Generation & Prospecting: Identifying potential businesses needing custom web or AI builds.');
  addParagraph('- Discovery Brief Distribution: Sharing the official prateeq.in Business Scoping Brief (Web Form or PDF Brief) with prospective clients.');
  addParagraph('- Proposal Delivery & Closing: Delivering quotes prepared by Developer and securing signed brief & initial deposit.');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  doc.text('Developer Responsibilities:', leftMargin, y);
  y += 4.5;
  addParagraph('- Fixed-Price Scoping: Reviewing briefs and providing accurate fixed-price proposals within 24 hours.');
  addParagraph('- Full-Stack & AI Engineering: Architecting, developing, testing, and deploying production Next.js, Supabase, and RAG platforms.');
  addParagraph('- Technical Alignment Support: Joining 15-minute technical discovery calls alongside Partner to address complex questions.');

  y += 2;
  // Section 2
  addSectionTitle('2. COMMISSION & COMPENSATION STRUCTURE');
  addParagraph('Commission is calculated as a percentage of net contract value (excluding third-party domain/hosting costs):');

  const tableStartY = y;
  const col1X = leftMargin + 4;
  const col2X = leftMargin + 104;
  const col3X = leftMargin + 130;
  
  doc.setFillColor(tableHeaderBgColor[0], tableHeaderBgColor[1], tableHeaderBgColor[2]);
  doc.rect(leftMargin, y, contentWidth, 7, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('PROJECT TIER & VALUE RANGE', col1X, y + 5);
  doc.text('COMMISSION', col2X, y + 5);
  doc.text('ESTIMATED PAYOUT', col3X, y + 5);
  y += 7;

  const rows = [
    ['Tier 1: Landing Page (INR 25k - 45k / $300 - $550)', tier1Cut, 'INR 2,500 - 4,500 ($30 - $55)'],
    ['Tier 2: Custom Multi-Page Website (INR 45k - 90k / $550 - $1,100)', tier2Cut, 'INR 5,400 - 10,800 ($66 - $132)'],
    ['Tier 3/4: Full-Stack Web App / AI RAG (INR 90k - 2.5L+ / $1.1k - $3k+)', tier3Cut, 'INR 13,500 - 37,500+ ($165 - $450+)'],
  ];

  rows.forEach((row) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    
    const col1Lines = doc.splitTextToSize(row[0], 96);
    doc.text(col1Lines, col1X, y + 4.5);
    
    doc.setFont('helvetica', 'bold');
    doc.text(row[1], col2X, y + 4.5);
    doc.text(row[2], col3X, y + 4.5);
    
    y += Math.max(col1Lines.length * 4.5, 7);
  });

  const tableEndY = y + 2;
  doc.setDrawColor(203, 213, 225);
  doc.rect(leftMargin, tableStartY, contentWidth, tableEndY - tableStartY);
  y = tableEndY + 4;

  addParagraph(`Recurring Monthly Maintenance Cut: For any client subscribing to a Monthly Care Plan (INR 10,000/mo or $150/mo), Partner receives a ${recurringCut} recurring monthly commission (INR 1,000/mo) for as long as the retainer remains active.`);

  // ================= PAGE 2 =================
  doc.addPage();
  y = 18;
  drawHeader('PAYMENT DISBURSEMENT RULES & SIGN-OFF', 2);

  addSectionTitle('3. PAYMENT DISBURSEMENT & TIMELINE RULES');
  disbursementRules.forEach((r: string) => addParagraph(r));

  y += 2;
  addSectionTitle('4. NON-CIRCUMVENTION & CONFIDENTIALITY');
  confidentialityRules.forEach((r: string) => addParagraph(r));

  y += 4;
  addSectionTitle('5. SIGNATURE & AGREEMENT ACCEPTANCE');
  y += 3;

  doc.setDrawColor(203, 213, 225);
  doc.rect(leftMargin, y, 80, 26);
  doc.rect(leftMargin + 90, y, 84, 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DEVELOPER SIGNATURE', leftMargin + 4, y + 5);
  doc.text(`NAME: ${devName}`, leftMargin + 4, y + 13);
  doc.text('TITLE: Principal Engineer & Lead Architect', leftMargin + 4, y + 18);
  doc.text(`DATE: ${effectiveDate}`, leftMargin + 4, y + 23);

  doc.text('PARTNER / SALES REP SIGNATURE', leftMargin + 94, y + 5);
  doc.text(`NAME: ${partnerName}`, leftMargin + 94, y + 13);
  doc.text('TITLE: Sales Representative & Partner', leftMargin + 94, y + 18);
  doc.text('DATE: _______________', leftMargin + 94, y + 23);

  doc.save(`${partnerName.replace(/\s+/g, '_')}_Sales_Partner_Agreement_${isAzure ? 'Azure' : 'Noir'}.pdf`);
}
