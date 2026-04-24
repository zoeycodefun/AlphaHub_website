/**
 * Spot trading page
 * all components are lazy loaded with React.lazy and Suspense
 * websocket subscription of realtime data(like k line/orderbook/ticker) are automatically subscribed via useTradingSubscription hook 
 */
import { useEffect, Suspense, lazy } from 'react';
// ❌
import { useTradingStore } from '../../global_state_store/trading_global_state_store';
import { useTradingSubscription } from '../../hooks/use_trading_subscription';
import { TradingPairSelector } from '../../components/trading/trading_pair_selector';

// ─── 子组件懒加载 ────────────────────────────────────────────────────
const SpotKline = lazy(() => import('./trade_center_pages_components/spot_page_components/spot_kline'));
const SpotOrderbook = lazy(() => import('./trade_center_pages_components/spot_page_components/spot_orderbook'));
const SpotOrderPanelZone = lazy(() => import('./trade_center_pages_components/spot_page_components/spot_order_panel_zone'));
const SpotParams = lazy(() => import('./trade_center_pages_components/spot_page_components/spot_params'));
const SpotSignalsPush = lazy(() => import('./trade_center_pages_components/spot_page_components/spot_signals_push'));
const SpotTradeVolume = lazy(() => import('./trade_center_pages_components/spot_page_components/spot_trade_volume'));
const SpotBalanceHistory = lazy(() => import('./trade_center_pages_components/spot_page_components/spot_balance_history'));
const SpotMarketNewsTicker = lazy(() => import('./trade_center_pages_components/spot_page_components/spot_market_news_ticker'));

// ─── 加载占位 ────────────────────────────────────────────────────────
function LoadingPanel({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-card rounded-lg animate-pulse flex items-center justify-center ${className}`}>
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

// =========================================================================
// 主组件
// =========================================================================

export default function SpotPage() {
    const setTradingMode = useTradingStore((s) => s.setTradingMode);

    // 切换到现货模式
    useEffect(() => {
        setTradingMode('spot');
    }, [setTradingMode]);

    // 自动订阅当前交易对的 Ticker + OrderBook
    useTradingSubscription();

    return (
        <div className="w-full h-full flex flex-col gap-1 p-1 bg-base overflow-hidden">

            {/* ═══════════════════════════════════════════════════════
                上半部分：三栏布局（左=图表区 | 中=订单簿 | 右=核心信号区）
               ═══════════════════════════════════════════════════════ */}
            <div className="flex-1 flex gap-1 min-h-0">

                {/* ─── 左栏：参数 + 快讯 + K线 + 成交量 ──────────── */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                    {/* 交易对选择 + 参数栏 */}
                    <div className="flex items-center gap-3 px-2 py-1.5 bg-card rounded-lg shrink-0">
                        <TradingPairSelector />
                        <Suspense fallback={<LoadingPanel className="h-8 flex-1" />}>
                            <SpotParams />
                        </Suspense>
                    </div>

                    {/* 市场快讯滚动条 */}
                    <Suspense fallback={<LoadingPanel className="h-8" />}>
                        <SpotMarketNewsTicker />
                    </Suspense>

                    {/* K 线图（含画线/标注工具） */}
                    <Suspense fallback={<LoadingPanel className="flex-[3]" />}>
                        <SpotKline />
                    </Suspense>

                    {/* 成交量 */}
                    <Suspense fallback={<LoadingPanel className="h-28" />}>
                        <SpotTradeVolume />
                    </Suspense>
                </div>

                {/* ─── 中栏：订单簿 ─────────────────────────────── */}
                <div className="w-60 shrink-0 flex flex-col gap-1">
                    <Suspense fallback={<LoadingPanel className="flex-1" />}>
                        <SpotOrderbook />
                    </Suspense>
                </div>

                {/* ─── 右栏：核心信号区（重点） ──────────────────── */}
                <div className="w-72 shrink-0 flex flex-col gap-1">
                    <Suspense fallback={<LoadingPanel className="flex-1" />}>
                        <SpotSignalsPush />
                    </Suspense>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                下半部分：三行（限价单 → 市价单 → 历史/持仓 Tab）
               ═══════════════════════════════════════════════════════ */}
            <div className="shrink-0 flex flex-col gap-1">
                {/* Row 1 + Row 2：限价单 + 市价单 */}
                <Suspense fallback={<LoadingPanel className="h-24" />}>
                    <SpotOrderPanelZone />
                </Suspense>

                {/* Row 3：当前委托 | 历史委托 | 历史成交 | 持有币种 | 策略机器人 | 账户信息 */}
                <div className="h-48">
                    <Suspense fallback={<LoadingPanel className="h-full" />}>
                        <SpotBalanceHistory />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}