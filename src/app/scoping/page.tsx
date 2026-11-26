import type { Metadata } from 'next';
import ScopingHeader from './ScopingHeader';
import IntakeForm from '@/components/Intake/IntakeForm';
import { SectionErrorBoundary } from '@/components/ui/ErrorBoundary';
import { getProfile } from '@/lib/data';
import styles from './scoping.module.css';

export const metadata: Metadata = {
  title: 'Project Scoping Lab & Instant Quote | Prateeq Sharma',
  description:
    'Configure your web architecture, AI RAG modules, brand assets, and SLA maintenance plan for an instant itemized quotation (INR/USD) and downloadable PDF proposal.',
  keywords: [
    'Web App Project Cost Calculator',
    'SaaS MVP Instant Quote',
    'Custom AI RAG Development Pricing',
    'Fixed-Scope Software Engineering',
    'Next.js Freelance Developer Quote',
    'Prateeq Sharma',
  ],
  alternates: {
    canonical: '/scoping',
  },
  openGraph: {
    title: 'Project Scoping Lab & Instant Quote | Prateeq Sharma',
    description:
      'Transparent fixed-scope CPQ calculator: configure Next.js web apps, SaaS MVPs, AI RAG systems, and export an itemized PDF proposal in 60 seconds.',
    url: 'https://prateeq.in/scoping',
    siteName: 'Prateeq Sharma Portfolio',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Project Scoping Lab & Instant Quote | Prateeq Sharma',
    description:
      'Transparent fixed-scope CPQ calculator with instant INR/USD pricing and PDF SOW export.',
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
    '@graph': [
      {
        '@type': 'ProfessionalService',
        '@id': 'https://prateeq.in/scoping#service',
        'name': 'Prateeq Sharma — Web Architecture & AI Engineering Scoping Lab',
        'url': 'https://prateeq.in/scoping',
        'image': 'https://prateeq.in/scoping/opengraph-image',
        'description':
          'Fixed-scope web engineering, SaaS MVP development, custom RAG platforms, Voice AI bots, UI design systems, and SLA maintenance care plans.',
        'provider': {
          '@type': 'Person',
          'name': 'Prateeq Sharma',
          'url': 'https://prateeq.in',
        },
        'areaServed': 'Global',
        'priceRange': '$$',
        'hasOfferCatalog': {
          '@type': 'OfferCatalog',
          'name': 'Fixed-Scope Software & AI Engineering Catalog',
          'itemListElement': [
            {
              '@type': 'Offer',
              'name': 'Landing Page Core Engine',
              'price': '400',
              'priceCurrency': 'USD',
              'url': 'https://prateeq.in/scoping?engine=landing',
            },
            {
              '@type': 'Offer',
              'name': 'Multi-Page Web App Core Engine',
              'price': '750',
              'priceCurrency': 'USD',
              'url': 'https://prateeq.in/scoping?engine=multipage',
            },
            {
              '@type': 'Offer',
              'name': 'Full-Stack SaaS MVP Core Engine',
              'price': '2400',
              'priceCurrency': 'USD',
              'url': 'https://prateeq.in/scoping?engine=saas',
            },
            {
              '@type': 'Offer',
              'name': 'AI Strategy & Architecture Audit',
              'price': '300',
              'priceCurrency': 'USD',
              'url': 'https://prateeq.in/scoping?goal=ai_strategy_consulting',
            },
          ],
        },
      },
      {
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'How does fixed-scope pricing in the Project Scoping Lab work?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Select your base architecture engine, feature modules, brand readiness, and optional maintenance plan to get an instant itemized quote in INR or USD with a downloadable PDF scope brief.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Do clients receive 100% intellectual property (IP) ownership?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Upon final milestone completion, 100% of the custom codebase, design tokens, and database schemas transfer irrevocably to the client.',
            },
          },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://prateeq.in' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Services', 'item': 'https://prateeq.in/services' },
          { '@type': 'ListItem', 'position': 3, 'name': 'Project Scoping Lab', 'item': 'https://prateeq.in/scoping' },
        ],
      },
    ],
  };

  return (
    <div className={styles.wrapper}>
      <script
        id="service-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <div className={styles.container}>
        <ScopingHeader />
        <SectionErrorBoundary sectionName="Scoping Lab Wizard">
          <IntakeForm resumeData={profile} initialPreset={preset} />
        </SectionErrorBoundary>
      </div>
    </div>
  );
}
