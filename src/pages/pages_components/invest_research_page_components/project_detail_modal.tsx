/**
 * 项目详情弹窗（ProjectDetailModal）
 *
 * 展示 Web3 项目的完整信息，包含：
 *  - 项目概览、代币详情、合约地址
 *  - 社区链接
 *  - 关系图谱（手动存储数据）
 *  - 风险评估（honeypot/合约审计/LP锁定/持有者分布/风险提示）
 *  - 综合评分（代码质量/团队背景/资金积累/社区活跃度/VC 加权）
 *  - 链上数据
 *  - 投资记录
 */
import React, { useState, memo } from 'react';
import type {
    Web3ProjectRecord,
    RelationshipNode,
    RelationshipEdge,
} from '../../trade_center_pages/type/alpha_module_types';

// =========================================================================
// 常量
// =========================================================================

const RISK_COLORS = {
    safe: 'text-green-400 bg-green-400/10',
    warning: 'text-yellow-400 bg-yellow-400/10',
    danger: 'text-red-400 bg-red-400/10',
    unknown: 'text-muted bg-gray-400/10',
    audited: 'text-green-400 bg-green-400/10',
    partial: 'text-yellow-400 bg-yellow-400/10',
    unaudited: 'text-red-400 bg-red-400/10',
};

const RISK_LABELS: Record<string, string> = {
    safe: '安全', warning: '警告', danger: '危险', unknown: '未知',
    audited: '已审计', partial: '部分审计', unaudited: '未审计',
};

const SCORE_LABELS: Record<string, string> = {
    codeQuality: '代码质量', teamBackground: '团队背景',
    funding: '资金积累', communityActivity: '社区活跃度', vcScore: 'VC 评分',
};

const NODE_TYPE_COLORS: Record<string, string> = {
    twitter_account: 'bg-blue-900/300/20 text-blue-400',
    project: 'bg-purple-900/300/20 text-purple-400',
    vc: 'bg-yellow-900/300/20 text-yellow-400',
    person: 'bg-green-900/300/20 text-green-400',
};

const EDGE_TYPE_LABELS: Record<string, string> = {
    invested: '投资', advises: '顾问', mentions: '提及',
    partners: '合作', founded_by: '创建', follows: '关注', custom: '自定义',
};

// =========================================================================
// Props
// =========================================================================

interface ProjectDetailModalProps {
    project: Web3ProjectRecord;
    onClose: () => void;
}

// =========================================================================
// 子组件
// =========================================================================

/** 评分雷达图（简化条形图实现） */
const ScoreChart: React.FC<{ dimensions: Web3ProjectRecord['scoreDimensions']; compositeScore: number }> = memo(({ dimensions, compositeScore }) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted">综合评分</span>
            <span className={`text-lg font-bold ${
                compositeScore >= 80 ? 'text-green-400' :
                compositeScore >= 60 ? 'text-blue-400' :
                compositeScore >= 40 ? 'text-yellow-400' : 'text-red-400'
            }`}>{compositeScore}</span>
        </div>
        {Object.entries(dimensions).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-dim w-16 shrink-0">{SCORE_LABELS[key] || key}</span>
                <div className="flex-1 bg-surface-hover/30 rounded-full h-1.5">
                    <div
                        className={`h-full rounded-full transition-all ${
                            value >= 80 ? 'bg-green-400' :
                            value >= 60 ? 'bg-blue-400' :
                            value >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${value}%` }}
                    />
                </div>
                <span className="text-[10px] text-muted w-6 text-right">{value}</span>
            </div>
        ))}
    </div>
));
ScoreChart.displayName = 'ScoreChart';

