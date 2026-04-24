/**
 * 合约下单面板组件（FuturesOrderPanelZone）
 *
 * 重新设计为上下两行水平布局，适配合约交易底部区域：
 *   Row 1：限价单（杠杆+保证金模式 | 委托价格 | 数量 | 比例 | TP/SL | 可用保证金 | 做多/做空）
 *   Row 2：市价单（数量 | 比例 | 可用保证金 | 做多/做空）
 *
 * 合约特有控件：杠杆选择、保证金模式、做多/做空（非买入/卖出）、
 * 强平价格、保证金、可开数额、只减仓。
 */
import React, { memo, useState, useCallback, useMemo } from 'react';
import { useTradingStore } from '../../../../global_state_store/trading_global_state_store';
import { useTicker } from '../../../../global_state_store/market_data_store';
import type { FuturesOrderType, MarginMode } from '../../type/futures_trading_types';

// =========================================================================
// 工具函数 & 常量
// =========================================================================

function sanitize(value: string): string {
    return value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
}

const PERCENT_OPTS = [25, 50, 75, 100] as const;
const LEVERAGE_PRESETS = [1, 2, 3, 5, 10, 20, 50, 75, 100, 125];

type FuturesSide = 'long' | 'short';

// =========================================================================
// 共享：杠杆 & 保证金模式 控制栏
// =========================================================================

interface LeverageBarProps {
    leverage: number;
    marginMode: MarginMode;
    reduceOnly: boolean;
    onLeverageChange: (lev: number) => void;
    onMarginModeChange: (mode: MarginMode) => void;
    onReduceOnlyChange: (val: boolean) => void;
}

const LeverageBar = memo(function LeverageBar({
    leverage, marginMode, reduceOnly, onLeverageChange, onMarginModeChange, onReduceOnlyChange,
}: LeverageBarProps) {
    return (
        <div className="bg-card rounded-lg px-3 py-2 flex items-center gap-3 flex-wrap">
            {/* 保证金模式 */}
            <div className="flex rounded overflow-hidden border border-strong shrink-0">
                <button
                    onClick={() => onMarginModeChange('cross')}
                    className={`px-2 py-1 text-[10px] transition-colors ${marginMode === 'cross' ? 'bg-blue-600 text-white' : 'bg-surface text-muted'}`}
                >
                    全仓
                </button>
                <button
                    onClick={() => onMarginModeChange('isolated')}
                    className={`px-2 py-1 text-[10px] transition-colors ${marginMode === 'isolated' ? 'bg-blue-600 text-white' : 'bg-surface text-muted'}`}
                >
                    逐仓
                </button>
            </div>

            {/* 杠杆快捷 */}
            <div className="flex items-center gap-1 flex-wrap">
                {LEVERAGE_PRESETS.map((lev) => (
                    <button
                        key={lev}
                        onClick={() => onLeverageChange(lev)}
                        className={`px-1.5 py-0.5 text-[9px] rounded border transition-colors ${
                            leverage === lev
                                ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10'
                                : 'border-strong text-dim hover:text-secondary'
                        }`}
                    >
                        {lev}x
                    </button>
                ))}
            </div>

            {/* 杠杆滑块 */}
            <div className="flex items-center gap-1.5 shrink-0">
                <input
                    type="range" min={1} max={125} value={leverage}
                    onChange={(e) => onLeverageChange(parseInt(e.target.value, 10))}
                    className="w-24 h-1 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <span className="text-xs text-yellow-500 font-bold w-10 text-right">{leverage}x</span>
            </div>

            {/* 只减仓 */}
            <label className="flex items-center gap-1 cursor-pointer shrink-0 ml-auto">
                <input
                    type="checkbox" checked={reduceOnly}
                    onChange={(e) => onReduceOnlyChange(e.target.checked)}
                    className="w-3 h-3 rounded border-strong bg-surface text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-[10px] text-muted">只减仓</span>
            </label>
        </div>
    );
});
LeverageBar.displayName = 'LeverageBar';

// =========================================================================
// 限价单行
// =========================================================================

interface FuturesLimitRowProps {
    baseCurrency: string;
    quoteCurrency: string;
    availableMargin: number;
    currentPrice: number;
    leverage: number;
    isSubmitting: boolean;
    onSubmit: (side: FuturesSide, type: FuturesOrderType, price: number, amount: number, tp?: number, sl?: number) => void;
}

