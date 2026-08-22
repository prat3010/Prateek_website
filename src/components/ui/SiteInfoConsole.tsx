'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  Cpu,
  ArrowLeft,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { toggleAudio, playKeySound, playAchievementSound } from '@/lib/terminalAudio';
import TerminalSnakeGame from './TerminalSnakeGame';
import styles from './SiteInfoConsole.module.css';
import type { ResumeData, MiddlemanAgreementConfig } from '@/data/resume';
import { COMMISSION_BANDS, COMMISSION_DISBURSEMENT_WINDOW, RECURRING_COMMISSION_RATE, type CommissionBand } from '@/lib/commission';
import resumeFallback from '@/data/resume.json';

function consoleBandRange(band: CommissionBand): string {
  if (band.minINR == null) return `up to ₹${band.maxINR?.toLocaleString('en-IN')} / $${band.maxUSD?.toLocaleString('en-US')}`;
  if (band.maxINR == null) return `₹${band.minINR.toLocaleString('en-IN')}+ / $${band.minUSD?.toLocaleString('en-US')}+`;
  return `₹${band.minINR.toLocaleString('en-IN')}-${band.maxINR.toLocaleString('en-IN')} / $${band.minUSD?.toLocaleString('en-US')}-${band.maxUSD?.toLocaleString('en-US')}`;
}

function consoleCutFor(band: CommissionBand): string {
  return `${band.rate}%`;
}

// Command responses for Noir Interactive Console
interface ConsoleLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'link' | 'image';
  command?: string;
  imageUrl?: string;
  href?: string;
}

const BOOT_LOGS = [
  'SYSTEM // Initializing cyber diagnostics console...',
  'SYSTEM // Loading dynamic route bundles...',
  'SYSTEM // Listening for performance and frame rate metrics...',
  'SYSTEM // Diagnostics core online. Welcome.'
];

interface ProjectSummary {
  title: string;
  tags: string[];
}

