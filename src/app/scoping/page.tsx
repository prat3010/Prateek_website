import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
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
  searchParams?: Promise<{
    engine?: string;
    goal?: string;
    type?: string;
    service?: string;
    features?: string;
    brand?: string;
    care?: string;
    currency?: string;
  }>;
}

export default async function ScopingPage({ searchParams }: ScopingPageProps) {
  const params = searchParams ? await searchParams : null;
  const profile = await getProfile();

  let preset: {
    goalId?: string;
    engineId?: string;
    serviceType?: 'full' | 'quick' | 'care';
    quickServiceId?: string;
    featureIds?: string[];
    brandId?: string;
    careId?: string;
    currency?: 'INR' | 'USD';
  } | null = null;
  
  const featureIds = params?.features ? params.features.split(',').map(f => f.trim()).filter(Boolean) : undefined;
  const currency = params?.currency?.toUpperCase() === 'USD' ? 'USD' : params?.currency?.toUpperCase() === 'INR' ? 'INR' : undefined;

  if (params?.type === 'full') {
    preset = { serviceType: 'full', engineId: params?.engine, goalId: params?.goal, featureIds, brandId: params?.brand, careId: params?.care, currency };
  } else if (params?.type === 'quick') {
    preset = { serviceType: 'quick', quickServiceId: params?.service };
  } else if (params?.type === 'care') {
    preset = { serviceType: 'care' };
  } else if (params?.engine || params?.goal || featureIds || params?.brand || params?.care || currency) {
    preset = { serviceType: 'full', engineId: params?.engine, goalId: params?.goal, featureIds, brandId: params?.brand, careId: params?.care, currency };
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
      <Script
        id="service-jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
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
        <main>
          <h1 className="sr-only">Project Scoping Lab &amp; Instant Quote</h1>
          <IntakeForm resumeData={profile} initialPreset={preset} />
        </main>
      </div>
    </div>
  );
}
