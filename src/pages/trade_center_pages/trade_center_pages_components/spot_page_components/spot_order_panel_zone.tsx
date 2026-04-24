/**
 * 现货下单面板组件（SpotOrderPanelZone）
 *
 * 重新设计为上下两行水平布局：
 *   Row 1：限价单（价格 + 数量 + 止盈止损 + 可用余额 + 买入/卖出）
 *   Row 2：市价单（数量 + 可用余额 + 买入/卖出）
 *
 * 紧凑横排布局，适合交易终端底部区域。
 */
import React, { memo, useState, useCallback } from 'react';
import { useTradingStore } from '../../../../global_state_store/trading_global_state_store';
import { useTicker } from '../../../../global_state_store/market_data_store';
import type { SpotOrderType, OrderSide } from '../../type/spot_trading_types';

// =========================================================================
// 数字输入过滤
// =========================================================================

function sanitize(value: string): string {
    return value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
}

const PERCENT_OPTS = [25, 50, 75, 100] as const;

// =========================================================================
// 限价单行
// =========================================================================

interface LimitRowProps {
    baseCurrency: string;
    quoteCurrency: string;
    quoteAvailable: number;
    baseAvailable: number;
    currentPrice: number;
    isSubmitting: boolean;
    onSubmit: (side: OrderSide, type: SpotOrderType, price: number, amount: number, tp?: number, sl?: number) => void;
}

const LimitOrderRow = memo(function LimitOrderRow({
    baseCurrency, quoteCurrency, quoteAvailable, baseAvailable, currentPrice, isSubmitting, onSubmit,
}: LimitRowProps) {
    const [price, setPrice] = useState('');
    const [amount, setAmount] = useState('');
    const [tp, setTp] = useState('');
    const [sl, setSl] = useState('');
    const [showTpsl, setShowTpsl] = useState(false);

    const handlePercent = useCallback((pct: number) => {
        if (currentPrice <= 0) return;
        const p = parseFloat(price) || currentPrice;
        const qty = (quoteAvailable * pct / 100) / p;
        setAmount(qty.toFixed(6));
    }, [price, quoteAvailable, currentPrice]);

    const handleBuy = useCallback(() => {
        const p = parseFloat(price);
        const a = parseFloat(amount);
        if (!p || !a || p <= 0 || a <= 0) return;
        onSubmit('buy', 'limit', p, a, parseFloat(tp) || undefined, parseFloat(sl) || undefined);
    }, [price, amount, tp, sl, onSubmit]);

    const handleSell = useCallback(() => {
        const p = parseFloat(price);
        const a = parseFloat(amount);
        if (!p || !a || p <= 0 || a <= 0) return;
        onSubmit('sell', 'limit', p, a, parseFloat(tp) || undefined, parseFloat(sl) || undefined);
    }, [price, amount, tp, sl, onSubmit]);

    const total = ((parseFloat(price) || 0) * (parseFloat(amount) || 0)).toFixed(2);

    return (
        <div className="bg-card rounded-lg px-3 py-2.5">
            {/* 行标题 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">限价单</span>
                    <span className="text-[9px] text-secondary">LIMIT</span>
                </div>
                <button
                    onClick={() => setShowTpsl(!showTpsl)}
                    className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${showTpsl ? 'bg-yellow-500/20 text-yellow-400' : 'bg-surface text-dim hover:text-secondary'}`}
                >
                    TP/SL {showTpsl ? '▲' : '▼'}
                </button>
            </div>

            {/* 输入行 */}
            <div className="flex items-center gap-2">
                {/* 价格 */}
                <div className="flex-1 min-w-0">
                    <label className="text-[9px] text-secondary block mb-0.5">价格</label>
                    <div className="relative">
                        <input
                            type="text" value={price} onChange={e => setPrice(sanitize(e.target.value))}
                            placeholder={currentPrice.toFixed(2)}
                            className="w-full px-2 py-1.5 bg-surface border border-strong rounded text-xs text-primary font-mono focus:outline-none focus:border-blue-500"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-secondary">{quoteCurrency}</span>
                    </div>
                </div>

                {/* 数量 */}
                <div className="flex-1 min-w-0">
                    <label className="text-[9px] text-secondary block mb-0.5">数量</label>
                    <div className="relative">
                        <input
                            type="text" value={amount} onChange={e => setAmount(sanitize(e.target.value))}
                            placeholder="0.000000"
                            className="w-full px-2 py-1.5 bg-surface border border-strong rounded text-xs text-primary font-mono focus:outline-none focus:border-blue-500"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-secondary">{baseCurrency}</span>
                    </div>
                </div>

                {/* 百分比快捷 */}
                <div className="shrink-0 flex flex-col gap-0.5">
                    <label className="text-[9px] text-secondary mb-0.5">比例</label>
                    <div className="flex gap-0.5">
                        {PERCENT_OPTS.map(p => (
                            <button key={p} onClick={() => handlePercent(p)} className="text-[8px] px-1 py-0.5 rounded bg-surface text-dim hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                                {p}%
                            </button>
                        ))}
                    </div>
                </div>

                {/* 可用余额 */}
                <div className="shrink-0 text-right">
                    <label className="text-[9px] text-secondary block mb-0.5">可用</label>
                    <div className="text-[10px] font-mono text-muted">{quoteAvailable.toFixed(2)} {quoteCurrency}</div>
                    <div className="text-[10px] font-mono text-muted">{baseAvailable.toFixed(6)} {baseCurrency}</div>
                </div>

                {/* 预估 */}
                <div className="shrink-0 text-right w-20">
                    <label className="text-[9px] text-secondary block mb-0.5">预估</label>
                    <div className="text-[10px] font-mono text-secondary">≈ {total} {quoteCurrency}</div>
                </div>

                {/* 买入/卖出按钮 */}
                <div className="shrink-0 flex gap-1.5">
                    <button
                        onClick={handleBuy} disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-semibold rounded bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                    >
                        买入
                    </button>
                    <button
                        onClick={handleSell} disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-semibold rounded bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                    >
                        卖出
                    </button>
                </div>
            </div>

            {/* TP/SL 展开行 */}
            {showTpsl && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-base/50">
                    <div className="flex-1 max-w-[180px]">
                        <label className="text-[9px] text-green-400 block mb-0.5">止盈价 (TP)</label>
                        <input
                            type="text" value={tp} onChange={e => setTp(sanitize(e.target.value))}
                            placeholder="可选"
                            className="w-full px-2 py-1 bg-surface border border-green-700/30 rounded text-xs text-primary font-mono focus:outline-none focus:border-green-500"
                        />
                    </div>
                    <div className="flex-1 max-w-[180px]">
                        <label className="text-[9px] text-red-400 block mb-0.5">止损价 (SL)</label>
                        <input
                            type="text" value={sl} onChange={e => setSl(sanitize(e.target.value))}
                            placeholder="可选"
                            className="w-full px-2 py-1 bg-surface border border-red-700/30 rounded text-xs text-primary font-mono focus:outline-none focus:border-red-500"
                        />
                    </div>
                    <span className="text-[9px] text-secondary mt-3">挂单后自动监控触发</span>
                </div>
            )}
        </div>
    );
});
LimitOrderRow.displayName = 'LimitOrderRow';

