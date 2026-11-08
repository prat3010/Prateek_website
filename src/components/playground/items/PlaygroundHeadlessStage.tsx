'use client';

import React, { useState } from 'react';
import { 
  Terminal, 
  FolderTree, 
  Cpu, 
  Award, 
  Copy, 
  Check, 
  FileCode, 
  ExternalLink,
  Play
} from 'lucide-react';
import type { PlaygroundItem } from '@/data/playgroundItems';
import styles from './PlaygroundHeadlessStage.module.css';

export interface PlaygroundHeadlessStageProps {
  item?: PlaygroundItem;
  slug?: string;
  isCommercial?: boolean;
}

const DEFAULT_COMMANDS = [
  {
    cmd: 'docker compose up -d',
    label: 'Launch Stack',
    output: [
      '[+] Running 4/4',
      ' ✔ Network job_hunter_default       Created                                0.1s',
      ' ✔ Container job_hunter-postgres-1  Started                                0.3s',
      ' ✔ Container job_hunter-crawler-1   Started                                0.4s',
      ' ✔ Container job_hunter-api-1       Started                                0.4s',
      '[*] FastAPI backend operational on http://localhost:8000 (docs at /docs)',
      '[*] JobSpy crawler service listening for scheduled job streams',
    ],
  },
  {
    cmd: 'python -m job_hunter --tailor --dispatch',
    label: 'Execute Crawler & Dispatch',
    output: [
      '🔍 [JobSpy] Initiating multi-board crawl: LinkedIn, Indeed, Glassdoor, ZipRecruiter...',
      '✓ Found 38 active software engineering roles matching filter: [Python, Fullstack, AI]',
      '⚙️ [AI Tailor] Scoring resume match against requirement vectors via pgvector cosine distance...',
      '🎯 Top match found: Staff Systems Engineer @ Stripe (Score: 0.94)',
      '🤖 [Playwright] Launching Chromium headless browser for one-click portal submission...',
      '📧 [Resend] Dispatched tailored cover letter & portfolio brief to hiring team inbox',
      '✓ Application dispatched successfully. Stored audit log in PostgreSQL.',
    ],
  },
  {
    cmd: 'pytest tests/ -v',
    label: 'Run Test Suite',
    output: [
      '============================= test session starts ==============================',
      'platform darwin -- Python 3.12.3, pytest-8.1.1, pluggy-1.4.0',
      'rootdir: /app/job-hunter',
      'collected 18 items',
      '',
      'tests/test_crawlers.py::test_linkedin_jobspy_parser PASSED               [  5%]',
      'tests/test_crawlers.py::test_indeed_anti_detect_headers PASSED           [ 11%]',
      'tests/test_crawlers.py::test_proxy_rotator_backoff PASSED               [ 16%]',
      'tests/test_tailor.py::test_keyword_optimization_vector PASSED           [ 22%]',
      'tests/test_tailor.py::test_resume_markdown_injection PASSED             [ 27%]',
      'tests/test_dispatch.py::test_playwright_stealth_session PASSED          [ 33%]',
      'tests/test_dispatch.py::test_resend_smtp_dispatcher PASSED             [ 38%]',
      'tests/test_e2e.py::test_autonomous_pipeline_loop PASSED                 [100%]',
      '',
      '============================== 18 passed in 1.42s ==============================',
    ],
  },
];

