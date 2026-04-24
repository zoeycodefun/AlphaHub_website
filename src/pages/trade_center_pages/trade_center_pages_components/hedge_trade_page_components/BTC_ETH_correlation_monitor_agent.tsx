/**
 * BTC/ETH 相关性追踪面板（CorrelationMonitorAgent）
 *
 * 核心功能：
 *   1. 实时相关系数展示（多时间窗口：1h/4h/1d/7d/30d/90d）
 *   2. BTC vs ETH 价格走势对比曲线
 *   3. 背离事件检测与标记（价格/动量/成交量维度）
 *   4. 延迟趋势识别（哪个资产领先 + 延迟时间）
 *   5. AI 辅助解释（每个背离事件附带可能解释）
 *
 * 数据来源：后续接入信号引擎 WebSocket，当前使用 Mock 数据。
 */
import React, { memo, useState, useMemo } from 'react';
import type {
    CorrelationTrackingData,
    CorrelationTimeframe,
    DivergenceEvent,
} from '../../type/alpha_module_types';

// =========================================================================
// Mock 数据
// =========================================================================

function generatePriceHistory(basePrice: number, points: number): { time: string; price: number; change: number }[] {
    const result: { time: string; price: number; change: number }[] = [];
    let price = basePrice;
    for (let i = points - 1; i >= 0; i--) {
        const change = (Math.random() - 0.48) * 2;
        price = price * (1 + change / 100);
        const time = new Date(Date.now() - i * 3600_000).toISOString();
        result.push({ time, price: Math.round(price * 100) / 100, change: Math.round(change * 100) / 100 });
    }
    return result;
}

const btcHistory = generatePriceHistory(68000, 24);
const ethHistory = generatePriceHistory(3850, 24);

const MOCK_DATA: CorrelationTrackingData = {
    currentCorrelation: 0.87,
    correlationByTimeframe: { '1h': 0.92, '4h': 0.89, '1d': 0.87, '7d': 0.85, '30d': 0.82, '90d': 0.79 },
    correlationHistory: btcHistory.map((p, i) => ({
        time: p.time,
        value: 0.75 + Math.sin(i / 4) * 0.12 + Math.random() * 0.05,
    })),
    btcPriceHistory: btcHistory,
    ethPriceHistory: ethHistory,
    recentDivergences: [
        {
            id: 'div-1', type: 'price_divergence', leadAsset: 'BTC',
            magnitude: 3.2, lagMinutes: 45, startedAt: new Date(Date.now() - 3_600_000).toISOString(),
            durationMinutes: 120, resolved: false,
            explanation: 'BTC 受美联储利率决议推动上涨，ETH 因 Gas 费争议暂时滞后。预计 ETH 将在 1-2 小时内跟涨。',
        },
        {
            id: 'div-2', type: 'momentum_divergence', leadAsset: 'ETH',
            magnitude: 2.1, lagMinutes: 30, startedAt: new Date(Date.now() - 7_200_000).toISOString(),
            durationMinutes: 90, resolved: true,
            explanation: 'ETH 生态 TVL 突破新高带动价格率先反弹，BTC 随后跟进。背离已回归。',
        },
        {
            id: 'div-3', type: 'volume_divergence', leadAsset: 'BTC',
            magnitude: 1.8, lagMinutes: 60, startedAt: new Date(Date.now() - 14_400_000).toISOString(),
            durationMinutes: 60, resolved: true,
            explanation: 'BTC 大额买单推高成交量，ETH 成交量未同步放大。可能是机构单边建仓。',
        },
    ],
    isDiverging: true,
    divergenceMagnitude: 3.2,
};

// =========================================================================
// 时间窗口选择器
// =========================================================================

const TIMEFRAMES: { key: CorrelationTimeframe; label: string }[] = [
    { key: '1h', label: '1H' }, { key: '4h', label: '4H' }, { key: '1d', label: '1D' },
    { key: '7d', label: '7D' }, { key: '30d', label: '30D' }, { key: '90d', label: '90D' },
];

