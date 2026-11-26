import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Client Workspace | Prateeq Sharma',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
