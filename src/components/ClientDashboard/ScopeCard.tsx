'use client';

import React from 'react';
import {
  ShieldCheck,
  Zap,
  Layers,
  CreditCard,
  CheckCircle2,
  Edit3,
  Trash2,
  FileText,
  Sliders,
  ExternalLink,
  Sparkles,
  Lock,
  ArrowRight,
  GitCommit,
  GitBranch,
  Eye,
  Activity,
  Server,
  Clock,
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
}

export function ScopeCard({
  scope,
  changeOrders,
  onOpenCustomizer,
  onOpenSignoff,
  onOpenProposalSuite,
  onOpenStagingPreview,
  onDeleteScope,
}: ScopeCardProps) {
  const isDepositPaid = Boolean(scope.deposit_paid);
  const deliveryStage = scope.delivery_stage || (isDepositPaid ? 'engineering' : 'architecture');

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
                <CheckCircle2 size={12} /> 50% Escrow Confirmed
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
