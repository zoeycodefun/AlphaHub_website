/**
 * 对冲组合卡片（Hedge Pair Card）
 *
 * 展示单个对冲组合的状态与盈亏：
 *  - 多头/空头交易对 + 对冲比例
 *  - 仓位金额 + 组合盈亏
 *  - 实时相关系数
 *  - 操作按钮（调整比例/关闭）
 */
import React, { memo, useCallback } from 'react';
import type { HedgePairRecord, HedgePairStatus } from '../../../type/alpha_module_types';

// =========================================================================
// 常量
// =========================================================================

const STATUS_CONFIG: Record<HedgePairStatus, { label: string; color: string }> = {
    active: { label: '运行中', color: 'text-green-400 bg-green-400/10' },
    paused: { label: '已暂停', color: 'text-yellow-400 bg-yellow-400/10' },
    closed: { label: '已关闭', color: 'text-muted bg-gray-400/10' },
};

// =========================================================================
// Props
// =========================================================================

interface HedgePairCardProps {
    pair: HedgePairRecord;
    onClose?: (id: string) => void;
    onAdjust?: (id: string) => void;
}

// =========================================================================
// 工具函数
// =========================================================================

function correlationColor(v: number): string {
    if (v > 0.7) return 'text-green-400';
    if (v > 0.3) return 'text-yellow-400';
    if (v > -0.3) return 'text-muted';
    return 'text-red-400';
}

function fmtUsd(v: number): string {
    return `$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// =========================================================================
// 主组件
// =========================================================================

const HedgePairCard: React.FC<HedgePairCardProps> = memo(({ pair, onClose, onAdjust }) => {
    const statusCfg = STATUS_CONFIG[pair.status];

    const handleClose = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onClose?.(pair.id);
    }, [onClose, pair.id]);

    const handleAdjust = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onAdjust?.(pair.id);
    }, [onAdjust, pair.id]);

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4 hover:border-strong/50 transition-all">
            {/* 顶部：名称 + 状态 */}
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-primary">{pair.name}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded ${statusCfg.color}`}>{statusCfg.label}</span>
            </div>

            {/* 交易对展示：多头 ↔ 空头 */}
            <div className="flex items-center justify-center gap-3 mb-3 py-2 bg-card/50 rounded-lg">
                <div className="text-center">
                    <div className="text-[10px] text-green-400 mb-0.5">多头 LONG</div>
                    <div className="text-sm font-bold text-primary">{pair.longSymbol.replace('/USDT', '')}</div>
                    <div className="text-[10px] text-dim">{fmtUsd(pair.longAmount)}</div>
                </div>
                <div className="text-secondary text-lg">⇄</div>
                <div className="text-center">
                    <div className="text-[10px] text-red-400 mb-0.5">空头 SHORT</div>
                    <div className="text-sm font-bold text-primary">{pair.shortSymbol.replace('/USDT', '')}</div>
                    <div className="text-[10px] text-dim">{fmtUsd(pair.shortAmount)}</div>
                </div>
            </div>

            {/* 指标网格 */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div className="bg-card/50 rounded p-2 text-center">
                    <div className="text-dim mb-0.5">对冲比例</div>
                    <div className="text-primary font-mono">{pair.hedgeRatio.toFixed(2)}</div>
                </div>
                <div className="bg-card/50 rounded p-2 text-center">
                    <div className="text-dim mb-0.5">组合盈亏</div>
                    <div className={`font-mono ${pair.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pair.totalPnl >= 0 ? '+' : ''}{fmtUsd(pair.totalPnl)}
                    </div>
                </div>
                <div className="bg-card/50 rounded p-2 text-center">
                    <div className="text-dim mb-0.5">相关系数</div>
                    <div className={`font-mono ${correlationColor(pair.currentCorrelation)}`}>
                        {pair.currentCorrelation.toFixed(3)}
                    </div>
                </div>
            </div>

            {/* 操作按钮 */}
            {pair.status !== 'closed' && (
                <div className="flex gap-2 pt-2 border-t border-strong/30">
                    <button
                        onClick={handleAdjust}
                        className="flex-1 text-xs py-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                    >
                        调整比例
                    </button>
                    <button
                        onClick={handleClose}
                        className="flex-1 text-xs py-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    >
                        关闭组合
                    </button>
                </div>
            )}
        </div>
    );
});

HedgePairCard.displayName = 'HedgePairCard';
export default HedgePairCard;
