/**
 * 山寨币投资组合摘要（Altcoin Portfolio Summary）
 *
 * 顶部概览面板：
 *  - 总市值 / 总成本 / 总浮动盈亏
 *  - 持仓数量 / 盈亏比 / 平均涨跌幅
 *  - 饼图式持仓分布
 */
import React, { memo, useMemo } from 'react';
import type { AltcoinPositionRecord } from '../../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface AltcoinPortfolioSummaryProps {
    positions: AltcoinPositionRecord[];
}

// =========================================================================
// 工具函数
// =========================================================================

function fmtUsd(v: number): string {
    return `$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// 为持仓分布条提供的颜色列表
const BAR_COLORS = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500',
    'bg-pink-500', 'bg-cyan-500', 'bg-orange-500', 'bg-indigo-500',
];

// =========================================================================
// 主组件
// =========================================================================

const AltcoinPortfolioSummary: React.FC<AltcoinPortfolioSummaryProps> = memo(({ positions }) => {
    /** 计算汇总统计 */
    const stats = useMemo(() => {
        const active = positions.filter((p) => p.status !== 'sold');
        const totalMarketValue = active.reduce((acc, p) => acc + p.currentPrice * p.quantity, 0);
        const totalCost = active.reduce((acc, p) => acc + p.avgEntryPrice * p.quantity, 0);
        const totalPnl = totalMarketValue - totalCost;
        const pnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
        const profitable = active.filter((p) => p.currentPrice >= p.avgEntryPrice).length;
        const losing = active.length - profitable;
        return { totalMarketValue, totalCost, totalPnl, pnlPct, holding: active.length, profitable, losing, active };
    }, [positions]);

    /** 持仓分布数据 */
    const distribution = useMemo(() => {
        const total = stats.totalMarketValue;
        if (total === 0) return [];
        return stats.active
            .map((p, i) => ({
                symbol: p.symbol.replace('/USDT', ''),
                value: p.currentPrice * p.quantity,
                pct: ((p.currentPrice * p.quantity) / total) * 100,
                color: BAR_COLORS[i % BAR_COLORS.length],
            }))
            .sort((a, b) => b.value - a.value);
    }, [stats]);

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4">
            {/* 指标卡片 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                {[
                    { label: '总市值', value: fmtUsd(stats.totalMarketValue), color: 'text-primary' },
                    { label: '总成本', value: fmtUsd(stats.totalCost), color: 'text-secondary' },
                    {
                        label: '浮动盈亏',
                        value: `${stats.totalPnl >= 0 ? '+' : '-'}${fmtUsd(stats.totalPnl)}`,
                        color: stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400',
                    },
                    {
                        label: '收益率',
                        value: `${stats.pnlPct >= 0 ? '+' : ''}${stats.pnlPct.toFixed(2)}%`,
                        color: stats.pnlPct >= 0 ? 'text-green-400' : 'text-red-400',
                    },
                    { label: '盈利/亏损', value: `${stats.profitable} / ${stats.losing}`, color: 'text-yellow-400' },
                    { label: '持仓数', value: String(stats.holding), color: 'text-blue-400' },
                ].map((item) => (
                    <div key={item.label} className="bg-card/50 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-dim mb-0.5">{item.label}</div>
                        <div className={`text-sm font-bold ${item.color}`}>{item.value}</div>
                    </div>
                ))}
            </div>

            {/* 持仓分布条 */}
            {distribution.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-2">持仓分布</h4>
                    {/* 堆叠条 */}
                    <div className="flex h-3 rounded-full overflow-hidden mb-2">
                        {distribution.map((d) => (
                            <div
                                key={d.symbol}
                                className={`${d.color} transition-all`}
                                style={{ width: `${d.pct}%` }}
                                title={`${d.symbol}: ${d.pct.toFixed(1)}%`}
                            />
                        ))}
                    </div>
                    {/* 图例 */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
                        {distribution.map((d) => (
                            <span key={d.symbol} className="flex items-center gap-1 text-muted">
                                <span className={`inline-block w-2 h-2 rounded-full ${d.color}`} />
                                {d.symbol} {d.pct.toFixed(1)}%
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

AltcoinPortfolioSummary.displayName = 'AltcoinPortfolioSummary';
export default AltcoinPortfolioSummary;
