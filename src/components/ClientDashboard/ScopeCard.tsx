'use client';

import React from 'react';
import {
  CheckCircle2,
  Trash2,
  FileText,
  Sliders,
  Lock,
  Eye,
  Activity,
  Server,
  Clock,
  ExternalLink,
  CreditCard,
  ShieldCheck,
  Zap,
  Calendar,
} from 'lucide-react';

import type { ClientScope, ScopeChangeOrderEntity, ClientDeliveryStage } from '@/lib/clientOrder';
import NumberFlow from '@number-flow/react';
import styles from '@/app/dashboard/dashboard.module.css';

interface ScopeCardProps {
  scope: ClientScope;
  changeOrders: ScopeChangeOrderEntity[];
  onOpenCustomizer: (scope: ClientScope) => void;
  onOpenSignoff: (scope: ClientScope) => void;
  onOpenProposalSuite: (scope: ClientScope) => void;
  onOpenStagingPreview: (scope: ClientScope) => void;
  onDeleteScope: (scopeCode: string) => void;
  onPayBalance?: (scope: ClientScope) => void;
  onActivateMaintenance?: (scope: ClientScope) => void;
}

const getMaintenanceMeta = (planStr: string, currency: 'INR' | 'USD') => {
  const lower = (planStr || '').toLowerCase();
  const isUsd = currency === 'USD';
  if (lower.includes('premium') || lower.includes('sla')) {
    return {
      name: 'Premium AI & Dev SLA Care',
      price: isUsd ? '$475 / month' : '₹35,000 / month',
      sla: '24-Hour Priority SLA',
      allocation: 'Up to 8 hrs dev allocation/mo',
      highlights: 'AI vector DB & LLM latency tuning, SEO analytics reports, priority bug fixes',
      planId: isUsd ? 'care_premium_usd' : 'care_premium_inr',
    };
  }
  if (lower.includes('standard')) {
    return {
      name: 'Standard Care Plan',
      price: isUsd ? '$140 / month' : '₹10,000 / month',
      sla: '1 Business Day SLA',
      allocation: '3–4 hrs dev allocation/mo',
      highlights: 'Monthly content updates, page speed tuning, schema updates, daily automated backups',
      planId: isUsd ? 'care_standard_usd' : 'care_standard_inr',
    };
  }
  if (lower.includes('basic')) {
    return {
      name: 'Basic Care Plan',
      price: isUsd ? '$70 / month' : '₹5,000 / month',
      sla: '2 Business Days SLA',
      allocation: 'Up to 1 hr dev allocation/mo',
      highlights: 'Daily automated PostgreSQL backups, Vercel uptime monitoring, security dependency patches',
      planId: isUsd ? 'care_basic_usd' : 'care_basic_inr',
    };
  }
  return {
    name: 'Self-Managed (30-Day Warranty)',
    price: isUsd ? '$0' : '₹0',
    sla: '30-Day Post-Launch Warranty',
    allocation: 'Full handover documentation',
    highlights: 'Complimentary bug fixes for 30 days post-launch. Upgrade anytime to an active retainer.',
    planId: isUsd ? 'care_basic_usd' : 'care_basic_inr',
  };
};

