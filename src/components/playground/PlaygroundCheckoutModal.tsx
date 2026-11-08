'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  Download, 
  Copy, 
  Check, 
  Zap, 
  ArrowRight, 
  Lock, 
  Mail, 
  User, 
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useLenis } from 'lenis/react';
import Portal from '@/components/ui/Portal';
import MagneticButton from '@/components/ui/MagneticButton';
import type { PlaygroundItem } from '@/data/playgroundItems';
import { calculatePlaygroundPrice } from '@/lib/playgroundCommerce';
import styles from './PlaygroundCheckoutModal.module.css';

const GitHubIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface PlaygroundCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PlaygroundItem;
  initialCurrency?: 'INR' | 'USD';
  selectedTierId?: string;
}

interface RazorpayPaymentResponse {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayInstance {
  open: () => void;
  on?: (event: string, callback: (resp: { error?: { description?: string } }) => void) => void;
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

function getWindowRazorpay(): RazorpayConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (getWindowRazorpay()) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PlaygroundCheckoutModal({
  isOpen,
  onClose,
  item,
  initialCurrency = 'INR',
  selectedTierId = 'standard',
}: PlaygroundCheckoutModalProps) {
  const resolveInitialTierId = (tId?: string) => {
    if (tId && item.pricingTiers?.some((t) => t.id === tId)) {
      return tId;
    }
    return item.pricingTiers?.[0]?.id || tId || 'standard';
  };

  const [currency, setCurrency] = useState<'INR' | 'USD'>(initialCurrency);
  const [tierId, setTierId] = useState<string>(() => resolveInitialTierId(selectedTierId));
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [githubUsername, setGithubUsername] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<{
    licenseKey: string;
    downloadUrl: string;
    orderNumber: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Sync state when modal open prop transitions without triggering cascading renders in effects
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCurrency(initialCurrency);
      setTierId(resolveInitialTierId(selectedTierId));
      setSuccessData(null);
    }
  }

  const lenis = useLenis();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const successDownloadRef = useRef<HTMLAnchorElement>(null);
  const isSubmittingRef = useRef(isSubmitting);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  // ADR 05 / ADR 47: Lenis scroll lock, body overflow, and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    lenis?.stop();

