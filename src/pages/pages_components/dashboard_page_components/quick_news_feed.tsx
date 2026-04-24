/**
 * 快讯新闻流组件（QuickNewsFeed）
 *
 * Dashboard 核心组件之一，展示最新的市场资讯快讯：
 *
 * ─── 功能 ────────────────────────────────────────────────────────
 *  1. 按时间倒序展示最新快讯
 *  2. 分类标签颜色区分（宏观/市场情绪/项目/技术/资金/机会/热点）
 *  3. 重要性指示器（高重要性高亮展示）
 *  4. 支持展开/收起摘要
 *  5. 自动刷新（可配置间隔）
 *
 * ─── 数据源 ────────────────────────────────────────────────────
 *  - 当前使用 Mock 数据（后端 API 就绪后切换为真实请求）
 *  - 预留 onRefresh 回调供父组件注入数据加载逻辑
 */
import React, { useState, useCallback, useMemo, memo } from 'react';

// =========================================================================
// 类型定义
// =========================================================================

/** 快讯条目 */
export interface NewsItem {
    /** 唯一 ID */
    id: string;
    /** 标题 */
    title: string;
    /** 摘要 */
    summary: string;
    /** 分类 */
    category: string;
    /** 分类中文标签 */
    categoryLabel: string;
    /** 重要性（1~10） */
    importance: number;
    /** 情绪方向 */
    sentiment: 'bullish' | 'bearish' | 'neutral';
    /** 关联交易对 */
    symbols: string[];
    /** 来源 */
    source: string;
    /** 发布时间 */
    publishedAt: string;
}

// =========================================================================
// 分类颜色映射
// =========================================================================

const CATEGORY_COLORS: Record<string, string> = {
    MACRO_POLICY:     'bg-red-900/300/20 text-red-400',
    MARKET_SENTIMENT: 'bg-yellow-900/300/20 text-yellow-400',
    PROJECT:          'bg-blue-900/300/20 text-blue-400',
    DEV_TECH:         'bg-purple-900/300/20 text-purple-400',
    INVESTOR_CAPITAL: 'bg-green-900/300/20 text-green-400',
    OPPORTUNITY:      'bg-cyan-500/20 text-cyan-400',
    MEME_COMMUNITY:   'bg-pink-500/20 text-pink-400',
};

/** 情绪颜色 */
const SENTIMENT_ICONS: Record<string, { icon: string; color: string }> = {
    bullish: { icon: '↑', color: 'text-green-400' },
    bearish: { icon: '↓', color: 'text-red-400' },
    neutral: { icon: '→', color: 'text-muted' },
};

// =========================================================================
// Mock 数据（后端 API 就绪后移除）
// =========================================================================

const MOCK_NEWS: NewsItem[] = [
    {
        id: '1', title: '美联储维持利率不变，暗示年内可能降息', summary: '美联储在最新议息会议上维持基准利率 5.25%-5.50% 不变，但点阵图显示年内可能有两次 25bp 降息。',
        category: 'MACRO_POLICY', categoryLabel: '宏观与政策', importance: 9, sentiment: 'bullish', symbols: ['BTC/USDT', 'ETH/USDT'], source: 'Reuters', publishedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
        id: '2', title: 'Ethereum Pectra 升级将于下月上线主网', summary: 'Pectra 升级预计将大幅提升以太坊 L2 数据可用性，降低 Rollup 成本约 40%。',
        category: 'DEV_TECH', categoryLabel: '开发者与技术', importance: 7, sentiment: 'bullish', symbols: ['ETH/USDT'], source: 'The Block', publishedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    },
    {
        id: '3', title: '某巨鲸地址向交易所转入 5000 BTC', summary: '链上监控显示一笔价值约 3.4 亿美元的 BTC 大额转账，目标地址为 Binance 热钱包。',
        category: 'INVESTOR_CAPITAL', categoryLabel: '投资者与资金', importance: 8, sentiment: 'bearish', symbols: ['BTC/USDT'], source: 'Whale Alert', publishedAt: new Date(Date.now() - 90 * 60000).toISOString(),
    },
    {
        id: '4', title: 'ARB 社区治理提案通过新的空投分配方案', summary: 'Arbitrum DAO 投票通过 ARB 代币的新分配计划，预计 Q3 向活跃用户发放第二轮空投。',
        category: 'OPPORTUNITY', categoryLabel: '机会捕捉', importance: 6, sentiment: 'bullish', symbols: ['ARB/USDT'], source: 'Snapshot', publishedAt: new Date(Date.now() - 120 * 60000).toISOString(),
    },
    {
        id: '5', title: '恐慌贪婪指数回升至 72，市场偏贪婪', summary: '加密市场恐慌贪婪指数从昨日的 65 升至 72，连续 5 日处于贪婪区间。',
        category: 'MARKET_SENTIMENT', categoryLabel: '市场情绪', importance: 5, sentiment: 'neutral', symbols: [], source: 'Alternative.me', publishedAt: new Date(Date.now() - 180 * 60000).toISOString(),
    },
];

