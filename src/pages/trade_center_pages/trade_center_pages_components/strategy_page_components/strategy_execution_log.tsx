/**
 * 策略执行日志（Strategy Execution Log）
 *
 * 展示策略的历史执行记录：
 *  - 状态图标（成功/失败/跳过/风控拒绝）
 *  - 信号评分 + 方向
 *  - 耗时
 *  - 风控拒绝原因
 */
import React, { memo } from 'react';
import type { StrategyExecutionLog as LogType } from '../../../type/alpha_module_types';

// =========================================================================
// 常量
// =========================================================================

const LOG_STATUS_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
    success:       { icon: '✅', label: '成功',   color: 'text-green-400' },
    failed:        { icon: '❌', label: '失败',   color: 'text-red-400' },
    skipped:       { icon: '⏭️', label: '跳过',   color: 'text-muted' },
    risk_rejected: { icon: '🛡️', label: '风控拒绝', color: 'text-yellow-400' },
};

// =========================================================================
// Props
// =========================================================================

interface StrategyExecutionLogProps {
    logs: LogType[];
    isLoading: boolean;
}

// =========================================================================
// 工具函数
// =========================================================================

function formatTime(iso: string): string {
    return new Date(iso).toLocaleString('zh-CN', {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
}

// =========================================================================
// 主组件
// =========================================================================

const StrategyExecutionLog: React.FC<StrategyExecutionLogProps> = memo(({ logs, isLoading }) => {
    if (isLoading) {
        return (
            <div className="bg-surface/60 rounded-xl border border-strong/50 p-4">
                <h3 className="text-sm font-semibold text-primary mb-3">执行日志</h3>
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-10 bg-surface-hover/30 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4">
            <h3 className="text-sm font-semibold text-primary mb-3">执行日志</h3>

            {logs.length === 0 ? (
                <div className="text-center text-dim text-sm py-8">暂无执行记录</div>
            ) : (
                <div className="space-y-1 max-h-80 overflow-y-auto">
                    {logs.map(log => {
                        const cfg = LOG_STATUS_CONFIG[log.status] || LOG_STATUS_CONFIG.failed;
                        return (
                            <div key={log.id} className="flex items-center gap-3 py-2 px-2 rounded hover:bg-card/5 text-xs">
                                {/* 状态图标 */}
                                <span className="text-sm">{cfg.icon}</span>

                                {/* 时间 */}
                                <span className="text-dim font-mono w-28 shrink-0">{formatTime(log.executedAt)}</span>

                                {/* 状态标签 */}
                                <span className={`w-14 shrink-0 ${cfg.color}`}>{cfg.label}</span>

                                {/* 信号评分 */}
                                <span className="text-muted w-16 shrink-0">
                                    {log.signalScore !== null ? (
                                        <>
                                            <span className={log.signalDirection === 'buy' ? 'text-green-400' : 'text-red-400'}>
                                                {log.signalDirection === 'buy' ? '▲' : '▼'}
                                            </span>
                                            {' '}{log.signalScore}
                                        </>
                                    ) : '—'}
                                </span>

                                {/* 耗时 */}
                                <span className="text-secondary w-14 shrink-0 text-right">{log.durationMs}ms</span>

                                {/* 风控原因 */}
                                {log.riskRejectionReason && (
                                    <span className="text-yellow-400/80 truncate">{log.riskRejectionReason}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

StrategyExecutionLog.displayName = 'StrategyExecutionLog';
export default StrategyExecutionLog;