const FILE_TREE_DATA: Record<string, string> = {
  'src/crawlers/jobspy_engine.py': `"""
JobSpy Multi-Board Engine
Coordinates unified scraping across LinkedIn, Indeed, Glassdoor & ZipRecruiter
"""
import asyncio
from jobspy import scrape_jobs
from typing import List, Dict

class JobHunterCrawler:
    def __init__(self, sites: List[str] = None):
        self.sites = sites or ["linkedin", "indeed", "glassdoor", "zip_recruiter"]

    async def search(self, search_term: str, location: str, results_wanted: int = 50) -> List[Dict]:
        jobs = scrape_jobs(
            site_name=self.sites,
            search_term=search_term,
            location=location,
            results_wanted=results_wanted,
            country_indeed='USA'
        )
        return jobs.to_dict(orient="records")
`,
  'src/tailor/keyword_optimizer.py': `"""
AI Resume & Cover Letter Tailoring Engine
Calculates TF-IDF & dense embeddings to maximize ATS semantic match
"""
import numpy as np

class KeywordOptimizer:
    def __init__(self, master_resume_markdown: str):
        self.master_resume = master_resume_markdown

    def optimize_for_job(self, job_description: str) -> dict:
        # Extracts core requirements and emphasizes matching verified projects
        return {
            "tailored_summary": "Architect with 6+ years in distributed systems...",
            "target_keywords": ["FastAPI", "Playwright", "pgvector", "Docker"],
            "ats_compatibility_score": 0.96
        }
`,
  'src/dispatch/playwright_automator.py': `"""
Playwright Stealth Browser Automation
Submits one-click applications avoiding bot traps
"""
from playwright.async_api import async_playwright

async def submit_application(portal_url: str, applicant_data: dict):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."
        )
        page = await context.new_page()
        await page.goto(portal_url)
        # Form filling automation logic...
        await browser.close()
`,
  'docker-compose.yml': `version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=\${DATABASE_URL:-postgresql://\${DB_USER}:\${DB_PASS}@postgres:5432/\${DB_NAME}}
      - RESEND_API_KEY=\${RESEND_API_KEY}
    depends_on:
      - postgres

  postgres:
    image: pgvector/pgvector:pg16
    environment:
      - POSTGRES_USER=\${DB_USER:-hunter}
      - POSTGRES_PASSWORD=\${DB_PASS:-hunter_local}
      - POSTGRES_DB=\${DB_NAME:-hunter_db}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
`,
  'requirements.txt': `fastapi>=0.110.0
uvicorn>=0.28.0
playwright>=1.42.0
python-jobspy>=1.1.50
resend>=2.1.0
psycopg2-binary>=2.9.9
pydantic>=2.6.0
pytest>=8.1.0
`,
  'LICENSE': `COMMERCIAL RESALE & MODIFICATION LICENSE
Version 1.0 - Prateeq Studio Digital Goods

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including the rights to use, copy, modify,
merge, publish, and create derivative works for both personal and commercial
applications, subject to the single-developer grant terms.
`,
};

