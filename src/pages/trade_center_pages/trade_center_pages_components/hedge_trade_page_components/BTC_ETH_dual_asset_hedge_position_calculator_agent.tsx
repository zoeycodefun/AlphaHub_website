/**
 * BTC/ETH 双币对冲仓位计算器（DualAssetHedgePositionCalculator）
 *
 * 核心功能：
 *   1. BTC/ETH 双币仓位配置（方向、杠杆、金额）
 *   2. 实时盈亏计算（含手续费估算）
 *   3. 强平价格对比器
 *   4. 推荐对冲比例（基于当前相关性）
 *   5. 预估回归周期与收益
 *   6. 仓位管理（当前活跃仓位列表）
 *
 * 数据来源：Mock 数据，后续接入交易所 API。
 */
import React, { memo, useState, useCallback, useMemo } from 'react';
import type { HedgeCalculatorResult, LiquidationComparisonEntry } from '../../type/alpha_module_types';

// =========================================================================
// 辅助函数
// =========================================================================

function sanitize(value: string): string {
    return value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
}

function getRiskColor(level: string): string {
    if (level === 'danger') return 'text-red-400';
    if (level === 'warning') return 'text-yellow-400';
    return 'text-green-400';
}

function getRiskBg(level: string): string {
    if (level === 'danger') return 'bg-red-500/10 border-red-500/20';
    if (level === 'warning') return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-green-500/10 border-green-500/20';
}

// =========================================================================
// 当前活跃仓位 Mock
// =========================================================================

interface ActiveHedgePosition {
    id: string;
    btcSide: 'long' | 'short';
    ethSide: 'long' | 'short';
    btcEntry: number;
    ethEntry: number;
    btcAmount: number;
    ethAmount: number;
    btcLeverage: number;
    ethLeverage: number;
    currentPnl: number;
    currentPnlPct: number;
    openedAt: string;
}

const MOCK_ACTIVE_POSITIONS: ActiveHedgePosition[] = [
    {
        id: 'ahp-1', btcSide: 'long', ethSide: 'short',
        btcEntry: 67200, ethEntry: 3920, btcAmount: 5000, ethAmount: 5000,
        btcLeverage: 5, ethLeverage: 5, currentPnl: 182.50, currentPnlPct: 1.83,
        openedAt: '2025-07-08T10:00:00Z',
    },
    {
        id: 'ahp-2', btcSide: 'short', ethSide: 'long',
        btcEntry: 69000, ethEntry: 3780, btcAmount: 3000, ethAmount: 3000,
        btcLeverage: 3, ethLeverage: 3, currentPnl: -45.20, currentPnlPct: -0.75,
        openedAt: '2025-07-09T14:30:00Z',
    },
];

// =========================================================================
// 主组件
// =========================================================================

