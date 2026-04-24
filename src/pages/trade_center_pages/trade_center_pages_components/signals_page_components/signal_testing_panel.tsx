/**
 * 信号测试面板（SignalTestingPanel）
 *
 * 展示正在测试中的信号指标列表及其回测指标：
 *  - 测试列表：指标名、分类、状态、准确率、胜率、夏普
 *  - 测试操作：启动新测试、查看详情、推荐入池
 *  - 最近测试记录
 */
import React, { memo, useState, useMemo } from 'react';
import type { SignalTestRecord, SignalMarketType } from '../../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface SignalTestingPanelProps {
    tests: SignalTestRecord[];
    market: SignalMarketType;
    onStartTest?: () => void;
    onPromote?: (testId: string) => void;
}

// =========================================================================
// 辅助
// =========================================================================

const STATUS_CFG: Record<string, { label: string; color: string }> = {
    running: { label: '运行中', color: 'text-blue-400 bg-blue-500/15' },
    completed: { label: '已完成', color: 'text-green-400 bg-green-500/15' },
    failed: { label: '失败', color: 'text-red-400 bg-red-500/15' },
};

function getMetricColor(value: number | undefined, thresholds: [number, number]): string {
    if (value === undefined) return 'text-dim';
    if (value >= thresholds[1]) return 'text-green-400';
    if (value >= thresholds[0]) return 'text-yellow-400';
    return 'text-red-400';
}

// =========================================================================
// 主组件
// =========================================================================

const SignalTestingPanel: React.FC<SignalTestingPanelProps> = memo(({ tests, market, onStartTest, onPromote }) => {
    const [sortBy, setSortBy] = useState<'time' | 'accuracy' | 'sharpe'>('time');

    const filteredTests = useMemo(() => {
        const arr = tests.filter(t => t.market === market);
        arr.sort((a, b) => {
            if (sortBy === 'accuracy') return (b.accuracy ?? 0) - (a.accuracy ?? 0);
            if (sortBy === 'sharpe') return (b.sharpeRatio ?? 0) - (a.sharpeRatio ?? 0);
            return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
        });
        return arr;
    }, [tests, market, sortBy]);

    const runningCount = filteredTests.filter(t => t.status === 'running').length;
    const completedCount = filteredTests.filter(t => t.status === 'completed').length;
    const recommendedCount = filteredTests.filter(t => t.recommended).length;

    return (
        <div className="h-full bg-card rounded-lg flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-3 py-2 border-b border-base shrink-0">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-primary">🧪 信号测试中心</span>
                    <button onClick={onStartTest}
                        className="text-[9px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
                        + 新测试
                    </button>
                </div>
                <div className="flex gap-3 text-[9px]">
                    <span className="text-blue-400">运行中 {runningCount}</span>
                    <span className="text-green-400">已完成 {completedCount}</span>
                    <span className="text-yellow-400">推荐入池 {recommendedCount}</span>
                </div>
                {/* 排序 */}
                <div className="flex gap-1 mt-1.5">
                    {([
                        { key: 'time', label: '最新' },
                        { key: 'accuracy', label: '准确率' },
                        { key: 'sharpe', label: '夏普比' },
                    ] as const).map(s => (
                        <button key={s.key} onClick={() => setSortBy(s.key)}
                            className={`text-[9px] px-1.5 py-0.5 rounded ${sortBy === s.key ? 'bg-blue-500/20 text-blue-400' : 'text-secondary'}`}>
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 测试列表 */}
            <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-1.5">
                {filteredTests.length === 0 ? (
                    <div className="text-center text-[10px] text-secondary py-8">暂无测试记录</div>
                ) : (
                    filteredTests.map(test => {
                        const stCfg = STATUS_CFG[test.status];
                        return (
                            <div key={test.id} className={`rounded-lg p-2.5 border ${test.recommended ? 'bg-green-500/5 border-green-500/20' : 'bg-surface/40 border-strong/30'}`}>
                                {/* 第一行 */}
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-primary font-medium truncate max-w-[120px]">{test.indicatorName}</span>
                                        <span className={`text-[8px] px-1 py-0 rounded ${stCfg.color}`}>{stCfg.label}</span>
                                    </div>
                                    {test.recommended && (
                                        <span className="text-[8px] px-1.5 py-0 rounded bg-green-500/20 text-green-400">✓ 推荐</span>
                                    )}
                                </div>

                                {/* 指标行 */}
                                {test.status === 'completed' && (
                                    <div className="grid grid-cols-4 gap-1 text-[9px] mb-1.5">
                                        <div>
                                            <div className="text-secondary">准确率</div>
                                            <div className={`font-mono ${getMetricColor(test.accuracy, [50, 65])}`}>{test.accuracy ?? '-'}%</div>
                                        </div>
                                        <div>
                                            <div className="text-secondary">胜率</div>
                                            <div className={`font-mono ${getMetricColor(test.winRate, [45, 55])}`}>{test.winRate ?? '-'}%</div>
                                        </div>
                                        <div>
                                            <div className="text-secondary">夏普</div>
                                            <div className={`font-mono ${getMetricColor(test.sharpeRatio, [1, 1.5])}`}>{test.sharpeRatio?.toFixed(2) ?? '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-secondary">回撤</div>
                                            <div className={`font-mono ${test.maxDrawdown !== undefined && test.maxDrawdown > 15 ? 'text-red-400' : 'text-secondary'}`}>{test.maxDrawdown ?? '-'}%</div>
                                        </div>
                                    </div>
                                )}

                                {/* 运行中进度 */}
                                {test.status === 'running' && (
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-[9px] text-dim">测试周期: {test.testPeriod}</span>
                                    </div>
                                )}

                                {/* 底部 */}
                                <div className="flex items-center justify-between text-[8px]">
                                    <span className="text-secondary">{new Date(test.startedAt).toLocaleDateString('zh-CN')} · {test.totalSignals ?? '-'} 信号</span>
                                    {test.status === 'completed' && test.recommended && onPromote && (
                                        <button onClick={() => onPromote(test.id)}
                                            className="text-[8px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 hover:bg-green-500/25">
                                            加入生产
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
});

SignalTestingPanel.displayName = 'SignalTestingPanel';
export default SignalTestingPanel;
