"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/components/rag/rag.module.css";

export default function RagLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      // Execute 1-click Google Auth token exchange with backend
      const res = await fetch("https://rag.prateeq.in/v1/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_token: "google_oidc_user_token",
          email: "user@example.com",
          name: "SaaS Subscriber",
        }),
      });

      if (!res.ok) throw new Error("Google authentication failed");
      const data = await res.json();

      // Store credentials in localStorage
      localStorage.setItem("retriever_tenant_id", data.tenantId);
      localStorage.setItem("retriever_user_id", data.userId);
      localStorage.setItem("retriever_api_key", data.apiKey);
      localStorage.setItem("retriever_jwt", data.jwtToken);

      // Redirect to App Workspace
      router.push("/rag/app");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestDemo = () => {
    localStorage.setItem("retriever_tenant_id", "00000000-0000-0000-0000-000000000000");
    localStorage.setItem("retriever_user_id", "00000000-0000-0000-0000-000000000001");
    localStorage.setItem("retriever_api_key", "ret_live_GuestAccessKey2026.ReadOnlyChat");
    router.push("/rag/app");
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚡</div>
        <h1 className={styles.authTitle}>Sign In to Retriever AI</h1>
        <p className={styles.authDesc}>
          Access your AI Knowledge Base, manage documents, and get your 1-line website embed script.
        </p>

        {error && <p className={styles.error} style={{ marginBottom: "1rem" }}>{error}</p>}

        <button
          className="comic-btn comic-btn-blue"
          style={{ width: "100%", justifyContent: "center", marginBottom: "1rem" }}
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? "Authenticating..." : "🔑 Sign in with Google"}
        </button>

        <div style={{ margin: "1.5rem 0", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
          ─── OR ───
        </div>

        <button
          className="comic-btn comic-btn-outline"
          style={{ width: "100%", justifyContent: "center", marginBottom: "1.5rem" }}
          onClick={handleGuestDemo}
        >
          🚀 Try Live Demo (No Login Required)
        </button>

        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
          Back to <Link href="/rag" style={{ color: "var(--color-link)" }}>Product Landing Page</Link>
        </p>
      </div>
    </div>
  );
}
