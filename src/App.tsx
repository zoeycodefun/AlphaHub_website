import React, { Suspense, lazy, Component, type ReactNode, memo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './layout/layout';

const Dashboard = lazy(() => import('./pages/dashboard'));
const MarketIntelligence = lazy(() => import('./pages/market_intelligence'));
const InvestResearch = lazy(() => import('./pages/invest_research'));
const TradeCenter = lazy(() => import('./pages/trade_center'));
const AiModelTraining = lazy(() => import('./pages/ai_model_training_page'));


const PageLoader: React.FC = memo(() => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p className="text-dim text-sm">Loading...</p>
    </div>
  </div>
));

PageLoader.displayName = 'PageLoader';


interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }


  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }


  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('应用错误:', error, errorInfo);
    // TODO: send error to monitoring service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-base">
          <div className="max-w-md p-8 bg-card rounded-lg shadow-lg border border-base">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
            <p className="text-muted mb-4">
              Error, something went wrong. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="text-sm text-dim">
                <summary className="cursor-pointer mb-2">Error Details</summary>
                <pre className="bg-surface p-2 rounded overflow-auto text-secondary">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="market_intelligence" element={<MarketIntelligence />} />
              <Route path="investment_research" element={<InvestResearch />} />
              <Route path="trading_center/*" element={<TradeCenter />} />
              <Route path="ai_model_training" element={<AiModelTraining />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
};

export default App;