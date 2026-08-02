import React from 'react';
import { pdf, type DocumentProps } from '@react-pdf/renderer';
import type { ResumeData } from '../data/resume';
import type { Persona } from '../lib/skills';
import { ScopingBriefPDF } from '@/components/pdf/ScopingBriefPDF';
import { MiddlemanAgreementPDF } from '@/components/pdf/MiddlemanAgreementPDF';
import { DeveloperResumePDF } from '@/components/pdf/DeveloperResumePDF';
import { ServicesAndPricingPDF } from '@/components/pdf/ServicesAndPricingPDF';

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

export async function generateResumePDF(activePersona: Persona, resumeData: ResumeData) {
  const fileName = `Prateek_Sharma_Resume_${activePersona}.pdf`;
  const element = React.createElement(DeveloperResumePDF, { activePersona, resumeData }) as unknown as React.ReactElement<DocumentProps>;
  await renderAndOpenPDF(element, fileName);
}

export async function generateQuestionnairePDF(resumeData?: ResumeData | null, data?: QuestionnaireData) {
  const fileName = `${(data?.companyName || 'Client').replace(/\s+/g, '_')}_Scoping_Brief_Agreement.pdf`;
  const element = React.createElement(ScopingBriefPDF, { resumeData, data }) as unknown as React.ReactElement<DocumentProps>;
  await renderAndOpenPDF(element, fileName);
}

export async function generateMiddlemanAgreementPDF(resumeData?: ResumeData | null) {
  const mm = resumeData?.intake?.middlemanAgreement;
  const partnerName = mm?.partnerName || 'Partner';
  const fileName = `${partnerName.replace(/\s+/g, '_')}_Sales_Partner_Agreement.pdf`;
  const element = React.createElement(MiddlemanAgreementPDF, { resumeData }) as unknown as React.ReactElement<DocumentProps>;
  await renderAndOpenPDF(element, fileName);
}

export async function generateQuotationPDF(resumeData: ResumeData) {
  const fileName = `${resumeData.name.replace(/\s+/g, '_')}_Service_Quotation.pdf`;
  const element = React.createElement(ScopingBriefPDF, { resumeData }) as unknown as React.ReactElement<DocumentProps>;
  await renderAndOpenPDF(element, fileName);
}

export async function generateServicesAndPricingPDF(resumeData: ResumeData) {
  const fileName = `Prateeq_Sharma_Services_And_Pricing_Guide.pdf`;
  const element = React.createElement(ServicesAndPricingPDF, { resumeData }) as unknown as React.ReactElement<DocumentProps>;
  await renderAndOpenPDF(element, fileName);
}
