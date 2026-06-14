import type { Metadata } from 'next';
import SiteInfoConsole from '@/components/ui/SiteInfoConsole';

export const metadata: Metadata = {
  title: 'Site bluePrints & Diagnostics | Prateeq Sharma',
  description: 'Technical blueprints, specifications, and fun details about the website.',
};

export default function InfoPage() {
  return <SiteInfoConsole />;
}
