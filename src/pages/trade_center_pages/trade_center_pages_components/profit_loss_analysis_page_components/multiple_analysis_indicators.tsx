/**
 * 多维指标分析组件
 * 展示 15+ 交易绩效指标
 */
import React, { memo } from 'react';
import type { PnlMultiDimensionMetrics } from '../../../type/alpha_module_types';

interface Props {
    metrics: PnlMultiDimensionMetrics;
}

const MultipleAnalysisIndicators: React.FC<Props> = memo(({ metrics }) => {
    return (
        <div className="bg-card/50 border border-base rounded-xl p-4">
            <h3 className="text-sm font-semibold text-primary mb-4">📐 多维绩效指标</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <MetricCard label="夏普比率" value={metrics.sharpeRatio.toFixed(2)} hint="风险调整后收益" color={metrics.sharpeRatio > 1 ? 'text-green-400' : metrics.sharpeRatio > 0 ? 'text-yellow-400' : 'text-red-400'} />
                <MetricCard label="索提诺比率" value={metrics.sortinoRatio.toFixed(2)} hint="下行风险调整收益" color={metrics.sortinoRatio > 1.5 ? 'text-green-400' : 'text-yellow-400'} />
                <MetricCard label="卡尔玛比率" value={metrics.calmarRatio.toFixed(2)} hint="收益/最大回撤" color={metrics.calmarRatio > 1 ? 'text-green-400' : 'text-yellow-400'} />
                <MetricCard label="最大回撤" value={`${metrics.maxDrawdownPct.toFixed(1)}%`} hint="峰值至谷底" color="text-red-400" />
                <MetricCard label="年化收益" value={`${metrics.annualizedReturnPct >= 0 ? '+' : ''}${metrics.annualizedReturnPct.toFixed(1)}%`} color={metrics.annualizedReturnPct >= 0 ? 'text-green-400' : 'text-red-400'} />
                <MetricCard label="波动率" value={`${metrics.volatility.toFixed(1)}%`} hint="收益标准差" color="text-primary" />
                <MetricCard label="盈亏比" value={metrics.profitFactor.toFixed(2)} hint="总盈/总亏" color={metrics.profitFactor > 1.5 ? 'text-green-400' : 'text-yellow-400'} />
                <MetricCard label="期望收益(R)" value={metrics.expectancy.toFixed(2)} hint="每笔期望" color={metrics.expectancy > 0 ? 'text-green-400' : 'text-red-400'} />
                <MetricCard label="平均盈利" value={`+${metrics.avgWin.toFixed(2)}`} color="text-green-400" />
                <MetricCard label="平均亏损" value={metrics.avgLoss.toFixed(2)} color="text-red-400" />
                <MetricCard label="平均持仓" value={formatDuration(metrics.avgHoldingMinutes)} hint="分钟" color="text-primary" />
                <MetricCard label="最大连胜" value={`${metrics.maxWinStreak}`} hint="连续盈利" color="text-green-400" />
                <MetricCard label="最大连亏" value={`${metrics.maxLossStreak}`} hint="连续亏损" color="text-red-400" />
                <MetricCard label="日均交易" value={metrics.avgTradesPerDay.toFixed(1)} hint="笔/天" color="text-primary" />
            </div>
        </div>
    );
});

function MetricCard({ label, value, hint, color }: { label: string; value: string; hint?: string; color: string }) {
    return (
        <div className="bg-surface/50 rounded-lg p-3">
            <p className="text-xs text-dim mb-1">{label}</p>
            <p className={`text-base font-bold ${color}`}>{value}</p>
            {hint && <p className="text-[10px] text-secondary mt-0.5">{hint}</p>}
        </div>
    );
}

function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes.toFixed(0)}分`;
    if (minutes < 1440) return `${(minutes / 60).toFixed(1)}时`;
    return `${(minutes / 1440).toFixed(1)}天`;
}

MultipleAnalysisIndicators.displayName = 'MultipleAnalysisIndicators';
export default MultipleAnalysisIndicators;
