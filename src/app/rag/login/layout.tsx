import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — Retriever AI | Prateeq Sharma',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RagLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
