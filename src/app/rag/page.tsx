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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <a
          href="https://admin.rag.prateeq.in"
          target="_blank"
          rel="noopener noreferrer"
          className="comic-btn comic-btn-outline"
          style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem', textDecoration: 'none' }}
        >
          Admin
        </a>
      </div>
      <RagInterface />
    </section>
  );
}
