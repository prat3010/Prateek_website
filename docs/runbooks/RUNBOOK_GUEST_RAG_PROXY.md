# Runbook: Guest RAG Proxy and Key Rotation

Use this runbook when deploying the server-side guest proxy or rotating the Retriever key that was previously shipped to browsers.

## Architecture

- Public `/rag` previews call `/api/rag/guest/*` on `prateeq.in`.
- The proxy injects `RETRIEVER_GUEST_API_KEY` (or `RETRIEVER_SCOPING_API_KEY` when no dedicated guest key is set) and `RETRIEVER_GUEST_USER_ID` (or `RETRIEVER_SCOPING_USER_ID`).
- `/rag/app` is login-only and no longer uses a guest showroom tenant.
- The old browser-exposed keys must be revoked after the proxy is live.

## 1. Deploy the proxy first

Deploy the website and confirm these checks before rotating:

```sh
curl -sS -X POST https://prateeq.in/api/rag/guest/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"What are the payment terms?","limit":2}'
```

Expect `200` with search results. Then open `/rag` and send a widget message. The browser network tab must show requests to `/api/rag/guest/v1/tenants/guest/...`, not `rag.prateeq.in` and not an `Authorization` header containing `ret_live_`.

## 2. Create a replacement key

Choose the tenant used by `RETRIEVER_GUEST_TENANT_ID` (or `RETRIEVER_SCOPING_TENANT_ID`). Using the Retriever admin API:

```sh
export RETRIEVER_ADMIN_KEY='...'   # from the password manager, never commit it
export TENANT_ID='...'

curl -sS -X POST "https://rag.prateeq.in/v1/admin/tenants/$TENANT_ID/api-keys" \
  -H "X-Admin-Master-Key: $RETRIEVER_ADMIN_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Guest RAG Proxy 2026-10","role":"client"}'
```

Store the returned `apiKey` and `keyId` in the password manager.

## 3. Update server-side configuration

Provision the guest identity first. `RETRIEVER_GUEST_USER_ID` must be the UUID of a real `users` row in the guest tenant; Retriever rejects unknown UUIDs when persisting chat sessions and messages. Create a dedicated row so guest traffic is not attributed to a real account:

```sql
BEGIN;
SET LOCAL app.current_tenant_id = '<guest-tenant-uuid>';
INSERT INTO users (user_id, tenant_id, external_id, display_name, is_active, created_at)
VALUES (gen_random_uuid(), '<guest-tenant-uuid>', 'guest.rag.proxy@guest.local', 'Guest RAG Proxy', true, now())
ON CONFLICT (tenant_id, external_id) DO UPDATE SET is_active = true
RETURNING user_id;
COMMIT;
```

If `RETRIEVER_GUEST_USER_ID` is omitted, the proxy reuses `RETRIEVER_SCOPING_USER_ID`.

Update these values in Vercel Production and Preview:

- `RETRIEVER_GUEST_API_KEY` = new key
- `RETRIEVER_GUEST_USER_ID` = guest user UUID (optional if reusing scoping identity)
- `RETRIEVER_SCOPING_API_KEY` = new key (if the scoping tenant shares the key)

Also update local `.env.local` and, on the Oracle VM, `/etc/retriever-warmup.env`:

```sh
ssh -i ~/.ssh/oracle_rsa ubuntu@<VM_IP>
sudo sed -i 's/^WARMUP_API_KEY=.*/WARMUP_API_KEY=<new-key>/' /etc/retriever-warmup.env
sudo systemctl start retriever-warmup.service
```

Redeploy the website so the new environment values are active.

## 4. Verify before revoking

```sh
curl -sS -X POST https://prateeq.in/api/rag/guest/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"How does pgvector hybrid search work?","limit":2}'

curl -sS -N -X POST https://prateeq.in/api/scoping/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Build a private AI knowledge base"}'
```

Both should succeed. Verify the VM timer:

```sh
systemctl list-timers retriever-warmup.timer
sudo journalctl -u retriever-warmup.service -n 20 --no-pager
```

The public canary reports `200` only when every configured warm-up tenant succeeds. It returns `503` when any configured target fails, even if another target warmed, and includes `warmed`, `failed`, and `skipped` counts. A `503` with `skipped` targets means that tenant's env vars are absent; a `503` with `failed` targets means Retriever returned an error or timed out.

## 5. Rate limiting caveat

`/api/rag/guest/*` uses the shared limiter in `src/lib/rateLimit.ts`. When `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_*`) are absent, it falls back to a per-instance in-memory window. That still bounds abuse on a single function instance but is not globally consistent across Vercel instances. Configure Upstash before relying on strict global quotas.

## 6. Revoke the old keys

List keys, then revoke the old browser-exposed keys:

```sh
curl -sS "https://rag.prateeq.in/v1/admin/tenants/$TENANT_ID/api-keys" \
  -H "X-Admin-Master-Key: $RETRIEVER_ADMIN_KEY"

curl -sS -X DELETE "https://rag.prateeq.in/v1/admin/tenants/$TENANT_ID/api-keys/<old-key-id>" \
  -H "X-Admin-Master-Key: $RETRIEVER_ADMIN_KEY"
```

Revoke every old key that contained a browser-exposed value, including the former scoping guest key and the former showroom key. Revoking is immediate; do this only after step 4 passes.

## 7. Remove public secret variables

In Vercel, delete:

- `NEXT_PUBLIC_RETRIEVER_SCOPING_API_KEY`
- `NEXT_PUBLIC_RETRIEVER_SCOPING_USER_ID`
- `NEXT_PUBLIC_RETRIEVER_SCOPING_TENANT_ID` (tenant IDs are not secrets, but the proxy no longer needs it)
- `NEXT_PUBLIC_RETRIEVER_PORTFOLIO_TENANT_ID` (if unused)

Remove the same lines from `.env.local`. Redeploy production.

## 8. Confirm no key reaches the browser

```sh
curl -sS https://prateeq.in/rag > /tmp/rag.html
grep -oE 'ret_live_[A-Za-z0-9._-]+' /tmp/rag.html || true
```

Also inspect the generated `/_next/static/chunks/*.js` files for `ret_live_` and for `NEXT_PUBLIC_RETRIEVER_SCOPING_API_KEY`. No guest key should appear.
