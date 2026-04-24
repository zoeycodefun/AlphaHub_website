/**
 * 信号强度分布图表（Signal Strength Chart）
 *
 * 以简洁的条形图展示信号评分的分布情况：
 *  - X 轴：评分区间（0-20 / 20-40 / 40-60 / 60-80 / 80-100）
 *  - Y 轴：信号数量
 *  - 颜色：低分红色 → 高分绿色
 *
 * 纯 CSS 实现，无第三方图表库依赖。
 */
import React, { memo, useMemo } from 'react';
import type { SignalRecord } from '../../../type/alpha_module_types';

// =========================================================================
// 常量
// =========================================================================

/** 评分区间配置 */
const SCORE_BINS = [
    { min: 0,  max: 20, label: '0–20',  color: 'bg-red-500' },
    { min: 20, max: 40, label: '20–40', color: 'bg-orange-500' },
    { min: 40, max: 60, label: '40–60', color: 'bg-yellow-500' },
    { min: 60, max: 80, label: '60–80', color: 'bg-green-400' },
    { min: 80, max: 100, label: '80–100', color: 'bg-emerald-400' },
];

// =========================================================================
// Props
// =========================================================================

interface SignalStrengthChartProps {
    signals: SignalRecord[];
}

// =========================================================================
// 主组件
// =========================================================================

const SignalStrengthChart: React.FC<SignalStrengthChartProps> = memo(({ signals }) => {
    /** 计算各区间数量 */
    const distribution = useMemo(() => {
        const counts = SCORE_BINS.map(bin => ({
            ...bin,
            count: signals.filter(s => s.score >= bin.min && s.score < (bin.max === 100 ? 101 : bin.max)).length,
        }));
        const maxCount = Math.max(...counts.map(c => c.count), 1);
        return counts.map(c => ({ ...c, pct: (c.count / maxCount) * 100 }));
    }, [signals]);

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4">
            <h3 className="text-sm font-semibold text-primary mb-3">信号评分分布</h3>
            <div className="space-y-2">
                {distribution.map(bin => (
                    <div key={bin.label} className="flex items-center gap-3">
                        {/* 区间标签 */}
                        <span className="text-xs text-muted w-12 text-right font-mono">{bin.label}</span>
                        {/* 条形 */}
                        <div className="flex-1 h-5 bg-surface-hover/40 rounded overflow-hidden">
                            <div
                                className={`h-full ${bin.color} rounded transition-all duration-500 flex items-center justify-end pr-1`}
                                style={{ width: `${bin.pct}%`, minWidth: bin.count > 0 ? '20px' : '0' }}
                            >
                                {bin.count > 0 && (
                                    <span className="text-[10px] text-primary font-bold">{bin.count}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* 底部说明 */}
            <div className="flex items-center justify-between mt-3 text-[10px] text-secondary">
                <span>▬ 低分（弱信号）</span>
                <span>高分（强信号） ▬</span>
            </div>
        </div>
    );
});

SignalStrengthChart.displayName = 'SignalStrengthChart';
export default SignalStrengthChart;
