/**
 * 信号分析中心主页面（Signals Analysis Center）
 *
 * 信号调优与组合优化中心，管理现货/合约信号的完整生命周期：
 *
 * ─── 布局 ────────────────────────────────────────────────────────
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │  顶部：标题 + 现货/合约 Tab 切换 + 管线状态               │
 *  ├──────────┬───────────────────────────────┬──────────────────┤
 *  │  左侧     │  中间                         │  右侧           │
 *  │  维度目录  │  综合信号仪表板               │  测试面板       │
 *  │  (信号树)  │  + 维度贡献条                 │  (测试记录)     │
 *  │           │  + AI 解读                    │                 │
 *  └──────────┴───────────────────────────────┴──────────────────┘
 *
 * 核心流程：候选信号 → 测试评估 → 回测验证 → 生产信号池
 * 当前使用 Mock 数据，后端 API 就绪后替换。
 */
import React, { useState, useCallback, useMemo, memo, Suspense, lazy } from 'react';
import type {
    SignalMarketType, SignalIndicatorItem, SignalTestRecord,
    SignalPipelineStatus, CompositeSignalResult, SignalDimensionSummary, SignalDimensionCategory,
} from './type/alpha_module_types';

// ─── 子组件懒加载 ──────────────────────────────────────────────────
const SignalDimensionCatalog = lazy(() => import('./trade_center_pages_components/signals_page_components/signal_dimension_catalog'));
const SignalCombinationDashboard = lazy(() => import('./trade_center_pages_components/signals_page_components/signal_combination_dashboard'));
const SignalTestingPanel = lazy(() => import('./trade_center_pages_components/signals_page_components/signal_testing_panel'));
const SignalPipelineStatusPanel = lazy(() => import('./trade_center_pages_components/signals_page_components/signal_pipeline_status'));

