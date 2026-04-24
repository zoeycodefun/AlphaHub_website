import React, { useState, useEffect, useCallback, useMemo, memo, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import TradeCenterNavigation from './trade_center_pages/trade_center_pages_components/trade_center_navigation';
import {
    type Exchange,
    type TimeZone,
} from './trade_center_pages/type/trade_center_navigation_type'
import {
    PAGE_CONFIGS,
} from './trade_center_pages/type/trade_center_pages_type'

// ─── 常量 ────────────────────────────────────────────────────────────
const DEFAULT_PAGE_ID = PAGE_CONFIGS[0].id; // 'spot'
const VALID_PAGE_IDS = new Set(PAGE_CONFIGS.map(c => c.id));

// 在模块级别为每个页面只调用一次 React.lazy()，避免每次渲染创建新组件类型导致无限循环
const LAZY_PAGE_MAP: Record<string, React.LazyExoticComponent<React.ComponentType>> = Object.fromEntries(
    PAGE_CONFIGS.map(config => [config.id, React.lazy(config.component)])
);

// ─── 辅助函数 ────────────────────────────────────────────────────────
/** 从 URL 解析当前页面 ID（单一数据源：URL） */
function parsePageIdFromPath(pathname: string): string | null {
    const relative = pathname.replace(/^\/trading_center\/?/, '');
    if (relative && VALID_PAGE_IDS.has(relative)) return relative;
    return null;
}

/** 获取保存的或默认的页面 ID */
function getSavedOrDefaultPage(): string {
    const saved = localStorage.getItem('trade_center_last_page');
    if (saved && VALID_PAGE_IDS.has(saved)) return saved;
    return DEFAULT_PAGE_ID;
}

// ─── 加载占位组件 ────────────────────────────────────────────────────
const PageLoader: React.FC = memo(() => (
    <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
    </div>
));

// ─── 错误边界 ────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> }) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error in trade center page', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            const FallbackComponent = this.props.fallback || DefaultErrorFallback;
            return <FallbackComponent error={this.state.error!} />;
        }
        return this.props.children;
    }
}
const DefaultErrorFallback: React.FC<{ error: Error }> = memo(({ error }) => (
    <div className='flex flex-col items-center justify-center h-64 text-center'>
        <div className='text-red-500 text-lg font-semibold mb-2'>Failed to load page</div>
        <div className='text-secondary text-sm mb-4'>{error.message}</div>
        <button
            onClick={() => window.location.reload()}
            className='px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-500 transition-colors'
        >
            Reloading...
        </button>
    </div>
));

// ─── 交易中心主组件 ──────────────────────────────────────────────────
const TradeCenter: React.FC = memo(() => {
    const navigate = useNavigate();
    const location = useLocation();

    // ── URL 驱动的 currentPage（单一数据源：URL 路径） ──
    const currentPage = useMemo(
        () => parsePageIdFromPath(location.pathname) ?? getSavedOrDefaultPage(),
        [location.pathname],
    );

    // ── 非页面相关的 UI 状态 ──
    const [currentExchange, setCurrentExchange] = useState<Exchange | null>(null);
    const [currentTimeZone, setCurrentTimeZone] = useState<TimeZone>('LOCAL');
    const [error, setError] = useState<string | null>(null);
    // ❌ should be fetched from backend API based on user auth
    const [userPermissions] = useState<string[]>(['trade', 'analysis']);

    // ── 首次进入 /trading_center（无子路径）时重定向 ──
    useEffect(() => {
        const pageFromUrl = parsePageIdFromPath(location.pathname);
        if (!pageFromUrl) {
            const target = getSavedOrDefaultPage();
            navigate(`/trading_center/${target}`, { replace: true });
        }
    }, [location.pathname, navigate]);

    // ── 有效导航时保存到 localStorage ──
    useEffect(() => {
        const pageFromUrl = parsePageIdFromPath(location.pathname);
        if (pageFromUrl) {
            localStorage.setItem('trade_center_last_page', pageFromUrl);
        }
    }, [location.pathname]);

    // ── 权限检查 ──
    const checkPermission = useCallback((requiredPermissions?: readonly string[]): boolean => {
        if (!requiredPermissions) return true;
        return requiredPermissions.every(p => userPermissions.includes(p));
    }, [userPermissions]);

    // ── 交易所切换 ──
    const handleExchangeChange = useCallback((exchange: Exchange) => {
        setCurrentExchange(exchange);
        // ❌ 使用API调用同步交易所状态
    }, []);

    // ── 时区切换 ──
    const handleTimeZoneChange = useCallback((timezone: TimeZone) => {
        setCurrentTimeZone(timezone);
    }, []);

    // ── 页面切换 ──
    const handlePageChange = useCallback((pageId: string) => {
        if (!VALID_PAGE_IDS.has(pageId)) return;

        const pageConfig = PAGE_CONFIGS.find(c => c.id === pageId);
        if (pageConfig && !checkPermission(pageConfig.requiredPermissions)) {
            setError('You do not have permission to access this page.');
            return;
        }
        setError(null);
        navigate(`/trading_center/${pageId}`, { replace: true });
    }, [navigate, checkPermission]);

    // ❌交易所数据，从后端API获取交易所数据，现在模拟
    const exchanges = useMemo((): readonly Exchange[] => [
        {
            id: 'binance',
            name: 'Binance',
            isActive: true,
            balance: { total: 1000, available: 800, currency: ' USDT' }
        }
    ], []);

    return (
        <ErrorBoundary>
            <div className='min-h-screen bg-base'>
                {/** navigation */}
                <TradeCenterNavigation
                    currentExchange={currentExchange}
                    exchanges={exchanges}
                    currentTimeZone={currentTimeZone}
                    currentPage={currentPage}
                    onExchangeChange={handleExchangeChange}
                    onTimeZoneChange={handleTimeZoneChange}
                    onPageChange={handlePageChange}
                />
                {/** main content */}
                <main className='pt-20 px-4 pb-8'>
                    <div className='max-w-7xl mx-auto'>
                        {/** error message */}
                        <div className='mb-6'>
                            {error && (
                                <div className='mt-2 p-3 bg-red-900/30 border border-red-700/50 text-red-400 rounded'>
                                    {error}
                                </div>
                            )}
                        </div>
                        {/** page content */}
                        <Suspense fallback={<PageLoader />}>
                            <Routes>
                                {PAGE_CONFIGS.map((config) => {
                                    const LazyPage = LAZY_PAGE_MAP[config.id];
                                    return (
                                        <Route
                                            key={config.id}
                                            path={config.id}
                                            element={
                                                checkPermission(config.requiredPermissions) ? (
                                                    <LazyPage />
                                                ) : (
                                                    <div className='text-center py-12'>
                                                        <div className='text-dim'>You do not have permission to access this page.</div>
                                                    </div>
                                                )
                                            }
                                        />
                                    );
                                })}
                                {/** index 路由：重定向到默认页面 */}
                                <Route index element={<Navigate to={getSavedOrDefaultPage()} replace />} />
                            </Routes>
                        </Suspense>
                    </div>
                </main>
            </div>
        </ErrorBoundary>
    );
});
export default TradeCenter;