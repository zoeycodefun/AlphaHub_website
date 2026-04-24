/**
 * 盈亏分析页面（Profit Loss Analysis Page）—— 重新设计
 *
 * ─── 布局（垂直分区） ───────────────────────────────────────────
 *  ┌──────────────────────────────────────────────────────────┐
 *  │  页面标题 + 下载报告按钮                                 │
 *  ├──────────────────────────────────────────────────────────┤
 *  │  盈亏实时反馈                                            │
 *  ├──────────────────────────────────────────────────────────┤
 *  │  总盈亏分析（日/周/月/年 tab）                           │
 *  ├──────────────────────────────────────────────────────────┤
 *  │  分类盈亏分析（来源/交易对 tab）                         │
 *  ├──────────────────────────────────────────────────────────┤
 *  │  多维绩效指标（15+ 指标卡片）                            │
 *  ├──────────────────────────────────────────────────────────┤
 *  │  可视化图表（8 种图表 tab 切换）                         │
 *  └──────────────────────────────────────────────────────────┘
 */
import React, { memo, Suspense, lazy } from 'react';
import type { PnlReport, PnlRealtimeFeedback, PnlMultiDimensionMetrics, PnlComprehensiveReport } from './type/alpha_module_types';

// ─── 子组件懒加载 ──────────────────────────────────────────────────
const RealtimeFeedback = lazy(() => import('./trade_center_pages_components/profit_loss_analysis_page_components/profit_loss_realtime_feedback'));
const TotalPnlAnalysis = lazy(() => import('./trade_center_pages_components/profit_loss_analysis_page_components/total_profit_loss_analysis'));
const ClassificationAnalysis = lazy(() => import('./trade_center_pages_components/profit_loss_analysis_page_components/profit_loss_classfication_analysis'));
const MultiDimensionMetrics = lazy(() => import('./trade_center_pages_components/profit_loss_analysis_page_components/multiple_analysis_indicators'));
const ChartsVisualization = lazy(() => import('./trade_center_pages_components/profit_loss_analysis_page_components/charts_visualization'));
const AnalysisReport = lazy(() => import('./trade_center_pages_components/profit_loss_analysis_page_components/analysis_report'));