const FuturesLimitOrderRow = memo(function FuturesLimitOrderRow({
    baseCurrency, quoteCurrency, availableMargin, currentPrice, leverage, isSubmitting, onSubmit,
}: FuturesLimitRowProps) {
    const [price, setPrice] = useState('');
    const [amount, setAmount] = useState('');
    const [tp, setTp] = useState('');
    const [sl, setSl] = useState('');
    const [showTpsl, setShowTpsl] = useState(false);

    const entryPrice = parseFloat(price) || currentPrice;
    const qty = parseFloat(amount) || 0;

    // 合约特有计算
    const notionalValue = entryPrice * qty;
    const requiredMargin = notionalValue / leverage;
    const maxOpenable = entryPrice > 0 ? (availableMargin * leverage) / entryPrice : 0;
    // 简化强平价格估算（多头: 入场*(1-1/杠杆), 空头: 入场*(1+1/杠杆)）
    const estLiqLong = entryPrice > 0 ? entryPrice * (1 - 0.9 / leverage) : 0;
    const estLiqShort = entryPrice > 0 ? entryPrice * (1 + 0.9 / leverage) : 0;

    const handlePercent = useCallback((pct: number) => {
        if (entryPrice <= 0) return;
        const max = (availableMargin * leverage) / entryPrice;
        setAmount((max * pct / 100).toFixed(6));
    }, [availableMargin, leverage, entryPrice]);

    const handleLong = useCallback(() => {
        const p = parseFloat(price); const a = parseFloat(amount);
        if (!p || !a || p <= 0 || a <= 0) return;
        onSubmit('long', 'limit', p, a, parseFloat(tp) || undefined, parseFloat(sl) || undefined);
    }, [price, amount, tp, sl, onSubmit]);

    const handleShort = useCallback(() => {
        const p = parseFloat(price); const a = parseFloat(amount);
        if (!p || !a || p <= 0 || a <= 0) return;
        onSubmit('short', 'limit', p, a, parseFloat(tp) || undefined, parseFloat(sl) || undefined);
    }, [price, amount, tp, sl, onSubmit]);

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
                {/* 委托价格 */}
                <div className="flex-1 min-w-0">
                    <label className="text-[9px] text-secondary block mb-0.5">委托价格</label>
                    <div className="relative">
                        <input type="text" value={price} onChange={e => setPrice(sanitize(e.target.value))}
                            placeholder={currentPrice.toFixed(2)}
                            className="w-full px-2 py-1.5 bg-surface border border-strong rounded text-xs text-primary font-mono focus:outline-none focus:border-blue-500" />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-secondary">{quoteCurrency}</span>
                    </div>
                </div>

                {/* 数量 */}
                <div className="flex-1 min-w-0">
                    <label className="text-[9px] text-secondary block mb-0.5">数量</label>
                    <div className="relative">
                        <input type="text" value={amount} onChange={e => setAmount(sanitize(e.target.value))}
                            placeholder="0.000000"
                            className="w-full px-2 py-1.5 bg-surface border border-strong rounded text-xs text-primary font-mono focus:outline-none focus:border-blue-500" />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-secondary">{baseCurrency}</span>
                    </div>
                </div>

                {/* 百分比 */}
                <div className="shrink-0 flex flex-col gap-0.5">
                    <label className="text-[9px] text-secondary mb-0.5">比例</label>
                    <div className="flex gap-0.5">
                        {PERCENT_OPTS.map(p => (
                            <button key={p} onClick={() => handlePercent(p)} className="text-[8px] px-1 py-0.5 rounded bg-surface text-dim hover:text-blue-400 hover:bg-blue-500/10 transition-colors">{p}%</button>
                        ))}
                    </div>
                </div>

                {/* 可用保证金 */}
                <div className="shrink-0 text-right">
                    <label className="text-[9px] text-secondary block mb-0.5">可用保证金</label>
                    <div className="text-[10px] font-mono text-muted">{availableMargin.toFixed(2)} {quoteCurrency}</div>
                </div>

                {/* 合约特有信息：保证金 + 可开 + 强平 */}
                <div className="shrink-0 text-right space-y-0.5">
                    <div className="flex items-center gap-1 justify-end">
                        <span className="text-[9px] text-secondary">保证金</span>
                        <span className="text-[10px] font-mono text-secondary">{requiredMargin.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                        <span className="text-[9px] text-secondary">可开</span>
                        <span className="text-[10px] font-mono text-secondary">{maxOpenable.toFixed(4)} {baseCurrency}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                        <span className="text-[9px] text-secondary">强平↑</span>
                        <span className="text-[10px] font-mono text-red-400">{estLiqLong.toFixed(2)}</span>
                        <span className="text-[9px] text-secondary ml-1">↓</span>
                        <span className="text-[10px] font-mono text-green-400">{estLiqShort.toFixed(2)}</span>
                    </div>
                </div>

                {/* 做多 / 做空按钮 */}
                <div className="shrink-0 flex gap-1.5">
                    <button onClick={handleLong} disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-semibold rounded bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50">
                        做多
                    </button>
                    <button onClick={handleShort} disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-semibold rounded bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50">
                        做空
                    </button>
                </div>
            </div>

            {/* TP/SL 展开行 */}
            {showTpsl && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-base/50">
                    <div className="flex-1 max-w-[180px]">
                        <label className="text-[9px] text-green-400 block mb-0.5">止盈价 (TP)</label>
                        <input type="text" value={tp} onChange={e => setTp(sanitize(e.target.value))} placeholder="可选"
                            className="w-full px-2 py-1 bg-surface border border-green-700/30 rounded text-xs text-primary font-mono focus:outline-none focus:border-green-500" />
                    </div>
                    <div className="flex-1 max-w-[180px]">
                        <label className="text-[9px] text-red-400 block mb-0.5">止损价 (SL)</label>
                        <input type="text" value={sl} onChange={e => setSl(sanitize(e.target.value))} placeholder="可选"
                            className="w-full px-2 py-1 bg-surface border border-red-700/30 rounded text-xs text-primary font-mono focus:outline-none focus:border-red-500" />
                    </div>
                    <span className="text-[9px] text-secondary mt-3">挂单后自动监控触发</span>
                </div>
            )}
        </div>
    );
});
FuturesLimitOrderRow.displayName = 'FuturesLimitOrderRow';

