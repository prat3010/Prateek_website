import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Retriever AI — Enterprise Hybrid RAG Engine | 1-Line Embed Chatbot",
  description:
    "Turn your documents and website into a self-aware, hallucination-free AI assistant in 60 seconds. Powered by Meta Llama 3.3 70B, pgvector HNSW, and BM25 hybrid search.",
  openGraph: {
    title: "Retriever AI — Enterprise Hybrid RAG Engine",
    description:
      "Embed a self-aware AI chatbot onto any website with 1 line of script. Features presigned citation downloads, sub-50ms semantic caching, and corrective guardrails.",
    url: "https://prateeq.in/rag",
    siteName: "Prateek Sharma Portfolio & SaaS",
    images: [
      {
        url: "https://prateeq.in/images/gremlin-head.png",
        width: 1200,
        height: 630,
        alt: "Retriever AI SaaS Product Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Retriever AI — Enterprise Hybrid RAG Engine",
    description:
      "Self-aware AI chatbot in 60 seconds. Powered by Llama 3.3 70B & pgvector HNSW vector search.",
    images: ["https://prateeq.in/images/gremlin-head.png"],
  },
};

export default function RagLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