// ─── 加载占位 ──────────────────────────────────────────────────────
function LoadingPanel({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-card rounded-lg animate-pulse flex items-center justify-center ${className}`}>
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

// =========================================================================
// Mock 数据
// =========================================================================

const MOCK_REALTIME: PnlRealtimeFeedback = {
    todayPnl: 326.50,
    todayReturnPct: 1.82,
    openPositionPnl: 185.30,
    closedPnl: 141.20,
    todayTradeCount: 8,
    todayWinRate: 62.5,
    intraday: Array.from({ length: 24 }, (_, i) => ({
        time: `${String(i).padStart(2, '0')}:00`,
        equity: 18000 + Math.sin(i * 0.5) * 200 + i * 15 + Math.random() * 50,
    })),
};

const MOCK_REPORT: PnlReport = {
    period: '2026-01 ~ 2026-04',
    totalRealizedPnl: 4827.50,
    totalReturnPct: 12.8,
    winRatePct: 61.5,
    winCount: 32,
    lossCount: 20,
    profitFactor: 2.15,
    maxWin: 1250.00,
    maxLoss: -540.00,
    maxDrawdownPct: 8.3,
    bySource: {
        spot:    { pnl: 2100, count: 18 },
        futures: { pnl: 1800, count: 15 },
        hedge:   { pnl: 350,  count: 8 },
        dca:     { pnl: 580,  count: 9 },
        manual:  { pnl: -2.5, count: 2 },
    },
    bySymbol: {
        'BTC/USDT': { pnl: 2450, count: 16 },
        'ETH/USDT': { pnl: 1380, count: 14 },
        'SOL/USDT': { pnl: 620,  count: 10 },
        'BNB/USDT': { pnl: -180, count: 6 },
        'DOGE/USDT': { pnl: 557.5, count: 6 },
    },
    monthlyPnl: [
        { month: '2026-01', pnl: 820,   tradeCount: 12 },
        { month: '2026-02', pnl: 1560,  tradeCount: 15 },
        { month: '2026-03', pnl: -350,  tradeCount: 10 },
        { month: '2026-04', pnl: 2797.5, tradeCount: 15 },
    ],
};

const MOCK_METRICS: PnlMultiDimensionMetrics = {
    sharpeRatio: 1.85,
    sortinoRatio: 2.42,
    calmarRatio: 1.54,
    maxDrawdownPct: 8.3,
    annualizedReturnPct: 38.4,
    volatility: 15.2,
    profitFactor: 2.15,
    expectancy: 0.68,
    avgWin: 215.80,
    avgLoss: -135.50,
    avgHoldingMinutes: 480,
    maxWinStreak: 7,
    maxLossStreak: 3,
    avgTradesPerDay: 2.4,
};

const MOCK_COMPREHENSIVE: PnlComprehensiveReport = {
    title: 'AlphaHub 交易绩效报告',
    period: '2026-01 ~ 2026-04',
    generatedAt: new Date().toISOString(),
    fundOverview: {
        initialCapital: 15000,
        currentEquity: 19827.50,
        totalDeposit: 15000,
        totalWithdraw: 0,
        netPnl: 4827.50,
        netReturnPct: 32.18,
    },
    performanceSummary: {
        totalRealizedPnl: 4827.50,
        unrealizedPnl: 185.30,
        totalReturnPct: 32.18,
        annualizedReturnPct: 38.4,
        sharpeRatio: 1.85,
        sortinoRatio: 2.42,
        maxDrawdownPct: 8.3,
        maxDrawdownDuration: '12 天',
        calmarRatio: 1.54,
    },
    tradeStats: {
        totalTrades: 52,
        winCount: 32,
        lossCount: 20,
        winRatePct: 61.5,
        avgWin: 215.80,
        avgLoss: -135.50,
        profitFactor: 2.15,
        avgHoldingMinutes: 480,
        avgTradesPerDay: 2.4,
    },
    bestPerformance: {
        bestTrade: { symbol: 'BTC/USDT', pnl: 1250, pnlPct: 5.8, date: '2026-02-14' },
        bestDay: { date: '2026-02-14', pnl: 1680 },
        bestWeek: { week: '2026-W07', pnl: 2150 },
        bestMonth: { month: '2026-04', pnl: 2797.50 },
        longestWinStreak: 7,
    },
    areasForImprovement: {
        worstTrade: { symbol: 'BNB/USDT', pnl: -540, pnlPct: -4.2, date: '2026-03-08' },
        worstDay: { date: '2026-03-08', pnl: -680 },
        longestLossStreak: 3,
        avgLossStreak: 1.8,
        revengeTradeCount: 2,
    },
    categorizedAnalysis: {
        bySource: {
            spot: { pnl: 2100, count: 18, winRate: 66.7 },
            futures: { pnl: 1800, count: 15, winRate: 60.0 },
            hedge: { pnl: 350, count: 8, winRate: 62.5 },
            dca: { pnl: 580, count: 9, winRate: 55.6 },
            manual: { pnl: -2.5, count: 2, winRate: 50.0 },
        },
        bySymbol: {
            'BTC/USDT': { pnl: 2450, count: 16, winRate: 68.8 },
            'ETH/USDT': { pnl: 1380, count: 14, winRate: 64.3 },
            'SOL/USDT': { pnl: 620, count: 10, winRate: 50.0 },
        },
        byTimeOfDay: {
            '08-12': { pnl: 1200, count: 15 },
            '12-18': { pnl: 2100, count: 20 },
            '18-24': { pnl: 1527.5, count: 17 },
        },
    },
    suggestions: [
        '保持现有的趋势跟踪策略，胜率和盈亏比表现优异',
        '减少 BNB/USDT 的操作频率，该交易对亏损占比较高',
        '注意控制连续亏损后的情绪交易，本期出现 2 次疑似报复性交易',
        '建议增加止盈策略，部分盈利交易未能最大化收益',
    ],
};

// =========================================================================
// 主组件
// =========================================================================

const ProfitLossAnalysisPage: React.FC = memo(() => {
    return (
        <div className="w-full min-h-screen p-4 lg:p-6 bg-base">
            {/* 页面标题 + 下载报告 */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary">盈亏分析</h1>
                    <p className="text-sm text-dim mt-1">实时反馈 · 多维指标 · 图表可视化 · 报告下载</p>
                </div>
                <Suspense fallback={null}>
                    <AnalysisReport report={MOCK_COMPREHENSIVE} />
                </Suspense>
            </div>

            {/* 垂直分区布局 */}
            <div className="space-y-6">
                {/* 1. 盈亏实时反馈 */}
                <Suspense fallback={<LoadingPanel className="h-32" />}>
                    <RealtimeFeedback feedback={MOCK_REALTIME} />
                </Suspense>

                {/* 2. 总盈亏分析 */}
                <Suspense fallback={<LoadingPanel className="h-64" />}>
                    <TotalPnlAnalysis report={MOCK_REPORT} />
                </Suspense>

                {/* 3. 分类盈亏分析 */}
                <Suspense fallback={<LoadingPanel className="h-48" />}>
                    <ClassificationAnalysis report={MOCK_REPORT} />
                </Suspense>

                {/* 4. 多维绩效指标 */}
                <Suspense fallback={<LoadingPanel className="h-48" />}>
                    <MultiDimensionMetrics metrics={MOCK_METRICS} />
                </Suspense>

                {/* 5. 可视化图表 */}
                <Suspense fallback={<LoadingPanel className="h-72" />}>
                    <ChartsVisualization report={MOCK_REPORT} />
                </Suspense>
            </div>
        </div>
    );
});

ProfitLossAnalysisPage.displayName = 'ProfitLossAnalysisPage';
export default ProfitLossAnalysisPage;