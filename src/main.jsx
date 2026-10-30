import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('TwinGuard AI — Caught Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6 font-mono">
          <div className="max-w-xl w-full bg-slate-900 border border-red-500/50 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-bold text-lg">
              <span>⚠️</span>
              <span>TwinGuard AI — Runtime Recovery</span>
            </div>
            <p className="text-sm text-slate-300">
              A temporary runtime exception occurred. Click the button below to perform a clean refresh:
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-red-300 overflow-x-auto">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-sm tracking-wide transition-colors"
            >
              Refresh TwinGuard AI
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
