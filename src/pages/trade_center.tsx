import React, { useState, useEffect, useCallback, useMemo,memo, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation} from 'react-router-dom';
import TradeCenterNavigation from './trade_center_pages/trade_center_pages_components/trade_center_navigation';
import {
    type Exchange,
    type TimeZone,
    type TradeCenterState,
} from './trade_center_pages/type/trade_center_navigation_type'
import {
    PAGE_CONFIGS,
    type PageConfig,
} from './trade_center_pages/type/trade_center_pages_type'

// load page components dynamically
const loadPageComponent = (pageConfig: PageConfig) => {
    const LazyComponent = React.lazy(pageConfig.component);
    return <LazyComponent />;
};
// load component
const PageLoader: React.FC = memo(() => (
    <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
    </div>
));
// error boundary
class ErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback?:React.ComponentType<{ error: Error}> },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode; fallback?:React.ComponentType<{ error: Error}>}) {
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
            return <FallbackComponent error={this.state.error!}/>;
        }
        return this.props.children;
    }
}
const DefaultErrorFallback: React.FC<{ error: Error }> = memo(({ error}) => (
    <div className='flex flex-col items-center justify-center h-64 text-center'>
        <div className='text-red-500 text-lg font-semibold mb-2'>页面加载失败</div>
        <div className='text-gray-600 text-sm mb-4'>{error.message}</div>
        <button 
        onClick={() => window.location.reload()}
        className='px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-500 transition-colors'
        >
            重新加载
        </button>
    </div>
));
// main trade center page
const TradeCenter: React.FC = memo(() => {
    const navigate = useNavigate();
    const location = useLocation();
    // use separate types
    const [state, setState] = useState<TradeCenterState>({
        currentExchange: null,
        currentTimeZone: 'LOCAL',
        currentPage: 'spot_trading',
        isLoading: false,
        error: null,
        userPermissions: ['trade', 'analysis'], // ❌ should be fetched from backend API based on user auth and the users auth system
    });
    // handle page change
    useEffect(() => {
        const pathSegments = location.pathname.split('/');
        const pageId = pathSegments[pathSegments.length - 1];
        const vaildPage = PAGE_CONFIGS.find(config => config.id === pageId);
        if (vaildPage && vaildPage.id !== state.currentPage) {
            setState(prevState => ({ ...prevState, currentPage: vaildPage.id }));
        }
    }, [location.pathname, state.currentPage]);
    // handle permissions check function
    const checkPermission = useCallback((requiredPermissions?: readonly string[]): boolean => {
        if (!requiredPermissions) return true;
        return requiredPermissions.every(permission => state.userPermissions.includes(permission));
    }, [state.userPermissions]);
    
    // handle events function
    // handle exchange change
    const handleExchangeChange = useCallback((exchange: Exchange) => {
        setState(prevState => ({ ...prevState, currentExchange: exchange }));
        // ❌ 使用API调用同步交易所状态
        console.log('Selected exchange:', exchange);
    }, []);
    // handle timezone change
    const handleTimeZoneChange = useCallback((timezone: TimeZone) => {
        setState(prevState => ({ ...prevState, currentTimeZone: timezone }));
        console.log('Selected timezone:', timezone);
    }, []);
    // handle page change
    const handlePageChange = useCallback((pageId: string) => {
        const pageConfig = PAGE_CONFIGS.find(config => config.id === pageId);
        if (!pageConfig) return;
        if (!checkPermission(pageConfig.requiredPermissions)) {
            setState(prevState => ({ ...prevState, error: 'You do not have permission to access this page.' }));
            return;
        }
        setState(prevState => ({ ...prevState, currentPage: pageId, error: null }));
        navigate(pageConfig.path);
        console.log('Navigating to page:', pageId);
    }, [navigate, checkPermission]);

    // ❌交易所数据，从后端API获取交易所数据
    const exchanges = useMemo((): readonly Exchange[] => [

    ], []);
    // current page config
    const currentPageConfig = useMemo(() => 
    PAGE_CONFIGS.find(config => config.id === state.currentPage),
    [state.currentPage]
    );

    return (
        <ErrorBoundary>
            <div className='min-h-screen bg-gray-50'>
                {/** navigation */}
                <TradeCenterNavigation
                currentExchange={state.currentExchange}
                exchanges={exchanges}
                currentTimeZone={state.currentTimeZone}
                currentPage={state.currentPage}
                onExchangeChange={handleExchangeChange}
                onTimeZoneChange={handleTimeZoneChange}
                onPageChange={handlePageChange}
                />
                {/** main content */}
                <main className='pt-20 px-4 pb-8'>
                    <div className='max-w-7xl mx-auto'>
                        {/** page title */}
                        <div className='mb-6'>
                            <p className='text-2xl font-bold text-gray-900'>
                                {currentPageConfig ?.title || '交易中心'}
                            </p>
                            {state.error && (
                                <div className='mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
                                    {state.error}
                                </div>
                            )}
                        </div>
                        {/** page content */}
                        <Suspense fallback={<PageLoader />}>
                        <Routes>
                            {PAGE_CONFIGS.map((config) => (
                                <Route
                                key={config.id}
                                path={config.path}
                                element={
                                    checkPermission(config.requiredPermissions) ? (
                                        loadPageComponent(config)
                                    ) : (
                                        <div className='text-center py-12'>
                                            <div className='text-gray-500'>You do not have permission to access this page.</div>
                                        </div>
                                    )
                                }
                                ></Route>
                            ))}
                            {/** default route to spot trading */}
                            <Route
                            path="/trade_center"
                            element={loadPageComponent(PAGE_CONFIGS[0])}
                            ></Route>
                        </Routes>
                        </Suspense>
                        
                    </div>
                </main>
            </div>
        </ErrorBoundary>
    );
});
export default TradeCenter;