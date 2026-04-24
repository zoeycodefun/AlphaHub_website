/**
 * 信号管线状态（Signal Pipeline Status）
 *
 * 展示信号从候选 → 测试 → 生产的管线流转统计：
 *  - 四阶段数量（候选/测试/生产/禁用）
 *  - 可视化管线流
 *  - 最近入池/最近测试时间
 */
import React, { memo } from 'react';
import type { SignalPipelineStatus as PipelineStatusType } from '../../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface SignalPipelineStatusProps {
    pipeline: PipelineStatusType | null;
}

// =========================================================================
// 阶段配置
// =========================================================================

interface StageConfig {
    key: 'candidateCount' | 'testingCount' | 'productionCount' | 'disabledCount';
    label: string;
    icon: string;
    color: string;
    barColor: string;
}

const STAGES: StageConfig[] = [
    { key: 'candidateCount',  label: '候选池',  icon: '📥', color: 'text-blue-400',   barColor: 'bg-blue-500' },
    { key: 'testingCount',    label: '测试中',  icon: '🧪', color: 'text-yellow-400', barColor: 'bg-yellow-500' },
    { key: 'productionCount', label: '生产中',  icon: '🚀', color: 'text-green-400',  barColor: 'bg-green-500' },
    { key: 'disabledCount',   label: '已禁用',  icon: '⏸️', color: 'text-dim',   barColor: 'bg-gray-600' },
];

// =========================================================================
// 主组件
// =========================================================================

const SignalPipelineStatusPanel: React.FC<SignalPipelineStatusProps> = memo(({ pipeline }) => {
    if (!pipeline) {
        return (
            <div className="bg-card rounded-lg p-4 text-center">
                <div className="text-secondary text-xs">暂无管线数据</div>
            </div>
        );
    }

    const total = pipeline.productionCount + pipeline.testingCount + pipeline.candidateCount + pipeline.disabledCount;

    return (
        <div className="bg-card rounded-lg overflow-hidden">
            {/* Header */}
            <div className="px-3 py-2 border-b border-base">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary">🔄 信号管线</span>
                    <span className="text-[9px] text-dim">共 {total} 个信号</span>
                </div>
            </div>

            {/* 管线流可视化 */}
            <div className="px-3 py-3">
                {/* 阶段圆圈 + 箭头 */}
                <div className="flex items-center justify-between mb-3">
                    {STAGES.map((stage, idx) => {
                        const count = pipeline[stage.key];
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                            <React.Fragment key={stage.key}>
                                <div className="flex flex-col items-center gap-1">
                                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                                        count > 0 ? `border-current ${stage.color}` : 'border-strong text-secondary'
                                    }`}>
                                        <span className="text-sm font-bold font-mono">{count}</span>
                                    </div>
                                    <span className="text-[8px] text-dim">{stage.icon} {stage.label}</span>
                                    <span className="text-[8px] text-secondary">{pct}%</span>
                                </div>
                                {idx < STAGES.length - 1 && (
                                    <div className="flex-1 flex items-center justify-center -mt-4">
                                        <div className="w-full h-px bg-surface-hover relative">
                                            <span className="absolute -right-0.5 -top-[3px] text-[8px] text-secondary">→</span>
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* 堆叠条 */}
                <div className="h-2 bg-surface rounded-full overflow-hidden flex">
                    {STAGES.map(stage => {
                        const count = pipeline[stage.key];
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        if (pct === 0) return null;
                        return (
                            <div key={stage.key}
                                 className={`h-full ${stage.barColor} transition-all duration-500`}
                                 style={{ width: `${pct}%` }} />
                        );
                    })}
                </div>

                {/* 最近时间 */}
                <div className="flex items-center justify-between mt-2.5 text-[8px] text-secondary">
                    <span>
                        最近入池: {pipeline.lastPromotedAt
                            ? new Date(pipeline.lastPromotedAt).toLocaleDateString('zh-CN')
                            : '—'}
                    </span>
                    <span>
                        最近测试: {pipeline.lastTestRunAt
                            ? new Date(pipeline.lastTestRunAt).toLocaleDateString('zh-CN')
                            : '—'}
                    </span>
                </div>
            </div>
        </div>
    );
});

SignalPipelineStatusPanel.displayName = 'SignalPipelineStatusPanel';
export default SignalPipelineStatusPanel;
