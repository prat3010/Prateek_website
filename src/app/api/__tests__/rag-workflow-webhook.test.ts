import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as POSTWorkflowWebhook } from '@/app/api/rag/workflow-webhook/route';
import crypto from 'crypto';

describe('POST /api/rag/workflow-webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.RETRIEVER_WEBHOOK_SECRET;
  });

  it('rejects empty payload with 400', async () => {
    const req = new Request('http://localhost/api/rag/workflow-webhook', {
      method: 'POST',
      body: '',
    });
    const res = await POSTWorkflowWebhook(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Empty payload');
  });

  it('rejects invalid HMAC signature when secret is set', async () => {
    process.env.RETRIEVER_WEBHOOK_SECRET = 'test_secret_key';
    const body = JSON.stringify({
      event: 'workflow.completed',
      execution_id: 'exec_001',
      tenant_id: 'tenant_test',
      workflow_name: 'vault_bulk_ingest',
      status: 'completed',
      total_steps: 3,
      completed_steps: 3,
    });

    const req = new Request('http://localhost/api/rag/workflow-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-workflow-signature-256': 'sha256=invalid_hex_hash',
      },
      body,
    });

    const res = await POSTWorkflowWebhook(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Invalid HMAC signature');
  });

  it('processes valid webhook with valid HMAC signature', async () => {
    process.env.RETRIEVER_WEBHOOK_SECRET = 'test_secret_key';
    const body = JSON.stringify({
      event: 'workflow.completed',
      execution_id: 'exec_001',
      tenant_id: 'tenant_test',
      workflow_name: 'vault_bulk_ingest',
      status: 'completed',
      total_steps: 3,
      completed_steps: 3,
    });

    const signature =
      'sha256=' +
      crypto.createHmac('sha256', 'test_secret_key').update(body).digest('hex');

    const req = new Request('http://localhost/api/rag/workflow-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-workflow-signature-256': signature,
      },
      body,
    });

    const res = await POSTWorkflowWebhook(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
    expect(data.execution_id).toBe('exec_001');
    expect(data.status).toBe('completed');
  });

  it('rejects payload missing required fields with 400', async () => {
    const body = JSON.stringify({
      event: 'workflow.completed',
      // missing execution_id and tenant_id
      status: 'completed',
    });

    const req = new Request('http://localhost/api/rag/workflow-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const res = await POSTWorkflowWebhook(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Missing required webhook fields');
  });
});
