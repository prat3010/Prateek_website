import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMock = vi.fn();

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = {
      send: sendMock,
    };
  },
}));

import {
  sendClientMilestoneStageAdvancedNotification,
  sendClientChangeOrderUpdateNotification,
  sendFinalBalanceSettlementNotifications,
  sendAdminSignupNotification,
  sendAdminIntakeLeadNotification,
  sendAdminScopeSavedNotification,
  sendPaymentConfirmationNotifications,
  sendAdminChangeOrderNotification,
  sendAdminOnboardingCompletedNotification,
} from '@/lib/emailNotification';

describe('emailNotification service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('RESEND_API_KEY', 're_test_key_12345');
    vi.stubEnv('CONTACT_EMAIL_TO', 'prateek@test.com');
    sendMock.mockResolvedValue({ data: { id: 'email_msg_123' }, error: null });
  });

  describe('sendClientMilestoneStageAdvancedNotification', () => {
    it('returns false when RESEND_API_KEY is missing', async () => {
      vi.stubEnv('RESEND_API_KEY', '');
      const result = await sendClientMilestoneStageAdvancedNotification({
        clientEmail: 'client@acme.com',
        companyName: 'Acme Corp',
        scopeCode: 'SCOPE-101',
        newStage: 'engineering',
      });
      expect(result).toBe(false);
      expect(sendMock).not.toHaveBeenCalled();
    });

    it('returns false when clientEmail is invalid', async () => {
      const result = await sendClientMilestoneStageAdvancedNotification({
        clientEmail: 'invalid-email',
        companyName: 'Acme Corp',
        scopeCode: 'SCOPE-101',
        newStage: 'engineering',
      });
      expect(result).toBe(false);
      expect(sendMock).not.toHaveBeenCalled();
    });

    it('sends engineering sprint commenced email with azure badge', async () => {
      const result = await sendClientMilestoneStageAdvancedNotification({
        clientEmail: 'founder@startup.io',
        clientName: 'Sarah Connor',
        companyName: 'Cyberdyne Systems',
        scopeCode: 'SCOPE-CYBER-01',
        newStage: 'engineering',
      });

      expect(result).toBe(true);
      expect(sendMock).toHaveBeenCalledTimes(1);
      const call = sendMock.mock.calls[0][0];
      expect(call.to).toBe('founder@startup.io');
      expect(call.subject).toContain('Engineering Sprint Started — Cyberdyne Systems (SCOPE-CYBER-01)');
      expect(call.html).toContain('SPRINT ACTIVE');
      expect(call.html).toContain('Sarah Connor');
      expect(call.html).toContain('SCOPE-CYBER-01');
    });

    it('sends staging preview ready alert with clickable staging URL', async () => {
      const result = await sendClientMilestoneStageAdvancedNotification({
        clientEmail: 'founder@startup.io',
        companyName: 'Cyberdyne Systems',
        scopeCode: 'SCOPE-CYBER-01',
        newStage: 'staging',
        stagingUrl: 'https://staging.cyberdyne.io',
        githubRepo: 'https://github.com/prateek/cyberdyne',
      });

      expect(result).toBe(true);
      const call = sendMock.mock.calls[0][0];
      expect(call.subject).toContain('Staging Preview Ready for Review');
      expect(call.html).toContain('READY FOR CLIENT REVIEW');
      expect(call.html).toContain('https://staging.cyberdyne.io');
      expect(call.html).toContain('https://github.com/prateek/cyberdyne');
    });

    it('sends production live alert with live website CTA', async () => {
      const result = await sendClientMilestoneStageAdvancedNotification({
        clientEmail: 'founder@startup.io',
        companyName: 'Cyberdyne Systems',
        scopeCode: 'SCOPE-CYBER-01',
        newStage: 'live',
        productionUrl: 'https://cyberdyne.io',
        customNotes: 'All DNS records and SSL certs are live and verified.',
      });

      expect(result).toBe(true);
      const call = sendMock.mock.calls[0][0];
      expect(call.subject).toContain('Production Deployment Live');
      expect(call.html).toContain('PRODUCTION LIVE');
      expect(call.html).toContain('https://cyberdyne.io');
      expect(call.html).toContain('All DNS records and SSL certs are live and verified.');
    });

    it('handles Resend API error cleanly without throwing', async () => {
      sendMock.mockResolvedValueOnce({ data: null, error: { message: 'Rate limit exceeded' } });
      const result = await sendClientMilestoneStageAdvancedNotification({
        clientEmail: 'founder@startup.io',
        companyName: 'Cyberdyne',
        scopeCode: 'SCOPE-01',
        newStage: 'staging',
      });
      expect(result).toBe(false);
    });
  });

  describe('sendClientChangeOrderUpdateNotification', () => {
    it('sends change order approved notification', async () => {
      const result = await sendClientChangeOrderUpdateNotification({
        clientEmail: 'client@example.com',
        clientName: 'Alex Mercer',
        companyName: 'Gentek Inc',
        scopeCode: 'SCOPE-GEN-1',
        changeOrderNumber: 'CO-SCOPE-GEN-1-01',
        action: 'approve',
        addedFeatures: ['AI Search Studio', 'RBAC Multi-Tenancy'],
        removedFeatures: [],
        priceDeltaINR: 35000,
        priceDeltaUSD: 450,
      });

      expect(result).toBe(true);
      expect(sendMock).toHaveBeenCalledTimes(1);
      const call = sendMock.mock.calls[0][0];
      expect(call.to).toBe('client@example.com');
      expect(call.subject).toContain('✅ Change Order Approved: CO-SCOPE-GEN-1-01 — Gentek Inc');
      expect(call.html).toContain('CHANGE ORDER APPROVED');
      expect(call.html).toContain('AI Search Studio');
      expect(call.html).toContain('Alex Mercer');
      expect(call.html).toContain('₹35,000');
    });

    it('sends change order declined notification on reject', async () => {
      const result = await sendClientChangeOrderUpdateNotification({
        clientEmail: 'client@example.com',
        companyName: 'Gentek Inc',
        scopeCode: 'SCOPE-GEN-1',
        changeOrderNumber: 'CO-SCOPE-GEN-1-02',
        action: 'reject',
        addedFeatures: ['Unsupported Legacy DB Plugin'],
        removedFeatures: [],
      });

      expect(result).toBe(true);
      const call = sendMock.mock.calls[0][0];
      expect(call.subject).toContain('⚠️ Change Order Update: CO-SCOPE-GEN-1-02');
      expect(call.html).toContain('CHANGE ORDER DECLINED');
      expect(call.html).toContain('cancelled with zero balance due');
    });

    it('sends change order settled & merged notification on mark_paid', async () => {
      const result = await sendClientChangeOrderUpdateNotification({
        clientEmail: 'client@example.com',
        companyName: 'Gentek Inc',
        scopeCode: 'SCOPE-GEN-1',
        changeOrderNumber: 'CO-SCOPE-GEN-1-01',
        action: 'mark_paid',
        addedFeatures: ['Advanced Security Audit'],
        priceDeltaINR: 20000,
        priceDeltaUSD: 250,
      });

      expect(result).toBe(true);
      const call = sendMock.mock.calls[0][0];
      expect(call.subject).toContain('🎉 Change Order Settled: CO-SCOPE-GEN-1-01');
      expect(call.html).toContain('SETTLED & MERGED');
      expect(call.html).toContain('officially part of your project deliverable scope');
    });
  });

  describe('sendFinalBalanceSettlementNotifications', () => {
    it('sends both admin alert and client 100% zero-balance handover clearance', async () => {
      const result = await sendFinalBalanceSettlementNotifications({
        clientEmail: 'owner@apex.org',
        clientName: 'Marcus Aurelius',
        companyName: 'Apex Innovations',
        scopeCode: 'SCOPE-APEX-99',
        invoiceNumber: 'INV-APEX-99-FINAL',
        amount: 85000,
        currency: 'INR',
        paymentId: 'pay_rzp_settle_999',
        productionUrl: 'https://apex.org',
        githubRepo: 'https://github.com/apex/web',
        figmaUrl: 'https://figma.com/file/apex',
        maintenancePlan: 'Dedicated Retainer (20h/mo)',
      });

      expect(result.adminSent).toBe(true);
      expect(result.clientSent).toBe(true);
      expect(sendMock).toHaveBeenCalledTimes(2);

      // 1. Admin Alert Call
      const adminCall = sendMock.mock.calls[0][0];
      expect(adminCall.to).toBe('prateek@test.com');
      expect(adminCall.subject).toContain('Full Balance Settled: Apex Innovations (SCOPE-APEX-99) — Handover Due');
      expect(adminCall.html).toContain('100% REVENUE CAPTURED');
      expect(adminCall.html).toContain('₹85,000');
      expect(adminCall.html).toContain('Final Handover Action Items');

      // 2. Client Clearance Receipt Call
      const clientCall = sendMock.mock.calls[1][0];
      expect(clientCall.to).toBe('owner@apex.org');
      expect(clientCall.subject).toContain('🏆 Project Fully Settled & Handover Complete — Apex Innovations (SCOPE-APEX-99)');
      expect(clientCall.html).toContain('100% PAID — ZERO-BALANCE CLEARANCE');
      expect(clientCall.html).toContain('Commercial Intellectual Property Clearance');
      expect(clientCall.html).toContain('https://apex.org');
      expect(clientCall.html).toContain('Dedicated Retainer');
    });

    it('formats USD currency correctly on balance settlement', async () => {
      const result = await sendFinalBalanceSettlementNotifications({
        clientEmail: 'owner@usclient.com',
        companyName: 'US Systems',
        scopeCode: 'SCOPE-US-01',
        invoiceNumber: 'INV-US-01-FINAL',
        amount: 2500,
        currency: 'USD',
        paymentId: 'pay_usd_12345',
      });

      expect(result.adminSent).toBe(true);
      expect(result.clientSent).toBe(true);
      const clientCall = sendMock.mock.calls[1][0];
      expect(clientCall.html).toContain('$2,500');
    });

    it('returns false for both when client is not configured', async () => {
      vi.stubEnv('RESEND_API_KEY', '');
      const result = await sendFinalBalanceSettlementNotifications({
        clientEmail: 'owner@test.com',
        companyName: 'Test',
        scopeCode: 'SCOPE-01',
        invoiceNumber: 'INV-01',
        amount: 1000,
        currency: 'INR',
      });
      expect(result.adminSent).toBe(false);
      expect(result.clientSent).toBe(false);
    });
  });

  describe('Existing notifications integrity', () => {
    it('sendAdminSignupNotification formats and sends correctly', async () => {
      const res = await sendAdminSignupNotification({
        email: 'newuser@gmail.com',
        fullName: 'Jane Doe',
        provider: 'google',
      });
      expect(res).toBe(true);
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock.mock.calls[0][0].subject).toContain('New User Sign-Up Alert: newuser@gmail.com');
    });

    it('sendAdminIntakeLeadNotification formats and sends correctly', async () => {
      const res = await sendAdminIntakeLeadNotification({
        scopeCode: 'SCOPE-LEAD-01',
        companyName: 'Lead Corp',
        contactEmail: 'lead@corp.com',
        baseEngineTitle: 'SaaS Platform',
        totalCostINR: 120000,
        totalCostUSD: 1500,
      });
      expect(res).toBe(true);
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock.mock.calls[0][0].subject).toContain('New Intake Lead: Lead Corp (SCOPE-LEAD-01)');
    });

    it('sendAdminScopeSavedNotification formats and sends correctly', async () => {
      const res = await sendAdminScopeSavedNotification({
        scopeCode: 'SCOPE-SAVED-01',
        companyName: 'Saved Corp',
        clientEmail: 'client@saved.com',
        baseEngineTitle: 'Full-Stack Web Engine',
        totalCostINR: 95000,
        totalCostUSD: 1200,
      });
      expect(res).toBe(true);
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock.mock.calls[0][0].subject).toContain('Client Scope Confirmed: Saved Corp (SCOPE-SAVED-01)');
    });

    it('sendPaymentConfirmationNotifications sends both admin and client receipts', async () => {
      const res = await sendPaymentConfirmationNotifications({
        clientEmail: 'payer@company.com',
        clientName: 'John Payer',
        projectName: 'Company Inc',
        scopeCode: 'SCOPE-PAY-01',
        amount: 45000,
        currency: 'INR',
        paymentId: 'pay_rzp_deposit_001',
      });
      expect(res).toBe(true);
      expect(sendMock).toHaveBeenCalledTimes(2);
    });

    it('sendAdminChangeOrderNotification alerts admin on client submission', async () => {
      const res = await sendAdminChangeOrderNotification({
        changeOrderNumber: 'CO-01',
        scopeCode: 'SCOPE-01',
        companyName: 'Client Co',
        clientEmail: 'client@co.com',
        addedFeatures: ['Feature A'],
        removedFeatures: [],
        priceDeltaINR: 15000,
        priceDeltaUSD: 200,
      });
      expect(res).toBe(true);
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock.mock.calls[0][0].subject).toContain('Change Order Submitted: CO-01 (Client Co)');
    });

    it('sendAdminOnboardingCompletedNotification notifies admin on 100% checklist', async () => {
      const res = await sendAdminOnboardingCompletedNotification({
        scopeCode: 'SCOPE-01',
        companyName: 'Client Co',
        clientEmail: 'client@co.com',
        checklistSummary: 'brand_assets_uploaded: true\ndomain_dns_ready: true',
      });
      expect(res).toBe(true);
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock.mock.calls[0][0].subject).toContain('Onboarding Checklist 100% Complete');
    });
  });
});
