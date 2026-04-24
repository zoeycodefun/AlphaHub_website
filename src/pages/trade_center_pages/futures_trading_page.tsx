/**
 * 合约交易页面（Futures Trading Page）
 *
 * 布局与现货页面对齐，分为上下两部分：
 *
 *  ┌──────────────────────┬──────────┬──────────┐
 *  │ 合约参数 + 新闻 Ticker  │          │          │
 *  │ K 线图               │ 订单簿    │ 核心信号区 │
 *  │ 成交量               │          │          │
 *  ├──────────────────────┴──────────┴──────────┤
 *  │ 杠杆控制栏 + 限价单行 + 市价单行              │
 *  ├──────────────────────────────────────────────┤
 *  │ 仓位 | 当前委托 | 历史委托 | 历史成交 |        │
 *  │ 资金费历史 | 资金流水 | 策略机器人 | 账户      │
 *  └──────────────────────────────────────────────┘
 */
import React, { useEffect, Suspense, lazy } from 'react';
import { useTradingStore } from '../../global_state_store/trading_global_state_store';
import { useTradingSubscription } from '../../hooks/use_trading_subscription';
import { TradingPairSelector } from '../../components/trading/trading_pair_selector';

// ─── 子组件懒加载 ────────────────────────────────────────────────────
const FuturesKline = lazy(() => import('./trade_center_pages_components/futures_page_components/futures_kline'));
const FuturesOrderbook = lazy(() => import('./trade_center_pages_components/futures_page_components/futures_orderbook'));
const FuturesOrderPanelZone = lazy(() => import('./trade_center_pages_components/futures_page_components/futures_order_panel_zone'));
const FuturesParams = lazy(() => import('./trade_center_pages_components/futures_page_components/futures_params'));
const FuturesSignalsPush = lazy(() => import('./trade_center_pages_components/futures_page_components/futures_signals_push'));
const FuturesTradeVolume = lazy(() => import('./trade_center_pages_components/futures_page_components/futures_trade_volume'));
const FuturesPositionHistoryBar = lazy(() => import('./trade_center_pages_components/futures_page_components/futures_position_history_bar'));
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

export default function ContractPage() {
    const setTradingMode = useTradingStore((s) => s.setTradingMode);

    // 切换到合约模式
    useEffect(() => {
        setTradingMode('futures');
    }, [setTradingMode]);

    // 自动订阅当前交易对的 Ticker + OrderBook
    useTradingSubscription();

    return (
        <div className="w-full h-full flex flex-col gap-1 p-1 bg-base overflow-hidden">

            {/* ━━━ 上半部分：三栏布局 ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="flex-1 flex gap-1 min-h-0">

                {/* ── 左栏：参数 + 新闻 + K线 + 成交量 ─────── */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                    {/* 顶部工具栏 */}
                    <div className="flex items-center gap-3 px-2 py-1.5 bg-card rounded-lg shrink-0">
                        <TradingPairSelector />
                        <Suspense fallback={<LoadingPanel className="h-8 w-80" />}>
                            <FuturesParams />
                        </Suspense>
                    </div>

                    {/* 新闻滚动条 */}
                    <Suspense fallback={<LoadingPanel className="h-7 shrink-0" />}>
                        <SpotMarketNewsTicker />
                    </Suspense>

                    {/* K 线图 */}
                    <Suspense fallback={<LoadingPanel className="flex-[3]" />}>
                        <FuturesKline />
                    </Suspense>

                    {/* 成交量 */}
                    <div className="h-28 shrink-0">
                        <Suspense fallback={<LoadingPanel className="h-full" />}>
                            <FuturesTradeVolume />
                        </Suspense>
                    </div>
                </div>

                {/* ── 中栏：订单簿 ─────────────────────────── */}
                <div className="w-60 shrink-0">
                    <Suspense fallback={<LoadingPanel className="h-full" />}>
                        <FuturesOrderbook />
                    </Suspense>
                </div>

                {/* ── 右栏：核心信号区 ─────────────────────── */}
                <div className="w-72 shrink-0">
                    <Suspense fallback={<LoadingPanel className="h-full" />}>
                        <FuturesSignalsPush />
                    </Suspense>
                </div>
            </div>

            {/* ━━━ 下半部分：下单面板 + 持仓/订单/历史 ━━━━━━━━ */}
            <div className="shrink-0 flex flex-col gap-1">
                {/* Row 1+2: 杠杆控制 + 限价单 + 市价单 */}
                <Suspense fallback={<LoadingPanel className="h-32" />}>
                    <FuturesOrderPanelZone />
                </Suspense>

                {/* Row 3: 8 Tab 面板 */}
                <div className="h-48">
                    <Suspense fallback={<LoadingPanel className="h-full" />}>
                        <FuturesPositionHistoryBar />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}