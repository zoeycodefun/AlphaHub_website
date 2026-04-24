/**
 * 策略列表项组件
 * 
 * 单条策略展示行，包含 7 个操作按钮：
 * 启动、暂停、修改参数、策略配置详情、运行状态/日志、停止、删除
 */
import React, { memo, useCallback, useState } from 'react';
import type { StrategyRecord } from '../../type/alpha_module_types';

// ─── 状态标识 ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    active:  { label: '运行中', color: 'text-green-400', dot: 'bg-green-400' },
    paused:  { label: '已暂停', color: 'text-yellow-400', dot: 'bg-yellow-400' },
    stopped: { label: '已停止', color: 'text-dim', dot: 'bg-base0' },
    error:   { label: '异常',  color: 'text-red-400', dot: 'bg-red-400' },
};

interface StrategyListItemProps {
    strategy: StrategyRecord;
    onActivate: (id: string) => void;
    onPause: (id: string) => void;
    onStop: (id: string) => void;
    onDelete: (id: string) => void;
    onEditParams: (strategy: StrategyRecord) => void;
    onViewConfig: (strategy: StrategyRecord) => void;
    onViewLogs: (strategy: StrategyRecord) => void;
}

const StrategyListItem: React.FC<StrategyListItemProps> = memo(({
    strategy,
    onActivate,
    onPause,
    onStop,
    onDelete,
    onEditParams,
    onViewConfig,
    onViewLogs,
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const statusCfg = STATUS_CONFIG[strategy.status] ?? STATUS_CONFIG.stopped;

    const handleDelete = useCallback(() => {
        onDelete(strategy.id);
        setShowDeleteConfirm(false);
    }, [strategy.id, onDelete]);

    const successRate = strategy.totalExecutions > 0
        ? ((strategy.successfulExecutions / strategy.totalExecutions) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="bg-surface/60 border border-strong/50 rounded-lg p-4 hover:border-strong/50 transition-colors">
            {/* 第一行：名称 + 状态 + 执行模式 */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${statusCfg.dot} ${strategy.status === 'active' ? 'animate-pulse' : ''}`} />
                    <h3 className="text-sm font-semibold text-primary truncate max-w-[180px]">{strategy.name}</h3>
                    <span className={`text-xs ${statusCfg.color}`}>{statusCfg.label}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    strategy.executionMode === 'live'
                        ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                        : 'bg-surface-hover/50 text-muted border border-strong/50'
                }`}>
                    {strategy.executionMode === 'live' ? '实盘' : '模拟'}
                </span>
            </div>

            {/* 第二行：关键指标 */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                    <span className="text-dim">交易对</span>
                    <p className="text-secondary truncate">{strategy.symbols.join(', ')}</p>
                </div>
                <div>
                    <span className="text-dim">成功率</span>
                    <p className="text-secondary">{successRate}%</p>
                </div>
                <div>
                    <span className="text-dim">累计盈亏</span>
                    <p className={strategy.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {strategy.totalPnl >= 0 ? '+' : ''}{strategy.totalPnl.toFixed(2)} U
                    </p>
                </div>
            </div>

            {strategy.leverage && (
                <div className="text-xs text-dim mb-3">
                    杠杆: <span className="text-yellow-400">{strategy.leverage}x</span>
                </div>
            )}

            {/* 7 个操作按钮 */}
            <div className="flex flex-wrap gap-1.5">
                {/* 1. 启动 */}
                <button
                    onClick={() => onActivate(strategy.id)}
                    disabled={strategy.status === 'active'}
                    className="px-2 py-1 text-xs rounded bg-green-900/40 text-green-400 hover:bg-green-900/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="启动策略"
                >
                    ▶ 启动
                </button>

                {/* 2. 暂停 */}
                <button
                    onClick={() => onPause(strategy.id)}
                    disabled={strategy.status !== 'active'}
                    className="px-2 py-1 text-xs rounded bg-yellow-900/40 text-yellow-400 hover:bg-yellow-900/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="暂停策略"
                >
                    ⏸ 暂停
                </button>

                {/* 3. 修改参数 */}
                <button
                    onClick={() => onEditParams(strategy)}
                    disabled={strategy.status === 'active'}
                    className="px-2 py-1 text-xs rounded bg-blue-900/40 text-blue-400 hover:bg-blue-900/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="修改参数（需先暂停）"
                >
                    ✏️ 参数
                </button>

                {/* 4. 配置详情 */}
                <button
                    onClick={() => onViewConfig(strategy)}
                    className="px-2 py-1 text-xs rounded bg-surface-hover/50 text-secondary hover:bg-surface-hover transition-colors"
                    title="查看策略配置详情"
                >
                    📋 详情
                </button>

                {/* 5. 运行状态/日志 */}
                <button
                    onClick={() => onViewLogs(strategy)}
                    className="px-2 py-1 text-xs rounded bg-purple-900/40 text-purple-400 hover:bg-purple-900/70 transition-colors"
                    title="查看运行状态与日志"
                >
                    📊 日志
                </button>

                {/* 6. 停止 */}
                <button
                    onClick={() => onStop(strategy.id)}
                    disabled={strategy.status === 'stopped'}
                    className="px-2 py-1 text-xs rounded bg-red-900/40 text-red-400 hover:bg-red-900/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="停止策略（不可逆）"
                >
                    ⏹ 停止
                </button>

                {/* 7. 删除 */}
                {!showDeleteConfirm ? (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={strategy.status === 'active'}
                        className="px-2 py-1 text-xs rounded bg-red-900/30 text-red-500 hover:bg-red-900/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="删除策略（需先停止）"
                    >
                        🗑 删除
                    </button>
                ) : (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleDelete}
                            className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-500 transition-colors"
                        >
                            确认删除
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-2 py-1 text-xs rounded bg-surface-hover text-secondary hover:bg-surface-hover transition-colors"
                        >
                            取消
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

StrategyListItem.displayName = 'StrategyListItem';
export default StrategyListItem;
