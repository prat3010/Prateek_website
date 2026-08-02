import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

function generateMiddlemanAgreementPDF() {
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

  const drawHeader = (title, pageNum) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(title, leftMargin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Prateeq Sharma | Business Broker & Sales Partner Agreement | Page ${pageNum} of 2`, leftMargin, y);
    y += 4;

    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.setLineWidth(0.3);
    doc.line(leftMargin, y, pageWidth - rightMargin, y);
    y += 6;
  };

  const addSectionTitle = (title) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 58, 138); // Blue 900
    doc.text(title, leftMargin, y);
    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(leftMargin, y, pageWidth - rightMargin, y);
    y += 5;
  };

  const addParagraph = (text, fontSize = 8.5) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line) => {
      doc.text(line, leftMargin, y);
      y += 4.2;
    });
    y += 2.5;
  };

  // ================= PAGE 1 =================
  drawHeader('FREELANCE SALES & BUSINESS BROKER AGREEMENT', 1);

  // Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(leftMargin, y, contentWidth, 20, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`EFFECTIVE DATE: August 2, 2026`, leftMargin + 4, y + 6);
  doc.text(`DEVELOPER: Prateeq Sharma (prateeq.in)`, leftMargin + 85, y + 6);
  doc.text(`PARTNER / SALES REP: [Partner Name]`, leftMargin + 4, y + 13);
  doc.text(`CONTACT EMAIL: 3010prateeksharma@gmail.com`, leftMargin + 85, y + 13);
  y += 24;

  // Section 1
  addSectionTitle('1. PURPOSE & ROLES OF ENGAGEMENT');
  addParagraph(
    'This Agreement outlines the commercial terms, commission structure, payment schedules, and operational rules between Prateeq Sharma ("Developer") and [Partner Name] ("Sales Representative / Partner") for bringing client web development, custom software, and AI integration projects to the Developer.'
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Partner Responsibilities:', leftMargin, y);
  y += 4.5;
  addParagraph('- Lead Generation & Prospecting: Identifying potential businesses needing custom web or AI builds.');
  addParagraph('- Discovery Brief Distribution: Sharing the official prateeq.in Business Scoping Brief (Web Form or PDF Brief) with prospective clients.');
  addParagraph('- Proposal Delivery & Closing: Delivering quotes prepared by Developer and securing signed brief & initial deposit.');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Developer Responsibilities:', leftMargin, y);
  y += 4.5;
  addParagraph('- Fixed-Price Scoping: Reviewing briefs and providing accurate fixed-price proposals within 24 hours.');
  addParagraph('- Full-Stack & AI Engineering: Architecting, developing, testing, and deploying production Next.js, Supabase, and RAG platforms.');
  addParagraph('- Technical Alignment Support: Joining 15-minute technical discovery calls alongside Partner to address complex questions.');

  y += 2;
  // Section 2
  addSectionTitle('2. COMMISSION & COMPENSATION STRUCTURE');
  addParagraph('Commission is calculated as a percentage of net contract value (excluding third-party domain/hosting costs):');

  // Commission Table Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.rect(leftMargin, y, contentWidth, 32);

  doc.setFillColor(241, 245, 249);
  doc.rect(leftMargin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('PROJECT TIER & VALUE RANGE', leftMargin + 4, y + 5);
  doc.text('COMMISSION (%)', leftMargin + 85, y + 5);
  doc.text('ESTIMATED PAYOUT', leftMargin + 130, y + 5);
  y += 7;

  const rows = [
    ['Tier 1: High-Converting Landing Page (₹25k - ₹45k / $300 - $550)', '10%', '₹2,500 – ₹4,500 ($30 - $55)'],
    ['Tier 2: Custom Multi-Page Website (₹45k - ₹90k / $550 - $1,100)', '12%', '₹5,400 – ₹10,800 ($66 - $132)'],
    ['Tier 3/4: Full-Stack Web App / AI RAG (₹90k - ₹2.5L+ / $1,100 - $3k+)', '15%', '₹13,500 – ₹37,500+ ($165 - $450+)'],
  ];

  rows.forEach((row) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(row[0], leftMargin + 4, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(row[1], leftMargin + 85, y + 5);
    doc.text(row[2], leftMargin + 130, y + 5);
    y += 8;
  });

  y += 4;
  addParagraph('Recurring Monthly Maintenance Cut: For any client subscribing to a Monthly Care Plan (₹10,000/mo or $150/mo), Partner receives a 10% recurring monthly commission (₹1,000/mo) for as long as the retainer remains active.');

  // ================= PAGE 2 =================
  doc.addPage();
  y = 18;
  drawHeader('PAYMENT DISBURSEMENT RULES & SIGN-OFF', 2);

  // Section 3
  addSectionTitle('3. PAYMENT DISBURSEMENT & TIMELINE RULES');
  addParagraph('Rule 3.1 (No Out-of-Pocket Liability): Developer will never pay commissions out-of-pocket prior to client funds clearing bank accounts.');
  addParagraph('Rule 3.2 (Proportional Payout Schedule):');
  addParagraph('   - 50% of Commission: Disbursed within 24 hours of Developer receiving the Client\'s 50% Upfront Deposit.');
  addParagraph('   - 50% of Commission: Disbursed within 24 hours of Developer receiving the Client\'s Final 50% Balance prior to launch.');
  addParagraph('Rule 3.3 (Cancellations & Defaults): In the event of a client default or partial scope cancellation, commission is calculated strictly on net funds actually collected and retained by Developer.');

  y += 2;
  // Section 4
  addSectionTitle('4. NON-CIRCUMVENTION & CONFIDENTIALITY');
  addParagraph('Rule 4.1 (Non-Circumvention): Partner agrees not to bypass Developer or refer introduced clients to alternative software developers without Developer\'s express written consent.');
  addParagraph('Rule 4.2 (Codebase & IP Ownership): All codebase assets, databases, and intellectual property remain the property of Developer until 100% of project contract fees are paid by Client.');
  addParagraph('Rule 4.3 (Confidentiality): Both parties agree to keep project quotes, client contact information, and internal commercial terms strictly confidential.');

  y += 4;
  addSectionTitle('5. SIGNATURE & AGREEMENT ACCEPTANCE');
  y += 3;

  // Signature Boxes
  doc.setDrawColor(203, 213, 225);
  doc.rect(leftMargin, y, 80, 26);
  doc.rect(leftMargin + 90, y, 84, 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DEVELOPER SIGNATURE', leftMargin + 4, y + 5);
  doc.text('NAME: Prateeq Sharma', leftMargin + 4, y + 13);
  doc.text('TITLE: Principal Engineer & Lead Architect', leftMargin + 4, y + 18);
  doc.text('DATE: August 2, 2026', leftMargin + 4, y + 23);

  doc.text('PARTNER / SALES REP SIGNATURE', leftMargin + 94, y + 5);
  doc.text('NAME: __________________________', leftMargin + 94, y + 13);
  doc.text('TITLE: Sales Representative & Partner', leftMargin + 94, y + 18);
  doc.text('DATE: _______________', leftMargin + 94, y + 23);

  const outputPath = path.join(process.cwd(), 'public', 'Middleman_Partnership_Agreement.pdf');
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`Successfully generated PDF at: ${outputPath}`);
}

generateMiddlemanAgreementPDF();