// =========================================================================
// 市价单行
// =========================================================================

interface MarketRowProps {
    baseCurrency: string;
    quoteCurrency: string;
    quoteAvailable: number;
    baseAvailable: number;
    currentPrice: number;
    isSubmitting: boolean;
    onSubmit: (side: OrderSide, type: SpotOrderType, price: number, amount: number) => void;
}

const MarketOrderRow = memo(function MarketOrderRow({
    baseCurrency, quoteCurrency, quoteAvailable, baseAvailable, currentPrice, isSubmitting, onSubmit,
}: MarketRowProps) {
    const [amount, setAmount] = useState('');

    const handlePercent = useCallback((pct: number) => {
        if (currentPrice <= 0) return;
        const qty = (quoteAvailable * pct / 100) / currentPrice;
        setAmount(qty.toFixed(6));
    }, [quoteAvailable, currentPrice]);

    const handleBuy = useCallback(() => {
        const a = parseFloat(amount);
        if (!a || a <= 0) return;
        onSubmit('buy', 'market', currentPrice, a);
    }, [amount, currentPrice, onSubmit]);

    const handleSell = useCallback(() => {
        const a = parseFloat(amount);
        if (!a || a <= 0) return;
        onSubmit('sell', 'market', currentPrice, a);
    }, [amount, currentPrice, onSubmit]);

    const total = (currentPrice * (parseFloat(amount) || 0)).toFixed(2);

    return (
        <div className="bg-card rounded-lg px-3 py-2.5">
            {/* 行标题 */}
            <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-medium">市价单</span>
                <span className="text-[9px] text-secondary">MARKET</span>
                <span className="text-[9px] text-dim ml-auto font-mono">≈ {currentPrice.toFixed(2)} {quoteCurrency}</span>
            </div>

            {/* 输入行 */}
            <div className="flex items-center gap-2">
                {/* 数量 */}
                <div className="flex-1 min-w-0 max-w-[200px]">
                    <label className="text-[9px] text-secondary block mb-0.5">数量</label>
                    <div className="relative">
                        <input
                            type="text" value={amount} onChange={e => setAmount(sanitize(e.target.value))}
                            placeholder="0.000000"
                            className="w-full px-2 py-1.5 bg-surface border border-strong rounded text-xs text-primary font-mono focus:outline-none focus:border-blue-500"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-secondary">{baseCurrency}</span>
                    </div>
                </div>

                {/* 百分比 */}
                <div className="shrink-0 flex flex-col gap-0.5">
                    <label className="text-[9px] text-secondary mb-0.5">比例</label>
                    <div className="flex gap-0.5">
                        {PERCENT_OPTS.map(p => (
                            <button key={p} onClick={() => handlePercent(p)} className="text-[8px] px-1 py-0.5 rounded bg-surface text-dim hover:text-orange-400 hover:bg-orange-500/10 transition-colors">
                                {p}%
                            </button>
                        ))}
                    </div>
                </div>

                {/* 可用 */}
                <div className="shrink-0 text-right">
                    <label className="text-[9px] text-secondary block mb-0.5">可用</label>
                    <div className="text-[10px] font-mono text-muted">{quoteAvailable.toFixed(2)} {quoteCurrency}</div>
                    <div className="text-[10px] font-mono text-muted">{baseAvailable.toFixed(6)} {baseCurrency}</div>
                </div>

                {/* 预估 */}
                <div className="shrink-0 text-right w-20">
                    <label className="text-[9px] text-secondary block mb-0.5">预估</label>
                    <div className="text-[10px] font-mono text-secondary">≈ {total} {quoteCurrency}</div>
                </div>

                {/* 买入/卖出 */}
                <div className="shrink-0 flex gap-1.5">
                    <button
                        onClick={handleBuy} disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-semibold rounded bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                    >
                        买入
                    </button>
                    <button
                        onClick={handleSell} disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-semibold rounded bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                    >
                        卖出
                    </button>
                </div>
            </div>
        </div>
    );
});
MarketOrderRow.displayName = 'MarketOrderRow';