    const focusTimer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isSubmittingRef.current) onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!modalRef.current.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      lenis?.start();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, lenis, onClose]);

  // Focus primary action upon entering fulfillment success state
  useEffect(() => {
    if (successData) {
      const timer = setTimeout(() => {
        successDownloadRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [successData]);

  const { amount, tier } = calculatePlaygroundPrice(item, tierId, currency);

  // Capture referral code from URL search param or cookie
  const getReferralCode = (): string | undefined => {
    if (typeof window === 'undefined') return undefined;
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref') || urlParams.get('partner');
    if (refParam) return refParam;

    const match = document.cookie.match(/(?:^|;\s*)partner_ref=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : undefined;
  };

  const handleCopyLicense = () => {
    if (!successData?.licenseKey) return;
    navigator.clipboard.writeText(successData.licenseKey);
    setCopiedKey(true);
    toast.success('License key copied to clipboard!');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim()) {
      toast.error('Please provide your name and delivery email.');
      return;
    }

    setIsSubmitting(true);
    const referralCode = getReferralCode();

    try {
      // 1. Create order
      const createRes = await fetch('/api/playground/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: item.slug,
          tierId,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          currency,
          githubUsername: githubUsername.trim() || undefined,
          referralCode,
        }),
      });

      const orderJson = await createRes.json();
      if (!createRes.ok || orderJson.error) {
        throw new Error(orderJson.error || 'Failed to initialize order');
      }

      const RazorpayClass = getWindowRazorpay();

      // If mock or dev test mode, complete verification directly
      if (orderJson.isMock || !RazorpayClass) {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded && !orderJson.isMock) {
          throw new Error('Could not load secure payment interface');
        }
      }

      if (orderJson.isMock) {
        const verifyRes = await fetch('/api/playground/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderJson.orderId,
            razorpayOrderId: orderJson.razorpayOrderId,
            razorpayPaymentId: `pay_mock_${Date.now()}`,
            razorpaySignature: 'sig_mock_verified',
          }),
        });

        const verifyJson = await verifyRes.json();
        if (verifyJson.success) {
          setSuccessData({
            licenseKey: verifyJson.licenseKey,
            downloadUrl: verifyJson.downloadUrl,
            orderNumber: verifyJson.orderNumber || orderJson.orderNumber,
          });
          toast.success('Payment simulated successfully! License issued.');
        } else {
          throw new Error(verifyJson.error || 'Verification failed');
        }
        setIsSubmitting(false);
        return;
      }

      const LiveRazorpay = getWindowRazorpay();
      if (!LiveRazorpay) {
        throw new Error('Payment interface initialization error');
      }

      // 2. Open standard Razorpay Checkout Modal
      const options: Record<string, unknown> = {
        key: orderJson.keyId,
        amount: orderJson.amount,
        currency: orderJson.currency,
        name: 'Prateeq Studio',
        description: `${item.title} — Commercial Pack`,
        order_id: orderJson.razorpayOrderId,
        prefill: {
          name: customerName,
          email: customerEmail,
        },
        theme: {
          color: '#00e676',
        },
        handler: async (response: RazorpayPaymentResponse) => {
          try {
            const verifyRes = await fetch('/api/playground/checkout/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: orderJson.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyJson = await verifyRes.json();
            if (verifyJson.success) {
              setSuccessData({
                licenseKey: verifyJson.licenseKey,
                downloadUrl: verifyJson.downloadUrl,
                orderNumber: verifyJson.orderNumber || orderJson.orderNumber,
              });
              toast.success('Payment confirmed! License key and downloads ready.');
            } else {
              toast.error(verifyJson.error || 'Signature verification failed.');
            }
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error processing payment settlement');
          } finally {
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          },
        },
      };

      const rzp = new LiveRazorpay(options);
      if (typeof rzp.on === 'function') {
        rzp.on('payment.failed', (resp: { error?: { description?: string } }) => {
          toast.error(`Payment failed: ${resp.error?.description || 'Declined'}`);
          setIsSubmitting(false);
        });
      }
      rzp.open();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal target="document.body">
      <div 
        className={styles.modalOverlay}
        role="dialog"
        aria-modal="true"
        aria-labelledby="playground-checkout-title"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSubmitting) onClose();
        }}
      >
        <div 
          className={styles.modalContent} 
          ref={modalRef}
          data-lenis-prevent
        >
          {/* Header */}
          <div className={styles.modalHeader}>
            <div>
              <div className={styles.brandPill}>
                <Zap size={13} />
                <span>Instant Digital Fulfillment</span>
              </div>
              <h2 id="playground-checkout-title" className={styles.modalTitle}>
                {successData ? 'Order Complete' : 'Guest Checkout'}
              </h2>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close modal"
              disabled={isSubmitting}
            >
              <X size={20} />
            </button>
          </div>

          {/* Success State View */}
          {successData ? (
            <div className={styles.successContainer}>
              <div className={styles.successIconBadge}>
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem' }}>Fulfillment Ready!</h3>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                  A confirmation receipt and lifetime magic link were sent to <strong>{customerEmail}</strong>.
                </p>
              </div>

              <div className={styles.licenseCard}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
                  Perpetual Software License Key
                </div>
                <div className={styles.licenseKeyText}>
                  <span>{successData.licenseKey}</span>
                  <button
                    type="button"
                    onClick={handleCopyLicense}
                    className={styles.closeBtn}
                    title="Copy License Key"
                  >
                    {copiedKey ? <Check size={16} style={{ color: '#00e676' }} /> : <Copy size={16} />}
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #888888)' }}>
                  Order Ref: <code style={{ color: 'var(--color-text, #ffffff)' }}>{successData.orderNumber}</code>
                </div>
              </div>

              <a
                ref={successDownloadRef}
                href={successData.downloadUrl}
                download
                className={styles.downloadPackageBtn}
              >
                <Download size={18} />
                <span>Download Release Package (.zip)</span>
              </a>

              {githubUsername && item.githubRepoSource && (
                <div style={{ background: 'var(--badge-success-bg, rgba(0, 230, 118, 0.08))', border: '1px solid var(--badge-success-border, rgba(0, 230, 118, 0.25))', borderRadius: 6, padding: '10px 14px', fontSize: '0.8rem', color: 'var(--color-text, #f8fafc)', textAlign: 'left' }}>
                  <strong style={{ color: 'var(--badge-success-text, #00e676)' }}>✓ Collaborator Invite Dispatched:</strong> Check your GitHub notifications for <strong>@{githubUsername}</strong> to clone <code>{item.githubRepoSource}</code>.
                </div>
              )}

              <button
                type="button"
                className={styles.checkoutBtn}
                onClick={onClose}
                style={{ background: 'transparent', border: '1px solid var(--border-muted)', color: 'var(--color-text, #ffffff)', boxShadow: 'none' }}
              >
                Close Window
              </button>
            </div>
          ) : (
            /* Checkout Form View */
            <form onSubmit={handleCheckoutSubmit} className={styles.modalBody}>
              {/* Product and Price Summary */}
              <div className={styles.productSummary}>
                <div>
                  <div className={styles.productSummaryTitle}>{item.title}</div>
                  <div className={styles.productSummarySub}>
                    {tier?.title || 'Commercial Release & Source Pack'} • v{item.version || '1.0.0'}
                  </div>
                </div>
                <div className={styles.productSummaryPrice}>
                  {currency === 'INR' ? `₹${amount.toLocaleString()}` : `$${amount}`}
                </div>
              </div>

              {/* Currency Toggle */}
              <div className={styles.currencyToggleRow}>
                <span className={styles.currencyLabel}>Billing Currency:</span>
                <div className={styles.currencyPills}>
                  <button
                    type="button"
                    className={`${styles.currencyPill} ${currency === 'INR' ? styles.currencyPillActive : ''}`}
                    onClick={() => setCurrency('INR')}
                  >
                    ₹ INR (UPI / Cards)
                  </button>
                  <button
                    type="button"
                    className={`${styles.currencyPill} ${currency === 'USD' ? styles.currencyPillActive : ''}`}
                    onClick={() => setCurrency('USD')}
                  >
                    $ USD (International)
                  </button>
                </div>
              </div>

              {/* Tier Selector (if multiple tiers) */}
              {item.pricingTiers && item.pricingTiers.length > 1 && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Package Tier:</label>
                  <select
                    value={tierId}
                    onChange={(e) => setTierId(e.target.value)}
                    className={styles.formInput}
                  >
                    {item.pricingTiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} — {currency === 'INR' ? `₹${t.priceINR.toLocaleString()}` : `$${t.priceUSD}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Input Fields */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <User size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Vance"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <Mail size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Delivery Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alex.vance@blackmesa.org"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className={styles.formInput}
                />
                <span className={styles.formHelp}>
                  Your license key and 24h download links will be delivered here instantly.
                </span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <GitHubIcon size={13} />
                  <span style={{ marginLeft: 4 }}>GitHub Username (Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. alexvance"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  className={styles.formInput}
                />
                <span className={styles.formHelp}>
                  For automated collaborator invitation to private GitHub repository.
                </span>
              </div>

              {/* Submit CTA Wrapped in MagneticButton */}
              <MagneticButton strength={0.2} style={{ width: '100%' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.checkoutBtn}
                >
                  <Lock size={15} />
                  <span>
                    {isSubmitting 
                      ? 'Connecting Secure Gateway...' 
                      : `Proceed to Razorpay (${currency === 'INR' ? `₹${amount.toLocaleString()}` : `$${amount}`})`}
                  </span>
                  <ArrowRight size={15} />
                </button>
              </MagneticButton>

              {/* Guarantees */}
              <div className={styles.guaranteesRow}>
                <div className={styles.guaranteeItem}>
                  <ShieldCheck size={14} style={{ color: 'var(--color-primary)' }} />
                  <span>Frictionless Guest Checkout — Zero mandatory Google OAuth login</span>
                </div>
                <div className={styles.guaranteeItem}>
                  <ShieldCheck size={14} style={{ color: 'var(--color-primary)' }} />
                  <span>Permanent magic re-download link + statutory GST LUT zero-rated export receipt</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </Portal>
  );
}
