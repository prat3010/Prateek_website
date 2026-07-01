import type { Metadata } from 'next';
import SiteInfoConsole from '@/components/ui/SiteInfoConsole';

export const metadata: Metadata = {
  title: 'System Terminal & Diagnostics | Prateek Sharma',
  description: 'Technical blueprints, real-time diagnostics console, and commit journal.',
  alternates: {
    canonical: '/terminal',
  },
};

export default function TerminalPage() {
  return <SiteInfoConsole />;
}
