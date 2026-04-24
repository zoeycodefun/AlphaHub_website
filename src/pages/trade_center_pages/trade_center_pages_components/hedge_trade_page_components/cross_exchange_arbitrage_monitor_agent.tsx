/**
 * 跨交易所同币种价差监控（CrossExchangeArbitrageMonitor）
 *
 * 核心功能：
 *   1. BTC/ETH 在多交易所之间的实时价格对比
 *   2. 价差 (Spread) 计算与套利可行性判断
 *   3. 手续费估算 + 净利润计算
 *   4. 历史价差走势（简化 Bar）
 *   5. 套利机会提醒（spread > threshold）
 *
 * 数据来源：Mock 数据，后续接入多交易所行情 API。
 */
import React, { memo, useState, useMemo } from 'react';
import type { CrossExchangeSpread } from '../../type/alpha_module_types';

// =========================================================================
// Mock 数据
// =========================================================================

const MOCK_SPREADS: CrossExchangeSpread[] = [
    {
        symbol: 'BTC/USDT',
        exchangeA: 'Binance', exchangeB: 'OKX',
        priceA: 68432.50, priceB: 68465.20,
        spread: 32.70, spreadPercent: 0.048,
        isArbitrageable: false, estimatedFees: 45.00, netProfit: -12.30,
    },
    {
        symbol: 'BTC/USDT',
        exchangeA: 'Binance', exchangeB: 'Bybit',
        priceA: 68432.50, priceB: 68490.80,
        spread: 58.30, spreadPercent: 0.085,
        isArbitrageable: true, estimatedFees: 42.00, netProfit: 16.30,
    },
    {
        symbol: 'BTC/USDT',
        exchangeA: 'OKX', exchangeB: 'Bybit',
        priceA: 68465.20, priceB: 68490.80,
        spread: 25.60, spreadPercent: 0.037,
        isArbitrageable: false, estimatedFees: 40.00, netProfit: -14.40,
    },
    {
        symbol: 'ETH/USDT',
        exchangeA: 'Binance', exchangeB: 'OKX',
        priceA: 3862.40, priceB: 3868.10,
        spread: 5.70, spreadPercent: 0.148,
        isArbitrageable: true, estimatedFees: 3.50, netProfit: 2.20,
    },
    {
        symbol: 'ETH/USDT',
        exchangeA: 'Binance', exchangeB: 'Bybit',
        priceA: 3862.40, priceB: 3858.90,
        spread: -3.50, spreadPercent: -0.091,
        isArbitrageable: false, estimatedFees: 3.20, netProfit: -6.70,
    },
    {
        symbol: 'ETH/USDT',
        exchangeA: 'OKX', exchangeB: 'Bybit',
        priceA: 3868.10, priceB: 3858.90,
        spread: -9.20, spreadPercent: -0.238,
        isArbitrageable: true, estimatedFees: 3.00, netProfit: 6.20,
    },
];

// 价差历史 (简化，最近 20 个点)
function generateSpreadHistory(baseSpread: number, count = 20): number[] {
    const result: number[] = [];
    for (let i = 0; i < count; i++) {
        result.push(baseSpread + (Math.random() - 0.5) * baseSpread * 2);
    }
    return result;
}

// =========================================================================
// 子组件
// =========================================================================

const SpreadHistoryBar = memo<{ history: number[] }>(function SpreadHistoryBar({ history }) {
    const maxAbs = Math.max(...history.map(Math.abs), 0.01);
    return (
        <div className="flex items-end gap-px h-6">
            {history.map((v, i) => {
                const pct = Math.abs(v / maxAbs) * 100;
                const color = v >= 0 ? 'bg-green-500/60' : 'bg-red-500/60';
                return <div key={i} className={`w-1 rounded-sm ${color}`} style={{ height: `${Math.max(pct, 8)}%` }} />;
            })}
        </div>
    );
});

// =========================================================================
// 主组件
// =========================================================================

