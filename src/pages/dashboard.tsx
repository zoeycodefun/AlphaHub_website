
/**
 * Dashboard 主页面
 *
 * 系统首页，按当前市场板块展示概览数据：
 *
 * ─── 布局（6:4 左右分栏）────────────────────────────────────────
 *
 *  ┌──────── 顶部横条 ─────────────────────────────────────────┐
 *  │  资金总览 · 总收益 · 待检查信息 · 信号快讯 · 快速入口       │
 *  ├──────────────────────────────────┬────────────────────────┤
 *  │  左栏 (60%)                      │  右栏 (40%)            │
 *  │  ① 主流币实时行情列表             │  今日快讯             │
 *  │  ② 已投资项目跟踪                │  (仅展示最近 24H      │
 *  │  ③ 待办事项(紧急信号/投资建议)    │   重要快讯)           │
 *  └──────────────────────────────────┴────────────────────────┘
 *
 * 标题随市场切换动态变化（来自 useDashboardTitle）
 */
import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardTitle } from '../global_state_store/market_switch_global_state_store';
import CryptoPriceList from './pages_components/dashboard_page_components/crypto_price_list';
import QuickNewsFeed from './pages_components/dashboard_page_components/quick_news_feed';
import TodoList from './pages_components/dashboard_page_components/to_do_list';
import InvestedProjectsTracker from './pages_components/dashboard_page_components/invested_projects_tracker';

// =========================================================================
// 资产概览卡片
// =========================================================================

interface StatCardProps {
    label: string;
    value: string;
    change?: string;
    changeType?: 'up' | 'down' | 'neutral';
    icon: string;
}

const StatCard: React.FC<StatCardProps> = memo(({ label, value, change, changeType = 'neutral', icon }) => {
    const changeColor = changeType === 'up' ? 'text-green-400' : changeType === 'down' ? 'text-red-400' : 'text-muted';
    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4 flex items-start gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
                <div className="text-xs text-dim mb-1">{label}</div>
                <div className="text-lg font-bold text-primary">{value}</div>
                {change && <div className={`text-xs mt-0.5 ${changeColor}`}>{change}</div>}
            </div>
        </div>
    );
});
StatCard.displayName = 'StatCard';

// =========================================================================
// 快速入口
// =========================================================================

interface QuickLinkItem {
    label: string;
    icon: string;
    href: string;
}

const QUICK_LINKS: QuickLinkItem[] = [
    { label: '交易中心', icon: '📈', href: '/trading_center' },
    { label: '策略管理', icon: '🤖', href: '/trading_center/strategy_center' },
    { label: '投资研究', icon: '🔬', href: '/investment_research' },
    { label: '市场监控', icon: '📡', href: '/market_intelligence' },
];

const QuickLinks: React.FC = memo(() => (
    <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4">
        <h3 className="text-base font-semibold text-primary mb-3">快速入口</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUICK_LINKS.map(link => (
                <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center gap-2 py-2.5 px-3 bg-card/5 hover:bg-card/10 rounded-lg transition-colors"
                >
                    <span className="text-lg">{link.icon}</span>
                    <span className="text-sm text-secondary">{link.label}</span>
                </Link>
            ))}
        </div>
    </div>
));
QuickLinks.displayName = 'QuickLinks';

// =========================================================================
// Dashboard 主组件
// =========================================================================

export default function Dashboard() {
    const dashboardTitle = useDashboardTitle();

    // Mock 资产统计（后端 API 就绪后替换）
    const stats = useMemo<StatCardProps[]>(() => [
        { label: '总资产估值', value: '$48,520.34', change: '+2.5% (24h)', changeType: 'up', icon: '💰' },
        { label: '今日盈亏',   value: '+$1,182.50', change: '策略贡献 +$680', changeType: 'up', icon: '📊' },
        { label: '活跃策略',   value: '3 / 8',       change: '1 个待检查',    changeType: 'neutral', icon: '⚡' },
        { label: '信号快讯',   value: '5 买 / 2 卖', change: '看多偏强',      changeType: 'up', icon: '🎯' },
    ], []);

    return (
        <div className="min-h-screen p-4 lg:p-6">
            {/* ─── 页面标题（跟随市场切换） ───────────────────────── */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-primary">{dashboardTitle}</h1>
                <p className="text-sm text-dim mt-1">系统总览 · 实时数据整合</p>
            </div>

            {/* ─── 顶部概览卡片 + 快速入口 ────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {stats.map(stat => <StatCard key={stat.label} {...stat} />)}
            </div>
            <div className="mb-6">
                <QuickLinks />
            </div>

            {/* ─── 主体内容：左右 6:4 分栏 ────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* 左栏（3/5 ≈ 60%） */}
                <div className="lg:col-span-3 space-y-4">
                    {/* ① 主流币实时行情 */}
                    <CryptoPriceList title="主流币实时行情" maxItems={10} />

                    {/* ② 已投资项目跟踪 */}
                    <InvestedProjectsTracker />

                    {/* ③ 待办事项（紧急信号 + 投资建议） */}
                    <TodoList title="待办与紧急通知" maxItems={5} />
                </div>

                {/* 右栏（2/5 ≈ 40%） */}
                <div className="lg:col-span-2 space-y-4">
                    {/* 今日快讯（最近 24H 重要新闻） */}
                    <QuickNewsFeed
                        title="今日市场快讯"
                        maxItems={10}
                    />
                </div>
            </div>
        </div>
    );
}