import { NextResponse } from 'next/server';
import crypto from 'crypto';

interface WorkflowWebhookPayload {
  event: string;
  execution_id: string;
  tenant_id: string;
  workflow_name: string;
  status: string;
  total_steps: number;
  completed_steps: number;
  output_payload?: Record<string, unknown>;
  error_message?: string | null;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 });
    }

    const secret = process.env.RETRIEVER_WEBHOOK_SECRET;
    const signature = req.headers.get('x-workflow-signature-256');

    if (secret && signature) {
      const computed = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      if (computed !== signature) {
        return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
      }
    }

    const payload: WorkflowWebhookPayload = JSON.parse(rawBody);

    if (!payload.execution_id || !payload.tenant_id || !payload.status) {
      return NextResponse.json({ error: 'Missing required webhook fields' }, { status: 400 });
    }

    console.info(
      `[Durable Workflow Webhook] Received ${payload.event} for ${payload.workflow_name} (${payload.execution_id}), status=${payload.status}`
    );

    return NextResponse.json({
      received: true,
      execution_id: payload.execution_id,
      tenant_id: payload.tenant_id,
      status: payload.status,
      completed_steps: payload.completed_steps,
    });
  } catch (err: unknown) {
    console.error('[Durable Workflow Webhook] Processing error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal webhook error' },
      { status: 500 }
    );
  }
}
