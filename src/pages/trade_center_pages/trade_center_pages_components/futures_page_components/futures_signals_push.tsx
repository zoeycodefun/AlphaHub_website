/**
 * 合约核心信号区（FuturesSignalsPush） ⚠️ 核心信号区 — 后期重点迭代
 *
 * 右侧栏合约综合信号推送面板：
 *
 *   1. 信号方向 & 等级面板（极强多头 → 极强空头，7 个等级）
 *   2. 综合评分仪表盘（0-100 分）
 *   3. 四大维度得分概览（技术/链上/资金费率/情绪）
 *   4. 点击展开信号详情弹窗（完整维度数据 + 操作建议）
 *   5. 参考价位（做多/做空入场 + 止损 + 目标）
 *
 * 数据来源：后续接入信号引擎 WebSocket，当前使用 Mock 数据。
 * 此处使用的指标为已验证有效的核心指标子集，完整指标库在信号研究中心。
 *
 * 【核心信号区 — 后期维护者请搜索此标记定位需要调整的信号指标】
 */
import React, { memo, useState, useCallback, useMemo } from 'react';
import type {
    FuturesSignalRecord,
    FuturesSignalLevel,
    FuturesSignalLevelConfig,
    FuturesSignalDirection,
} from '../../type/futures_trading_types';

// =========================================================================
// 信号等级配置
// =========================================================================

const SIGNAL_LEVELS: FuturesSignalLevelConfig[] = [
    { level: 'extreme_long',  label: '极强多头', range: [80, 100], color: 'text-green-300',  bgColor: 'bg-green-500/20',  direction: 'long',    description: '趋势延续，强势做多加仓' },
    { level: 'strong_long',   label: '强烈多头', range: [60, 80],  color: 'text-green-400',  bgColor: 'bg-green-400/15',  direction: 'long',    description: '上涨趋势，做多为主' },
    { level: 'neutral_long',  label: '中性偏多', range: [50, 60],  color: 'text-blue-400',   bgColor: 'bg-blue-500/15',   direction: 'long',    description: '轻仓做多 / 观察确认' },
    { level: 'neutral',       label: '中性',     range: [40, 50],  color: 'text-muted',   bgColor: 'bg-base0/15',   direction: 'neutral', description: '震荡区间，保持观望' },
    { level: 'neutral_short', label: '中性偏空', range: [30, 40],  color: 'text-yellow-400', bgColor: 'bg-yellow-500/15', direction: 'short',   description: '轻仓做空 / 观察确认' },
    { level: 'strong_short',  label: '强烈空头', range: [20, 30],  color: 'text-orange-400', bgColor: 'bg-orange-500/15', direction: 'short',   description: '下跌趋势，做空为主' },
    { level: 'extreme_short', label: '极强空头', range: [0, 20],   color: 'text-red-400',    bgColor: 'bg-red-500/20',    direction: 'short',   description: '趋势崩塌，强势做空' },
];

function getSignalLevelConfig(level: FuturesSignalLevel): FuturesSignalLevelConfig {
    return SIGNAL_LEVELS.find(s => s.level === level) ?? SIGNAL_LEVELS[3];
}

function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-300';
    if (score >= 60) return 'text-green-400';
    if (score >= 50) return 'text-blue-400';
    if (score >= 40) return 'text-muted';
    if (score >= 30) return 'text-yellow-400';
    if (score >= 20) return 'text-orange-400';
    return 'text-red-400';
}

function getScoreBarColor(score: number): string {
    if (score >= 60) return 'bg-green-400';
    if (score >= 50) return 'bg-blue-400';
    if (score >= 40) return 'bg-gray-400';
    if (score >= 30) return 'bg-yellow-400';
    return 'bg-red-400';
}

function getDirectionIcon(direction: FuturesSignalDirection): string {
    if (direction === 'long') return '📈';
    if (direction === 'short') return '📉';
    return '➡️';
}

function getDirectionColor(direction: FuturesSignalDirection): string {
    if (direction === 'long') return 'text-green-400';
    if (direction === 'short') return 'text-red-400';
    return 'text-muted';
}

// =========================================================================
// Mock 数据 【核心信号区 — 后期维护者请在此调整涉及的指标参数】
// =========================================================================