// =========================================================================
// 辅助函数
// =========================================================================

function getCorrelationColor(value: number): string {
    if (value >= 0.8) return 'text-green-400';
    if (value >= 0.6) return 'text-blue-400';
    if (value >= 0.3) return 'text-yellow-400';
    if (value >= -0.3) return 'text-muted';
    if (value >= -0.6) return 'text-orange-400';
    return 'text-red-400';
}

function getCorrelationLabel(value: number): string {
    if (value >= 0.8) return '强正相关';
    if (value >= 0.6) return '中正相关';
    if (value >= 0.3) return '弱正相关';
    if (value >= -0.3) return '无显著相关';
    if (value >= -0.6) return '弱负相关';
    return '强负相关';
}

function getSeverityColor(severity: string): string {
    if (severity === 'critical') return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (severity === 'warning') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
}

function timeAgo(iso: string): string {
    const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}小时前`;
    return `${Math.floor(diffMin / 1440)}天前`;
}

// =========================================================================
// 子组件：背离事件卡片
// =========================================================================

const DivergenceCard = memo(function DivergenceCard({ event }: { event: DivergenceEvent }) {
    const typeLabel = event.type === 'price_divergence' ? '价格背离' : event.type === 'momentum_divergence' ? '动量背离' : '成交量背离';
    return (
        <div className={`rounded-lg border p-3 space-y-1.5 ${event.resolved ? 'bg-surface/30 border-strong/30 opacity-70' : 'bg-surface/60 border-strong/50'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${event.resolved ? 'bg-gray-600/20 text-muted' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {event.resolved ? '已回归' : '进行中'}
                    </span>
                    <span className="text-[10px] font-medium text-primary">{typeLabel}</span>
                </div>
                <span className="text-[9px] text-dim">{timeAgo(event.startedAt)}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
                <span className="text-dim">领先: <span className="text-blue-400 font-medium">{event.leadAsset}</span></span>
                <span className="text-dim">幅度: <span className="text-yellow-400">{event.magnitude}%</span></span>
                <span className="text-dim">延迟: <span className="text-orange-400">{event.lagMinutes}min</span></span>
                <span className="text-dim">持续: <span className="text-secondary">{event.durationMinutes}min</span></span>
            </div>
            <p className="text-[10px] text-muted leading-relaxed">{event.explanation}</p>
        </div>
    );
});
DivergenceCard.displayName = 'DivergenceCard';

// =========================================================================
// 子组件：相关系数柱状图（简易 CSS 版）
// =========================================================================

