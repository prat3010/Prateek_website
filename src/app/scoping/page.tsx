import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Rocket } from 'lucide-react';
import IntakeForm from '@/components/Intake/IntakeForm';
import { getProfile } from '@/lib/data';
import styles from './scoping.module.css';

export const metadata: Metadata = {
  title: 'Project Scoping Lab & Instant Quote | Prateeq Sharma',
  description:
    'Configure your web architecture, add-on modules, brand assets, and maintenance care plan for an instant itemized quotation and downloadable PDF proposal.',
  alternates: {
    canonical: '/scoping',
  },
};

interface ScopingPageProps {
  searchParams?: Promise<{ engine?: string; goal?: string; type?: string; service?: string }>;
}

export default async function ScopingPage({ searchParams }: ScopingPageProps) {
  const params = searchParams ? await searchParams : null;
  const profile = await getProfile();

  let preset: { goalId?: string; engineId?: string; serviceType?: 'full' | 'quick' | 'care'; quickServiceId?: string } | null = null;
  
  if (params?.type === 'full') {
    preset = { serviceType: 'full', engineId: params?.engine, goalId: params?.goal };
  } else if (params?.type === 'quick') {
    preset = { serviceType: 'quick', quickServiceId: params?.service };
  } else if (params?.type === 'care') {
    preset = { serviceType: 'care' };
  } else if (params?.engine) {
    preset = { serviceType: 'full', engineId: params.engine };
  } else if (params?.goal) {
    preset = { serviceType: 'full', goalId: params.goal };
  }

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    'name': 'Prateeq Sharma — Web Architecture & Product Engineering',
    'url': 'https://prateeq.in/scoping',
    'description':
      'Fixed-scope web engineering, SaaS application development, UI design systems, and SLA maintenance care plans.',
    'provider': {
      '@type': 'Person',
      'name': 'Prateeq Sharma',
      'url': 'https://prateeq.in',
    },
    'areaServed': 'Global',
    'priceRange': '$$',
  };

  return (
    <div className={styles.wrapper}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={18} />
            <span>Return to Base</span>
          </Link>
          <div className={styles.brandBadge}>
            <Rocket size={14} />
            <span>PRATEEQ.IN | PROJECT SCOPING LAB &amp; INSTANT QUOTE</span>
          </div>
        </div>
        <IntakeForm resumeData={profile} initialPreset={preset} />
      </div>
    </div>
  );
}
