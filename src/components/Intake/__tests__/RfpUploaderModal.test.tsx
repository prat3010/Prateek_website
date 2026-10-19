import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { RfpUploaderModal } from '../RfpUploaderModal';
import { toast } from 'sonner';

describe('RfpUploaderModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <RfpUploaderModal
        isOpen={false}
        onClose={vi.fn()}
        onBlueprintExtracted={vi.fn()}
        currency="USD"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title, dropzone, and action buttons when isOpen is true', () => {
    render(
      <RfpUploaderModal
        isOpen={true}
        onClose={vi.fn()}
        onBlueprintExtracted={vi.fn()}
        currency="USD"
      />
    );

    expect(screen.getByRole('dialog', { name: /Multimodal RFP \/ PRD Parser/i })).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop your RFP, PRD, or Architecture Doc here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Parse & Generate Blueprint/i })).toBeDisabled();
  });

  it('rejects unsupported file extensions with error toast', () => {
    render(
      <RfpUploaderModal
        isOpen={true}
        onClose={vi.fn()}
        onBlueprintExtracted={vi.fn()}
        currency="INR"
      />
    );

    const input = screen.getByLabelText(/Upload RFP or project brief document/i);
    const invalidFile = new File(['content'], 'image.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Supported formats: PDF, DOCX, Markdown (.md), or Plain Text (.txt)')
    );
  });

  it('rejects files larger than 25MB with error toast', () => {
    render(
      <RfpUploaderModal
        isOpen={true}
        onClose={vi.fn()}
        onBlueprintExtracted={vi.fn()}
        currency="INR"
      />
    );

    const input = screen.getByLabelText(/Upload RFP or project brief document/i);
    const hugeFile = new File(['a'.repeat(100)], 'huge.pdf', { type: 'application/pdf' });
    Object.defineProperty(hugeFile, 'size', { value: 30 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [hugeFile] } });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('File exceeds 25MB limit')
    );
  });

  it('accepts valid PDF file and enables the parse button', () => {
    render(
      <RfpUploaderModal
        isOpen={true}
        onClose={vi.fn()}
        onBlueprintExtracted={vi.fn()}
        currency="USD"
      />
    );

    const input = screen.getByLabelText(/Upload RFP or project brief document/i);
    const validFile = new File(['# Technical Brief'], 'spec.md', { type: 'text/markdown' });

    fireEvent.change(input, { target: { files: [validFile] } });

    expect(screen.getByText('spec.md')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Parse & Generate Blueprint/i })).not.toBeDisabled();
  });

  it('submits file to /api/scoping/parse-rfp and calls onBlueprintExtracted on success', async () => {
    const onExtract = vi.fn();
    const onClose = vi.fn();

    const mockBlueprint = {
      success: true,
      archetypeId: 'ai_rag_app',
      baseEngineId: 'saas',
      featureIds: ['ai_rag', 'auth'],
      confidenceScore: 0.98,
      summaryRationale: 'Enterprise RAG knowledge base extracted',
      telemetry: {
        latencyMs: 120,
        modelUsed: 'meta-llama/llama-3.3-70b-instruct',
        fallbackMode: false,
      },
    };

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBlueprint,
    });

    try {
      render(
        <RfpUploaderModal
          isOpen={true}
          onClose={onClose}
          onBlueprintExtracted={onExtract}
          currency="USD"
        />
      );

      const input = screen.getByLabelText(/Upload RFP or project brief document/i);
      const validFile = new File(['# Technical Brief'], 'spec.md', { type: 'text/markdown' });
      fireEvent.change(input, { target: { files: [validFile] } });

      const submitBtn = screen.getByRole('button', { name: /Parse & Generate Blueprint/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(onExtract).toHaveBeenCalledWith(mockBlueprint);
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('98% Match via meta-llama/llama-3.3-70b-instruct in 120ms'),
        expect.any(Object)
      );
      expect(onClose).toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('prevents backdrop click and escape dismissal while upload is in progress', async () => {
    const onClose = vi.fn();

    // Create a fetch promise that never resolves during the test
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    try {
      render(
        <RfpUploaderModal
          isOpen={true}
          onClose={onClose}
          onBlueprintExtracted={vi.fn()}
          currency="USD"
        />
      );

      const input = screen.getByLabelText(/Upload RFP or project brief document/i);
      const validFile = new File(['# Technical Brief'], 'spec.md', { type: 'text/markdown' });
      fireEvent.change(input, { target: { files: [validFile] } });

      const submitBtn = screen.getByRole('button', { name: /Parse & Generate Blueprint/i });
      fireEvent.click(submitBtn);

      // Verify progress status appears
      expect(screen.getByText(/Reading and preparing document.../i)).toBeInTheDocument();

      // Press Escape - should NOT trigger onClose
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();

      // Click backdrop - should NOT trigger onClose
      const backdrop = screen.getByRole('dialog', { name: /Multimodal RFP \/ PRD Parser/i });
      fireEvent.click(backdrop);
      expect(onClose).not.toHaveBeenCalled();

      // Close button should be disabled
      const closeBtn = screen.getByRole('button', { name: /Close RFP uploader modal/i });
      expect(closeBtn).toBeDisabled();
    } finally {
      global.fetch = originalFetch;
    }
  });
});
