import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const alt = 'PRATEEQ — Crafting Digital Worlds, One Panel at a Time';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const [playfairBold, jetbrainsBold] = await Promise.all([
    readFile(join(process.cwd(), 'public/fonts/PlayfairDisplay-Bold.ttf')),
    readFile(join(process.cwd(), 'public/fonts/JetBrainsMono-Bold.ttf')),
  ]);

  const pastelYellow = '#F7E7B4';
  const outerYellow = '#ECDAB0';
  const pastelRed = '#D95D67';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: outerYellow,
          padding: '24px',
          boxSizing: 'border-box',
        }}
      >
        {/* Main Comic Panel */}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: pastelYellow,
            border: '4px solid #2B2B36',
            borderRadius: '20px',
            boxShadow: '10px 10px 0px #2B2B36',
            padding: '36px 48px',
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          {/* Top Row: Issue Tag */}
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
                gap: '8px',
                padding: '6px 14px',
                border: '2.5px solid #2B2B36',
                borderRadius: '9999px',
                backgroundColor: '#FAF9F6',
                boxShadow: '3px 3px 0px #2B2B36',
              }}
            >
              <span
                style={{
                  fontFamily: 'JetBrainsMono',
                  fontWeight: 700,
                  fontSize: '13px',
                  letterSpacing: '0.08em',
                  color: '#2B2B36',
                }}
              >
                PORTFOLIO & COGNITIVE LAB
              </span>
            </div>
          </div>

          {/* Center: Gremlin + Bold Shadowed PRATEEQ */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '48px',
              margin: 'auto 0',
            }}
          >
            {/* Gremlin Mascot */}
            <svg
              viewBox="0 0 100 100"
              width={210}
              height={210}
              style={{ display: 'flex' }}
            >
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="#FAF9F6"
                stroke="#2B2B36"
                strokeWidth={3.5}
              />
              <path
                d="M 26,45 L 32,50 L 26,55"
                fill="none"
                stroke="#2B2B36"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="35"
                y1="55"
                x2="43"
                y2="55"
                stroke="#2B2B36"
                strokeWidth={3.5}
                strokeLinecap="round"
              />
              <line
                x1="15"
                y1="72"
                x2="85"
                y2="72"
                stroke="#2B2B36"
                strokeWidth={3.5}
                strokeLinecap="round"
              />
              <path
                d="M 32,48 L 12,38 Q 24,53 36,55"
                fill={pastelRed}
                stroke="#2B2B36"
                strokeWidth={3}
                strokeLinejoin="round"
              />
              <path
                d="M 68,48 L 88,38 Q 76,53 64,55"
                fill={pastelRed}
                stroke="#2B2B36"
                strokeWidth={3}
                strokeLinejoin="round"
              />
              <path
                d="M 32,72 C 32,46 68,46 68,72"
                fill="#FAF9F6"
                stroke="#2B2B36"
                strokeWidth={3.5}
                strokeLinejoin="round"
              />
              <circle cx="43" cy="58" r="6.5" fill="#2B2B36" />
              <circle cx="45" cy="55.5" r="2.5" fill="#FAF9F6" />
              <circle cx="57" cy="58" r="6.5" fill="#2B2B36" />
              <circle cx="59" cy="55.5" r="2.5" fill="#FAF9F6" />
              <ellipse cx="37" cy="64" rx="3.5" ry="2" fill="#DF8B98" opacity="0.8" />
              <ellipse cx="63" cy="64" rx="3.5" ry="2" fill="#DF8B98" opacity="0.8" />
            </svg>

            {/* Brand Title Column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontFamily: 'PlayfairDisplay',
                  fontWeight: 700,
                  fontSize: '154px',
                  letterSpacing: '0.04em',
                  color: pastelRed,
                  lineHeight: 1,
                  textShadow: '5px 5px 0px #2B2B36',
                }}
              >
                PRATEEQ
              </span>

              {/* Subtitle Badges */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '4px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'JetBrainsMono',
                    fontWeight: 700,
                    fontSize: '14px',
                    padding: '4px 12px',
                    backgroundColor: '#FAF9F6',
                    border: '2px solid #2B2B36',
                    borderRadius: '6px',
                    boxShadow: '2.5px 2.5px 0px #2B2B36',
                    color: '#2B2B36',
                  }}
                >
                  AI ENGINEER
                </span>
                <span
                  style={{
                    fontFamily: 'JetBrainsMono',
                    fontWeight: 700,
                    fontSize: '14px',
                    padding: '4px 12px',
                    backgroundColor: '#FAF9F6',
                    border: '2px solid #2B2B36',
                    borderRadius: '6px',
                    boxShadow: '2.5px 2.5px 0px #2B2B36',
                    color: '#2B2B36',
                  }}
                >
                  SOLUTIONS ARCHITECT
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '2.5px solid #2B2B36',
              paddingTop: '16px',
              width: '100%',
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrainsMono',
                fontSize: '14px',
                color: '#2B2B36',
                letterSpacing: '0.02em',
              }}
            >
              Crafting Digital Worlds, One Panel at a Time
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'JetBrainsMono',
                fontWeight: 700,
                fontSize: '15px',
                color: '#2B2B36',
              }}
            >
              <span style={{ color: pastelRed }}>&gt;</span>
              <span>prateeq.in</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
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
