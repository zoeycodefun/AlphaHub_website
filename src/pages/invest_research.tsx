
/**
 * 投资研究页面（InvestResearch）
 *
 * Web3 项目发现与投资追踪主页面：
 *
 * ─── 布局（50:50 左右分栏）─────────────────────────────────────
 *  ┌──────────────────────┬──────────────────────────┐
 *  │  项目列表            │  市场叙事词云            │
 *  │  ┌─筛选行──────────┐ │  ──────────────          │
 *  │  │状态/评分/搜索   │ │  已投资项目追踪          │
 *  │  ├─────────────────┤ │  （代币卡片：PnL）       │
 *  │  │ 项目表格列表    │ │  ──────────────          │
 *  │  │ + 详情弹窗      │ │  关注项目列表            │
 *  │  └─────────────────┘ │  （+ 关系图谱展开）       │
 *  └──────────────────────┴──────────────────────────┘
 *
 * ─── 数据源 ────────────────────────────────────────────────────
 *  - 当前使用 Mock 数据（后端 API 就绪后替换）
 */
import React, { useState, useCallback, useMemo } from 'react';
import type { Web3ProjectRecord, NarrativeWord } from './trade_center_pages/type/alpha_module_types';
import ProjectListPanel from './pages_components/invest_research_page_components/project_list_panel';
import ProjectDetailModal from './pages_components/invest_research_page_components/project_detail_modal';
import InvestmentTrackingPanel from './pages_components/invest_research_page_components/investment_tracking_panel';

// =========================================================================
// Mock 数据
// =========================================================================

const MOCK_NARRATIVE_WORDS: NarrativeWord[] = [
    { text: 'RWA', weight: 95, trend: 'rising' },
    { text: 'AI Agent', weight: 90, trend: 'rising' },
    { text: 'Restaking', weight: 82, trend: 'stable' },
    { text: 'DePIN', weight: 78, trend: 'rising' },
    { text: 'Modular', weight: 70, trend: 'stable' },
    { text: 'ZK', weight: 68, trend: 'falling' },
    { text: 'SocialFi', weight: 55, trend: 'rising' },
    { text: 'LSD', weight: 50, trend: 'falling' },
    { text: 'Meme', weight: 88, trend: 'rising' },
    { text: 'BTC L2', weight: 65, trend: 'stable' },
    { text: 'Intent', weight: 45, trend: 'falling' },
    { text: 'Parallel EVM', weight: 60, trend: 'rising' },
    { text: 'PayFi', weight: 72, trend: 'rising' },
    { text: 'DA', weight: 40, trend: 'stable' },
];

