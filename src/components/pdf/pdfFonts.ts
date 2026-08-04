/**
 * Shared PDF brand font registry.
 *
 * Family constants + font file map consumed by both the client-side
 * generator (browser `pdf()`) and the server-side agreement route
 * (`renderToBuffer`). Actual `Font.register` calls live in
 * `pdfFontsClient.ts` / `pdfFontsServer.ts` so each bundler only sees
 * environment-safe code.
 */

export const PDF_FONT = {
  headlineLight: 'PlayfairDisplay',
  headlineLightBold: 'PlayfairDisplay-Bold',
  bodyLight: 'Lora',
  code: 'JetBrainsMono',
  codeBold: 'JetBrainsMono-Bold',
} as const;

export type PDFFontFamily = (typeof PDF_FONT)[keyof typeof PDF_FONT];

export const PDF_FONT_FILES: Record<PDFFontFamily, string> = {
  [PDF_FONT.headlineLight]: 'PlayfairDisplay-Regular.ttf',
  [PDF_FONT.headlineLightBold]: 'PlayfairDisplay-Bold.ttf',
  [PDF_FONT.bodyLight]: 'Lora-Regular.ttf',
  [PDF_FONT.code]: 'JetBrainsMono-Regular.ttf',
  [PDF_FONT.codeBold]: 'JetBrainsMono-Bold.ttf',
};

export const PDF_FONT_WEIGHTS: Record<PDFFontFamily, number> = {
  [PDF_FONT.headlineLight]: 400,
  [PDF_FONT.headlineLightBold]: 700,
  [PDF_FONT.bodyLight]: 400,
  [PDF_FONT.code]: 400,
  [PDF_FONT.codeBold]: 700,
};
