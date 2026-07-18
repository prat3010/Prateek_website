import type { Metadata } from 'next';
import RagInterface from '@/components/rag/RagInterface';

export const metadata: Metadata = {
  title: 'RAG Lab | Prateeq Sharma',
  description: 'Interactive RAG interface — search and chat with indexed documents using the Retriever engine.',
  alternates: {
    canonical: '/rag',
  },
};

export default function RagPage() {
  return (
    <section style={{ padding: '2rem 0' }}>
      <RagInterface />
    </section>
  );
}
