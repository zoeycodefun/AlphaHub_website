/**
 * 项目列表面板（ProjectListPanel）
 *
 * 投资研究左侧面板 — 展示已挖掘的 Web3 项目列表：
 *
 * ─── 功能 ────────────────────────────────────────────────────────
 *  - 筛选行：综合评分 ≥ N、状态（已投资/观察中/全部）、搜索
 *  - 列表：项目名、评分、链、发现时间、VC、详情按钮、操作按钮
 */
import React, { useState, useCallback, useMemo, memo } from 'react';
import type { Web3ProjectRecord, ProjectStatus } from '../../trade_center_pages/type/alpha_module_types';

// =========================================================================
// 常量
// =========================================================================

const STATUS_OPTIONS: { key: ProjectStatus | 'ALL'; label: string; color: string }[] = [
    { key: 'ALL',        label: '全部',   color: 'bg-gray-600/30 text-secondary' },
    { key: 'INVESTED',   label: '已投资', color: 'bg-green-900/300/20 text-green-400' },
    { key: 'WATCHING',   label: '观察中', color: 'bg-blue-900/300/20 text-blue-400' },
    { key: 'DISCOVERED', label: '新发现', color: 'bg-yellow-900/300/20 text-yellow-400' },
    { key: 'EXITED',     label: '已退出', color: 'bg-surface0/20 text-muted' },
];

const SCORE_THRESHOLDS = [0, 40, 60, 70, 80];

const CHAIN_ICONS: Record<string, string> = {
    ethereum: '⟠', solana: '◎', base: '🔵', arbitrum: '🔷', optimism: '🔴',
    polygon: '🟣', bsc: '🟡', avalanche: '🔺', sei: '🌊', fuel: '⛽',
    sui: '💧', aptos: '🅰️', near: '🌐', ton: '💎', other: '⬡',
};

// =========================================================================
// 工具函数
// =========================================================================

function formatTimeAgo(isoStr: string): string {
    const d = new Date(isoStr);
    const now = Date.now();
    const diff = now - d.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}h前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
}

function getScoreBg(score: number): string {
    if (score >= 80) return 'bg-green-400/10';
    if (score >= 60) return 'bg-blue-400/10';
    if (score >= 40) return 'bg-yellow-400/10';
    return 'bg-red-400/10';
}

// =========================================================================
// Props
// =========================================================================

interface ProjectListPanelProps {
    projects: Web3ProjectRecord[];
    onViewDetail: (project: Web3ProjectRecord) => void;
    onStatusChange?: (projectId: string, action: 'watch' | 'invest' | 'archive') => void;
}

// =========================================================================
// 组件
// =========================================================================

