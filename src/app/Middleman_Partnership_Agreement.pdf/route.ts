import { NextResponse } from 'next/server';
import ReactPDF, { type DocumentProps } from '@react-pdf/renderer';
import React from 'react';
import { MiddlemanAgreementPDF } from '@/components/pdf/MiddlemanAgreementPDF';
import { getProfile } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const profileData = await getProfile();
    const element = React.createElement(MiddlemanAgreementPDF, { resumeData: profileData }) as unknown as React.ReactElement<DocumentProps>;
    const buffer = await ReactPDF.renderToBuffer(element);

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
