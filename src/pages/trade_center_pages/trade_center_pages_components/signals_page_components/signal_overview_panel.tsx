/**
 * 信号总览面板（Signal Overview Panel）
 *
 * 信号分析中心顶部区域，展示信号分布统计：
 *  - 活跃信号总数 / 买入信号 / 卖出信号
 *  - 平均评分 / 强信号占比
 *  - 最近触发信号快报
 *
 * 使用 Mock 数据，后端 API 就绪后替换。
 */
import React, { memo, useMemo } from 'react';
import type { SignalRecord } from '../../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface SignalOverviewPanelProps {
    /** 信号列表 */
    signals: SignalRecord[];
    /** 是否加载中 */
    isLoading: boolean;
}

// =========================================================================
// 统计卡片
// =========================================================================

interface MiniStatProps {
    label: string;
    value: string | number;
    color?: string;
}

const MiniStat: React.FC<MiniStatProps> = memo(({ label, value, color = 'text-primary' }) => (
    <div className="bg-surface/60 rounded-lg border border-strong/50 p-3 text-center">
        <div className="text-xs text-dim mb-1">{label}</div>
        <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
));
MiniStat.displayName = 'MiniStat';

// =========================================================================
// 主组件
// =========================================================================

const SignalOverviewPanel: React.FC<SignalOverviewPanelProps> = memo(({ signals, isLoading }) => {
    /** 统计计算 */
    const stats = useMemo(() => {
        const active = signals.filter(s => s.status === 'active');
        const buyCount = active.filter(s => s.direction === 'buy').length;
        const sellCount = active.filter(s => s.direction === 'sell').length;
        const avgScore = active.length > 0
            ? Math.round(active.reduce((sum, s) => sum + s.score, 0) / active.length)
            : 0;
        const strongCount = active.filter(s => s.strengthLevel === 'strong' || s.strengthLevel === 'very_strong').length;
        const strongPct = active.length > 0 ? Math.round((strongCount / active.length) * 100) : 0;

        return { total: active.length, buyCount, sellCount, avgScore, strongPct };
    }, [signals]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-surface/60 rounded-lg border border-strong/50 p-3 h-16 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <MiniStat label="活跃信号" value={stats.total} color="text-blue-400" />
            <MiniStat label="买入信号" value={stats.buyCount} color="text-green-400" />
            <MiniStat label="卖出信号" value={stats.sellCount} color="text-red-400" />
            <MiniStat label="平均评分" value={stats.avgScore} color="text-yellow-400" />
            <MiniStat label="强信号占比" value={`${stats.strongPct}%`} color="text-purple-400" />
        </div>
    );
});

SignalOverviewPanel.displayName = 'SignalOverviewPanel';
export default SignalOverviewPanel;
