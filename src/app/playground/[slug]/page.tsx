import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Brain, 
  Rocket, 
  Eye
} from 'lucide-react';

const GitHubIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);
import { 
  getPlaygroundItemBySlug, 
  getAllPlaygroundSlugs,
  type InteractiveToyPlaygroundItem,
  type GenerativeMediaPlaygroundItem,
  type SaasPlaygroundItem,
  type CognitiveToolPlaygroundItem,
  type ExperimentPlaygroundItem
} from '@/data/playgroundItems';
import ArcadeCabinetShell from '@/components/playground/viewers/ArcadeCabinetShell';
import PlaygroundSnake from '@/components/playground/items/PlaygroundSnake';
import PlaygroundPathfinder from '@/components/playground/items/PlaygroundPathfinder';
import PlaygroundPizzaRat from '@/components/playground/items/PlaygroundPizzaRat';
import PlaygroundMatrixRain from '@/components/playground/items/PlaygroundMatrixRain';
import PlaygroundNeuralDossier from '@/components/playground/items/PlaygroundNeuralDossier';
import styles from './PlaygroundDetail.module.css';

interface PlaygroundSlugPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getAllPlaygroundSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PlaygroundSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getPlaygroundItemBySlug(slug);

  if (!item) {
    return {
      title: 'Item Not Found // The Playground',
    };
  }

  return {
    title: `${item.title} // The Playground | Prateeq Sharma`,
    description: item.tagline,
    alternates: {
      canonical: `/playground/${slug}`,
    },
    openGraph: {
      title: `${item.title} // The Playground`,
      description: item.tagline,
      url: `https://prateeq.in/playground/${slug}`,
      images: item.previewImage ? [{ url: item.previewImage }] : undefined,
    },
  };
}

