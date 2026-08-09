# **14. Razorpay Payment Gateway & Invoicing System**

## **Purpose**

This specification defines the architecture, endpoints, security safeguards, database schema, webhook infrastructure, and execution flows for the **Razorpay Payment Gateway & Invoicing Integration** in Prateek Sharma's portfolio website (`prateeq.in`).

The system enables clients to lock 50% upfront project deposits via Razorpay Standard Web Checkout, automatically registers invoice ledger entries in Supabase, and advances project delivery milestones upon payment signature verification.

---

## **System Architecture Overview**

```
                    ┌──────────────────────────────────────┐
                    │          Client Browser              │
                    │      (/dashboard Workspace)          │
                    └──────────┬────────────────┬──────────┘
                               │                │
             1. Create Order   │                │  3. Verify Payment
             (Authenticated)   │                │  (HMAC Signature)
                               ▼                ▼
     ┌──────────────────────────────┐      ┌──────────────────────────────┐
     │ /api/client/                 │      │ /api/client/                 │
     │ create-razorpay-order        │      │ verify-razorpay-payment      │
     └──────────────┬───────────────┘      └──────────────┬───────────────┘
                    │                                     │
                    │ 2. POST /v1/orders                  │ 4. Update Ledger
                    ▼                                     ▼
     ┌──────────────────────────────┐      ┌──────────────────────────────┐
     │      Razorpay API Gateway    │      │    Supabase Database         │
     │   (https://api.razorpay.com) │      │  • invoices                  │
     └──────────────┬───────────────┘      │  • client_scopes             │
                    │                      │  • client_orders             │
                    │ 5. Webhook           └──────────────▲───────────────┘
                    │    (payment.captured)               │
                    ▼                                     │
     ┌──────────────────────────────┐                     │
     │ /api/webhooks/razorpay       ├─────────────────────┘
     │ (Idempotent Webhook Handler) │ 6. Fail-Safe State Sync
     └──────────────────────────────┘
```

---

## **API Routes & Responsibilities**

### 1. **Order Creation Endpoint**: [`POST /api/client/create-razorpay-order`](file:///Users/prateeksharma/Developer/Prateek_website/src/app/api/client/create-razorpay-order/route.ts)

* **Authentication**: Requires valid Supabase session token via `Authorization: Bearer <token>` verified by [`getVerifiedSessionEmail`](file:///Users/prateeksharma/Developer/Prateek_website/src/lib/sessionVerify.ts).
* **Anti-Price Tampering**: Order cost is read strictly from the database (`client_scopes` / `client_orders` table) by `scopeCode`. The client cannot supply a custom payment amount.
* **Currency Conversion**: If the scope currency is `USD`, the amount is converted to `INR` at a fixed rate of `85` (`USD_TO_INR_RATE`) to ensure compatibility with domestic and international checkout cards.
* **Subunit Conversion**: Amount is converted to currency subunits (paise) by multiplying by `100` (`amountInSubunits = depositAmount * 100`).
* **Razorpay Orders API Request**: Sends an authenticated HTTP POST to `https://api.razorpay.com/v1/orders` using basic authentication (`NEXT_PUBLIC_RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`).
* **Invoice Record**: Inserts a `pending` invoice record into the `invoices` table (`invoice_number: INV-<8-HEX-CHARS>`, `milestone_name: 50% Scope Deposit & Development Lock`).
* **Response**: Returns `{ orderId, amount, currency: 'INR', keyId }`.

---

### 2. **Payment Verification Endpoint**: [`POST /api/client/verify-razorpay-payment`](file:///Users/prateeksharma/Developer/Prateek_website/src/app/api/client/verify-razorpay-payment/route.ts)

* **Authentication**: Session-gated via JWT bearer token.
* **Signature Verification**: Verifies Razorpay HMAC-SHA256 signature:
  ```ts
  const expectedSignature = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  ```
* **State Transition**:
  * Updates `invoices` record: `payment_status = 'paid'`, `paid_at = now()`, `razorpay_payment_id`.
  * Updates `client_scopes` record: `deposit_paid = true`, `delivery_stage = 'engineering'`, `status = 'Deposit Paid — In Development'`.

---

### 3. **Idempotent Webhook Handler**: [`POST /api/webhooks/razorpay`](file:///Users/prateeksharma/Developer/Prateek_website/src/app/api/webhooks/razorpay/route.ts)

* **Raw Body HMAC Validation**: Verifies HTTP header `x-razorpay-signature` against raw request body using `RAZORPAY_WEBHOOK_SECRET` (or `RAZORPAY_KEY_SECRET`).
* **Idempotency Control**: Checks `processed_webhooks` table by `event_id` before processing. Skips already processed events to prevent duplicate ledger updates.
* **Event Handlers**: Listens for `payment.captured` and `order.paid` to ensure project stage updates proceed even if the client closes their browser tab before client-side verification finishes.

---

## **Database Schema ([`supabase_schema.sql`](file:///Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql))**

### **`invoices` Table**

```sql
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  scope_id UUID REFERENCES client_scopes(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled', 'refunded')),
  razorpay_order_id TEXT DEFAULT '',
  razorpay_payment_id TEXT DEFAULT '',
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### **`processed_webhooks` Table**

```sql
CREATE TABLE IF NOT EXISTS processed_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## **Security & Compliance Controls**

1. **Row-Level Security (RLS)**:
   - `invoices` table has SELECT RLS enabled: clients can read only invoices belonging to their client ID (`auth.jwt() ->> 'email' = client_email`).
   - Writes to `invoices` and `processed_webhooks` are restricted strictly to server routes using `SUPABASE_SERVICE_ROLE_KEY`.
2. **Content Security Policy (CSP)**:
   - `next.config.ts` includes `https://checkout.razorpay.com`, `https://api.razorpay.com`, and `https://lumberjack.razorpay.com` across `script-src`, `style-src`, `img-src`, `connect-src`, and `frame-src`.
3. **Environment Variables**:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Public key for client modal initialization.
   - `RAZORPAY_KEY_SECRET`: Private secret for server authentication and HMAC signatures.
   - `RAZORPAY_WEBHOOK_SECRET`: Secret for webhook payload verification.

---

## **Automated Testing**

Unit and integration tests are maintained in [`src/app/api/__tests__/razorpay.test.ts`](file:///Users/prateeksharma/Developer/Prateek_website/src/app/api/__tests__/razorpay.test.ts):
- Authorization rejection (401 without Bearer token).
- Input validation (400 on missing scope code).
- Order creation & price lookup verification.
- HMAC signature mismatch rejection (400).
- Successful payment verification & DB milestone advance.
- Webhook signature validation & idempotency checks.