// =========================================================================
// 工具函数
// =========================================================================

/** 时间格式化：相对时间 */
function formatRelativeTime(isoStr: string): string {
    const diff = Date.now() - new Date(isoStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    return `${days} 天前`;
}

// =========================================================================
// 单条新闻组件
// =========================================================================

interface NewsRowProps {
    item: NewsItem;
}

const NewsRow: React.FC<NewsRowProps> = memo(({ item }) => {
    const [expanded, setExpanded] = useState(false);
    const sentimentConfig = SENTIMENT_ICONS[item.sentiment] || SENTIMENT_ICONS.neutral;
    const categoryClass = CATEGORY_COLORS[item.category] || 'bg-surface0/20 text-muted';

    const toggleExpand = useCallback(() => setExpanded(prev => !prev), []);

    return (
        <div
            className={`py-3 px-3 hover:bg-card/5 rounded-lg transition-colors cursor-pointer ${
                item.importance >= 8 ? 'border-l-2 border-orange-400/60' : ''
            }`}
            onClick={toggleExpand}
        >
            {/* 第一行：分类标签 + 时间 */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoryClass}`}>
                        {item.categoryLabel}
                    </span>
                    {item.importance >= 8 && (
                        <span className="text-[10px] text-orange-400 font-bold">重要</span>
                    )}
                    <span className={`text-xs ${sentimentConfig.color}`}>
                        {sentimentConfig.icon}
                    </span>
                </div>
                <span className="text-[10px] text-dim flex-shrink-0">
                    {formatRelativeTime(item.publishedAt)}
                </span>
            </div>

            {/* 标题 */}
            <div className="text-sm text-primary font-medium leading-snug mb-1">
                {item.title}
            </div>

            {/* 展开的摘要 */}
            {expanded && (
                <div className="text-xs text-muted leading-relaxed mt-1 mb-1">
                    {item.summary}
                </div>
            )}

            {/* 底部：关联币种 + 来源 */}
            <div className="flex items-center gap-2 mt-1">
                {item.symbols.slice(0, 3).map(sym => (
                    <span key={sym} className="text-[10px] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
                        {sym.replace('/USDT', '')}
                    </span>
                ))}
                <span className="text-[10px] text-muted ml-auto">{item.source}</span>
            </div>
        </div>
    );
});

NewsRow.displayName = 'NewsRow';

// =========================================================================
// 主组件
// =========================================================================

export interface QuickNewsFeedProps {
    /** 新闻数据（不传则使用 Mock 数据） */
    news?: NewsItem[];
    /** 标题 */
    title?: string;
    /** 最大显示条数 */
    maxItems?: number;
    /** 刷新回调 */
    onRefresh?: () => void;
}

const QuickNewsFeed: React.FC<QuickNewsFeedProps> = memo(({
    news = MOCK_NEWS,
    title = '快讯动态',
    maxItems = 5,
    onRefresh,
}) => {
    const displayNews = useMemo(() => news.slice(0, maxItems), [news, maxItems]);

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4">
            {/* 标题栏 */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-primary">{title}</h3>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        刷新
                    </button>
                )}
            </div>

            {/* 新闻列表 */}
            <div className="space-y-1">
                {displayNews.length > 0 ? (
                    displayNews.map(item => (
                        <NewsRow key={item.id} item={item} />
                    ))
                ) : (
                    <div className="text-center py-8 text-dim text-sm">
                        暂无快讯
                    </div>
                )}
            </div>

            {/* 查看更多 */}
            {news.length > maxItems && (
                <div className="mt-2 text-center">
                    <span className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer transition-colors">
                        查看全部 {news.length} 条快讯 →
                    </span>
                </div>
            )}
        </div>
    );
});

QuickNewsFeed.displayName = 'QuickNewsFeed';

export default QuickNewsFeed;