// =========================================================================
// 主组件：限价行 + 市价行
// =========================================================================

const SpotOrderPanelZone = memo(function SpotOrderPanelZone() {
    const activeSymbol = useTradingStore((s) => s.activeSymbol);
    const activeExchangeId = useTradingStore((s) => s.activeExchangeId);
    const spotBalances = useTradingStore((s) => s.spotBalances);
    const isSubmitting = useTradingStore((s) => s.isSubmittingOrder);
    const submitSpotOrder = useTradingStore((s) => s.submitSpotOrder);

    const ticker = useTicker(activeSymbol, activeExchangeId);

    const [baseCurrency, quoteCurrency] = activeSymbol.split('/');
    const quoteBalance = spotBalances.find((b) => b.currency === quoteCurrency);
    const baseBalance = spotBalances.find((b) => b.currency === baseCurrency);

    const quoteAvailable = quoteBalance?.available ?? 0;
    const baseAvailable = baseBalance?.available ?? 0;
    const currentPrice = ticker?.last ?? 0;

    const handleSubmit = useCallback(async (
        side: OrderSide,
        type: SpotOrderType,
        price: number,
        amount: number,
        _tp?: number,
        _sl?: number,
    ) => {
        if (!amount || amount <= 0) return;
        await submitSpotOrder({
            exchangeId: activeExchangeId,
            symbol: activeSymbol,
            side,
            orderType: type,
            amount,
            price: type !== 'market' ? price : undefined,
        });
    }, [activeExchangeId, activeSymbol, submitSpotOrder]);

    return (
        <div className="space-y-1.5">
            <LimitOrderRow
                baseCurrency={baseCurrency ?? 'BTC'}
                quoteCurrency={quoteCurrency ?? 'USDT'}
                quoteAvailable={quoteAvailable}
                baseAvailable={baseAvailable}
                currentPrice={currentPrice}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
            />
            <MarketOrderRow
                baseCurrency={baseCurrency ?? 'BTC'}
                quoteCurrency={quoteCurrency ?? 'USDT'}
                quoteAvailable={quoteAvailable}
                baseAvailable={baseAvailable}
                currentPrice={currentPrice}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
            />
        </div>
    );
});

SpotOrderPanelZone.displayName = 'SpotOrderPanelZone';

export default SpotOrderPanelZone;
