/**
 * 新币狙击监控页面（New Token Sniper Monitor Page）
 *
 * 功能概览：
 *  1. 后端实时监控新代币部署 / DEX 新池子
 *  2. 链上合约安全性分析 + 风险评估
 *  3. 加权综合评分（安全/持有者/流动性/热度/团队）
 *  4. 卡片式推送展示（含狙击评估详情）
 *  5. 多维筛选（链/热度/来源/风险等级）
 *  6. 预警配置弹窗
 */
import React, { Suspense, useState, useMemo } from 'react';
import type { NewCoinRecord, CoinHeatLevel, NewCoinSource, TokenRiskLevel } from './type/alpha_module_types';

// =========================================================================
// 懒加载子组件
// =========================================================================

const NewCoinCard = React.lazy(() => import('./trade_center_pages_components/new_coins_page_components/new_coin_card'));
const NewCoinFilterBar = React.lazy(() => import('./trade_center_pages_components/new_coins_page_components/new_coin_filter_bar'));
const NewCoinAlertConfig = React.lazy(() => import('./trade_center_pages_components/new_coins_page_components/new_coin_alert_config'));
const NewCoinPushWindow = React.lazy(() => import('./trade_center_pages_components/new_token_sniping_page_components/new_coin_push_window'));

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
// Mock 数据（含完整狙击风险评估）
// =========================================================================

const now = Date.now();

