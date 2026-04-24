/**
 * 盈亏明细表（PnL Breakdown Table）
 *
 * 展示盈亏记录列表：
 *  - 交易对 + 方向 + 来源
 *  - 入场/出场价 + 数量
 *  - 已实现盈亏 + 比例
 *  - 手续费
 *  - 关联策略
 */
import React, { memo, useState, useMemo, useCallback } from 'react';
import type { PnlRecord, PnlSource } from '../../../type/alpha_module_types';

// =========================================================================
// 常量
// =========================================================================

const SOURCE_LABELS: Record<PnlSource, { label: string; color: string }> = {
    spot:    { label: '现货',   color: 'bg-blue-500/20 text-blue-400' },
    futures: { label: '合约',   color: 'bg-purple-500/20 text-purple-400' },
    hedge:   { label: '对冲',   color: 'bg-cyan-500/20 text-cyan-400' },
    dca:     { label: 'DCA',    color: 'bg-green-500/20 text-green-400' },
    manual:  { label: '手动',   color: 'bg-base0/20 text-muted' },
};

const PAGE_SIZE = 10;

// =========================================================================
// Props
// =========================================================================

interface PnlBreakdownTableProps {
    records: PnlRecord[];
    isLoading: boolean;
}

// =========================================================================
// 工具函数
// =========================================================================

function fmtPrice(v: number): string {
    return v >= 1 ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v.toPrecision(6);
}

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// =========================================================================
// 主组件
// =========================================================================

const PnlBreakdownTable: React.FC<PnlBreakdownTableProps> = memo(({ records, isLoading }) => {
    const [page, setPage] = useState(0);
    const [sourceFilter, setSourceFilter] = useState<string>('all');

    const filtered = useMemo(() => {
        if (sourceFilter === 'all') return records;
        return records.filter(r => r.source === sourceFilter);
    }, [records, sourceFilter]);

    const paged = useMemo(() => {
        const start = page * PAGE_SIZE;
        return filtered.slice(start, start + PAGE_SIZE);
    }, [filtered, page]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const handlePrev = useCallback(() => setPage(p => Math.max(0, p - 1)), []);
    const handleNext = useCallback(() => setPage(p => Math.min(totalPages - 1, p + 1)), [totalPages]);

    if (isLoading) {
        return (
            <div className="bg-surface/60 rounded-xl border border-strong/50 p-4">
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-10 bg-surface-hover/30 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4">
            {/* 标题 + 来源筛选 */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-primary">盈亏明细</h3>
                <div className="flex gap-1.5">
                    {[{ key: 'all', label: '全部' }, ...Object.entries(SOURCE_LABELS).map(([k, v]) => ({ key: k, label: v.label }))].map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => { setSourceFilter(opt.key); setPage(0); }}
                            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                                sourceFilter === opt.key
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-surface-hover/30 text-muted hover:bg-surface-hover/50'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 表格 */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="text-dim border-b border-strong/30">
                            <th className="text-left py-2 pr-2">交易对</th>
                            <th className="text-left py-2 pr-2">方向</th>
                            <th className="text-left py-2 pr-2">来源</th>
                            <th className="text-right py-2 pr-2">入场价</th>
                            <th className="text-right py-2 pr-2">出场价</th>
                            <th className="text-right py-2 pr-2">盈亏</th>
                            <th className="text-right py-2 pr-2">比例</th>
                            <th className="text-right py-2">时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-8 text-dim">暂无盈亏记录</td>
                            </tr>
                        ) : paged.map(r => {
                            const src = SOURCE_LABELS[r.source];
                            return (
                                <tr key={r.id} className="border-b border-strong/10 hover:bg-card/5">
                                    <td className="py-2 pr-2 text-primary font-medium">{r.symbol}</td>
                                    <td className={`py-2 pr-2 ${r.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                                        {r.side === 'buy' ? '买入' : '卖出'}
                                    </td>
                                    <td className="py-2 pr-2">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${src.color}`}>{src.label}</span>
                                    </td>
                                    <td className="py-2 pr-2 text-right text-primary font-mono">{fmtPrice(r.entryPrice)}</td>
                                    <td className="py-2 pr-2 text-right text-primary font-mono">{fmtPrice(r.exitPrice)}</td>
                                    <td className={`py-2 pr-2 text-right font-mono ${r.realizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {r.realizedPnl >= 0 ? '+' : ''}{r.realizedPnl.toFixed(2)}
                                    </td>
                                    <td className={`py-2 pr-2 text-right font-mono ${r.pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {r.pnlPct >= 0 ? '+' : ''}{r.pnlPct.toFixed(2)}%
                                    </td>
                                    <td className="py-2 text-right text-dim">{fmtDate(r.createdAt)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 text-xs text-dim">
                    <span>共 {filtered.length} 条</span>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrev} disabled={page === 0} className="px-2 py-1 rounded bg-surface-hover/30 disabled:opacity-30 hover:bg-surface-hover/50">上一页</button>
                        <span>{page + 1} / {totalPages}</span>
                        <button onClick={handleNext} disabled={page >= totalPages - 1} className="px-2 py-1 rounded bg-surface-hover/30 disabled:opacity-30 hover:bg-surface-hover/50">下一页</button>
                    </div>
                </div>
            )}
        </div>
    );
});

PnlBreakdownTable.displayName = 'PnlBreakdownTable';
export default PnlBreakdownTable;
