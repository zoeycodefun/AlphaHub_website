/**
 * Twitter 账号追踪面板 + 关系图谱（TwitterTrackerPanel）
 *
 * 功能：
 *  1. 追踪的 Twitter 账号列表（手动维护）
 *  2. 每个账号的最近推文 / 情绪标记
 *  3. 点击账号展开关系图谱（V1 简化版：列表式关系展示）
 *  4. 推文流 — 所有追踪账号的推文聚合
 *
 * V1 设计：
 *  - 上半部分：追踪账号卡片列表
 *  - 下半部分：推文聚合流
 *  - 关系图谱为简化的列表式（后续可升级为 D3 / force graph）
 */
import React, { memo, useState, useMemo, useCallback } from 'react';
import type {
    TrackedTwitterAccount,
    TweetRecord,
    TwitterRelationshipEdge,
    SentimentDirection,
} from '../../trade_center_pages/type/alpha_module_types';

// =========================================================================
// 配置
// =========================================================================

const SENTIMENT_BADGE: Record<SentimentDirection, { label: string; color: string }> = {
    bullish: { label: '看涨', color: 'text-green-400 bg-green-400/10' },
    bearish: { label: '看跌', color: 'text-red-400 bg-red-400/10' },
    neutral: { label: '中性', color: 'text-muted bg-gray-400/10' },
};

const RELATION_TYPE_LABEL: Record<string, { label: string; color: string }> = {
    mentor:     { label: '导师', color: 'text-blue-400' },
    peer:       { label: '同级', color: 'text-green-400' },
    antagonist: { label: '对立', color: 'text-red-400' },
    amplifier:  { label: '跟风', color: 'text-yellow-400' },
};

// =========================================================================
// V1 Mock 数据
// =========================================================================

const MOCK_TRACKED_ACCOUNTS: TrackedTwitterAccount[] = [
    { handle: 'coaborned', name: 'Cobie', followers: 720000, focusTags: ['macro_environment', 'investment'], recentSentiment: 'bullish', isActive: true, addedAt: '2025-01-15', lastTweetAt: '2025-07-10T13:00:00Z' },
    { handle: 'HsakaTrades', name: 'Hsaka', followers: 450000, focusTags: ['exchange_data', 'macro_data'], recentSentiment: 'bullish', isActive: true, addedAt: '2025-02-01', lastTweetAt: '2025-07-10T11:30:00Z' },
    { handle: 'zachxbt', name: 'ZachXBT', followers: 680000, focusTags: ['web3_projects', 'regulation'], recentSentiment: 'bearish', isActive: true, addedAt: '2025-01-20', lastTweetAt: '2025-07-10T09:45:00Z' },
    { handle: 'blknoiz06', name: 'Ansem', followers: 520000, focusTags: ['dev_tech', 'web3_projects'], recentSentiment: 'bullish', isActive: true, addedAt: '2025-03-01', lastTweetAt: '2025-07-09T22:00:00Z' },
    { handle: 'crypto_birb', name: 'Crypto Birb', followers: 330000, focusTags: ['exchange_data', 'macro_data'], recentSentiment: 'bearish', isActive: true, addedAt: '2025-04-01', lastTweetAt: '2025-07-09T18:30:00Z' },
    { handle: 'DegenSpartan', name: 'DegenSpartan', followers: 280000, focusTags: ['entertainment', 'exchange_data'], recentSentiment: 'neutral', isActive: false, addedAt: '2025-02-15', lastTweetAt: '2025-07-09T14:00:00Z' },
];

const MOCK_RELATIONSHIPS: TwitterRelationshipEdge[] = [
    { from: 'coaborned', to: 'HsakaTrades', type: 'peer', strength: 72, commonTopics: ['BTC', '宏观'] },
    { from: 'zachxbt', to: 'coaborned', type: 'peer', strength: 45, commonTopics: ['项目审计'] },
    { from: 'blknoiz06', to: 'coaborned', type: 'amplifier', strength: 60, commonTopics: ['SOL', 'DePIN'] },
    { from: 'crypto_birb', to: 'HsakaTrades', type: 'peer', strength: 55, commonTopics: ['技术分析'] },
    { from: 'DegenSpartan', to: 'blknoiz06', type: 'antagonist', strength: 35, commonTopics: ['Meme'] },
];

