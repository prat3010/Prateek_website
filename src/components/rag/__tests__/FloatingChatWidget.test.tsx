import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { FloatingChatWidget } from "../FloatingChatWidget";

describe("FloatingChatWidget Component", () => {
  beforeEach(() => {
    document.querySelectorAll("#retriever-floating-widget-script").forEach((s) => s.remove());
  });

  afterEach(() => {
    document.querySelectorAll("#retriever-floating-widget-script").forEach((s) => s.remove());
  });

  it("injects a guest widget script with no browser API key", () => {
    const { unmount } = render(
      <FloatingChatWidget
        widgetOrigin="https://rag.prateeq.in"
        proxyPath="/api/rag/guest"
      />
    );

    const script = document.getElementById("retriever-floating-widget-script") as HTMLScriptElement;
    expect(script).not.toBeNull();
    expect(script.getAttribute("data-tenant")).toBe("guest");
    expect(script.getAttribute("data-key")).toBeNull();
    expect(script.getAttribute("data-api-url")).toBe("/api/rag/guest");
    expect(script.getAttribute("data-position")).toBe("bottom-right");
    expect(script.src).toContain("widget.js");

    unmount();
    expect(document.getElementById("retriever-floating-widget-script")).toBeNull();
  });
});