/** 关系图谱面板（列表展示，后续可升级 D3 力导向图） */
const RelationshipGraphPanel: React.FC<{
    nodes: RelationshipNode[];
    edges: RelationshipEdge[];
}> = memo(({ nodes, edges }) => {
    if (nodes.length === 0) {
        return <div className="text-[10px] text-muted py-4 text-center">暂无关系图谱数据（手动维护中）</div>;
    }

    return (
        <div className="space-y-2">
            {/* 节点 */}
            <div className="flex flex-wrap gap-1.5">
                {nodes.map(node => (
                    <span
                        key={node.id}
                        className={`text-[10px] px-2 py-0.5 rounded-full ${NODE_TYPE_COLORS[node.type] || 'bg-surface0/20 text-muted'}`}
                    >
                        {node.label}
                    </span>
                ))}
            </div>
            {/* 边 */}
            {edges.length > 0 && (
                <div className="space-y-1 mt-2">
                    {edges.map((edge, idx) => {
                        const fromNode = nodes.find(n => n.id === edge.from);
                        const toNode = nodes.find(n => n.id === edge.to);
                        return (
                            <div key={idx} className="flex items-center gap-1.5 text-[10px] text-dim">
                                <span className="text-secondary">{fromNode?.label || edge.from}</span>
                                <span className="text-muted">→</span>
                                <span className={`px-1 py-0.5 rounded ${
                                    edge.type === 'invested' ? 'bg-yellow-900/300/20 text-yellow-400' :
                                    edge.type === 'partners' ? 'bg-green-900/300/20 text-green-400' :
                                    'bg-surface0/20 text-muted'
                                }`}>
                                    {EDGE_TYPE_LABELS[edge.type] || edge.type}
                                </span>
                                <span className="text-secondary">{toNode?.label || edge.to}</span>
                                <span className="text-secondary ml-auto">强度: {edge.strength}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});
RelationshipGraphPanel.displayName = 'RelationshipGraphPanel';

// =========================================================================
// 主组件
// =========================================================================

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = memo(({ project, onClose }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'risk' | 'graph' | 'onchain' | 'invest'>('overview');
    const risk = project.riskAssessment;

    const tabs = [
        { key: 'overview' as const, label: '项目概览' },
        { key: 'risk' as const,     label: '风险评估' },
        { key: 'graph' as const,    label: '关系图谱' },
        { key: 'onchain' as const,  label: '链上数据' },
        { key: 'invest' as const,   label: '投资记录' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-[90vw] max-w-3xl max-h-[85vh] bg-card border border-strong/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-strong/50 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                            {project.name}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                project.status === 'INVESTED' ? 'bg-green-900/300/20 text-green-400' :
                                project.status === 'WATCHING' ? 'bg-blue-900/300/20 text-blue-400' :
                                'bg-yellow-900/300/20 text-yellow-400'
                            }`}>
                                {project.status}
                            </span>
                        </h2>
                        <p className="text-[11px] text-dim mt-0.5">
                            {project.chain.toUpperCase()} · 发现于 {new Date(project.discoveredAt).toLocaleDateString('zh-CN')}
                            {project.discoverySource !== 'manual' && ` · 来源: ${project.discoverySource}`}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-dim hover:text-primary text-xl leading-none">✕</button>
                </div>

                {/* Tabs */}
                <div className="px-5 py-2 border-b border-strong/30 flex gap-4 shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`text-xs pb-1 transition-colors ${
                                activeTab === tab.key
                                    ? 'text-blue-400 border-b-2 border-blue-400 font-medium'
                                    : 'text-dim hover:text-secondary'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {/* ── 项目概览 ── */}
                    {activeTab === 'overview' && (
                        <div className="space-y-5">
                            {/* 项目概览 */}
                            <div>
                                <h3 className="text-xs font-semibold text-muted mb-2">项目概览</h3>
                                <p className="text-xs text-secondary leading-relaxed">{project.overview || '暂无概览'}</p>
                            </div>

                            {/* 评分 */}
                            <div>
                                <h3 className="text-xs font-semibold text-muted mb-2">综合评分</h3>
                                <ScoreChart dimensions={project.scoreDimensions} compositeScore={project.compositeScore} />
                            </div>

                            {/* 代币详情 */}
                            {project.token && (
                                <div>
                                    <h3 className="text-xs font-semibold text-muted mb-2">代币详情</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <InfoRow label="代币" value={`$${project.token.symbol}`} />
                                        <InfoRow label="合约地址" value={project.token.contractAddress} truncate />
                                        <InfoRow label="初始价格" value={project.token.initialPrice ? `$${project.token.initialPrice}` : '—'} />
                                        <InfoRow label="当前价格" value={project.token.currentPrice ? `$${project.token.currentPrice}` : '—'} />
                                        <InfoRow label="市值" value={project.token.marketCap ? `$${formatNumber(project.token.marketCap)}` : '—'} />
                                        <InfoRow label="总供应" value={project.token.totalSupply || '—'} />
                                    </div>
                                </div>
                            )}

                            {/* 社区 */}
                            <div>
                                <h3 className="text-xs font-semibold text-muted mb-2">社区</h3>
                                <div className="flex flex-wrap gap-2">
                                    {project.communityLinks.website && <LinkBadge icon="🌐" label="Website" href={project.communityLinks.website} />}
                                    {project.communityLinks.twitter && <LinkBadge icon="𝕏" label="Twitter" href={project.communityLinks.twitter} />}
                                    {project.communityLinks.discord && <LinkBadge icon="💬" label="Discord" href={project.communityLinks.discord} />}
                                    {project.communityLinks.telegram && <LinkBadge icon="✈️" label="Telegram" href={project.communityLinks.telegram} />}
                                    {project.communityLinks.github && <LinkBadge icon="⚡" label="GitHub" href={project.communityLinks.github} />}
                                    {project.communityLinks.docs && <LinkBadge icon="📄" label="Docs" href={project.communityLinks.docs} />}
                                </div>
                            </div>

                            {/* VC */}
                            {project.vcBackers.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-muted mb-2">VC 背书</h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {project.vcBackers.map(vc => (
                                            <span key={vc} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/300/20 text-purple-400">
                                                {vc}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── 风险评估 ── */}
                    {activeTab === 'risk' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <RiskCard label="Honeypot 检测" value={RISK_LABELS[risk.honeypotCheck] || risk.honeypotCheck} colorClass={RISK_COLORS[risk.honeypotCheck] || ''} />
                                <RiskCard label="合约审计" value={RISK_LABELS[risk.contractAudit] || risk.contractAudit} colorClass={RISK_COLORS[risk.contractAudit] || ''} />
                                <RiskCard label="LP 锁定" value={risk.lpLocked ? `✅ ${risk.lpLockDuration || '已锁定'}` : '❌ 未锁定'} colorClass={risk.lpLocked ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'} />
                                <RiskCard label="合约验证" value={risk.contractVerified ? '✅ 已验证' : '❌ 未验证'} colorClass={risk.contractVerified ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'} />
                            </div>

                            {risk.top10HoldersPct !== null && (
                                <div className="bg-surface/60 rounded-lg p-3">
                                    <span className="text-[10px] text-dim">前 10 地址持有比例</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 bg-surface-hover/30 rounded-full h-2">
                                            <div
                                                className={`h-full rounded-full ${risk.top10HoldersPct > 80 ? 'bg-red-400' : risk.top10HoldersPct > 50 ? 'bg-yellow-400' : 'bg-green-400'}`}
                                                style={{ width: `${Math.min(100, risk.top10HoldersPct)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-primary font-mono">{risk.top10HoldersPct}%</span>
                                    </div>
                                </div>
                            )}

                            {risk.riskWarnings.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-red-400 mb-2">⚠️ 风险提示</h3>
                                    <div className="space-y-1">
                                        {risk.riskWarnings.map((w, i) => (
                                            <div key={i} className="text-[10px] text-red-300 bg-red-900/300/10 rounded px-2 py-1">
                                                {w}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── 关系图谱 ── */}
                    {activeTab === 'graph' && (
                        <div>
                            <p className="text-[10px] text-muted mb-3">数据由手动维护，后续可接入 AI 自动发现</p>
                            <RelationshipGraphPanel
                                nodes={project.relationshipGraph.nodes}
                                edges={project.relationshipGraph.edges}
                            />
                        </div>
                    )}

                    {/* ── 链上数据 ── */}
                    {activeTab === 'onchain' && (
                        <div>
                            {project.onchainData ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <InfoRow label="日活地址" value={project.onchainData.dailyActiveAddresses?.toLocaleString() || '—'} />
                                    <InfoRow label="24h 交易笔数" value={project.onchainData.transactions24h?.toLocaleString() || '—'} />
                                    <InfoRow label="TVL" value={project.onchainData.tvl ? `$${formatNumber(project.onchainData.tvl)}` : '—'} />
                                    <InfoRow label="24h 交易量" value={project.onchainData.volume24h ? `$${formatNumber(project.onchainData.volume24h)}` : '—'} />
                                    <InfoRow label="持有者数量" value={project.onchainData.holdersCount?.toLocaleString() || '—'} />
                                    <InfoRow label="快照时间" value={new Date(project.onchainData.snapshotAt).toLocaleString('zh-CN')} />
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted text-xs">暂无链上数据快照</div>
                            )}
                        </div>
                    )}

                    {/* ── 投资记录 ── */}
                    {activeTab === 'invest' && (
                        <div>
                            {project.investmentRecords.length > 0 ? (
                                <div className="space-y-2">
                                    {project.investmentRecords.map((record, idx) => (
                                        <div key={idx} className="bg-surface/60 rounded-lg p-3 text-xs">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-muted">
                                                    {new Date(record.entryDate).toLocaleDateString('zh-CN')}
                                                </span>
                                                <span className={record.realizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                    PnL: {record.realizedPnl >= 0 ? '+' : ''}{record.realizedPnl.toFixed(2)} USDT
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-[10px] text-dim">
                                                <span>入场价: ${record.entryPrice}</span>
                                                <span>数量: {record.amount}</span>
                                                <span>花费: ${record.costUsd}</span>
                                            </div>
                                            {record.note && (
                                                <p className="text-[10px] text-muted mt-1">{record.note}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted text-xs">暂无投资记录</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
ProjectDetailModal.displayName = 'ProjectDetailModal';

// =========================================================================
// 辅助组件
// =========================================================================

const InfoRow: React.FC<{ label: string; value: string; truncate?: boolean }> = ({ label, value, truncate }) => (
    <div className="bg-surface/40 rounded px-2.5 py-1.5">
        <span className="text-[10px] text-dim block">{label}</span>
        <span className={`text-xs text-primary ${truncate ? 'truncate block' : ''}`}>{value}</span>
    </div>
);

const LinkBadge: React.FC<{ icon: string; label: string; href: string }> = ({ icon, label, href }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] px-2 py-1 rounded bg-surface-hover/50 text-secondary hover:bg-surface-hover hover:text-primary transition-colors flex items-center gap-1"
    >
        {icon} {label}
    </a>
);

const RiskCard: React.FC<{ label: string; value: string; colorClass: string }> = ({ label, value, colorClass }) => (
    <div className={`rounded-lg p-3 ${colorClass || 'bg-gray-400/10 text-muted'}`}>
        <span className="text-[10px] opacity-70 block mb-0.5">{label}</span>
        <span className="text-xs font-semibold">{value}</span>
    </div>
);

function formatNumber(num: number): string {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toFixed(2);
}

export default ProjectDetailModal;
