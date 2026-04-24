
/**
 * 山寨币持仓管理页面（Altcoin Position Management Page）— 增强版
 *
 * 功能模块：
 *   1. 投资组合概览面板（总市值/成本/盈亏/最佳&最差表现者/持仓分布）
 *   2. 搜索 & 状态筛选
 *   3. 详细持仓表格（币种、买入信息、当前行情、成本、盈亏、项目状态、操作）
 *   4. 买入弹窗（增强：支持关联投研、卖出提醒）
 *   5. 详情弹窗（K 线 + 项目 + 新闻 + 链上 + 时间线）
 *
 * 数据来源：Mock，后续对接 invest_research 模块 + 交易所 API。
 */
import React, { Suspense, useState, useCallback, useMemo } from 'react';
import type { AltcoinPositionRecord, AltcoinPositionStatus, AddAltcoinPositionRequest, AltcoinPortfolioSummary as PortfolioSummaryType } from './type/alpha_module_types';

// =========================================================================
// 懒加载子组件
// =========================================================================

const BuyInfoWindow = React.lazy(() => import('./trade_center_pages_components/altcoin_position_management_page_components/buy_info_window'));
const CheckDetails = React.lazy(() => import('./trade_center_pages_components/altcoin_position_management_page_components/check_details'));
const ProjectStatus = React.lazy(() => import('./trade_center_pages_components/altcoin_position_management_page_components/project_status'));

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
// Mock 数据
// =========================================================================

const MOCK_POSITIONS: AltcoinPositionRecord[] = [
    {
        id: 'alt-1', symbol: 'SOL/USDT', coinName: 'Solana', exchange: 'Binance',
        avgEntryPrice: 145.20, currentPrice: 172.85, quantity: 50,
        change24h: 3.2, marketCapRank: 5, holdingDays: 56,
        status: 'holding', note: '生态持续增长，目标 $200',
        researchProjectId: 'rp-1', researchScore: 78, researchLatestUpdate: 'Firedancer 进展良好',
        sellAlertPrice: 200,
        buyTime: '2025-05-15T08:00:00Z', createdAt: '2025-05-15T08:00:00Z', updatedAt: '2025-07-10T12:00:00Z',
    },
    {
        id: 'alt-2', symbol: 'SUI/USDT', coinName: 'Sui', exchange: 'OKX',
        avgEntryPrice: 3.45, currentPrice: 4.12, quantity: 1000,
        change24h: 1.8, marketCapRank: 28, holdingDays: 40,
        status: 'holding', note: 'Move 语言生态看好',
        researchProjectId: 'rp-4', researchScore: 65, researchLatestUpdate: 'TVL 持续攀升',
        buyTime: '2025-06-01T10:00:00Z', createdAt: '2025-06-01T10:00:00Z', updatedAt: '2025-07-10T12:00:00Z',
    },
    {
        id: 'alt-3', symbol: 'PEPE/USDT', coinName: 'Pepe', exchange: 'Bybit',
        avgEntryPrice: 0.0000125, currentPrice: 0.0000098, quantity: 50000000,
        change24h: -5.3, marketCapRank: 24, holdingDays: 21,
        status: 'holding', note: 'Meme 板块轮动止损 0.000008',
        buyTime: '2025-06-20T14:00:00Z', createdAt: '2025-06-20T14:00:00Z', updatedAt: '2025-07-10T12:00:00Z',
    },
    {
        id: 'alt-4', symbol: 'ARB/USDT', coinName: 'Arbitrum', exchange: 'Binance',
        avgEntryPrice: 1.10, currentPrice: 0.95, quantity: 2000,
        change24h: -1.2, marketCapRank: 42, holdingDays: 92,
        status: 'partial_sold', note: '已卖出一半仓位锁定利润',
        researchProjectId: 'rp-4', researchScore: 58,
        buyTime: '2025-04-10T09:00:00Z', createdAt: '2025-04-10T09:00:00Z', updatedAt: '2025-07-05T10:00:00Z',
    },
    {
        id: 'alt-5', symbol: 'ONDO/USDT', coinName: 'Ondo Finance', exchange: 'Gate.io',
        avgEntryPrice: 0.82, currentPrice: 1.35, quantity: 3000,
        change24h: 6.1, marketCapRank: 68, holdingDays: 71,
        status: 'holding', note: 'RWA 赛道龙头',
        researchProjectId: 'rp-2', researchScore: 82, researchLatestUpdate: '与 BlackRock 合作推进',
        sellAlertPrice: 1.80,
        buyTime: '2025-05-01T11:00:00Z', createdAt: '2025-05-01T11:00:00Z', updatedAt: '2025-07-10T12:00:00Z',
    },
    {
        id: 'alt-6', symbol: 'TIA/USDT', coinName: 'Celestia', exchange: 'OKX',
        avgEntryPrice: 8.50, currentPrice: 6.20, quantity: 200,
        change24h: -0.8, marketCapRank: 55, holdingDays: 118,
        status: 'sold',
        buyTime: '2025-03-15T08:00:00Z', createdAt: '2025-03-15T08:00:00Z', updatedAt: '2025-06-01T15:00:00Z',
    },
];

