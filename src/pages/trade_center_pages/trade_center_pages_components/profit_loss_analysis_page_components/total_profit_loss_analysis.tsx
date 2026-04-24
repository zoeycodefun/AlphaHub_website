/**
 * 总盈亏分析组件
 * 按日/周/月/年粒度展示总盈亏统计
 */
import React, { memo, useState } from 'react';
import type { PnlReport, PnlTimeGranularity } from '../../../type/alpha_module_types';

interface Props {
    report: PnlReport;
}

const GRANULARITY_TABS: { key: PnlTimeGranularity; label: string }[] = [
    { key: 'day', label: '日' },
    { key: 'week', label: '周' },
    { key: 'month', label: '月' },
    { key: 'year', label: '年' },
];

const TotalProfitLossAnalysis: React.FC<Props> = memo(({ report }) => {
    const [granularity, setGranularity] = useState<PnlTimeGranularity>('month');

    return (
        <div className="bg-card/50 border border-base rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-primary">📊 总盈亏分析</h3>
                <div className="flex gap-1">
                    {GRANULARITY_TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setGranularity(tab.key)}
                            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                granularity === tab.key
                                    ? 'bg-blue-600/30 text-blue-400'
                                    : 'text-dim hover:text-secondary hover:bg-surface'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 关键统计卡 */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                <StatCard label="总盈亏" value={`${report.totalRealizedPnl >= 0 ? '+' : ''}${report.totalRealizedPnl.toFixed(2)}`} unit="USDT"
                    color={report.totalRealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'} />
                <StatCard label="收益率" value={`${report.totalReturnPct >= 0 ? '+' : ''}${report.totalReturnPct.toFixed(1)}`} unit="%"
                    color={report.totalReturnPct >= 0 ? 'text-green-400' : 'text-red-400'} />
                <StatCard label="胜率" value={report.winRatePct.toFixed(1)} unit="%" color="text-primary" />
                <StatCard label="盈亏比" value={report.profitFactor.toFixed(2)} color="text-primary" />
                <StatCard label="最大回撤" value={report.maxDrawdownPct.toFixed(1)} unit="%" color="text-red-400" />
            </div>

            {/* 月度盈亏柱状图 */}
            <div className="mt-4">
                <p className="text-xs text-dim mb-2">{granularity === 'month' ? '月度' : granularity === 'day' ? '每日' : granularity === 'week' ? '每周' : '年度'}盈亏趋势</p>
                <div className="flex items-end gap-2 h-32">
                    {report.monthlyPnl.map((point, i) => {
                        const maxAbs = Math.max(...report.monthlyPnl.map(p => Math.abs(p.pnl)), 1);
                        const height = (Math.abs(point.pnl) / maxAbs) * 100;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center">
                                <div
                                    className={`w-full rounded-t ${point.pnl >= 0 ? 'bg-green-500/60' : 'bg-red-500/60'}`}
                                    style={{ height: `${Math.max(height, 4)}%` }}
                                    title={`${point.month}: ${point.pnl >= 0 ? '+' : ''}${point.pnl.toFixed(2)} USDT`}
                                />
                                <span className="text-[10px] text-secondary mt-1">{point.month.slice(5)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 盈亏笔数 */}
            <div className="flex items-center gap-4 mt-4 text-xs text-muted">
                <span>盈利 <span className="text-green-400 font-medium">{report.winCount}</span> 笔</span>
                <span>亏损 <span className="text-red-400 font-medium">{report.lossCount}</span> 笔</span>
                <span>最大盈利 <span className="text-green-400">{report.maxWin.toFixed(2)}</span></span>
                <span>最大亏损 <span className="text-red-400">{report.maxLoss.toFixed(2)}</span></span>
            </div>
        </div>
    );
});

function StatCard({ label, value, unit, color }: { label: string; value: string; unit?: string; color: string }) {
    return (
        <div className="bg-surface/50 rounded-lg p-3">
            <p className="text-xs text-dim mb-1">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{value}{unit && <span className="text-xs text-dim ml-0.5">{unit}</span>}</p>
        </div>
    );
}

TotalProfitLossAnalysis.displayName = 'TotalProfitLossAnalysis';
export default TotalProfitLossAnalysis;
