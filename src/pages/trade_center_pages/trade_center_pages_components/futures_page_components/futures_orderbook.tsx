/**
 * 合约订单簿组件（FuturesOrderbook）
 *
 * 与现货订单簿基本一致，增加合约特有信息：
 *
 *   1. 标记价格（Mark Price）高亮展示
 *   2. 持仓量（Open Interest）指标
 *   3. 多空比快速预览
 *
 * 数据来源：useOrderBook + useTicker 选择器
 */
import React, { memo, useState, useMemo } from 'react';
import { useTradingStore } from '../../../../global_state_store/trading_global_state_store';
import { useOrderBook, useTicker } from '../../../../global_state_store/market_data_store';
import { formatPrice, formatVolume, getPnlColorClass } from '../../../../hooks/use_format';

// =========================================================================
// 配置
// =========================================================================

const PRECISION_OPTIONS = [
    { value: 2, label: '0.01' },
    { value: 1, label: '0.1' },
    { value: 0, label: '1' },
] as const;

const MAX_DEPTH = 15;

// =========================================================================
// 组件
// =========================================================================

const FuturesOrderbook = memo(function FuturesOrderbook() {
    const activeSymbol = useTradingStore((s) => s.activeSymbol);
    const activeExchangeId = useTradingStore((s) => s.activeExchangeId);
    const orderBook = useOrderBook(activeSymbol, activeExchangeId);
    const ticker = useTicker(activeSymbol, activeExchangeId);

    const [precision, setPrecision] = useState(2);

    const { displayAsks, displayBids, maxAmount } = useMemo(() => {
        if (!orderBook) return { displayAsks: [], displayBids: [], maxAmount: 1 };
        const asks = orderBook.asks.slice(0, MAX_DEPTH).reverse();
        const bids = orderBook.bids.slice(0, MAX_DEPTH);
        const allAmounts = [...asks, ...bids].map(([, amount]) => amount);
        const maxAmt = Math.max(...allAmounts, 1);
        return { displayAsks: asks, displayBids: bids, maxAmount: maxAmt };
    }, [orderBook]);

    return (
        <div className="flex-1 bg-card rounded-lg flex flex-col overflow-hidden min-h-0">
            {/* ─── 标题栏 ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-base shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted font-medium">订单簿</span>
                    {/* 持仓量 */}
                    {ticker?.openInterest != null && (
                        <span className="text-[10px] text-dim">
                            OI: {formatVolume(ticker.openInterest)}
                        </span>
                    )}
                </div>
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

            {/* ─── 卖单 ───────────────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-end px-1">
                {displayAsks.map(([price, amount], index) => {
                    const widthPercent = (amount / maxAmount) * 100;
                    return (
                        <div key={`ask-${index}`} className="relative grid grid-cols-3 gap-2 px-2 py-0.5 text-xs hover:bg-surface/50">
                            <div
                                className="absolute right-0 top-0 bottom-0 bg-red-500/10"
                                style={{ width: `${widthPercent}%` }}
                            />
                            <span className="relative text-red-400 font-mono">{price.toFixed(precision)}</span>
                            <span className="relative text-right text-secondary font-mono">{formatVolume(amount, 4)}</span>
                            <span className="relative text-right text-dim font-mono">{formatVolume(price * amount)}</span>
                        </div>
                    );
                })}
            </div>

            {/* ─── 最新价 + 标记价 ─────────────────────────────────── */}
            <div className="px-3 py-2 border-y border-base shrink-0">
                {ticker ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold font-mono ${getPnlColorClass(ticker.changePercent)}`}>
                                {formatPrice(ticker.last, precision)}
                            </span>
                            <span className={`text-xs ${getPnlColorClass(ticker.changePercent)}`}>
                                {ticker.changePercent >= 0 ? '↑' : '↓'}
                            </span>
                        </div>
                        {/* 标记价格 */}
                        {ticker.markPrice != null && (
                            <div className="text-right">
                                <span className="text-[10px] text-dim mr-1">标记</span>
                                <span className="text-xs text-yellow-400 font-mono">{formatPrice(ticker.markPrice, precision)}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <span className="text-sm text-dim">等待价格...</span>
                )}
            </div>

            {/* ─── 买单 ───────────────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col px-1">
                {displayBids.map(([price, amount], index) => {
                    const widthPercent = (amount / maxAmount) * 100;
                    return (
                        <div key={`bid-${index}`} className="relative grid grid-cols-3 gap-2 px-2 py-0.5 text-xs hover:bg-surface/50">
                            <div
                                className="absolute right-0 top-0 bottom-0 bg-green-500/10"
                                style={{ width: `${widthPercent}%` }}
                            />
                            <span className="relative text-green-400 font-mono">{price.toFixed(precision)}</span>
                            <span className="relative text-right text-secondary font-mono">{formatVolume(amount, 4)}</span>
                            <span className="relative text-right text-dim font-mono">{formatVolume(price * amount)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

FuturesOrderbook.displayName = 'FuturesOrderbook';

export default FuturesOrderbook;