// =========================================================================
// 辅助
// =========================================================================

function fmtUsd(v: number): string {
    if (Math.abs(v) < 0.01) return `$${v.toFixed(8)}`;
    return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtCompact(v: number): string {
    if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
    return `$${v.toFixed(2)}`;
}

const STATUS_CONFIG: Record<AltcoinPositionStatus, { label: string; color: string }> = {
    holding: { label: '持仓中', color: 'text-green-400 bg-green-500/10' },
    partial_sold: { label: '部分卖出', color: 'text-yellow-400 bg-yellow-500/10' },
    sold: { label: '已清仓', color: 'text-muted bg-base0/10' },
};

const STATUS_FILTERS: { value: AltcoinPositionStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'holding', label: '持仓中' },
    { value: 'partial_sold', label: '部分卖出' },
    { value: 'sold', label: '已清仓' },
];

const BAR_COLORS = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500', 'bg-cyan-500'];

// =========================================================================
// 主页面组件
// =========================================================================

export default function AltcoinPositionManagementPage() {
    const [positions, setPositions] = useState<AltcoinPositionRecord[]>(MOCK_POSITIONS);
    const [statusFilter, setStatusFilter] = useState<AltcoinPositionStatus | 'all'>('all');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [showBuyForm, setShowBuyForm] = useState(false);
    const [detailPos, setDetailPos] = useState<AltcoinPositionRecord | null>(null);

    // ── 筛选 ──
    const filteredPositions = useMemo(() => {
        let data = positions;
        if (statusFilter !== 'all') data = data.filter(p => p.status === statusFilter);
        if (searchKeyword.trim()) {
            const kw = searchKeyword.trim().toUpperCase();
            data = data.filter(p =>
                p.symbol.toUpperCase().includes(kw) ||
                (p.coinName ?? '').toUpperCase().includes(kw) ||
                (p.exchange ?? '').toUpperCase().includes(kw)
            );
        }
        return data;
    }, [positions, statusFilter, searchKeyword]);

    // ── 组合摘要 ──
    const summary: PortfolioSummaryType = useMemo(() => {
        const active = positions.filter(p => p.status !== 'sold');
        const totalMarketValue = active.reduce((a, p) => a + p.currentPrice * p.quantity, 0);
        const totalCost = active.reduce((a, p) => a + p.avgEntryPrice * p.quantity, 0);
        const totalPnl = totalMarketValue - totalCost;
        const pnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

        let best = active[0], worst = active[0];
        for (const p of active) {
            const pct = (p.currentPrice - p.avgEntryPrice) / p.avgEntryPrice;
            if (!best || pct > (best.currentPrice - best.avgEntryPrice) / best.avgEntryPrice) best = p;
            if (!worst || pct < (worst.currentPrice - worst.avgEntryPrice) / worst.avgEntryPrice) worst = p;
        }

        return {
            totalMarketValue, totalCostBasis: totalCost, unrealizedPnl: totalPnl, unrealizedPnlPct: pnlPct,
            holdingPositions: active.length, totalPositions: positions.length,
            bestPerformer: best ? { symbol: best.symbol, pnlPct: ((best.currentPrice - best.avgEntryPrice) / best.avgEntryPrice) * 100 } : undefined,
            worstPerformer: worst ? { symbol: worst.symbol, pnlPct: ((worst.currentPrice - worst.avgEntryPrice) / worst.avgEntryPrice) * 100 } : undefined,
        };
    }, [positions]);

    // ── 持仓分布 ──
    const distribution = useMemo(() => {
        const active = positions.filter(p => p.status !== 'sold');
        const total = active.reduce((a, p) => a + p.currentPrice * p.quantity, 0);
        if (total === 0) return [];
        return active.map((p, i) => ({
            symbol: p.symbol.replace('/USDT', ''),
            pct: ((p.currentPrice * p.quantity) / total) * 100,
            color: BAR_COLORS[i % BAR_COLORS.length],
        })).sort((a, b) => b.pct - a.pct);
    }, [positions]);

    // ── 回调 ──
    const handleSell = useCallback((id: string) => {
        setPositions(prev => prev.map(p => (p.id === id ? { ...p, status: 'sold' as const } : p)));
    }, []);

    const handleAdd = useCallback((req: AddAltcoinPositionRequest) => {
        const newPos: AltcoinPositionRecord = {
            id: `alt-${Date.now()}`, symbol: req.symbol, coinName: req.coinName, exchange: req.exchange,
            avgEntryPrice: req.avgEntryPrice, currentPrice: req.avgEntryPrice, quantity: req.quantity,
            status: 'holding', note: req.note, buyTime: req.buyTime,
            researchProjectId: req.researchProjectId, sellAlertPrice: req.sellAlertPrice,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        setPositions(prev => [newPos, ...prev]);
    }, []);

    return (
        <div className="h-full bg-base flex flex-col overflow-hidden">
            {/* ===== Header ===== */}
            <div className="shrink-0 px-5 pt-4 pb-3 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-primary">💎 山寨币持仓管理</h1>
                        <p className="text-[10px] text-dim mt-0.5">追踪 Altcoin 投资组合 · 投研联动 · 实时盈亏监控</p>
                    </div>
                    <button onClick={() => setShowBuyForm(true)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-500 transition-colors">
                        + 添加持仓
                    </button>
                </div>

                {/* ── 组合概览卡片 ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {[
                        { label: '总市值', value: fmtCompact(summary.totalMarketValue), color: 'text-primary' },
                        { label: '总成本', value: fmtCompact(summary.totalCostBasis), color: 'text-secondary' },
                        { label: '浮动盈亏', value: `${summary.unrealizedPnl >= 0 ? '+' : ''}${fmtCompact(summary.unrealizedPnl)}`, color: summary.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400' },
                        { label: '收益率', value: `${summary.unrealizedPnlPct >= 0 ? '+' : ''}${summary.unrealizedPnlPct.toFixed(1)}%`, color: summary.unrealizedPnlPct >= 0 ? 'text-green-400' : 'text-red-400' },
                        { label: '持仓数', value: `${summary.holdingPositions}/${summary.totalPositions}`, color: 'text-blue-400' },
                        { label: '最佳', value: summary.bestPerformer ? `${summary.bestPerformer.symbol.replace('/USDT', '')} +${summary.bestPerformer.pnlPct.toFixed(1)}%` : '-', color: 'text-green-400' },
                        { label: '最差', value: summary.worstPerformer ? `${summary.worstPerformer.symbol.replace('/USDT', '')} ${summary.worstPerformer.pnlPct.toFixed(1)}%` : '-', color: 'text-red-400' },
                    ].map(item => (
                        <div key={item.label} className="bg-surface/50 rounded-lg p-2 text-center border border-strong/30">
                            <div className="text-[9px] text-dim">{item.label}</div>
                            <div className={`text-xs font-bold ${item.color} mt-0.5`}>{item.value}</div>
                        </div>
                    ))}
                </div>

                {/* ── 持仓分布条 ── */}
                {distribution.length > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="flex h-2 rounded-full overflow-hidden flex-1">
                            {distribution.map(d => (
                                <div key={d.symbol} className={`${d.color} transition-all`} style={{ width: `${d.pct}%` }} title={`${d.symbol}: ${d.pct.toFixed(1)}%`} />
                            ))}
                        </div>
                        <div className="flex gap-2 shrink-0">
                            {distribution.slice(0, 4).map(d => (
                                <span key={d.symbol} className="flex items-center gap-0.5 text-[8px] text-dim">
                                    <span className={`w-1.5 h-1.5 rounded-full ${d.color}`} />
                                    {d.symbol} {d.pct.toFixed(0)}%
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── 搜索 + 筛选 ── */}
                <div className="flex gap-2 items-center">
                    <input type="text" value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)}
                        placeholder="搜索币种/交易所..."
                        className="flex-1 max-w-xs bg-surface/50 border border-strong/30 rounded-lg px-3 py-1.5 text-xs text-primary placeholder-gray-600 outline-none focus:border-blue-500/50" />
                    <div className="flex gap-1">
                        {STATUS_FILTERS.map(f => (
                            <button key={f.value} onClick={() => setStatusFilter(f.value)}
                                className={`text-[10px] px-2.5 py-1 rounded-full transition-colors ${statusFilter === f.value ? 'bg-blue-600 text-white' : 'bg-surface/50 text-dim hover:text-white'}`}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ===== 持仓表格 ===== */}
            <div className="flex-1 min-h-0 overflow-auto px-5 pb-5">
                <div className="bg-card/50 rounded-lg border border-strong/30 overflow-hidden">
                    {/* 表头 */}
                    <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1.2fr_0.8fr_0.8fr] gap-2 px-4 py-2 border-b border-strong/30 text-[9px] text-dim font-medium">
                        <div>币种</div>
                        <div>买入信息</div>
                        <div>当前行情</div>
                        <div>成本 / 持仓天数</div>
                        <div>盈亏</div>
                        <div>项目状态</div>
                        <div className="text-right">操作</div>
                    </div>

                    {/* 表体 */}
                    {filteredPositions.length === 0 ? (
                        <div className="py-12 text-center text-dim text-xs">暂无匹配的持仓记录</div>
                    ) : (
                        filteredPositions.map(pos => {
                            const pnl = (pos.currentPrice - pos.avgEntryPrice) * pos.quantity;
                            const pnlPct = pos.avgEntryPrice > 0 ? ((pos.currentPrice - pos.avgEntryPrice) / pos.avgEntryPrice) * 100 : 0;
                            const totalCost = pos.avgEntryPrice * pos.quantity;
                            const statusCfg = STATUS_CONFIG[pos.status];

                            return (
                                <div key={pos.id}
                                    className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1.2fr_0.8fr_0.8fr] gap-2 px-4 py-3 border-b border-strong/15 hover:bg-surface/30 transition-colors items-center">
                                    {/* 币种 */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/60 to-blue-500/60 flex items-center justify-center text-primary text-[9px] font-bold shrink-0">
                                            {pos.symbol.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-medium text-primary">{pos.symbol.replace('/USDT', '')}</span>
                                                <span className={`text-[8px] px-1.5 py-0 rounded ${statusCfg.color}`}>{statusCfg.label}</span>
                                            </div>
                                            <div className="text-[9px] text-dim">{pos.coinName ?? pos.symbol} · {pos.exchange}</div>
                                        </div>
                                    </div>

                                    {/* 买入信息 */}
                                    <div className="text-[10px]">
                                        <div className="text-secondary font-mono">{fmtUsd(pos.avgEntryPrice)}</div>
                                        <div className="text-dim">x {pos.quantity.toLocaleString()} · {pos.buyTime ? new Date(pos.buyTime).toLocaleDateString('zh-CN') : '-'}</div>
                                    </div>

                                    {/* 当前行情 */}
                                    <div className="text-[10px]">
                                        <div className="text-primary font-mono">{fmtUsd(pos.currentPrice)}</div>
                                        <div className="flex items-center gap-1">
                                            {pos.change24h !== undefined && (
                                                <span className={`font-mono ${pos.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {pos.change24h >= 0 ? '+' : ''}{pos.change24h}%
                                                </span>
                                            )}
                                            {pos.marketCapRank && <span className="text-secondary">#{pos.marketCapRank}</span>}
                                        </div>
                                    </div>

                                    {/* 成本 / 持仓天数 */}
                                    <div className="text-[10px]">
                                        <div className="text-secondary font-mono">{fmtCompact(totalCost)}</div>
                                        <div className="text-dim">{pos.holdingDays ?? '-'} 天</div>
                                    </div>

                                    {/* 盈亏 */}
                                    <div className="text-[10px]">
                                        <div className={`font-mono font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {pnl >= 0 ? '+' : ''}{fmtCompact(pnl)}
                                        </div>
                                        <div className={`font-mono ${pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                                        </div>
                                    </div>

                                    {/* 项目状态 */}
                                    <div>
                                        <Suspense fallback={<span className="text-[9px] text-secondary">...</span>}>
                                            <ProjectStatus
                                                hasResearch={!!pos.researchProjectId}
                                                score={pos.researchScore}
                                                latestUpdate={pos.researchLatestUpdate}
                                            />
                                        </Suspense>
                                    </div>

                                    {/* 操作 */}
                                    <div className="flex flex-col gap-1 items-end">
                                        <button onClick={() => setDetailPos(pos)}
                                            className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                                            详情
                                        </button>
                                        {pos.status !== 'sold' && (
                                            <button onClick={() => handleSell(pos.id)}
                                                className="text-[9px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20">
                                                卖出
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ===== 弹窗 ===== */}
            <Suspense fallback={null}>
                <BuyInfoWindow visible={showBuyForm} onClose={() => setShowBuyForm(false)} onSubmit={handleAdd} />
            </Suspense>
            <Suspense fallback={null}>
                <CheckDetails visible={!!detailPos} onClose={() => setDetailPos(null)} detail={null} />
            </Suspense>
        </div>
    );
}