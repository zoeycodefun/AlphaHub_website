/**
 * 情报新闻卡片列表（IntelligenceNewsFeed）
 *
 * 展示经 AI 处理后的新闻/信息卡片。
 * 每张卡片包含：标签徽章、重要性标记、标题、AI 摘要、来源、时间。
 *
 * 数据通过 selectedTags 筛选（空集 = 显示全部）。
 */
import React, { memo, useMemo } from 'react';
import type { MarketNewsItem, ImportanceLevel, SentimentDirection, ParentTag } from '../../trade_center_pages/type/alpha_module_types';

// =========================================================================
// 配置
// =========================================================================

const IMPORTANCE_BADGE: Record<ImportanceLevel, { label: string; dot: string; ring: string }> = {
    critical: { label: '重大', dot: '🔴', ring: 'ring-red-500/30' },
    high:     { label: '重要', dot: '🟠', ring: 'ring-orange-500/30' },
    medium:   { label: '一般', dot: '🟡', ring: 'ring-yellow-500/30' },
    low:      { label: '低',   dot: '⚪', ring: 'ring-gray-500/30' },
};

const SENTIMENT_COLOR: Record<SentimentDirection, string> = {
    bullish: 'text-green-400',
    bearish: 'text-red-400',
    neutral: 'text-muted',
};

const SENTIMENT_LABEL: Record<SentimentDirection, string> = {
    bullish: '↑看涨',
    bearish: '↓看跌',
    neutral: '→中性',
};

// =========================================================================
// Props
// =========================================================================

interface IntelligenceNewsFeedProps {
    news: MarketNewsItem[];
    selectedTags: Set<string>;
    /** 标签树（用于渲染标签徽章颜色） */
    tagTree: ParentTag[];
}

// =========================================================================
// 辅助函数
// =========================================================================

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    return `${Math.floor(hours / 24)} 天前`;
}

/** 通过子标签 ID 在 tagTree 中找到对应的颜色和label */
function resolveTag(tagId: string, tagTree: ParentTag[]): { label: string; color: string; icon?: string } | null {
    for (const parent of tagTree) {
        for (const child of parent.children) {
            if (child.id === tagId) {
                return { label: child.label, color: parent.color, icon: child.icon };
            }
        }
    }
    return null;
}

// =========================================================================
// 组件
// =========================================================================

const IntelligenceNewsFeed: React.FC<IntelligenceNewsFeedProps> = memo(({
    news,
    selectedTags,
    tagTree,
}) => {
    const filteredNews = useMemo(() => {
        if (selectedTags.size === 0) return news;
        return news.filter(item => {
            const allTags = [item.primaryTag, ...item.secondaryTags];
            return allTags.some(t => selectedTags.has(t));
        });
    }, [news, selectedTags]);

    return (
        <div className="space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700">
            {filteredNews.length === 0 ? (
                <div className="text-center text-secondary text-xs py-12">
                    暂无匹配的情报内容
                </div>
            ) : (
                filteredNews.map(item => {
                    const imp = IMPORTANCE_BADGE[item.importance];
                    const allTags = [item.primaryTag, ...item.secondaryTags];
                    return (
                        <div
                            key={item.id}
                            className={`bg-surface/50 rounded-xl p-3.5 hover:bg-surface/70 transition-colors border border-strong/30 ${
                                item.importance === 'critical' ? 'ring-1 ' + imp.ring : ''
                            }`}
                        >
                            {/* 顶部：标签 + 重要性 + 时间 */}
                            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                                {allTags.map(tagId => {
                                    const resolved = resolveTag(tagId, tagTree);
                                    if (!resolved) return null;
                                    return (
                                        <span
                                            key={tagId}
                                            className={`text-[9px] px-1.5 py-0.5 rounded-md ${resolved.color}`}
                                        >
                                            {resolved.icon && <span className="mr-0.5">{resolved.icon}</span>}
                                            {resolved.label}
                                        </span>
                                    );
                                })}
                                <span className="text-[9px] ml-auto flex items-center gap-0.5 text-dim">
                                    <span>{imp.dot}</span>
                                    <span>{imp.label}</span>
                                </span>
                                <span className="text-[9px] text-secondary">{timeAgo(item.publishedAt)}</span>
                            </div>

                            {/* 标题 */}
                            <h4 className="text-xs font-medium text-primary leading-snug mb-1.5">
                                {item.title}
                            </h4>

                            {/* AI 摘要 */}
                            {(item.aiSummary || item.summary) && (
                                <p className="text-[10px] text-muted leading-relaxed line-clamp-2 mb-2">
                                    {item.aiSummary || item.summary}
                                </p>
                            )}

                            {/* 底部：情绪 + 币种 + 来源 */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[9px] font-medium ${SENTIMENT_COLOR[item.sentiment]}`}>
                                    {SENTIMENT_LABEL[item.sentiment]}
                                </span>
                                {item.affectedSymbols.length > 0 && (
                                    <div className="flex gap-1">
                                        {item.affectedSymbols.slice(0, 4).map(sym => (
                                            <span key={sym} className="text-[9px] px-1 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                                                ${sym}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <span className="text-[9px] text-secondary ml-auto">
                                    {item.source}
                                </span>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
});

IntelligenceNewsFeed.displayName = 'IntelligenceNewsFeed';
export default IntelligenceNewsFeed;
