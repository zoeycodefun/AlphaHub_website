/**
 * 盈亏实时反馈组件
 * 展示今日实时盈亏、当前持仓盈亏、已平仓盈亏等
 */
import React, { memo } from 'react';
import type { PnlRealtimeFeedback } from '../../../type/alpha_module_types';

interface Props {
    feedback: PnlRealtimeFeedback;
}

const PnlColor = ({ value }: { value: number }) => (
    <span className={value >= 0 ? 'text-green-400' : 'text-red-400'}>
        {value >= 0 ? '+' : ''}{value.toFixed(2)}
    </span>
);

const ProfitLossRealtimeFeedback: React.FC<Props> = memo(({ feedback }) => {
    return (
        <div className="bg-card/50 border border-base rounded-xl p-4">
            <h3 className="text-sm font-semibold text-primary mb-3">📡 盈亏实时反馈</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                    <p className="text-xs text-dim mb-1">今日盈亏</p>
                    <p className="text-lg font-bold"><PnlColor value={feedback.todayPnl} /> <span className="text-xs text-dim">USDT</span></p>
                </div>
                <div>
                    <p className="text-xs text-dim mb-1">今日收益率</p>
                    <p className="text-lg font-bold"><PnlColor value={feedback.todayReturnPct} /><span className="text-xs text-dim">%</span></p>
                </div>
                <div>
                    <p className="text-xs text-dim mb-1">持仓盈亏</p>
                    <p className="text-lg font-bold"><PnlColor value={feedback.openPositionPnl} /></p>
                </div>
                <div>
                    <p className="text-xs text-dim mb-1">已平仓盈亏</p>
                    <p className="text-lg font-bold"><PnlColor value={feedback.closedPnl} /></p>
                </div>
                <div>
                    <p className="text-xs text-dim mb-1">今日交易</p>
                    <p className="text-lg font-bold text-primary">{feedback.todayTradeCount} <span className="text-xs text-dim">笔</span></p>
                </div>
                <div>
                    <p className="text-xs text-dim mb-1">今日胜率</p>
                    <p className="text-lg font-bold text-primary">{feedback.todayWinRate.toFixed(1)}<span className="text-xs text-dim">%</span></p>
                </div>
            </div>

            {/* 日内权益曲线简图 */}
            {feedback.intraday.length > 1 && (
                <div className="mt-4 h-16 flex items-end gap-px">
                    {(() => {
                        const values = feedback.intraday.map(p => p.equity);
                        const min = Math.min(...values);
                        const max = Math.max(...values);
                        const range = max - min || 1;
                        return feedback.intraday.map((point, i) => {
                            const height = ((point.equity - min) / range) * 100;
                            const isUp = i > 0 ? point.equity >= feedback.intraday[i - 1].equity : true;
                            return (
                                <div
                                    key={i}
                                    className={`flex-1 rounded-t-sm ${isUp ? 'bg-green-500/40' : 'bg-red-500/40'}`}
                                    style={{ height: `${Math.max(height, 2)}%` }}
                                    title={`${point.time}: ${point.equity.toFixed(2)}`}
                                />
                            );
                        });
                    })()}
                </div>
            )}
        </div>
    );
});

ProfitLossRealtimeFeedback.displayName = 'ProfitLossRealtimeFeedback';
export default ProfitLossRealtimeFeedback;
