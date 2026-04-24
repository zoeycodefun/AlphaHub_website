/**
 * 信号组合仪表板（Signal Combination Dashboard）
 *
 * 展示所有维度信号综合效果：
 *  - 综合信号方向与 7 级标签
 *  - 各维度贡献（权重条 + 方向 + 得分）
 *  - 维度一致性指标（0-1）
 *  - AI 综合解读
 */
import React, { memo, useMemo } from 'react';
import type { CompositeSignalResult, SignalDimensionSummary } from '../../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface SignalCombinationDashboardProps {
    compositeResult: CompositeSignalResult | null;
}

// =========================================================================
// 辅助
// =========================================================================

const DIRECTION_CFG: Record<string, { label: string; color: string; bg: string }> = {
    strong_buy:  { label: '强烈买入', color: 'text-green-400', bg: 'bg-green-500/20' },
    buy:         { label: '买入',     color: 'text-green-300', bg: 'bg-green-500/10' },
    neutral:     { label: '中性',     color: 'text-muted',  bg: 'bg-base0/10' },
    sell:        { label: '卖出',     color: 'text-red-300',   bg: 'bg-red-500/10' },
    strong_sell: { label: '强烈卖出', color: 'text-red-400',   bg: 'bg-red-500/20' },
};

const DIM_DIR_CFG: Record<string, { icon: string; color: string }> = {
    bullish: { icon: '▲', color: 'text-green-400' },
    bearish: { icon: '▼', color: 'text-red-400' },
    neutral: { icon: '●', color: 'text-dim' },
};

/** 综合评分到颜色 */
function scoreColor(score: number): string {
    if (score >= 75) return 'text-green-400';
    if (score >= 55) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
}

/** 一致性到颜色 */
function agreementColor(v: number): string {
    if (v >= 0.75) return 'text-green-400';
    if (v >= 0.5) return 'text-yellow-400';
    return 'text-red-400';
}

/** 一致性到标签 */
function agreementLabel(v: number): string {
    if (v >= 0.8) return '高度一致';
    if (v >= 0.6) return '较为一致';
    if (v >= 0.4) return '轻微分歧';
    return '明显分歧';
}

// =========================================================================
// 维度行
// =========================================================================

const DimensionRow: React.FC<{ dim: SignalDimensionSummary }> = memo(({ dim }) => {
    const dirCfg = DIM_DIR_CFG[dim.compositeDirection];
    const barWidth = Math.min(dim.compositeScore, 100);
    const barColor = dim.compositeDirection === 'bullish' ? 'bg-green-500/60' :
                     dim.compositeDirection === 'bearish' ? 'bg-red-500/60' :
                     'bg-base0/40';

    return (
        <div className="flex items-center gap-2 py-1.5 group hover:bg-surface/30 rounded px-1.5 transition-colors">
            {/* 图标 + 名称 */}
            <span className="text-[10px] w-4 text-center shrink-0">{dim.icon}</span>
            <span className="text-[10px] text-secondary w-20 truncate shrink-0">{dim.label}</span>

            {/* 方向 */}
            <span className={`text-[10px] font-mono w-4 shrink-0 ${dirCfg.color}`}>{dirCfg.icon}</span>

            {/* 得分条 */}
            <div className="flex-1 h-3 bg-surface rounded-full overflow-hidden relative min-w-[60px]">
                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                     style={{ width: `${barWidth}%` }} />
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-primary/70">
                    {dim.compositeScore}
                </span>
            </div>

            {/* 权重 */}
            <span className="text-[9px] text-secondary w-8 text-right shrink-0 font-mono">
                ×{dim.weight.toFixed(1)}
            </span>

            {/* 指标使用情况 */}
            <span className="text-[8px] text-secondary w-10 text-right shrink-0">
                {dim.activeIndicators}/{dim.totalIndicators}
            </span>
        </div>
    );
});
DimensionRow.displayName = 'DimensionRow';