const MOCK_SIGNAL: FuturesSignalRecord = {
    id: 'fs-001',
    symbol: 'BTC/USDT',
    currentPrice: 68450.20,
    signalDirection: 'long',
    signalLevel: 'strong_long',
    signalLevelLabel: '强烈多头',
    compositeScore: 72,
    signalStrength: '72%',
    confidence: 78,
    recommendation: '技术面多头排列，资金费率处于中性偏低区间（0.005%），持仓量持续增加配合价格上涨，多头延续概率较大。建议轻仓做多，止损设在 $66,200 下方。',
    technical: {
        score: 75,
        trendDirection: 'up',
        trendStrength: 72,
        patternDetected: '上升三角形 (Ascending Triangle)',
        supportLevels: [66200, 65000, 63500],
        resistanceLevels: [70000, 72000, 74500],
        indicators: { RSI: 62, MACD: 0.45, 'MA20': 67200, 'MA50': 65800, 'MA200': 58400, 'BB_upper': 71200, 'BB_lower': 65800 },
        longSignals: ['MACD 金叉', 'MA20 > MA50 多头排列', 'RSI 62 中性偏强', '布林带收窄突破上轨'],
        shortSignals: ['RSI 接近超买区', '72000 强阻力位'],
    },
    onchain: {
        score: 70,
        exchangeNetFlow: -2340,
        exchangeFlowDirection: 'outflow',
        whaleActivity: '前 100 地址过去 24h 净增持 1,850 BTC',
        whaleAccumulatingCount: 23,
        utxoLongTermHolderPct: 68.5,
    },
    funding: {
        score: 68,
        currentFundingRate: 0.005,
        fundingRateTrend: 'stable',
        openInterest: 18500000000,
        oiChange24h: 3.2,
        oiPriceSignal: '上涨+增仓=趋势延续',
        longShortRatio: 1.12,
        longLiquidation24h: 45000000,
        shortLiquidation24h: 82000000,
        liquidationClusters: [
            { price: 66200, amount: 320000000, side: 'long' },
            { price: 70500, amount: 280000000, side: 'short' },
        ],
    },
    sentiment: {
        score: 65,
        fearGreedIndex: 68,
        fearGreedLabel: '贪婪',
        socialSentiment: 0.35,
        macroNewsSummary: '美联储暗示年内降息两次，纳指连涨三天',
        dxy: 103.8,
        nasdaqChange: 1.2,
    },
    microstructure: {
        buyWalls: [{ price: 67800, size: 450 }, { price: 67000, size: 320 }],
        sellWalls: [{ price: 70000, size: 580 }, { price: 72000, size: 420 }],
        aggressiveBuyVolume: 285000000,
        aggressiveSellVolume: 210000000,
        liquidationMap: [
            { price: 66200, liquidationAmount: 320000000, side: 'long' },
            { price: 70500, liquidationAmount: 280000000, side: 'short' },
        ],
    },
    referencePrices: {
        longEntryZone: [67500, 68200],
        shortEntryZone: [70500, 71200],
        longStopLoss: 66200,
        shortStopLoss: 72500,
        longTarget: 72000,
        shortTarget: 65000,
    },
    signalAccuracy: { accuracy7d: 71.5, accuracy30d: 68.2 },
    generatedAt: new Date().toISOString(),
};

// =========================================================================
// 子组件：维度得分条
// =========================================================================

const DimensionBar: React.FC<{ label: string; score: number; icon: string }> = memo(({ label, score, icon }) => (
    <div className="flex items-center gap-2">
        <span className="text-[10px] shrink-0 w-4">{icon}</span>
        <span className="text-[10px] text-dim w-14 shrink-0">{label}</span>
        <div className="flex-1 bg-surface rounded-full h-1.5">
            <div className={`h-full rounded-full transition-all ${getScoreBarColor(score)}`} style={{ width: `${score}%` }} />
        </div>
        <span className={`text-[10px] font-mono w-7 text-right ${getScoreColor(score)}`}>{score}</span>
    </div>
));
DimensionBar.displayName = 'DimensionBar';

// =========================================================================
// 子组件：信号详情弹窗
// =========================================================================

