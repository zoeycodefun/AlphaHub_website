/**
 * 山寨币持仓详情弹窗（CheckDetails / AltcoinDetailModal）
 *
 * Tab 式详情面板：
 *   1. K 线 + 成本线（简化条形图 + 成本标记）
 *   2. 项目信息（评分/赛道/TVL/描述/链接）
 *   3. 相关新闻（标题+来源+时间+情绪）
 *   4. 链上数据（持有者/流动性/巨鲸/Smart Money）
 *   5. 时间线（买入/卖出/研报更新/提醒触发等事件）
 */
import React, { memo, useState, useMemo } from 'react';
import type { AltcoinPositionDetail } from '../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface CheckDetailsProps {
    visible: boolean;
    onClose: () => void;
    detail: AltcoinPositionDetail | null;
}

type DetailTab = 'kline' | 'project' | 'news' | 'onchain' | 'timeline';

const TABS: { key: DetailTab; label: string; icon: string }[] = [
    { key: 'kline', label: 'K线', icon: '📈' },
    { key: 'project', label: '项目', icon: '📋' },
    { key: 'news', label: '新闻', icon: '📰' },
    { key: 'onchain', label: '链上', icon: '⛓️' },
    { key: 'timeline', label: '时间线', icon: '🕐' },
];

// =========================================================================
// Mock 数据工厂
// =========================================================================

function createMockDetail(symbol: string, entryPrice: number): AltcoinPositionDetail {
    const now = Date.now();
    const basePrice = entryPrice;
    const klineData = Array.from({ length: 30 }, (_, i) => {
        const open = basePrice * (0.85 + Math.random() * 0.35);
        const close = open * (0.97 + Math.random() * 0.06);
        const high = Math.max(open, close) * (1 + Math.random() * 0.03);
        const low = Math.min(open, close) * (1 - Math.random() * 0.03);
        return {
            time: new Date(now - (30 - i) * 86400000).toISOString().slice(0, 10),
            open: Math.round(open * 10000) / 10000,
            high: Math.round(high * 10000) / 10000,
            low: Math.round(low * 10000) / 10000,
            close: Math.round(close * 10000) / 10000,
            volume: Math.round(1000000 + Math.random() * 5000000),
        };
    });

    return {
        position: {
            id: 'mock', symbol, exchange: 'Binance', avgEntryPrice: entryPrice,
            currentPrice: entryPrice * 1.15, quantity: 100, status: 'holding',
            createdAt: new Date(now - 30 * 86400000).toISOString(),
            updatedAt: new Date().toISOString(),
        },
        klineData,
        costLine: entryPrice,
        projectInfo: {
            score: 78,
            category: 'Layer 1 / Smart Contract',
            chain: 'Solana',
            tvl: 4200000000,
            description: '高性能 L1 公链，采用 Proof of History 共识机制，TPS 超过 65,000。DeFi/NFT/Gaming 生态蓬勃发展，为以太坊最大竞争者之一。',
            website: 'https://solana.com',
            twitter: '@solana',
        },
        relatedNews: [
            { title: 'Solana Firedancer 验证器客户端即将上线主网', source: 'The Block', time: '2h ago', sentiment: 'positive' },
            { title: 'Solana DEX 交易量连续 3 周超越以太坊', source: 'DeFi Llama', time: '5h ago', sentiment: 'positive' },
            { title: 'Solana 网络出现短暂拥堵，团队正在排查', source: 'CoinDesk', time: '1d ago', sentiment: 'negative' },
            { title: '机构报告：Solana 生态 TVL 年增长 280%', source: 'Messari', time: '2d ago', sentiment: 'positive' },
            { title: 'Solana 基金会宣布新一轮生态资助计划', source: 'CryptoSlate', time: '3d ago', sentiment: 'neutral' },
        ],
        onchainData: {
            holders: 2450000,
            totalLiquidity: 8500000000,
            topHoldersPct: 12.3,
            smartMoneyFlow: 'inflow',
        },
        timeline: [
            { time: new Date(now - 30 * 86400000).toISOString(), event: '首次买入', type: 'buy', detail: `以 $${entryPrice} 买入 100 个` },
            { time: new Date(now - 20 * 86400000).toISOString(), event: '投研评分更新', type: 'research', detail: '评分从 72 提升至 78，生态数据持续向好' },
            { time: new Date(now - 10 * 86400000).toISOString(), event: '价格突破前高', type: 'alert', detail: `价格突破 $${(entryPrice * 1.1).toFixed(2)}，达到 30 日新高` },
            { time: new Date(now - 3 * 86400000).toISOString(), event: 'Smart Money 流入', type: 'onchain', detail: '检测到 3 个 Smart Money 地址大额买入' },
        ],
    };
}

// =========================================================================
// 子组件
// =========================================================================