const MOCK_TWEETS: TweetRecord[] = [
    { id: 't-1', authorName: 'Cobie', authorHandle: 'coaborned', content: 'SOL ETF approval is a massive narrative shift. This changes the game for altcoin legitimacy.', sentiment: 'bullish', sentimentScore: 78, tags: ['institutional'], importance: 'high', followers: 720000, retweets: 4200, likes: 18500, replies: 890, mentionedSymbols: ['SOL', 'BTC', 'ETH'], publishedAt: '2025-07-10T13:00:00Z' },
    { id: 't-2', authorName: 'Hsaka', authorHandle: 'HsakaTrades', content: 'BTC 突破 72K 后回测 70K 拿到支撑，4H 结构看涨。关注周线收线。', sentiment: 'bullish', sentimentScore: 65, tags: ['price_breakout'], importance: 'medium', followers: 450000, retweets: 1800, likes: 8900, replies: 340, mentionedSymbols: ['BTC'], publishedAt: '2025-07-10T11:30:00Z' },
    { id: 't-3', authorName: 'ZachXBT', authorHandle: 'zachxbt', content: '发现一个新项目方团队与此前 rug pull 的 XYZ 项目有关联钱包，请大家注意风险。', sentiment: 'bearish', sentimentScore: -55, tags: ['regulation', 'community'], importance: 'high', followers: 680000, retweets: 6500, likes: 12000, replies: 1200, mentionedSymbols: [], publishedAt: '2025-07-10T09:45:00Z' },
    { id: 't-4', authorName: 'Ansem', authorHandle: 'blknoiz06', content: 'DePIN is the real use case for crypto. RNDR + HNT leading the way.', sentiment: 'bullish', sentimentScore: 70, tags: ['dev_tech', 'web3_projects'], importance: 'medium', followers: 520000, retweets: 2100, likes: 9200, replies: 560, mentionedSymbols: ['RNDR', 'HNT'], publishedAt: '2025-07-09T22:00:00Z' },
    { id: 't-5', authorName: 'Crypto Birb', authorHandle: 'crypto_birb', content: 'ETH/BTC ratio 持续走弱，alt season 可能还要等等。', sentiment: 'bearish', sentimentScore: -30, tags: ['macro_data'], importance: 'low', followers: 330000, retweets: 950, likes: 4300, replies: 280, mentionedSymbols: ['ETH', 'BTC'], publishedAt: '2025-07-09T18:30:00Z' },
];

// =========================================================================
// 辅助函数
// =========================================================================

function formatCount(v: number): string {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return String(v);
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
}

// =========================================================================
// Props
// =========================================================================

interface TwitterTrackerPanelProps {
    accounts?: TrackedTwitterAccount[];
    tweets?: TweetRecord[];
    relationships?: TwitterRelationshipEdge[];
}

// =========================================================================
// 子组件：账号卡片
// =========================================================================

