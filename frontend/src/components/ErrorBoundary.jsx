import React from 'react'

/**
 * ErrorBoundary — catches any unhandled render-time errors in its subtree
 * and shows a friendly fallback instead of a blank white screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught error:', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'var(--surface-page, #f9fafb)',
          textAlign: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--color-error-bg, #fee2e2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            marginBottom: 8,
          }}
        >
          ⚠️
        </div>

        <h1
          style={{
            fontSize: 'var(--text-2xl, 1.5rem)',
            fontWeight: 'var(--weight-bold, 700)',
            color: 'var(--text-primary, #111)',
            letterSpacing: '-0.02em',
            marginBottom: 4,
          }}
        >
          Something went wrong
        </h1>

        <p
          style={{
            fontSize: 'var(--text-base, 1rem)',
            color: 'var(--text-secondary, #6b7280)',
            maxWidth: 360,
            lineHeight: 'var(--leading-relaxed, 1.6)',
          }}
        >
          An unexpected error occurred. Try reloading the page — your data is
          safe and this usually fixes it.
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-full, 9999px)',
              border: '1.5px solid var(--border-default, #d1d5db)',
              background: 'transparent',
              color: 'var(--text-primary, #111)',
              fontWeight: 'var(--weight-semibold, 600)',
              fontSize: 'var(--text-sm, 0.875rem)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans, sans-serif)',
            }}
          >
            Go back
          </button>
          <button
            onClick={this.handleReload}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-full, 9999px)',
              border: 'none',
              background: 'var(--brand-500, #ea580c)',
              color: 'white',
              fontWeight: 'var(--weight-bold, 700)',
              fontSize: 'var(--text-sm, 0.875rem)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans, sans-serif)',
            }}
          >
            Reload page
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && this.state.error && (
          <details
            style={{
              marginTop: 24,
              textAlign: 'left',
              maxWidth: 600,
              width: '100%',
              background: 'var(--neutral-100, #f3f4f6)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '12px 16px',
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                fontSize: 'var(--text-xs, 0.75rem)',
                color: 'var(--text-muted, #9ca3af)',
                fontWeight: 'var(--weight-semibold, 600)',
              }}
            >
              Error details (dev only)
            </summary>
            <pre
              style={{
                marginTop: 8,
                fontSize: 11,
                color: 'var(--color-error, #dc2626)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.toString()}
            </pre>
          </details>
        )}
      </div>
    )
  }
}
