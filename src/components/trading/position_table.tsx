/**
 * 持仓表格组件（PositionTable）
 *
 * 展示合约持仓列表，功能：
 *
 *   1. 可排序表格：交易对、方向、数量、开仓价、标记价、盈亏
 *   2. 实时盈亏更新（通过 Ticker 推送重算）
 *   3. 快捷操作：一键平仓、修改止盈止损
 *   4. 空状态展示
 *
 * Props 驱动，不直接依赖全局 Store，由父组件传入数据和回调。
 */
import React, { memo, useCallback } from 'react';
import { X, Shield, TrendingUp, TrendingDown } from 'lucide-react';
import type { FuturesPosition } from '../../pages/trade_center_pages/type/futures_trading_types';
import { formatPrice, formatPnl, formatPercent, getPnlColorClass } from '../../hooks/use_format';

// =========================================================================
// 类型定义
// =========================================================================

export interface PositionTableProps {
    /** 持仓列表 */
    positions: FuturesPosition[];
    /** 是否加载中 */
    isLoading?: boolean;
    /** 一键平仓回调 */
    onClosePosition?: (symbol: string, positionSide: string) => void;
    /** 修改止盈止损回调 */
    onEditTpSl?: (position: FuturesPosition) => void;
    /** 自定义 CSS */
    className?: string;
}

// =========================================================================
// 组件实现
// =========================================================================

const PositionTable = memo(function PositionTable(props: PositionTableProps) {
    const {
        positions,
        isLoading = false,
        onClosePosition,
        onEditTpSl,
        className = '',
    } = props;

    // 平仓确认
    const handleClose = useCallback((symbol: string, positionSide: string) => {
        onClosePosition?.(symbol, positionSide);
    }, [onClosePosition]);

    if (isLoading) {
        return (
            <div className={`bg-card rounded-lg p-4 ${className}`}>
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-card rounded-lg overflow-hidden ${className}`}>
            {/* ─── 表头 ───────────────────────────────────────────── */}
            <div className="grid grid-cols-8 gap-2 px-4 py-2 bg-surface/50 text-xs text-dim font-medium">
                <span>交易对</span>
                <span>方向</span>
                <span className="text-right">数量</span>
                <span className="text-right">开仓价</span>
                <span className="text-right">标记价</span>
                <span className="text-right">未实现盈亏</span>
                <span className="text-right">保证金</span>
                <span className="text-right">操作</span>
            </div>

            {/* ─── 数据行 ─────────────────────────────────────────── */}
            {positions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-dim text-sm">
                    <Shield size={24} className="mb-2 text-secondary" />
                    <span>暂无持仓</span>
                </div>
            ) : (
                positions.map((pos) => (
                    <div
                        key={`${pos.positionId}`}
                        className="grid grid-cols-8 gap-2 px-4 py-3 border-b border-base hover:bg-surface/30 text-sm items-center"
                    >
                        {/* 交易对 + 杠杆 */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-primary font-medium">{pos.symbol}</span>
                            <span className="text-xs px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-500">
                                {pos.leverage}x
                            </span>
                        </div>

                        {/* 持仓方向 */}
                        <div className="flex items-center gap-1">
                            {pos.positionSide === 'long' ? (
                                <>
                                    <TrendingUp size={14} className="text-green-500" />
                                    <span className="text-green-500 text-xs font-medium">多头</span>
                                </>
                            ) : (
                                <>
                                    <TrendingDown size={14} className="text-red-500" />
                                    <span className="text-red-500 text-xs font-medium">空头</span>
                                </>
                            )}
                        </div>

                        {/* 数量 */}
                        <span className="text-right text-primary font-mono">
                            {Math.abs(pos.amount).toFixed(4)}
                        </span>

                        {/* 开仓价 */}
                        <span className="text-right text-primary font-mono">
                            {formatPrice(pos.entryPrice)}
                        </span>

                        {/* 标记价 */}
                        <span className="text-right text-secondary font-mono">
                            {formatPrice(pos.markPrice)}
                        </span>

                        {/* 未实现盈亏 */}
                        <div className="text-right">
                            <div className={`font-mono font-medium ${getPnlColorClass(pos.unrealizedPnl)}`}>
                                {formatPnl(pos.unrealizedPnl)} USDT
                            </div>
                            <div className={`text-xs ${getPnlColorClass(pos.unrealizedPnlPercent)}`}>
                                {formatPercent(pos.unrealizedPnlPercent)}
                            </div>
                        </div>

                        {/* 保证金 */}
                        <span className="text-right text-secondary font-mono text-xs">
                            {pos.margin.toFixed(2)} USDT
                        </span>

                        {/* 操作 */}
                        <div className="flex items-center justify-end gap-2">
                            {onEditTpSl && (
                                <button
                                    onClick={() => onEditTpSl(pos)}
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    止盈止损
                                </button>
                            )}
                            {onClosePosition && (
                                <button
                                    onClick={() => handleClose(pos.symbol, pos.positionSide)}
                                    className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-0.5"
                                >
                                    <X size={12} />
                                    平仓
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
});

PositionTable.displayName = 'PositionTable';

export { PositionTable };
