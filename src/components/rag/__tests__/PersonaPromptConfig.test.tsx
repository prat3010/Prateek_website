import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { email: "test@example.com" },
    loading: false,
    getAccessToken: vi.fn().mockResolvedValue("test-token"),
  }),
}));

import { ConfigPanel } from "../ConfigPanel";
import type { RetrieverClient } from "@/lib/rag-client";

describe("PersonaPromptConfig in ConfigPanel (Phase 8)", () => {
  const mockGetSystemPrompt = vi.fn();
  const mockUpdateSystemPrompt = vi.fn();
  const mockOnSave = vi.fn();
  const mockOnClear = vi.fn();

  const mockClient = {
    tenantId: "test-tenant-123",
    getSystemPrompt: mockGetSystemPrompt,
    updateSystemPrompt: mockUpdateSystemPrompt,
  } as unknown as RetrieverClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and renders an unlocked system prompt", async () => {
    mockGetSystemPrompt.mockResolvedValueOnce({
      name: "default",
      content: "Custom system prompt for testing.",
      isSystemPrompt: true,
      isLocked: false,
    });

    render(
      <ConfigPanel
        config={{
          apiUrl: "https://rag.prateeq.in",
          tenantId: "test-tenant-123",
          apiKey: "test-key",
          userId: "test-user-id",
        }}
        onSave={mockOnSave}
        onClear={mockOnClear}
        hidden={false}
        client={mockClient}
      />
    );

    expect(screen.getByText(/AI Persona & Master System Prompt/)).toBeInTheDocument();

    await waitFor(() => {
      const textarea = screen.getByLabelText("Master System Prompt Instructions") as HTMLTextAreaElement;
      expect(textarea.value).toBe("Custom system prompt for testing.");
      expect(textarea.disabled).toBe(false);
    });

    // Verify lock badge is not present
    expect(screen.queryByText("Enterprise Policy Locked")).not.toBeInTheDocument();
  });

  it("applies a persona preset on button click", async () => {
    mockGetSystemPrompt.mockResolvedValueOnce({
      name: "default",
      content: "Initial prompt",
      isSystemPrompt: true,
      isLocked: false,
    });

    render(
      <ConfigPanel
        config={{
          apiUrl: "https://rag.prateeq.in",
          tenantId: "test-tenant-123",
          apiKey: "test-key",
          userId: "test-user-id",
        }}
        onSave={mockOnSave}
        onClear={mockOnClear}
        hidden={false}
        client={mockClient}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Master System Prompt Instructions")).toBeInTheDocument();
    });

    const ecommerceBtn = screen.getByText("🛒 E-Commerce & Customer Care");
    fireEvent.click(ecommerceBtn);

    const textarea = screen.getByLabelText("Master System Prompt Instructions") as HTMLTextAreaElement;
    expect(textarea.value).toContain("warm, helpful customer support specialist");
  });

  it("successfully updates system prompt when saving", async () => {
    mockGetSystemPrompt.mockResolvedValueOnce({
      name: "default",
      content: "Initial prompt",
      isSystemPrompt: true,
      isLocked: false,
    });

    mockUpdateSystemPrompt.mockResolvedValueOnce({
      name: "default",
      content: "Brand new system prompt",
      isSystemPrompt: true,
      isLocked: false,
    });

    render(
      <ConfigPanel
        config={{
          apiUrl: "https://rag.prateeq.in",
          tenantId: "test-tenant-123",
          apiKey: "test-key",
          userId: "test-user-id",
        }}
        onSave={mockOnSave}
        onClear={mockOnClear}
        hidden={false}
        client={mockClient}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Master System Prompt Instructions")).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText("Master System Prompt Instructions") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Brand new system prompt" } });

    const saveBtn = screen.getByText("Save AI Persona");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateSystemPrompt).toHaveBeenCalledWith("Brand new system prompt");
      expect(screen.getByText(/AI Persona saved successfully!/)).toBeInTheDocument();
    });
  });

  it("enforces Enterprise Governance Policy Lock (read-only and alert banner)", async () => {
    mockGetSystemPrompt.mockResolvedValueOnce({
      name: "default",
      content: "Strict compliance prompt locked by admin.",
      isSystemPrompt: true,
      isLocked: true,
    });

    render(
      <ConfigPanel
        config={{
          apiUrl: "https://rag.prateeq.in",
          tenantId: "test-tenant-123",
          apiKey: "test-key",
          userId: "test-user-id",
        }}
        onSave={mockOnSave}
        onClear={mockOnClear}
        hidden={false}
        client={mockClient}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Enterprise Policy Locked")).toBeInTheDocument();
    });

    // Alert banner displayed
    expect(screen.getByText("Centrally Managed Enterprise Policy:")).toBeInTheDocument();

    // Textarea is disabled
    const textarea = screen.getByLabelText("Master System Prompt Instructions") as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);

    // Save button is disabled
    const saveBtn = screen.getByText("Save AI Persona") as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);

    // Preset buttons are disabled
    const ecommerceBtn = screen.getByText("🛒 E-Commerce & Customer Care").closest("button") as HTMLButtonElement;
    expect(ecommerceBtn.disabled).toBe(true);
  });
});
