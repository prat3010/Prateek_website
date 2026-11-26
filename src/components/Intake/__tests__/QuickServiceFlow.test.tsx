import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { QuickServiceFlow } from '../QuickServiceFlow';
import type { QuickServiceItem } from '@/data/resume';

const mockQuickServices: QuickServiceItem[] = [
  {
    id: 'chatbot',
    label: 'AI Customer Support Chatbot',
    priceINR: 15000,
    priceUSD: 200,
    turnaround: '48 hours',
    category: 'ai',
    laymanDescription: 'Embed a 24/7 AI assistant trained on your docs.',
    techSpecs: 'Retriever RAG + Floating Widget',
  },
  {
    id: 'speed_optimization',
    label: 'Core Web Vitals Speed Boost',
    priceINR: 12000,
    priceUSD: 150,
    turnaround: '3 days',
    category: 'performance',
    laymanDescription: 'Optimize LCP, CLS, and image delivery.',
    techSpecs: 'Next.js Image + Edge Caching',
  },
  {
    id: 'payment_gateway',
    label: 'Stripe / Razorpay Integration',
    priceINR: 18000,
    priceUSD: 250,
    turnaround: '3 days',
    category: 'integration',
    laymanDescription: 'Accept cards and UPI with verified webhooks.',
    techSpecs: 'Razorpay Orders + HMAC Webhooks',
  },
];

describe('QuickServiceFlow Component', () => {
  it('tracks roving focus tabIndex across quick service cards and supports Arrow/Home/End keys', () => {
    const rafOriginal = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => {
      cb(0);
      return 0;
    };

    function Harness() {
      const [selected, setSelected] = React.useState<string[]>([]);
      const [activeId, setActiveId] = React.useState<string | null>(null);
      const [anchor, setAnchor] = React.useState<{ x: number; y: number } | null>(null);
      return (
        <QuickServiceFlow
          quickServices={mockQuickServices}
          selectedQuickServices={selected}
          setSelectedQuickServices={setSelected}
          quickStep={1}
          setQuickStep={vi.fn()}
          quickFormData={{
            companyName: '',
            contactEmail: '',
            contactPhone: '',
            siteUrl: '',
            additionalNotes: '',
            agreedToTerms: false,
          }}
          setQuickFormData={vi.fn()}
          selectedQuickCategory="all"
          setSelectedQuickCategory={vi.fn()}
          quickQuote={{ totalINR: 0, totalUSD: 0 }}
          currency="INR"
          user={null}
          submitting={false}
          generatingPdf={false}
          errorMsg=""
          activePopoverId={activeId}
          setActivePopoverId={setActiveId}
          popoverAnchor={anchor}
          setPopoverAnchor={setAnchor}
          onResetServiceType={vi.fn()}
          onQuickSubmit={vi.fn()}
          onQuickFastPass={vi.fn()}
          onDownloadPDF={vi.fn()}
          togglePopover={(_e, id) => {
            setActiveId(id);
            setAnchor({ x: 40, y: 80 });
          }}
        />
      );
    }

    try {
      render(<Harness />);
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBe(3);
      expect(checkboxes[0].getAttribute('tabindex')).toBe('0');
      expect(checkboxes[1].getAttribute('tabindex')).toBe('-1');

      checkboxes[0].focus();
      fireEvent.keyDown(checkboxes[0], { key: 'ArrowRight' });
      expect(document.activeElement).toBe(checkboxes[1]);
      expect(checkboxes[1].getAttribute('tabindex')).toBe('0');
      expect(checkboxes[0].getAttribute('tabindex')).toBe('-1');

      fireEvent.keyDown(checkboxes[1], { key: 'End' });
      expect(document.activeElement).toBe(checkboxes[2]);
      expect(checkboxes[2].getAttribute('tabindex')).toBe('0');

      fireEvent.keyDown(checkboxes[2], { key: 'Home' });
      expect(document.activeElement).toBe(checkboxes[0]);

      // Toggle selection with Space
      fireEvent.keyDown(checkboxes[0], { key: ' ' });
      expect(checkboxes[0].getAttribute('aria-checked')).toBe('true');

      // Popover opens with dialog semantics and returns focus to triggering (i) button
      const infoBtn = screen.getByRole('button', {
        name: /Details for AI Customer Support Chatbot/i,
      });
      infoBtn.focus();
      fireEvent.click(infoBtn);
      expect(
        screen.getByRole('dialog', {
          name: /AI Customer Support Chatbot Technical Specifications/i,
        })
      ).toBeDefined();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(document.activeElement).toBe(infoBtn);
    } finally {
      window.requestAnimationFrame = rafOriginal;
    }
  });

  it('renders guest contact email & phone fields on Step 2 when unauthenticated, and hides them when signed in', () => {
    const baseProps = {
      quickServices: mockQuickServices,
      selectedQuickServices: ['chatbot'],
      setSelectedQuickServices: vi.fn(),
      quickStep: 2,
      setQuickStep: vi.fn(),
      quickFormData: {
        companyName: 'Acme',
        contactEmail: '',
        contactPhone: '',
        siteUrl: '',
        additionalNotes: '',
        agreedToTerms: true,
      },
      setQuickFormData: vi.fn(),
      selectedQuickCategory: 'all' as const,
      setSelectedQuickCategory: vi.fn(),
      quickQuote: { totalINR: 15000, totalUSD: 200 },
      currency: 'INR' as const,
      submitting: false,
      generatingPdf: false,
      errorMsg: '',
      activePopoverId: null,
      setActivePopoverId: vi.fn(),
      popoverAnchor: null,
      setPopoverAnchor: vi.fn(),
      onResetServiceType: vi.fn(),
      onQuickSubmit: vi.fn(),
      onQuickFastPass: vi.fn(),
      onDownloadPDF: vi.fn(),
      togglePopover: vi.fn(),
    };

    const { rerender } = render(
      <QuickServiceFlow
        {...baseProps}
        quickServices={[
          {
            ...mockQuickServices[0],
            label: '💬 AI Customer Support Chatbot',
          },
        ]}
        user={null}
      />
    );
    expect(screen.getByLabelText(/Contact Email/i)).toBeDefined();
    expect(screen.getByLabelText(/Contact Phone \/ WhatsApp/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /1-CLICK GOOGLE FAST-PASS/i })).toBeDefined();
    const summaryCell = screen.getByText('AI Customer Support Chatbot');
    expect(summaryCell.textContent).not.toContain('💬');

    rerender(
      <QuickServiceFlow
        {...baseProps}
        user={{ email: 'signed@in.dev' } as unknown as User}
      />
    );
    expect(screen.queryByLabelText(/Contact Email/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /1-CLICK GOOGLE FAST-PASS/i })).toBeNull();
  });
});
