import { jsPDF } from 'jspdf';
import type { ResumeData } from '../data/resume';
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
  let y = 18;

  const intakeConfig = resumeData?.intake;

  const drawHeader = (title: string, pageNum: number) => {
    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(title, leftMargin, y);
    y += 5;

    doc.setFont('Helvetica', 'Normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Prateeq Sharma | Engineering & Custom Web Builds | Page ${pageNum} of 3`, leftMargin, y);
    y += 4;

    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.setLineWidth(0.3);
    doc.line(leftMargin, y, pageWidth - rightMargin, y);
    y += 6;
  };

  const addSectionTitle = (title: string) => {
    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 58, 138); // Blue 900
    doc.text(title, leftMargin, y);
    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(leftMargin, y, pageWidth - rightMargin, y);
    y += 5;
  };

  const addFieldRow = (label: string, value?: string, defaultLine = '_____________________________________________') => {
    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`${label}:`, leftMargin, y);
    
    doc.setFont('Helvetica', 'Normal');
    doc.setTextColor(15, 23, 42);
    const textVal = value && value.trim() ? value.trim() : defaultLine;
    const lines: string[] = doc.splitTextToSize(textVal, contentWidth - 50);
    doc.text(lines[0] || defaultLine, leftMargin + 50, y);
    y += 5.5;
  };

  // ================= PAGE 1 =================
  drawHeader('CLIENT DISCOVERY & SCOPING BRIEF', 1);

  // Metadata Box
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240);
  doc.rect(leftMargin, y, contentWidth, 22, 'FD');
  
  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`DATE: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, leftMargin + 4, y + 6);
  doc.text(`CLIENT / COMPANY: ${data?.companyName || '___________________________'}`, leftMargin + 60, y + 6);
  doc.text(`EMAIL: ${data?.contactEmail || '___________________________'}`, leftMargin + 4, y + 13);
  doc.text(`PHONE: ${data?.contactPhone || '___________________________'}`, leftMargin + 60, y + 13);
  y += 26;

  // Section 1
  addSectionTitle('SECTION 1: BUSINESS IDENTITY & GOALS');
  addFieldRow('Primary Goal', data?.projectGoal);
  addFieldRow('Target Audience', data?.targetAudience);
  y += 3;

  // Section 2
  addSectionTitle('SECTION 2: TECHNICAL SCOPE & FEATURE CHECKLIST');
  addFieldRow('Target Scope Category', data?.projectCategory);
  y += 2;

  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('Required Functional Modules:', leftMargin, y);
  y += 5;

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

  featureOptions.forEach((feat) => {
    const isSelected = data?.features?.includes(feat) || data?.features?.some(f => feat.toLowerCase().includes(f.toLowerCase()));
    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(9);
    doc.setTextColor(isSelected ? 37 : 100, isSelected ? 99 : 116, isSelected ? 235 : 139);
    doc.text(isSelected ? '[X]' : '[  ]', leftMargin + 4, y);
    
    doc.setFont('Helvetica', isSelected ? 'Bold' : 'Normal');
    doc.setTextColor(15, 23, 42);
    doc.text(feat, leftMargin + 12, y);
    y += 5.5;
  });

  // ================= PAGE 2 =================
  doc.addPage();
  y = 18;
  drawHeader('BRAND ASSETS & INVESTMENT TIER', 2);

  // Section 3
  addSectionTitle('SECTION 3: BRAND ASSET & CONTENT READINESS');
  addFieldRow('Brand Assets Status', data?.assetsStatus);
  addFieldRow('Visual & Competitor Inspo', data?.inspirationLinks);
  y += 3;

  // Section 4
  addSectionTitle('SECTION 4: TIMELINE & INVESTMENT BUDGET');
  addFieldRow('Target Launch Deadline', data?.timeline);
  addFieldRow('Investment Budget Allocation', data?.budgetRange);
  addFieldRow('Additional Notes / Constraints', data?.additionalNotes, 'None specified');
  y += 5;

  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('Budget Tiers Reference:', leftMargin, y);
  y += 5;

  const budgetTiers = intakeConfig?.budgetTiers || [
    "Tier 1: ₹25,000 – ₹45,000 ($300 – $550)",
    "Tier 2: ₹45,000 – ₹90,000 ($550 – $1,100)",
    "Tier 3: ₹90,000 – ₹1.5L+ ($1,100 – $2,000+)",
    "Custom / Enterprise Infrastructure Scope"
  ];

  budgetTiers.forEach((tier) => {
    const isSelected = data?.budgetRange?.includes(tier) || tier === data?.budgetRange;
    doc.setFont('Helvetica', 'Bold');
    doc.text(isSelected ? '[X]' : '[  ]', leftMargin + 4, y);
    doc.setFont('Helvetica', isSelected ? 'Bold' : 'Normal');
    doc.text(tier, leftMargin + 12, y);
    y += 5.5;
  });

  // ================= PAGE 3 =================
  doc.addPage();
  y = 18;
  drawHeader('STANDARD ENGAGEMENT TERMS & SIGN-OFF', 3);

  addSectionTitle('SECTION 5: TERMS & CONDITIONS (T&C)');

  const terms = intakeConfig?.termsAndConditions || [
    "1. Payment Milestone Structure: 50% Upfront Deposit required to initiate design mockups & architecture setup. 30% Milestone Payment upon design approval & core build. 20% Final Payment prior to domain mapping & production deployment.",
    "2. Scope Creep & Change Orders: Any feature, page, or integration requested after signing that is not listed in Section 2 will be classified as a 'Change Order' and quoted separately under a Phase 2 add-on contract.",
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

  doc.save(`${(data?.companyName || 'Client').replace(/\s+/g, '_')}_Scoping_Brief_Agreement.pdf`);
}
