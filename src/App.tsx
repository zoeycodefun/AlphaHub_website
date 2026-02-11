import React, { Suspense, lazy, Component, type ReactNode, memo } from 'react'; // 引入React核心和相关hooks
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // 引入路由相关组件
import Layout from './layout/layout'; // 引入布局组件

// 懒加载页面组件：优化首屏加载性能，按需加载
const Dashboard = lazy(() => import('./pages/dashboard')); // 首页
const MarketInfoMonitor = lazy(() => import('./pages/market_info_monitor')); // 市场信息
const InvestResearch = lazy(() => import('./pages/invest_research')); // 投资研究
const TradeCenter = lazy(() => import('./pages/trade_center')); // 交易中心

/**
 * 页面加载占位符组件：懒加载时显示的loading状态
 * 使用旋转动画提供视觉反馈
 */
const PageLoader: React.FC = memo(() => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      {/* 旋转加载动画 */}
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      {/* 加载提示文字 */}
      <p className="text-gray-500 text-sm">加载中...</p>
    </div>
  </div>
));

PageLoader.displayName = 'PageLoader'; // 设置displayName便于调试

/**
 * 错误边界组件：捕获子组件树的JavaScript错误，显示降级UI
 * 防止整个应用崩溃
 */
interface ErrorBoundaryProps {
  children: ReactNode; // 子组件
}

interface ErrorBoundaryState {
  hasError: boolean; // 是否有错误
  error: Error | null; // 错误对象
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null }; // 初始化状态
  }

  // 当子组件抛出错误时调用
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }; // 更新状态以显示降级UI
  }

  // 记录错误信息
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('应用错误:', error, errorInfo); // 记录错误到控制台
    // TODO: 可以将错误发送到错误监控服务（如Sentry）
  }

  render() {
    if (this.state.hasError) {
      // 错误UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-red-600 mb-4">出错了</h1>
            <p className="text-gray-600 mb-4">
              应用遇到了一个错误。请刷新页面重试。
            </p>
            {this.state.error && (
              <details className="text-sm text-gray-500">
                <summary className="cursor-pointer mb-2">错误详情</summary>
                <pre className="bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()} // 刷新页面
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; // 正常渲染子组件
  }
}

/**
 * App组件：应用的根组件，配置路由和全局状态
 * 包含错误边界、路由配置、懒加载
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary> {/* 错误边界包裹整个应用 */}
      <Router> {/* 路由容器 */}
        <Suspense fallback={<PageLoader />}> {/* 懒加载的加载状态 */}
          <Routes>
            {/* 主布局路由：所有页面共享Layout */}
            <Route path="/" element={<Layout />}>
              {/* 首页路由 */}
              <Route index element={<Dashboard />} />
              {/* 市场信息路由 */}
              <Route path="market_info" element={<MarketInfoMonitor />} />
              {/* 投资研究路由 */}
              <Route path="investment_research" element={<InvestResearch />} />
              {/* 交易中心路由 */}
              <Route path="trading_center" element={<TradeCenter />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
};

export default App;