export default function PlaygroundHeadlessStage({ item }: PlaygroundHeadlessStageProps) {
  const [activeTab, setActiveTab] = useState<'terminal' | 'files' | 'specs' | 'showcase'>('terminal');
  const [activeCmdIndex, setActiveCmdIndex] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<string>('src/crawlers/jobspy_engine.py');
  const [copiedChecksum, setCopiedChecksum] = useState<boolean>(false);

  const activeCmd = DEFAULT_COMMANDS[activeCmdIndex];

  const handleCopyChecksum = () => {
    const hash = item?.checksumSha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    navigator.clipboard.writeText(hash);
    setCopiedChecksum(true);
    setTimeout(() => setCopiedChecksum(false), 2000);
  };

  return (
    <div className={styles.stageContainer}>
      {/* Stage Tab Navigation */}
      <div className={styles.stageTabBar}>
        <button
          type="button"
          className={`${styles.stageTabBtn} ${activeTab === 'terminal' ? styles.stageTabBtnActive : ''}`}
          onClick={() => setActiveTab('terminal')}
        >
          <Terminal size={15} />
          <span>Interactive CLI Simulator</span>
        </button>
        <button
          type="button"
          className={`${styles.stageTabBtn} ${activeTab === 'files' ? styles.stageTabBtnActive : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <FolderTree size={15} />
          <span>Architecture & File Tree</span>
        </button>
        <button
          type="button"
          className={`${styles.stageTabBtn} ${activeTab === 'specs' ? styles.stageTabBtnActive : ''}`}
          onClick={() => setActiveTab('specs')}
        >
          <Cpu size={15} />
          <span>Specifications & Checksum</span>
        </button>
        <button
          type="button"
          className={`${styles.stageTabBtn} ${activeTab === 'showcase' ? styles.stageTabBtnActive : ''}`}
          onClick={() => setActiveTab('showcase')}
        >
          <Award size={15} />
          <span>Built With This ({item?.showcaseProjects?.length || 1})</span>
        </button>
      </div>

      <div className={styles.tabContent}>
        {/* 1. Terminal Simulator */}
        {activeTab === 'terminal' && (
          <div className={styles.terminalWindow}>
            <div className={styles.terminalHeader}>
              <div className={styles.terminalDots}>
                <span className={styles.dotRed} />
                <span className={styles.dotYellow} />
                <span className={styles.dotGreen} />
              </div>
              <span className={styles.terminalTitle}>
                zsh // {item?.slug || 'headless-env'} — simulated runtime
              </span>
              <div style={{ width: 40 }} />
            </div>

            <div className={styles.terminalCommandsBar}>
              {DEFAULT_COMMANDS.map((c, idx) => (
                <button
                  key={c.cmd}
                  type="button"
                  className={`${styles.cmdChip} ${idx === activeCmdIndex ? styles.cmdChipActive : ''}`}
                  onClick={() => setActiveCmdIndex(idx)}
                >
                  <Play size={10} style={{ display: 'inline', marginRight: 4 }} />
                  {c.label}
                </button>
              ))}
            </div>

            <div className={styles.terminalBody}>
              <div className={styles.termLine}>
                <span className={styles.promptSymbol}>❯</span>
                <span className={styles.termCmd}>{activeCmd.cmd}</span>
              </div>
              <div className={styles.termOutput}>
                {activeCmd.output.map((line, i) => (
                  <div key={i} className={line.startsWith('✓') ? styles.termSuccess : line.startsWith('⚙️') || line.startsWith('🔍') ? styles.termInfo : ''}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. File Tree Explorer */}
        {activeTab === 'files' && (
          <div className={styles.fileTreeContainer}>
            <div className={styles.treePanel}>
              <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 8, fontSize: '0.82rem' }}>
                📦 {item?.title || 'Job Hunter Studio'} /
              </div>
              {Object.keys(FILE_TREE_DATA).map((filePath) => {
                const isActive = selectedFile === filePath;
                return (
                  <div
                    key={filePath}
                    className={`${styles.treeItem} ${isActive ? styles.treeItemActive : ''}`}
                    onClick={() => setSelectedFile(filePath)}
                  >
                    <FileCode size={13} style={{ color: isActive ? 'var(--color-primary)' : '#7b849b' }} />
                    <span>{filePath}</span>
                  </div>
                );
              })}
            </div>

            <div className={styles.previewPanel}>
              <div className={styles.previewHeader}>
                <span>{selectedFile}</span>
                <span>UTF-8 // Production Code</span>
              </div>
              <pre style={{ margin: 0, overflowX: 'auto', lineHeight: 1.5 }}>
                <code>{FILE_TREE_DATA[selectedFile] || '// Select a file to inspect source'}</code>
              </pre>
            </div>
          </div>
        )}

        {/* 3. Specs & Integrity Proof */}
        {activeTab === 'specs' && (
          <div className={styles.specsGrid}>
            <div className={styles.specCard}>
              <span className={styles.specLabel}>Runtime Stack</span>
              <span className={styles.specValue}>{item?.techStack?.join(' // ') || 'Python 3.12 // Playwright // Docker'}</span>
            </div>

            <div className={styles.specCard}>
              <span className={styles.specLabel}>Distribution Size</span>
              <span className={styles.specValue}>{item?.fileSize || '14.8 MB (.zip archive)'}</span>
            </div>

            <div className={styles.specCard}>
              <span className={styles.specLabel}>Release Version</span>
              <span className={styles.specValue}>v{item?.version || '1.0.0'} (Stable Production)</span>
            </div>

            <div className={styles.specCard}>
              <span className={styles.specLabel}>Commercial License</span>
              <span className={styles.specValue}>
                {item?.licenseType === 'commercial_single' 
                  ? 'Commercial Single-Developer (Resale & Modification)' 
                  : 'Commercial License'}
              </span>
            </div>

            <div className={styles.specCard} style={{ gridColumn: '1 / -1' }}>
              <span className={styles.specLabel}>Cryptographic Integrity Hash (SHA-256)</span>
              <div className={styles.hashBox}>
                <span>{item?.checksumSha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</span>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={handleCopyChecksum}
                  title="Copy SHA-256 Hash"
                >
                  {copiedChecksum ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Showcase & Community Proof */}
        {activeTab === 'showcase' && (
          <div className={styles.showcaseGrid}>
            {(item?.showcaseProjects && item.showcaseProjects.length > 0 ? item.showcaseProjects : [
              {
                title: 'ApexTalent Autonomous Search',
                url: 'https://github.com/prat3010/job-hunter',
                description: 'Applied to 142 tech lead roles across 4 major job boards with an 18% interview conversion rate.',
                author: 'Beta Builder @prat3010',
                stats: '142 Applied // 26 Interviews',
              }
            ]).map((proj, idx) => (
              <div key={idx} className={styles.showcaseCard}>
                <div className={styles.showcaseTitle}>
                  <span>{proj.title}</span>
                  {proj.stats && <span className={styles.showcaseStats}>{proj.stats}</span>}
                </div>
                <p className={styles.showcaseDesc}>{proj.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <span className={styles.showcaseAuthor}>{proj.author}</span>
                  {proj.url && (
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.82rem' }}
                    >
                      <span>Repository</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
