/**
 * 推特舆情面板（Market Twitter Panel）
 *
 * 展示加密货币推特舆情：
 *  - KOL/分析师推文列表
 *  - 情绪标签（看涨/看跌/中性）
 *  - 互动指标（转发/点赞/回复）
 *  - 提及币种标签
 */
import React, { memo } from 'react';
import type { TweetRecord, SentimentDirection } from '../../trade_center_pages/type/alpha_module_types';

// =========================================================================
// 常量
// =========================================================================

const SENTIMENT_BADGE: Record<SentimentDirection, { label: string; color: string }> = {
    bullish: { label: '看涨', color: 'text-green-400 bg-green-400/10' },
    bearish: { label: '看跌', color: 'text-red-400 bg-red-400/10' },
    neutral: { label: '中性', color: 'text-muted bg-gray-400/10' },
};

// =========================================================================
// Props
// =========================================================================

interface MarketTwitterPanelProps {
    tweets: TweetRecord[];
}

// =========================================================================
// 工具
// =========================================================================

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
}

function formatCount(v: number): string {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return String(v);
}

// =========================================================================
// 主组件
// =========================================================================

const MarketTwitterPanel: React.FC<MarketTwitterPanelProps> = memo(({ tweets }) => {
    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4">
            <h3 className="text-sm font-semibold text-primary mb-3">🐦 推特舆情</h3>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {tweets.length === 0 ? (
                    <div className="text-center text-secondary text-xs py-6">暂无推文数据</div>
                ) : (
                    tweets.map((tweet) => {
                        const sentBadge = SENTIMENT_BADGE[tweet.sentiment];
                        return (
                            <div
                                key={tweet.id}
                                className="bg-card/50 rounded-lg p-3 hover:bg-card/70 transition-colors"
                            >
                                {/* 用户头 + 时间 */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-[10px] text-blue-400 font-bold">
                                            {tweet.authorHandle.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium text-primary">{tweet.authorName}</div>
                                            <div className="text-[10px] text-secondary">@{tweet.authorHandle}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${sentBadge.color}`}>
                                            {sentBadge.label}
                                        </span>
                                        <span className="text-[10px] text-secondary">{timeAgo(tweet.publishedAt)}</span>
                                    </div>
                                </div>

                                {/* 推文内容 */}
                                <p className="text-xs text-secondary leading-relaxed mb-2 line-clamp-3">
                                    {tweet.content}
                                </p>

                                {/* 提及币种 */}
                                {tweet.mentionedSymbols && tweet.mentionedSymbols.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {tweet.mentionedSymbols.map((sym) => (
                                            <span
                                                key={sym}
                                                className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded"
                                            >
                                                ${sym}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* 互动指标 */}
                                <div className="flex gap-4 text-[10px] text-secondary">
                                    <span>🔄 {formatCount(tweet.retweets)}</span>
                                    <span>❤️ {formatCount(tweet.likes)}</span>
                                    <span>💬 {formatCount(tweet.replies)}</span>
                                    {tweet.followers && (
                                        <span className="ml-auto">粉丝 {formatCount(tweet.followers)}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
});

MarketTwitterPanel.displayName = 'MarketTwitterPanel';
export default MarketTwitterPanel;