const MOCK_COINS: NewCoinRecord[] = [
    {
        id: 'nc-1', symbol: 'VIRTUAL', name: 'Virtual Protocol', chain: 'Base',
        source: 'dexscreener', heatLevel: 'hot',
        contractAddress: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
        deployTime: new Date(now - 6 * 3600_000).toISOString(),
        currentPrice: 0.089, initialPrice: 0.012, marketCap: 8900000, liquidity: 2500000, volume24h: 5600000,
        totalScore: 82, safetyScore: 78, safetyStatus: '合约安全', holderScore: 72, holderStatus: '分布合理',
        liquidityScore: 85, liquidityStatus: '流动性充足', socialScore: 88,
        contractCheck: 'safe', contractCheckDetail: '通过全部检测',
        top10Percentage: 28, lpLockStatus: 'locked', lpLockDays: 180, smartMoneyCount: 5, txCount: 12500,
        vcKolRecommended: true, whaleEntry: true, hasGithub: true, hasTwitter: true, hasAudit: true,
        twitterMentions: 4820, holders: 18500,
        recommendation: '综合评分优秀，合约安全且流动性充足。聪明钱已入场，建议小仓位试探。',
        riskLevel: 'low',
        dexscreenerLink: 'https://dexscreener.com/base/virtual',
        contractLink: 'https://basescan.org/address/0x1a2b',
        telegramLink: 'https://t.me/virtualprotocol',
        website: 'https://virtual.example.com',
        discoveredAt: new Date(now - 6 * 3600_000).toISOString(),
    },
    {
        id: 'nc-2', symbol: 'GRASS', name: 'Grass Network', chain: 'Solana',
        source: 'birdeye', heatLevel: 'hot',
        contractAddress: 'GrAsS1111111111111111111111111111111111111',
        deployTime: new Date(now - 18 * 3600_000).toISOString(),
        currentPrice: 2.45, initialPrice: 0.85, marketCap: 245000000, liquidity: 12000000, volume24h: 12000000,
        totalScore: 75, safetyScore: 72, safetyStatus: '基本安全', holderScore: 65, holderStatus: '集中度偏高',
        liquidityScore: 80, liquidityStatus: '流动性良好', socialScore: 82,
        contractCheck: 'safe', top10Percentage: 35, lpLockStatus: 'locked', lpLockDays: 365, smartMoneyCount: 8, txCount: 45000,
        vcKolRecommended: true, hasTwitter: true, hasGithub: true,
        twitterMentions: 3200, holders: 42000,
        recommendation: '知名项目，流动性充足但 Top10 占比略高。适合中期持有。',
        riskLevel: 'low',
        dexscreenerLink: 'https://dexscreener.com/solana/grass',
        discoveredAt: new Date(now - 18 * 3600_000).toISOString(),
    },
    {
        id: 'nc-3', symbol: 'AERO', name: 'Aerodrome Finance', chain: 'Base',
        source: 'onchain', heatLevel: 'warm',
        contractAddress: '0xaero1234567890abcdef1234567890abcdef1234',
        deployTime: new Date(now - 48 * 3600_000).toISOString(),
        currentPrice: 0.72, initialPrice: 0.55, marketCap: 72000000, liquidity: 5800000, volume24h: 2300000,
        totalScore: 68, safetyScore: 70, safetyStatus: '正常', holderScore: 62, holderStatus: '集中度中等',
        liquidityScore: 72, liquidityStatus: '适中', socialScore: 55,
        contractCheck: 'safe', top10Percentage: 42, lpLockStatus: 'partial', lpLockDays: 90, smartMoneyCount: 2, txCount: 8500,
        hasTwitter: true,
        twitterMentions: 890, holders: 8500,
        recommendation: 'DeFi 项目基本面尚可。LP 仅部分锁定，注意流动性风险。',
        riskLevel: 'medium',
        dexscreenerLink: 'https://dexscreener.com/base/aero',
        contractLink: 'https://basescan.org/address/0xaero',
        discoveredAt: new Date(now - 48 * 3600_000).toISOString(),
    },
    {
        id: 'nc-4', symbol: 'RNDR2', name: 'Render V2 Token', chain: 'Ethereum',
        source: 'cex_listing', heatLevel: 'warm',
        contractAddress: '0xrndr222222222222222222222222222222222222',
        deployTime: new Date(now - 72 * 3600_000).toISOString(),
        currentPrice: 4.15, initialPrice: 3.20, marketCap: 415000000, liquidity: 25000000, volume24h: 8900000,
        totalScore: 76, safetyScore: 85, safetyStatus: '经过审计', holderScore: 70, holderStatus: '分布健康',
        liquidityScore: 82, liquidityStatus: '深度优秀', socialScore: 68,
        contractCheck: 'safe', contractCheckDetail: 'CertiK 审计通过',
        top10Percentage: 22, lpLockStatus: 'locked', lpLockDays: 730, smartMoneyCount: 12, txCount: 95000,
        vcKolRecommended: true, whaleEntry: true, hasGithub: true, hasTwitter: true, hasAudit: true,
        twitterMentions: 1560, holders: 22000,
        recommendation: 'CEX 上币项目，已通过审计，老牌团队。风险较低，适合配置。',
        riskLevel: 'low',
        discoveredAt: new Date(now - 72 * 3600_000).toISOString(),
    },
    {
        id: 'nc-5', symbol: 'NAVI', name: 'NAVI Protocol', chain: 'Solana',
        source: 'twitter', heatLevel: 'cold',
        contractAddress: 'NAvi1111111111111111111111111111111111111',
        deployTime: new Date(now - 96 * 3600_000).toISOString(),
        currentPrice: 0.038, initialPrice: 0.045, marketCap: 3800000, liquidity: 280000, volume24h: 340000,
        totalScore: 42, safetyScore: 55, safetyStatus: '存在风险', holderScore: 38, holderStatus: '高度集中',
        liquidityScore: 35, liquidityStatus: '流动性不足', socialScore: 48,
        contractCheck: 'warning', contractCheckDetail: '部分函数未开源',
        top10Percentage: 68, lpLockStatus: 'unlocked', lpLockDays: null, smartMoneyCount: 0, txCount: 1200,
        twitterMentions: 210, holders: 1200,
        recommendation: 'Top10 占比过高，LP 未锁定，存在 Rug Pull 风险。不建议参与。',
        riskLevel: 'high',
        discoveredAt: new Date(now - 96 * 3600_000).toISOString(),
    },
    {
        id: 'nc-6', symbol: 'ZETA', name: 'ZetaChain Token', chain: 'BSC',
        source: 'cex_listing', heatLevel: 'warm',
        contractAddress: '0xzeta333333333333333333333333333333333333',
        deployTime: new Date(now - 120 * 3600_000).toISOString(),
        currentPrice: 0.92, initialPrice: 0.65, marketCap: 92000000, liquidity: 8500000, volume24h: 1800000,
        totalScore: 71, safetyScore: 75, safetyStatus: '通过检测', holderScore: 68, holderStatus: '分布正常',
        liquidityScore: 70, liquidityStatus: '适中', socialScore: 62,
        contractCheck: 'safe', top10Percentage: 30, lpLockStatus: 'locked', lpLockDays: 180, smartMoneyCount: 3, txCount: 28000,
        hasGithub: true, hasTwitter: true,
        twitterMentions: 760, holders: 5600,
        recommendation: '跨链基础设施项目，基本面尚可。建议关注链上活跃度变化。',
        riskLevel: 'medium',
        discoveredAt: new Date(now - 120 * 3600_000).toISOString(),
    },
    {
        id: 'nc-7', symbol: 'KMNO', name: 'Kamino Finance', chain: 'Solana',
        source: 'birdeye', heatLevel: 'hot',
        contractAddress: 'KMno1111111111111111111111111111111111111',
        deployTime: new Date(now - 8 * 3600_000).toISOString(),
        currentPrice: 0.31, initialPrice: 0.12, marketCap: 31000000, liquidity: 4200000, volume24h: 4200000,
        totalScore: 78, safetyScore: 80, safetyStatus: '合约安全', holderScore: 72, holderStatus: '分布良好',
        liquidityScore: 76, liquidityStatus: '充足', socialScore: 80,
        contractCheck: 'safe', top10Percentage: 25, lpLockStatus: 'locked', lpLockDays: 365, smartMoneyCount: 6, txCount: 15000,
        vcKolRecommended: true, whaleEntry: true, hasTwitter: true,
        twitterMentions: 2100, holders: 15000,
        recommendation: 'Solana DeFi 新星，聪明钱密集入场。短期动能强劲，可适量参与。',
        riskLevel: 'low',
        dexscreenerLink: 'https://dexscreener.com/solana/kmno',
        telegramLink: 'https://t.me/kaminofinance',
        discoveredAt: new Date(now - 8 * 3600_000).toISOString(),
    },
    {
        id: 'nc-8', symbol: 'FOXY', name: 'Foxy Meme', chain: 'Arbitrum',
        source: 'dexscreener', heatLevel: 'cold',
        contractAddress: '0xfoxy444444444444444444444444444444444444',
        deployTime: new Date(now - 144 * 3600_000).toISOString(),
        currentPrice: 0.00015, initialPrice: 0.00023, marketCap: 150000, liquidity: 18000, volume24h: 56000,
        totalScore: 22, safetyScore: 30, safetyStatus: '高风险', holderScore: 20, holderStatus: '极度集中',
        liquidityScore: 15, liquidityStatus: '极低', socialScore: 28,
        contractCheck: 'danger', contractCheckDetail: '疑似 Honeypot',
        top10Percentage: 85, lpLockStatus: 'unlocked', lpLockDays: null, smartMoneyCount: 0, txCount: 680,
        twitterMentions: 95, holders: 680,
        recommendation: '⚠️ 极高风险！疑似 Honeypot，Top10 持仓 85%，LP 未锁定。强烈不建议参与。',
        riskLevel: 'extreme',
        discoveredAt: new Date(now - 144 * 3600_000).toISOString(),
    },
];

