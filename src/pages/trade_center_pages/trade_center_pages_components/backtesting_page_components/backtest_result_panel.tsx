/**
 * 回测结果面板（Backtest Result Panel）
 *
 * 展示单次回测的完整统计指标：
 *  - 核心指标卡片（总收益 / 最大回撤 / 夏普 / 胜率）
 *  - 详细统计表格
 *  - 交易记录列表
 */
import React, { memo, useMemo } from 'react';
import type { BacktestResult } from '../../../type/alpha_module_types';

// =========================================================================
// 工具函数
// =========================================================================

function pctColor(v: number): string {
    return v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-muted';
}

function fmtPct(v: number): string {
    return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function fmtUsd(v: number): string {
    return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// =========================================================================
// Props
// =========================================================================

interface BacktestResultPanelProps {
    result: BacktestResult | null;
    isLoading: boolean;
}

// =========================================================================
// 核心指标卡片
// =========================================================================

interface MetricCardProps {
    label: string;
    value: string;
    color?: string;
}

const MetricCard: React.FC<MetricCardProps> = memo(({ label, value, color = 'text-primary' }) => (
    <div className="bg-card/50 rounded-lg p-3 text-center">
        <div className="text-xs text-dim mb-1">{label}</div>
        <div className={`text-base font-bold ${color}`}>{value}</div>
    </div>
));
MetricCard.displayName = 'MetricCard';

// =========================================================================
// 主组件
// =========================================================================

const BacktestResultPanel: React.FC<BacktestResultPanelProps> = memo(({ result, isLoading }) => {
    if (isLoading) {
        return (
            <div className="bg-surface/60 rounded-xl border border-strong/50 p-6">
                <div className="flex items-center justify-center gap-3 py-12">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted">回测运行中，请稍候...</span>
                </div>
            </div>
        );
    }

    if (!result || !result.statistics) {
        return (
            <div className="bg-surface/60 rounded-xl border border-strong/50 p-6 text-center text-dim text-sm">
                配置参数后点击「开始回测」查看结果
            </div>
        );
    }

    const s = result.statistics;

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-primary">回测结果</h3>

            {/* ─── 核心指标 ─────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard label="总收益率" value={fmtPct(s.totalReturnPct)} color={pctColor(s.totalReturnPct)} />
                <MetricCard label="最大回撤" value={fmtPct(-s.maxDrawdownPct)} color="text-red-400" />
                <MetricCard label="夏普比率" value={s.sharpeRatio.toFixed(2)} color={s.sharpeRatio > 1 ? 'text-green-400' : 'text-yellow-400'} />
                <MetricCard label="胜率" value={fmtPct(s.winRatePct)} color={s.winRatePct > 50 ? 'text-green-400' : 'text-red-400'} />
            </div>

            {/* ─── 详细统计 ─────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                {[
                    ['年化收益', fmtPct(s.annualizedReturnPct)],
                    ['Sortino 比率', s.sortinoRatio.toFixed(2)],
                    ['盈亏比', s.profitFactor.toFixed(2)],
                    ['总交易次数', String(s.totalTrades)],
                    ['盈利 / 亏损', `${s.winningTrades} / ${s.losingTrades}`],
                    ['平均盈利', fmtUsd(s.avgWin)],
                    ['平均亏损', fmtUsd(s.avgLoss)],
                    ['最大连胜', String(s.maxConsecutiveWins)],
                    ['最大连亏', String(s.maxConsecutiveLosses)],
                    ['最终净值', fmtUsd(s.finalEquity)],
                ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between py-1 border-b border-strong/20">
                        <span className="text-dim">{label}</span>
                        <span className="text-primary font-mono">{value}</span>
                    </div>
                ))}
            </div>

            {/* ─── 交易记录（前 10 条） ────────────────────── */}
            {result.trades.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-muted mb-2">交易记录（最近 {Math.min(result.trades.length, 10)} 笔）</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-dim border-b border-strong/30">
                                    <th className="text-left py-1 pr-2">方向</th>
                                    <th className="text-right py-1 pr-2">入场价</th>
                                    <th className="text-right py-1 pr-2">出场价</th>
                                    <th className="text-right py-1 pr-2">数量</th>
                                    <th className="text-right py-1">盈亏</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.trades.slice(0, 10).map((t, i) => (
                                    <tr key={i} className="border-b border-strong/10 hover:bg-card/5">
                                        <td className={`py-1.5 pr-2 font-medium ${t.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                                            {t.side === 'buy' ? '买入' : '卖出'}
                                        </td>
                                        <td className="text-right pr-2 text-primary font-mono">{t.entryPrice.toFixed(2)}</td>
                                        <td className="text-right pr-2 text-primary font-mono">{t.exitPrice?.toFixed(2) ?? '—'}</td>
                                        <td className="text-right pr-2 text-muted font-mono">{t.amount.toFixed(4)}</td>
                                        <td className={`text-right font-mono ${pctColor(t.pnl ?? 0)}`}>
                                            {t.pnl !== null ? fmtUsd(t.pnl) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
});

BacktestResultPanel.displayName = 'BacktestResultPanel';
export default BacktestResultPanel;
