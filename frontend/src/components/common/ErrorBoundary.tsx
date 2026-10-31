import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icon } from '../Icon';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught unhandled rendering error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = window.location.origin;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            padding: '24px',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
              padding: '32px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <Icon name="warning" size={28} />
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>
              Quality Workspace Notice
            </h2>

            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: '0 0 20px' }}>
              An interface error occurred while rendering the investigation canvas. Your data is protected, and no regulatory deviation records were lost.
            </p>

            {this.state.error && (
              <div
                style={{
                  backgroundColor: '#f1f5f9',
                  borderRadius: '6px',
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#475569',
                  marginBottom: '24px',
                  maxHeight: '120px',
                  overflowY: 'auto'
                }}
              >
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Reload Workspace
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Reset Investigation
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

