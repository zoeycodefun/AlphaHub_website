/**
 * 已投资项目追踪组件（InvestedProjectsTracker）
 *
 * 展示用户已投资的项目代币实时状态：
 *
 *   1. 项目名称 + 代币符号
 *   2. 当前价格 + 24H 涨跌
 *   3. 持仓成本 / 当前市值 / 未实现盈亏
 *   4. 状态标签（持有中 / 止盈中 / 预警）
 *
 * 数据来源：
 *   - 投资研究模块的持仓记录（Mock → API）
 *   - WebSocket Ticker 实时价格
 */
import React, { memo, useMemo } from 'react';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';

// =========================================================================
// 类型
// =========================================================================

export interface InvestedProject {
    id: string;
    name: string;
    symbol: string;
    /** 买入均价 */
    avgCost: number;
    /** 持仓数量 */
    holdingAmount: number;
    /** 当前价格 */
    currentPrice: number;
    /** 24H 涨跌幅 (%) */
    change24h: number;
    /** 状态 */
    status: 'holding' | 'take_profit' | 'warning' | 'stoploss';
    /** 投研评级 */
    researchRating?: 'strong_buy' | 'buy' | 'hold' | 'sell';
    /** 关联投研报告 ID（跳转用） */
    researchReportId?: string;
}

// =========================================================================
// 状态 / 评级颜色
// =========================================================================

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
    holding:     { label: '持有中', className: 'bg-blue-900/300/20 text-blue-400' },
    take_profit: { label: '止盈中', className: 'bg-green-900/300/20 text-green-400' },
    warning:     { label: '预警',   className: 'bg-yellow-900/300/20 text-yellow-400' },
    stoploss:    { label: '止损',   className: 'bg-red-900/300/20 text-red-400' },
};

const RATING_STYLES: Record<string, { label: string; className: string }> = {
    strong_buy: { label: '强烈买入', className: 'text-green-400' },
    buy:        { label: '买入',     className: 'text-green-300' },
    hold:       { label: '持有',     className: 'text-yellow-400' },
    sell:       { label: '卖出',     className: 'text-red-400' },
};

// =========================================================================
// Mock 数据（后续接入投研模块 API）
// =========================================================================

const MOCK_PROJECTS: InvestedProject[] = [
    { id: 'p1', name: 'Ethereum', symbol: 'ETH/USDT', avgCost: 2800, holdingAmount: 3.5, currentPrice: 3420, change24h: 2.8, status: 'holding', researchRating: 'strong_buy' },
    { id: 'p2', name: 'Solana', symbol: 'SOL/USDT', avgCost: 145, holdingAmount: 50, currentPrice: 182, change24h: -1.2, status: 'take_profit', researchRating: 'buy' },
    { id: 'p3', name: 'Arbitrum', symbol: 'ARB/USDT', avgCost: 1.35, holdingAmount: 5000, currentPrice: 1.12, change24h: -3.5, status: 'warning', researchRating: 'hold' },
    { id: 'p4', name: 'Chainlink', symbol: 'LINK/USDT', avgCost: 14.2, holdingAmount: 200, currentPrice: 16.8, change24h: 4.1, status: 'holding', researchRating: 'buy' },
];

// =========================================================================
// 工具函数
// =========================================================================

function formatUsd(value: number): string {
    if (Math.abs(value) >= 1000) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${value.toFixed(2)}`;
}

function formatPnl(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${formatUsd(value)}`;
}

// =========================================================================
// 单行组件
// =========================================================================

const ProjectRow: React.FC<{ project: InvestedProject }> = memo(({ project }) => {
    const pnl = (project.currentPrice - project.avgCost) * project.holdingAmount;
    const pnlPercent = ((project.currentPrice - project.avgCost) / project.avgCost) * 100;
    const statusConfig = STATUS_STYLES[project.status] ?? STATUS_STYLES.holding;
    const ratingConfig = project.researchRating ? RATING_STYLES[project.researchRating] : undefined;
    const isPositive = pnl >= 0;

    return (
        <div className="flex items-center justify-between py-2.5 px-3 hover:bg-card/5 rounded-lg transition-colors group">
            {/* 左侧：名称 + 状态 */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-card/10 flex items-center justify-center text-sm font-bold text-blue-400 flex-shrink-0">
                    {project.symbol.split('/')[0].charAt(0)}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary truncate">{project.symbol.split('/')[0]}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusConfig.className}`}>
                            {statusConfig.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-dim">{project.name}</span>
                        {ratingConfig && (
                            <span className={`text-[10px] ${ratingConfig.className}`}>
                                {ratingConfig.label}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* 中间：价格 + 涨跌 */}
            <div className="text-right mx-4 flex-shrink-0">
                <div className="text-sm font-mono text-primary">{formatUsd(project.currentPrice)}</div>
                <div className={`text-xs font-mono flex items-center justify-end gap-0.5 ${project.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {project.change24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {project.change24h >= 0 ? '+' : ''}{project.change24h.toFixed(2)}%
                </div>
            </div>

            {/* 右侧：盈亏 */}
            <div className="text-right flex-shrink-0 min-w-[90px]">
                <div className={`text-sm font-mono font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPnl(pnl)}
                </div>
                <div className={`text-[10px] font-mono ${isPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
                    {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
                </div>
            </div>
        </div>
    );
});

ProjectRow.displayName = 'ProjectRow';

// =========================================================================
// 主组件
// =========================================================================

export interface InvestedProjectsTrackerProps {
    projects?: InvestedProject[];
    title?: string;
    maxItems?: number;
}

const InvestedProjectsTracker: React.FC<InvestedProjectsTrackerProps> = memo(({
    projects = MOCK_PROJECTS,
    title = '已投资项目跟踪',
    maxItems = 6,
}) => {
    const displayProjects = useMemo(() => projects.slice(0, maxItems), [projects, maxItems]);

    const totalPnl = useMemo(
        () => displayProjects.reduce((sum, p) => sum + (p.currentPrice - p.avgCost) * p.holdingAmount, 0),
        [displayProjects],
    );

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4">
            {/* 标题 */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-primary">{title}</h3>
                    <span className="text-xs text-dim">共 {projects.length} 个项目</span>
                </div>
                <div className={`text-sm font-mono font-medium ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    总盈亏 {formatPnl(totalPnl)}
                </div>
            </div>

            {/* 表头 */}
            <div className="flex items-center justify-between px-3 pb-2 text-[10px] text-dim border-b border-strong/30">
                <span>项目</span>
                <div className="flex gap-8">
                    <span>价格 / 24H</span>
                    <span>未实现盈亏</span>
                </div>
            </div>

            {/* 列表 */}
            <div className="divide-y divide-strong/20">
                {displayProjects.length > 0 ? (
                    displayProjects.map(p => <ProjectRow key={p.id} project={p} />)
                ) : (
                    <div className="text-center py-8 text-dim text-sm">
                        暂无投资项目
                    </div>
                )}
            </div>

            {/* 查看更多 */}
            {projects.length > maxItems && (
                <div className="mt-2 text-center">
                    <a href="/investment_research" className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer transition-colors inline-flex items-center gap-1">
                        查看全部 {projects.length} 个项目 <ExternalLink size={10} />
                    </a>
                </div>
            )}
        </div>
    );
});

InvestedProjectsTracker.displayName = 'InvestedProjectsTracker';

export default InvestedProjectsTracker;
