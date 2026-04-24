/**
 * 市场新闻流（Market News Feed）
 *
 * @deprecated 已被 intelligence_news_feed.tsx 替代
 */
import React, { memo, useState, useMemo } from 'react';
import type { MarketNewsItem, ImportanceLevel } from '../../trade_center_pages/type/alpha_module_types';

// =========================================================================
// 本地遗留类型（旧分类，已被子母标签体系替代）
// =========================================================================

type LegacyCategory = 'macro' | 'regulation' | 'project' | 'defi' | 'nft' | 'ai';

const CATEGORY_CONFIG: Record<LegacyCategory, { label: string; color: string }> = {
    macro: { label: '宏观', color: 'text-blue-400 bg-blue-400/10' },
    regulation: { label: '监管', color: 'text-red-400 bg-red-400/10' },
    project: { label: '项目', color: 'text-purple-400 bg-purple-400/10' },
    defi: { label: 'DeFi', color: 'text-green-400 bg-green-400/10' },
    nft: { label: 'NFT', color: 'text-pink-400 bg-pink-400/10' },
    ai: { label: 'AI', color: 'text-cyan-400 bg-cyan-400/10' },
};

const IMPORTANCE_ICON: Record<ImportanceLevel, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '⚪',
};

// =========================================================================
// Props
// =========================================================================

interface MarketNewsFeedProps {
    news: Array<MarketNewsItem & { category?: string }>;
}

// =========================================================================
// 工具
// =========================================================================

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    return `${Math.floor(hours / 24)} 天前`;
}

// =========================================================================
// 主组件
// =========================================================================

const MarketNewsFeed: React.FC<MarketNewsFeedProps> = memo(({ news }) => {
    const [filter, setFilter] = useState<LegacyCategory | 'all'>('all');

    const categories: (LegacyCategory | 'all')[] = ['all', 'macro', 'regulation', 'project', 'defi', 'nft', 'ai'];

    const filtered = useMemo(() => {
        if (filter === 'all') return news;
        return news.filter((n) => n.category === filter);
    }, [news, filter]);

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4">
            <h3 className="text-sm font-semibold text-primary mb-3">📰 市场快讯（旧版）</h3>

            {/* 分类筛选 */}
            <div className="flex flex-wrap gap-1.5 mb-3">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`text-[10px] px-2.5 py-0.5 rounded-full transition-colors ${
                            filter === cat
                                ? 'bg-blue-600 text-white'
                                : 'bg-surface-hover/50 text-muted hover:text-primary'
                        }`}
                    >
                        {cat === 'all' ? '全部' : CATEGORY_CONFIG[cat].label}
                    </button>
                ))}
            </div>

            {/* 新闻列表 */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                    <div className="text-center text-secondary text-xs py-6">暂无新闻</div>
                ) : (
                    filtered.map((item) => {
                        const cat = (item.category ?? 'macro') as LegacyCategory;
                        const catCfg = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.macro;
                        return (
                            <div
                                key={item.id}
                                className="bg-card/50 rounded-lg p-3 hover:bg-card/70 transition-colors"
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-sm mt-0.5">{IMPORTANCE_ICON[item.importance]}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${catCfg.color}`}>
                                                {catCfg.label}
                                            </span>
                                            <span className="text-[10px] text-secondary">
                                                {timeAgo(item.publishedAt)}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-medium text-primary leading-snug mb-1">
                                            {item.title}
                                        </h4>
                                        {item.summary && (
                                            <p className="text-[10px] text-dim leading-relaxed line-clamp-2">
                                                {item.summary}
                                            </p>
                                        )}
                                        {item.source && (
                                            <span className="text-[10px] text-secondary mt-1 inline-block">
                                                来源：{item.source}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
});

MarketNewsFeed.displayName = 'MarketNewsFeed';
export default MarketNewsFeed;