// ─── 加载占位 ──────────────────────────────────────────────────────
function LoadingPanel({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-card rounded-lg animate-pulse flex items-center justify-center ${className}`}>
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

// =========================================================================
// Mock 指标数据
// =========================================================================

const now = Date.now();

function ind(
    id: string, name: string, cat: SignalDimensionCategory, markets: SignalMarketType[],
    status: 'production' | 'testing' | 'candidate' | 'disabled', weight: number,
    signal: number, score: number, accuracy?: number, winRate?: number, sharpe?: number, dd?: number,
): SignalIndicatorItem {
    return {
        id, name, category: cat, markets, status, weight,
        currentSignal: signal, currentScore: score,
        accuracy, winRate, sharpeRatio: sharpe, maxDrawdown: dd,
        lastUpdated: new Date(now - Math.random() * 3600_000).toISOString(),
    };
}

const MOCK_INDICATORS: SignalIndicatorItem[] = [
    // ── 技术指标（现货+合约）──────────────────
    ind('t01', 'MACD 金/死叉',          'technical', ['spot', 'futures'], 'production', 0.12, 1, 78, 68, 62, 1.85, 8.2),
    ind('t02', 'RSI (14)',               'technical', ['spot', 'futures'], 'production', 0.10, 1, 71, 65, 58, 1.62, 9.5),
    ind('t03', 'EMA 交叉 (12/26)',       'technical', ['spot', 'futures'], 'production', 0.08, 1, 65, 61, 55, 1.41, 11.3),
    ind('t04', '布林带突破',              'technical', ['spot', 'futures'], 'production', 0.07, 0, 52, 58, 52, 1.28, 12.1),
    ind('t05', 'KDJ 金叉',              'technical', ['spot', 'futures'], 'testing',    0.06, 1, 68, 60, 54, 1.35, 10.8),
    ind('t06', 'VWAP 偏离',             'technical', ['spot', 'futures'], 'testing',    0.05, -1, 45, 55, 50, 1.15, 13.5),
    ind('t07', 'OBV 趋势确认',          'technical', ['spot', 'futures'], 'candidate',  0.04, 1, 60),
    ind('t08', 'Ichimoku 云图',          'technical', ['spot', 'futures'], 'candidate',  0.03, 0, 48),
    ind('t09', 'ATR 波动率',             'technical', ['spot', 'futures'], 'production', 0.06, 0, 55, 57, 51, 1.22, 14.0),
    ind('t10', 'Stochastic RSI',         'technical', ['spot', 'futures'], 'disabled',   0.00, 0, 38, 42, 40, 0.85, 18.5),

    // ── 链上数据（现货+合约）──────────────────
    ind('o01', 'MVRV Z-Score',           'onchain', ['spot', 'futures'], 'production', 0.15, 1, 72, 70, 63, 1.92, 7.8),
    ind('o02', '交易所净流入/流出',       'onchain', ['spot', 'futures'], 'production', 0.12, -1, 40, 66, 60, 1.78, 9.2),
    ind('o03', '巨鲸地址追踪',           'onchain', ['spot', 'futures'], 'testing',    0.08, 1, 65, 58, 53, 1.45, 11.5),
    ind('o04', 'UTXO 年龄分布',          'onchain', ['spot', 'futures'], 'candidate',  0.05, 0, 50),
    ind('o05', 'SOPR (花费产出利润率)',   'onchain', ['spot', 'futures'], 'production', 0.10, 1, 68, 64, 58, 1.65, 10.0),
    ind('o06', '活跃地址数',             'onchain', ['spot', 'futures'], 'testing',    0.06, 1, 62, 56, 51, 1.30, 12.8),
    ind('o07', '矿工余额变化',           'onchain', ['spot', 'futures'], 'candidate',  0.04, 0, 45),

    // ── 宏观经济（现货+合约）──────────────────
    ind('m01', 'DXY 美元指数',           'macro', ['spot', 'futures'], 'production', 0.15, -1, 35, 62, 57, 1.55, 10.5),
    ind('m02', 'NASDAQ 相关性',          'macro', ['spot', 'futures'], 'production', 0.12, 1, 70, 60, 55, 1.42, 11.8),
    ind('m03', '黄金价格走势',           'macro', ['spot', 'futures'], 'testing',    0.08, 0, 50, 55, 50, 1.18, 13.2),
    ind('m04', 'Fed 利率预期',           'macro', ['spot', 'futures'], 'production', 0.10, 1, 65, 58, 53, 1.38, 12.0),
    ind('m05', 'VIX 恐慌指数',           'macro', ['spot', 'futures'], 'testing',    0.06, -1, 42, 52, 48, 1.10, 14.5),

    // ── 市场情绪（现货+合约）──────────────────
    ind('s01', '恐惧与贪婪指数',         'sentiment', ['spot', 'futures'], 'production', 0.15, 1, 75, 68, 61, 1.88, 8.5),
    ind('s02', '社交媒体 NLP 情绪',      'sentiment', ['spot', 'futures'], 'production', 0.10, 1, 68, 62, 56, 1.55, 10.2),
    ind('s03', 'Google 搜索趋势',        'sentiment', ['spot', 'futures'], 'testing',    0.06, 0, 52, 53, 48, 1.08, 15.0),
    ind('s04', '资金流向追踪',           'sentiment', ['spot', 'futures'], 'candidate',  0.04, 1, 60),

    // ── 新闻事件（现货+合约）──────────────────
    ind('n01', '监管政策变动',           'news', ['spot', 'futures'], 'production', 0.12, 0, 55, 60, 55, 1.45, 11.0),
    ind('n02', '机构持仓变化',           'news', ['spot', 'futures'], 'production', 0.10, 1, 72, 65, 60, 1.72, 9.5),
    ind('n03', 'ETF 资金流',             'news', ['spot', 'futures'], 'testing',    0.08, 1, 70, 63, 57, 1.60, 10.0),
    ind('n04', '技术升级事件',           'news', ['spot', 'futures'], 'candidate',  0.05, 0, 48),
    ind('n05', '黑天鹅检测',             'news', ['spot', 'futures'], 'testing',    0.06, 0, 40, 50, 45, 1.05, 16.0),

    // ── 形态识别（仅合约）─────────────────────
    ind('p01', '头肩顶/底识别',          'pattern', ['futures'], 'production', 0.10, -1, 38, 62, 56, 1.50, 11.5),
    ind('p02', '双顶/双底识别',          'pattern', ['futures'], 'production', 0.08, 1, 72, 60, 54, 1.42, 12.0),
    ind('p03', '三角形突破',             'pattern', ['futures'], 'testing',    0.06, 0, 55, 56, 50, 1.25, 13.0),
    ind('p04', '旗形/楔形识别',          'pattern', ['futures'], 'candidate',  0.04, 1, 62),

    // ── 支撑/阻力位（仅合约）──────────────────
    ind('r01', 'Fibonacci 回撤位',       'support_resistance', ['futures'], 'production', 0.10, 1, 70, 64, 58, 1.68, 9.8),
    ind('r02', 'Pivot Points',           'support_resistance', ['futures'], 'production', 0.08, 1, 65, 60, 55, 1.48, 11.2),
    ind('r03', '成交量密集区',           'support_resistance', ['futures'], 'testing',    0.06, 0, 58, 57, 52, 1.32, 12.5),

    // ── 市场微观结构（仅合约）─────────────────
    ind('ms01', '订单簿深度分析',        'microstructure', ['futures'], 'production', 0.12, 1, 68, 66, 60, 1.75, 9.0),
    ind('ms02', '大额成交监控',          'microstructure', ['futures'], 'production', 0.08, -1, 42, 62, 57, 1.58, 10.5),
    ind('ms03', '撤单率分析',            'microstructure', ['futures'], 'testing',    0.05, 0, 50, 54, 49, 1.15, 14.0),
    ind('ms04', 'Bid-Ask Spread 监控',   'microstructure', ['futures'], 'candidate',  0.04, 0, 48),

    // ── 资金费率（仅合约）─────────────────────
    ind('f01', '实时资金费率',           'funding', ['futures'], 'production', 0.15, -1, 35, 70, 64, 1.90, 7.5),
    ind('f02', '资金费率趋势',           'funding', ['futures'], 'production', 0.10, -1, 40, 65, 58, 1.65, 9.8),
    ind('f03', '跨交易所费率差',         'funding', ['futures'], 'testing',    0.06, 0, 52, 58, 52, 1.35, 12.0),

    // ── 持仓量（仅合约）───────────────────────
    ind('oi01', '总持仓量变化',          'open_interest', ['futures'], 'production', 0.12, 1, 72, 68, 62, 1.82, 8.5),
    ind('oi02', '多空比变化',            'open_interest', ['futures'], 'production', 0.10, 1, 68, 64, 58, 1.65, 10.0),
    ind('oi03', '大户持仓变化',          'open_interest', ['futures'], 'testing',    0.06, -1, 42, 56, 50, 1.28, 13.0),

    // ── 爆仓数据（仅合约）─────────────────────
    ind('l01', '爆仓量热力图',           'liquidation', ['futures'], 'production', 0.12, 1, 70, 66, 60, 1.78, 8.8),
    ind('l02', '预估爆仓价位密集区',      'liquidation', ['futures'], 'production', 0.08, 1, 65, 62, 56, 1.55, 10.5),
    ind('l03', '级联爆仓风险指标',        'liquidation', ['futures'], 'testing',    0.06, -1, 38, 58, 52, 1.40, 11.5),
];

// =========================================================================
// Mock 测试记录
// =========================================================================

const MOCK_TESTS: SignalTestRecord[] = [
    {
        id: 'test1', indicatorId: 't05', indicatorName: 'KDJ 金叉', category: 'technical', market: 'spot',
        status: 'completed', testPeriod: '2024-01 ~ 2024-12', accuracy: 60, winRate: 54, sharpeRatio: 1.35, maxDrawdown: 10.8,
        totalSignals: 156, recommended: true, startedAt: new Date(now - 48 * 3600_000).toISOString(), completedAt: new Date(now - 24 * 3600_000).toISOString(),
    },
    {
        id: 'test2', indicatorId: 't06', indicatorName: 'VWAP 偏离', category: 'technical', market: 'spot',
        status: 'completed', testPeriod: '2024-01 ~ 2024-12', accuracy: 55, winRate: 50, sharpeRatio: 1.15, maxDrawdown: 13.5,
        totalSignals: 210, recommended: false, startedAt: new Date(now - 72 * 3600_000).toISOString(), completedAt: new Date(now - 48 * 3600_000).toISOString(),
    },
    {
        id: 'test3', indicatorId: 'o03', indicatorName: '巨鲸地址追踪', category: 'onchain', market: 'spot',
        status: 'running', testPeriod: '2024-06 ~ 2025-06', startedAt: new Date(now - 6 * 3600_000).toISOString(),
    },
    {
        id: 'test4', indicatorId: 'n03', indicatorName: 'ETF 资金流', category: 'news', market: 'spot',
        status: 'completed', testPeriod: '2024-03 ~ 2025-03', accuracy: 63, winRate: 57, sharpeRatio: 1.60, maxDrawdown: 10.0,
        totalSignals: 88, recommended: true, startedAt: new Date(now - 96 * 3600_000).toISOString(), completedAt: new Date(now - 72 * 3600_000).toISOString(),
    },
    {
        id: 'test5', indicatorId: 'ms03', indicatorName: '撤单率分析', category: 'microstructure', market: 'futures',
        status: 'completed', testPeriod: '2024-06 ~ 2025-06', accuracy: 54, winRate: 49, sharpeRatio: 1.15, maxDrawdown: 14.0,
        totalSignals: 340, recommended: false, startedAt: new Date(now - 120 * 3600_000).toISOString(), completedAt: new Date(now - 96 * 3600_000).toISOString(),
    },
    {
        id: 'test6', indicatorId: 'p03', indicatorName: '三角形突破', category: 'pattern', market: 'futures',
        status: 'running', testPeriod: '2024-09 ~ 2025-06', startedAt: new Date(now - 3 * 3600_000).toISOString(),
    },
    {
        id: 'test7', indicatorId: 'l03', indicatorName: '级联爆仓风险指标', category: 'liquidation', market: 'futures',
        status: 'completed', testPeriod: '2024-01 ~ 2025-06', accuracy: 58, winRate: 52, sharpeRatio: 1.40, maxDrawdown: 11.5,
        totalSignals: 125, recommended: true, startedAt: new Date(now - 144 * 3600_000).toISOString(), completedAt: new Date(now - 120 * 3600_000).toISOString(),
    },
    {
        id: 'test8', indicatorId: 'f03', indicatorName: '跨交易所费率差', category: 'funding', market: 'futures',
        status: 'completed', testPeriod: '2024-06 ~ 2025-03', accuracy: 58, winRate: 52, sharpeRatio: 1.35, maxDrawdown: 12.0,
        totalSignals: 180, recommended: false, startedAt: new Date(now - 168 * 3600_000).toISOString(), completedAt: new Date(now - 144 * 3600_000).toISOString(),
    },
];

// =========================================================================
// Mock 综合信号计算
// =========================================================================

function buildCompositeResult(market: SignalMarketType): CompositeSignalResult {
    const marketInds = MOCK_INDICATORS.filter(i => i.markets.includes(market) && i.status === 'production');

    // 按维度分组
    const dimMap = new Map<SignalDimensionCategory, SignalIndicatorItem[]>();
    for (const ind of marketInds) {
        const arr = dimMap.get(ind.category) || [];
        arr.push(ind);
        dimMap.set(ind.category, arr);
    }

    const DIM_LABELS: Record<string, { label: string; icon: string }> = {
        technical: { label: '技术指标', icon: '📈' }, onchain: { label: '链上数据', icon: '⛓️' },
        macro: { label: '宏观经济', icon: '🌍' }, sentiment: { label: '市场情绪', icon: '💭' },
        news: { label: '新闻事件', icon: '📰' }, pattern: { label: '形态识别', icon: '🔍' },
        support_resistance: { label: '支撑/阻力位', icon: '📊' }, microstructure: { label: '市场微观结构', icon: '🔬' },
        funding: { label: '资金费率', icon: '💰' }, open_interest: { label: '持仓量', icon: '📋' },
        liquidation: { label: '爆仓数据', icon: '💥' },
    };

    const dimensions: SignalDimensionSummary[] = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let bullishCount = 0;
    let bearishCount = 0;

    for (const [cat, inds] of dimMap) {
        const allMarketInds = MOCK_INDICATORS.filter(i => i.category === cat && i.markets.includes(market));
        const avgScore = Math.round(inds.reduce((s, i) => s + i.currentScore, 0) / inds.length);
        const avgSignal = inds.reduce((s, i) => s + i.currentSignal, 0) / inds.length;
        const dimWeight = inds.reduce((s, i) => s + i.weight, 0);
        const dir: 'bullish' | 'bearish' | 'neutral' = avgSignal > 0.2 ? 'bullish' : avgSignal < -0.2 ? 'bearish' : 'neutral';

        if (dir === 'bullish') bullishCount++;
        else if (dir === 'bearish') bearishCount++;

        totalWeightedScore += avgScore * dimWeight;
        totalWeight += dimWeight;

        const meta = DIM_LABELS[cat] || { label: cat, icon: '?' };
        dimensions.push({
            category: cat, label: meta.label, icon: meta.icon,
            totalIndicators: allMarketInds.length, activeIndicators: inds.length,
            compositeScore: avgScore, compositeDirection: dir, weight: +dimWeight.toFixed(2),
        });
    }

    const compositeScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 50;
    const totalDims = dimensions.length;
    const maxGroup = Math.max(bullishCount, bearishCount, totalDims - bullishCount - bearishCount);
    const agreement = totalDims > 0 ? +(maxGroup / totalDims).toFixed(2) : 0;

    const direction = compositeScore >= 75 ? 'strong_buy' : compositeScore >= 60 ? 'buy' :
                      compositeScore >= 45 ? 'neutral' : compositeScore >= 30 ? 'sell' : 'strong_sell';

    const LEVEL_MAP: Record<string, string> = {
        strong_buy: '7级·强烈看多', buy: '6级·看多', neutral: '4级·中性',
        sell: '2级·看空', strong_sell: '1级·强烈看空',
    };

    return {
        market, symbol: 'BTC/USDT', compositeScore, direction,
        signalLevel: LEVEL_MAP[direction] || '4级·中性',
        dimensions, dimensionAgreement: agreement,
        aiSummary: market === 'spot'
            ? '技术面 MACD 金叉确认，链上 MVRV 处于合理区间且交易所持续净流出，宏观面美联储降息预期升温。情绪面恐惧贪婪指数转为贪婪区域。多维度信号偏向看多，但需警惕短期过热回调风险。'
            : '技术面趋势向上，资金费率已转负暗示空头过度拥挤。持仓量稳步上升，爆仓热力图显示空头止损集中区在 72,000 附近。形态上突破三角形整理，上方阻力位 73,500。多维度合约信号偏向做多，建议适度加仓。',
        updatedAt: new Date().toISOString(),
    };
}

// =========================================================================
// Mock 管线状态
// =========================================================================

function buildPipelineStatus(market: SignalMarketType): SignalPipelineStatus {
    const marketInds = MOCK_INDICATORS.filter(i => i.markets.includes(market));
    return {
        market,
        productionCount: marketInds.filter(i => i.status === 'production').length,
        testingCount: marketInds.filter(i => i.status === 'testing').length,
        candidateCount: marketInds.filter(i => i.status === 'candidate').length,
        disabledCount: marketInds.filter(i => i.status === 'disabled').length,
        lastPromotedAt: new Date(now - 24 * 3600_000).toISOString(),
        lastTestRunAt: new Date(now - 3 * 3600_000).toISOString(),
    };
}

// =========================================================================
// 主组件
// =========================================================================

const SignalsAnalysisCenter: React.FC = memo(() => {
    const [market, setMarket] = useState<SignalMarketType>('spot');
    const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | undefined>();

    const compositeResult = useMemo(() => buildCompositeResult(market), [market]);
    const pipelineStatus = useMemo(() => buildPipelineStatus(market), [market]);

    const handleSelectIndicator = useCallback((ind: SignalIndicatorItem) => {
        setSelectedIndicatorId(prev => prev === ind.id ? undefined : ind.id);
    }, []);

    return (
        <div className="w-full h-full flex flex-col bg-base overflow-hidden">
            {/* ─── 顶部栏 ──────────────────────────────────── */}
            <div className="shrink-0 px-4 py-3 border-b border-base flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-lg font-bold text-primary leading-tight">信号分析中心</h1>
                        <p className="text-[10px] text-dim">信号调优 · 组合优化 · 管线管理</p>
                    </div>
                    {/* 市场 Tab */}
                    <div className="flex gap-1 bg-surface/60 rounded-lg p-0.5">
                        {([
                            { key: 'spot' as const, label: '现货信号', icon: '💰' },
                            { key: 'futures' as const, label: '合约信号', icon: '📊' },
                        ]).map(tab => (
                            <button key={tab.key} onClick={() => { setMarket(tab.key); setSelectedIndicatorId(undefined); }}
                                className={`text-xs px-3 py-1.5 rounded-md transition-all ${
                                    market === tab.key
                                        ? 'bg-blue-500/20 text-blue-400 font-medium shadow-sm'
                                        : 'text-muted hover:text-secondary hover:bg-surface-hover/30'
                                }`}>
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 管线状态内联 */}
                <div className="hidden lg:block min-w-[280px]">
                    <Suspense fallback={<LoadingPanel className="h-16" />}>
                        <SignalPipelineStatusPanel pipeline={pipelineStatus} />
                    </Suspense>
                </div>
            </div>

            {/* ─── 主三栏布局 ──────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* 左侧：维度目录 */}
                <div className="w-64 shrink-0 border-r border-base overflow-hidden">
                    <Suspense fallback={<LoadingPanel className="h-full" />}>
                        <SignalDimensionCatalog
                            indicators={MOCK_INDICATORS}
                            market={market}
                            onSelectIndicator={handleSelectIndicator}
                            selectedIndicatorId={selectedIndicatorId}
                        />
                    </Suspense>
                </div>

                {/* 中间：综合信号仪表板 */}
                <div className="flex-1 overflow-y-auto min-w-0 p-4">
                    <Suspense fallback={<LoadingPanel className="h-64" />}>
                        <SignalCombinationDashboard compositeResult={compositeResult} />
                    </Suspense>

                    {/* 选中指标详情 */}
                    {selectedIndicatorId && (
                        <SelectedIndicatorDetail
                            indicator={MOCK_INDICATORS.find(i => i.id === selectedIndicatorId)}
                        />
                    )}

                    {/* 管线状态（移动端） */}
                    <div className="lg:hidden mt-4">
                        <Suspense fallback={<LoadingPanel className="h-24" />}>
                            <SignalPipelineStatusPanel pipeline={pipelineStatus} />
                        </Suspense>
                    </div>
                </div>

                {/* 右侧：测试面板 */}
                <div className="w-72 shrink-0 border-l border-base overflow-hidden">
                    <Suspense fallback={<LoadingPanel className="h-full" />}>
                        <SignalTestingPanel
                            tests={MOCK_TESTS}
                            market={market}
                        />
                    </Suspense>
                </div>
            </div>
        </div>
    );
});

SignalsAnalysisCenter.displayName = 'SignalsAnalysisCenter';

// =========================================================================
// 单指标详情内联面板
// =========================================================================

interface SelectedIndicatorDetailProps {
    indicator: SignalIndicatorItem | undefined;
}

const SelectedIndicatorDetail: React.FC<SelectedIndicatorDetailProps> = memo(({ indicator }) => {
    if (!indicator) return null;

    const dirLabel = indicator.currentSignal > 0 ? '看多' : indicator.currentSignal < 0 ? '看空' : '中性';
    const dirColor = indicator.currentSignal > 0 ? 'text-green-400' : indicator.currentSignal < 0 ? 'text-red-400' : 'text-muted';
    const statusCfg: Record<string, { label: string; color: string }> = {
        production: { label: '生产中', color: 'text-green-400 bg-green-500/15' },
        testing: { label: '测试中', color: 'text-yellow-400 bg-yellow-500/15' },
        candidate: { label: '候选', color: 'text-blue-400 bg-blue-500/15' },
        disabled: { label: '已禁用', color: 'text-dim bg-base0/15' },
    };
    const st = statusCfg[indicator.status];

    return (
        <div className="mt-4 bg-card rounded-lg border border-base p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">{indicator.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${st.color}`}>{st.label}</span>
                </div>
                <span className={`text-sm font-mono font-bold ${dirColor}`}>{dirLabel}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-surface/60 rounded-lg p-2.5 text-center">
                    <div className="text-dim mb-0.5">当前评分</div>
                    <div className="text-primary font-bold font-mono text-base">{indicator.currentScore}</div>
                </div>
                <div className="bg-surface/60 rounded-lg p-2.5 text-center">
                    <div className="text-dim mb-0.5">权重</div>
                    <div className="text-primary font-mono text-base">{(indicator.weight * 100).toFixed(0)}%</div>
                </div>
                {indicator.accuracy !== undefined && (
                    <div className="bg-surface/60 rounded-lg p-2.5 text-center">
                        <div className="text-dim mb-0.5">准确率</div>
                        <div className={`font-mono text-base ${indicator.accuracy >= 60 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {indicator.accuracy}%
                        </div>
                    </div>
                )}
                {indicator.winRate !== undefined && (
                    <div className="bg-surface/60 rounded-lg p-2.5 text-center">
                        <div className="text-dim mb-0.5">胜率</div>
                        <div className={`font-mono text-base ${indicator.winRate >= 55 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {indicator.winRate}%
                        </div>
                    </div>
                )}
                {indicator.sharpeRatio !== undefined && (
                    <div className="bg-surface/60 rounded-lg p-2.5 text-center">
                        <div className="text-dim mb-0.5">夏普比率</div>
                        <div className={`font-mono text-base ${indicator.sharpeRatio >= 1.5 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {indicator.sharpeRatio.toFixed(2)}
                        </div>
                    </div>
                )}
                {indicator.maxDrawdown !== undefined && (
                    <div className="bg-surface/60 rounded-lg p-2.5 text-center">
                        <div className="text-dim mb-0.5">最大回撤</div>
                        <div className={`font-mono text-base ${indicator.maxDrawdown <= 10 ? 'text-green-400' : 'text-red-400'}`}>
                            {indicator.maxDrawdown}%
                        </div>
                    </div>
                )}
            </div>

            {indicator.description && (
                <div className="mt-3 text-[10px] text-dim leading-relaxed">{indicator.description}</div>
            )}
            {indicator.lastUpdated && (
                <div className="mt-2 text-[9px] text-secondary">
                    最近更新: {new Date(indicator.lastUpdated).toLocaleString('zh-CN')}
                </div>
            )}
        </div>
    );
});

SelectedIndicatorDetail.displayName = 'SelectedIndicatorDetail';

export default SignalsAnalysisCenter;