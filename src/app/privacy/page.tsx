import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import styles from './privacy.module.css';

export const metadata: Metadata = {
  title: 'Privacy & Telemetry Policy | Prateeq Sharma',
  description:
    'Information on privacy commitments, GDPR-compliant SHA-256 IP hashing telemetry, and data processing practices at prateeq.in.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Return to Base</span>
          </Link>
          <h1 className={styles.title}>Privacy &amp; Telemetry Policy</h1>
          <p className={styles.subtitle}>Last updated: August 2026</p>
        </header>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Privacy Statement</h2>
            <p className={styles.text}>
              At <strong>prateeq.in</strong>, privacy is engineered into the system architecture. This site does not track individuals across the web, sell personal data to third parties, or run invasive third-party tracking scripts.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. GDPR-Compliant Telemetry</h2>
            <p className={styles.text}>
              To monitor site performance, geographic traffic density, and security health, anonymous page visits are logged server-side via Next.js proxy middleware:
            </p>
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                Daily SHA-256 IP Salt Hashing
              </div>
              <p className={styles.text} style={{ margin: 0, fontSize: '0.9rem' }}>
                Raw IP addresses are never stored in the database. Every incoming request IP is cryptographically hashed using a dynamic daily salt key before saving (`getIpHash`). Hashes automatically expire and rotate every 24 hours, preventing long-term visitor tracking while preserving accurate daily analytics metrics.
              </p>
            </div>
            <ul className={styles.list}>
              <li className={styles.listItem}><strong>Data Recorded:</strong> Page path visited, coarse country location (derived from Vercel edge headers), browser type, device type, and domain referrer.</li>
              <li className={styles.listItem}><strong>Bot &amp; Vulnerability Filtering:</strong> Automated crawlers, honeypot scanning bots, and malicious requests are discarded prior to database execution.</li>
              <li className={styles.listItem}><strong>Automatic Data Pruning:</strong> Telemetry visit logs are automatically pruned after 90 days.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Contact &amp; Client Data</h2>
            <p className={styles.text}>
              Information provided through the Contact form or Project Scoping Lab (name, email, scoping selections) is processed strictly to generate itemized proposals, respond to inquiries, or fulfill client development agreements.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Contact Information</h2>
            <p className={styles.text}>
              If you have any questions regarding privacy or telemetry architecture, reach out directly at{' '}
              <a href="mailto:prateeqsharma@gmail.com" style={{ color: 'var(--color-link)', textDecoration: 'underline' }}>
                prateeqsharma@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
