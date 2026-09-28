"use client";

import { useEffect } from "react";

interface FloatingChatWidgetProps {
  tenantId?: string;
  apiKey?: string;
  apiUrl?: string;
}

export function FloatingChatWidget({
  tenantId = process.env.NEXT_PUBLIC_RETRIEVER_SCOPING_TENANT_ID || "1f85286c-9d9a-4ebc-9c62-a99360a5ece4",
  apiKey = process.env.NEXT_PUBLIC_RETRIEVER_SCOPING_API_KEY || "ret_live_eae27a51db3b44ef81e16df59137eda7bcfdc987dc204d6bacb9db0089a7886a",
  apiUrl = process.env.NEXT_PUBLIC_RETRIEVER_API_URL || "https://rag.prateeq.in",
}: FloatingChatWidgetProps) {
  useEffect(() => {
    const scriptId = "retriever-floating-widget-script";
    const existingScript = document.getElementById(scriptId);
    if (existingScript) existingScript.remove();

    // Clean up any stale floating elements
    document.querySelectorAll(".retriever-widget-launcher").forEach((el) => el.remove());
    document.querySelectorAll(".retriever-widget-panel:not(.retriever-widget-inline)").forEach((el) => el.remove());

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `${apiUrl.replace(/\/$/, "")}/widget.js`;
    script.async = true;
    script.setAttribute("data-tenant", tenantId);
    script.setAttribute("data-key", apiKey);
    script.setAttribute("data-color", "#2563eb");
    script.setAttribute("data-title", "Retriever Concierge");
    script.setAttribute("data-position", "bottom-right");
    script.setAttribute("data-api-url", apiUrl);

    document.body.appendChild(script);

    return () => {
      const s = document.getElementById(scriptId);
      if (s) s.remove();
      document.querySelectorAll(".retriever-widget-launcher").forEach((el) => el.remove());
      document.querySelectorAll(".retriever-widget-panel:not(.retriever-widget-inline)").forEach((el) => el.remove());
    };
  }, [tenantId, apiKey, apiUrl]);

  return null;
}
