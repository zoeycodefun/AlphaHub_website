/**
 * 回测报告查看窗口（Backtesting Report Check Window）
 *
 * 重新设计：现货+合约统一回测报告弹窗
 *  - 总体表现（现货 vs 合约对比）
 *  - 按信号强度分类统计
 *  - 按周期分类统计
 *  - 最佳 / 最差信号记录
 *  - 优化建议
 */
import React, { memo } from 'react';
import type { UnifiedSignalBacktestReport } from '../../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface BacktestingReportCheckWindowProps {
    visible: boolean;
    onClose: () => void;
    report: UnifiedSignalBacktestReport | null;
}

// =========================================================================
// Mock 报告数据
// =========================================================================

export const MOCK_UNIFIED_REPORT: UnifiedSignalBacktestReport = {
    dateRange: '2024-01-01 ~ 2025-06-30',
    generatedAt: new Date().toISOString(),
    status: 'completed',

    // 总体表现
    spotTotalSignals: 8246,
    contractTotalSignals: 10128,
    spotAccuracy: 64.2,
    contractAccuracy: 61.8,
    spotTotalReturn: 187.5,
    contractTotalReturn: 245.3,
    spotSharpeRatio: 1.72,
    contractSharpeRatio: 1.58,
    spotMaxDrawdown: 15.3,
    contractMaxDrawdown: 22.1,

    // 按强度分类
    spotStrengthStats: [
        { level: '极强 (90+)', accuracy: 78.5, count: 312 },
        { level: '强 (75-90)', accuracy: 68.2, count: 1856 },
        { level: '中 (60-75)', accuracy: 58.4, count: 3420 },
        { level: '弱 (< 60)', accuracy: 45.1, count: 2658 },
    ],
    contractStrengthStats: [
        { level: '极强 (90+)', accuracy: 75.8, count: 428 },
        { level: '强 (75-90)', accuracy: 65.0, count: 2210 },
        { level: '中 (60-75)', accuracy: 55.2, count: 4120 },
        { level: '弱 (< 60)', accuracy: 42.6, count: 3370 },
    ],

    // 按周期分类
    spotPeriodStats: [
        { period: '7 天', accuracy: 62.1, avgReturn: 3.2 },
        { period: '30 天', accuracy: 66.8, avgReturn: 8.5 },
        { period: '90 天', accuracy: 71.2, avgReturn: 18.4 },
    ],
    contractPeriodStats: [
        { period: '7 天', accuracy: 59.8, avgReturn: 4.8 },
        { period: '30 天', accuracy: 63.5, avgReturn: 12.1 },
        { period: '90 天', accuracy: 68.0, avgReturn: 28.6 },
    ],

    // 最佳/最差
    spotBest: { date: '2024-11-12', returnPct: 42.5, strength: '极强 (95)', symbol: 'BTC/USDT' },
    spotWorst: { date: '2025-02-03', returnPct: -18.2, strength: '中 (68)', symbol: 'SOL/USDT' },
    contractBest: { date: '2024-03-28', returnPct: 68.3, strength: '极强 (92)', symbol: 'ETH/USDT' },
    contractWorst: { date: '2024-08-15', returnPct: -32.1, strength: '弱 (52)', symbol: 'BNB/USDT' },

    // 优化建议
    improvementSuggestions: [
        '建议过滤"弱"强度信号（< 60分），可将整体准确率提升约 8%',
        '合约信号最大回撤较高（22.1%），建议对合约仓位增加止损策略',
        '90天周期信号表现最佳，建议优先关注中长期信号',
        '现货 "极强" 信号准确率达 78.5%，可适当增加此类信号的仓位权重',
        '建议结合资金费率和持仓量数据，对合约信号进行二次确认',
    ],
};

// =========================================================================
// 辅助组件
// =========================================================================

function fmtPct(v: number, showSign = false): string {
    const sign = showSign && v > 0 ? '+' : '';
    return `${sign}${v.toFixed(1)}%`;
}

function pctColor(v: number): string {
    if (v >= 65) return 'text-green-400';
    if (v >= 50) return 'text-yellow-400';
    return 'text-red-400';
}

function retColor(v: number): string {
    return v >= 0 ? 'text-green-400' : 'text-red-400';
}

