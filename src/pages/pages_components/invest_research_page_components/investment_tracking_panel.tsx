/**
 * 投资追踪面板（InvestmentTrackingPanel）
 *
 * 投资研究右侧面板 — 三个模块依次排列：
 *  1. 市场叙事词云（NarrativeWordCloud）
 *  2. 已投资项目追踪（代币投资卡片：入场价/现价/PnL）
 *  3. 感兴趣的项目列表 + 关系图谱展开按钮
 */
import React, { useState, useCallback, memo } from 'react';
import type {
    Web3ProjectRecord,
    NarrativeWord,
    RelationshipNode,
    RelationshipEdge,
} from '../../trade_center_pages/type/alpha_module_types';

// =========================================================================
// 常量
// =========================================================================

const TREND_COLORS: Record<NarrativeWord['trend'], string> = {
    rising:  'text-green-400',
    stable:  'text-secondary',
    falling: 'text-red-400',
};

const TREND_BG: Record<NarrativeWord['trend'], string> = {
    rising:  'bg-green-900/300/10 hover:bg-green-900/300/20',
    stable:  'bg-surface0/10 hover:bg-surface0/20',
    falling: 'bg-red-900/300/10 hover:bg-red-900/300/20',
};

const NODE_TYPE_COLORS: Record<string, string> = {
    twitter_account: 'bg-blue-900/300/20 text-blue-400',
    project:         'bg-purple-900/300/20 text-purple-400',
    vc:              'bg-yellow-900/300/20 text-yellow-400',
    person:          'bg-green-900/300/20 text-green-400',
};

const EDGE_TYPE_LABELS: Record<string, string> = {
    invested: '投资', advises: '顾问', mentions: '提及',
    partners: '合作', founded_by: '创建', follows: '关注', custom: '自定义',
};

// =========================================================================
// Props
// =========================================================================

interface InvestmentTrackingPanelProps {
    /** 市场叙事词列表 */
    narrativeWords: NarrativeWord[];
    /** 所有项目（内部按状态过滤） */
    projects: Web3ProjectRecord[];
    /** 点击项目查看详情 */
    onViewDetail: (project: Web3ProjectRecord) => void;
}

// =========================================================================
// 工具函数
// =========================================================================

function formatPnl(entry: number, current: number, amount: number): { pnl: number; pnlPct: number } {
    const pnl = (current - entry) * amount;
    const pnlPct = entry > 0 ? ((current - entry) / entry) * 100 : 0;
    return { pnl, pnlPct };
}