export default function SiteInfoConsole() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [profileData, setProfileData] = useState<ResumeData>(resumeFallback as unknown as ResumeData);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(data || []))
      .catch(() => {});

    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data && data.intake) setProfileData(data);
      })
      .catch(() => {});
  }, []);
  const { isNoir } = useTheme();
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<ConsoleLine[]>(
    BOOT_LOGS.map(log => ({ text: log, type: 'success' }))
  );
  
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [activeGame, setActiveGame] = useState<'none' | 'snake'>('none');
  const [isMatrixActive, setIsMatrixActive] = useState<boolean>(false);
  const [cmdCount, setCmdCount] = useState<number>(0);

  const unlockAchievement = useCallback((id: string, title: string, desc: string) => {
    if (typeof window === 'undefined') return;
    const saved = JSON.parse(localStorage.getItem('terminal_achievements') || '[]');
    if (!saved.includes(id)) {
      const updated = [...saved, id];
      localStorage.setItem('terminal_achievements', JSON.stringify(updated));
      playAchievementSound();
      toast.success(`🏆 ACHIEVEMENT UNLOCKED: ${title}`, { description: desc });
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      } catch {}
    }
  }, []);

  // Real telemetry state
  const [stats, setStats] = useState({
    fps: 60,
    bundleSize: 184,
    domNodes: 0,
    uptime: '00:00:00'
  });

  // Real Web Vitals state
  const [webVitals, setWebVitals] = useState({
    lcp: 0,
    fid: 0,
    cls: 0,
    hasInteraction: false
  });

  const terminalScreenRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isVisibleRef = useRef(true);

  // Auto-scroll terminal screen to bottom
  useEffect(() => {
    if (terminalScreenRef.current) {
      terminalScreenRef.current.scrollTo({
        top: terminalScreenRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [terminalHistory]);

  // Dynamically update DOM nodes count when terminal history renders
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const nodes = document.getElementsByTagName('*').length;
      setStats(prev => ({ ...prev, domNodes: nodes }));
    }
  }, [terminalHistory]);

  // Focus input on click of terminal area
  const focusTerminalInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Pause intervals/RAF loops when tab is hidden
  useEffect(() => {
    const handler = () => { isVisibleRef.current = !document.hidden; };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // FPS requestAnimationFrame counter
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const countFrames = () => {
      if (isVisibleRef.current) {
        frameCount++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
          const currentFps = Math.round((frameCount * 1000) / (now - lastTime));
          setStats(prev => ({ ...prev, fps: currentFps }));
          frameCount = 0;
          lastTime = now;
        }
      } else {
        lastTime = performance.now();
      }
      animId = requestAnimationFrame(countFrames);
    };

    animId = requestAnimationFrame(countFrames);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Hardware sync: script sizes, DOM nodes, and uptime
  useEffect(() => {
    // 1. Calculate actual loaded javascript bundle sizes in KB
    const calculateBundleSize = () => {
      if (typeof performance === 'undefined') return 184;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r => r.initiatorType === 'script' || r.name.endsWith('.js'));
      const totalBytes = jsResources.reduce((acc, r) => acc + (r.transferSize || r.encodedBodySize || r.decodedBodySize || 0), 0);
      return Math.round(totalBytes / 1024) || 245; // fallback to 245 if zero
    };

    // Calculate static metrics once on mount to avoid CPU overhead in setInterval loop
    const initialDomNodes = typeof document !== 'undefined' ? document.getElementsByTagName('*').length : 0;
    const initialBundle = calculateBundleSize();

    requestAnimationFrame(() => {
      setStats(prev => ({
        ...prev,
        domNodes: initialDomNodes,
        bundleSize: initialBundle
      }));
    });

    // Uptime tick loop - tracks performance.now() (session lifetime since first tab load)
    const timer = setInterval(() => {
      if (!isVisibleRef.current) return;
      const diff = typeof performance !== 'undefined' ? performance.now() : 0;
      const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      const uptimeStr = `${hours}:${mins}:${secs}`;

      setStats(prev => {
        if (prev.uptime === uptimeStr) return prev;
        return {
          ...prev,
          uptime: uptimeStr
        };
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Native Web Vitals Performance Observers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lcpObserver: PerformanceObserver | null = null;
    let fidObserver: PerformanceObserver | null = null;
    let clsObserver: PerformanceObserver | null = null;

    try {
      // 1. Largest Contentful Paint (LCP)
      lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1];
          const lcpVal = Number((lastEntry.startTime / 1000).toFixed(2));
          setWebVitals(prev => ({ ...prev, lcp: lcpVal }));
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {}

    try {
      // 2. First Input Delay (FID)
      fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const firstInput = entries[0] as PerformanceEventTiming;
          const fidVal = Math.round(firstInput.processingStart - firstInput.startTime);
          setWebVitals(prev => ({ ...prev, fid: fidVal, hasInteraction: true }));
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch {}

    try {
      // 3. Cumulative Layout Shift (CLS)
      let accumulatedCls = 0;
      clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as unknown as { hadRecentInput: boolean; value: number };
          if (!layoutShift.hadRecentInput) {
            accumulatedCls += layoutShift.value;
            setWebVitals(prev => ({ ...prev, cls: Number(accumulatedCls.toFixed(3)) }));
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {}

    return () => {
      lcpObserver?.disconnect();
      fidObserver?.disconnect();
      clsObserver?.disconnect();
    };
  }, []);

  const executeCommand = useCallback((cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    if (!trimmedCmd) return;

    playKeySound();
    setCmdCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        unlockAchievement('terminal_master', 'Terminal Master', 'Executed 5 terminal commands');
      }
      return next;
    });

    // Add input command to history & reset history index pointer
    setCmdHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    setTerminalHistory(prev => [...prev, { text: `> ${cmd}`, type: 'input' }]);

    let response: ConsoleLine[] = [];

    if (trimmedCmd.startsWith('git-info')) {
      const parts = cmd.trim().split(/\s+/);
      const subCommand = parts[1]?.toLowerCase() || '';

      if (subCommand === 'show') {
        const commitHash = parts[2] || '';
        if (!commitHash) {
          setTerminalHistory(prev => [
            ...prev,
            { text: 'Usage: git-info show <commit_hash>', type: 'error' },
            { text: 'Click here to return to Commit Journal', type: 'link', command: 'git-info' }
          ]);
          setTerminalInput('');
          return;
        }

        fetch(`/api/git-log?commit=${encodeURIComponent(commitHash)}`)
          .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
          })
          .then(data => {
            const lines: ConsoleLine[] = [];
            lines.push({ text: `GIT INSPECTOR // COMMIT SPECIFICATIONS (${data.repo || 'Repository'}):`, type: 'success' });
            lines.push({ text: ' ', type: 'output' });

            const detailLines = (data.content || '').split('\n');
            detailLines.forEach((l: string) => {
              lines.push({ text: l, type: 'output' });
            });
            lines.push({ text: ' ', type: 'output' });
            lines.push({
              text: 'Click here to return to Commit Journal',
              type: 'link',
              command: 'git-info'
            });
            setTerminalHistory(prev => [...prev, ...lines]);
          })
          .catch(() => {
            setTerminalHistory(prev => [
              ...prev,
              { text: `Commit details not found or failed to load for hash: '${commitHash}'`, type: 'error' },
              { text: 'Click here to return to Commit Journal', type: 'link', command: 'git-info' }
            ]);
          });
      } else if (subCommand === 'repo') {
        const targetRepo = parts[2] || '';
        if (!targetRepo || !targetRepo.includes('/')) {
          setTerminalHistory(prev => [
            ...prev,
            { text: 'Usage: git-info repo <owner/repo> (e.g. git-info repo prat3010/retriever)', type: 'error' }
          ]);
          setTerminalInput('');
          return;
        }
        fetch(`/api/git-log?repo=${encodeURIComponent(targetRepo)}`)
          .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
          })
          .then(data => {
            const lines: ConsoleLine[] = [];
            lines.push({ text: `GIT COMMIT JOURNAL (${data.repo || targetRepo}):`, type: 'success' });
            lines.push({ text: '  Click on any commit line to inspect details.', type: 'output' });
            lines.push({ text: ' ', type: 'output' });

            data.commits.forEach((c: { hash: string; subject: string; date: string; author: string }) => {
              lines.push({
                text: `  [${c.hash}] ${c.subject} (${c.date})`,
                type: 'link',
                command: `git-info show ${c.hash}`
              });
            });
            lines.push({ text: ' ', type: 'output' });
            lines.push({ text: 'Tip: Type "git-info show <commit_hash>" to open a commit record.', type: 'success' });
            setTerminalHistory(prev => [...prev, ...lines]);
          })
          .catch(() => {
            setTerminalHistory(prev => [
              ...prev,
              { text: `Failed to retrieve git log for repository '${targetRepo}'.`, type: 'error' }
            ]);
          });
      } else if (!subCommand) {
        // Default: fetch list of commits
        fetch('/api/git-log')
          .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
          })
          .then(data => {
            const lines: ConsoleLine[] = [];
            lines.push({ text: `PORTFOLIO DEVELOPMENT GIT COMMIT JOURNAL (${data.repo || 'prat3010/Prateek_website'}):`, type: 'success' });
            lines.push({ text: '  Click on any commit line to inspect live/build-time commit record.', type: 'output' });
            lines.push({ text: ' ', type: 'output' });

            data.commits.forEach((c: { hash: string; subject: string; date: string; author: string }) => {
              lines.push({
                text: `  [${c.hash}] ${c.subject} (${c.date})`,
                type: 'link',
                command: `git-info show ${c.hash}`
              });
            });
            lines.push({ text: ' ', type: 'output' });
            lines.push({ text: 'Tip: Type "git-info show <commit_hash>" or "git-info repo <owner/repo>" to inspect repositories.', type: 'success' });
            setTerminalHistory(prev => [...prev, ...lines]);
          })
          .catch(() => {
            setTerminalHistory(prev => [
              ...prev,
              { text: 'Failed to retrieve git logs.', type: 'error' }
            ]);
          });
      } else {
        setTerminalHistory(prev => [
          ...prev,
          { text: `Invalid git-info subcommand: '${subCommand}'. Usage: git-info [show <hash> | repo <owner/repo>]`, type: 'error' }
        ]);
      }

      setTerminalInput('');
      return;
    }

    if (trimmedCmd.startsWith('storage')) {
      const parts = trimmedCmd.split(/\s+/);
      const sub = parts[1]?.toLowerCase() || '';
      if (sub === 'clear' || sub === 'wipe') {
        if (typeof localStorage !== 'undefined') localStorage.clear();
        if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
        toast.success('Storage Wiped', { description: 'Cleared all local and session storage caches.' });
        setTerminalHistory(prev => [
          ...prev,
          { text: 'STORAGE INVENTORY WIPED:', type: 'success' },
          { text: '  - Cleared all LocalStorage key-value pairs.', type: 'output' },
          { text: '  - Cleared all SessionStorage contexts.', type: 'output' }
        ]);
        setTerminalInput('');
        return;
      }
    }

    if (trimmedCmd === 'analytics') {
      fetch('/api/analytics-summary')
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => {
          const lines: ConsoleLine[] = [
            { text: 'DATABASE TRAFFIC ANALYTICS SUMMARY:', type: 'success' },
            { text: `  - Operational Mode: ${data.isDemoMode ? 'DEMO (MOCK DATA)' : 'LIVE DATABASE'}`, type: 'output' },
            { text: `  - Total Page Views: ${data.totalViews} views`, type: 'output' },
            { text: `  - Unique IP Visitors: ${data.uniqueVisitors} users`, type: 'output' },
            { text: `  - Top Visited Path: ${data.popularPath}`, type: 'output' },
            { text: `  - Top Traffic Referral: ${data.topReferrer}`, type: 'output' },
            { text: `  - Top Visitor Country: ${data.topCountry}`, type: 'output' },
            { text: ' ', type: 'output' },
            { text: 'Click here to open full visitor analytics dashboard', type: 'link', command: 'go-analytics' }
          ];
          setTerminalHistory(prev => [...prev, ...lines]);
        })
        .catch(() => {
          setTerminalHistory(prev => [
            ...prev,
            { text: 'Failed to retrieve database analytics.', type: 'error' }
          ]);
        });
      setTerminalInput('');
      return;
    }

    if (trimmedCmd === 'go-analytics') {
      if (typeof window !== 'undefined') {
        window.location.href = '/analytics';
      }
      setTerminalInput('');
      return;
    }

    if (['partner', 'middleman', 'agreement', 'middleman-agreement'].includes(trimmedCmd)) {
      const mm: Partial<MiddlemanAgreementConfig> = profileData?.intake?.middlemanAgreement || {};
      const partnerName = mm.partnerName || '[Partner Name]';
      const partnerEmail = mm.partnerEmail || '';
      const effectiveDate = (mm.effectiveDate && mm.effectiveDate.trim()) ? mm.effectiveDate : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const devName = mm.developerName || 'Prateeq Sharma';
      const devEmail = mm.developerEmail || 'prateeqsharma@gmail.com';
      const tier1Cut = mm.tier1Commission || consoleCutFor(COMMISSION_BANDS[0]);
      const tier2Cut = mm.tier2Commission || consoleCutFor(COMMISSION_BANDS[1] || COMMISSION_BANDS[0]);
      const tier3Cut = mm.tier3Commission || consoleCutFor(COMMISSION_BANDS[2] || COMMISSION_BANDS[0]);
      const recurringCut = mm.recurringCommission || `${RECURRING_COMMISSION_RATE}%`;

      const disbursement = mm.disbursementRules || [
        "Rule 3.1: No out-of-pocket payouts prior to cleared client funds.",
        `Rule 3.2: Proportional payout within ${COMMISSION_DISBURSEMENT_WINDOW} of cleared client funds (50% on deposit, 50% on final balance).`,
        "Rule 3.3: Net fee calculation on retained funds in case of cancellations."
      ];

      const confidentiality = mm.confidentialityRules || [
        "Rule 4.1: Non-Circumvention — Partner agrees not to bypass Developer.",
        "Rule 4.2: Codebase & IP remain Developer property until fully paid.",
        "Rule 4.3: Strict confidentiality on quotes, client contacts & terms."
      ];

      const lines: ConsoleLine[] = [
        { text: '===========================================================', type: 'success' },
        { text: '      FREELANCE SALES & BUSINESS BROKER AGREEMENT          ', type: 'success' },
        { text: '===========================================================', type: 'success' },
        { text: `EFFECTIVE DATE : ${effectiveDate}`, type: 'output' },
        { text: `DEVELOPER      : ${devName} (${devEmail})`, type: 'output' },
        { text: `SALES PARTNER  : ${partnerName}${partnerEmail ? ` (${partnerEmail})` : ''}`, type: 'output' },
        { text: ' ', type: 'output' },
        { text: '1. PURPOSE & ROLES', type: 'success' },
        { text: `  - Independent Sales Partner Agreement between ${devName} and ${partnerName}.`, type: 'output' },
        { text: '  - Partner introduces qualified leads for web app & AI integration projects.', type: 'output' },
        { text: ' ', type: 'output' },
        { text: '2. COMMISSION TIER SCHEDULE', type: 'success' },
        ...COMMISSION_BANDS.map(band => ({
          text: `  - ${band.label} Deals (${consoleBandRange(band)}) : ${band.id === 'A' ? tier1Cut : band.id === 'B' ? tier2Cut : tier3Cut} Commission`,
          type: 'output' as const
        })),
        { text: `  - Recurring Care Plans               : ${recurringCut} Monthly Commission on net retainer`, type: 'output' },
        { text: ' ', type: 'output' },
        { text: '3. DISBURSEMENT & QUALIFICATION RULES', type: 'success' },
        ...disbursement.map(r => ({ text: `  - ${r}`, type: 'output' as const })),
        { text: ' ', type: 'output' },
        { text: '4. NON-CIRCUMVENTION & CONFIDENTIALITY', type: 'success' },
        ...confidentiality.map(r => ({ text: `  - ${r}`, type: 'output' as const })),
        { text: ' ', type: 'output' },
        { text: '5. SIGNATURE & ACCEPTANCE BLOCK', type: 'success' },
        { text: `  - DEVELOPER: ${devName} (Principal Engineer & Lead Architect)`, type: 'output' },
        { text: `  - PARTNER  : ${partnerName}`, type: 'output' },
        { text: ' ', type: 'output' },
        { text: '📄 VIEW / DOWNLOAD AGREEMENT PDF:', type: 'success' },
        { text: '  🔗 Open Sales Partner Agreement PDF (/Middleman_Partnership_Agreement.pdf)', type: 'link', href: '/Middleman_Partnership_Agreement.pdf' },
        { text: '===========================================================', type: 'success' }
      ];

      setTerminalHistory(prev => [...prev, ...lines]);
      setTerminalInput('');
      return;
    }

    if (trimmedCmd.startsWith('qrcode') || trimmedCmd.startsWith('qr')) {
      const parts = trimmedCmd.split(/\s+/);
      const arg = parts[1];
      if (arg !== undefined) {
        const amount = parseFloat(arg);
        if (isNaN(amount) || amount <= 0) {
          setTerminalHistory(prev => [
            ...prev,
            { text: `Invalid amount '${arg}'. Usage: qrcode <amount_in_inr> (e.g. qrcode 500)`, type: 'error' }
          ]);
          setTerminalInput('');
          return;
        }

        setTerminalHistory(prev => [
          ...prev,
          { text: `RAZORPAY DYNAMIC GATEWAY // Requesting single-use QR for ₹${amount.toLocaleString('en-IN')}...`, type: 'output' }
        ]);

        fetch('/api/terminal/qrcode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount }),
        })
          .then(async res => {
            const data = await res.json();
            if (res.ok && data.success && data.imageUrl) {
              setTerminalHistory(prev => [
                ...prev,
                { text: `RAZORPAY DYNAMIC UPI QR CODE (₹${data.amount.toLocaleString('en-IN')}):`, type: 'success' },
                { text: `  Scan using any UPI app (PhonePe, GPay, Paytm, BHIM) to pay exactly ₹${data.amount.toLocaleString('en-IN')}.`, type: 'output' },
                { text: '', type: 'image', imageUrl: data.imageUrl }
              ]);
            } else {
              setTerminalHistory(prev => [
                ...prev,
                { text: `FAILED: ${data.error || 'Could not generate dynamic QR Code.'}`, type: 'error' }
              ]);
            }
          })
          .catch(() => {
            setTerminalHistory(prev => [
              ...prev,
              { text: 'FAILED: Network error contacting payment gateway.', type: 'error' }
            ]);
          });

        setTerminalInput('');
        return;
      }

      setTerminalHistory(prev => [
        ...prev,
        { text: 'PHONEPE UPI PAYMENT PORTAL:', type: 'success' },
        { text: '  Tip: Pass an amount to generate a dynamic Razorpay QR Code (e.g. "qrcode 500").', type: 'output' },
        { text: '  Scan the default QR code below using any UPI app (PhonePe, GPay, Paytm, BHIM) to pay or donate.', type: 'output' },
        { text: '', type: 'image', imageUrl: '/phonepe_qr.svg' }
      ]);
      setTerminalInput('');
      return;
    }

    if (trimmedCmd.startsWith('ask ') || trimmedCmd.startsWith('explain ')) {
      const queryText = cmd.trim().replace(/^(ask|explain)\s+/i, '').trim();
      if (queryText.length >= 3) {
        setTerminalHistory(prev => [
          ...prev,
          { text: `SEARCHING SUPABASE SYSTEM MEMORY VECTORS FOR: "${queryText}"...`, type: 'success' }
        ]);

        fetch('/api/terminal/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: queryText })
        })
          .then(res => res.json())
          .then(data => {
            if (data.results && data.results.length > 0) {
              const lines: ConsoleLine[] = [];
              lines.push({ text: `RETRIEVED ${data.results.length} CODEBASE EVIDENCE CHUNKS FROM SUPABASE:`, type: 'success' });
              data.results.forEach((r: { meta_data?: Record<string, unknown>; content: string }, idx: number) => {
                const meta = r.meta_data || {};
                const file = meta.file_path || 'unknown';
                const symbol = meta.symbol_name ? ` | Symbol: ${meta.symbol_name}` : '';
                lines.push({ text: `  [${idx + 1}] File: ${file}${symbol}`, type: 'success' });
                lines.push({ text: r.content.slice(0, 300) + '...', type: 'output' });
              });
              setTerminalHistory(prev => [...prev, ...lines]);
            } else {
              setTerminalHistory(prev => [
                ...prev,
                { text: `No matching codebase chunks found for query: "${queryText}"`, type: 'error' }
              ]);
            }
          })
          .catch(() => {
            setTerminalHistory(prev => [
              ...prev,
              { text: 'Error querying Supabase system memory.', type: 'error' }
            ]);
          });

        setTerminalInput('');
        return;
      }
    }

    switch (trimmedCmd) {
      case 'help':
        response = [
          { text: 'Available commands:', type: 'success' },
          { text: '  ask <query>  - Query Retriever Concierge vector memory for platform specs & docs', type: 'output' },
          { text: '  projects   - List portfolio projects and tags', type: 'output' },
          { text: '  partner    - Print Sales Partner & Broker Agreement with PDF links', type: 'output' },
          { text: '  inspect    - Probe real Supabase latency, JS heap memory & React state', type: 'output' },
          { text: '  summary    - Generate & copy Technical System Dossier to clipboard', type: 'output' },
          { text: '  matrix     - Toggle retro Matrix green digital rain overlay', type: 'output' },
          { text: '  sfx        - Toggle Web Audio 8-bit sound synthesizer', type: 'output' },
          { text: '  snake      - Launch interactive Snake Game with Supabase Leaderboard', type: 'output' },
          { text: '  pizzarat   - Toggle 3D WebGL NYC Pizza Rat physics model', type: 'output' },
          { text: '  system     - Show CPU, memory, and display metrics', type: 'output' },
          { text: '  storage    - Inspect local and session storage', type: 'output' },
          { text: '  stack      - List the website technologies', type: 'output' },
          { text: '  sync       - Show the local content sync workflow', type: 'output' },
          { text: '  analytics  - Show visitor statistics summary', type: 'output' },
          { text: '  git-info   - Open the generated portfolio commit log (subcommands: show, repo)', type: 'output' },
          { text: '  qrcode     - Scan default PhonePe QR or generate dynamic (e.g. qrcode 500)', type: 'output' },
          { text: '  clear      - Clear the command interface screen', type: 'output' }
        ];
        break;
      case 'projects':
        response = [
          { text: 'PORTFOLIO PROJECTS RECORD:', type: 'success' },
          { text: `  - Total Active Projects: ${projects.length}`, type: 'output' },
          ...projects.map(p => ({ text: `  • ${p.title} (${p.tags.join(', ')})`, type: 'output' as const })),
          { text: '  - Repository source: github.com/prat3010', type: 'output' }
        ];
        break;
      case 'system': {
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        let os = 'Unknown OS';
        if (userAgent.includes('Macintosh')) os = 'macOS';
        else if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
        else if (userAgent.includes('Android')) os = 'Android';

        const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 'Unavailable' : 'Unavailable';
        const nav = typeof navigator !== 'undefined' ? navigator as Navigator & { deviceMemory?: number } : null;
        const ram = nav && nav.deviceMemory ? `${nav.deviceMemory} GB` : 'Protected/Unavailable';
        const width = typeof window !== 'undefined' ? window.screen.width : 0;
        const height = typeof window !== 'undefined' ? window.screen.height : 0;
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

        response = [
          { text: 'SYSTEM HARDWARE METRICS:', type: 'success' },
          { text: `  - Operating System: ${os}`, type: 'output' },
          { text: `  - Logical CPU Cores: ${cores} threads`, type: 'output' },
          { text: `  - Estimated Device RAM: ${ram}`, type: 'output' },
          { text: `  - Display Resolution: ${width}x${height} (@${dpr}x DPR)`, type: 'output' }
        ];
        break;
      }
      case 'storage': {
        const localKeys = typeof localStorage !== 'undefined' ? Object.keys(localStorage) : [];
        const sessionKeys = typeof sessionStorage !== 'undefined' ? Object.keys(sessionStorage) : [];
        const cookieCount = typeof document !== 'undefined' ? (document.cookie ? document.cookie.split(';').length : 0) : 0;

        let totalLocalBytes = 0;
        if (typeof localStorage !== 'undefined') {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              totalLocalBytes += (localStorage.getItem(key) || '').length;
            }
          }
        }

        response = [
          { text: 'CLIENT-SIDE STORAGE AUDIT:', type: 'success' },
          { text: `  - LocalStorage footprint: ${localKeys.length} keys (${totalLocalBytes} characters)`, type: 'output' },
          ...localKeys.map(k => ({ text: `    • [Local] ${k}`, type: 'output' as const })),
          { text: `  - SessionStorage footprint: ${sessionKeys.length} keys`, type: 'output' },
          ...sessionKeys.map(k => ({ text: `    • [Session] ${k}`, type: 'output' as const })),
          { text: `  - Cookies count: ${cookieCount} active`, type: 'output' },
          { text: 'Tip: Type "storage clear" to wipe all localStorage and sessionStorage caches.', type: 'success' }
        ];
        break;
      }
      case 'stack':
        response = [
          { text: 'WEBSITE TECHNOLOGY STACK:', type: 'success' },
          { text: '  - Core Framework: Next.js 16.2.6 (React 19.2.4)', type: 'output' },
          { text: '  - Language: TypeScript 5.x', type: 'output' },
          { text: '  - Database & Backend: Supabase JS SDK 2.106.2', type: 'output' },
          { text: '  - Styling & Layout: Vanilla CSS / CSS Modules', type: 'output' },
          { text: '  - Animations: Framer Motion 12.40.0', type: 'output' },
          { text: '  - 3D Graphics: Three.js 0.184.0', type: 'output' },
          { text: '  - Smooth Scrolling: Lenis Scroll 1.3.23', type: 'output' },
          { text: '  - Document/PDF Engine: jsPDF 4.2.1', type: 'output' },
          { text: '  - UI Icons: Lucide React 1.16.0', type: 'output' },
          { text: '  - Markdown Parser: React Markdown 10.1.0', type: 'output' },
          { text: '  - Email Delivery: Resend SDK 6.12.4', type: 'output' },
          { text: '  - Performance Audits: Vercel Speed Insights 2.0.0', type: 'output' }
        ];
        break;
      case 'sync':
      case 'synchronizer':
        response = [
          { text: 'PORTFOLIO DATABASE SYNCHRONIZER:', type: 'success' },
          { text: '  A local manager dashboard for updating projects, skills, certificates, and resume content.', type: 'output' },
          { text: ' ', type: 'output' },
          { text: '  - Core Script: scripts/synchronizer.py (Python 3)', type: 'output' },
          { text: '  - Interface: Streamlit Local Dashboard', type: 'output' },
          { text: '  - AI Parsing Integration: Gemini 2.5 Flash API', type: 'output' },
          { text: '  - Database Sync: Supabase', type: 'output' },
          { text: '  - Codebase Fallbacks: JSON records for projects, skills, certificates, and resume', type: 'output' },
          { text: '  - Blog Output: Markdown files in src/content/posts/', type: 'output' },
          { text: '  - Local Command: streamlit run scripts/synchronizer.py', type: 'output' }
        ];
        break;
      case 'snake':
      case 'play':
      case 'game':
        setActiveGame('snake');
        setTerminalHistory(prev => [
          ...prev,
          { text: 'LAUNCHING RETRO TERMINAL SNAKE ENGINE...', type: 'success' },
          { text: '  - High scores are synchronized with Supabase Global Leaderboard.', type: 'output' }
        ]);
        setTerminalInput('');
        return;
      case 'inspect':
      case 'probe': {
        const startTime = performance.now();
        fetch('/api/profile')
          .then(() => {
            const latency = Math.round(performance.now() - startTime);
            const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
            const heapUsed = memory ? `${Math.round(memory.usedJSHeapSize / 1048576)} MB` : 'Protected/Browser Restricted';
            const heapLimit = memory ? `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB` : 'Unavailable';
            const activeTheme = isNoir ? 'Noir Cyber-Glow' : 'Comic Ink Light';

            const lines: ConsoleLine[] = [
              { text: '===========================================================', type: 'success' },
              { text: '      REAL-TIME SYSTEM & SUPABASE ARCHITECTURE PROBE       ', type: 'success' },
              { text: '===========================================================', type: 'success' },
              { text: `⚡ SUPABASE RLS DATABASE LATENCY : ${latency} ms`, type: 'success' },
              { text: `🧠 JS HEAP MEMORY FOOTPRINT      : ${heapUsed} (Limit: ${heapLimit})`, type: 'output' },
              { text: `🎨 ACTIVE DESIGN THEME ENGINE     : ${activeTheme}`, type: 'output' },
              { text: `📜 LOADED SCRIPT BUNDLE FOOTPRINT : ${stats.bundleSize} KB`, type: 'output' },
              { text: `🌐 DOM CONTAINER NODES COUNT     : ${stats.domNodes} elements`, type: 'output' },
              { text: '===========================================================', type: 'success' }
            ];
            setTerminalHistory(prev => [...prev, ...lines]);
            unlockAchievement('cyber_inspector', 'Cyber Inspector', 'Executed real-time Supabase latency & JS memory probe');
          })
          .catch(() => {
            setTerminalHistory(prev => [...prev, { text: 'Failed to probe database latency.', type: 'error' }]);
          });
        setTerminalInput('');
        return;
      }
      case 'summary':
      case 'dossier':
      case 'architecture': {
        const summaryText = [
          '===========================================================',
          '      PRATEEK SHARMA PORTFOLIO - TECHNICAL SYSTEM DOSSIER  ',
          '===========================================================',
          '• Core Architecture : Next.js 16 App Router (React 19, TypeScript 5)',
          '• Styling & Tokens  : CSS Modules / Custom Properties (Azure & Noir Themes)',
          '• Database & Auth   : Supabase PostgreSQL (RLS-gated service role proxy)',
          '• Scroll & Motion   : Lenis Smooth Scroll 1.3 + Framer Motion 12',
          '• 3D & Graphics     : Three.js 0.184 + HTML Canvas Shaders',
          '• Payment Gateway   : Razorpay Dynamic UPI QR & Webhook Ledger',
          '• Email Delivery    : Resend API with PDF Scoping Brief Attachments',
          '==========================================================='
        ].join('\n');

        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(summaryText).then(() => {
            toast.success('Technical Dossier Copied to Clipboard!');
          }).catch(() => {});
        }

        setTerminalHistory(prev => [
          ...prev,
          { text: summaryText, type: 'success' },
          { text: 'Tip: System dossier has been copied to your clipboard.', type: 'output' }
        ]);
        setTerminalInput('');
        return;
      }
      case 'matrix':
        setIsMatrixActive(prev => !prev);
        setTerminalHistory(prev => [
          ...prev,
          { text: `MATRIX DIGITAL RAIN OVERLAY: ${!isMatrixActive ? 'ENGAGED' : 'DISENGAGED'}`, type: 'success' }
        ]);
        if (!isMatrixActive) unlockAchievement('cyber_hacker', 'Cyber Hacker', 'Activated Matrix Digital Rain Canvas');
        setTerminalInput('');
        return;
      case 'pizzarat':
      case 'konami':
        if (typeof window !== 'undefined') {
          const isActive = document.documentElement.classList.toggle('konami-active');
          setTerminalHistory(prev => [
            ...prev,
            { text: `NYC PIZZA RAT 3D MODEL: ${isActive ? 'ACTIVE' : 'INACTIVE'}`, type: 'success' }
          ]);
          if (isActive) unlockAchievement('pizza_legend', 'NYC Pizza Legend', 'Summoned 3D Pizza Rat WebGL model');
        }
        setTerminalInput('');
        return;
      case 'sfx':
      case 'sound':
      case 'audio': {
        const isEnabled = toggleAudio();
        setTerminalHistory(prev => [
          ...prev,
          { text: `WEB AUDIO SFX SYNTHESIZER: ${isEnabled ? 'ENABLED' : 'MUTED'}`, type: 'success' }
        ]);
        setTerminalInput('');
        return;
      }
      case 'clear':
        setTerminalHistory([]);
        setTerminalInput('');
        toast.info('Terminal screen cleared');
        return;
      default:
        response = [
          { text: `Command not found: '${trimmedCmd}'. Type 'help' for options.`, type: 'error' }
        ];
    }

    setTerminalHistory(prev => [...prev, ...response]);
    setTerminalInput('');
  }, [projects, profileData, isNoir, stats, isMatrixActive, unlockAchievement]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(terminalInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setTerminalInput(cmdHistory[nextIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= cmdHistory.length) {
        setHistoryIndex(-1);
        setTerminalInput('');
      } else {
        setHistoryIndex(nextIndex);
        setTerminalInput(cmdHistory[nextIndex] || '');
      }
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {/* ---- Go Back Header ---- */}
        <div className={styles.header} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={18} />
            <span>Return to Base</span>
          </Link>
          <Link href="/analytics" className={styles.backLink}>
            <span>Visitor Analytics</span>
          </Link>
        </div>

        <div className={styles.consoleContainer}>
          {/* Title Bar */}
          <div className={styles.consoleTitleBar}>
            <div className={styles.indicators}>
              <span className={`${styles.dot} ${styles.red}`} />
              <span className={`${styles.dot} ${styles.yellow}`} />
              <span className={`${styles.dot} ${styles.green}`} />
            </div>
            <h2 className={styles.titleText}>
              {isNoir ? 'SYSTEM DIAGNOSTICS & LOGS (v2.5)' : 'COBALT TERMINAL CORE // SITE SCHEMATICS'}
            </h2>
          </div>

          {/* Dashboard widgets Grid */}
          <div className={styles.consoleGrid}>
            
            {/* Stats Widget */}
            <div className={styles.consoleWidget}>
              <h3 className={styles.widgetTitle}>
                <Cpu size={14} className={styles.widgetIcon} />
                TELEMETRY MATRIX
              </h3>
              <ul className={styles.metricsList}>
                <li>
                  <span className={styles.metricLabel}>RENDER FPS:</span>
                  <span className={styles.metricValue}>{stats.fps} FPS</span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${Math.min(100, (stats.fps / 60) * 100)}%` }} />
                  </div>
                </li>
                <li>
                  <span className={styles.metricLabel}>SCRIPT BUNDLE:</span>
                  <span className={styles.metricValue}>{stats.bundleSize} KB</span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${Math.min(100, (stats.bundleSize / 500) * 100)}%`, backgroundColor: 'var(--neon-cyan, var(--pop-blue))' }} />
                  </div>
                </li>
                <li>
                  <span className={styles.metricLabel}>DOM ELEMENTS:</span>
                  <span className={styles.metricValue}>{stats.domNodes} nodes</span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${Math.min(100, (stats.domNodes / 2000) * 100)}%`, backgroundColor: 'var(--neon-pink, var(--pop-red))' }} />
                  </div>
                </li>
                <li>
                  <span className={styles.metricLabel}>UPTIME:</span>
                  <span className={styles.metricValue}>{stats.uptime}</span>
                </li>
              </ul>
            </div>

            {/* Performance Web Vitals Widget */}
            <div className={styles.consoleWidget}>
              <h3 className={styles.widgetTitle}>
                <Layers size={14} className={styles.widgetIcon} />
                PERFORMANCE VITALS
              </h3>
              <ul className={styles.metricsList}>
                <li>
                  <span className={styles.metricLabel}>LCP (PAINT):</span>
                  <span className={styles.metricValue}>
                    {webVitals.lcp > 0 ? `${webVitals.lcp}s` : 'Measuring...'}
                  </span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${Math.min(100, (webVitals.lcp / 2.5) * 100)}%`, backgroundColor: 'var(--neon-cyan, var(--pop-blue))' }} />
                  </div>
                </li>
                <li>
                  <span className={styles.metricLabel}>FID (DELAY):</span>
                  <span className={styles.metricValue}>
                    {webVitals.hasInteraction ? `${webVitals.fid}ms` : 'Pending...'}
                  </span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${Math.min(100, (webVitals.fid / 100) * 100)}%`, backgroundColor: 'var(--neon-cyan, var(--pop-blue))' }} />
                  </div>
                </li>
                <li>
                  <span className={styles.metricLabel}>CLS (SHIFT):</span>
                  <span className={styles.metricValue}>
                    {webVitals.cls}
                  </span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${Math.min(100, (webVitals.cls / 0.1) * 100)}%`, backgroundColor: 'var(--neon-cyan, var(--pop-blue))' }} />
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Terminal Console */}
          <div className={styles.terminalContainer} onClick={focusTerminalInput}>
            {activeGame === 'snake' ? (
              <TerminalSnakeGame
                onClose={() => setActiveGame('none')}
                onAchievementUnlocked={unlockAchievement}
              />
            ) : (
              <>
                <div className={styles.terminalScreen} ref={terminalScreenRef} data-lenis-prevent>
                  {terminalHistory.map((line, index) => {
                    if (line.type === 'image' && line.imageUrl) {
                      return (
                        <div key={index} className={styles.terminalImageContainer}>
                          <Image src={line.imageUrl} alt="PhonePe QR Code" className={styles.terminalImage} width={200} height={200} unoptimized />
                        </div>
                      );
                    }
                    if (line.href) {
                      return (
                        <div key={index} className={`${styles.terminalLine} ${styles.link}`}>
                          <a
                            href={line.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.link}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {line.text}
                          </a>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={index}
                        className={`${styles.terminalLine} ${styles[line.type]} ${line.command ? styles.clickableLine : ''}`}
                        onClick={line.command ? (e) => {
                          e.stopPropagation();
                          executeCommand(line.command!);
                        } : undefined}
                      >
                        {line.text}
                      </div>
                    );
                  })}
                </div>
                <div className={styles.terminalPromptLine}>
                  <span className={styles.promptSymbol}>&gt;</span>
                  <input
                    ref={inputRef}
                    type="text"
                    className={styles.terminalInput}
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a command..."
                    aria-label="Terminal prompt"
                    autoFocus
                  />
                </div>
              </>
            )}
          </div>

          {/* Command Shortcuts list for easy mobile use */}
          <div className={styles.shortcutsContainer}>
            <span className={styles.shortcutsLabel}>QUICK SHORTCUTS:</span>
            <div className={styles.shortcutsGrid}>
              {['help', 'inspect', 'summary', 'matrix', 'sfx', 'snake', 'pizzarat', 'projects', 'partner', 'system', 'storage', 'stack', 'sync', 'analytics', 'git-info', 'qrcode', 'clear'].map(cmd => (
                <button
                  key={cmd}
                  onClick={() => executeCommand(cmd)}
                  className={styles.shortcutBtn}
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
