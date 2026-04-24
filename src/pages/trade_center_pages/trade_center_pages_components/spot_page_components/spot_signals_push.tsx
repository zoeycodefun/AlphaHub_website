/**
 * 核心信号区（SpotSignalsPush） ⚠️ 核心信号区 — 后期重点迭代
 *
 * 右侧栏综合信号推送面板：
 *
 *   1. 信号等级面板（极强买入 → 强烈卖出，7 个等级）
 *   2. 综合评分仪表盘（0-100 分）
 *   3. 四大维度得分概览（链上/技术/宏观/情绪）
 *   4. 点击展开信号详情弹窗（完整维度数据 + 操作建议）
 *   5. 参考价位 & 建仓建议
 *
 * 数据来源：后续接入信号引擎 WebSocket，当前使用 Mock 数据。
 * 此处使用的指标为已验证有效的核心指标子集，完整指标库在信号研究中心。
 */
import React, { memo, useState, useCallback, useMemo } from 'react';
import type {
    CoreSignalRecord,
    CoreSignalLevel,
    CoreSignalLevelConfig,
    OnchainDimensionScore,
    TechnicalDimensionScore,
    MacroDimensionScore,
    SentimentDimensionScore,
    ReferencePriceLevels,
    PositionSizeSuggestion,
} from '../../type/spot_trading_types';

// =========================================================================
// 信号等级配置
// =========================================================================

const SIGNAL_LEVELS: CoreSignalLevelConfig[] = [
    { level: 'extreme_buy',  label: '极强买入', range: [85, 100], color: 'text-green-300',  bgColor: 'bg-green-500/20',  description: '底部区域，重仓建仓' },
    { level: 'strong_buy',   label: '强烈买入', range: [70, 85],  color: 'text-green-400',  bgColor: 'bg-green-400/15',  description: '明确上涨趋势，加仓' },
    { level: 'dca_build',    label: '定投建仓', range: [55, 70],  color: 'text-blue-400',   bgColor: 'bg-blue-500/15',   description: '定投策略，分批建仓' },
    { level: 'hold',         label: '观望',     range: [45, 55],  color: 'text-muted',   bgColor: 'bg-base0/15',   description: '震荡区间，持币不动' },
    { level: 'partial_tp',   label: '部分止盈', range: [30, 45],  color: 'text-yellow-400', bgColor: 'bg-yellow-500/15', description: '获利区域，分批减仓' },
    { level: 'sell_reduce',  label: '卖出减仓', range: [15, 30],  color: 'text-orange-400', bgColor: 'bg-orange-500/15', description: '下跌趋势，减仓' },
    { level: 'strong_sell',  label: '强烈卖出', range: [0, 15],   color: 'text-red-400',    bgColor: 'bg-red-500/20',    description: '顶部区域，清仓离场' },
];

function getSignalLevelConfig(level: CoreSignalLevel): CoreSignalLevelConfig {
    return SIGNAL_LEVELS.find(s => s.level === level) ?? SIGNAL_LEVELS[3];
}

function getScoreColor(score: number): string {
    if (score >= 85) return 'text-green-300';
    if (score >= 70) return 'text-green-400';
    if (score >= 55) return 'text-blue-400';
    if (score >= 45) return 'text-muted';
    if (score >= 30) return 'text-yellow-400';
    if (score >= 15) return 'text-orange-400';
    return 'text-red-400';
}

function getScoreBarColor(score: number): string {
    if (score >= 70) return 'bg-green-400';
    if (score >= 55) return 'bg-blue-400';
    if (score >= 45) return 'bg-gray-400';
    if (score >= 30) return 'bg-yellow-400';
    return 'bg-red-400';
}

// =========================================================================
// Mock 数据
// =========================================================================