/** 简化 K 线条形图 */
const KlineChart = memo<{ data: AltcoinPositionDetail['klineData']; costLine: number }>(
    function KlineChart({ data, costLine }) {
        const allPrices = data.flatMap(d => [d.high, d.low]);
        const maxP = Math.max(...allPrices);
        const minP = Math.min(...allPrices);
        const range = maxP - minP || 1;
        const costPct = ((costLine - minP) / range) * 100;

        return (
            <div className="relative">
                {/* 成本线 */}
                <div className="absolute left-0 right-0 border-t border-dashed border-yellow-500/60"
                    style={{ top: `${100 - costPct}%` }}>
                    <span className="absolute right-0 -top-3 text-[8px] text-yellow-400 bg-card px-1 rounded">
                        成本 ${costLine.toFixed(2)}
                    </span>
                </div>
                {/* K 线条 */}
                <div className="flex items-end gap-px h-40">
                    {data.map((d, i) => {
                        const isUp = d.close >= d.open;
                        const bodyTop = Math.max(d.open, d.close);
                        const bodyBot = Math.min(d.open, d.close);
                        const bodyH = ((bodyTop - bodyBot) / range) * 100;
                        const wickH = ((d.high - d.low) / range) * 100;
                        const offset = ((maxP - d.high) / range) * 100;
                        return (
                            <div key={i} className="flex-1 relative" style={{ height: '160px' }}>
                                {/* 影线 */}
                                <div className={`absolute left-1/2 -translate-x-1/2 w-px ${isUp ? 'bg-green-500/60' : 'bg-red-500/60'}`}
                                    style={{ top: `${offset}%`, height: `${wickH}%` }} />
                                {/* 实体 */}
                                <div className={`absolute left-0 right-0 mx-auto rounded-sm ${isUp ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{
                                        top: `${((maxP - bodyTop) / range) * 100}%`,
                                        height: `${Math.max(bodyH, 1)}%`,
                                        width: '60%',
                                        marginLeft: '20%',
                                    }} />
                            </div>
                        );
                    })}
                </div>
                {/* 日期标注 */}
                <div className="flex justify-between text-[8px] text-secondary mt-1">
                    <span>{data[0]?.time}</span>
                    <span>{data[Math.floor(data.length / 2)]?.time}</span>
                    <span>{data[data.length - 1]?.time}</span>
                </div>
            </div>
        );
    }
);

/** 时间线 item */
const TimelineItem = memo<{ item: AltcoinPositionDetail['timeline'][number]; isLast: boolean }>(
    function TimelineItem({ item, isLast }) {
        const typeColor: Record<string, string> = {
            buy: 'bg-green-500', sell: 'bg-red-500', research: 'bg-blue-500',
            alert: 'bg-yellow-500', onchain: 'bg-purple-500',
        };
        return (
            <div className="flex gap-3">
                <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${typeColor[item.type] || 'bg-base0'}`} />
                    {!isLast && <div className="w-px flex-1 bg-surface-hover/50" />}
                </div>
                <div className="pb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-primary font-medium">{item.event}</span>
                        <span className="text-[9px] text-secondary">{new Date(item.time).toLocaleDateString('zh-CN')}</span>
                    </div>
                    {item.detail && <p className="text-[9px] text-dim mt-0.5">{item.detail}</p>}
                </div>
            </div>
        );
    }
);

// =========================================================================
// 主组件
// =========================================================================

const CheckDetails: React.FC<CheckDetailsProps> = memo(({ visible, onClose, detail: propDetail }) => {
    const [activeTab, setActiveTab] = useState<DetailTab>('kline');

    // 如果没传 detail，用 mock
    const detail = useMemo(() => {
        if (propDetail) return propDetail;
        return createMockDetail('SOL/USDT', 145.20);
    }, [propDetail]);

    if (!visible) return null;

    const pos = detail.position;
    const pnlPct = pos.avgEntryPrice > 0 ? ((pos.currentPrice - pos.avgEntryPrice) / pos.avgEntryPrice) * 100 : 0;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-strong/50 rounded-xl w-full max-w-2xl mx-4 shadow-2xl flex flex-col" style={{ maxHeight: '85vh' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-strong/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-primary">{pos.symbol.replace('/USDT', '')}</span>
                        <span className="text-[10px] text-dim">{pos.symbol}</span>
                        <span className={`text-[10px] font-mono ${pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                        </span>
                    </div>
                    <button onClick={onClose} className="text-dim hover:text-primary text-lg">✕</button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-5 py-2 border-b border-strong/30 shrink-0">
                    {TABS.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`text-[10px] px-2.5 py-1 rounded flex items-center gap-1 ${
                                activeTab === tab.key ? 'bg-blue-500/20 text-blue-400' : 'text-dim hover:text-secondary'
                            }`}>
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto min-h-0 p-5">
                    {/* K 线 Tab */}
                    {activeTab === 'kline' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-dim">30 日 K 线 · 黄色虚线为成本价</span>
                                <span className="text-muted">当前: <span className="font-mono text-primary">${pos.currentPrice}</span></span>
                            </div>
                            <KlineChart data={detail.klineData} costLine={detail.costLine} />
                            <div className="grid grid-cols-4 gap-2 text-[10px]">
                                <div className="bg-card/40 rounded p-2 text-center">
                                    <div className="text-dim">成本价</div>
                                    <div className="text-yellow-400 font-mono">${pos.avgEntryPrice}</div>
                                </div>
                                <div className="bg-card/40 rounded p-2 text-center">
                                    <div className="text-dim">当前价</div>
                                    <div className="text-primary font-mono">${pos.currentPrice}</div>
                                </div>
                                <div className="bg-card/40 rounded p-2 text-center">
                                    <div className="text-dim">持仓量</div>
                                    <div className="text-primary font-mono">{pos.quantity}</div>
                                </div>
                                <div className="bg-card/40 rounded p-2 text-center">
                                    <div className="text-dim">市值</div>
                                    <div className="text-primary font-mono">${(pos.currentPrice * pos.quantity).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 项目 Tab */}
                    {activeTab === 'project' && detail.projectInfo && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-primary text-xs font-bold">
                                        {pos.symbol.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-primary">{pos.symbol.replace('/USDT', '')}</div>
                                        <div className="text-[9px] text-dim">{detail.projectInfo.category}</div>
                                    </div>
                                </div>
                                <div className="ml-auto flex items-center gap-1">
                                    <span className="text-[10px] text-dim">投研评分</span>
                                    <span className={`text-lg font-bold ${detail.projectInfo.score >= 70 ? 'text-green-400' : detail.projectInfo.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {detail.projectInfo.score}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[10px] text-muted leading-relaxed">{detail.projectInfo.description}</p>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div className="bg-card/40 rounded p-2.5">
                                    <span className="text-dim">链</span>
                                    <span className="float-right text-primary">{detail.projectInfo.chain}</span>
                                </div>
                                <div className="bg-card/40 rounded p-2.5">
                                    <span className="text-dim">TVL</span>
                                    <span className="float-right text-primary font-mono">${(detail.projectInfo.tvl / 1e9).toFixed(2)}B</span>
                                </div>
                                <div className="bg-card/40 rounded p-2.5">
                                    <span className="text-dim">官网</span>
                                    <span className="float-right text-blue-400">{detail.projectInfo.website}</span>
                                </div>
                                <div className="bg-card/40 rounded p-2.5">
                                    <span className="text-dim">Twitter</span>
                                    <span className="float-right text-blue-400">{detail.projectInfo.twitter}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 新闻 Tab */}
                    {activeTab === 'news' && (
                        <div className="space-y-1.5">
                            {detail.relatedNews.map((news, i) => {
                                const sentimentColor = news.sentiment === 'positive' ? 'text-green-400' : news.sentiment === 'negative' ? 'text-red-400' : 'text-muted';
                                return (
                                    <div key={i} className="bg-card/40 rounded-lg p-3 border border-strong/20 hover:border-strong/30 transition-colors">
                                        <div className="text-[10px] text-primary font-medium mb-1">{news.title}</div>
                                        <div className="flex items-center justify-between text-[9px]">
                                            <span className="text-dim">{news.source} · {news.time}</span>
                                            <span className={sentimentColor}>
                                                {news.sentiment === 'positive' ? '🟢 利好' : news.sentiment === 'negative' ? '🔴 利空' : '⚪ 中性'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 链上 Tab */}
                    {activeTab === 'onchain' && detail.onchainData && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-card/40 rounded-lg p-3 border border-strong/20">
                                    <div className="text-[9px] text-dim mb-1">持有者地址数</div>
                                    <div className="text-lg font-bold text-primary">{(detail.onchainData.holders / 1e6).toFixed(2)}M</div>
                                </div>
                                <div className="bg-card/40 rounded-lg p-3 border border-strong/20">
                                    <div className="text-[9px] text-dim mb-1">总流动性</div>
                                    <div className="text-lg font-bold text-primary">${(detail.onchainData.totalLiquidity / 1e9).toFixed(2)}B</div>
                                </div>
                                <div className="bg-card/40 rounded-lg p-3 border border-strong/20">
                                    <div className="text-[9px] text-dim mb-1">Top 10 持有者占比</div>
                                    <div className="text-lg font-bold text-yellow-400">{detail.onchainData.topHoldersPct}%</div>
                                </div>
                                <div className="bg-card/40 rounded-lg p-3 border border-strong/20">
                                    <div className="text-[9px] text-dim mb-1">Smart Money 资金流向</div>
                                    <div className={`text-lg font-bold ${detail.onchainData.smartMoneyFlow === 'inflow' ? 'text-green-400' : detail.onchainData.smartMoneyFlow === 'outflow' ? 'text-red-400' : 'text-muted'}`}>
                                        {detail.onchainData.smartMoneyFlow === 'inflow' ? '📈 净流入' : detail.onchainData.smartMoneyFlow === 'outflow' ? '📉 净流出' : '➡️ 中性'}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg p-3 text-[10px] text-blue-300">
                                💡 Smart Money 近 7 日保持净流入态势，Top 10 持有者占比较低说明筹码分散度较好。
                            </div>
                        </div>
                    )}

                    {/* 时间线 Tab */}
                    {activeTab === 'timeline' && (
                        <div>
                            {detail.timeline.map((item, i) => (
                                <TimelineItem key={i} item={item} isLast={i === detail.timeline.length - 1} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

CheckDetails.displayName = 'CheckDetails';
export default CheckDetails;
