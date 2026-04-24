/**
 * 市场情绪面板（Market Sentiment Panel）
 *
 * 综合展示当前市场情绪：
 *  - 恐惧 & 贪婪指数（仪表盘风格）
 *  - BTC/ETH/总体情绪方向
 *  - 多空比对比
 *  - 资金流向指标
 */
import React, { memo } from 'react';
import type { MarketSentimentSummary, SentimentDirection } from '../../trade_center_pages/type/alpha_module_types';

// =========================================================================
// 常量
// =========================================================================

const SENTIMENT_CONFIG: Record<SentimentDirection, { label: string; color: string; emoji: string }> = {
    bullish: { label: '看涨', color: 'text-green-400', emoji: '🟢' },
    bearish: { label: '看跌', color: 'text-red-400', emoji: '🔴' },
    neutral: { label: '中性', color: 'text-muted', emoji: '⚪' },
};

// =========================================================================
// Props
// =========================================================================

interface MarketSentimentPanelProps {
    sentiment: MarketSentimentSummary;
}

// =========================================================================
// 主组件
// =========================================================================

const MarketSentimentPanel: React.FC<MarketSentimentPanelProps> = memo(({ sentiment }) => {
    /** 恐惧贪婪指数颜色 */
    const fgiColor = (v: number): string => {
        if (v <= 25) return 'text-red-400';
        if (v <= 45) return 'text-orange-400';
        if (v <= 55) return 'text-yellow-400';
        if (v <= 75) return 'text-green-400';
        return 'text-green-300';
    };

    const fgiLabel = (v: number): string => {
        if (v <= 25) return '极度恐惧';
        if (v <= 45) return '恐惧';
        if (v <= 55) return '中性';
        if (v <= 75) return '贪婪';
        return '极度贪婪';
    };

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4">
            <h3 className="text-sm font-semibold text-primary mb-4">🧠 市场情绪</h3>

            {/* 恐惧贪婪指数 - 仪表盘风格 */}
            <div className="text-center mb-4">
                <div className="text-[10px] text-dim mb-1">恐惧 & 贪婪指数</div>
                <div className={`text-4xl font-bold ${fgiColor(sentiment.fearGreedIndex)}`}>
                    {sentiment.fearGreedIndex}
                </div>
                <div className={`text-xs mt-1 ${fgiColor(sentiment.fearGreedIndex)}`}>
                    {fgiLabel(sentiment.fearGreedIndex)}
                </div>
                {/* 进度条 */}
                <div className="w-full h-2 bg-surface-hover rounded-full mt-3 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${sentiment.fearGreedIndex}%`,
                            background: 'linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)',
                        }}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-secondary mt-1">
                    <span>极度恐惧</span>
                    <span>极度贪婪</span>
                </div>
            </div>

            {/* 情绪方向 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                    { label: 'BTC', dir: sentiment.btcSentiment },
                    { label: 'ETH', dir: sentiment.ethSentiment },
                    { label: '总体', dir: sentiment.overallDirection },
                ].map((item) => {
                    const cfg = SENTIMENT_CONFIG[item.dir];
                    return (
                        <div key={item.label} className="bg-card/50 rounded-lg p-2 text-center">
                            <div className="text-[10px] text-dim mb-0.5">{item.label}</div>
                            <div className="text-sm">{cfg.emoji}</div>
                            <div className={`text-[10px] mt-0.5 ${cfg.color}`}>{cfg.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* 多空比 */}
            <div className="mb-4">
                <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-green-400">多 {sentiment.longRatio.toFixed(1)}%</span>
                    <span className="text-dim">多空比</span>
                    <span className="text-red-400">空 {sentiment.shortRatio.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden flex">
                    <div
                        className="bg-green-500 h-full"
                        style={{ width: `${sentiment.longRatio}%` }}
                    />
                    <div
                        className="bg-red-500 h-full"
                        style={{ width: `${sentiment.shortRatio}%` }}
                    />
                </div>
            </div>

            {/* 资金流向 */}
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-card/50 rounded p-2 text-center">
                    <div className="text-dim text-[10px] mb-0.5">24h 资金净流入</div>
                    <div className={`font-mono ${sentiment.netInflowUsd24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {sentiment.netInflowUsd24h >= 0 ? '+' : ''}
                        ${(Math.abs(sentiment.netInflowUsd24h) / 1e6).toFixed(1)}M
                    </div>
                </div>
                <div className="bg-card/50 rounded p-2 text-center">
                    <div className="text-dim text-[10px] mb-0.5">更新时间</div>
                    <div className="text-secondary font-mono">
                        {new Date(sentiment.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
        </div>
    );
});

MarketSentimentPanel.displayName = 'MarketSentimentPanel';
export default MarketSentimentPanel;
