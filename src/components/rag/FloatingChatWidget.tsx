"use client";

import { useEffect } from "react";

const DEFAULT_WIDGET_ORIGIN = "https://rag.prateeq.in";
const DEFAULT_GUEST_PROXY_PATH = "/api/rag/guest";

interface FloatingChatWidgetProps {
  widgetOrigin?: string;
  proxyPath?: string;
}

export function FloatingChatWidget({
  widgetOrigin = process.env.NEXT_PUBLIC_RETRIEVER_API_URL || DEFAULT_WIDGET_ORIGIN,
  proxyPath = DEFAULT_GUEST_PROXY_PATH,
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
    script.src = `${widgetOrigin.replace(/\/$/, "")}/widget.js`;
    script.async = true;
    script.setAttribute("data-tenant", "guest");
    script.setAttribute("data-api-url", proxyPath);
    script.setAttribute("data-color", "#2563eb");
    script.setAttribute("data-title", "Retriever Concierge");
    script.setAttribute("data-position", "bottom-right");

    document.body.appendChild(script);

    return () => {
      const s = document.getElementById(scriptId);
      if (s) s.remove();
      document.querySelectorAll(".retriever-widget-launcher").forEach((el) => el.remove());
      document.querySelectorAll(".retriever-widget-panel:not(.retriever-widget-inline)").forEach((el) => el.remove());
    };
  }, [widgetOrigin, proxyPath]);

  return null;
}