const ProjectListPanel: React.FC<ProjectListPanelProps> = memo(({ projects, onViewDetail, onStatusChange }) => {
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');
    const [minScore, setMinScore] = useState(0);
    const [searchKeyword, setSearchKeyword] = useState('');

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
            if (p.compositeScore < minScore) return false;
            if (searchKeyword) {
                const kw = searchKeyword.toLowerCase();
                return p.name.toLowerCase().includes(kw) ||
                       p.tags.some(t => t.toLowerCase().includes(kw)) ||
                       p.vcBackers.some(v => v.toLowerCase().includes(kw)) ||
                       p.chain.toLowerCase().includes(kw);
            }
            return true;
        }).sort((a, b) => b.compositeScore - a.compositeScore);
    }, [projects, statusFilter, minScore, searchKeyword]);

    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchKeyword(e.target.value);
    }, []);

    return (
        <div className="flex flex-col h-full">
            {/* 筛选行 */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
                {/* 状态筛选 */}
                {STATUS_OPTIONS.map(opt => (
                    <button
                        key={opt.key}
                        onClick={() => setStatusFilter(opt.key)}
                        className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                            statusFilter === opt.key
                                ? opt.color + ' font-semibold ring-1 ring-white/10'
                                : 'bg-surface-hover/30 text-dim hover:bg-surface-hover/50'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* 评分门槛 + 搜索 */}
            <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-dim">评分≥</span>
                    <select
                        value={minScore}
                        onChange={e => setMinScore(Number(e.target.value))}
                        className="text-[11px] bg-surface/60 border border-strong/50 rounded px-1.5 py-0.5 text-primary focus:outline-none focus:border-blue-500/50"
                    >
                        {SCORE_THRESHOLDS.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
                <input
                    type="text"
                    value={searchKeyword}
                    onChange={handleSearch}
                    placeholder="搜索项目/VC/链..."
                    className="flex-1 text-[11px] bg-surface/60 border border-strong/50 rounded-lg px-3 py-1.5 text-primary placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                />
                <span className="text-[10px] text-muted">{filteredProjects.length} 个项目</span>
            </div>

            {/* 列表表头 */}
            <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-[10px] text-dim font-medium border-b border-strong/30">
                <span className="col-span-3">项目</span>
                <span className="col-span-1 text-center">评分</span>
                <span className="col-span-1 text-center">链</span>
                <span className="col-span-2 text-center">发现时间</span>
                <span className="col-span-2">VC</span>
                <span className="col-span-3 text-right">操作</span>
            </div>

            {/* 项目列表 */}
            <div className="flex-1 overflow-y-auto space-y-0.5 mt-1">
                {filteredProjects.length > 0 ? (
                    filteredProjects.map(project => (
                        <div
                            key={project.id}
                            className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg hover:bg-card/5 transition-colors group cursor-pointer"
                            onClick={() => onViewDetail(project)}
                        >
                            {/* 项目名 + 状态 + 标签 */}
                            <div className="col-span-3 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-primary truncate">
                                        {project.name}
                                    </span>
                                    <span className={`text-[8px] px-1 py-0.5 rounded ${
                                        project.status === 'INVESTED' ? 'bg-green-900/300/20 text-green-400' :
                                        project.status === 'WATCHING' ? 'bg-blue-900/300/20 text-blue-400' :
                                        project.status === 'EXITED'   ? 'bg-surface0/20 text-muted' :
                                        'bg-yellow-900/300/20 text-yellow-400'
                                    }`}>
                                        {project.status === 'INVESTED' ? '已投' :
                                         project.status === 'WATCHING' ? '观察' :
                                         project.status === 'EXITED'   ? '退出' : '新'}
                                    </span>
                                </div>
                                {project.token && (
                                    <span className="text-[10px] text-dim">${project.token.symbol}</span>
                                )}
                            </div>

                            {/* 评分 */}
                            <div className="col-span-1 text-center">
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${getScoreColor(project.compositeScore)} ${getScoreBg(project.compositeScore)}`}>
                                    {project.compositeScore}
                                </span>
                            </div>

                            {/* 链 */}
                            <div className="col-span-1 text-center">
                                <span className="text-xs" title={project.chain}>
                                    {CHAIN_ICONS[project.chain] || '⬡'}
                                </span>
                            </div>

                            {/* 发现时间 */}
                            <div className="col-span-2 text-center text-[10px] text-dim">
                                {formatTimeAgo(project.discoveredAt)}
                            </div>

                            {/* VC */}
                            <div className="col-span-2 min-w-0">
                                {project.vcBackers.length > 0 ? (
                                    <span className="text-[10px] text-purple-400 truncate block">
                                        {project.vcBackers[0]}
                                        {project.vcBackers.length > 1 && ` +${project.vcBackers.length - 1}`}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-muted">—</span>
                                )}
                            </div>

                            {/* 操作 */}
                            <div className="col-span-3 flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onViewDetail(project); }}
                                    className="text-[10px] px-2 py-0.5 rounded bg-blue-900/300/20 text-blue-400 hover:bg-blue-900/300/30 transition-colors"
                                >
                                    详情
                                </button>
                                {project.status === 'DISCOVERED' && onStatusChange && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onStatusChange(project.id, 'watch'); }}
                                        className="text-[10px] px-2 py-0.5 rounded bg-yellow-900/300/20 text-yellow-400 hover:bg-yellow-900/300/30 transition-colors"
                                    >
                                        观察
                                    </button>
                                )}
                                {project.status === 'WATCHING' && onStatusChange && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onStatusChange(project.id, 'invest'); }}
                                        className="text-[10px] px-2 py-0.5 rounded bg-green-900/300/20 text-green-400 hover:bg-green-900/300/30 transition-colors"
                                    >
                                        投资
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-muted text-xs">
                        {searchKeyword ? `未找到与 "${searchKeyword}" 相关的项目` : '暂无匹配项目'}
                    </div>
                )}
            </div>
        </div>
    );
});
ProjectListPanel.displayName = 'ProjectListPanel';

export default ProjectListPanel;
