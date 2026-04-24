/**
 * 合约 K 线图组件（FuturesKline）
 *
 * 功能与现货 K 线基本一致，增加合约特有指标：
 *
 *   1. 标记价格线（Mark Price）
 *   2. 强平价格线（Liquidation Price，如有持仓时）
 *   3. 资金费率倒计时
 *   4. 多空比指标（预留）
 *
 * 同样基于 lightweight-charts 容器 + WebSocket K 线推送。
 */
import React, { memo, useState } from 'react';
import { useTradingStore } from '../../../../global_state_store/trading_global_state_store';
import { useKlines, useTicker } from '../../../../global_state_store/market_data_store';
import { formatPrice, formatVolume } from '../../../../hooks/use_format';
import { useKlineSubscription } from '../../../../hooks/use_trading_subscription';

// =========================================================================
// 时间周期配置
// =========================================================================

const TIMEFRAMES = [
    { value: '1m', label: '1分' },
    { value: '5m', label: '5分' },
    { value: '15m', label: '15分' },
    { value: '1h', label: '1时' },
    { value: '4h', label: '4时' },
    { value: '1D', label: '日线' },
] as const;

// =========================================================================
// 组件
// =========================================================================

const FuturesKline = memo(function FuturesKline() {
    const activeSymbol = useTradingStore((s) => s.activeSymbol);
    const activeExchangeId = useTradingStore((s) => s.activeExchangeId);
    const fundingRate = useTradingStore((s) => s.fundingRate);
    const [timeframe, setTimeframe] = useState('15m');

    // 订阅 K 线
    useKlineSubscription(timeframe, activeSymbol, activeExchangeId);
    const klines = useKlines(activeSymbol, timeframe, activeExchangeId);
    const ticker = useTicker(activeSymbol, activeExchangeId);

    const latestBar = klines.length > 0 ? klines[klines.length - 1] : null;

    return (
        <div className="flex-[3] bg-card rounded-lg flex flex-col overflow-hidden">
            {/* ─── 工具栏 ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-base shrink-0">
                <div className="flex items-center gap-1">
                    {TIMEFRAMES.map((tf) => (
                        <button
                            key={tf.value}
                            onClick={() => setTimeframe(tf.value)}
                            className={`px-2.5 py-1 text-xs rounded transition-colors ${
                                timeframe === tf.value
                                    ? 'bg-blue-600 text-white'
                                    : 'text-muted hover:text-primary hover:bg-surface'
                            }`}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 text-xs">
                    {/* 标记价格 */}
                    {ticker?.markPrice != null && (
                        <div className="flex items-center gap-1">
                            <span className="text-dim">标记价</span>
                            <span className="text-yellow-400 font-mono">{formatPrice(ticker.markPrice)}</span>
                        </div>
                    )}

                    {/* 资金费率 */}
                    {fundingRate && (
                        <div className="flex items-center gap-1">
                            <span className="text-dim">费率</span>
                            <span className={`font-mono ${fundingRate.fundingRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {(fundingRate.fundingRate * 100).toFixed(4)}%
                            </span>
                        </div>
                    )}

                    {/* OHLCV 摘要 */}
                    {latestBar && (
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="text-dim">O</span>
                            <span className="text-primary">{formatPrice(latestBar.open)}</span>
                            <span className="text-dim">H</span>
                            <span className="text-green-500">{formatPrice(latestBar.high)}</span>
                            <span className="text-dim">L</span>
                            <span className="text-red-500">{formatPrice(latestBar.low)}</span>
                            <span className="text-dim">C</span>
                            <span className="text-primary">{formatPrice(latestBar.close)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── K 线图容器 ─────────────────────────────────────── */}
            <div className="flex-1 relative min-h-0">
                {klines.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-dim">
                        <div className="w-8 h-8 border-2 border-strong border-t-blue-500 rounded-full animate-spin mb-3" />
                        <span className="text-sm">等待 K 线数据...</span>
                        <span className="text-xs text-secondary mt-1">{activeSymbol} · {timeframe} · 永续合约</span>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-end px-1 py-2 gap-px overflow-hidden">
                        {klines.slice(-120).map((bar, index) => {
                            const isGreen = bar.close >= bar.open;
                            const range = Math.max(...klines.slice(-120).map(b => b.high)) - Math.min(...klines.slice(-120).map(b => b.low));
                            const heightPercent = range > 0
                                ? ((Math.abs(bar.close - bar.open) / range) * 100)
                                : 1;
                            return (
                                <div
                                    key={`${bar.timestamp}-${index}`}
                                    className="flex-1 min-w-[2px] max-w-[8px]"
                                    style={{ height: `${Math.max(heightPercent, 1)}%` }}
                                >
                                    <div className={`w-full h-full rounded-sm ${isGreen ? 'bg-green-500/80' : 'bg-red-500/80'}`} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
});

FuturesKline.displayName = 'FuturesKline';

export default FuturesKline;