const CorrelationBar = memo(function CorrelationBar({ timeframe, value }: { timeframe: string; value: number }) {
    const barWidth = Math.abs(value) * 100;
    return (
        <div className="flex items-center gap-2">
            <span className="text-[9px] text-dim w-8 shrink-0">{timeframe}</span>
            <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${value >= 0.6 ? 'bg-green-500' : value >= 0.3 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                    style={{ width: `${barWidth}%` }}
                />
            </div>
            <span className={`text-[10px] font-mono w-10 text-right ${getCorrelationColor(value)}`}>
                {value.toFixed(2)}
            </span>
        </div>
    );
});
CorrelationBar.displayName = 'CorrelationBar';

// =========================================================================
// 子组件：价格走势迷你图（CSS bars 做简易可视化）
// =========================================================================

const MiniPriceChart = memo(function MiniPriceChart({
    label, history, color,
}: { label: string; history: { time: string; price: number; change: number }[]; color: string }) {
    const minP = Math.min(...history.map(h => h.price));
    const maxP = Math.max(...history.map(h => h.price));
    const range = maxP - minP || 1;
    const lastPrice = history[history.length - 1];
    const firstPrice = history[0];
    const totalChange = ((lastPrice.price - firstPrice.price) / firstPrice.price * 100).toFixed(2);
    const isPositive = Number(totalChange) >= 0;

    return (
        <div className="bg-surface/50 rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-dim">{label}</span>
                <div className="text-right">
                    <span className="text-xs text-primary font-mono">${lastPrice.price.toLocaleString()}</span>
                    <span className={`text-[10px] ml-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{totalChange}%
                    </span>
                </div>
            </div>
            <div className="flex items-end gap-px h-8">
                {history.map((h, i) => {
                    const height = ((h.price - minP) / range) * 100;
                    return (
                        <div key={i} className="flex-1 min-w-0">
                            <div
                                className={`rounded-t-sm transition-all ${color}`}
                                style={{ height: `${Math.max(height, 5)}%` }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
MiniPriceChart.displayName = 'MiniPriceChart';

// =========================================================================
// 主组件
// =========================================================================

const BTCETHCorrelationMonitorAgent = memo(function BTCETHCorrelationMonitorAgent() {
    const [selectedTimeframe, setSelectedTimeframe] = useState<CorrelationTimeframe>('1d');
    const data = useMemo(() => MOCK_DATA, []);

    return (
        <div className="h-full bg-card rounded-lg flex flex-col overflow-hidden">
            {/* ─── 标题栏 ───────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-base shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">📊 BTC/ETH 相关性追踪</span>
                    {data.isDiverging && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 animate-pulse">
                            ⚠️ 背离中 {data.divergenceMagnitude}%
                        </span>
                    )}
                </div>
                <div className="flex gap-0.5">
                    {TIMEFRAMES.map((tf) => (
                        <button
                            key={tf.key}
                            onClick={() => setSelectedTimeframe(tf.key)}
                            className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                                selectedTimeframe === tf.key
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'text-dim hover:text-secondary'
                            }`}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── 当前相关系数 ──────────────────────────────── */}
            <div className="px-4 py-3 border-b border-base/50">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <span className="text-[9px] text-dim">当前相关系数</span>
                        <div className={`text-2xl font-bold font-mono ${getCorrelationColor(data.correlationByTimeframe[selectedTimeframe])}`}>
                            {data.correlationByTimeframe[selectedTimeframe].toFixed(3)}
                        </div>
                        <span className={`text-[10px] ${getCorrelationColor(data.correlationByTimeframe[selectedTimeframe])}`}>
                            {getCorrelationLabel(data.correlationByTimeframe[selectedTimeframe])}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] text-dim block">对冲有效性</span>
                        <span className={`text-sm font-bold ${data.currentCorrelation > 0.7 ? 'text-green-400' : data.currentCorrelation > 0.4 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {data.currentCorrelation > 0.7 ? '高' : data.currentCorrelation > 0.4 ? '中' : '低'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ─── 各时间窗口相关系数 ────────────────────────── */}
            <div className="px-4 py-2.5 border-b border-base/50 space-y-1">
                {TIMEFRAMES.map((tf) => (
                    <CorrelationBar key={tf.key} timeframe={tf.label} value={data.correlationByTimeframe[tf.key]} />
                ))}
            </div>

            {/* ─── BTC vs ETH 价格走势 ───────────────────────── */}
            <div className="px-4 py-2.5 border-b border-base/50 space-y-1.5">
                <span className="text-[9px] text-dim">24H 价格走势</span>
                <MiniPriceChart label="BTC" history={data.btcPriceHistory} color="bg-orange-500" />
                <MiniPriceChart label="ETH" history={data.ethPriceHistory} color="bg-blue-500" />
            </div>

            {/* ─── 背离事件 ──────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto min-h-0 px-4 py-2.5 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-dim font-medium">
                        背离事件 ({data.recentDivergences.length})
                    </span>
                    <span className="text-[9px] text-secondary">
                        未回归: {data.recentDivergences.filter(d => !d.resolved).length}
                    </span>
                </div>
                {data.recentDivergences.map((d) => (
                    <DivergenceCard key={d.id} event={d} />
                ))}
            </div>
        </div>
    );
});

BTCETHCorrelationMonitorAgent.displayName = 'BTCETHCorrelationMonitorAgent';

export default BTCETHCorrelationMonitorAgent;
