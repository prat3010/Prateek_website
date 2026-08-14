import type { ClientScope } from '@/lib/clientOrder';
import { formatMoney, type Currency } from '@/lib/pricing';

export type ChecklistCategory = 'financial' | 'design' | 'technical' | 'governance';

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: ChecklistCategory;
  isMandatory: boolean;
  actionLabel?: string;
  placeholder?: string;
  inputType?: 'checkbox' | 'text' | 'link' | 'payment';
}

export function generateOnboardingChecklist(scope: ClientScope): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const curr = (scope.currency === 'USD' ? 'USD' : 'INR') as Currency;
  const isUSD = curr === 'USD';
  const total = isUSD ? scope.total_cost_usd : scope.total_cost_inr;
  const fmt = (amt: number) => formatMoney(Math.round(amt), curr);

  const isThreePart = scope.payment_structure === '40/30/30';

  // 1. Financial Milestones
  if (isThreePart) {
    items.push(
      {
        id: 'deposit_upfront',
        title: `Pay 40% Upfront Architecture Deposit (${fmt(total * 0.4)})`,
        description: 'Initiates cloud architecture setup, repository creation, and core system design.',
        category: 'financial',
        isMandatory: true,
        inputType: 'payment',
        actionLabel: 'Pay Deposit',
      },
      {
        id: 'milestone_beta',
        title: `Pay 30% Beta Milestone Balance (${fmt(total * 0.3)})`,
        description: 'Due upon completion and demo sign-off of the UI/UX design system & core API endpoints.',
        category: 'financial',
        isMandatory: true,
        inputType: 'checkbox',
      },
      {
        id: 'balance_final',
        title: `Pay 30% Final Balance prior to Handover (${fmt(total * 0.3)})`,
        description: 'Due after QA testing approval and prior to production domain mapping.',
        category: 'financial',
        isMandatory: true,
        inputType: 'checkbox',
      }
    );
  } else {
    items.push(
      {
        id: 'deposit_upfront',
        title: `Pay 50% Upfront Development Deposit (${fmt(total * 0.5)})`,
        description: 'Locks build slot and initiates core full-stack engineering & architecture setup.',
        category: 'financial',
        isMandatory: true,
        inputType: 'payment',
        actionLabel: 'Pay Upfront Deposit',
      },
      {
        id: 'balance_final',
        title: `Pay 50% Final Balance prior to Handover (${fmt(total * 0.5)})`,
        description: 'Due after QA security audit completion and prior to production domain handover.',
        category: 'financial',
        isMandatory: true,
        inputType: 'checkbox',
      }
    );
  }

  // 2. Base Engine Infrastructure Tasks
  const engineLower = scope.base_engine.toLowerCase();
  const needsCloudSetup = scope.hosting_ownership === 'needs_setup' || scope.onboarding_checklist?.hosting_ownership === 'needs_setup';

  if (engineLower.includes('saas') || engineLower.includes('full-stack') || engineLower.includes('application')) {
    items.push({
      id: 'hosting_credentials',
      title: 'Provide Target Hosting & Cloud Environment Preferences',
      description: needsCloudSetup
        ? 'Setup support requested: Specify preferred cloud provider (Vercel, AWS, Cloudflare) and team admin email.'
        : 'Specify preferred hosting provider (Vercel, AWS, Cloudflare) and team admin email.',
      category: 'technical',
      isMandatory: false,
      inputType: 'text',
      placeholder: 'e.g. Vercel Team Org or AWS Account ID...',
    });
  } else {
    items.push({
      id: 'dns_access',
      title: 'Provide Domain & DNS Registrar Access Details',
      description: 'Domain name and DNS management access (Cloudflare / GoDaddy / Namecheap) for SSL setup.',
      category: 'technical',
      isMandatory: true,
      inputType: 'text',
      placeholder: 'Domain name (e.g. mycompany.com)...',
    });
  }

  // Corporate GST Invoicing Preference Task
  const isCorporateGst = scope.tax_invoicing_preference === 'corporate_gst' || scope.onboarding_checklist?.tax_invoicing_preference === 'corporate_gst';
  if (isCorporateGst) {
    items.push({
      id: 'gst_credentials',
      title: 'Provide Corporate GSTIN & Billing Address',
      description: '15-digit GSTIN number and registered legal address for GST-compliant invoicing.',
      category: 'financial',
      isMandatory: false,
      inputType: 'text',
      placeholder: 'e.g. 07AAAAA0000A1Z5...',
    });
  }

  // 3. Feature-Module Triggered Technical Credential Requests
  const featureString = (scope.features || []).join(' ').toLowerCase();

  if (featureString.includes('rag') || featureString.includes('ai') || featureString.includes('chatbot')) {
    items.push({
      id: 'ai_credentials',
      title: 'Upload Knowledge Base & Provide LLM API Key (OpenAI / Gemini)',
      description: 'Provide API tokens for Gemini or OpenAI and upload initial PDF/Doc files for vector indexing.',
      category: 'technical',
      isMandatory: true,
      inputType: 'text',
      placeholder: 'Paste GEMINI_API_KEY or OpenAI secret token...',
    });
  }

  if (featureString.includes('payment') || featureString.includes('stripe') || featureString.includes('razorpay')) {
    items.push({
      id: 'payment_credentials',
      title: 'Provide Merchant API Credentials (Stripe / Razorpay)',
      description: 'Stripe publishable/secret key pair or Razorpay Key ID & Key Secret for checkout integration.',
      category: 'technical',
      isMandatory: true,
      inputType: 'text',
      placeholder: 'Razorpay / Stripe Key ID & Webhook Secret...',
    });
  }

  if (featureString.includes('auth') || featureString.includes('oauth') || featureString.includes('login')) {
    items.push({
      id: 'oauth_credentials',
      title: 'Provide Google / GitHub OAuth Credentials',
      description: 'OAuth Client ID and Client Secret for single sign-on user authentication.',
      category: 'technical',
      isMandatory: false,
      inputType: 'text',
      placeholder: 'Google OAuth Client ID & Secret...',
    });
  }

  if (featureString.includes('cms') || featureString.includes('sanity') || featureString.includes('contentful')) {
    items.push({
      id: 'cms_access',
      title: 'Provide Headless CMS Admin Access',
      description: 'Invite developer email to Sanity, Contentful, or Strapi organization workspace.',
      category: 'technical',
      isMandatory: true,
      inputType: 'text',
      placeholder: 'CMS Project ID or Admin Invite URL...',
    });
  }

  if (featureString.includes('migration') || featureString.includes('legacy') || featureString.includes('database')) {
    items.push({
      id: 'legacy_migration_data',
      title: 'Provide Legacy Database Connection String or Anonymized Dump',
      description: 'Connection string or SQL/CSV dump file for automated data migration.',
      category: 'technical',
      isMandatory: true,
      inputType: 'text',
      placeholder: 'PostgreSQL / MySQL connection URI or Drive link...',
    });
  }

  // 4. Design & Brand Asset Tasks
  const brandAssetLower = (scope.brand_asset || '').toLowerCase();
  const designReadinessVal = scope.design_readiness || (scope.onboarding_checklist?.design_readiness as string) || '';

  if (brandAssetLower.includes('figma') || brandAssetLower.includes('specs') || designReadinessVal === 'figma_ready') {
    items.push({
      id: 'figma_access',
      title: 'Share Figma Design System & Vector Brand Icons',
      description: 'Provide edit/view access URL to your Figma design file and brand logo files.',
      category: 'design',
      isMandatory: true,
      inputType: 'link',
      placeholder: 'https://figma.com/file/...',
    });
  } else if (brandAssetLower.includes('wireframe') || designReadinessVal === 'wireframes_ready') {
    items.push({
      id: 'wireframe_signoff',
      title: 'Review & Sign Off on Wireframe Layout Structure',
      description: 'Confirm page hierarchy and content section order before visual UI design phase.',
      category: 'design',
      isMandatory: true,
      inputType: 'checkbox',
    });
  } else {
    items.push({
      id: 'brand_palette',
      title: 'Provide Brand Guidelines & Color Palette Selection',
      description: 'Upload primary brand colors, typography choices, and logo vector files.',
      category: 'design',
      isMandatory: true,
      inputType: 'text',
      placeholder: 'Hex codes (e.g. #0066FF, #0A0F1D) and brand guidelines link...',
    });
  }

  // 5. Governance & Kickoff
  items.push(
    {
      id: 'stakeholder_contact',
      title: 'Confirm Primary Project Stakeholder & Approver',
      description: 'Name, email, and phone of the single contact with final deliverable sign-off authority.',
      category: 'governance',
      isMandatory: true,
      inputType: 'text',
      placeholder: 'Full Name & Direct Phone / Email...',
    },
    {
      id: 'kickoff_call',
      title: 'Schedule 30-Minute Architecture & Discovery Kickoff Call',
      description: 'Align project team, confirm milestone target dates, and review architecture setup.',
      category: 'governance',
      isMandatory: true,
      inputType: 'checkbox',
      actionLabel: 'Book Kickoff Call',
    }
  );

  return items;
}

export function calcOnboardingReadiness(scope: ClientScope): { total: number; completed: number; percent: number } {
  const list = generateOnboardingChecklist(scope);
  const checklistState = scope.onboarding_checklist || {};

  let completedCount = 0;
  list.forEach((item) => {
    // Deposit paid automatically completes deposit item
    if (item.id === 'deposit_upfront' && scope.deposit_paid) {
      completedCount++;
      return;
    }

    const val = checklistState[item.id];
    if (typeof val === 'boolean' && val) {
      completedCount++;
    } else if (typeof val === 'string' && val.trim().length > 0) {
      completedCount++;
    }
  });

  const total = list.length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  return { total, completed: completedCount, percent };
}
