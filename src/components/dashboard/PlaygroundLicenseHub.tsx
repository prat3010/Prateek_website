'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Copy, Check, Download, ShoppingBag, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import styles from './PlaygroundLicenseHub.module.css';

interface PlaygroundOrderLicense {
  id: string;
  orderNumber: string;
  productSlug: string;
  productTitle: string;
  amount: number;
  currency: string;
  paidAt: string;
  downloadToken: string;
  downloadCount: number;
  maxDownloads: number;
  githubUsername: string | null;
  githubRepoSource: string | null;
  licenseKey: string;
  licenseType: string;
  isActive: boolean;
}

interface PlaygroundLicenseHubProps {
  sessionToken?: string | null;
  getAccessToken?: () => Promise<string | null>;
}

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function PlaygroundLicenseHub({ sessionToken, getAccessToken }: PlaygroundLicenseHubProps) {
  const [orders, setOrders] = useState<PlaygroundOrderLicense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [githubInputs, setGithubInputs] = useState<Record<string, string>>({});
  const [invitingOrder, setInvitingOrder] = useState<string | null>(null);

  const fetchLicenses = useCallback(async (showToast = true) => {
    setLoading(true);
    try {
      let token = sessionToken;
      if (!token && getAccessToken) {
        token = await getAccessToken();
      }

      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch('/api/client/playground-licenses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch licenses');
      }

      const data = await res.json();
      setOrders(data.orders || []);

      // Initialize github inputs
      const initialHandles: Record<string, string> = {};
      (data.orders || []).forEach((o: PlaygroundOrderLicense) => {
        initialHandles[o.id] = o.githubUsername || '';
      });
      setGithubInputs(initialHandles);
      if (showToast) {
        toast.success('Licenses refreshed');
      }
    } catch (err) {
      console.error('Error fetching playground licenses:', err);
      toast.error('Could not load your digital goods & licenses.');
    } finally {
      setLoading(false);
    }
  }, [sessionToken, getAccessToken]);

  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      try {
        let token = sessionToken;
        if (!token && getAccessToken) {
          token = await getAccessToken();
        }

        if (!token) {
          if (!ignore) setLoading(false);
          return;
        }

        const res = await fetch('/api/client/playground-licenses', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch licenses');
        }

        const data = await res.json();
        if (!ignore) {
          setOrders(data.orders || []);
          const initialHandles: Record<string, string> = {};
          (data.orders || []).forEach((o: PlaygroundOrderLicense) => {
            initialHandles[o.id] = o.githubUsername || '';
          });
          setGithubInputs(initialHandles);
        }
      } catch (err) {
        console.error('Error loading playground licenses:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitial();
    return () => {
      ignore = true;
    };
  }, [sessionToken, getAccessToken]);

  const handleCopyKey = (licenseKey: string) => {
    navigator.clipboard.writeText(licenseKey);
    setCopiedKey(licenseKey);
    toast.success('License key copied to clipboard');
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  const handleInviteGitHub = async (orderId: string) => {
    const handle = githubInputs[orderId]?.trim();
    if (!handle) {
      toast.error('Please enter your GitHub username.');
      return;
    }

    setInvitingOrder(orderId);
    try {
      let token = sessionToken;
      if (!token && getAccessToken) {
        token = await getAccessToken();
      }

      const res = await fetch('/api/client/playground-licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          orderId,
          githubUsername: handle,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to update GitHub access');
      }

      if (data.warning) {
        toast.warning(data.warning);
      } else {
        toast.success(data.message || 'GitHub collaborator invitation sent!');
      }

      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, githubUsername: handle.replace(/^@/, '') } : o))
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send GitHub invite.');
    } finally {
      setInvitingOrder(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.hubContainer}>
        <div className={styles.emptyState}>
          <RefreshCw size={32} className={`${styles.emptyIcon} animate-spin`} />
          <p className={styles.emptyText}>Loading your active licenses and packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.hubContainer}>
      <div className={styles.hubHeader}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className={styles.hubTitle}>Digital Goods &amp; Licenses</h2>
            <p className={styles.hubSubtitle}>
              Direct download access, commercial software license keys, and private GitHub repository invitations.
            </p>
          </div>
          <button
            onClick={() => fetchLicenses(true)}
            className={styles.githubActionBtn}
            title="Refresh licenses"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <ShoppingBag size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No Digital Goods or Licenses Found</h3>
          <p className={styles.emptyText}>
            You haven&apos;t purchased any commercial micro-SaaS starter kits, games, or production modules yet.
            Every commercial pack includes perpetual source code, clean architecture, and private repo access.
          </p>
          <Link href="/playground" className={styles.exploreBtn}>
            <Sparkles size={16} /> Explore Playground &amp; Micro-SaaS
          </Link>
        </div>
      ) : (
        orders.map((order) => {
          const isQuotaExceeded = order.downloadCount >= order.maxDownloads;
          const downloadHref = `/api/playground/download?token=${order.downloadToken}&order=${order.orderNumber}`;

          return (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div>
                  <h3 className={styles.orderTitle}>{order.productTitle}</h3>
                  <div className={styles.orderRef}>Order Ref: {order.orderNumber}</div>
                </div>
                <div className={styles.orderMeta}>
                  <div className={styles.orderAmount}>
                    {order.currency === 'USD'
                      ? `$${order.amount.toFixed(2)}`
                      : `₹${order.amount.toLocaleString('en-IN')}`}
                  </div>
                  <div className={styles.orderDate}>
                    Purchased {new Date(order.paidAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* License Key Display */}
              <div className={styles.licenseRow}>
                <div>
                  <div className={styles.licenseKeyLabel}>Commercial License Key</div>
                  <div className={styles.licenseKeyValue}>{order.licenseKey}</div>
                </div>
                <button
                  onClick={() => handleCopyKey(order.licenseKey)}
                  className={styles.copyKeyBtn}
                  title="Copy license key"
                >
                  {copiedKey === order.licenseKey ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>

              {/* Actions & Quota */}
              <div className={styles.actionsRow}>
                <div className={styles.quotaMeter}>
                  {isQuotaExceeded ? (
                    <span style={{ color: '#ff5252', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={15} /> Quota Limit Reached ({order.downloadCount} / {order.maxDownloads})
                    </span>
                  ) : (
                    <span>
                      Download Quota: <strong>{order.downloadCount}</strong> / {order.maxDownloads} used
                    </span>
                  )}
                </div>

                <a
                  href={downloadHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.downloadBtn}
                  style={isQuotaExceeded ? { opacity: 0.6, pointerEvents: 'none' } : {}}
                >
                  <Download size={16} /> Download Package (.zip)
                </a>
              </div>

              {/* GitHub Collaborator Access Panel */}
              <div className={styles.githubPanel}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <GitHubIcon size={20} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text, #ffffff)' }}>
                      GitHub Source Repository Access
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #888888)' }}>
                      {order.githubRepoSource
                        ? `Repository: ${order.githubRepoSource}`
                        : 'Link your GitHub account to receive collaborator repository invites'}
                    </div>
                  </div>
                </div>

                <div className={styles.githubInputGroup}>
                  <input
                    type="text"
                    placeholder="github-username"
                    value={githubInputs[order.id] ?? ''}
                    onChange={(e) =>
                      setGithubInputs({ ...githubInputs, [order.id]: e.target.value })
                    }
                    className={styles.githubInput}
                  />
                  <button
                    onClick={() => handleInviteGitHub(order.id)}
                    disabled={invitingOrder === order.id}
                    className={styles.githubActionBtn}
                  >
                    {invitingOrder === order.id
                      ? 'Sending...'
                      : order.githubUsername
                      ? 'Re-invite'
                      : 'Grant Access'}
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default PlaygroundLicenseHub;
