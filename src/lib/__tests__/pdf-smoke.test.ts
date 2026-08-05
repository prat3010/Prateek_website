import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ServicesAndPricingPDF } from '@/components/pdf/ServicesAndPricingPDF';
import { MiddlemanAgreementPDF } from '@/components/pdf/MiddlemanAgreementPDF';
import { ScopingBriefPDF } from '@/components/pdf/ScopingBriefPDF';
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
  ] as const)('ServicesAndPricingPDF renders a valid 4-page PDF in %s theme', async (_theme, isNoir) => {
    const pdf = await renderToPdf(
      React.createElement(ServicesAndPricingPDF, { isNoir }) as React.ReactElement<DocumentProps>,
    );
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(4);

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
});
