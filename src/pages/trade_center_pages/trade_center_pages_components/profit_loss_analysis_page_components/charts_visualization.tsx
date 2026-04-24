/**
 * 可视化图表组件
 * 8 种图表类型的占位展示（实际对接 chart 库时替换）
 */
import React, { memo, useState } from 'react';
import type { PnlReport } from '../../../type/alpha_module_types';

interface Props {
    report: PnlReport;
}

type ChartType = 'equity_curve' | 'monthly_bar' | 'source_pie' | 'symbol_pie' | 'drawdown' | 'win_loss_dist' | 'pnl_heatmap' | 'holding_scatter';

const CHART_TABS: { key: ChartType; label: string }[] = [
    { key: 'equity_curve', label: '权益曲线' },
    { key: 'monthly_bar', label: '月度柱状图' },
    { key: 'source_pie', label: '来源饼图' },
    { key: 'symbol_pie', label: '交易对分布' },
    { key: 'drawdown', label: '回撤曲线' },
    { key: 'win_loss_dist', label: '盈亏分布' },
    { key: 'pnl_heatmap', label: '盈亏热力图' },
    { key: 'holding_scatter', label: '持仓时长散点' },
];

const ChartsVisualization: React.FC<Props> = memo(({ report }) => {
    const [activeChart, setActiveChart] = useState<ChartType>('equity_curve');

    return (
        <div className="bg-card/50 border border-base rounded-xl p-4">
            <h3 className="text-sm font-semibold text-primary mb-4">📈 可视化图表</h3>

            {/* 图表选择 tab */}
            <div className="flex flex-wrap gap-1 mb-4">
                {CHART_TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveChart(tab.key)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            activeChart === tab.key
                                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                                : 'text-dim hover:text-secondary hover:bg-surface border border-transparent'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 图表渲染区域 */}
            <div className="h-64 flex items-center justify-center rounded-lg bg-surface/30 border border-strong/30">
                {activeChart === 'monthly_bar' ? (
                    <div className="w-full h-full flex items-end gap-3 px-6 pb-6 pt-2">
                        {report.monthlyPnl.map((point, i) => {
                            const maxAbs = Math.max(...report.monthlyPnl.map(p => Math.abs(p.pnl)), 1);
                            const height = (Math.abs(point.pnl) / maxAbs) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                                    <span className={`text-[10px] mb-1 ${point.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {point.pnl >= 0 ? '+' : ''}{point.pnl.toFixed(0)}
                                    </span>
                                    <div
                                        className={`w-full rounded-t transition-all ${point.pnl >= 0 ? 'bg-green-500/50' : 'bg-red-500/50'}`}
                                        style={{ height: `${Math.max(height, 3)}%` }}
                                    />
                                    <span className="text-[10px] text-secondary mt-1">{point.month.slice(5)}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : activeChart === 'source_pie' ? (
                    <div className="flex flex-wrap gap-3 px-4">
                        {Object.entries(report.bySource).map(([source, data]) => (
                            <div key={source} className="flex items-center gap-2 bg-surface/50 px-3 py-2 rounded-lg">
                                <div className={`w-3 h-3 rounded-full ${data.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-xs text-secondary">{source}</span>
                                <span className={`text-xs font-medium ${data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {data.pnl >= 0 ? '+' : ''}{data.pnl.toFixed(0)}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-dim text-sm">📊 {CHART_TABS.find(t => t.key === activeChart)?.label}</p>
                        <p className="text-secondary text-xs mt-1">图表组件开发中，接入 chart 库后渲染</p>
                    </div>
                )}
            </div>
        </div>
    );
});

ChartsVisualization.displayName = 'ChartsVisualization';
export default ChartsVisualization;
