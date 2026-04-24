/**
 * 分类盈亏分析组件
 * 按来源（信号/策略/仓位）和交易对分类展示盈亏
 */
import React, { memo, useState } from 'react';
import type { PnlReport, PnlSource } from '../../../type/alpha_module_types';

interface Props {
    report: PnlReport;
}

type CategoryTab = 'source' | 'symbol';

const SOURCE_LABELS: Record<PnlSource, string> = {
    spot: '现货',
    futures: '合约',
    hedge: '对冲',
    dca: '定投',
    manual: '手动',
};

const ProfitLossClassificationAnalysis: React.FC<Props> = memo(({ report }) => {
    const [activeTab, setActiveTab] = useState<CategoryTab>('source');

    return (
        <div className="bg-card/50 border border-base rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-primary">🏷️ 分类盈亏分析</h3>
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveTab('source')}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                            activeTab === 'source' ? 'bg-blue-600/30 text-blue-400' : 'text-dim hover:text-secondary'
                        }`}
                    >
                        按来源
                    </button>
                    <button
                        onClick={() => setActiveTab('symbol')}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                            activeTab === 'symbol' ? 'bg-blue-600/30 text-blue-400' : 'text-dim hover:text-secondary'
                        }`}
                    >
                        按交易对
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                {activeTab === 'source' && (
                    Object.entries(report.bySource).map(([source, data]) => (
                        <CategoryRow
                            key={source}
                            label={SOURCE_LABELS[source as PnlSource] ?? source}
                            pnl={data.pnl}
                            count={data.count}
                            total={report.totalRealizedPnl}
                        />
                    ))
                )}
                {activeTab === 'symbol' && (
                    Object.entries(report.bySymbol)
                        .sort((a, b) => b[1].pnl - a[1].pnl)
                        .map(([symbol, data]) => (
                            <CategoryRow
                                key={symbol}
                                label={symbol}
                                pnl={data.pnl}
                                count={data.count}
                                total={report.totalRealizedPnl}
                            />
                        ))
                )}
            </div>
        </div>
    );
});

function CategoryRow({ label, pnl, count, total }: { label: string; pnl: number; count: number; total: number }) {
    const pct = total !== 0 ? (pnl / Math.abs(total)) * 100 : 0;
    return (
        <div className="flex items-center justify-between py-2 px-3 bg-surface/40 rounded-lg">
            <div className="flex items-center gap-3">
                <span className="text-sm text-secondary w-24">{label}</span>
                <span className="text-xs text-dim">{count} 笔</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(Math.abs(pct), 100)}%` }}
                    />
                </div>
                <span className={`text-sm font-medium w-24 text-right ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                </span>
            </div>
        </div>
    );
}

ProfitLossClassificationAnalysis.displayName = 'ProfitLossClassificationAnalysis';
export default ProfitLossClassificationAnalysis;
