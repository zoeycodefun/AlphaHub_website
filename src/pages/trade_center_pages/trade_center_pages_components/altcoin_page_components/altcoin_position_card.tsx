/**
 * 山寨币持仓卡片（Altcoin Position Card）
 *
 * 展示单个山寨币持仓的关键信息：
 *  - 币种 / 交易所 / 持仓状态
 *  - 买入均价 / 当前价 / 盈亏
 *  - 持仓数量 / 总市值
 *  - 备注 + 操作按钮（卖出/删除）
 */
import React, { memo, useCallback } from 'react';
import type { AltcoinPositionRecord, AltcoinPositionStatus } from '../../../type/alpha_module_types';

// =========================================================================
// 常量
// =========================================================================

const STATUS_CONFIG: Record<AltcoinPositionStatus, { label: string; color: string }> = {
    holding: { label: '持仓中', color: 'text-green-400 bg-green-400/10' },
    partial_sold: { label: '部分卖出', color: 'text-yellow-400 bg-yellow-400/10' },
    sold: { label: '已清仓', color: 'text-muted bg-gray-400/10' },
};

// =========================================================================
// Props
// =========================================================================

interface AltcoinPositionCardProps {
    position: AltcoinPositionRecord;
    onSell?: (id: string) => void;
    onDelete?: (id: string) => void;
}

// =========================================================================
// 工具函数
// =========================================================================

function fmtUsd(v: number): string {
    return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pnlPercent(entry: number, current: number): number {
    if (entry === 0) return 0;
    return ((current - entry) / entry) * 100;
}

// =========================================================================
// 主组件
// =========================================================================

const AltcoinPositionCard: React.FC<AltcoinPositionCardProps> = memo(({ position, onSell, onDelete }) => {
    const statusCfg = STATUS_CONFIG[position.status];
    const pnlPct = pnlPercent(position.avgEntryPrice, position.currentPrice);
    const unrealizedPnl = (position.currentPrice - position.avgEntryPrice) * position.quantity;
    const marketValue = position.currentPrice * position.quantity;

    const handleSell = useCallback(() => onSell?.(position.id), [onSell, position.id]);
    const handleDelete = useCallback(() => onDelete?.(position.id), [onDelete, position.id]);

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4 hover:border-strong/50 transition-all">
            {/* 头部：币种 + 状态 */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">{position.symbol.replace('/USDT', '')}</span>
                    <span className="text-[10px] text-dim">{position.exchange}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded ${statusCfg.color}`}>{statusCfg.label}</span>
            </div>

            {/* 价格行 */}
            <div className="flex items-end justify-between mb-3">
                <div>
                    <div className="text-[10px] text-dim">当前价</div>
                    <div className="text-lg font-bold text-primary">{fmtUsd(position.currentPrice)}</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-dim">买入均价</div>
                    <div className="text-sm text-secondary">{fmtUsd(position.avgEntryPrice)}</div>
                </div>
            </div>

            {/* 指标网格 */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div className="bg-card/50 rounded p-2 text-center">
                    <div className="text-dim mb-0.5">持仓量</div>
                    <div className="text-primary font-mono">{position.quantity.toLocaleString()}</div>
                </div>
                <div className="bg-card/50 rounded p-2 text-center">
                    <div className="text-dim mb-0.5">市值</div>
                    <div className="text-primary font-mono">{fmtUsd(marketValue)}</div>
                </div>
                <div className="bg-card/50 rounded p-2 text-center">
                    <div className="text-dim mb-0.5">浮动盈亏</div>
                    <div className={`font-mono ${unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {unrealizedPnl >= 0 ? '+' : ''}{fmtUsd(unrealizedPnl)}
                    </div>
                </div>
            </div>

            {/* 涨跌幅条 */}
            <div className="mb-3">
                <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-dim">涨跌幅</span>
                    <span className={pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                    </span>
                </div>
                <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${pnlPct >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(Math.abs(pnlPct), 100)}%` }}
                    />
                </div>
            </div>

            {/* 备注 */}
            {position.note && (
                <div className="text-[10px] text-dim mb-3 truncate" title={position.note}>
                    📝 {position.note}
                </div>
            )}

            {/* 操作按钮 */}
            {position.status !== 'sold' && (
                <div className="flex gap-2 pt-2 border-t border-strong/30">
                    <button
                        onClick={handleSell}
                        className="flex-1 text-xs py-1.5 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
                    >
                        卖出
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex-1 text-xs py-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    >
                        删除
                    </button>
                </div>
            )}
        </div>
    );
});

AltcoinPositionCard.displayName = 'AltcoinPositionCard';
export default AltcoinPositionCard;
