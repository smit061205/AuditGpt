import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("AuditGPT Error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-16 py-24 text-slate-400">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-3">
            Something went wrong
          </h2>
          <p className="mb-6">
            An unexpected error occurred in the React application.
          </p>
          <pre className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 max-w-2xl mx-auto mb-6 text-xs text-left overflow-auto text-red-400 font-mono">
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-audit-accent hover:bg-sky-400 text-white font-semibold py-3 px-8 rounded-full transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