export default async function PlaygroundItemPage({ params }: PlaygroundSlugPageProps) {
  const { slug } = await params;
  const item = getPlaygroundItemBySlug(slug);

  if (!item) {
    notFound();
  }

  // ─── 🎮 1. INTERACTIVE TOYS & ARCADE GAMES ───
  if (item.kind === 'interactive-toy') {
    const toy = item as InteractiveToyPlaygroundItem;
    return (
      <ArcadeCabinetShell item={toy}>
        {toy.renderMode === 'iframe' && toy.iframeUrl ? (
          <div className={styles.iframeContainer}>
            <iframe
              src={toy.iframeUrl}
              title={toy.title}
              sandbox="allow-scripts allow-same-origin allow-pointer-lock"
              className={styles.gameIframe}
            />
          </div>
        ) : toy.componentName === 'PlaygroundSnake' ? (
          <PlaygroundSnake />
        ) : toy.componentName === 'PlaygroundPathfinder' ? (
          <PlaygroundPathfinder />
        ) : toy.componentName === 'PlaygroundPizzaRat' ? (
          <PlaygroundPizzaRat />
        ) : toy.componentName === 'PlaygroundMatrixRain' ? (
          <PlaygroundMatrixRain />
        ) : (
          <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-jetbrains-mono, monospace)', padding: '24px' }}>
            Game engine ready. Select interactive mode.
          </div>
        )}
      </ArcadeCabinetShell>
    );
  }

  // ─── 🧠 2. COGNITIVE AI & RETRIEVER TOOLS ───
  if (item.kind === 'cognitive-tool') {
    const cog = item as CognitiveToolPlaygroundItem;
    return (
      <main className={styles.container}>
        <Link href="/playground" className={styles.backNav}>
          <ArrowLeft size={16} />
          <span>Back to Playground</span>
        </Link>

        <header className={styles.header}>
          <div className={styles.badgeRow}>
            <span className={styles.kindBadge}>
              <Brain size={14} />
              <span>Cognitive Tool</span>
            </span>
            <span className={styles.statusBadge}>
              {cog.metricsBadge || 'ORACLE VPS'}
            </span>
          </div>
          <h1 className={styles.title}>{cog.title}</h1>
          <p className={styles.tagline}>{cog.tagline}</p>
        </header>

        <div style={{ marginBottom: '32px' }}>
          <PlaygroundNeuralDossier />
        </div>

        <div className={styles.saasCard}>
          <div className={styles.sectionLabel}>Cognitive Architecture Capabilities</div>
          <ul className={styles.highlightsList}>
            {cog.capabilities.map((cap, i) => (
              <li key={i} className={styles.highlightItem}>
                <CheckCircle2 size={16} style={{ color: 'var(--color-primary)' }} />
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    );
  }

  // ─── 🎨 3. GENERATIVE MEDIA & PROMPT ENGINEERING ───
  if (item.kind === 'generative-media') {
    const media = item as GenerativeMediaPlaygroundItem;
    return (
      <main className={styles.container}>
        <Link href="/playground" className={styles.backNav}>
          <ArrowLeft size={16} />
          <span>Back to Playground</span>
        </Link>

        <header className={styles.header}>
          <div className={styles.badgeRow}>
            <span className={styles.kindBadge}>
              <Sparkles size={14} />
              <span>Generative AI Media</span>
            </span>
            <span className={styles.statusBadge}>{media.model}</span>
          </div>
          <h1 className={styles.title}>{media.title}</h1>
          <p className={styles.tagline}>{media.tagline}</p>
        </header>

        <div className={styles.mediaGrid}>
          <div className={styles.mediaViewer}>
            <Image
              src={media.mediaUrl}
              alt={media.title}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 55vw"
              style={{ objectFit: 'contain' }}
            />
          </div>

          <div className={styles.mediaDetails}>
            <div>
              <div className={styles.sectionLabel}>Model & Architecture</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {media.model}
              </div>
            </div>

            <div>
              <div className={styles.sectionLabel}>Positive Synthesis Prompt</div>
              <div className={styles.promptCard}>
                {media.prompt}
              </div>
            </div>

            {media.negativePrompt && (
              <div>
                <div className={styles.sectionLabel}>Negative Prompt</div>
                <div className={styles.promptCard} style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                  {media.negativePrompt}
                </div>
              </div>
            )}

            {media.parameters && (
              <div>
                <div className={styles.sectionLabel}>Generation Parameters</div>
                <div className={styles.parametersGrid}>
                  {media.parameters.aspectRatio && (
                    <div className={styles.paramCard}>
                      <div className={styles.paramKey}>Aspect Ratio</div>
                      <div className={styles.paramVal}>{media.parameters.aspectRatio}</div>
                    </div>
                  )}
                  {media.parameters.cfgScale !== undefined && (
                    <div className={styles.paramCard}>
                      <div className={styles.paramKey}>CFG Scale</div>
                      <div className={styles.paramVal}>{media.parameters.cfgScale}</div>
                    </div>
                  )}
                  {media.parameters.steps !== undefined && (
                    <div className={styles.paramCard}>
                      <div className={styles.paramKey}>Steps</div>
                      <div className={styles.paramVal}>{media.parameters.steps}</div>
                    </div>
                  )}
                  {media.parameters.seed !== undefined && (
                    <div className={styles.paramCard}>
                      <div className={styles.paramKey}>Seed</div>
                      <div className={styles.paramVal}>{media.parameters.seed}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <div className={styles.sectionLabel}>Description & Context</div>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '0.92rem' }}>
                {media.description}
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ─── 🚀 4. MICRO-SAAS PRODUCTS ───
  if (item.kind === 'saas') {
    const saas = item as SaasPlaygroundItem;
    return (
      <main className={styles.container}>
        <Link href="/playground" className={styles.backNav}>
          <ArrowLeft size={16} />
          <span>Back to Playground</span>
        </Link>

        <header className={styles.header}>
          <div className={styles.badgeRow}>
            <span className={styles.kindBadge}>
              <Rocket size={14} />
              <span>Micro-SaaS App</span>
            </span>
            {saas.pricingModel && (
              <span className={styles.statusBadge}>{saas.pricingModel}</span>
            )}
          </div>
          <h1 className={styles.title}>{saas.title}</h1>
          <p className={styles.tagline}>{saas.tagline}</p>
        </header>

        <div className={styles.saasCard}>
          <div>
            <div className={styles.sectionLabel}>About the Project</div>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '1rem', marginTop: '6px' }}>
              {saas.description}
            </p>
          </div>

          <div>
            <div className={styles.sectionLabel}>Key Highlights & Capabilities</div>
            <ul className={styles.highlightsList} style={{ marginTop: '8px' }}>
              {saas.highlights.map((h, i) => (
                <li key={i} className={styles.highlightItem}>
                  <CheckCircle2 size={16} style={{ color: 'var(--color-primary)' }} />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className={styles.sectionLabel}>Production Tech Stack</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {saas.techStack.map((tech) => (
                <span 
                  key={tech} 
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontFamily: 'var(--font-jetbrains-mono, monospace)',
                    fontSize: '0.8rem',
                    color: 'var(--color-text)',
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.ctaRow}>
            <Link href={saas.appUrl} className={styles.primaryCta}>
              <span>Launch Live Product</span>
              <ExternalLink size={16} />
            </Link>
            {saas.githubUrl && (
              <a
                href={saas.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondaryCta}
              >
                <GitHubIcon size={16} />
                <span>View Source Code</span>
              </a>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ─── ⚡ 5. EXPERIMENTS & WEB LABS ───
  const exp = item as ExperimentPlaygroundItem;
  return (
    <main className={styles.container}>
      <Link href="/playground" className={styles.backNav}>
        <ArrowLeft size={16} />
        <span>Back to Playground</span>
      </Link>

      <header className={styles.header}>
        <div className={styles.badgeRow}>
          <span className={styles.kindBadge}>
            <Eye size={14} />
            <span>Interactive Experiment</span>
          </span>
          <span className={styles.statusBadge}>{exp.experimentType}</span>
        </div>
        <h1 className={styles.title}>{exp.title}</h1>
        <p className={styles.tagline}>{exp.tagline}</p>
      </header>

      <div className={styles.saasCard}>
        <div>
          <div className={styles.sectionLabel}>Experiment Overview</div>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '1rem', marginTop: '6px' }}>
            {exp.description}
          </p>
        </div>

        <div>
          <div className={styles.sectionLabel}>Active Subsystems</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {exp.techStack.map((tech) => (
              <span 
                key={tech} 
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontFamily: 'var(--font-jetbrains-mono, monospace)',
                  fontSize: '0.8rem',
                  color: 'var(--color-text)',
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.ctaRow}>
          {exp.githubUrl && (
            <a
              href={exp.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.primaryCta}
            >
              <GitHubIcon size={16} />
              <span>Inspect Source on GitHub</span>
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
