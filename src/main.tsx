import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected application error',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application render error:', error, errorInfo);
  }

  handleResetAndReload = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore storage errors
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <h1 className="text-lg font-bold text-white">GA Sample Tracking Master</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              A cached state issue occurred while loading the workspace ({this.state.errorMessage}).
            </p>
            <button
              type="button"
              onClick={this.handleResetAndReload}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Reset Local Cache & Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);