const BTCETHDualAssetHedgePositionCalculator = memo(function BTCETHDualAssetHedgePositionCalculator() {
    // 计算器输入
    const [btcSide, setBtcSide] = useState<'long' | 'short'>('long');
    const [btcAmount, setBtcAmount] = useState('5000');
    const [ethAmount, setEthAmount] = useState('5000');
    const [btcLeverage, setBtcLeverage] = useState(5);
    const [ethLeverage, setEthLeverage] = useState(5);
    const [btcEntry, setBtcEntry] = useState('68000');
    const [ethEntry, setEthEntry] = useState('3850');

    // Tab
    const [activeTab, setActiveTab] = useState<'calculator' | 'positions'>('calculator');

    const ethSide = btcSide === 'long' ? 'short' : 'long';

    // 计算结果
    const result: HedgeCalculatorResult = useMemo(() => {
        const bAmt = parseFloat(btcAmount) || 0;
        const eAmt = parseFloat(ethAmount) || 0;
        const bEntry = parseFloat(btcEntry) || 68000;
        const eEntry = parseFloat(ethEntry) || 3850;
        const bNotional = bAmt * btcLeverage;
        const eNotional = eAmt * ethLeverage;
        const bMargin = bAmt;
        const eMargin = eAmt;
        // 简化强平计算
        const bLiq = btcSide === 'long'
            ? bEntry * (1 - 0.9 / btcLeverage)
            : bEntry * (1 + 0.9 / btcLeverage);
        const eLiq = ethSide === 'long'
            ? eEntry * (1 - 0.9 / ethLeverage)
            : eEntry * (1 + 0.9 / ethLeverage);
        // 模拟当前价格变化 (mock: BTC +1.2%, ETH +0.6%)
        const btcPnl = btcSide === 'long' ? bNotional * 0.012 : -bNotional * 0.012;
        const ethPnl = ethSide === 'long' ? eNotional * 0.006 : -eNotional * 0.006;
        const totalPnl = btcPnl + ethPnl;
        const totalMargin = bMargin + eMargin;

        return {
            netExposure: Math.abs(bNotional - eNotional),
            btcNotionalValue: bNotional,
            ethNotionalValue: eNotional,
            btcMarginRequired: bMargin,
            ethMarginRequired: eMargin,
            totalMarginRequired: totalMargin,
            btcLiquidationPrice: Math.round(bLiq * 100) / 100,
            ethLiquidationPrice: Math.round(eLiq * 100) / 100,
            currentPnl: Math.round(totalPnl * 100) / 100,
            currentPnlPct: totalMargin > 0 ? Math.round((totalPnl / totalMargin) * 10000) / 100 : 0,
            recommendedHedgeRatio: 0.87,
            estimatedCycleReturn: 2.3,
            estimatedMeanReversionHours: 8,
        };
    }, [btcAmount, ethAmount, btcEntry, ethEntry, btcLeverage, ethLeverage, btcSide, ethSide]);

    // 强平对比
    const liquidationComparison: LiquidationComparisonEntry[] = useMemo(() => {
        const bEntry = parseFloat(btcEntry) || 68000;
        const eEntry = parseFloat(ethEntry) || 3850;
        const btcCurrentPrice = 68450;
        const ethCurrentPrice = 3870;
        const btcDist = Math.abs((result.btcLiquidationPrice - btcCurrentPrice) / btcCurrentPrice) * 100;
        const ethDist = Math.abs((result.ethLiquidationPrice - ethCurrentPrice) / ethCurrentPrice) * 100;

        return [
            {
                symbol: 'BTC/USDT', side: btcSide, entryPrice: bEntry,
                leverage: btcLeverage, amount: parseFloat(btcAmount) || 0,
                liquidationPrice: result.btcLiquidationPrice,
                distancePercent: Math.round(btcDist * 100) / 100,
                riskLevel: btcDist < 5 ? 'danger' : btcDist < 15 ? 'warning' : 'safe',
            },
            {
                symbol: 'ETH/USDT', side: ethSide, entryPrice: eEntry,
                leverage: ethLeverage, amount: parseFloat(ethAmount) || 0,
                liquidationPrice: result.ethLiquidationPrice,
                distancePercent: Math.round(ethDist * 100) / 100,
                riskLevel: ethDist < 5 ? 'danger' : ethDist < 15 ? 'warning' : 'safe',
            },
        ];
    }, [btcEntry, ethEntry, btcLeverage, ethLeverage, btcAmount, ethAmount, btcSide, ethSide, result]);

    // 杠杆选项
    const LEVERAGE_OPTS = [1, 2, 3, 5, 10, 20];

    return (
        <div className="h-full bg-card rounded-lg flex flex-col overflow-hidden">
            {/* ─── 标题 & Tab ─────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-base shrink-0">
                <span className="text-xs font-bold text-primary">⚖️ 双币对冲计算器</span>
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveTab('calculator')}
                        className={`text-[10px] px-2 py-0.5 rounded ${activeTab === 'calculator' ? 'bg-blue-500/20 text-blue-400' : 'text-dim'}`}
                    >计算器</button>
                    <button
                        onClick={() => setActiveTab('positions')}
                        className={`text-[10px] px-2 py-0.5 rounded ${activeTab === 'positions' ? 'bg-blue-500/20 text-blue-400' : 'text-dim'}`}
                    >当前仓位</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
                {activeTab === 'calculator' ? (
                    <div className="p-4 space-y-3">
                        {/* ── 方向选择 ──────────────────────────── */}
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-dim">BTC 方向：</span>
                            <button
                                onClick={() => setBtcSide('long')}
                                className={`text-[10px] px-2 py-1 rounded ${btcSide === 'long' ? 'bg-green-500/20 text-green-400 font-medium' : 'bg-surface text-dim'}`}
                            >做多 BTC</button>
                            <button
                                onClick={() => setBtcSide('short')}
                                className={`text-[10px] px-2 py-1 rounded ${btcSide === 'short' ? 'bg-red-500/20 text-red-400 font-medium' : 'bg-surface text-dim'}`}
                            >做空 BTC</button>
                            <span className="text-[9px] text-secondary ml-auto">ETH 自动: <span className={ethSide === 'long' ? 'text-green-400' : 'text-red-400'}>{ethSide === 'long' ? '做多' : '做空'}</span></span>
                        </div>

                        {/* ── 仓位配置 ──────────────────────────── */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* BTC */}
                            <div className="space-y-2">
                                <div className="text-[10px] text-orange-400 font-medium">BTC ({btcSide === 'long' ? '多' : '空'})</div>
                                <div>
                                    <label className="text-[9px] text-secondary">入场价格</label>
                                    <input type="text" value={btcEntry} onChange={e => setBtcEntry(sanitize(e.target.value))}
                                        className="w-full px-2 py-1.5 bg-surface border border-strong rounded text-xs text-primary font-mono focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-[9px] text-secondary">保证金 (USDT)</label>
                                    <input type="text" value={btcAmount} onChange={e => setBtcAmount(sanitize(e.target.value))}
                                        className="w-full px-2 py-1.5 bg-surface border border-strong rounded text-xs text-primary font-mono focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-[9px] text-secondary">杠杆</label>
                                    <div className="flex gap-1 mt-0.5">
                                        {LEVERAGE_OPTS.map(l => (
                                            <button key={l} onClick={() => setBtcLeverage(l)}
                                                className={`text-[9px] px-1.5 py-0.5 rounded ${btcLeverage === l ? 'bg-yellow-500/20 text-yellow-400' : 'bg-surface text-dim'}`}>
                                                {l}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* ETH */}
                            <div className="space-y-2">
                                <div className="text-[10px] text-blue-400 font-medium">ETH ({ethSide === 'long' ? '多' : '空'})</div>
                                <div>
                                    <label className="text-[9px] text-secondary">入场价格</label>
                                    <input type="text" value={ethEntry} onChange={e => setEthEntry(sanitize(e.target.value))}
                                        className="w-full px-2 py-1.5 bg-surface border border-strong rounded text-xs text-primary font-mono focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-[9px] text-secondary">保证金 (USDT)</label>
                                    <input type="text" value={ethAmount} onChange={e => setEthAmount(sanitize(e.target.value))}
                                        className="w-full px-2 py-1.5 bg-surface border border-strong rounded text-xs text-primary font-mono focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-[9px] text-secondary">杠杆</label>
                                    <div className="flex gap-1 mt-0.5">
                                        {LEVERAGE_OPTS.map(l => (
                                            <button key={l} onClick={() => setEthLeverage(l)}
                                                className={`text-[9px] px-1.5 py-0.5 rounded ${ethLeverage === l ? 'bg-yellow-500/20 text-yellow-400' : 'bg-surface text-dim'}`}>
                                                {l}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── 计算结果 ──────────────────────────── */}
                        <div className="bg-surface/50 rounded-lg p-3 space-y-2">
                            <div className="text-[10px] text-dim font-medium mb-1">📈 计算结果</div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                                <div className="flex justify-between"><span className="text-dim">BTC 名义价值</span><span className="text-primary font-mono">${result.btcNotionalValue.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-dim">ETH 名义价值</span><span className="text-primary font-mono">${result.ethNotionalValue.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-dim">净敞口</span><span className="text-yellow-400 font-mono">${result.netExposure.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-dim">总保证金</span><span className="text-primary font-mono">${result.totalMarginRequired.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-dim">当前盈亏</span><span className={`font-mono ${result.currentPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{result.currentPnl >= 0 ? '+' : ''}${result.currentPnl}</span></div>
                                <div className="flex justify-between"><span className="text-dim">盈亏率</span><span className={`font-mono ${result.currentPnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>{result.currentPnlPct >= 0 ? '+' : ''}{result.currentPnlPct}%</span></div>
                            </div>
                            <div className="border-t border-strong/50 pt-2 mt-2 grid grid-cols-3 gap-2 text-[10px]">
                                <div className="text-center">
                                    <div className="text-dim">推荐比例</div>
                                    <div className="text-blue-400 font-mono">{result.recommendedHedgeRatio}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-dim">预估周期收益</div>
                                    <div className="text-green-400 font-mono">+{result.estimatedCycleReturn}%</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-dim">回归周期</div>
                                    <div className="text-secondary font-mono">~{result.estimatedMeanReversionHours}h</div>
                                </div>
                            </div>
                        </div>

                        {/* ── 强平价格对比 ──────────────────────── */}
                        <div className="space-y-1.5">
                            <div className="text-[10px] text-dim font-medium">🛡️ 强平价格对比</div>
                            {liquidationComparison.map((entry) => (
                                <div key={entry.symbol} className={`rounded-lg border p-2.5 ${getRiskBg(entry.riskLevel)}`}>
                                    <div className="flex items-center justify-between text-[10px]">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-primary font-medium">{entry.symbol}</span>
                                            <span className={entry.side === 'long' ? 'text-green-400' : 'text-red-400'}>
                                                {entry.side === 'long' ? '多' : '空'} {entry.leverage}x
                                            </span>
                                        </div>
                                        <span className={`font-mono ${getRiskColor(entry.riskLevel)}`}>
                                            距强平: {entry.distancePercent}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1 text-[9px] text-dim">
                                        <span>入场: ${entry.entryPrice.toLocaleString()}</span>
                                        <span>强平: <span className={`font-mono ${getRiskColor(entry.riskLevel)}`}>${entry.liquidationPrice.toLocaleString()}</span></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* ── 当前仓位 Tab ──────────────────────── */
                    <div className="p-4 space-y-2">
                        <div className="text-[10px] text-dim mb-2">活跃对冲仓位 ({MOCK_ACTIVE_POSITIONS.length})</div>
                        {MOCK_ACTIVE_POSITIONS.map((pos) => (
                            <div key={pos.id} className="bg-surface/50 rounded-lg p-3 border border-strong/30 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className={`font-medium ${pos.btcSide === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                                            BTC {pos.btcSide === 'long' ? '多' : '空'} {pos.btcLeverage}x
                                        </span>
                                        <span className="text-secondary">+</span>
                                        <span className={`font-medium ${pos.ethSide === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                                            ETH {pos.ethSide === 'long' ? '多' : '空'} {pos.ethLeverage}x
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-mono ${pos.currentPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {pos.currentPnl >= 0 ? '+' : ''}${pos.currentPnl.toFixed(2)} ({pos.currentPnlPct >= 0 ? '+' : ''}{pos.currentPnlPct}%)
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[9px] text-dim">
                                    <div>BTC 入场: <span className="text-secondary font-mono">${pos.btcEntry.toLocaleString()}</span></div>
                                    <div>ETH 入场: <span className="text-secondary font-mono">${pos.ethEntry.toLocaleString()}</span></div>
                                    <div>BTC 保证金: <span className="text-secondary font-mono">${pos.btcAmount.toLocaleString()}</span></div>
                                    <div>ETH 保证金: <span className="text-secondary font-mono">${pos.ethAmount.toLocaleString()}</span></div>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-strong/30">
                                    <span className="text-[9px] text-secondary">开仓: {new Date(pos.openedAt).toLocaleDateString('zh-CN')}</span>
                                    <div className="flex gap-1">
                                        <button className="text-[9px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20">调整</button>
                                        <button className="text-[9px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">平仓</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {MOCK_ACTIVE_POSITIONS.length === 0 && (
                            <div className="text-center text-[11px] text-dim py-8">暂无活跃对冲仓位</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

BTCETHDualAssetHedgePositionCalculator.displayName = 'BTCETHDualAssetHedgePositionCalculator';

export default BTCETHDualAssetHedgePositionCalculator;