export function ScopeCard({
  scope,
  changeOrders,
  onOpenCustomizer,
  onOpenSignoff,
  onOpenProposalSuite,
  onOpenStagingPreview,
  onDeleteScope,
  onPayBalance,
  onActivateMaintenance,
}: ScopeCardProps) {
  const isDepositPaid = Boolean(scope.deposit_paid);
  const isBalancePaid = Boolean(scope.balance_paid || scope.is_fully_paid);
  const deliveryStage = scope.delivery_stage || (isDepositPaid ? 'engineering' : 'architecture');

  const maintMeta = getMaintenanceMeta(scope.maintenance_plan, (scope.currency === 'USD' ? 'USD' : 'INR'));
  const isMaintActive = scope.maintenance_status === 'active';

  const isThreePart = scope.payment_structure === '40/30/30';
  const balanceMultiplier = isThreePart ? 0.3 : 0.5;
  const curr = (scope.currency === 'USD' ? 'USD' : 'INR') as 'USD' | 'INR';
  const totalCost = curr === 'USD' ? Number(scope.total_cost_usd || 0) : Number(scope.total_cost_inr || 0);
  const balanceAmount = Math.round(totalCost * balanceMultiplier);
  const balanceDisplay = curr === 'USD' ? `$${balanceAmount.toLocaleString('en-US')}` : `₹${balanceAmount.toLocaleString('en-IN')}`;

  const getStageBadgeClass = (stage: ClientDeliveryStage) => {
    switch (stage) {
      case 'live':
        return styles.statusBadgeLive;
      case 'staging':
        return styles.statusBadgeStaging;
      case 'engineering':
        return styles.statusBadgeEng;
      case 'architecture':
      default:
        return styles.statusBadgeArch;
    }
  };

  const getStageLabel = (stage: ClientDeliveryStage) => {
    switch (stage) {
      case 'live':
        return 'Phase 4: Live in Production';
      case 'staging':
        return 'Phase 3: Staging & QA';
      case 'engineering':
        return 'Phase 2: Core Engineering';
      case 'architecture':
      default:
        return 'Phase 1: Architecture Blueprint';
    }
  };

  const deliverableLinks = [
    { label: 'Live Production URL', url: scope.deliverables?.production_url },
    { label: 'Staging Environment', url: scope.deliverables?.staging_url },
    { label: 'GitHub Repository', url: scope.deliverables?.github_repo },
    { label: 'Figma Design System', url: scope.deliverables?.figma_url },
    { label: 'Signed SOW Document', url: scope.deliverables?.signoff_pdf_url },
  ].filter((d): d is { label: string; url: string } => Boolean(d.url && d.url.trim()));

  return (
    <div className={styles.scopeCard}>
      {/* Scope Card Header */}
      <div className={styles.scopeCardHeader}>
        <div className={styles.scopeCodeGroup}>
          <div className={styles.scopeCodeRow}>
            <span className={styles.scopeCodeBadge}>#{scope.scope_code}</span>
            <span className={`${styles.statusBadge} ${getStageBadgeClass(deliveryStage)}`}>
              {getStageLabel(deliveryStage)}
            </span>
            {isDepositPaid ? (
              <span className={`${styles.statusBadge} ${styles.statusBadgeLive}`}>
                <CheckCircle2 size={12} />{' '}
                {scope.payment_structure === '40/30/30' ? '40% Escrow Confirmed' : '50% Escrow Confirmed'}
              </span>
            ) : (
              <span className={`${styles.statusBadge} ${styles.statusBadgeArch}`}>
                <Clock size={12} /> Pending Deposit
              </span>
            )}
          </div>
          <h3 className={styles.scopeCompanyTitle}>
            {scope.company_name || 'My Custom Project'}
          </h3>
        </div>

        <div className={styles.scopeHeaderPriceBox}>
          <span className={styles.priceCurrencyLabel}>Total Project Scope</span>
          <h4 className={styles.scopePriceAmount}>
            {scope.currency === 'USD' ? '$' : '₹'}
            <NumberFlow
              value={scope.currency === 'USD' ? scope.total_cost_usd : scope.total_cost_inr}
            />
          </h4>
          <span className={styles.paymentStructureText}>
            {scope.payment_structure || '50/50 Deposit'}
          </span>
        </div>
      </div>

      {/* Scope Details Grid */}
      <div className={styles.scopeDetailsGrid}>
        <div className={styles.scopeDetailItem}>
          <span className={styles.detailLabel}>Architecture Engine</span>
          <span className={styles.detailValue}>{scope.base_engine}</span>
        </div>
        <div className={styles.scopeDetailItem}>
          <span className={styles.detailLabel}>Estimated Turnaround</span>
          <span className={styles.detailValue}>{scope.timeline}</span>
        </div>
        <div className={styles.scopeDetailItem}>
          <span className={styles.detailLabel}>Brand Asset Tier</span>
          <span className={styles.detailValue}>{scope.brand_asset}</span>
        </div>
        <div className={styles.scopeDetailItem}>
          <span className={styles.detailLabel}>Warranty & Maintenance</span>
          <span className={styles.detailValue}>{scope.maintenance_plan}</span>
        </div>
      </div>

      {/* Features Pill Box */}
      <div className={styles.featuresPillsContainer}>
        <span className={styles.featuresPillsHeading}>
          Included Architecture Modules ({scope.features.length})
        </span>
        <div className={styles.featuresPillsList}>
          {scope.features.map((feat, idx) => (
            <span key={idx} className={styles.featurePill}>
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* Deliverables Vault */}
      {deliverableLinks.length > 0 && (
        <div className={styles.featuresPillsContainer}>
          <span className={styles.featuresPillsHeading}>
            Project Deliverables Vault ({deliverableLinks.length})
          </span>
          <div className={styles.featuresPillsList}>
            {deliverableLinks.map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.featurePill}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
              >
                <ExternalLink size={12} /> {item.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Cryptographic Hash & Retriever Tenant Info */}
      <div className={styles.securityMetaBar}>
        {scope.sow_hash && (
          <div className={styles.sowHashBadge} title={scope.sow_hash}>
            <Lock size={12} /> SOW Hash: <code>{scope.sow_hash.slice(0, 16)}...</code>
          </div>
        )}
        {scope.retriever_tenant_id && (
          <div className={styles.tenantIdBadge}>
            <Server size={12} /> Vault Tenant: <code>{scope.retriever_tenant_id}</code>
          </div>
        )}
      </div>

      {/* Change Orders Section */}
      {changeOrders.length > 0 && (
        <div className={styles.changeOrdersContainer}>
          <span className={styles.changeOrdersHeading}>
            Approved Phase 2 Change Orders ({changeOrders.length})
          </span>
          <div className={styles.changeOrdersList}>
            {changeOrders.map((co) => (
              <div key={co.id} className={styles.changeOrderRow}>
                <div className={styles.changeOrderHeader}>
                  <span className={styles.changeOrderCode}>#{co.change_order_number}</span>
                  <span
                    className={`${styles.statusBadge} ${co.status === 'paid' ? styles.statusBadgeLive : styles.statusBadgeEng}`}
                  >
                    {co.status.toUpperCase()}
                  </span>
                </div>
                <div className={styles.changeOrderBody}>
                  {co.added_features?.length > 0 && (
                    <span className={styles.addedFeaturesText}>
                      +{co.added_features.join(', ')}
                    </span>
                  )}
                  <span className={styles.changeOrderPriceDelta}>
                    {scope.currency === 'USD'
                      ? `+$${co.price_delta_usd.toLocaleString('en-US')}`
                      : `+₹${co.price_delta_inr.toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance Care Retainer Widget */}
      <div
        className={`${styles.retainerContainer} ${
          isMaintActive ? styles.retainerContainerActive : ''
        }`}
      >
        <div className={styles.retainerHeader}>
          <div className={styles.retainerTitleGroup}>
            <ShieldCheck size={18} className={styles.retainerIcon} />
            <h4 className={styles.retainerHeading}>Monthly Maintenance &amp; SLA Retainer</h4>
          </div>
          {isMaintActive ? (
            <span className={styles.retainerBadgeActive}>
              <Zap size={12} className={styles.pulsingIcon} /> Retainer Active
            </span>
          ) : (
            <span className={styles.retainerBadgeInactive}>
              <Clock size={12} /> {scope.maintenance_plan?.includes('Warranty') ? 'Warranty Only' : 'Inactive Retainer'}
            </span>
          )}
        </div>

        <div className={styles.retainerMetaGrid}>
          <div className={styles.retainerMetaItem}>
            <span className={styles.retainerMetaLabel}>Tier &amp; Price</span>
            <span className={styles.retainerMetaValue}>
              {maintMeta.name} {maintMeta.price !== '$0' && maintMeta.price !== '₹0' ? `(${maintMeta.price})` : ''}
            </span>
          </div>
          <div className={styles.retainerMetaItem}>
            <span className={styles.retainerMetaLabel}>Response Guarantee</span>
            <span className={styles.retainerMetaValue}>{maintMeta.sla}</span>
          </div>
          <div className={styles.retainerMetaItem}>
            <span className={styles.retainerMetaLabel}>Monthly Allocation</span>
            <span className={styles.retainerMetaValue}>{maintMeta.allocation}</span>
          </div>
        </div>

        <p className={styles.retainerHighlights}>{maintMeta.highlights}</p>

        <div className={styles.retainerActionBar}>
          {isMaintActive ? (
            <span className={styles.retainerRenewalInfo}>
              <Calendar size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              {scope.maintenance_current_period_end
                ? `Active cycle renews on ${new Date(scope.maintenance_current_period_end).toLocaleDateString()}`
                : 'Subscription active with automated monthly billing'}
              {scope.maintenance_subscription_id ? ` • #${scope.maintenance_subscription_id}` : ''}
            </span>
          ) : (
            <>
              <span className={styles.retainerRenewalInfo}>
                {maintMeta.price !== '$0' && maintMeta.price !== '₹0'
                  ? `Automated recurring monthly retainer (${maintMeta.price})`
                  : 'Upgrade to a dedicated monthly retainer for guaranteed SLA support.'}
              </span>
              <button
                type="button"
                className={styles.retainerCtaBtn}
                onClick={() => onActivateMaintenance?.(scope)}
              >
                <Zap size={14} />
                {maintMeta.price !== '$0' && maintMeta.price !== '₹0'
                  ? `Activate ${maintMeta.name}`
                  : 'Subscribe to Care Retainer'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Scope Action Bar */}
      <div className={styles.scopeActionsBar}>
        <div className={styles.scopeActionGroupLeft}>
          <button
            type="button"
            className={styles.customizeBtn}
            onClick={() => onOpenCustomizer(scope)}
          >
            <Sliders size={15} />
            {isDepositPaid ? 'Submit Change Order' : 'Customize Stack'}
          </button>

          <button
            type="button"
            className={styles.proposalSuiteBtn}
            onClick={() => onOpenProposalSuite(scope)}
          >
            <FileText size={15} /> Export Proposal (PDF)
          </button>

          {isDepositPaid && (
            <button
              type="button"
              className={styles.stagingPreviewBtn}
              onClick={() => onOpenStagingPreview(scope)}
            >
              <Eye size={15} /> Staging Preview
            </button>
          )}
        </div>

        <div className={styles.scopeActionGroupRight}>
          {!isDepositPaid ? (
            <>
              <button
                type="button"
                className={styles.depositCtaBtn}
                onClick={() => onOpenSignoff(scope)}
              >
                <Lock size={15} /> Sign SOW & Pay Deposit
              </button>
              <button
                type="button"
                className={styles.deleteScopeBtn}
                onClick={() => onDeleteScope(scope.scope_code)}
                title="Delete Draft"
              >
                <Trash2 size={15} />
              </button>
            </>
          ) : isBalancePaid ? (
            <div className={styles.settledNotice}>
              <CheckCircle2 size={14} /> Project Settled & Live
            </div>
          ) : deliveryStage === 'staging' || deliveryStage === 'live' ? (
            <button
              type="button"
              className={styles.balanceCtaBtn}
              onClick={() => onPayBalance?.(scope)}
            >
              <CreditCard size={15} /> Pay Final Balance ({balanceDisplay})
            </button>
          ) : (
            <div className={styles.sprintActiveNotice}>
              <Activity size={14} className={styles.pulsingIcon} /> Sprint In Progress
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