const now = Date.now();
const MOCK_PROJECTS: Web3ProjectRecord[] = [
    {
        id: 'p1',
        name: 'EigenLayer',
        overview: 'Ethereum restaking 协议，允许 ETH 质押者重新抵押资产以保护其他协议，释放 ETH 的经济安全性。TVL 已超 $15B。',
        chain: 'ethereum',
        status: 'INVESTED',
        token: { symbol: 'EIGEN', contractAddress: '0x...eigen', decimals: 18, totalSupply: '1,673,646,668', circulatingSupply: '200,000,000', initialPrice: 3.5, currentPrice: 4.82, marketCap: 964000000 },
        communityLinks: { website: 'https://eigenlayer.xyz', twitter: 'https://twitter.com/eigenlayer', discord: 'https://discord.gg/eigenlayer', github: 'https://github.com/Layr-Labs', docs: 'https://docs.eigenlayer.xyz' },
        discoverySource: 'vc_portfolio_monitor',
        vcBackers: ['a16z', 'Polychain Capital', 'Blockchain Capital'],
        tags: ['Restaking', 'Infrastructure', 'DeFi'],
        scoreDimensions: { codeQuality: 88, teamBackground: 92, funding: 95, communityActivity: 85, vcScore: 98 },
        compositeScore: 91,
        riskAssessment: { honeypotCheck: 'safe', contractAudit: 'audited', lpLocked: true, lpLockDuration: '12 months', top10HoldersPct: 45, contractVerified: true, riskWarnings: [] },
        relationshipGraph: {
            nodes: [
                { id: 'n1', type: 'twitter_account', label: '@eigenlayer' },
                { id: 'n2', type: 'person', label: 'Sreeram Kannan' },
                { id: 'n3', type: 'vc', label: 'a16z' },
                { id: 'n4', type: 'project', label: 'EtherFi' },
                { id: 'n5', type: 'project', label: 'Renzo Protocol' },
            ],
            edges: [
                { from: 'n2', to: 'n1', type: 'founded_by', strength: 10 },
                { from: 'n3', to: 'n1', type: 'invested', label: 'Series B', strength: 9 },
                { from: 'n4', to: 'n1', type: 'partners', label: 'LRT', strength: 8 },
                { from: 'n5', to: 'n1', type: 'partners', label: 'LRT', strength: 7 },
            ],
            updatedAt: new Date(now - 3 * 86400000).toISOString(),
        },
        investmentRecords: [
            { entryDate: new Date(now - 30 * 86400000).toISOString(), entryPrice: 3.5, amount: 5000, costUsd: 17500, soldAmount: 0, exitPrice: null, realizedPnl: 0, note: '首次建仓' },
        ],
        onchainData: { dailyActiveAddresses: 12500, transactions24h: 45000, tvl: 15200000000, volume24h: 280000000, holdersCount: 185000, snapshotAt: new Date(now - 3600000).toISOString() },
        discoveredAt: new Date(now - 60 * 86400000).toISOString(),
        createdAt: new Date(now - 60 * 86400000).toISOString(),
        updatedAt: new Date(now - 86400000).toISOString(),
    },
    {
        id: 'p2',
        name: 'Monad',
        overview: '并行 EVM L1 区块链，目标 10,000 TPS，由 Jump Trading 前高管创立。采用乐观并行执行和 MonadDB 自定义状态存储。',
        chain: 'other',
        status: 'WATCHING',
        token: null,
        communityLinks: { website: 'https://monad.xyz', twitter: 'https://twitter.com/moaborz', discord: 'https://discord.gg/monad', github: 'https://github.com/monad-labs' },
        discoverySource: 'github_dev_monitor',
        vcBackers: ['Paradigm', 'Dragonfly', 'Electric Capital'],
        tags: ['Parallel EVM', 'L1', 'Infrastructure'],
        scoreDimensions: { codeQuality: 82, teamBackground: 95, funding: 90, communityActivity: 78, vcScore: 92 },
        compositeScore: 87,
        riskAssessment: { honeypotCheck: 'unknown', contractAudit: 'unknown', lpLocked: false, top10HoldersPct: null, contractVerified: false, riskWarnings: ['代币尚未发行', '合约未公开'] },
        relationshipGraph: {
            nodes: [
                { id: 'n1', type: 'twitter_account', label: '@moaborz' },
                { id: 'n2', type: 'person', label: 'Keone Hon' },
                { id: 'n3', type: 'vc', label: 'Paradigm' },
                { id: 'n4', type: 'project', label: 'Jump Trading' },
            ],
            edges: [
                { from: 'n2', to: 'n1', type: 'founded_by', strength: 10 },
                { from: 'n3', to: 'n1', type: 'invested', label: '$225M', strength: 10 },
                { from: 'n2', to: 'n4', type: 'advises', label: '前任', strength: 6 },
            ],
            updatedAt: new Date(now - 7 * 86400000).toISOString(),
        },
        investmentRecords: [],
        onchainData: null,
        discoveredAt: new Date(now - 45 * 86400000).toISOString(),
        createdAt: new Date(now - 45 * 86400000).toISOString(),
        updatedAt: new Date(now - 2 * 86400000).toISOString(),
    },
    {
        id: 'p3',
        name: 'Pendle Finance',
        overview: '收益代币化协议，允许用户分离和交易未来收益。在 LSD/LRT 叙事驱动下 TVL 突破 $6B。',
        chain: 'ethereum',
        status: 'INVESTED',
        token: { symbol: 'PENDLE', contractAddress: '0x808...pendle', decimals: 18, totalSupply: '258,446,028', circulatingSupply: '153,000,000', initialPrice: 1.2, currentPrice: 4.35, marketCap: 665000000 },
        communityLinks: { website: 'https://pendle.finance', twitter: 'https://twitter.com/penaborz', discord: 'https://discord.gg/pendle', docs: 'https://docs.pendle.finance' },
        discoverySource: 'dexscreener_new_pools',
        vcBackers: ['Binance Labs', 'Spartan Group', 'HashKey Capital'],
        tags: ['DeFi', 'Yield', 'LSD'],
        scoreDimensions: { codeQuality: 85, teamBackground: 75, funding: 72, communityActivity: 88, vcScore: 78 },
        compositeScore: 80,
        riskAssessment: { honeypotCheck: 'safe', contractAudit: 'audited', lpLocked: true, lpLockDuration: '6 months', top10HoldersPct: 38, contractVerified: true, riskWarnings: [] },
        relationshipGraph: {
            nodes: [
                { id: 'n1', type: 'twitter_account', label: '@penaborz' },
                { id: 'n2', type: 'vc', label: 'Binance Labs' },
            ],
            edges: [
                { from: 'n2', to: 'n1', type: 'invested', strength: 8 },
            ],
            updatedAt: new Date(now - 5 * 86400000).toISOString(),
        },
        investmentRecords: [
            { entryDate: new Date(now - 90 * 86400000).toISOString(), entryPrice: 1.2, amount: 8000, costUsd: 9600, soldAmount: 2000, exitPrice: 3.8, realizedPnl: 5200, note: '部分止盈' },
        ],
        onchainData: { dailyActiveAddresses: 8200, transactions24h: 32000, tvl: 6100000000, volume24h: 150000000, holdersCount: 95000, snapshotAt: new Date(now - 7200000).toISOString() },
        discoveredAt: new Date(now - 120 * 86400000).toISOString(),
        createdAt: new Date(now - 120 * 86400000).toISOString(),
        updatedAt: new Date(now - 86400000).toISOString(),
    },
    {
        id: 'p4',
        name: 'Story Protocol',
        overview: '可编程 IP 基础设施，将知识产权（IP）带入区块链，支持 IP 注册、许可和版税分配。获 a16z 领投。',
        chain: 'ethereum',
        status: 'WATCHING',
        token: null,
        communityLinks: { website: 'https://storyprotocol.xyz', twitter: 'https://twitter.com/storyprotocol', github: 'https://github.com/storyprotocol' },
        discoverySource: 'vc_portfolio_monitor',
        vcBackers: ['a16z', 'Hashed', 'Samsung Next'],
        tags: ['IP', 'Infrastructure', 'RWA'],
        scoreDimensions: { codeQuality: 75, teamBackground: 88, funding: 85, communityActivity: 65, vcScore: 95 },
        compositeScore: 81,
        riskAssessment: { honeypotCheck: 'unknown', contractAudit: 'partial', lpLocked: false, top10HoldersPct: null, contractVerified: false, riskWarnings: ['代币尚未发行'] },
        relationshipGraph: {
            nodes: [
                { id: 'n1', type: 'twitter_account', label: '@storyprotocol' },
                { id: 'n2', type: 'vc', label: 'a16z' },
            ],
            edges: [
                { from: 'n2', to: 'n1', type: 'invested', label: 'Series B $80M', strength: 9 },
            ],
            updatedAt: new Date(now - 10 * 86400000).toISOString(),
        },
        investmentRecords: [],
        onchainData: null,
        discoveredAt: new Date(now - 20 * 86400000).toISOString(),
        createdAt: new Date(now - 20 * 86400000).toISOString(),
        updatedAt: new Date(now - 3 * 86400000).toISOString(),
    },
    {
        id: 'p5',
        name: 'Grass',
        overview: '去中心化 AI 数据网络，用户通过售卖闲置带宽获得收益，为 AI 训练提供分布式数据采集基础设施。',
        chain: 'solana',
        status: 'DISCOVERED',
        token: { symbol: 'GRASS', contractAddress: 'Grass...sol', decimals: 9, totalSupply: '1,000,000,000', circulatingSupply: '250,000,000', initialPrice: 0.8, currentPrice: 2.15, marketCap: 537500000 },
        communityLinks: { website: 'https://getgrass.io', twitter: 'https://twitter.com/getgrass_io', discord: 'https://discord.gg/grass' },
        discoverySource: 'anomaly_multi_auth',
        vcBackers: ['Polychain Capital', 'Tribe Capital'],
        tags: ['AI', 'DePIN', 'Data'],
        scoreDimensions: { codeQuality: 55, teamBackground: 68, funding: 72, communityActivity: 90, vcScore: 65 },
        compositeScore: 70,
        riskAssessment: { honeypotCheck: 'safe', contractAudit: 'partial', lpLocked: true, lpLockDuration: '3 months', top10HoldersPct: 62, contractVerified: true, riskWarnings: ['前 10 地址持仓集中度偏高'] },
        relationshipGraph: { nodes: [], edges: [], updatedAt: new Date(now - 15 * 86400000).toISOString() },
        investmentRecords: [],
        onchainData: { dailyActiveAddresses: 45000, transactions24h: 120000, tvl: null, volume24h: 85000000, holdersCount: 320000, snapshotAt: new Date(now - 3600000).toISOString() },
        discoveredAt: new Date(now - 5 * 86400000).toISOString(),
        createdAt: new Date(now - 5 * 86400000).toISOString(),
        updatedAt: new Date(now - 86400000).toISOString(),
    },
    {
        id: 'p6',
        name: 'Hyperlane',
        overview: '模块化跨链消息传输协议，支持任意链间互操作，开发者可自定义安全模型。',
        chain: 'ethereum',
        status: 'DISCOVERED',
        token: null,
        communityLinks: { website: 'https://hyperlane.xyz', twitter: 'https://twitter.com/hypaborz', github: 'https://github.com/hyperlane-xyz' },
        discoverySource: 'github_ecosystem_devs',
        vcBackers: ['Framework Ventures', 'Variant', 'Coinbase Ventures'],
        tags: ['Interoperability', 'Infrastructure', 'Modular'],
        scoreDimensions: { codeQuality: 80, teamBackground: 78, funding: 70, communityActivity: 55, vcScore: 75 },
        compositeScore: 72,
        riskAssessment: { honeypotCheck: 'unknown', contractAudit: 'audited', lpLocked: false, top10HoldersPct: null, contractVerified: true, riskWarnings: ['代币尚未发行', '同赛道竞品较多'] },
        relationshipGraph: { nodes: [], edges: [], updatedAt: new Date(now - 20 * 86400000).toISOString() },
        investmentRecords: [],
        onchainData: null,
        discoveredAt: new Date(now - 8 * 86400000).toISOString(),
        createdAt: new Date(now - 8 * 86400000).toISOString(),
        updatedAt: new Date(now - 4 * 86400000).toISOString(),
    },
];

