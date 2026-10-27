'use client';

import React, { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Fatal Root Layout Exception caught by global-error.tsx:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: '2rem 1rem',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            background: '#12131a',
            border: '2px solid #2d3142',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}
          role="alert"
        >
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ef4444',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              marginBottom: '1rem',
            }}
          >
            CRITICAL KERNEL FAULT
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.75rem 0' }}>
            Root Layout Subsystem Failure
          </h1>

          <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
            A fatal error prevented the application shell from mounting. You can attempt to reload the
            kernel or return to the root base.
          </p>

          {error?.digest && (
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                color: '#64748b',
                background: 'rgba(0,0,0,0.3)',
                padding: '6px 10px',
                borderRadius: '6px',
                marginBottom: '1.5rem',
              }}
            >
              Digest: {error.digest}
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reload Application
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              style={{
                background: 'transparent',
                color: '#f8fafc',
                border: '1px solid #2d3142',
                padding: '0.65rem 1.25rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              Return to Base
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
