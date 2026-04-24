/**
 * 盈亏图表面板（PnL Chart Panel）
 *
 * 展示月度盈亏柱状图 + 按来源/交易对的饼形分布：
 *  - 月度盈亏条形图（绿盈/红亏）
 *  - 按来源分组的水平条形分布
 *  - 按交易对分组的水平条形分布
 *
 * 纯 CSS 实现，无第三方图表库依赖。
 */
import React, { memo, useMemo } from 'react';
import type { PnlReport } from '../../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface PnlChartPanelProps {
    report: PnlReport | null;
}

// =========================================================================
// 来源中文标签
// =========================================================================

const SOURCE_LABELS: Record<string, string> = {
    spot: '现货', futures: '合约', hedge: '对冲', dca: 'DCA', manual: '手动',
};

// =========================================================================
// 子组件：月度盈亏柱状图
// =========================================================================

const MonthlyChart: React.FC<{ data: { month: string; pnl: number; tradeCount: number }[] }> = memo(({ data }) => {
    const maxAbs = Math.max(...data.map(d => Math.abs(d.pnl)), 1);

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4">
            <h3 className="text-sm font-semibold text-primary mb-3">月度盈亏</h3>
            <div className="space-y-2">
                {data.map(d => {
                    const pct = (Math.abs(d.pnl) / maxAbs) * 100;
                    const isPositive = d.pnl >= 0;
                    return (
                        <div key={d.month} className="flex items-center gap-3">
                            <span className="text-xs text-muted w-14 text-right font-mono">{d.month}</span>
                            <div className="flex-1 h-5 bg-surface-hover/30 rounded overflow-hidden relative">
                                <div
                                    className={`h-full rounded transition-all ${isPositive ? 'bg-green-500/60' : 'bg-red-500/60'}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className={`text-xs w-20 text-right font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                {isPositive ? '+' : ''}{d.pnl.toFixed(0)}
                            </span>
                            <span className="text-[10px] text-secondary w-10 text-right">{d.tradeCount}笔</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
MonthlyChart.displayName = 'MonthlyChart';

// =========================================================================
// 子组件：分组分布条
// =========================================================================

interface GroupBarProps {
    title: string;
    data: Record<string, { pnl: number; count: number }>;
    labelMap?: Record<string, string>;
}

const GroupBar: React.FC<GroupBarProps> = memo(({ title, data, labelMap }) => {
    const entries = useMemo(() => {
        return Object.entries(data)
            .map(([key, v]) => ({ key, label: labelMap?.[key] ?? key, ...v }))
            .sort((a, b) => b.pnl - a.pnl);
    }, [data, labelMap]);

    const maxAbs = Math.max(...entries.map(e => Math.abs(e.pnl)), 1);

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4">
            <h3 className="text-sm font-semibold text-primary mb-3">{title}</h3>
            <div className="space-y-2">
                {entries.map(e => (
                    <div key={e.key} className="flex items-center gap-3">
                        <span className="text-xs text-muted w-16 truncate text-right">{e.label}</span>
                        <div className="flex-1 h-4 bg-surface-hover/30 rounded overflow-hidden">
                            <div
                                className={`h-full rounded transition-all ${e.pnl >= 0 ? 'bg-green-500/50' : 'bg-red-500/50'}`}
                                style={{ width: `${(Math.abs(e.pnl) / maxAbs) * 100}%` }}
                            />
                        </div>
                        <span className={`text-xs w-16 text-right font-mono ${e.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {e.pnl >= 0 ? '+' : ''}{e.pnl.toFixed(0)}
                        </span>
                        <span className="text-[10px] text-secondary w-8 text-right">{e.count}笔</span>
                    </div>
                ))}
            </div>
        </div>
    );
});
GroupBar.displayName = 'GroupBar';

// =========================================================================
// 主组件
// =========================================================================

const PnlChartPanel: React.FC<PnlChartPanelProps> = memo(({ report }) => {
    if (!report) {
        return (
            <div className="bg-surface/60 rounded-xl border border-strong/50 p-6 text-center text-dim text-sm">
                暂无盈亏数据
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 月度盈亏 */}
            <MonthlyChart data={report.monthlyPnl} />

            {/* 按来源分组 */}
            <GroupBar title="按来源" data={report.bySource} labelMap={SOURCE_LABELS} />

            {/* 按交易对分组 */}
            <GroupBar title="按交易对" data={report.bySymbol} />
        </div>
    );
});

PnlChartPanel.displayName = 'PnlChartPanel';
export default PnlChartPanel;