const AccountCard: React.FC<{
    account: TrackedTwitterAccount;
    isExpanded: boolean;
    onToggle: () => void;
    relationships: TwitterRelationshipEdge[];
}> = memo(({ account, isExpanded, onToggle, relationships }) => {
    const badge = SENTIMENT_BADGE[account.recentSentiment];
    const relatedEdges = relationships.filter(
        r => r.from === account.handle || r.to === account.handle,
    );

    return (
        <div className="bg-surface/50 rounded-lg border border-strong/30 overflow-hidden">
            {/* 账号信息行 */}
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-2.5 p-2.5 hover:bg-surface-hover/30 transition-colors text-left"
            >
                <div className="w-7 h-7 bg-blue-500/20 rounded-full flex items-center justify-center text-[10px] text-blue-400 font-bold flex-shrink-0">
                    {account.handle.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-primary truncate">{account.name}</span>
                        <span className={`text-[9px] px-1 py-0.5 rounded ${badge.color}`}>{badge.label}</span>
                        {!account.isActive && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-gray-600/40 text-dim">不活跃</span>
                        )}
                    </div>
                    <div className="text-[10px] text-dim">@{account.handle} · {formatCount(account.followers)} 粉丝</div>
                </div>
                <span className="text-secondary text-[10px]">{isExpanded ? '▼' : '▶'}</span>
            </button>

            {/* 展开：关系图谱 */}
            {isExpanded && relatedEdges.length > 0 && (
                <div className="border-t border-strong/30 px-2.5 py-2 bg-card/30">
                    <div className="text-[9px] text-dim mb-1.5">🔗 关系图谱</div>
                    <div className="space-y-1">
                        {relatedEdges.map((edge, i) => {
                            const otherHandle = edge.from === account.handle ? edge.to : edge.from;
                            const rel = RELATION_TYPE_LABEL[edge.type] || { label: edge.type, color: 'text-muted' };
                            return (
                                <div key={i} className="flex items-center gap-1.5 text-[10px]">
                                    <span className={`px-1 py-0.5 rounded bg-surface ${rel.color}`}>{rel.label}</span>
                                    <span className="text-muted">↔</span>
                                    <span className="text-secondary">@{otherHandle}</span>
                                    <div className="flex-1" />
                                    <div className="w-12 h-1 bg-surface-hover rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${edge.strength}%` }} />
                                    </div>
                                    <span className="text-secondary w-6 text-right">{edge.strength}</span>
                                </div>
                            );
                        })}
                    </div>
                    {relatedEdges.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {Array.from(new Set(relatedEdges.flatMap(e => e.commonTopics))).map(topic => (
                                <span key={topic} className="text-[9px] px-1 py-0.5 bg-surface text-dim rounded">{topic}</span>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {isExpanded && relatedEdges.length === 0 && (
                <div className="border-t border-strong/30 px-2.5 py-2 bg-card/30">
                    <div className="text-[9px] text-secondary">暂无关系数据</div>
                </div>
            )}
        </div>
    );
});
AccountCard.displayName = 'AccountCard';

// =========================================================================
// 主组件
// =========================================================================

const TwitterTrackerPanel: React.FC<TwitterTrackerPanelProps> = memo(({
    accounts = MOCK_TRACKED_ACCOUNTS,
    tweets = MOCK_TWEETS,
    relationships = MOCK_RELATIONSHIPS,
}) => {
    const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'accounts' | 'tweets'>('accounts');

    const toggleExpand = useCallback((handle: string) => {
        setExpandedAccount(prev => prev === handle ? null : handle);
    }, []);

    const sortedAccounts = useMemo(
        () => [...accounts].sort((a, b) => {
            if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
            return b.followers - a.followers;
        }),
        [accounts],
    );

    return (
        <div className="flex flex-col h-full">
            {/* Tab 切换 */}
            <div className="flex items-center gap-1 mb-3">
                <button
                    onClick={() => setActiveTab('accounts')}
                    className={`text-[11px] px-3 py-1 rounded-lg transition-colors ${
                        activeTab === 'accounts'
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-dim hover:text-secondary'
                    }`}
                >
                    👤 追踪账号 ({accounts.length})
                </button>
                <button
                    onClick={() => setActiveTab('tweets')}
                    className={`text-[11px] px-3 py-1 rounded-lg transition-colors ${
                        activeTab === 'tweets'
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-dim hover:text-secondary'
                    }`}
                >
                    🐦 推文流 ({tweets.length})
                </button>
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700">
                {activeTab === 'accounts' ? (
                    <div className="space-y-1.5">
                        {sortedAccounts.map(acc => (
                            <AccountCard
                                key={acc.handle}
                                account={acc}
                                isExpanded={expandedAccount === acc.handle}
                                onToggle={() => toggleExpand(acc.handle)}
                                relationships={relationships}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {tweets.map(tweet => {
                            const sentBadge = SENTIMENT_BADGE[tweet.sentiment];
                            return (
                                <div key={tweet.id} className="bg-surface/50 rounded-lg p-3 border border-strong/30">
                                    {/* 头部 */}
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center text-[9px] text-blue-400 font-bold">
                                                {tweet.authorHandle.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-[11px] font-medium text-primary">{tweet.authorName}</span>
                                            <span className="text-[9px] text-secondary">@{tweet.authorHandle}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[9px] px-1 py-0.5 rounded ${sentBadge.color}`}>{sentBadge.label}</span>
                                            <span className="text-[9px] text-secondary">{timeAgo(tweet.publishedAt)}</span>
                                        </div>
                                    </div>
                                    {/* 内容 */}
                                    <p className="text-[11px] text-secondary leading-relaxed mb-2 line-clamp-3">{tweet.content}</p>
                                    {/* 币种 */}
                                    {tweet.mentionedSymbols.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-1.5">
                                            {tweet.mentionedSymbols.map(sym => (
                                                <span key={sym} className="text-[9px] px-1 py-0.5 bg-blue-500/10 text-blue-400 rounded">${sym}</span>
                                            ))}
                                        </div>
                                    )}
                                    {/* 互动 */}
                                    <div className="flex gap-3 text-[9px] text-secondary">
                                        <span>🔄 {formatCount(tweet.retweets)}</span>
                                        <span>❤️ {formatCount(tweet.likes)}</span>
                                        <span>💬 {formatCount(tweet.replies)}</span>
                                        <span className="ml-auto">粉丝 {formatCount(tweet.followers)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
});

TwitterTrackerPanel.displayName = 'TwitterTrackerPanel';
export default TwitterTrackerPanel;