const MOCK_SIGNAL: CoreSignalRecord = {
    id: 'cs-001',
    symbol: 'BTC/USDT',
    currentPrice: 68450.20,
    change24h: 2.35,
    signalLevel: 'strong_buy',
    signalLevelLabel: '强烈买入',
    compositeScore: 76,
    signalStrength: '76%',
    confidence: 82,
    recommendation: '当前 BTC 处于上升通道中，链上数据显示交易所持续净流出，巨鲸地址增持明显。技术面 MACD 金叉确认，建议分批加仓。关注 $72,000 阻力位突破情况。',
    onchain: {
        score: 81,
        mvrv: 1.85,
        mvrvStatus: '合理区间（低估值扩张初期）',
        exchangeFlowDirection: 'net_outflow',
        exchangeFlowAmount: -12580,
        exchangeBalanceTrend: '持续减少（看涨信号）',
        whaleAction: 'accumulating',
        whaleAccumulatingCount: 23,
        sopr: 1.02,
        soprStatus: '盈利状态（持有者倾向持有）',
        activeAddresses: 920000,
        activeAddressesChange: 8.5,
        minerBalanceChange: -450,
        utxoLongTermHolderPct: 72.3,
    },
    technical: {
        score: 74,
        trend: 'up',
        volumeStatus: 'above_avg',
        indicators: {
            RSI: 62, MACD: 245.6, 'BB Width': 0.042, 'EMA 20': 67200, 'EMA 50': 64800,
            'Volume Ratio': 1.35, 'ATR': 1850, 'ADX': 32.5, 'CCI': 85,
        },
        buySignals: ['MACD 金叉', 'EMA20 > EMA50', 'RSI 中性偏强', '量能放大'],
        sellSignals: ['接近布林带上轨'],
    },
    macro: {
        score: 68,
        dxy: 104.2,
        dxyChange: -0.35,
        nasdaqChange: 1.2,
        goldPrice: 2340,
        goldChange: 0.15,
        fedRate: 5.25,
        nextFedMeeting: '2026-05-03',
        vix: 15.8,
    },
    sentiment: {
        score: 79,
        fearGreedIndex: 72,
        fearGreedLabel: '贪婪',
        socialSentiment: 0.65,
        searchTrend: 78,
        etfNetFlow7d: 2_150_000_000,
        institutionalActivity: 'BlackRock IBIT +$520M, Fidelity +$180M (本周)',
    },
    referencePrices: {
        buyZoneLow: 65000,
        buyZoneHigh: 68000,
        stopLoss: 62500,
        targetPrice: 75000,
    },
    positionSize: {
        conservative: '20-30%',
        moderate: '30-50%',
        aggressive: '50-80%',
    },
    signalAccuracy: {
        accuracy7d: 78,
        accuracy30d: 72,
    },
    dcaSuggestion: {
        weeklyAmount: '$500-1000',
        timing: '周一/周四分两次',
        note: '当前价格处于回调区间，适合定投建仓',
    },
    keyNews: [
        { title: 'BlackRock IBIT 单日净流入 $520M', impact: 'positive', source: 'Bloomberg', timestamp: new Date().toISOString() },
        { title: '美联储暗示年内可能降息两次', impact: 'positive', source: '华尔街日报', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { title: 'SEC 对 Ripple 案做出有利判决', impact: 'positive', source: 'CoinDesk', timestamp: new Date(Date.now() - 7200000).toISOString() },
    ],
    generatedAt: new Date().toISOString(),
};

// =========================================================================
// 子组件：维度得分条
// =========================================================================

const DimensionBar: React.FC<{ label: string; icon: string; score: number }> = memo(({ label, icon, score }) => (
    <div className="flex items-center gap-2">
        <span className="text-[10px] w-3 text-center">{icon}</span>
        <span className="text-[10px] text-dim w-10 shrink-0">{label}</span>
        <div className="flex-1 bg-surface-hover/30 rounded-full h-1.5">
            <div className={`h-full rounded-full transition-all ${getScoreBarColor(score)}`} style={{ width: `${score}%` }} />
        </div>
        <span className={`text-[10px] w-6 text-right font-mono ${getScoreColor(score)}`}>{score}</span>
    </div>
));
DimensionBar.displayName = 'DimensionBar';

// =========================================================================
// 子组件：信号详情弹窗
// =========================================================================

interface SignalDetailModalProps {
    signal: CoreSignalRecord;
    onClose: () => void;
}

const SignalDetailModal: React.FC<SignalDetailModalProps> = memo(({ signal, onClose }) => {
    const [detailTab, setDetailTab] = useState<'overview' | 'onchain' | 'technical' | 'macro' | 'sentiment'>('overview');
    const config = getSignalLevelConfig(signal.signalLevel);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="w-[85vw] max-w-2xl max-h-[80vh] bg-card border border-strong/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* 头部 */}
                <div className="px-5 py-3 border-b border-strong/50 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-primary">🪙 {signal.symbol} 信号详情</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color} font-medium`}>
                                {config.label}
                            </span>
                        </div>
                        <button onClick={onClose} className="text-dim hover:text-primary text-lg">✕</button>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-dim">
                        <span>💰 ${signal.currentPrice.toLocaleString()}</span>
                        <span className={signal.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                            📊 {signal.change24h >= 0 ? '+' : ''}{signal.change24h}%
                        </span>
                        <span>💪 {signal.signalStrength}</span>
                        <span>🎯 置信度 {signal.confidence}%</span>
                    </div>
                </div>

                {/* Tab */}
                <div className="px-5 py-1.5 border-b border-strong/30 flex gap-3 shrink-0">
                    {([
                        { key: 'overview' as const, label: '📋 总览' },
                        { key: 'onchain' as const, label: '⛓️ 链上' },
                        { key: 'technical' as const, label: '📈 技术' },
                        { key: 'macro' as const, label: '🌍 宏观' },
                        { key: 'sentiment' as const, label: '💭 情绪' },
                    ]).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setDetailTab(tab.key)}
                            className={`text-[11px] pb-1 transition-colors ${
                                detailTab === tab.key ? 'text-blue-400 border-b-2 border-blue-400 font-medium' : 'text-dim hover:text-secondary'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 内容区 */}
                <div className="flex-1 overflow-y-auto px-5 py-4 text-xs">
                    {detailTab === 'overview' && (
                        <div className="space-y-4">
                            {/* 操作建议 */}
                            <div>
                                <h4 className="text-[10px] text-dim font-medium mb-1">💡 操作建议</h4>
                                <p className="text-secondary leading-relaxed">{signal.recommendation}</p>
                            </div>

                            {/* 四维得分 */}
                            <div>
                                <h4 className="text-[10px] text-dim font-medium mb-2">📋 核心维度得分</h4>
                                <div className="space-y-1.5">
                                    <DimensionBar icon="⛓️" label="链上" score={signal.onchain.score} />
                                    <DimensionBar icon="📈" label="技术" score={signal.technical.score} />
                                    <DimensionBar icon="🌍" label="宏观" score={signal.macro.score} />
                                    <DimensionBar icon="💭" label="情绪" score={signal.sentiment.score} />
                                </div>
                            </div>

                            {/* 参考价位 */}
                            <div>
                                <h4 className="text-[10px] text-dim font-medium mb-1.5">📍 参考价位</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <PriceItem label="买入区间" value={`$${signal.referencePrices.buyZoneLow.toLocaleString()} - $${signal.referencePrices.buyZoneHigh.toLocaleString()}`} color="text-green-400" />
                                    <PriceItem label="止损参考" value={`$${signal.referencePrices.stopLoss.toLocaleString()}`} color="text-red-400" />
                                    <PriceItem label="目标价位" value={`$${signal.referencePrices.targetPrice.toLocaleString()}`} color="text-blue-400" />
                                    <PriceItem label="风险收益比" value={`1:${((signal.referencePrices.targetPrice - signal.currentPrice) / (signal.currentPrice - signal.referencePrices.stopLoss)).toFixed(1)}`} color="text-yellow-400" />
                                </div>
                            </div>

                            {/* 建仓建议 */}
                            <div>
                                <h4 className="text-[10px] text-dim font-medium mb-1.5">📊 建仓建议</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-surface/60 rounded-lg p-2 text-center">
                                        <span className="text-[9px] text-dim block">保守型</span>
                                        <span className="text-green-400 font-medium">{signal.positionSize.conservative}</span>
                                    </div>
                                    <div className="bg-surface/60 rounded-lg p-2 text-center">
                                        <span className="text-[9px] text-dim block">稳健型</span>
                                        <span className="text-blue-400 font-medium">{signal.positionSize.moderate}</span>
                                    </div>
                                    <div className="bg-surface/60 rounded-lg p-2 text-center">
                                        <span className="text-[9px] text-dim block">激进型</span>
                                        <span className="text-yellow-400 font-medium">{signal.positionSize.aggressive}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 历史准确率 */}
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] text-dim">📈 历史准确率</span>
                                <span className="text-green-400">7天: {signal.signalAccuracy.accuracy7d}%</span>
                                <span className="text-blue-400">30天: {signal.signalAccuracy.accuracy30d}%</span>
                            </div>

                            {/* 关键新闻 */}
                            {signal.keyNews.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] text-dim font-medium mb-1.5">📰 关键新闻</h4>
                                    <div className="space-y-1">
                                        {signal.keyNews.map((n, i) => (
                                            <div key={i} className="flex items-center gap-2 text-[10px]">
                                                <span className={n.impact === 'positive' ? 'text-green-400' : n.impact === 'negative' ? 'text-red-400' : 'text-muted'}>
                                                    {n.impact === 'positive' ? '🟢' : n.impact === 'negative' ? '🔴' : '⚪'}
                                                </span>
                                                <span className="text-secondary flex-1">{n.title}</span>
                                                <span className="text-secondary">{n.source}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 风险提示 */}
                            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-2.5">
                                <span className="text-[10px] text-yellow-400">⚠️ 风险提示：建议分批建仓，长期持有，切勿追涨杀跌。以上数据仅供参考。</span>
                            </div>

                            {/* 生成时间 */}
                            <div className="text-[9px] text-secondary">
                                ⏰ 生成时间: {new Date(signal.generatedAt).toLocaleString('zh-CN')}
                            </div>
                        </div>
                    )}

                    {detailTab === 'onchain' && (
                        <div className="space-y-3">
                            <DetailRow icon="📊" label="MVRV" value={`${signal.onchain.mvrv}`} desc={signal.onchain.mvrvStatus} />
                            <DetailRow icon="💹" label="交易所流向" value={`${signal.onchain.exchangeFlowDirection === 'net_outflow' ? '净流出' : signal.onchain.exchangeFlowDirection === 'net_inflow' ? '净流入' : '中性'}`} desc={`${Math.abs(signal.onchain.exchangeFlowAmount).toLocaleString()} BTC`} valueColor={signal.onchain.exchangeFlowDirection === 'net_outflow' ? 'text-green-400' : 'text-red-400'} />
                            <DetailRow icon="🐋" label="巨鲸动向" value={signal.onchain.whaleAction === 'accumulating' ? '增持中' : signal.onchain.whaleAction === 'distributing' ? '减持中' : '休眠'} desc={`${signal.onchain.whaleAccumulatingCount} 个地址增持`} />
                            <DetailRow icon="📈" label="SOPR" value={`${signal.onchain.sopr}`} desc={signal.onchain.soprStatus} />
                            <DetailRow icon="🔗" label="活跃地址" value={signal.onchain.activeAddresses.toLocaleString()} desc={`变化 ${signal.onchain.activeAddressesChange > 0 ? '+' : ''}${signal.onchain.activeAddressesChange}%`} />
                            <DetailRow icon="⛏️" label="矿工余额" value={`${signal.onchain.minerBalanceChange > 0 ? '+' : ''}${signal.onchain.minerBalanceChange} BTC`} desc={signal.onchain.minerBalanceChange < 0 ? '矿工减持（抛压）' : '矿工增持（入链）'} />
                            <DetailRow icon="🏦" label="交易所余额" value={signal.onchain.exchangeBalanceTrend} />
                            <DetailRow icon="🕐" label="UTXO 长期持有" value={`${signal.onchain.utxoLongTermHolderPct}%`} desc="1 年以上未动 UTXO 占比" />
                        </div>
                    )}

                    {detailTab === 'technical' && (
                        <div className="space-y-3">
                            <DetailRow icon="📈" label="趋势" value={signal.technical.trend === 'strong_up' ? '强势上涨' : signal.technical.trend === 'up' ? '上涨' : signal.technical.trend === 'sideways' ? '震荡' : '下跌'} />
                            <DetailRow icon="📊" label="量能" value={signal.technical.volumeStatus === 'heavy' ? '放量' : signal.technical.volumeStatus === 'above_avg' ? '偏高' : signal.technical.volumeStatus === 'average' ? '正常' : '缩量'} />

                            <div>
                                <h4 className="text-[10px] text-dim mb-1.5">关键指标</h4>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {Object.entries(signal.technical.indicators).map(([key, val]) => (
                                        <div key={key} className="bg-surface/40 rounded px-2 py-1">
                                            <span className="text-[9px] text-dim block">{key}</span>
                                            <span className="text-[11px] text-primary font-mono">{typeof val === 'number' && val > 100 ? val.toFixed(1) : val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {signal.technical.buySignals.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] text-green-400 mb-1">🟢 买入信号</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {signal.technical.buySignals.map(s => (
                                            <span key={s} className="text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {signal.technical.sellSignals.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] text-red-400 mb-1">🔴 卖出信号</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {signal.technical.sellSignals.map(s => (
                                            <span key={s} className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {detailTab === 'macro' && (
                        <div className="space-y-3">
                            <DetailRow icon="💵" label="美元指数 DXY" value={`${signal.macro.dxy}`} desc={`${signal.macro.dxyChange > 0 ? '+' : ''}${signal.macro.dxyChange}%（反向相关）`} valueColor={signal.macro.dxyChange < 0 ? 'text-green-400' : 'text-red-400'} />
                            <DetailRow icon="📱" label="纳斯达克指数" value={`${signal.macro.nasdaqChange > 0 ? '+' : ''}${signal.macro.nasdaqChange}%`} desc="正相关，科技股联动" valueColor={signal.macro.nasdaqChange > 0 ? 'text-green-400' : 'text-red-400'} />
                            <DetailRow icon="🥇" label="黄金价格" value={`$${signal.macro.goldPrice.toLocaleString()}`} desc={`${signal.macro.goldChange > 0 ? '+' : ''}${signal.macro.goldChange}%（数字黄金对比）`} />
                            <DetailRow icon="🏛️" label="美联储利率" value={`${signal.macro.fedRate}%`} desc={signal.macro.nextFedMeeting ? `下次会议: ${signal.macro.nextFedMeeting}` : ''} />
                            <DetailRow icon="😰" label="VIX 恐慌指数" value={`${signal.macro.vix}`} desc={signal.macro.vix > 25 ? '高波动（风险）' : signal.macro.vix > 20 ? '偏高' : '低波动（平静）'} valueColor={signal.macro.vix > 25 ? 'text-red-400' : 'text-green-400'} />
                        </div>
                    )}

                    {detailTab === 'sentiment' && (
                        <div className="space-y-3">
                            <DetailRow icon="😱" label="恐惧贪婪指数" value={`${signal.sentiment.fearGreedIndex}`} desc={signal.sentiment.fearGreedLabel} valueColor={signal.sentiment.fearGreedIndex > 70 ? 'text-yellow-400' : signal.sentiment.fearGreedIndex < 30 ? 'text-green-400' : 'text-secondary'} />
                            <DetailRow icon="📱" label="社交媒体情绪" value={`${(signal.sentiment.socialSentiment * 100).toFixed(0)}%`} desc="综合 Twitter/Reddit NLP 分析" valueColor={signal.sentiment.socialSentiment > 0.5 ? 'text-green-400' : 'text-red-400'} />
                            <DetailRow icon="🔍" label="搜索热度" value={`${signal.sentiment.searchTrend}`} desc="Google Trends BTC 搜索指数" />
                            <DetailRow icon="💼" label="ETF 7天净流入" value={`$${(signal.sentiment.etfNetFlow7d / 1e9).toFixed(2)}B`} desc={signal.sentiment.etfNetFlow7d > 0 ? '机构持续流入' : '机构流出'} valueColor={signal.sentiment.etfNetFlow7d > 0 ? 'text-green-400' : 'text-red-400'} />
                            <DetailRow icon="🏦" label="机构持仓" value="" desc={signal.sentiment.institutionalActivity} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
SignalDetailModal.displayName = 'SignalDetailModal';

// ── 辅助展示组件 ──

const DetailRow: React.FC<{ icon: string; label: string; value: string; desc?: string; valueColor?: string }> = memo(({ icon, label, value, desc, valueColor = 'text-primary' }) => (
    <div className="flex items-start gap-2 py-1.5 border-b border-base/30">
        <span className="text-[12px] mt-0.5">{icon}</span>
        <div className="flex-1">
            <div className="flex items-center justify-between">
                <span className="text-[10px] text-dim">{label}</span>
                <span className={`text-[11px] font-mono font-medium ${valueColor}`}>{value}</span>
            </div>
            {desc && <p className="text-[9px] text-secondary mt-0.5">{desc}</p>}
        </div>
    </div>
));
DetailRow.displayName = 'DetailRow';

const PriceItem: React.FC<{ label: string; value: string; color: string }> = memo(({ label, value, color }) => (
    <div className="bg-surface/60 rounded-lg p-2">
        <span className="text-[9px] text-dim block">{label}</span>
        <span className={`text-[11px] font-mono font-medium ${color}`}>{value}</span>
    </div>
));
PriceItem.displayName = 'PriceItem';

// =========================================================================
// 主组件
// =========================================================================

const SpotSignalsPush = memo(function SpotSignalsPush() {
    const [showDetail, setShowDetail] = useState(false);
    const signal = useMemo(() => MOCK_SIGNAL, []);
    const config = getSignalLevelConfig(signal.signalLevel);

    const handleOpenDetail = useCallback(() => setShowDetail(true), []);
    const handleCloseDetail = useCallback(() => setShowDetail(false), []);

    return (
        <div className="h-full bg-card rounded-lg flex flex-col overflow-hidden">
            {/* ─── 标题栏 ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-base shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-[13px]">🎯</span>
                    <span className="text-xs text-muted font-medium">核心信号区</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">实时</span>
            </div>

            {/* ─── 信号等级 + 综合评分 ─────────────────────────────── */}
            <div className="px-3 py-3 border-b border-base/50 shrink-0">
                {/* 信号等级大标签 */}
                <div className={`text-center py-2.5 rounded-lg mb-2 ${config.bgColor}`}>
                    <span className={`text-lg font-bold ${config.color}`}>{config.label}</span>
                    <span className={`text-[10px] ml-2 ${config.color} opacity-70`}>{config.range[0]}-{config.range[1]}%</span>
                </div>

                {/* 综合评分 */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-dim">综合评分</span>
                    <span className={`text-2xl font-bold font-mono ${getScoreColor(signal.compositeScore)}`}>
                        {signal.compositeScore}
                    </span>
                </div>

                {/* 置信度条 */}
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-dim">置信度</span>
                    <div className="flex-1 bg-surface-hover/30 rounded-full h-1.5">
                        <div className={`h-full rounded-full ${getScoreBarColor(signal.confidence)}`} style={{ width: `${signal.confidence}%` }} />
                    </div>
                    <span className="text-[10px] text-muted font-mono">{signal.confidence}%</span>
                </div>
            </div>

            {/* ─── 四大维度条形图 ──────────────────────────────────── */}
            <div className="px-3 py-2.5 border-b border-base/50 shrink-0 space-y-1.5">
                <DimensionBar icon="⛓️" label="链上" score={signal.onchain.score} />
                <DimensionBar icon="📈" label="技术" score={signal.technical.score} />
                <DimensionBar icon="🌍" label="宏观" score={signal.macro.score} />
                <DimensionBar icon="💭" label="情绪" score={signal.sentiment.score} />
            </div>

            {/* ─── 参考价位 ───────────────────────────────────────── */}
            <div className="px-3 py-2.5 border-b border-base/50 shrink-0">
                <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-surface/40 rounded px-2 py-1">
                        <span className="text-[9px] text-secondary block">买入区间</span>
                        <span className="text-[10px] text-green-400 font-mono">${signal.referencePrices.buyZoneLow.toLocaleString()}-${signal.referencePrices.buyZoneHigh.toLocaleString()}</span>
                    </div>
                    <div className="bg-surface/40 rounded px-2 py-1">
                        <span className="text-[9px] text-secondary block">止损参考</span>
                        <span className="text-[10px] text-red-400 font-mono">${signal.referencePrices.stopLoss.toLocaleString()}</span>
                    </div>
                    <div className="bg-surface/40 rounded px-2 py-1">
                        <span className="text-[9px] text-secondary block">目标价位</span>
                        <span className="text-[10px] text-blue-400 font-mono">${signal.referencePrices.targetPrice.toLocaleString()}</span>
                    </div>
                    <div className="bg-surface/40 rounded px-2 py-1">
                        <span className="text-[9px] text-secondary block">建仓(稳健)</span>
                        <span className="text-[10px] text-yellow-400 font-mono">{signal.positionSize.moderate}</span>
                    </div>
                </div>
            </div>

            {/* ─── 7 级标尺 ───────────────────────────────────────── */}
            <div className="px-3 py-2 border-b border-base/50 shrink-0">
                <div className="flex h-2 gap-0.5 rounded-full overflow-hidden">
                    {SIGNAL_LEVELS.map((sl) => {
                        const isActive = sl.level === signal.signalLevel;
                        return (
                            <div
                                key={sl.level}
                                className={`flex-1 ${sl.bgColor} transition-all ${isActive ? 'ring-1 ring-white/30 scale-y-125' : 'opacity-40'}`}
                                title={`${sl.label} (${sl.range[0]}-${sl.range[1]}%)`}
                            />
                        );
                    })}
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-[8px] text-red-400">卖出</span>
                    <span className="text-[8px] text-dim">观望</span>
                    <span className="text-[8px] text-green-400">买入</span>
                </div>
            </div>

            {/* ─── 操作建议摘要 ───────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
                <p className="text-[10px] text-muted leading-relaxed line-clamp-4">
                    {signal.recommendation}
                </p>

                {/* 关键新闻摘要 */}
                {signal.keyNews.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                        {signal.keyNews.slice(0, 2).map((n, i) => (
                            <div key={i} className="flex items-center gap-1 text-[9px]">
                                <span className={n.impact === 'positive' ? 'text-green-400' : 'text-red-400'}>
                                    {n.impact === 'positive' ? '▲' : '▼'}
                                </span>
                                <span className="text-dim truncate">{n.title}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── 查看详情按钮 ───────────────────────────────────── */}
            <div className="px-3 py-2 border-t border-base/50 shrink-0">
                <button
                    onClick={handleOpenDetail}
                    className="w-full text-[11px] py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors font-medium"
                >
                    查看完整信号详情
                </button>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-[8px] text-secondary">
                        准确率 7d:{signal.signalAccuracy.accuracy7d}% · 30d:{signal.signalAccuracy.accuracy30d}%
                    </span>
                    <span className="text-[8px] text-secondary">
                        {new Date(signal.generatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* 详情弹窗 */}
            {showDetail && <SignalDetailModal signal={signal} onClose={handleCloseDetail} />}
        </div>
    );
});

SpotSignalsPush.displayName = 'SpotSignalsPush';

export default SpotSignalsPush;
