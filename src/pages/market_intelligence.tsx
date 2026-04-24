
/**
 * 市场情报页面（Market Intelligence Page）
 *
 * 布局：6:4 左右分栏
 *  - 左栏 (60%)：子母标签选择器 + 新闻/情报推送卡片
 *  - 右栏 (40%)：追踪的 Twitter 账号列表 + 关系图谱 + 推文流
 */
import React, { Suspense, useState, useCallback } from 'react';
import type { MarketNewsItem, ParentTag } from './trade_center_pages/type/alpha_module_types';

// =========================================================================
// 懒加载子组件
// =========================================================================

const TagCascadeSelector = React.lazy(() => import('./pages_components/market_intelligence_page_components/tag_cascade_selector'));
const IntelligenceNewsFeed = React.lazy(() => import('./pages_components/market_intelligence_page_components/intelligence_news_feed'));
const TwitterTrackerPanel = React.lazy(() => import('./pages_components/market_intelligence_page_components/twitter_tracker_panel'));

// =========================================================================
// 加载占位
// =========================================================================

function LoadingPanel() {
    return (
        <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

// =========================================================================
// V1 静态标签树（与 TagCascadeSelector 内置数据同步）
// =========================================================================

const TAG_TREE: ParentTag[] = [
    { id: 'macro_environment', label: '宏观环境', description: '', color: 'text-blue-400 bg-blue-400/10', icon: '🌍', weight: 3, enabled: true, sortOrder: 1, children: [
        { id: 'trump', label: '特朗普', keywords: [], enabled: true, sortOrder: 1, icon: '🇺🇸' },
        { id: 'musk', label: '马斯克', keywords: [], enabled: true, sortOrder: 2, icon: '🚀' },
        { id: 'war', label: '战争', keywords: [], enabled: true, sortOrder: 3, icon: '⚔️' },
        { id: 'fed', label: '美联储', keywords: [], enabled: true, sortOrder: 4, icon: '🏛️' },
        { id: 'meeting', label: '会议', keywords: [], enabled: true, sortOrder: 5, icon: '🤝' },
        { id: 'tariff', label: '关税', keywords: [], enabled: true, sortOrder: 6, icon: '📦' },
        { id: 'regulation', label: '市场监管', keywords: [], enabled: true, sortOrder: 7, icon: '⚖️' },
        { id: 'legislation', label: '立法', keywords: [], enabled: true, sortOrder: 8, icon: '📜' },
    ]},
    { id: 'macro_data', label: '宏观数据', description: '', color: 'text-cyan-400 bg-cyan-400/10', icon: '📊', weight: 3, enabled: true, sortOrder: 2, children: [
        { id: 'dxy', label: '美元指数', keywords: [], enabled: true, sortOrder: 1, icon: '💵' },
        { id: 'nasdaq', label: '纳指', keywords: [], enabled: true, sortOrder: 2, icon: '📈' },
        { id: 'treasury', label: '国债', keywords: [], enabled: true, sortOrder: 3, icon: '🏦' },
        { id: 'gold', label: '黄金价格', keywords: [], enabled: true, sortOrder: 4, icon: '🥇' },
        { id: 'oil', label: '原油价格', keywords: [], enabled: true, sortOrder: 5, icon: '🛢️' },
        { id: 'tech_stocks', label: '科技股指数', keywords: [], enabled: true, sortOrder: 6, icon: '💻' },
    ]},
    { id: 'exchange_data', label: '交易所数据', description: '', color: 'text-yellow-400 bg-yellow-400/10', icon: '🏪', weight: 3, enabled: true, sortOrder: 3, children: [
        { id: 'funding_rate', label: '资金费率', keywords: [], enabled: true, sortOrder: 1, icon: '💰' },
        { id: 'open_interest', label: '合约持仓', keywords: [], enabled: true, sortOrder: 2, icon: '📋' },
        { id: 'price_breakout', label: '价格突破', keywords: [], enabled: true, sortOrder: 3, icon: '🔔' },
        { id: 'liquidation', label: '爆仓数据', keywords: [], enabled: true, sortOrder: 4, icon: '💥' },
        { id: 'long_short_ratio', label: 'BTC多空比', keywords: [], enabled: true, sortOrder: 5, icon: '⚖️' },
        { id: 'whale', label: '鲸鱼', keywords: [], enabled: true, sortOrder: 6, icon: '🐋' },
        { id: 'fear_greed', label: '恐惧贪婪指数', keywords: [], enabled: true, sortOrder: 7, icon: '😨' },
    ]},
    { id: 'web3_projects', label: 'Web3项目', description: '', color: 'text-purple-400 bg-purple-400/10', icon: '🔮', weight: 2, enabled: true, sortOrder: 4, children: [
        { id: 'spark', label: 'Spark', keywords: [], enabled: true, sortOrder: 1, icon: '✨' },
    ]},
    { id: 'dev_tech', label: '开发与技术', description: '', color: 'text-green-400 bg-green-400/10', icon: '⚙️', weight: 2, enabled: true, sortOrder: 5, children: [
        { id: 'core_dev', label: '核心开发人员动态', keywords: [], enabled: true, sortOrder: 1, icon: '👨‍💻' },
        { id: 'tech_upgrade', label: '技术更新升级', keywords: [], enabled: true, sortOrder: 2, icon: '🔄' },
    ]},
    { id: 'investment', label: '投资', description: '', color: 'text-orange-400 bg-orange-400/10', icon: '💼', weight: 3, enabled: true, sortOrder: 6, children: [
        { id: 'institutional', label: '机构项目', keywords: [], enabled: true, sortOrder: 1, icon: '🏢' },
        { id: 'btc_opinion', label: 'BTC机构观点', keywords: [], enabled: true, sortOrder: 2, icon: '₿' },
    ]},
    { id: 'entertainment', label: '娱乐热点', description: '', color: 'text-pink-400 bg-pink-400/10', icon: '🎭', weight: 1, enabled: true, sortOrder: 7, children: [
        { id: 'musk_entertainment', label: '马斯克', keywords: [], enabled: true, sortOrder: 1, icon: '🚀' },
        { id: 'hot_person', label: '热点人物', keywords: [], enabled: true, sortOrder: 2, icon: '🌟' },
        { id: 'narrative', label: '市场叙事', keywords: [], enabled: true, sortOrder: 3, icon: '📖' },
        { id: 'meme', label: 'Meme', keywords: [], enabled: true, sortOrder: 4, icon: '🐸' },
        { id: 'community', label: '社区热点', keywords: [], enabled: true, sortOrder: 5, icon: '🔥' },
    ]},
];

// =========================================================================
// Mock 新闻数据（已适配新类型结构）
// =========================================================================

const MOCK_NEWS: MarketNewsItem[] = [
    {
        id: 'n-1', title: '美联储维持利率不变，鲍威尔暗示年内可能降息',
        summary: 'FOMC 会议声明显示通胀持续回落，市场预期 9 月降息概率升至 82%。',
        primaryTag: 'fed', secondaryTags: ['meeting'],
        importance: 'critical', sentiment: 'bullish', sentimentScore: 72,
        affectedSymbols: ['BTC', 'ETH'], source: 'Bloomberg', sourceType: 'RSS',
        publishedAt: '2025-07-10T14:30:00Z',
        aiSummary: '美联储按兵不动但释放鸽派信号，降息预期升温利好加密市场。',
    },
    {
        id: 'n-2', title: 'SEC 批准首批 Solana 现货 ETF 申请',
        summary: '继 BTC/ETH 之后，Solana 成为第三个获得现货 ETF 批准的加密资产。',
        primaryTag: 'institutional', secondaryTags: ['regulation'],
        importance: 'critical', sentiment: 'bullish', sentimentScore: 85,
        affectedSymbols: ['SOL', 'BTC', 'ETH'], source: 'CoinDesk', sourceType: 'RSS',
        publishedAt: '2025-07-10T12:00:00Z',
        aiSummary: 'SOL 现货 ETF 获批，打开山寨币合规化新篇章。',
    },
    {
        id: 'n-3', title: 'Uniswap v4 正式上线，引入 Hook 机制',
        summary: '新版本支持自定义池逻辑，开发者可通过 Hooks 扩展 AMM 功能。',
        primaryTag: 'tech_upgrade', secondaryTags: ['core_dev'],
        importance: 'high', sentiment: 'bullish', sentimentScore: 55,
        affectedSymbols: ['UNI'], source: 'The Block', sourceType: 'RSS',
        publishedAt: '2025-07-10T09:00:00Z',
    },
    {
        id: 'n-4', title: 'Nvidia 宣布与 Render Network 合作进军 DePIN',
        summary: 'GPU 算力去中心化供给方案获得传统巨头背书。',
        primaryTag: 'tech_upgrade', secondaryTags: ['institutional'],
        importance: 'high', sentiment: 'bullish', sentimentScore: 65,
        affectedSymbols: ['RNDR'], source: 'TechCrunch', sourceType: 'RSS',
        publishedAt: '2025-07-09T18:00:00Z',
    },
    {
        id: 'n-5', title: 'BTC 鲸鱼地址 24h 净流入 1.2 万枚',
        summary: '链上数据显示大额持有者持续增持。',
        primaryTag: 'whale', secondaryTags: [],
        importance: 'medium', sentiment: 'bullish', sentimentScore: 50,
        affectedSymbols: ['BTC'], source: 'Whale Alert', sourceType: 'ONCHAIN',
        publishedAt: '2025-07-09T15:00:00Z',
    },
    {
        id: 'n-6', title: 'Arbitrum DAO 通过 2 亿 ARB 生态基金提案',
        summary: '基金将用于资助开发者、流动性激励和跨链桥接建设。',
        primaryTag: 'community', secondaryTags: ['core_dev'],
        importance: 'medium', sentiment: 'neutral', sentimentScore: 15,
        affectedSymbols: ['ARB'], source: 'Decrypt', sourceType: 'RSS',
        publishedAt: '2025-07-09T10:00:00Z',
    },
    {
        id: 'n-7', title: '恐惧贪婪指数升至 72（贪婪区间）',
        summary: '市场情绪转向乐观，短期或有回调风险。',
        primaryTag: 'fear_greed', secondaryTags: [],
        importance: 'low', sentiment: 'neutral', sentimentScore: 0,
        affectedSymbols: [], source: 'Alternative.me', sourceType: 'API',
        publishedAt: '2025-07-08T08:00:00Z',
    },
    {
        id: 'n-8', title: '特朗普称将把美国建成"加密之都"',
        summary: '总统候选人在竞选集会上再次力挺加密货币。',
        primaryTag: 'trump', secondaryTags: ['legislation'],
        importance: 'high', sentiment: 'bullish', sentimentScore: 60,
        affectedSymbols: ['BTC'], source: 'CNBC', sourceType: 'RSS',
        publishedAt: '2025-07-08T06:00:00Z',
        aiSummary: '特朗普力挺加密，政策预期转暖推动 BTC 短期走强。',
    },
];

// =========================================================================
// 主页面组件
// =========================================================================

export default function MarketInfoMonitor() {
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

    const handleSelectedChange = useCallback((tags: Set<string>) => {
        setSelectedTags(tags);
    }, []);

    return (
        <div className="h-full bg-base p-5 flex flex-col">
            {/* 标题 */}
            <div className="mb-4">
                <h1 className="text-lg font-bold text-primary">🌐 市场情报</h1>
                <p className="text-[10px] text-dim mt-0.5">
                    子母标签筛选 · AI 分类 · 推特 KOL 追踪 · 关系图谱
                </p>
            </div>

            {/* 6:4 左右分栏 */}
            <div className="flex-1 grid grid-cols-10 gap-5 min-h-0">
                {/* ── 左栏 60%：标签选择器 + 新闻卡片 ── */}
                <div className="col-span-6 flex flex-col min-h-0">
                    {/* 标签选择器 */}
                    <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-3 mb-4">
                        <Suspense fallback={<LoadingPanel />}>
                            <TagCascadeSelector
                                selectedTags={selectedTags}
                                onSelectedChange={handleSelectedChange}
                            />
                        </Suspense>
                    </div>

                    {/* 新闻/情报流 */}
                    <div className="flex-1 min-h-0">
                        <Suspense fallback={<LoadingPanel />}>
                            <IntelligenceNewsFeed
                                news={MOCK_NEWS}
                                selectedTags={selectedTags}
                                tagTree={TAG_TREE}
                            />
                        </Suspense>
                    </div>
                </div>

                {/* ── 右栏 40%：Twitter 追踪 + 关系图谱 ── */}
                <div className="col-span-4 bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-3 flex flex-col min-h-0">
                    <h3 className="text-sm font-semibold text-primary mb-2">🐦 Twitter 追踪</h3>
                    <div className="flex-1 min-h-0">
                        <Suspense fallback={<LoadingPanel />}>
                            <TwitterTrackerPanel />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}