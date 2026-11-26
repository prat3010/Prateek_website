import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Retriever AI Studio | Prateeq Sharma',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RagAppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
