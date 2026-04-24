/**
 * 现货订单簿组件（SpotOrderbook）
 *
 * 展示当前交易对的实时买卖挂单深度：
 *
 *   1. 卖单列表（红色，价格从高到低排列）
 *   2. 最新成交价 & 涨跌指示
 *   3. 买单列表（绿色，价格从高到低排列）
 *   4. 深度条形图（背景宽度反映单量占比）
 *   5. 精度选择器（0.01 / 0.1 / 1 / 10）
 *
 * 数据来源：useOrderBook 选择器（Zustand + WebSocket）
 */
import React, { memo, useState, useMemo } from 'react';
import { useTradingStore } from '../../../../global_state_store/trading_global_state_store';
import { useOrderBook, useTicker } from '../../../../global_state_store/market_data_store';
import { formatPrice, formatVolume, getPnlColorClass } from '../../../../hooks/use_format';

// =========================================================================
// 精度选项
// =========================================================================

const PRECISION_OPTIONS = [
    { value: 2, label: '0.01' },
    { value: 1, label: '0.1' },
    { value: 0, label: '1' },
] as const;

/** 默认展示档位数 */
const MAX_DEPTH = 15;

// =========================================================================
// 组件
// =========================================================================

const SpotOrderbook = memo(function SpotOrderbook() {
    const activeSymbol = useTradingStore((s) => s.activeSymbol);
    const activeExchangeId = useTradingStore((s) => s.activeExchangeId);

    const orderBook = useOrderBook(activeSymbol, activeExchangeId);
    const ticker = useTicker(activeSymbol, activeExchangeId);

    const [precision, setPrecision] = useState(2);

    // 处理订单簿数据：截取前 N 档，计算最大数量用于深度条宽度
    const { displayAsks, displayBids, maxAmount } = useMemo(() => {
        if (!orderBook) return { displayAsks: [], displayBids: [], maxAmount: 1 };

        const asks = orderBook.asks.slice(0, MAX_DEPTH).reverse(); // 卖单从低到高
        const bids = orderBook.bids.slice(0, MAX_DEPTH);           // 买单从高到低

        const allAmounts = [...asks, ...bids].map(([, amount]) => amount);
        const maxAmt = Math.max(...allAmounts, 1);

        return { displayAsks: asks, displayBids: bids, maxAmount: maxAmt };
    }, [orderBook]);

    return (
        <div className="flex-1 bg-card rounded-lg flex flex-col overflow-hidden min-h-0">
            {/* ─── 标题栏 ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-base shrink-0">
                <span className="text-xs text-muted font-medium">订单簿</span>
                <div className="flex gap-1">
                    {PRECISION_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setPrecision(opt.value)}
                            className={`px-2 py-0.5 text-xs rounded transition-colors ${
                                precision === opt.value
                                    ? 'bg-surface-hover text-primary'
                                    : 'text-dim hover:text-secondary'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── 表头 ───────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-2 px-3 py-1.5 text-xs text-dim shrink-0">
                <span>价格</span>
                <span className="text-right">数量</span>
                <span className="text-right">累计</span>
            </div>

            {/* ─── 卖单（红色） ───────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-end px-1">
                {displayAsks.map(([price, amount], index) => {
                    const widthPercent = (amount / maxAmount) * 100;
                    return (
                        <div key={`ask-${index}`} className="relative grid grid-cols-3 gap-2 px-2 py-0.5 text-xs hover:bg-surface/50">
                            {/* 深度条背景 */}
                            <div
                                className="absolute right-0 top-0 bottom-0 bg-red-500/10"
                                style={{ width: `${widthPercent}%` }}
                            />
                            <span className="relative text-red-400 font-mono">
                                {price.toFixed(precision)}
                            </span>
                            <span className="relative text-right text-secondary font-mono">
                                {formatVolume(amount, 4)}
                            </span>
                            <span className="relative text-right text-dim font-mono">
                                {formatVolume(price * amount)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* ─── 最新价格（中间分隔） ───────────────────────────── */}
            <div className="px-3 py-2 border-y border-base shrink-0">
                {ticker ? (
                    <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold font-mono ${getPnlColorClass(ticker.changePercent)}`}>
                            {formatPrice(ticker.last, precision)}
                        </span>
                        <span className={`text-xs ${getPnlColorClass(ticker.changePercent)}`}>
                            {ticker.changePercent >= 0 ? '↑' : '↓'}
                        </span>
                        <span className="text-xs text-dim">
                            ≈ ${formatPrice(ticker.last, 2)}
                        </span>
                    </div>
                ) : (
                    <span className="text-sm text-dim">等待价格...</span>
                )}
            </div>

            {/* ─── 买单（绿色） ───────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col px-1">
                {displayBids.map(([price, amount], index) => {
                    const widthPercent = (amount / maxAmount) * 100;
                    return (
                        <div key={`bid-${index}`} className="relative grid grid-cols-3 gap-2 px-2 py-0.5 text-xs hover:bg-surface/50">
                            <div
                                className="absolute right-0 top-0 bottom-0 bg-green-500/10"
                                style={{ width: `${widthPercent}%` }}
                            />
                            <span className="relative text-green-400 font-mono">
                                {price.toFixed(precision)}
                            </span>
                            <span className="relative text-right text-secondary font-mono">
                                {formatVolume(amount, 4)}
                            </span>
                            <span className="relative text-right text-dim font-mono">
                                {formatVolume(price * amount)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

SpotOrderbook.displayName = 'SpotOrderbook';

export default SpotOrderbook;
