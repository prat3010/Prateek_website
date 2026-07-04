import { jsPDF } from 'jspdf';
import type { ResumeData } from '../data/resume';

type Persona = 'general' | 'fullstack' | 'ai' | 'creative';

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
  doc.text(resumeData.name, leftMargin, y);
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

function getSkillsHighlight(activePersona: Persona): string[] {
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
}

export function generateQuotationPDF(resumeData: ResumeData) {
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

  // Rate Card
  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('RATE STRUCTURE & PRICING', leftMargin, y);
  y += 2;
  drawDivider();

  const hourly = resumeData.quotation?.hourlyRate || "$50";
  const day = resumeData.quotation?.dayRate || "$350";
  const terms = resumeData.quotation?.paymentTerms || "50% upfront, 30% after design/milestone 1, 20% on final delivery.";

  doc.setFont('Helvetica', 'Bold');
  doc.setFontSize(10.5);
  doc.setTextColor(40, 40, 40);
  doc.text(`Estimated Hourly Rate: ${hourly} / hour`, leftMargin, y);
  y += 5.5;
  doc.text(`Standard Day Rate (8 hours): ${day} / day`, leftMargin, y);
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

  const deliverables = resumeData.quotation?.deliverables || [
    "Custom UI Design & Prototype",
    "Production-ready Next.js / React application",
    "Supabase backend integration & security setup",
    "SEO audit & optimization",
    "3 months of support & maintenance"
  ];

  deliverables.forEach((item) => {
    if (y + 10 > 280) {
      doc.addPage();
      y = 20;
    }
    // Render checkmark icon
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