/** 对比行 */
const CompareRow: React.FC<{ label: string; spot: string; contract: string; spotColor?: string; contractColor?: string }> = memo(
    ({ label, spot, contract, spotColor = 'text-primary', contractColor = 'text-primary' }) => (
        <div className="grid grid-cols-3 gap-2 py-2 border-b border-base/40 last:border-0">
            <div className="text-xs text-dim">{label}</div>
            <div className={`text-xs font-mono text-center ${spotColor}`}>{spot}</div>
            <div className={`text-xs font-mono text-center ${contractColor}`}>{contract}</div>
        </div>
    ),
);
CompareRow.displayName = 'CompareRow';

// =========================================================================
// 主组件
// =========================================================================

const BacktestingReportCheckWindow: React.FC<BacktestingReportCheckWindowProps> = memo(({ visible, onClose, report }) => {
    if (!visible || !report) return null;

    const r = report;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* 遮罩 */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* 弹窗 */}
            <div className="relative w-full max-w-3xl max-h-[90vh] bg-card rounded-2xl border border-strong/50 shadow-2xl flex flex-col mx-4">
                {/* 顶部 */}
                <div className="shrink-0 px-6 py-4 border-b border-base flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-primary flex items-center gap-2">📊 信号回测报告</h2>
                        <p className="text-[11px] text-dim mt-1">
                            {r.dateRange} · 生成于 {new Date(r.generatedAt).toLocaleString('zh-CN')}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-dim hover:text-primary transition-colors text-lg leading-none p-1">✕</button>
                </div>

                {/* 滚动内容区 */}
                <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">

                    {/* ===== 1. 总体表现 ===== */}
                    <section>
                        <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-1.5">📋 总体表现</h3>
                        <div className="bg-surface/40 rounded-xl p-4">
                            {/* 表头 */}
                            <div className="grid grid-cols-3 gap-2 pb-2 border-b border-strong/50 mb-1">
                                <div className="text-[10px] text-secondary"></div>
                                <div className="text-[10px] text-center text-blue-400 font-bold">💰 现货</div>
                                <div className="text-[10px] text-center text-purple-400 font-bold">📈 合约</div>
                            </div>
                            <CompareRow label="信号总数" spot={r.spotTotalSignals.toLocaleString()} contract={r.contractTotalSignals.toLocaleString()} />
                            <CompareRow label="准确率"
                                spot={fmtPct(r.spotAccuracy)} contract={fmtPct(r.contractAccuracy)}
                                spotColor={pctColor(r.spotAccuracy)} contractColor={pctColor(r.contractAccuracy)} />
                            <CompareRow label="总收益率"
                                spot={fmtPct(r.spotTotalReturn, true)} contract={fmtPct(r.contractTotalReturn, true)}
                                spotColor={retColor(r.spotTotalReturn)} contractColor={retColor(r.contractTotalReturn)} />
                            <CompareRow label="夏普比率"
                                spot={r.spotSharpeRatio.toFixed(2)} contract={r.contractSharpeRatio.toFixed(2)}
                                spotColor={r.spotSharpeRatio >= 1.5 ? 'text-green-400' : 'text-yellow-400'}
                                contractColor={r.contractSharpeRatio >= 1.5 ? 'text-green-400' : 'text-yellow-400'} />
                            <CompareRow label="最大回撤"
                                spot={fmtPct(r.spotMaxDrawdown)} contract={fmtPct(r.contractMaxDrawdown)}
                                spotColor={r.spotMaxDrawdown <= 15 ? 'text-green-400' : 'text-red-400'}
                                contractColor={r.contractMaxDrawdown <= 15 ? 'text-green-400' : 'text-red-400'} />
                        </div>
                    </section>

                    {/* ===== 2. 按信号强度分类 ===== */}
                    <section>
                        <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-1.5">📊 按信号强度分类</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 现货 */}
                            <div className="bg-surface/40 rounded-xl p-4">
                                <div className="text-[10px] text-blue-400 font-bold mb-2">💰 现货信号</div>
                                {r.spotStrengthStats.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-strong/30 last:border-0">
                                        <span className="text-[11px] text-muted">{s.level}</span>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[11px] font-mono ${pctColor(s.accuracy)}`}>{fmtPct(s.accuracy)}</span>
                                            <span className="text-[10px] text-secondary">{s.count} 条</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* 合约 */}
                            <div className="bg-surface/40 rounded-xl p-4">
                                <div className="text-[10px] text-purple-400 font-bold mb-2">📈 合约信号</div>
                                {r.contractStrengthStats.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-strong/30 last:border-0">
                                        <span className="text-[11px] text-muted">{s.level}</span>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[11px] font-mono ${pctColor(s.accuracy)}`}>{fmtPct(s.accuracy)}</span>
                                            <span className="text-[10px] text-secondary">{s.count} 条</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ===== 3. 按周期分类 ===== */}
                    <section>
                        <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-1.5">⏱️ 按周期分类</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 现货 */}
                            <div className="bg-surface/40 rounded-xl p-4">
                                <div className="text-[10px] text-blue-400 font-bold mb-2">💰 现货信号</div>
                                {r.spotPeriodStats.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-strong/30 last:border-0">
                                        <span className="text-[11px] text-muted">{p.period}</span>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[11px] font-mono ${pctColor(p.accuracy)}`}>{fmtPct(p.accuracy)}</span>
                                            <span className={`text-[10px] font-mono ${retColor(p.avgReturn)}`}>
                                                平均 {p.avgReturn > 0 ? '+' : ''}{p.avgReturn.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* 合约 */}
                            <div className="bg-surface/40 rounded-xl p-4">
                                <div className="text-[10px] text-purple-400 font-bold mb-2">📈 合约信号</div>
                                {r.contractPeriodStats.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-strong/30 last:border-0">
                                        <span className="text-[11px] text-muted">{p.period}</span>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[11px] font-mono ${pctColor(p.accuracy)}`}>{fmtPct(p.accuracy)}</span>
                                            <span className={`text-[10px] font-mono ${retColor(p.avgReturn)}`}>
                                                平均 {p.avgReturn > 0 ? '+' : ''}{p.avgReturn.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ===== 4. 最佳 / 最差信号 ===== */}
                    <section>
                        <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-1.5">🏆 最佳 / 最差信号</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 现货 */}
                            <div className="bg-surface/40 rounded-xl p-4 space-y-3">
                                <div className="text-[10px] text-blue-400 font-bold">💰 现货</div>
                                <ExtremeCard label="最佳" icon="🏆" record={r.spotBest} />
                                <ExtremeCard label="最差" icon="📉" record={r.spotWorst} />
                            </div>
                            {/* 合约 */}
                            <div className="bg-surface/40 rounded-xl p-4 space-y-3">
                                <div className="text-[10px] text-purple-400 font-bold">📈 合约</div>
                                <ExtremeCard label="最佳" icon="🏆" record={r.contractBest} />
                                <ExtremeCard label="最差" icon="📉" record={r.contractWorst} />
                            </div>
                        </div>
                    </section>

                    {/* ===== 5. 优化建议 ===== */}
                    <section>
                        <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-1.5">💡 优化建议</h3>
                        <div className="bg-surface/40 rounded-xl p-4 space-y-2">
                            {r.improvementSuggestions.map((s, i) => (
                                <div key={i} className="flex items-start gap-2 text-[11px]">
                                    <span className="text-yellow-500 mt-0.5 shrink-0">{i + 1}.</span>
                                    <span className="text-secondary">{s}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* 底部 */}
                <div className="shrink-0 px-6 py-3 border-t border-base flex items-center justify-between">
                    <span className="text-[10px] text-secondary">
                        📋 报告基于 {(r.spotTotalSignals + r.contractTotalSignals).toLocaleString()} 条历史信号生成
                    </span>
                    <button onClick={onClose}
                        className="text-xs px-3 py-1.5 rounded-lg bg-surface text-muted hover:bg-surface-hover transition-colors">
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
});

BacktestingReportCheckWindow.displayName = 'BacktestingReportCheckWindow';

// =========================================================================
// 小组件
// =========================================================================

import type { SignalExtremeRecord } from '../../../type/alpha_module_types';

const ExtremeCard: React.FC<{ label: string; icon: string; record: SignalExtremeRecord }> = memo(
    ({ label, icon, record }) => (
        <div className="bg-card/60 rounded-lg px-3 py-2">
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-dim">{icon} {label}</span>
                <span className="text-[10px] text-secondary">{record.date}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-xs text-primary font-mono">{record.symbol}</span>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-dim">{record.strength}</span>
                    <span className={`text-xs font-bold font-mono ${retColor(record.returnPct)}`}>
                        {record.returnPct > 0 ? '+' : ''}{record.returnPct.toFixed(1)}%
                    </span>
                </div>
            </div>
        </div>
    ),
);
ExtremeCard.displayName = 'ExtremeCard';

export default BacktestingReportCheckWindow;
