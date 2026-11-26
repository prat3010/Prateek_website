import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface OgCardOptions {
  badge: string;
  title: string;
  subtitle: string;
  pills?: string[];
  pathLabel?: string;
}

const PASTEL_YELLOW = '#F7E7B4';
const OUTER_YELLOW = '#ECDAB0';
const PASTEL_RED = '#D95D67';
const INK = '#2B2B36';
const PAPER = '#FAF9F6';

export async function createBrandOgImage({
  badge,
  title,
  subtitle,
  pills = [],
  pathLabel = 'prateeq.in',
}: OgCardOptions): Promise<ImageResponse> {
  const [playfairBold, jetbrainsBold] = await Promise.all([
    readFile(join(process.cwd(), 'public/fonts/PlayfairDisplay-Bold.ttf')),
    readFile(join(process.cwd(), 'public/fonts/JetBrainsMono-Bold.ttf')),
  ]);

  const trimmedTitle = title.length > 78 ? `${title.slice(0, 75).trimEnd()}...` : title;
  const trimmedSubtitle = subtitle.length > 145 ? `${subtitle.slice(0, 142).trimEnd()}...` : subtitle;
  const titleFontSize = trimmedTitle.length > 48 ? '52px' : trimmedTitle.length > 28 ? '64px' : '76px';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: OUTER_YELLOW,
          padding: '24px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: PASTEL_YELLOW,
            border: `4px solid ${INK}`,
            borderRadius: '20px',
            boxShadow: `10px 10px 0px ${INK}`,
            padding: '40px 48px',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Row: Badge + PRATEEQ Mark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '7px 16px',
                border: `2.5px solid ${INK}`,
                borderRadius: '9999px',
                backgroundColor: PAPER,
                boxShadow: `3px 3px 0px ${INK}`,
                fontFamily: 'JetBrainsMono',
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '0.07em',
                color: INK,
              }}
            >
              {badge}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontFamily: 'PlayfairDisplay',
                fontWeight: 700,
                fontSize: '26px',
                letterSpacing: '0.05em',
                color: PASTEL_RED,
                textShadow: `2px 2px 0px ${INK}`,
              }}
            >
              PRATEEQ
            </div>
          </div>

          {/* Center: Headline + Subtitle + Pills */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              margin: 'auto 0',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontFamily: 'PlayfairDisplay',
                fontWeight: 700,
                fontSize: titleFontSize,
                lineHeight: 1.08,
                color: INK,
                letterSpacing: '-0.01em',
              }}
            >
              {trimmedTitle}
            </div>

            <div
              style={{
                display: 'flex',
                fontFamily: 'JetBrainsMono',
                fontWeight: 700,
                fontSize: '19px',
                lineHeight: 1.45,
                color: '#3D3D4A',
                maxWidth: '960px',
              }}
            >
              {trimmedSubtitle}
            </div>

            {pills.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '6px',
                  flexWrap: 'wrap',
                }}
              >
                {pills.slice(0, 4).map((pill) => (
                  <span
                    key={pill}
                    style={{
                      fontFamily: 'JetBrainsMono',
                      fontWeight: 700,
                      fontSize: '13px',
                      padding: '6px 14px',
                      backgroundColor: PAPER,
                      border: `2px solid ${INK}`,
                      borderRadius: '8px',
                      boxShadow: `3px 3px 0px ${INK}`,
                      color: INK,
                    }}
                  >
                    {pill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: `2.5px solid ${INK}`,
              paddingTop: '16px',
              width: '100%',
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrainsMono',
                fontWeight: 700,
                fontSize: '14px',
                color: INK,
              }}
            >
              Prateeq Sharma • Forward Deployed AI Engineer &amp; Solutions Architect
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'JetBrainsMono',
                fontWeight: 700,
                fontSize: '15px',
                color: INK,
              }}
            >
              <span style={{ color: PASTEL_RED }}>&gt;</span>
              <span>{pathLabel}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'PlayfairDisplay',
          data: playfairBold,
          style: 'normal',
          weight: 700,
        },
        {
          name: 'JetBrainsMono',
          data: jetbrainsBold,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );
}
