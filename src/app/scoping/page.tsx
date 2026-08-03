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
  searchParams?: Promise<{ engine?: string; goal?: string }>;
}

export default async function ScopingPage({ searchParams }: ScopingPageProps) {
  const params = searchParams ? await searchParams : null;
  const profile = await getProfile();

  let preset: { goalId?: string; engineId?: string } | null = null;
  if (params?.engine) {
    preset = { engineId: params.engine };
  } else if (params?.goal) {
    preset = { goalId: params.goal };
  }

  return (
    <div className={styles.wrapper}>
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
