import { Font } from '@react-pdf/renderer';
import { PDF_FONT_FILES, PDF_FONT_WEIGHTS, type PDFFontFamily } from './pdfFonts';

/**
 * Browser-safe font registration: react-pdf fetches the TTFs from the
 * absolute `/fonts/...` URL while rendering client-side in the browser.
 * (react-pdf's `is-url` check requires an absolute URL, not a relative path.)
 */
export function registerPdfFontsClient(): void {
  (Object.entries(PDF_FONT_FILES) as [PDFFontFamily, string][]).forEach(([family, file]) => {
    Font.register({
      family,
      fonts: [
        {
          src: new URL(`/fonts/${file}`, document.baseURI).href,
          fontWeight: PDF_FONT_WEIGHTS[family],
        },
      ],
    });
  });
}
