import { NextResponse } from 'next/server';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { cookies } from 'next/headers';
import React from 'react';
import { MiddlemanAgreementPDF } from '@/components/pdf/MiddlemanAgreementPDF';
import { registerPdfFontsServer } from '@/components/pdf/pdfFontsServer';
import { getProfile } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    registerPdfFontsServer();
    const profileData = await getProfile();
    // The proxy stamps the visitor's theme cookie as x-theme; fall back to the cookie itself.
    const theme = request.headers.get('x-theme') || (await cookies()).get('theme')?.value || 'light';
    const isNoir = theme === 'noir';
    const element = React.createElement(MiddlemanAgreementPDF, { resumeData: profileData, isNoir }) as unknown as React.ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(element);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="Sales_Partner_Agreement.pdf"',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error dynamically rendering Middleman Agreement PDF:', error);
    return NextResponse.json({ error: 'Failed to render agreement PDF' }, { status: 500 });
  }
}
