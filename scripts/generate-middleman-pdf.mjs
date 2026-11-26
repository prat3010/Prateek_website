#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { config: '', out: '', theme: 'azure' };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key === '--config' && val) {
      args.config = val;
      i += 1;
    } else if (key === '--out' && val) {
      args.out = val;
      i += 1;
    } else if (key === '--theme' && val) {
      args.theme = val;
      i += 1;
    }
  }
  return args;
}

async function main() {
  const { config, out, theme } = parseArgs(process.argv.slice(2));
  if (!out) {
    console.error('Usage: node scripts/generate-middleman-pdf.mjs --config <json> --out <pdf> [--theme azure|noir]');
    process.exit(1);
  }

  let resumeData = null;
  if (config) {
    resumeData = JSON.parse(fs.readFileSync(path.resolve(config), 'utf8'));
  }

  const require = createRequire(import.meta.url);
  const Module = require('node:module');
  const ts = require('typescript');

  const origResolveFilename = Module._resolveFilename;
  Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
    if (typeof request === 'string' && request.startsWith('@/')) {
      const mapped = path.join(repoRoot, 'src', request.slice(2));
      return origResolveFilename.call(this, mapped, parent, isMain, options);
    }
    return origResolveFilename.call(this, request, parent, isMain, options);
  };

  for (const ext of ['.ts', '.tsx']) {
    Module._extensions[ext] = function compileTs(module, filename) {
      const source = fs.readFileSync(filename, 'utf8');
      const { outputText } = ts.transpileModule(source, {
        fileName: filename,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.React,
          esModuleInterop: true,
          resolveJsonModule: true,
          target: ts.ScriptTarget.ES2022,
        },
      });
      return module._compile(outputText, filename);
    };
  }

  const prevCwd = process.cwd();
  process.chdir(repoRoot);
  try {
    const React = require('react');
    const { renderToBuffer } = require('@react-pdf/renderer');
    const { registerPdfFontsServer } = require('@/components/pdf/pdfFontsServer');
    const { MiddlemanAgreementPDF } = require('@/components/pdf/MiddlemanAgreementPDF');

    registerPdfFontsServer();
    const isNoir = String(theme).toLowerCase() === 'noir';
    const element = React.createElement(MiddlemanAgreementPDF, { resumeData, isNoir });
    const buffer = await renderToBuffer(element);
    fs.writeFileSync(path.resolve(out), buffer);
  } finally {
    process.chdir(prevCwd);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