function formatUsd(num: number): string {
    if (Math.abs(num) >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
    if (Math.abs(num) >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
}

/** 根据 weight 映射到字体大小 */
function getWordSize(weight: number): string {
    if (weight >= 90) return 'text-lg font-bold';
    if (weight >= 70) return 'text-base font-semibold';
    if (weight >= 50) return 'text-sm font-medium';
    if (weight >= 30) return 'text-xs';
    return 'text-[10px]';
}

// =========================================================================
// 子组件：市场叙事词云
// =========================================================================

const NarrativeWordCloud: React.FC<{ words: NarrativeWord[] }> = memo(({ words }) => {
    if (words.length === 0) {
        return (
            <div className="text-center py-4 text-muted text-[10px]">暂无叙事数据</div>
        );
    }

    return (
        <div className="flex flex-wrap gap-1.5 items-center justify-center py-2">
            {words
                .sort((a, b) => b.weight - a.weight)
                .map((word) => (
                    <span
                        key={word.text}
                        className={`px-2 py-0.5 rounded-full cursor-default transition-colors ${getWordSize(word.weight)} ${TREND_COLORS[word.trend]} ${TREND_BG[word.trend]}`}
                        title={`权重: ${word.weight} · 趋势: ${word.trend === 'rising' ? '上升' : word.trend === 'falling' ? '下降' : '稳定'}`}
                    >
                        {word.text}
                    </span>
                ))}
        </div>
    );
});
NarrativeWordCloud.displayName = 'NarrativeWordCloud';

// =========================================================================
// 子组件：已投资项目追踪卡片
// =========================================================================

const InvestmentCard: React.FC<{
    project: Web3ProjectRecord;
    onViewDetail: (project: Web3ProjectRecord) => void;
}> = memo(({ project, onViewDetail }) => {
    const latestRecord = project.investmentRecords[project.investmentRecords.length - 1];
    const token = project.token;

    // 计算综合 PnL
    const totalCost = project.investmentRecords.reduce((s, r) => s + r.costUsd, 0);
    const totalAmount = project.investmentRecords.reduce((s, r) => s + r.amount - r.soldAmount, 0);
    const currentPrice = token?.currentPrice ?? 0;
    const currentValue = totalAmount * currentPrice;
    const totalPnl = currentValue - totalCost + project.investmentRecords.reduce((s, r) => s + r.realizedPnl, 0);
    const pnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    return (
        <div
            className="bg-surface/50 rounded-lg p-3 hover:bg-surface/70 transition-colors cursor-pointer border border-strong/30"
            onClick={() => onViewDetail(project)}
        >
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-primary">{project.name}</span>
                    {token && (
                        <span className="text-[10px] text-dim">${token.symbol}</span>
                    )}
                </div>
                <span className={`text-xs font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalPnl >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                    <span className="text-muted block">入场均价</span>
                    <span className="text-secondary">
                        {latestRecord ? `$${latestRecord.entryPrice}` : '—'}
                    </span>
                </div>
                <div>
                    <span className="text-muted block">现价</span>
                    <span className="text-secondary">
                        {currentPrice > 0 ? `$${currentPrice}` : '—'}
                    </span>
                </div>
                <div>
                    <span className="text-muted block">PnL</span>
                    <span className={totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {formatUsd(totalPnl)}
                    </span>
                </div>
            </div>

            {/* 持仓价值 */}
            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-strong/30">
                <span className="text-[10px] text-muted">持仓价值</span>
                <span className="text-[10px] text-primary font-medium">{formatUsd(currentValue)}</span>
            </div>
        </div>
    );
});
InvestmentCard.displayName = 'InvestmentCard';

// =========================================================================
// 子组件：关系图谱展开面板
// =========================================================================

const RelationshipGraphExpand: React.FC<{
    nodes: RelationshipNode[];
    edges: RelationshipEdge[];
}> = memo(({ nodes, edges }) => {
    if (nodes.length === 0) {
        return <div className="text-[10px] text-muted py-2 text-center">暂无关系图谱数据</div>;
    }

    return (
        <div className="mt-2 bg-card/60 rounded-lg p-2.5 border border-strong/20 space-y-1.5">
            {/* 节点 */}
            <div className="flex flex-wrap gap-1">
                {nodes.map((node) => (
                    <span
                        key={node.id}
                        className={`text-[9px] px-1.5 py-0.5 rounded-full ${NODE_TYPE_COLORS[node.type] || 'bg-surface0/20 text-muted'}`}
                    >
                        {node.label}
                    </span>
                ))}
            </div>
            {/* 边 */}
            {edges.length > 0 && (
                <div className="space-y-0.5">
                    {edges.map((edge, idx) => {
                        const fromNode = nodes.find(n => n.id === edge.from);
                        const toNode = nodes.find(n => n.id === edge.to);
                        return (
                            <div key={idx} className="flex items-center gap-1 text-[9px] text-dim">
                                <span className="text-secondary">{fromNode?.label || edge.from}</span>
                                <span className="text-secondary">→</span>
                                <span className="text-muted">{EDGE_TYPE_LABELS[edge.type] || edge.type}</span>
                                <span className="text-secondary">→</span>
                                <span className="text-secondary">{toNode?.label || edge.to}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});
RelationshipGraphExpand.displayName = 'RelationshipGraphExpand';

// =========================================================================
// 子组件：感兴趣项目行（带关系图谱展开）
// =========================================================================

const WatchingProjectRow: React.FC<{
    project: Web3ProjectRecord;
    onViewDetail: (project: Web3ProjectRecord) => void;
}> = memo(({ project, onViewDetail }) => {
    const [graphExpanded, setGraphExpanded] = useState(false);

    const toggleGraph = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setGraphExpanded(prev => !prev);
    }, []);

    const hasGraph = project.relationshipGraph.nodes.length > 0;

    return (
        <div className="border-b border-strong/20 last:border-0">
            <div
                className="flex items-center gap-2 py-2 px-2 hover:bg-card/5 transition-colors cursor-pointer rounded"
                onClick={() => onViewDetail(project)}
            >
                {/* 评分 */}
                <span className={`text-[10px] font-bold w-7 text-center rounded py-0.5 ${
                    project.compositeScore >= 80 ? 'bg-green-400/10 text-green-400' :
                    project.compositeScore >= 60 ? 'bg-blue-400/10 text-blue-400' :
                    project.compositeScore >= 40 ? 'bg-yellow-400/10 text-yellow-400' :
                    'bg-red-400/10 text-red-400'
                }`}>
                    {project.compositeScore}
                </span>

                {/* 项目名 */}
                <span className="text-xs text-primary flex-1 truncate">{project.name}</span>

                {/* 链 */}
                <span className="text-[10px] text-dim">{project.chain}</span>

                {/* 关系图谱展开按钮 */}
                {hasGraph && (
                    <button
                        onClick={toggleGraph}
                        className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                            graphExpanded
                                ? 'bg-blue-900/300/20 text-blue-400'
                                : 'bg-surface-hover/30 text-dim hover:text-secondary'
                        }`}
                        title="展开关系图谱"
                    >
                        {graphExpanded ? '▾ 图谱' : '▸ 图谱'}
                    </button>
                )}
            </div>

            {/* 展开的关系图谱 */}
            {graphExpanded && hasGraph && (
                <RelationshipGraphExpand
                    nodes={project.relationshipGraph.nodes}
                    edges={project.relationshipGraph.edges}
                />
            )}
        </div>
    );
});
WatchingProjectRow.displayName = 'WatchingProjectRow';

