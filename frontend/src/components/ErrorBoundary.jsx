import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/** Catches unexpected rendering errors so one broken widget never blanks the whole app. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ui] crashed:', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    // Navigating to another page clears the error.
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const chunkFailed = /Loading chunk|dynamically imported module|Importing a module script failed/i.test(String(this.state.error?.message));
    return (
      <div role="alert" className="min-h-[50vh] flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertTriangle aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {chunkFailed ? 'A new version of the app is available' : 'Something went wrong on this page'}
          </h1>
          <p className="text-slate-600 text-sm">
            {chunkFailed ? 'Please reload to get the latest version.' : 'Your data is safe. Reload the page, or go back and try again.'}
          </p>
          <button type="button" className="btn btn-primary mx-auto" onClick={() => window.location.reload()}>
            <RefreshCw size={16} aria-hidden="true" /> Reload page
          </button>
        </div>
      </div>
    );
  }
}