interface SignalDetailModalProps {
    signal: FuturesSignalRecord;
    onClose: () => void;
}

type DetailTab = 'overview' | 'technical' | 'onchain' | 'funding' | 'sentiment';

const SignalDetailModal: React.FC<SignalDetailModalProps> = memo(({ signal, onClose }) => {
    const [activeTab, setActiveTab] = useState<DetailTab>('overview');
    const config = getSignalLevelConfig(signal.signalLevel);

    const tabs: { key: DetailTab; label: string }[] = [
        { key: 'overview',  label: '总览' },
        { key: 'technical', label: '技术' },
        { key: 'onchain',   label: '链上' },
        { key: 'funding',   label: '资金费率' },
        { key: 'sentiment', label: '情绪' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="w-[85vw] max-w-2xl max-h-[80vh] bg-card border border-strong/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-4 py-3 border-b border-base flex items-center justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-primary">{signal.symbol}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>{config.label}</span>
                            <span className={`text-xs font-semibold ${getDirectionColor(signal.signalDirection)}`}>
                                {getDirectionIcon(signal.signalDirection)} {signal.signalDirection === 'long' ? '做多' : signal.signalDirection === 'short' ? '做空' : '观望'}
                            </span>
                        </div>
                        <p className="text-[10px] text-dim mt-0.5">
                            价格: ${signal.currentPrice.toLocaleString()} · 置信度: {signal.confidence}% · 准确率 7d: {signal.signalAccuracy.accuracy7d}%
                        </p>
                    </div>
                    <button onClick={onClose} className="text-dim hover:text-primary text-lg">✕</button>
                </div>

                {/* Tabs */}
                <div className="px-4 py-2 border-b border-base/50 flex gap-3 shrink-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`text-[11px] pb-1 transition-colors ${activeTab === tab.key ? 'text-blue-400 border-b border-blue-400 font-medium' : 'text-dim hover:text-secondary'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {/* ── 总览 ── */}
                    {activeTab === 'overview' && (
                        <div className="space-y-3">
                            <div>
                                <h4 className="text-[10px] text-dim mb-1">四维综合得分</h4>
                                <div className="space-y-1.5">
                                    <DimensionBar label="技术指标" score={signal.technical.score} icon="📊" />
                                    <DimensionBar label="链上数据" score={signal.onchain.score} icon="⛓️" />
                                    <DimensionBar label="资金费率" score={signal.funding.score} icon="💰" />
                                    <DimensionBar label="市场情绪" score={signal.sentiment.score} icon="🧠" />
                                </div>
                            </div>
                            <div className="bg-surface/50 rounded-lg p-3">
                                <h4 className="text-[10px] text-dim mb-1">操作建议</h4>
                                <p className="text-[11px] text-secondary leading-relaxed">{signal.recommendation}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-2">
                                    <span className="text-[9px] text-green-500">做多入场区间</span>
                                    <p className="text-xs text-primary font-mono mt-0.5">${signal.referencePrices.longEntryZone[0].toLocaleString()} - ${signal.referencePrices.longEntryZone[1].toLocaleString()}</p>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[9px] text-dim">止损 ${signal.referencePrices.longStopLoss.toLocaleString()}</span>
                                        <span className="text-[9px] text-green-400">目标 ${signal.referencePrices.longTarget.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2">
                                    <span className="text-[9px] text-red-500">做空入场区间</span>
                                    <p className="text-xs text-primary font-mono mt-0.5">${signal.referencePrices.shortEntryZone[0].toLocaleString()} - ${signal.referencePrices.shortEntryZone[1].toLocaleString()}</p>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[9px] text-dim">止损 ${signal.referencePrices.shortStopLoss.toLocaleString()}</span>
                                        <span className="text-[9px] text-red-400">目标 ${signal.referencePrices.shortTarget.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── 技术 ── */}
                    {activeTab === 'technical' && (
                        <div className="space-y-3">
                            <DetailRow label="趋势方向" value={signal.technical.trendDirection === 'up' ? '上涨' : signal.technical.trendDirection === 'down' ? '下跌' : '横盘'} />
                            <DetailRow label="趋势强度" value={`${signal.technical.trendStrength}/100`} />
                            {signal.technical.patternDetected && <DetailRow label="形态识别" value={signal.technical.patternDetected} />}
                            <div>
                                <span className="text-[10px] text-dim">支撑位</span>
                                <div className="flex gap-1.5 mt-0.5 flex-wrap">
                                    {signal.technical.supportLevels.map((p) => <PriceTag key={p} price={p} color="text-green-400 bg-green-500/10" />)}
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] text-dim">阻力位</span>
                                <div className="flex gap-1.5 mt-0.5 flex-wrap">
                                    {signal.technical.resistanceLevels.map((p) => <PriceTag key={p} price={p} color="text-red-400 bg-red-500/10" />)}
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] text-dim">关键技术指标</span>
                                <div className="grid grid-cols-3 gap-1.5 mt-1">
                                    {Object.entries(signal.technical.indicators).map(([k, v]) => (
                                        <div key={k} className="bg-surface/50 rounded px-2 py-1">
                                            <span className="text-[9px] text-dim">{k}</span>
                                            <span className="text-[10px] text-primary font-mono ml-1">{typeof v === 'number' && v > 100 ? v.toLocaleString() : v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {signal.technical.longSignals.length > 0 && (
                                <div>
                                    <span className="text-[10px] text-green-400">做多信号</span>
                                    <div className="space-y-0.5 mt-0.5">{signal.technical.longSignals.map((s, i) => <div key={i} className="text-[10px] text-secondary">• {s}</div>)}</div>
                                </div>
                            )}
                            {signal.technical.shortSignals.length > 0 && (
                                <div>
                                    <span className="text-[10px] text-red-400">做空信号</span>
                                    <div className="space-y-0.5 mt-0.5">{signal.technical.shortSignals.map((s, i) => <div key={i} className="text-[10px] text-secondary">• {s}</div>)}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── 链上 ── */}
                    {activeTab === 'onchain' && (
                        <div className="space-y-3">
                            <DetailRow label="交易所净流向" value={`${signal.onchain.exchangeFlowDirection === 'outflow' ? '净流出' : signal.onchain.exchangeFlowDirection === 'inflow' ? '净流入' : '中性'} ${Math.abs(signal.onchain.exchangeNetFlow).toLocaleString()} BTC`} />
                            <DetailRow label="巨鲸动向" value={signal.onchain.whaleActivity} />
                            <DetailRow label="巨鲸增持地址数" value={`${signal.onchain.whaleAccumulatingCount} 个`} />
                            <DetailRow label="UTXO 长期持有者占比" value={`${signal.onchain.utxoLongTermHolderPct}%`} />
                        </div>
                    )}

                    {/* ── 资金费率 ── */}
                    {activeTab === 'funding' && (
                        <div className="space-y-3">
                            <DetailRow label="当前资金费率" value={`${(signal.funding.currentFundingRate * 100).toFixed(4)}%`} />
                            <DetailRow label="费率趋势" value={signal.funding.fundingRateTrend === 'rising' ? '上升' : signal.funding.fundingRateTrend === 'falling' ? '下降' : '稳定'} />
                            <DetailRow label="持仓量 (OI)" value={`$${(signal.funding.openInterest / 1e9).toFixed(2)}B`} />
                            <DetailRow label="OI 24h 变化" value={`${signal.funding.oiChange24h > 0 ? '+' : ''}${signal.funding.oiChange24h}%`} />
                            <DetailRow label="OI+价格信号" value={signal.funding.oiPriceSignal} />
                            <DetailRow label="多空比" value={signal.funding.longShortRatio.toFixed(2)} />
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-green-500/5 rounded-lg p-2">
                                    <span className="text-[9px] text-dim">24h 空头爆仓</span>
                                    <p className="text-xs text-green-400 font-mono">${(signal.funding.shortLiquidation24h / 1e6).toFixed(1)}M</p>
                                </div>
                                <div className="bg-red-500/5 rounded-lg p-2">
                                    <span className="text-[9px] text-dim">24h 多头爆仓</span>
                                    <p className="text-xs text-red-400 font-mono">${(signal.funding.longLiquidation24h / 1e6).toFixed(1)}M</p>
                                </div>
                            </div>
                            {signal.funding.liquidationClusters.length > 0 && (
                                <div>
                                    <span className="text-[10px] text-dim">清算密集区</span>
                                    <div className="space-y-1 mt-1">
                                        {signal.funding.liquidationClusters.map((c, i) => (
                                            <div key={i} className={`text-[10px] px-2 py-1 rounded ${c.side === 'long' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                                ${c.price.toLocaleString()} · {c.side === 'long' ? '多头' : '空头'}清算 ${(c.amount / 1e6).toFixed(0)}M
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── 情绪 ── */}
                    {activeTab === 'sentiment' && (
                        <div className="space-y-3">
                            <DetailRow label="恐惧贪婪指数" value={`${signal.sentiment.fearGreedIndex} (${signal.sentiment.fearGreedLabel})`} />
                            <DetailRow label="社交媒体情绪" value={`${signal.sentiment.socialSentiment > 0 ? '+' : ''}${signal.sentiment.socialSentiment.toFixed(2)}`} />
                            <DetailRow label="美元指数 DXY" value={signal.sentiment.dxy.toString()} />
                            <DetailRow label="纳斯达克变化" value={`${signal.sentiment.nasdaqChange > 0 ? '+' : ''}${signal.sentiment.nasdaqChange}%`} />
                            <div className="bg-surface/50 rounded-lg p-2">
                                <span className="text-[9px] text-dim">宏观新闻摘要</span>
                                <p className="text-[10px] text-secondary mt-0.5">{signal.sentiment.macroNewsSummary}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-base text-[9px] text-secondary shrink-0">
                    ⚠️ 信号仅供参考，请做好风险控制 · 生成时间: {new Date(signal.generatedAt).toLocaleString('zh-CN')} · 准确率 30d: {signal.signalAccuracy.accuracy30d}%
                </div>
            </div>
        </div>
    );
});
SignalDetailModal.displayName = 'SignalDetailModal';

// =========================================================================
// 辅助子组件
// =========================================================================

const DetailRow: React.FC<{ label: string; value: string }> = memo(({ label, value }) => (
    <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] text-dim shrink-0">{label}</span>
        <span className="text-[10px] text-primary text-right">{value}</span>
    </div>
));
DetailRow.displayName = 'DetailRow';

const PriceTag: React.FC<{ price: number; color: string }> = memo(({ price, color }) => (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${color}`}>${price.toLocaleString()}</span>
));
PriceTag.displayName = 'PriceTag';

// =========================================================================
// 主组件
// =========================================================================

const FuturesSignalsPush = memo(function FuturesSignalsPush() {
    const [showDetail, setShowDetail] = useState(false);
    const signal = useMemo(() => MOCK_SIGNAL, []);
    const config = getSignalLevelConfig(signal.signalLevel);

    const handleOpenDetail = useCallback(() => setShowDetail(true), []);
    const handleCloseDetail = useCallback(() => setShowDetail(false), []);

    return (
        <div className="h-full bg-card rounded-lg flex flex-col overflow-hidden">
            {/* ─── 标题栏 ─────────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-base shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">核心信号区</span>
                    <span className="text-[10px] text-secondary">合约</span>
                </div>
                <span className="text-[10px] text-secondary">{signal.symbol}</span>
            </div>

            {/* ─── 信号方向 & 等级 ──────────────────────────── */}
            <div className="px-3 py-2 border-b border-base/50">
                <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
                    <span className={`text-lg font-bold ${getDirectionColor(signal.signalDirection)}`}>
                        {getDirectionIcon(signal.signalDirection)}
                    </span>
                </div>
                <p className="text-[10px] text-dim">{config.description}</p>
            </div>

            {/* ─── 综合评分 ─────────────────────────────────── */}
            <div className="px-3 py-2 border-b border-base/50">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-dim">综合评分</span>
                    <span className={`text-lg font-bold font-mono ${getScoreColor(signal.compositeScore)}`}>
                        {signal.compositeScore}
                    </span>
                </div>
                <div className="bg-surface rounded-full h-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${getScoreBarColor(signal.compositeScore)}`}
                        style={{ width: `${signal.compositeScore}%` }}
                    />
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-secondary">强度: {signal.signalStrength}</span>
                    <span className="text-[9px] text-secondary">置信度: {signal.confidence}%</span>
                </div>
            </div>

            {/* ─── 四维得分 ─────────────────────────────────── */}
            <div className="px-3 py-2 space-y-1.5 border-b border-base/50">
                <DimensionBar label="技术指标" score={signal.technical.score} icon="📊" />
                <DimensionBar label="链上数据" score={signal.onchain.score} icon="⛓️" />
                <DimensionBar label="资金费率" score={signal.funding.score} icon="💰" />
                <DimensionBar label="市场情绪" score={signal.sentiment.score} icon="🧠" />
            </div>

            {/* ─── 参考价位 ─────────────────────────────────── */}
            <div className="px-3 py-2 border-b border-base/50 space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] text-green-400">做多入场</span>
                    <span className="text-[10px] text-primary font-mono">${signal.referencePrices.longEntryZone[0].toLocaleString()} - ${signal.referencePrices.longEntryZone[1].toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[9px] text-red-400">做空入场</span>
                    <span className="text-[10px] text-primary font-mono">${signal.referencePrices.shortEntryZone[0].toLocaleString()} - ${signal.referencePrices.shortEntryZone[1].toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[9px] text-dim">多止损</span>
                    <span className="text-[10px] text-muted font-mono">${signal.referencePrices.longStopLoss.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[9px] text-dim">空止损</span>
                    <span className="text-[10px] text-muted font-mono">${signal.referencePrices.shortStopLoss.toLocaleString()}</span>
                </div>
            </div>

            {/* ─── 7级信号标尺 ──────────────────────────────── */}
            <div className="px-3 py-2 border-b border-base/50">
                <div className="flex gap-0.5">
                    {SIGNAL_LEVELS.map((lvl) => (
                        <div
                            key={lvl.level}
                            className={`flex-1 h-2 rounded-sm transition-all ${
                                lvl.level === signal.signalLevel
                                    ? `${lvl.bgColor} ring-1 ring-white/30`
                                    : 'bg-surface/50'
                            }`}
                            title={`${lvl.label} (${lvl.range[0]}-${lvl.range[1]}%)`}
                        />
                    ))}
                </div>
                <div className="flex justify-between mt-0.5">
                    <span className="text-[8px] text-red-400">空</span>
                    <span className="text-[8px] text-dim">中性</span>
                    <span className="text-[8px] text-green-400">多</span>
                </div>
            </div>

            {/* ─── OI + 费率快捷 ────────────────────────────── */}
            <div className="px-3 py-2 border-b border-base/50">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                        <span className="text-secondary">资金费率</span>
                        <span className={`ml-1 font-mono ${signal.funding.currentFundingRate > 0.01 ? 'text-red-400' : signal.funding.currentFundingRate < -0.01 ? 'text-green-400' : 'text-secondary'}`}>
                            {(signal.funding.currentFundingRate * 100).toFixed(4)}%
                        </span>
                    </div>
                    <div>
                        <span className="text-secondary">多空比</span>
                        <span className="ml-1 text-secondary font-mono">{signal.funding.longShortRatio.toFixed(2)}</span>
                    </div>
                    <div>
                        <span className="text-secondary">OI变化</span>
                        <span className={`ml-1 font-mono ${signal.funding.oiChange24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {signal.funding.oiChange24h > 0 ? '+' : ''}{signal.funding.oiChange24h}%
                        </span>
                    </div>
                    <div>
                        <span className="text-secondary">恐贪</span>
                        <span className="ml-1 text-secondary font-mono">{signal.sentiment.fearGreedIndex}</span>
                    </div>
                </div>
            </div>

            {/* ─── 查看详情 ─────────────────────────────────── */}
            <div className="px-3 py-2 mt-auto shrink-0">
                <button
                    onClick={handleOpenDetail}
                    className="w-full text-[11px] py-1.5 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors font-medium"
                >
                    查看完整信号详情
                </button>
            </div>

            {/* ─── 详情弹窗 ─────────────────────────────────── */}
            {showDetail && <SignalDetailModal signal={signal} onClose={handleCloseDetail} />}
        </div>
    );
});

FuturesSignalsPush.displayName = 'FuturesSignalsPush';

export default FuturesSignalsPush;
