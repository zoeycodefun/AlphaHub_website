
/**
 * 对冲交易页面（Hedge Trade Page）— BTC/ETH 专属版
 *
 * 核心理念：只做 BTC 和 ETH 的对冲，用于震荡/不确定行情下的风险缓冲。
 *
 * 双模块布局：
 *   Tab 1 — 同交所异币种对冲：
 *     • BTC/ETH 相关性监控 (左上)
 *     • 双币对冲计算器 (右上)
 *     • 夜间市场监控 (左下)
 *     • 跨所价差监控 (右下)
 *   Tab 2 — 跨交所同币种套利：
 *     • 跨所价差监控（全幅）
 */
import React, { Suspense, useState } from 'react';

// =========================================================================
// 懒加载子组件 — 来自 hedge_trade_page_components
// =========================================================================

const CorrelationMonitor = React.lazy(() => import('./trade_center_pages_components/hedge_trade_page_components/BTC_ETH_correlation_monitor_agent'));
const HedgeCalculator = React.lazy(() => import('./trade_center_pages_components/hedge_trade_page_components/BTC_ETH_dual_asset_hedge_position_calculator_agent'));
const NightWatcher = React.lazy(() => import('./trade_center_pages_components/hedge_trade_page_components/night_sleep_session_market_watcher_agent'));
const CrossExchangeMonitor = React.lazy(() => import('./trade_center_pages_components/hedge_trade_page_components/cross_exchange_arbitrage_monitor_agent'));

// =========================================================================
// 加载占位
// =========================================================================

function LoadingPanel() {
    return (
        <div className="flex items-center justify-center py-12 bg-card rounded-lg">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

// =========================================================================
// Tab 配置
// =========================================================================

type HedgeTab = 'cross_asset' | 'cross_exchange';

const TABS: { key: HedgeTab; label: string; icon: string; desc: string }[] = [
    { key: 'cross_asset', label: '同交所异币种对冲', icon: '⚖️', desc: 'BTC/ETH 相关性跟踪 + 对冲计算 + 夜间监控' },
    { key: 'cross_exchange', label: '跨交所同币种套利', icon: '🔀', desc: '同币种多交易所价差监控与套利机会发现' },
];

// =========================================================================
// Mock 价格
// =========================================================================

const MOCK_PRICES = {
    btc: { price: 68450, change24h: 1.23 },
    eth: { price: 3870, change24h: -0.45 },
    correlation: 0.87,
};

// =========================================================================
// 主页面组件
// =========================================================================

export default function HedgeTradePage() {
    const [activeTab, setActiveTab] = useState<HedgeTab>('cross_asset');

    return (
        <div className="h-full bg-base flex flex-col overflow-hidden">
            {/* ===== 顶部 Header ===== */}
            <div className="shrink-0 px-5 pt-4 pb-3 space-y-3">
                {/* 标题行 + 实时价格 */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-primary">⚖️ BTC/ETH 对冲交易</h1>
                        <p className="text-[10px] text-dim mt-0.5">震荡行情下的风险缓冲策略 · 只做 BTC 和 ETH</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* BTC 价格 */}
                        <div className="text-right">
                            <div className="text-[9px] text-dim">BTC</div>
                            <div className="text-sm font-mono text-orange-400">${MOCK_PRICES.btc.price.toLocaleString()}</div>
                            <div className={`text-[9px] font-mono ${MOCK_PRICES.btc.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {MOCK_PRICES.btc.change24h >= 0 ? '+' : ''}{MOCK_PRICES.btc.change24h}%
                            </div>
                        </div>
                        {/* 相关性 */}
                        <div className="text-center px-3 py-1 bg-surface/50 rounded-lg border border-strong/30">
                            <div className="text-[9px] text-dim">相关性</div>
                            <div className="text-sm font-mono text-blue-400">{MOCK_PRICES.correlation}</div>
                        </div>
                        {/* ETH 价格 */}
                        <div className="text-left">
                            <div className="text-[9px] text-dim">ETH</div>
                            <div className="text-sm font-mono text-blue-400">${MOCK_PRICES.eth.price.toLocaleString()}</div>
                            <div className={`text-[9px] font-mono ${MOCK_PRICES.eth.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {MOCK_PRICES.eth.change24h >= 0 ? '+' : ''}{MOCK_PRICES.eth.change24h}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab 切换 */}
                <div className="flex gap-2">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                                activeTab === tab.key
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                    : 'bg-surface/40 text-dim border border-strong/30 hover:text-secondary'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                    <span className="flex items-center text-[9px] text-secondary ml-2">
                        {TABS.find(t => t.key === activeTab)?.desc}
                    </span>
                </div>
            </div>

            {/* ===== 主体内容 ===== */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5">
                {activeTab === 'cross_asset' ? (
                    /* ── Tab 1: 同交所异币种对冲 ── 2×2 网格 ── */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full" style={{ minHeight: '700px' }}>
                        {/* 左上：相关性监控 */}
                        <div className="min-h-[340px]">
                            <Suspense fallback={<LoadingPanel />}>
                                <CorrelationMonitor />
                            </Suspense>
                        </div>
                        {/* 右上：对冲计算器 */}
                        <div className="min-h-[340px]">
                            <Suspense fallback={<LoadingPanel />}>
                                <HedgeCalculator />
                            </Suspense>
                        </div>
                        {/* 左下：夜间监控 */}
                        <div className="min-h-[340px]">
                            <Suspense fallback={<LoadingPanel />}>
                                <NightWatcher />
                            </Suspense>
                        </div>
                        {/* 右下：跨所价差 */}
                        <div className="min-h-[340px]">
                            <Suspense fallback={<LoadingPanel />}>
                                <CrossExchangeMonitor />
                            </Suspense>
                        </div>
                    </div>
                ) : (
                    /* ── Tab 2: 跨交所同币种套利 ── 全幅 ── */
                    <div className="h-full" style={{ minHeight: '700px' }}>
                        <Suspense fallback={<LoadingPanel />}>
                            <CrossExchangeMonitor />
                        </Suspense>
                    </div>
                )}
            </div>
        </div>
    );
}