// =========================================================================
// 市价单行
// =========================================================================

interface FuturesMarketRowProps {
    baseCurrency: string;
    quoteCurrency: string;
    availableMargin: number;
    currentPrice: number;
    leverage: number;
    isSubmitting: boolean;
    onSubmit: (side: FuturesSide, type: FuturesOrderType, price: number, amount: number) => void;
}

const FuturesMarketOrderRow = memo(function FuturesMarketOrderRow({
    baseCurrency, quoteCurrency, availableMargin, currentPrice, leverage, isSubmitting, onSubmit,
}: FuturesMarketRowProps) {
    const [amount, setAmount] = useState('');

    const qty = parseFloat(amount) || 0;
    const notionalValue = currentPrice * qty;
    const requiredMargin = notionalValue / leverage;
    const maxOpenable = currentPrice > 0 ? (availableMargin * leverage) / currentPrice : 0;
    const estLiqLong = currentPrice > 0 ? currentPrice * (1 - 0.9 / leverage) : 0;
    const estLiqShort = currentPrice > 0 ? currentPrice * (1 + 0.9 / leverage) : 0;

    const handlePercent = useCallback((pct: number) => {
        if (currentPrice <= 0) return;
        const max = (availableMargin * leverage) / currentPrice;
        setAmount((max * pct / 100).toFixed(6));
    }, [availableMargin, leverage, currentPrice]);

    const handleLong = useCallback(() => {
        const a = parseFloat(amount);
        if (!a || a <= 0) return;
        onSubmit('long', 'market', currentPrice, a);
    }, [amount, currentPrice, onSubmit]);

    const handleShort = useCallback(() => {
        const a = parseFloat(amount);
        if (!a || a <= 0) return;
        onSubmit('short', 'market', currentPrice, a);
    }, [amount, currentPrice, onSubmit]);

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
                        <input type="text" value={amount} onChange={e => setAmount(sanitize(e.target.value))}
                            placeholder="0.000000"
                            className="w-full px-2 py-1.5 bg-surface border border-strong rounded text-xs text-primary font-mono focus:outline-none focus:border-blue-500" />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-secondary">{baseCurrency}</span>
                    </div>
                </div>

                {/* 百分比 */}
                <div className="shrink-0 flex flex-col gap-0.5">
                    <label className="text-[9px] text-secondary mb-0.5">比例</label>
                    <div className="flex gap-0.5">
                        {PERCENT_OPTS.map(p => (
                            <button key={p} onClick={() => handlePercent(p)} className="text-[8px] px-1 py-0.5 rounded bg-surface text-dim hover:text-orange-400 hover:bg-orange-500/10 transition-colors">{p}%</button>
                        ))}
                    </div>
                </div>

                {/* 可用保证金 */}
                <div className="shrink-0 text-right">
                    <label className="text-[9px] text-secondary block mb-0.5">可用保证金</label>
                    <div className="text-[10px] font-mono text-muted">{availableMargin.toFixed(2)} {quoteCurrency}</div>
                </div>

                {/* 合约特有信息 */}
                <div className="shrink-0 text-right space-y-0.5">
                    <div className="flex items-center gap-1 justify-end">
                        <span className="text-[9px] text-secondary">保证金</span>
                        <span className="text-[10px] font-mono text-secondary">{requiredMargin.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                        <span className="text-[9px] text-secondary">可开</span>
                        <span className="text-[10px] font-mono text-secondary">{maxOpenable.toFixed(4)} {baseCurrency}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                        <span className="text-[9px] text-secondary">强平↑</span>
                        <span className="text-[10px] font-mono text-red-400">{estLiqLong.toFixed(2)}</span>
                        <span className="text-[9px] text-secondary ml-1">↓</span>
                        <span className="text-[10px] font-mono text-green-400">{estLiqShort.toFixed(2)}</span>
                    </div>
                </div>

                {/* 做多 / 做空 */}
                <div className="shrink-0 flex gap-1.5">
                    <button onClick={handleLong} disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-semibold rounded bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50">
                        做多
                    </button>
                    <button onClick={handleShort} disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-semibold rounded bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50">
                        做空
                    </button>
                </div>
            </div>
        </div>
    );
});
FuturesMarketOrderRow.displayName = 'FuturesMarketOrderRow';

