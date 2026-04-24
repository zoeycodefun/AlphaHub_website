/**
 * 现货成交量组件（SpotTradeVolume）
 *
 * 展示当前交易对的最近成交记录流：
 *
 *   1. 最近成交列表（时间 / 方向 / 价格 / 数量）
 *   2. 买卖比例条（实时买卖力量对比）
 *   3. 数据来源：WebSocket trades 频道（当前为模拟数据）
 *
 * 布局位于 K 线图下方，提供市场微观结构视图。
 */
import React, { memo, useState, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { useTradingStore } from '../../../../global_state_store/trading_global_state_store';
import { useTicker } from '../../../../global_state_store/market_data_store';
import { formatPrice, formatVolume } from '../../../../hooks/use_format';

// =========================================================================
// 成交记录类型
// =========================================================================

interface RecentTrade {
    id: string;
    price: number;
    amount: number;
    side: 'buy' | 'sell';
    timestamp: number;
}

// =========================================================================
// 组件
// =========================================================================

const SpotTradeVolume = memo(function SpotTradeVolume() {
    const activeSymbol = useTradingStore((s) => s.activeSymbol);
    const activeExchangeId = useTradingStore((s) => s.activeExchangeId);
    const ticker = useTicker(activeSymbol, activeExchangeId);

    // 模拟最近成交数据（后续接入 WebSocket trades 频道）
    const mockTrades = useMemo<RecentTrade[]>(() => {
        const basePrice = ticker?.last ?? 50000;
        return Array.from({ length: 20 }, (_, i) => ({
            id: `trade-${i}`,
            price: basePrice + (Math.random() - 0.5) * basePrice * 0.001,
            amount: Math.random() * 2 + 0.001,
            side: Math.random() > 0.5 ? 'buy' : 'sell',
            timestamp: Date.now() - i * 3000,
        }));
    }, [ticker?.last]);

    // 买卖比例计算
    const { buyPercent, sellPercent } = useMemo(() => {
        const buyCount = mockTrades.filter((t) => t.side === 'buy').length;
        const total = mockTrades.length || 1;
        const bp = Math.round((buyCount / total) * 100);
        return { buyPercent: bp, sellPercent: 100 - bp };
    }, [mockTrades]);

    return (
        <div className="flex-1 bg-card rounded-lg flex flex-col overflow-hidden min-h-0">
            {/* ─── 标题 & 买卖比例 ─────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-base shrink-0">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-blue-400" />
                    <span className="text-xs text-muted font-medium">最近成交</span>
                </div>
                {/* 买卖力量条 */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-green-500">{buyPercent}%</span>
                    <div className="w-20 h-1.5 rounded-full bg-surface-hover flex overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${buyPercent}%` }}
                        />
                        <div
                            className="h-full bg-red-500 transition-all duration-500"
                            style={{ width: `${sellPercent}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-red-500">{sellPercent}%</span>
                </div>
            </div>

            {/* ─── 表头 ───────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-2 px-3 py-1 text-[10px] text-dim shrink-0">
                <span>价格</span>
                <span className="text-right">数量</span>
                <span className="text-right">时间</span>
            </div>

            {/* ─── 成交列表 ───────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {mockTrades.map((trade) => (
                    <div
                        key={trade.id}
                        className="grid grid-cols-3 gap-2 px-3 py-0.5 text-xs font-mono hover:bg-surface/30"
                    >
                        <span className={trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                            {formatPrice(trade.price)}
                        </span>
                        <span className="text-right text-secondary">
                            {trade.amount.toFixed(4)}
                        </span>
                        <span className="text-right text-dim">
                            {new Date(trade.timestamp).toLocaleTimeString('zh-CN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            })}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
});

SpotTradeVolume.displayName = 'SpotTradeVolume';

export default SpotTradeVolume;
