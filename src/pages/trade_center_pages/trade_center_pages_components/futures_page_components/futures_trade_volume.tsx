/**
 * 合约成交量组件（FuturesTradeVolume）
 *
 * 展示合约的最近成交记录 + 多空力量对比：
 *
 *   1. 最近成交流水（价格 / 数量 / 方向 / 时间）
 *   2. 多空成交比例条
 *   3. 清算信息摘要（大额清算事件，预留）
 *
 * 数据来源：后续接入 WebSocket trades 频道，当前为模拟数据。
 */
import React, { memo, useMemo } from 'react';
import { Activity, Flame } from 'lucide-react';
import { useTradingStore } from '../../../../global_state_store/trading_global_state_store';
import { useTicker } from '../../../../global_state_store/market_data_store';
import { formatPrice, formatVolume } from '../../../../hooks/use_format';

// =========================================================================
// 类型
// =========================================================================

interface RecentTrade {
    id: string;
    price: number;
    amount: number;
    side: 'buy' | 'sell';
    timestamp: number;
    /** 是否为清算单 */
    isLiquidation?: boolean;
}

// =========================================================================
// 组件
// =========================================================================

const FuturesTradeVolume = memo(function FuturesTradeVolume() {
    const activeSymbol = useTradingStore((s) => s.activeSymbol);
    const activeExchangeId = useTradingStore((s) => s.activeExchangeId);
    const ticker = useTicker(activeSymbol, activeExchangeId);

    // 模拟成交数据
    const mockTrades = useMemo<RecentTrade[]>(() => {
        const basePrice = ticker?.last ?? 50000;
        return Array.from({ length: 25 }, (_, i) => ({
            id: `ftrade-${i}`,
            price: basePrice + (Math.random() - 0.5) * basePrice * 0.002,
            amount: Math.random() * 5 + 0.01,
            side: Math.random() > 0.48 ? 'buy' : 'sell',
            timestamp: Date.now() - i * 2500,
            isLiquidation: Math.random() < 0.05,
        }));
    }, [ticker?.last]);

    // 多空比
    const { buyPercent, sellPercent } = useMemo(() => {
        const buyVol = mockTrades.filter(t => t.side === 'buy').reduce((sum, t) => sum + t.amount, 0);
        const totalVol = mockTrades.reduce((sum, t) => sum + t.amount, 0) || 1;
        const bp = Math.round((buyVol / totalVol) * 100);
        return { buyPercent: bp, sellPercent: 100 - bp };
    }, [mockTrades]);

    return (
        <div className="flex-1 bg-card rounded-lg flex flex-col overflow-hidden min-h-0">
            {/* ─── 标题 & 多空比 ───────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-base shrink-0">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-blue-400" />
                    <span className="text-xs text-muted font-medium">最近成交</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-green-500">多 {buyPercent}%</span>
                    <div className="w-20 h-1.5 rounded-full bg-surface-hover flex overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${buyPercent}%` }} />
                        <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${sellPercent}%` }} />
                    </div>
                    <span className="text-[10px] text-red-500">空 {sellPercent}%</span>
                </div>
            </div>

            {/* ─── 表头 ───────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-2 px-3 py-1 text-[10px] text-dim shrink-0">
                <span>价格</span>
                <span className="text-right">数量（张）</span>
                <span className="text-right">时间</span>
            </div>

            {/* ─── 成交列表 ───────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {mockTrades.map((trade) => (
                    <div
                        key={trade.id}
                        className={`grid grid-cols-3 gap-2 px-3 py-0.5 text-xs font-mono hover:bg-surface/30 ${
                            trade.isLiquidation ? 'bg-orange-500/5' : ''
                        }`}
                    >
                        <span className={`flex items-center gap-1 ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.isLiquidation && <Flame size={10} className="text-orange-500" />}
                            {formatPrice(trade.price)}
                        </span>
                        <span className="text-right text-secondary">
                            {trade.amount.toFixed(3)}
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

FuturesTradeVolume.displayName = 'FuturesTradeVolume';

export default FuturesTradeVolume;
