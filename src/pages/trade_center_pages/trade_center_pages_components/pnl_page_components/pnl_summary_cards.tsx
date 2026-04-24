/**
 * 盈亏统计卡片区（PnL Summary Cards）
 *
 * 盈亏分析页顶部区域，展示关键盈亏指标：
 *  - 总已实现盈亏 / 收益率 / 胜率 / 盈亏比
 *  - 最大单笔盈利 / 亏损 / 最大回撤
 */
import React, { memo } from 'react';
import type { PnlReport } from '../../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface PnlSummaryCardsProps {
    report: PnlReport | null;
    isLoading: boolean;
}

// =========================================================================
// 统计卡
// =========================================================================

interface StatProps {
    label: string;
    value: string;
    color?: string;
}

const Stat: React.FC<StatProps> = memo(({ label, value, color = 'text-primary' }) => (
    <div className="bg-surface/60 rounded-lg border border-strong/50 p-3 text-center">
        <div className="text-xs text-dim mb-1">{label}</div>
        <div className={`text-base font-bold ${color}`}>{value}</div>
    </div>
));
Stat.displayName = 'PnlStat';

// =========================================================================
// 工具函数
// =========================================================================

function fmtUsd(v: number): string {
    const sign = v >= 0 ? '+' : '';
    return `${sign}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pctColor(v: number): string {
    return v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-muted';
}

// =========================================================================
// 主组件
// =========================================================================

const PnlSummaryCards: React.FC<PnlSummaryCardsProps> = memo(({ report, isLoading }) => {
    if (isLoading || !report) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="bg-surface/60 rounded-lg border border-strong/50 p-3 h-16 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <Stat label="总已实现盈亏" value={fmtUsd(report.totalRealizedPnl)} color={pctColor(report.totalRealizedPnl)} />
            <Stat label="总收益率" value={`${report.totalReturnPct > 0 ? '+' : ''}${report.totalReturnPct.toFixed(2)}%`} color={pctColor(report.totalReturnPct)} />
            <Stat label="胜率" value={`${report.winRatePct.toFixed(1)}%`} color={report.winRatePct > 50 ? 'text-green-400' : 'text-red-400'} />
            <Stat label="盈亏比" value={report.profitFactor.toFixed(2)} color={report.profitFactor > 1 ? 'text-green-400' : 'text-red-400'} />
            <Stat label="最大单笔盈利" value={fmtUsd(report.maxWin)} color="text-green-400" />
            <Stat label="最大单笔亏损" value={fmtUsd(report.maxLoss)} color="text-red-400" />
            <Stat label="最大回撤" value={`${report.maxDrawdownPct.toFixed(2)}%`} color="text-red-400" />
        </div>
    );
});

PnlSummaryCards.displayName = 'PnlSummaryCards';
export default PnlSummaryCards;