const CrossExchangeArbitrageMonitor = memo(function CrossExchangeArbitrageMonitor() {
    const [filterAsset, setFilterAsset] = useState<'all' | 'BTC' | 'ETH'>('all');

    const filteredSpreads = useMemo(() => {
        if (filterAsset === 'all') return MOCK_SPREADS;
        return MOCK_SPREADS.filter(s => s.symbol.startsWith(filterAsset));
    }, [filterAsset]);

    const arbitrageCount = useMemo(() => MOCK_SPREADS.filter(s => s.isArbitrageable).length, []);

    const spreadHistories = useMemo(() => {
        const map = new Map<string, number[]>();
        for (const s of MOCK_SPREADS) {
            map.set(`${s.symbol}-${s.exchangeA}-${s.exchangeB}`, generateSpreadHistory(s.spread));
        }
        return map;
    }, []);

    return (
        <div className="h-full bg-card rounded-lg flex flex-col overflow-hidden">
            {/* ─── Header ──────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-base shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">🔀 跨所价差监控</span>
                    {arbitrageCount > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400">
                            {arbitrageCount} 个套利机会
                        </span>
                    )}
                </div>
                <div className="flex gap-1">
                    {(['all', 'BTC', 'ETH'] as const).map(f => (
                        <button key={f} onClick={() => setFilterAsset(f)}
                            className={`text-[10px] px-2 py-0.5 rounded ${filterAsset === f ? 'bg-blue-500/20 text-blue-400' : 'text-dim'}`}>
                            {f === 'all' ? '全部' : f}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── 列表 ─────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2">
                {filteredSpreads.map((s, idx) => {
                    const key = `${s.symbol}-${s.exchangeA}-${s.exchangeB}`;
                    const history = spreadHistories.get(key) || [];
                    const isPositiveProfit = s.netProfit > 0;
                    return (
                        <div key={idx} className={`rounded-lg border p-3 ${s.isArbitrageable ? 'bg-green-500/5 border-green-500/20' : 'bg-surface/40 border-strong/30'}`}>
                            {/* 第一行：交易对 + 套利标记 */}
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-medium ${s.symbol.startsWith('BTC') ? 'text-orange-400' : 'text-blue-400'}`}>
                                        {s.symbol}
                                    </span>
                                    <span className="text-[9px] text-dim">{s.exchangeA} ↔ {s.exchangeB}</span>
                                </div>
                                {s.isArbitrageable && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">
                                        可套利
                                    </span>
                                )}
                            </div>

                            {/* 第二行：价格对比 */}
                            <div className="grid grid-cols-2 gap-2 text-[9px] mb-1.5">
                                <div className="flex justify-between">
                                    <span className="text-secondary">{s.exchangeA}</span>
                                    <span className="text-secondary font-mono">${s.priceA.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">{s.exchangeB}</span>
                                    <span className="text-secondary font-mono">${s.priceB.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* 第三行：价差 + 费率 + 净利 */}
                            <div className="flex items-center justify-between text-[9px]">
                                <div className="flex items-center gap-3">
                                    <span className="text-dim">价差: <span className={`font-mono ${s.spread >= 0 ? 'text-green-400' : 'text-red-400'}`}>${Math.abs(s.spread).toFixed(2)} ({Math.abs(s.spreadPercent).toFixed(3)}%)</span></span>
                                    <span className="text-dim">费用: <span className="font-mono text-muted">${s.estimatedFees.toFixed(2)}</span></span>
                                </div>
                                <span className={`font-mono font-medium ${isPositiveProfit ? 'text-green-400' : 'text-red-400'}`}>
                                    净利: {isPositiveProfit ? '+' : ''}${s.netProfit.toFixed(2)}
                                </span>
                            </div>

                            {/* 第四行：价差历史 */}
                            <div className="mt-2 pt-1.5 border-t border-strong/30">
                                <div className="text-[8px] text-secondary mb-1">价差走势 (近 20 ticks)</div>
                                <SpreadHistoryBar history={history} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

CrossExchangeArbitrageMonitor.displayName = 'CrossExchangeArbitrageMonitor';

export default CrossExchangeArbitrageMonitor;