// =========================================================================
// 主组件
// =========================================================================

const InvestmentTrackingPanel: React.FC<InvestmentTrackingPanelProps> = memo(({ narrativeWords, projects, onViewDetail }) => {
    const investedProjects = projects.filter(p => p.status === 'INVESTED');
    const watchingProjects = projects.filter(p => p.status === 'WATCHING' || p.status === 'DISCOVERED');

    // 总持仓统计
    const totalPortfolioValue = investedProjects.reduce((sum, p) => {
        const currentPrice = p.token?.currentPrice ?? 0;
        const holdingAmount = p.investmentRecords.reduce((s, r) => s + r.amount - r.soldAmount, 0);
        return sum + holdingAmount * currentPrice;
    }, 0);

    const totalPnl = investedProjects.reduce((sum, p) => {
        const currentPrice = p.token?.currentPrice ?? 0;
        const holdingAmount = p.investmentRecords.reduce((s, r) => s + r.amount - r.soldAmount, 0);
        const totalCost = p.investmentRecords.reduce((s, r) => s + r.costUsd, 0);
        const realizedPnl = p.investmentRecords.reduce((s, r) => s + r.realizedPnl, 0);
        return sum + (holdingAmount * currentPrice - totalCost + realizedPnl);
    }, 0);

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* ── 市场叙事词云 ── */}
            <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-3">
                <h3 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                    <span className="text-[14px]">🔥</span> 市场叙事
                </h3>
                <NarrativeWordCloud words={narrativeWords} />
            </div>

            {/* ── 已投资项目追踪 ── */}
            <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-3">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-primary flex items-center gap-1.5">
                        <span className="text-[14px]">💰</span> 投资追踪
                    </h3>
                    {investedProjects.length > 0 && (
                        <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-dim">总持仓</span>
                            <span className="text-primary font-medium">{formatUsd(totalPortfolioValue)}</span>
                            <span className={totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {totalPnl >= 0 ? '+' : ''}{formatUsd(totalPnl)}
                            </span>
                        </div>
                    )}
                </div>

                {investedProjects.length > 0 ? (
                    <div className="space-y-2">
                        {investedProjects.map(p => (
                            <InvestmentCard key={p.id} project={p} onViewDetail={onViewDetail} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 text-muted text-[10px]">暂无投资</div>
                )}
            </div>

            {/* ── 感兴趣的项目 ── */}
            <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-3 flex-1 min-h-0">
                <h3 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                    <span className="text-[14px]">👀</span> 关注列表
                    <span className="text-[10px] text-dim font-normal ml-1">{watchingProjects.length} 个</span>
                </h3>

                {watchingProjects.length > 0 ? (
                    <div className="overflow-y-auto max-h-[calc(100%-2rem)]">
                        {watchingProjects.map(p => (
                            <WatchingProjectRow key={p.id} project={p} onViewDetail={onViewDetail} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 text-muted text-[10px]">暂无关注项目</div>
                )}
            </div>
        </div>
    );
});
InvestmentTrackingPanel.displayName = 'InvestmentTrackingPanel';

export default InvestmentTrackingPanel;
