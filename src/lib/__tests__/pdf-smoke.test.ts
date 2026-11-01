import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ServicesAndPricingPDF } from '@/components/pdf/ServicesAndPricingPDF';
import { MiddlemanAgreementPDF } from '@/components/pdf/MiddlemanAgreementPDF';
import { ScopingBriefPDF } from '@/components/pdf/ScopingBriefPDF';
import { ProposalExecutiveBriefPDF } from '@/components/pdf/ProposalExecutiveBriefPDF';
import { DeveloperResumePDF } from '@/components/pdf/DeveloperResumePDF';
import { InvoicePDF } from '@/components/pdf/InvoicePDF';
import type { InvoiceEntity } from '@/lib/clientOrder';
import { registerPdfFontsServer } from '@/components/pdf/pdfFontsServer';

function pageCount(pdfBuffer: Buffer): number {
  const raw = pdfBuffer.toString('latin1');
  const match = raw.match(/\/Count (\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

async function renderToPdf(element: React.ReactElement<DocumentProps>): Promise<Buffer> {
  registerPdfFontsServer();
  return renderToBuffer(element);
}

describe('commercial PDF render smoke tests', () => {
  it.each([
    ['azure', false],
    ['noir', true],
  ] as const)('ServicesAndPricingPDF renders a valid 6-page PDF in %s theme', async (_theme, isNoir) => {
    const pdf = await renderToPdf(
      React.createElement(ServicesAndPricingPDF, { isNoir }) as React.ReactElement<DocumentProps>,
    );
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(6);

    const tmp = path.join(os.tmpdir(), `pricing_${isNoir ? 'noir' : 'azure'}_${Date.now()}.pdf`);
    fs.writeFileSync(tmp, pdf);
    process.env.__PRICING_PDF_PATH__ = tmp;
  }, 60000);

  it.each([
    ['azure', false],
    ['noir', true],
  ] as const)('ScopingBriefPDF renders a valid 3-page PDF with config-derived fallback totals in %s theme', async (_theme, isNoir) => {
    const pdf = await renderToPdf(
      React.createElement(ScopingBriefPDF, { isNoir }) as React.ReactElement<DocumentProps>,
    );
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(3);

    const tmp = path.join(os.tmpdir(), `scoping_${isNoir ? 'noir' : 'azure'}_${Date.now()}.pdf`);
    fs.writeFileSync(tmp, pdf);
    process.env.__SCOPING_PDF_PATH__ = tmp;
  }, 60000);

  it.each([
    ['azure', false],
    ['noir', true],
  ] as const)('ProposalExecutiveBriefPDF renders a valid 1-page PDF in %s theme', async (_theme, isNoir) => {
    const pdf = await renderToPdf(
      React.createElement(ProposalExecutiveBriefPDF, { isNoir }) as React.ReactElement<DocumentProps>,
    );
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(1);

    const tmp = path.join(os.tmpdir(), `executive_${isNoir ? 'noir' : 'azure'}_${Date.now()}.pdf`);
    fs.writeFileSync(tmp, pdf);
    process.env.__EXECUTIVE_PDF_PATH__ = tmp;
  }, 60000);

  it.each([
    ['azure', false],
    ['noir', true],
  ] as const)('MiddlemanAgreementPDF renders a valid 3-page PDF in %s theme', async (_theme, isNoir) => {
    const pdf = await renderToPdf(
      React.createElement(MiddlemanAgreementPDF, { isNoir }) as React.ReactElement<DocumentProps>,
    );
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(3);

    const tmp = path.join(os.tmpdir(), `middleman_${isNoir ? 'noir' : 'azure'}_${Date.now()}.pdf`);
    fs.writeFileSync(tmp, pdf);
    process.env.__MIDDLEMAN_PDF_PATH__ = tmp;
  }, 60000);

  it.each([
    ['azure', false],
    ['noir', true],
  ] as const)('DeveloperResumePDF renders a valid PDF in %s theme', async (_theme, isNoir) => {
    const pdf = await renderToPdf(
      React.createElement(DeveloperResumePDF, { activePersona: 'ai', isNoir }) as React.ReactElement<DocumentProps>,
    );
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBeGreaterThanOrEqual(1);

    const tmp = path.join(os.tmpdir(), `resume_${isNoir ? 'noir' : 'azure'}_${Date.now()}.pdf`);
    fs.writeFileSync(tmp, pdf);
    process.env.__RESUME_PDF_PATH__ = tmp;
  }, 60000);

  it.each([
    ['azure', false],
    ['noir', true],
  ] as const)('InvoicePDF renders a valid PDF in %s theme with sanitized INR amounts', async (_theme, isNoir) => {
    const sampleInvoice: InvoiceEntity = {
      id: 'inv-test-123',
      invoice_number: 'INV-2026-TEST',
      customer_name: 'Test Client Corp',
      customer_email: 'client@example.com',
      milestone_name: 'Phase 1 MVP Architecture',
      amount: 118000,
      currency: 'INR',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      is_gst: true,
      place_of_supply: 'Delhi',
      line_items: [
        {
          name: 'Next.js 16 Web Application',
          description: 'Custom SaaS platform build',
          sac_hsn: '998314',
          rate: 100000,
          quantity: 1,
          tax_rate: 18,
          tax_amount: 18000,
          total: 118000,
          subtotal: 100000,
        },
      ],
      tax_breakup: {
        cgst_rate: 9,
        cgst_amount: 9000,
        sgst_rate: 9,
        sgst_amount: 9000,
        total_tax: 18000,
        is_interstate: false,
      },
    };

    const pdf = await renderToPdf(
      React.createElement(InvoicePDF, { invoice: sampleInvoice, isNoir }) as React.ReactElement<DocumentProps>,
    );
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBeGreaterThanOrEqual(1);
  }, 60000);
});