// =========================================================================
// 主页面
// =========================================================================

export default function InvestResearch() {
    const [detailProject, setDetailProject] = useState<Web3ProjectRecord | null>(null);

    const handleViewDetail = useCallback((project: Web3ProjectRecord) => {
        setDetailProject(project);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setDetailProject(null);
    }, []);

    const handleStatusChange = useCallback((_projectId: string, _action: 'watch' | 'invest' | 'archive') => {
        // TODO: 接入后端 API
    }, []);

    // Mock 叙事词云数据
    const narrativeWords = useMemo(() => MOCK_NARRATIVE_WORDS, []);

    return (
        <div className="min-h-screen p-4 lg:p-6">
            {/* 页面标题 */}
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-primary">投资研究</h1>
                <p className="text-sm text-dim mt-1">项目发现 · 投资追踪 · 关系图谱</p>
            </div>

            {/* 50:50 双栏布局 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 140px)' }}>
                {/* 左栏：项目列表 */}
                <div className="bg-surface/40 backdrop-blur-sm rounded-xl border border-strong/50 p-4 overflow-hidden">
                    <ProjectListPanel
                        projects={MOCK_PROJECTS}
                        onViewDetail={handleViewDetail}
                        onStatusChange={handleStatusChange}
                    />
                </div>

                {/* 右栏：词云 + 投资追踪 + 关注列表 */}
                <div className="overflow-y-auto">
                    <InvestmentTrackingPanel
                        narrativeWords={narrativeWords}
                        projects={MOCK_PROJECTS}
                        onViewDetail={handleViewDetail}
                    />
                </div>
            </div>

            {/* 项目详情弹窗 */}
            {detailProject && (
                <ProjectDetailModal
                    project={detailProject}
                    onClose={handleCloseDetail}
                />
            )}
        </div>
    );
}