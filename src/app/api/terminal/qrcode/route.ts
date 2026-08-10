import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';

/**
 * Decodes raw string payload from a PNG image Buffer using jsQR and pngjs.
 */
function decodeQrCodeFromPngBuffer(buffer: Buffer): string | null {
  try {
    const png = PNG.sync.read(buffer);
    const clampedArray = new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.byteLength);
    const code = jsQR(clampedArray, png.width, png.height);
    return code && code.data ? code.data : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawAmount = body.amount;
    const amount = Number(rawAmount);

    if (!rawAmount || isNaN(amount) || amount <= 0 || !isFinite(amount)) {
      return NextResponse.json(
        { error: 'Please enter a valid positive amount (e.g. qrcode 500).' },
        { status: 400 }
      );
    }

    if (amount > 500000) {
      return NextResponse.json(
        { error: 'Amount exceeds maximum single transaction limit of ₹500,000.' },
        { status: 400 }
      );
    }

    const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

    if (!KEY_ID || !KEY_SECRET) {
      return NextResponse.json(
        { error: 'Razorpay API credentials (NEXT_PUBLIC_RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured.' },
        { status: 503 }
      );
    }

    const amountInPaise = Math.round(amount * 100);
    const authHeader = `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`;

    // 1. Call Razorpay Create QR Code API
    const rzpRes = await fetch('https://api.razorpay.com/v1/payments/qr_codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        type: 'upi_qr',
        name: 'Terminal Custom Payment',
        usage: 'single_use',
        fixed_amount: true,
        payment_amount: amountInPaise,
        description: `Dynamic QR code generated from terminal for ₹${amount.toLocaleString('en-IN')}`,
        notes: {
          source: 'cobalt_terminal',
          amount_inr: amount,
        },
      }),
    });

    const qrData = await rzpRes.json();

    if (!rzpRes.ok) {
      const errorMsg = qrData.error?.description || 'Failed to generate Razorpay QR Code.';
      return NextResponse.json({ error: errorMsg }, { status: rzpRes.status });
    }

    let decodedPayload: string | null = null;
    let finalImageUrl: string | null = null;

    // 2. If Razorpay returned image_content as base64 PNG, attempt jsQR decoding
    if (typeof qrData.image_content === 'string' && qrData.image_content.startsWith('data:image')) {
      try {
        const base64Data = qrData.image_content.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        decodedPayload = decodeQrCodeFromPngBuffer(imageBuffer);
      } catch {
        // Fallback to image_content directly
        finalImageUrl = qrData.image_content;
      }
    }

    // 3. If not decoded from image_content, fetch image_url or landing page to extract & decode QR image
    const qrTarget = qrData.image_url || qrData.short_url || (qrData.id ? `https://rzp.io/i/${qrData.id}` : null);

    if (!decodedPayload && !finalImageUrl && qrTarget) {
      try {
        const fetchRes = await fetch(qrTarget, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/png,image/*;q=0.9,text/html;q=0.8',
          },
        });

        if (fetchRes.ok) {
          const contentType = fetchRes.headers.get('content-type') || '';

          if (contentType.includes('image/')) {
            // Direct image binary
            const arrayBuf = await fetchRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuf);
            decodedPayload = decodeQrCodeFromPngBuffer(buffer);
            if (!decodedPayload) {
              finalImageUrl = `data:${contentType};base64,${buffer.toString('base64')}`;
            }
          } else {
            // HTML landing page: search for embedded base64 PNG or upi:// payload
            const htmlText = await fetchRes.text();

            // Extract base64 PNG embedded inside image tags
            const base64Match = htmlText.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/i);
            if (base64Match) {
              const imgBuffer = Buffer.from(base64Match[1], 'base64');
              decodedPayload = decodeQrCodeFromPngBuffer(imgBuffer);
              if (!decodedPayload) {
                finalImageUrl = base64Match[0];
              }
            }

            // Extract upi:// URI scheme if present in HTML
            if (!decodedPayload && !finalImageUrl) {
              const upiMatch = htmlText.match(/upi:\/\/pay\?[^"'\s<>\\]+/i);
              if (upiMatch) {
                decodedPayload = decodeURIComponent(upiMatch[0]).replace(/&amp;/g, '&');
              }
            }
          }
        }
      } catch {
        // Ignore fetch errors; proceed to fallback
      }
    }

    // 4. Re-encode the extracted payload or fallback to target URL
    const payloadToEncode = decodedPayload || qrTarget;

    if (!finalImageUrl && payloadToEncode) {
      finalImageUrl = await QRCode.toDataURL(payloadToEncode, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    }

    if (!finalImageUrl) {
      return NextResponse.json(
        { error: 'Razorpay API response did not include a valid QR payload or image.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      qrId: qrData.id,
      imageUrl: finalImageUrl,
      amount,
      fixedAmount: qrData.fixed_amount ?? true,
      isDecoded: Boolean(decodedPayload),
      decodedPayload: decodedPayload || null,
      closeBy: qrData.close_by || null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