// =========================================================================
// 主组件
// =========================================================================

const SignalCombinationDashboard: React.FC<SignalCombinationDashboardProps> = memo(({ compositeResult }) => {
    if (!compositeResult) {
        return (
            <div className="bg-card rounded-lg p-6 text-center">
                <div className="text-secondary text-xs">暂无综合信号数据</div>
            </div>
        );
    }

    const { compositeScore, direction, signalLevel, dimensions, dimensionAgreement, aiSummary, symbol, updatedAt } = compositeResult;
    const dirCfg = DIRECTION_CFG[direction];

    // 按贡献排序（权重×得分）
    const sortedDimensions = useMemo(() =>
        [...dimensions].sort((a, b) => (b.weight * b.compositeScore) - (a.weight * a.compositeScore)),
    [dimensions]);

    return (
        <div className="bg-card rounded-lg flex flex-col overflow-hidden">
            {/* ─── 综合信号头部 ──────────────────────────── */}
            <div className="px-4 py-3 border-b border-base">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-primary">🎯 综合信号</span>
                        <span className="text-[10px] text-dim">{symbol}</span>
                    </div>
                    <span className="text-[8px] text-secondary">{new Date(updatedAt).toLocaleString('zh-CN')}</span>
                </div>

                {/* 核心评分区 */}
                <div className="flex items-center gap-4">
                    {/* 综合方向 */}
                    <div className={`px-3 py-1.5 rounded-lg ${dirCfg.bg}`}>
                        <div className={`text-lg font-bold ${dirCfg.color}`}>{dirCfg.label}</div>
                        <div className="text-[9px] text-dim mt-0.5">{signalLevel}</div>
                    </div>

                    {/* 综合评分 */}
                    <div className="flex-1">
                        <div className="flex items-baseline gap-1.5 mb-1">
                            <span className={`text-2xl font-bold font-mono ${scoreColor(compositeScore)}`}>
                                {compositeScore}
                            </span>
                            <span className="text-[10px] text-secondary">/100</span>
                        </div>
                        {/* 评分条 */}
                        <div className="h-2 bg-surface rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${
                                compositeScore >= 75 ? 'bg-green-500' :
                                compositeScore >= 55 ? 'bg-yellow-500' :
                                compositeScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                            }`} style={{ width: `${compositeScore}%` }} />
                        </div>
                    </div>

                    {/* 维度一致性 */}
                    <div className="text-center px-3">
                        <div className={`text-xl font-bold font-mono ${agreementColor(dimensionAgreement)}`}>
                            {(dimensionAgreement * 100).toFixed(0)}%
                        </div>
                        <div className="text-[9px] text-dim">维度一致性</div>
                        <div className={`text-[8px] ${agreementColor(dimensionAgreement)}`}>
                            {agreementLabel(dimensionAgreement)}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── 各维度贡献 ────────────────────────────── */}
            <div className="px-3 py-2 flex-1 overflow-y-auto min-h-0">
                <div className="flex items-center justify-between mb-1.5 px-1.5">
                    <span className="text-[9px] text-dim font-medium">维度贡献分析</span>
                    <span className="text-[8px] text-secondary">{sortedDimensions.length} 个维度</span>
                </div>
                <div className="space-y-0.5">
                    {sortedDimensions.map(dim => (
                        <DimensionRow key={dim.category} dim={dim} />
                    ))}
                </div>
            </div>

            {/* ─── AI 解读 ───────────────────────────────── */}
            {aiSummary && (
                <div className="px-4 py-2.5 border-t border-base">
                    <div className="text-[9px] text-dim mb-1">🤖 AI 综合解读</div>
                    <div className="text-[10px] text-blue-300/80 leading-relaxed">{aiSummary}</div>
                </div>
            )}
        </div>
    );
});

SignalCombinationDashboard.displayName = 'SignalCombinationDashboard';
export default SignalCombinationDashboard;