// =========================================================================
// 主页面组件
// =========================================================================

export default function NewCoinsMonitorPage() {
    // 筛选状态
    const [keyword, setKeyword] = useState('');
    const [chainFilter, setChainFilter] = useState('all');
    const [heatFilter, setHeatFilter] = useState<CoinHeatLevel | 'all'>('all');
    const [sourceFilter, setSourceFilter] = useState<NewCoinSource | 'all'>('all');
    const [showAlertConfig, setShowAlertConfig] = useState(false);

    // 推送通知状态
    const [pushCoin, setPushCoin] = useState<NewCoinRecord | null>(null);
    const [showPush, setShowPush] = useState(false);

    // 筛选逻辑
    const filteredCoins = useMemo(() => {
        let data: NewCoinRecord[] = MOCK_COINS;
        if (chainFilter !== 'all') {
            data = data.filter((c) => c.chain === chainFilter);
        }
        if (heatFilter !== 'all') {
            data = data.filter((c) => c.heatLevel === heatFilter);
        }
        if (sourceFilter !== 'all') {
            data = data.filter((c) => c.source === sourceFilter);
        }
        if (keyword.trim()) {
            const kw = keyword.trim().toUpperCase();
            data = data.filter(
                (c) => c.symbol.toUpperCase().includes(kw) || (c.name?.toUpperCase().includes(kw)),
            );
        }
        return data;
    }, [keyword, chainFilter, heatFilter, sourceFilter]);

    // 统计（含风险分布）
    const stats = useMemo(() => ({
        total: MOCK_COINS.length,
        hot: MOCK_COINS.filter((c) => c.heatLevel === 'hot').length,
        highRisk: MOCK_COINS.filter((c) => c.riskLevel === 'high' || c.riskLevel === 'extreme').length,
        today: MOCK_COINS.filter((c) => {
            const diff = Date.now() - new Date(c.discoveredAt ?? '').getTime();
            return diff < 86400000;
        }).length,
    }), []);

    // 模拟推送：点击卡片触发
    const handleCardClick = (coin: NewCoinRecord) => {
        setPushCoin(coin);
        setShowPush(true);
    };

    return (
        <div className="min-h-screen bg-base p-6 space-y-6">
            {/* ===== 标题栏 ===== */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-primary">🎯 新币狙击</h1>
                    <p className="text-xs text-dim mt-1">
                        实时监控 + 风险评估 · 共 {stats.total} 个 · 今日 {stats.today} · 热门 {stats.hot} · 高风险 {stats.highRisk}
                    </p>
                </div>
                <button
                    onClick={() => setShowAlertConfig(true)}
                    className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-500 transition-colors whitespace-nowrap"
                >
                    🔔 配置预警
                </button>
            </div>

            {/* ===== 筛选栏 ===== */}
            <Suspense fallback={<LoadingPanel />}>
                <NewCoinFilterBar
                    keyword={keyword}
                    onKeywordChange={setKeyword}
                    selectedChain={chainFilter}
                    onChainChange={setChainFilter}
                    selectedHeat={heatFilter}
                    onHeatChange={setHeatFilter}
                    selectedSource={sourceFilter}
                    onSourceChange={setSourceFilter}
                />
            </Suspense>

            {/* ===== 新币卡片网格 ===== */}
            <Suspense fallback={<LoadingPanel />}>
                {filteredCoins.length === 0 ? (
                    <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-8 text-center text-dim text-sm">
                        暂无匹配的新币
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {filteredCoins.map((coin) => (
                            <div key={coin.id} onClick={() => handleCardClick(coin)} className="cursor-pointer">
                                <NewCoinCard coin={coin} />
                            </div>
                        ))}
                    </div>
                )}
            </Suspense>

            {/* ===== 预警配置弹窗 ===== */}
            <Suspense fallback={null}>
                <NewCoinAlertConfig
                    visible={showAlertConfig}
                    onClose={() => setShowAlertConfig(false)}
                    onSave={(config) => {
                        console.log('[新币预警] 配置已保存:', config);
                    }}
                />
            </Suspense>

            {/* ===== 新币推送通知（右下角） ===== */}
            {pushCoin && (
                <Suspense fallback={null}>
                    <NewCoinPushWindow
                        coin={pushCoin}
                        visible={showPush}
                        onClose={() => setShowPush(false)}
                        onViewDetail={() => {
                            setShowPush(false);
                            console.log('[新币推送] 查看详情:', pushCoin.symbol);
                        }}
                    />
                </Suspense>
            )}
        </div>
    );
}