import React from 'react';
import { pdf, type DocumentProps } from '@react-pdf/renderer';
import type { ResumeData } from '../data/resume';
import type { Persona } from '../lib/skills';
import { ScopingBriefPDF } from '@/components/pdf/ScopingBriefPDF';
import { MiddlemanAgreementPDF } from '@/components/pdf/MiddlemanAgreementPDF';
import { DeveloperResumePDF } from '@/components/pdf/DeveloperResumePDF';
import { ServicesAndPricingPDF } from '@/components/pdf/ServicesAndPricingPDF';
import { registerPdfFontsClient } from '@/components/pdf/pdfFontsClient';

let fontsRegistered = false;

function ensurePdfFonts() {
  if (!fontsRegistered) {
    registerPdfFontsClient();
    fontsRegistered = true;
  }
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
  maintenancePlan?: string;
  maintenanceCostINR?: number;
  maintenanceCostUSD?: number;
  totalBuildCostINR?: number;
  totalBuildCostUSD?: number;
  additionalNotes?: string;
}

async function renderAndOpenPDF(element: React.ReactElement<DocumentProps>, fileName: string) {
  // Synchronously open a new blank tab during the user gesture to avoid popup blockers
  const newWindow = typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null;

  try {
    const blob = await pdf(element).toBlob();
    const blobUrl = URL.createObjectURL(blob);

    if (newWindow && !newWindow.closed) {
      newWindow.location.href = blobUrl;
    } else {
      // Fallback if popup blocker prevented synchronous opening
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    if (newWindow && !newWindow.closed) {
      newWindow.close();
    }
    console.error('Failed to open React-PDF preview:', err);
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the `data:<mime>;base64,` prefix, keep only the base64 payload
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(new Error('Failed to read PDF blob.'));
    reader.readAsDataURL(blob);
  });
}

export async function generateQuestionnairePDFBase64(
  resumeData?: ResumeData | null,
  data?: QuestionnaireData,
  isNoir = false
): Promise<{ fileName: string; base64: string }> {
  ensurePdfFonts();
  const fileName = `${(data?.companyName || 'Client').replace(/\s+/g, '_')}_Scoping_Brief_Agreement.pdf`;
  const element = React.createElement(ScopingBriefPDF, { resumeData, data, isNoir }) as unknown as React.ReactElement<DocumentProps>;
  const blob = await pdf(element).toBlob();
  const base64 = await blobToBase64(blob);
  return { fileName, base64 };
}

export async function generateResumePDF(activePersona: Persona, resumeData: ResumeData) {
  const fileName = `Prateek_Sharma_Resume_${activePersona}.pdf`;
  const element = React.createElement(DeveloperResumePDF, { activePersona, resumeData }) as unknown as React.ReactElement<DocumentProps>;
  await renderAndOpenPDF(element, fileName);
}

export async function generateQuestionnairePDF(resumeData?: ResumeData | null, data?: QuestionnaireData, isNoir = false) {
  ensurePdfFonts();
  const fileName = `${(data?.companyName || 'Client').replace(/\s+/g, '_')}_Scoping_Brief_Agreement.pdf`;
  const element = React.createElement(ScopingBriefPDF, { resumeData, data, isNoir }) as unknown as React.ReactElement<DocumentProps>;
  await renderAndOpenPDF(element, fileName);
}

export async function generateMiddlemanAgreementPDF(resumeData?: ResumeData | null, isNoir = false) {
  ensurePdfFonts();
  const mm = resumeData?.intake?.middlemanAgreement;
  const partnerName = mm?.partnerName || 'Partner';
  const fileName = `${partnerName.replace(/\s+/g, '_')}_Sales_Partner_Agreement.pdf`;
  const element = React.createElement(MiddlemanAgreementPDF, { resumeData, isNoir }) as unknown as React.ReactElement<DocumentProps>;
  await renderAndOpenPDF(element, fileName);
}

export async function generateQuotationPDF(resumeData: ResumeData, isNoir = false) {
  ensurePdfFonts();
  const fileName = `${resumeData.name.replace(/\s+/g, '_')}_Service_Quotation.pdf`;
  const element = React.createElement(ScopingBriefPDF, { resumeData, isNoir }) as unknown as React.ReactElement<DocumentProps>;
  await renderAndOpenPDF(element, fileName);
}

export async function generateServicesAndPricingPDF(resumeData: ResumeData, isNoir = false) {
  ensurePdfFonts();
  const fileName = `Prateeq_Sharma_Services_And_Pricing_Guide.pdf`;
  const element = React.createElement(ServicesAndPricingPDF, { resumeData, isNoir }) as unknown as React.ReactElement<DocumentProps>;
  await renderAndOpenPDF(element, fileName);
}
