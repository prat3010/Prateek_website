import { Font } from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';
import { PDF_FONT_FILES, PDF_FONT_WEIGHTS, type PDFFontFamily } from './pdfFonts';

/**
 * Node-safe font registration for `renderToBuffer` (server-rendered PDFs).
 * Fonts are embedded as base64 data URLs read from `public/fonts/` — the
 * only `src` form react-pdf's Node font loader (fontkit) accepts.
 */
let registered = false;

export function registerPdfFontsServer(): void {
  if (registered) return;
  (Object.entries(PDF_FONT_FILES) as [PDFFontFamily, string][]).forEach(([family, file]) => {
    const ttf = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', file));
    Font.register({
      family,
      fonts: [
        {
          src: `data:font/ttf;base64,${ttf.toString('base64')}`,
          fontWeight: PDF_FONT_WEIGHTS[family],
        },
      ],
    });
  });
  registered = true;
}
