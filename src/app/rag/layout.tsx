import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Retriever AI — Enterprise Hybrid RAG Engine | 1-Line Embed Chatbot",
  description:
    "Turn your documents and website into a self-aware, hallucination-free AI assistant in 60 seconds. Powered by Gemini, local Ollama, pgvector HNSW, and BM25 hybrid search.",
  keywords: [
    "Enterprise RAG Platform",
    "1-Line AI Chatbot Embed",
    "pgvector Hybrid Search",
    "Private AI Knowledge Base",
    "Local Ollama Embeddings",
    "Multi-Tenant RAG PostgreSQL RLS",
    "Retriever AI",
    "Prateeq Sharma",
  ],
  alternates: {
    canonical: "/rag",
  },
  openGraph: {
    title: "Retriever AI — Enterprise Hybrid RAG Engine",
    description:
      "Embed a self-aware AI chatbot onto any website with 1 line of script. Features presigned citation downloads, semantic caching, and rule-based guardrails.",
    url: "https://prateeq.in/rag",
    siteName: "Prateeq Sharma Portfolio & SaaS",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Retriever AI — Enterprise Hybrid RAG Engine",
    description:
      "Self-aware AI chatbot in 60 seconds. Powered by Gemini, Ollama & pgvector HNSW vector search.",
  },
};

const ragJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://prateeq.in/rag#software",
      "name": "Retriever AI",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, Cloud, Docker",
      "url": "https://prateeq.in/rag",
      "description":
        "Enterprise multi-tenant Hybrid RAG platform combining PostgreSQL pgvector HNSW, BM25 lexical search, local $0 Ollama embeddings, CRAG anti-hallucination guardrails, and a 1-line website chatbot embed.",
      "creator": {
        "@type": "Person",
        "name": "Prateeq Sharma",
        "url": "https://prateeq.in",
      },
      "offers": [
        {
          "@type": "Offer",
          "name": "Starter Plan",
          "price": "29",
          "priceCurrency": "USD",
          "description": "1 Workspace, 20 Documents (~50MB), 1,000 Chat Queries/month",
          "url": "https://prateeq.in/rag#pricing",
        },
        {
          "@type": "Offer",
          "name": "Pro Plan",
          "price": "79",
          "priceCurrency": "USD",
          "description": "5 Workspaces, 100 Documents (~500MB), 5,000 Chat Queries/month, Presigned Citation PDFs",
          "url": "https://prateeq.in/rag#pricing",
        },
        {
          "@type": "Offer",
          "name": "Business Plan",
          "price": "199",
          "priceCurrency": "USD",
          "description": "Unlimited Workspaces, 500 Documents (~2.5GB), 20,000 Chat Queries/month, Dedicated RLS & SLA",
          "url": "https://prateeq.in/rag#pricing",
        },
      ],
      "featureList": [
        "Hybrid pgvector HNSW + BM25 + Cohere Reranking",
        "PostgreSQL Row-Level Security (RLS) Multi-Tenancy",
        "Local Ollama nomic-embed-text ($0 embedding compute)",
        "CRAG Self-Aware Anti-Hallucination Guardrails",
        "1-Line Shadow DOM Website Script Embed",
        "Presigned Citation PDF Downloads",
      ],
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does Retriever AI prevent chatbot hallucinations?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Retriever AI uses Corrective RAG (CRAG) guardrails and hybrid pgvector HNSW + BM25 retrieval so queries unsupported by your ingested documents are rejected or grounded with verifiable chunk citations.",
          },
        },
        {
          "@type": "Question",
          "name": "How is multi-tenant data isolated in Retriever AI?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Every workspace, document chunk, and vector embedding is strictly scoped by tenant_id and enforced at the database engine level via PostgreSQL Row-Level Security (RLS).",
          },
        },
        {
          "@type": "Question",
          "name": "How fast can I embed Retriever AI on my website?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You can upload your PDFs or documentation and embed the Shadow DOM chat widget on any website using a single script tag in under 60 seconds.",
          },
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://prateeq.in" },
        { "@type": "ListItem", "position": 2, "name": "Retriever AI", "item": "https://prateeq.in/rag" },
      ],
    },
  ],
};

export default function RagLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ragJsonLd) }}
      />
      {children}
    </>
  );
}