// =========================================================================
// 主组件：杠杆控制栏 + 限价行 + 市价行
// =========================================================================

const FuturesOrderPanelZone = memo(function FuturesOrderPanelZone() {
    const activeSymbol = useTradingStore((s) => s.activeSymbol);
    const activeExchangeId = useTradingStore((s) => s.activeExchangeId);
    const futuresAccountSummary = useTradingStore((s) => s.futuresAccountSummary);
    const isSubmitting = useTradingStore((s) => s.isSubmittingOrder);
    const submitFuturesOrder = useTradingStore((s) => s.submitFuturesOrder);
    const setStoreLeverage = useTradingStore((s) => s.setLeverage);
    const setStoreMarginMode = useTradingStore((s) => s.setMarginMode);

    const ticker = useTicker(activeSymbol, activeExchangeId);

    const [baseCurrency, quoteCurrency] = activeSymbol.split('/');
    const currentPrice = ticker?.last ?? 0;
    const availableMargin = futuresAccountSummary?.availableMargin ?? 0;

    const [leverage, setLeverage] = useState(10);
    const [marginMode, setMarginMode] = useState<MarginMode>('cross');
    const [reduceOnly, setReduceOnly] = useState(false);

    const handleLeverageChange = useCallback(async (newLev: number) => {
        setLeverage(newLev);
        await setStoreLeverage(activeSymbol, newLev);
    }, [activeSymbol, setStoreLeverage]);

    const handleMarginModeChange = useCallback(async (mode: MarginMode) => {
        setMarginMode(mode);
        await setStoreMarginMode(activeSymbol, mode);
    }, [activeSymbol, setStoreMarginMode]);

    const handleSubmit = useCallback(async (
        side: FuturesSide,
        type: FuturesOrderType,
        price: number,
        amount: number,
        _tp?: number,
        _sl?: number,
    ) => {
        if (!amount || amount <= 0) return;
        if (type !== 'market' && (!price || price <= 0)) return;

        await submitFuturesOrder({
            exchangeId: activeExchangeId,
            symbol: activeSymbol,
            contractType: 'usdt_perpetual',
            side: side === 'long' ? 'buy' : 'sell',
            orderType: type,
            amount,
            price: type !== 'market' ? price : undefined,
            leverage,
            marginMode,
            reduceOnly,
        });
    }, [activeExchangeId, activeSymbol, leverage, marginMode, reduceOnly, submitFuturesOrder]);

    return (
        <div className="space-y-1.5">
            <LeverageBar
                leverage={leverage}
                marginMode={marginMode}
                reduceOnly={reduceOnly}
                onLeverageChange={handleLeverageChange}
                onMarginModeChange={handleMarginModeChange}
                onReduceOnlyChange={setReduceOnly}
            />
            <FuturesLimitOrderRow
                baseCurrency={baseCurrency ?? 'BTC'}
                quoteCurrency={quoteCurrency ?? 'USDT'}
                availableMargin={availableMargin}
                currentPrice={currentPrice}
                leverage={leverage}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
            />
            <FuturesMarketOrderRow
                baseCurrency={baseCurrency ?? 'BTC'}
                quoteCurrency={quoteCurrency ?? 'USDT'}
                availableMargin={availableMargin}
                currentPrice={currentPrice}
                leverage={leverage}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
            />
        </div>
    );
});

FuturesOrderPanelZone.displayName = 'FuturesOrderPanelZone';

export default FuturesOrderPanelZone;
