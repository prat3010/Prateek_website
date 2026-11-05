"use client";

import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error(`[SectionErrorBoundary: ${this.props.sectionName || 'Section'}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            background: "rgba(239, 68, 68, 0.05)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "8px",
            margin: "1rem 0",
          }}
        >
          <p style={{ color: "#ef4444", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
            An unexpected error occurred while loading this {this.props.sectionName || "section"}.
          </p>
          <button
            type="button"
            style={{
              padding: "6px 14px",
              background: "#1e293b",
              border: "1px solid #475569",
              borderRadius: "6px",
              color: "#f8fafc",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Retry Section
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
