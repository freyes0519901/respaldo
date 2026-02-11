'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
            <svg className="h-8 w-8 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Algo salió mal</h2>
          <p className="text-[#94A3B8] text-sm text-center max-w-md">
            Ocurrió un error inesperado. Intenta recargar la página.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: '' });
              window.location.reload();
            }}
            className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #00D1B2, #00B89C)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(0, 209, 178, 0.3)',
            }}
          >
            🔄 Recargar página
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-4 p-3 rounded-lg bg-[#1E293B] text-[#EF4444] text-xs max-w-lg overflow-auto">
              {this.state.error}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
