'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Mail, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './login.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, loginWithGoogle, loginWithMagicLink } = useAuth();

  const [email, setEmail] = useState('');
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);
  const [isSubmittingMagicLink, setIsSubmittingMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState(() => {
    const err = searchParams.get('error') || searchParams.get('error_description');
    return err ? decodeURIComponent(err) : '';
  });

  const nextParam = searchParams.get('redirect_to') || searchParams.get('next') || '/dashboard';
  const destination = nextParam.startsWith('/') ? nextParam : '/dashboard';

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(destination);
    }
  }, [authLoading, user, destination, router]);

  const handleGoogleSignIn = async () => {
    setIsSubmittingGoogle(true);
    setErrorMessage('');
    try {
      await loginWithGoogle(destination);
    } catch (err) {
      console.error('Google Sign-In error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
      setIsSubmittingGoogle(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmittingMagicLink(true);
    setErrorMessage('');
    try {
      await loginWithMagicLink(email.trim().toLowerCase(), destination);
      setMagicLinkSent(true);
    } catch (err) {
      console.error('Magic link dispatch error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send magic link. Please try again.');
    } finally {
      setIsSubmittingMagicLink(false);
    }
  };

  const isRagContext = searchParams.get('context') === 'rag';

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <ShieldCheck size={26} />
          </div>
          <h1 className={styles.title}>
            {isRagContext ? 'Sign In to Retriever AI' : 'Unified Authentication'}
          </h1>
          <p className={styles.subtitle}>
            {isRagContext
              ? 'Sign in to access your Retriever AI Knowledge Base, manage documents, and configure live website embeds.'
              : 'Sign in to access your Client Workspace, Scoping Briefs, and Retriever AI Studio.'}
          </p>
        </div>

        {errorMessage && (
          <div className={styles.errorBox} role="alert">
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmittingGoogle || authLoading}
          className={styles.googleBtn}
        >
          <Lock size={16} />
          <span>{isSubmittingGoogle ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        <div className={styles.divider}>
          <span>or sign in with magic link</span>
        </div>

        {magicLinkSent ? (
          <div className={styles.successBox}>
            <CheckCircle2 size={32} style={{ color: '#00e676', margin: '0 auto 0.5rem', display: 'block' }} />
            <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>Magic Link Dispatched!</p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Check <strong>{email}</strong> for your one-click secure login link. You can close this tab.
            </p>
          </div>
        ) : (
          <form onSubmit={handleMagicLinkSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="auth-email" className={styles.label}>
                Work or Personal Email
              </label>
              <input
                id="auth-email"
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                disabled={isSubmittingMagicLink}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingMagicLink || !email.trim()}
              className={styles.submitBtn}
            >
              <Mail size={16} />
              <span>{isSubmittingMagicLink ? 'Sending Link...' : 'Send Magic Link'}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        <div className={styles.footer}>
          <Link href="/">Portfolio</Link>
          <Link href="/scoping">Scoping Engine</Link>
          <Link href="/rag/app">Retriever Studio</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div className={styles.card} style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>Loading authentication portal...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
