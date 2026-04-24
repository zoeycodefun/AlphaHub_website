/**
 * 策略卡片（Strategy Card）
 *
 * 展示单个策略的关键信息：
 *  - 策略名称 + 状态徽标
 *  - 执行模式 + 交易对 + 调度间隔
 *  - 执行统计（总次数/成功率/最近评分）
 *  - 操作按钮（启动/暂停/停止）
 */
import React, { memo, useCallback } from 'react';
import type { StrategyRecord, StrategyStatus } from '../../../type/alpha_module_types';

// =========================================================================
// 常量
// =========================================================================

const STATUS_CONFIG: Record<StrategyStatus, { label: string; color: string; dot: string }> = {
    active:  { label: '运行中', color: 'text-green-400 bg-green-400/10', dot: 'bg-green-400' },
    paused:  { label: '已暂停', color: 'text-yellow-400 bg-yellow-400/10', dot: 'bg-yellow-400' },
    stopped: { label: '已停止', color: 'text-muted bg-gray-400/10', dot: 'bg-gray-400' },
    error:   { label: '异常',   color: 'text-red-400 bg-red-400/10', dot: 'bg-red-400' },
};

const MODE_LABELS: Record<string, string> = {
    live: '实盘',
    dry_run: '模拟',
};

// =========================================================================
// Props
// =========================================================================

interface StrategyCardProps {
    strategy: StrategyRecord;
    onToggle: (id: string, action: 'activate' | 'pause' | 'stop') => void;
    onClick?: (strategy: StrategyRecord) => void;
}

// =========================================================================
// 工具函数
// =========================================================================

function timeAgo(iso: string | null): string {
    if (!iso) return '从未执行';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
}

// =========================================================================
// 主组件
// =========================================================================

const StrategyCard: React.FC<StrategyCardProps> = memo(({ strategy, onToggle, onClick }) => {
    const statusCfg = STATUS_CONFIG[strategy.status];
    const successRate = strategy.totalExecutions > 0
        ? ((strategy.successfulExecutions / strategy.totalExecutions) * 100).toFixed(1)
        : '—';

    const handleClick = useCallback(() => onClick?.(strategy), [onClick, strategy]);

    return (
        <div
            className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4 hover:border-strong/50 transition-all cursor-pointer"
            onClick={handleClick}
        >
            {/* ─── 顶部：名称 + 状态 ──────────────────────── */}
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-primary truncate">{strategy.name}</h4>
                <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} animate-pulse`} />
                    <span className={`text-[10px] px-2 py-0.5 rounded ${statusCfg.color}`}>
                        {statusCfg.label}
                    </span>
                </div>
            </div>

            {/* ─── 描述 ────────────────────────────────────── */}
            {strategy.description && (
                <p className="text-xs text-muted mb-3 line-clamp-2">{strategy.description}</p>
            )}

            {/* ─── 标签行 ──────────────────────────────────── */}
            <div className="flex flex-wrap gap-1.5 mb-3">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${strategy.executionMode === 'live' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {MODE_LABELS[strategy.executionMode] ?? strategy.executionMode}
                </span>
                {strategy.symbols.slice(0, 3).map(sym => (
                    <span key={sym} className="text-[10px] bg-surface-hover/50 text-secondary px-1.5 py-0.5 rounded">
                        {sym.replace('/USDT', '')}
                    </span>
                ))}
                {strategy.symbols.length > 3 && (
                    <span className="text-[10px] text-dim">+{strategy.symbols.length - 3}</span>
                )}
                <span className="text-[10px] bg-surface-hover/50 text-muted px-1.5 py-0.5 rounded">
                    {strategy.intervalMinutes}min
                </span>
            </div>

            {/* ─── 统计网格 ─────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div className="bg-card/50 rounded p-2 text-center">
                    <div className="text-dim mb-0.5">执行次数</div>
                    <div className="text-primary font-mono">{strategy.totalExecutions}</div>
                </div>
                <div className="bg-card/50 rounded p-2 text-center">
                    <div className="text-dim mb-0.5">成功率</div>
                    <div className="text-green-400 font-mono">{successRate}%</div>
                </div>
                <div className="bg-card/50 rounded p-2 text-center">
                    <div className="text-dim mb-0.5">最新评分</div>
                    <div className="text-yellow-400 font-mono">{strategy.lastSignalScore ?? '—'}</div>
                </div>
            </div>

            {/* ─── 底部：最后执行 + 操作按钮 ─────────────── */}
            <div className="flex items-center justify-between pt-2 border-t border-strong/30">
                <span className="text-[10px] text-secondary">最后执行: {timeAgo(strategy.lastExecutedAt)}</span>
                <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                    {strategy.status !== 'active' && (
                        <button
                            onClick={() => onToggle(strategy.id, 'activate')}
                            className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                        >
                            启动
                        </button>
                    )}
                    {strategy.status === 'active' && (
                        <button
                            onClick={() => onToggle(strategy.id, 'pause')}
                            className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
                        >
                            暂停
                        </button>
                    )}
                    {strategy.status !== 'stopped' && (
                        <button
                            onClick={() => onToggle(strategy.id, 'stop')}
                            className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                        >
                            停止
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

StrategyCard.displayName = 'StrategyCard';
export default StrategyCard;
