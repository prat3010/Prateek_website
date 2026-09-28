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

  it("injects script tag with tenant and api key attributes", () => {
    const { unmount } = render(
      <FloatingChatWidget
        tenantId="test-tenant-123"
        apiKey="ret_live_testkey"
        apiUrl="https://rag.prateeq.in"
      />
    );

    const script = document.getElementById("retriever-floating-widget-script") as HTMLScriptElement;
    expect(script).not.toBeNull();
    expect(script.getAttribute("data-tenant")).toBe("test-tenant-123");
    expect(script.getAttribute("data-key")).toBe("ret_live_testkey");
    expect(script.getAttribute("data-position")).toBe("bottom-right");
    expect(script.src).toContain("widget.js");

    unmount();
    expect(document.getElementById("retriever-floating-widget-script")).toBeNull();
  });
});
