/**
 * 新币狙击卡片（New Token Sniper Card）
 *
 * 展示单个新发现代币的完整风险评估信息：
 *  - 基础信息（合约、部署时间、价格、市值、流动性）
 *  - 综合评分（安全性/持有者/流动性/热度 四维雷达）
 *  - 关键指标（合约检测、Top10占比、LP锁定、聪明钱、交易数）
 *  - 加分项标签（VC/KOL、巨鲸、GitHub、审计…）
 *  - 操作建议 + 风险等级
 *  - 快速链接（Dexscreener/合约/Telegram）
 */
import React, { memo, useState, useCallback } from 'react';
import type { NewCoinRecord, CoinHeatLevel, TokenRiskLevel, ContractCheckStatus } from '../../../type/alpha_module_types';

// =========================================================================
// 常量配置
// =========================================================================

const HEAT_CONFIG: Record<CoinHeatLevel, { label: string; color: string; bg: string }> = {
    hot:  { label: '🔥 热门', color: 'text-red-400',    bg: 'bg-red-400/10' },
    warm: { label: '🌡️ 温热', color: 'text-orange-400', bg: 'bg-orange-400/10' },
    cold: { label: '❄️ 冷门', color: 'text-blue-400',   bg: 'bg-blue-400/10' },
};

const RISK_CONFIG: Record<TokenRiskLevel, { label: string; color: string; bg: string }> = {
    low:     { label: '低风险',   color: 'text-green-400',  bg: 'bg-green-500/10' },
    medium:  { label: '中等风险', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    high:    { label: '高风险',   color: 'text-orange-400', bg: 'bg-orange-500/10' },
    extreme: { label: '极高风险', color: 'text-red-400',    bg: 'bg-red-500/10' },
};

const CHECK_CONFIG: Record<ContractCheckStatus, { icon: string; color: string }> = {
    safe:    { icon: '✅', color: 'text-green-400' },
    warning: { icon: '⚠️', color: 'text-yellow-400' },
    danger:  { icon: '🚨', color: 'text-red-400' },
    unknown: { icon: '❓', color: 'text-dim' },
};

// =========================================================================
// 工具函数
// =========================================================================

function fmtPrice(v: number): string {
    if (v < 0.0001) return `$${v.toExponential(2)}`;
    if (v < 1) return `$${v.toFixed(6)}`;
    return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtUsd(v: number | null): string {
    if (v === null) return '—';
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
}

function scoreColor(v: number): string {
    if (v >= 75) return 'text-green-400';
    if (v >= 55) return 'text-yellow-400';
    if (v >= 35) return 'text-orange-400';
    return 'text-red-400';
}

function scoreBarColor(v: number): string {
    if (v >= 75) return 'bg-green-500';
    if (v >= 55) return 'bg-yellow-500';
    if (v >= 35) return 'bg-orange-500';
    return 'bg-red-500';
}

// =========================================================================
// Props
// =========================================================================

interface NewCoinCardProps {
    coin: NewCoinRecord;
}

// =========================================================================
// 主组件
// =========================================================================

const NewCoinCard: React.FC<NewCoinCardProps> = memo(({ coin }) => {
    const [expanded, setExpanded] = useState(false);
    const heat = HEAT_CONFIG[coin.heatLevel];
    const risk = RISK_CONFIG[coin.riskLevel];
    const check = CHECK_CONFIG[coin.contractCheck];
    const priceChange = coin.initialPrice > 0
        ? ((coin.currentPrice - coin.initialPrice) / coin.initialPrice) * 100
        : 0;

    const toggleExpand = useCallback(() => setExpanded(p => !p), []);

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 hover:border-strong/50 transition-all overflow-hidden">
            {/* ─── 头部：Token名称 + 标签 ─────────────── */}
            <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">{coin.name}</span>
                        <span className="text-xs text-muted">({coin.symbol})</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${heat.color} ${heat.bg}`}>{heat.label}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-dim bg-surface-hover/50 px-1.5 py-0.5 rounded">{coin.chain}</span>
                    <span className="text-secondary">来源: {coin.source}</span>
                    <span className="text-secondary">· {timeAgo(coin.discoveredAt)}</span>
                </div>
            </div>

            {/* ─── 基础信息 ──────────────────────────── */}
            <div className="px-4 py-2 border-t border-strong/30">
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div>
                        <div className="text-[9px] text-dim">当前价格</div>
                        <div className="text-primary font-mono font-medium">{fmtPrice(coin.currentPrice)}</div>
                    </div>
                    <div>
                        <div className="text-[9px] text-dim">市值</div>
                        <div className="text-primary font-mono">{fmtUsd(coin.marketCap)}</div>
                    </div>
                    <div>
                        <div className="text-[9px] text-dim">流动性</div>
                        <div className="text-primary font-mono">{fmtUsd(coin.liquidity)}</div>
                    </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <div>
                        <span className="text-[9px] text-dim mr-1">涨跌:</span>
                        <span className={`font-mono font-bold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
                        </span>
                    </div>
                    {coin.contractAddress && (
                        <span className="text-[9px] text-secondary font-mono truncate max-w-[140px]" title={coin.contractAddress}>
                            {coin.contractAddress.slice(0, 6)}...{coin.contractAddress.slice(-4)}
                        </span>
                    )}
                </div>
            </div>

            {/* ─── 综合评分 ──────────────────────────── */}
            <div className="px-4 py-2 border-t border-strong/30">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted">⭐ 综合评分</span>
                        <span className={`text-lg font-bold font-mono ${scoreColor(coin.totalScore)}`}>{coin.totalScore}</span>
                        <span className="text-[10px] text-secondary">/100</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${risk.color} ${risk.bg}`}>⚠️ {risk.label}</span>
                </div>

                {/* 四维评分条 */}
                <div className="space-y-1">
                    <ScoreBar icon="🔒" label="安全性" score={coin.safetyScore} status={coin.safetyStatus} />
                    <ScoreBar icon="👥" label="持有者" score={coin.holderScore} status={coin.holderStatus} />
                    <ScoreBar icon="💧" label="流动性" score={coin.liquidityScore} status={coin.liquidityStatus} />
                    <ScoreBar icon="🔥" label="热度" score={coin.socialScore} />
                </div>
            </div>

            {/* ─── 关键指标 ──────────────────────────── */}
            <div className="px-4 py-2 border-t border-strong/30">
                <div className="text-[9px] text-dim mb-1.5">🎯 关键指标</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                    <div className="flex items-center justify-between">
                        <span className="text-muted">合约检测</span>
                        <span className={check.color}>{check.icon} {coin.contractCheckDetail || coin.contractCheck}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted">Top10 占比</span>
                        <span className={coin.top10Percentage > 50 ? 'text-red-400' : coin.top10Percentage > 30 ? 'text-yellow-400' : 'text-green-400'}>
                            {coin.top10Percentage}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted">LP 锁定</span>
                        <span className={coin.lpLockStatus === 'locked' ? 'text-green-400' : coin.lpLockStatus === 'partial' ? 'text-yellow-400' : 'text-red-400'}>
                            {coin.lpLockStatus === 'locked' ? '✅' : coin.lpLockStatus === 'partial' ? '⚠️' : '❌'} {coin.lpLockDays ? `${coin.lpLockDays}天` : '未锁'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted">聪明钱</span>
                        <span className={coin.smartMoneyCount > 0 ? 'text-green-400' : 'text-dim'}>
                            {coin.smartMoneyCount}个地址已买入
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted">交易笔数</span>
                        <span className="text-secondary">{coin.txCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted">24h 交易量</span>
                        <span className="text-secondary">{fmtUsd(coin.volume24h)}</span>
                    </div>
                </div>
            </div>

            {/* ─── 加分项标签 ────────────────────────── */}
            {(coin.vcKolRecommended || coin.whaleEntry || coin.hasGithub || coin.hasTwitter || coin.hasAudit) && (
                <div className="px-4 py-1.5 border-t border-strong/30 flex flex-wrap gap-1">
                    {coin.vcKolRecommended && <BonusTag label="💎 VC/KOL推荐" color="text-purple-400 bg-purple-500/10" />}
                    {coin.whaleEntry && <BonusTag label="🐳 巨鲸入场" color="text-blue-400 bg-blue-500/10" />}
                    {coin.hasGithub && <BonusTag label="🔧 GitHub" color="text-secondary bg-gray-600/20" />}
                    {coin.hasTwitter && <BonusTag label="🐦 Twitter" color="text-sky-400 bg-sky-500/10" />}
                    {coin.hasAudit && <BonusTag label="🛡️ 已审计" color="text-green-400 bg-green-500/10" />}
                </div>
            )}

            {/* ─── 操作建议 ──────────────────────────── */}
            <div className="px-4 py-2 border-t border-strong/30">
                <div className="text-[10px] text-blue-300/80 leading-relaxed">
                    💡 {coin.recommendation}
                </div>
            </div>

            {/* ─── 展开详情 / 快速链接 ──────────────── */}
            <div className="px-4 py-2 border-t border-strong/30">
                <button onClick={toggleExpand} className="text-[10px] text-dim hover:text-secondary transition-colors mb-1">
                    {expanded ? '▾ 收起链接' : '▸ 快速链接'}
                </button>
                {expanded && (
                    <div className="flex flex-wrap gap-2 mt-1 text-[10px]">
                        {coin.dexscreenerLink && (
                            <a href={coin.dexscreenerLink} target="_blank" rel="noopener noreferrer"
                               className="text-blue-400 hover:text-blue-300">📊 Dexscreener</a>
                        )}
                        {coin.contractLink && (
                            <a href={coin.contractLink} target="_blank" rel="noopener noreferrer"
                               className="text-blue-400 hover:text-blue-300">📋 合约</a>
                        )}
                        {coin.telegramLink && (
                            <a href={coin.telegramLink} target="_blank" rel="noopener noreferrer"
                               className="text-blue-400 hover:text-blue-300">💬 Telegram</a>
                        )}
                        {coin.website && (
                            <a href={coin.website} target="_blank" rel="noopener noreferrer"
                               className="text-blue-400 hover:text-blue-300">🔗 官网</a>
                        )}
                    </div>
                )}
            </div>

            {/* ─── 底部时间 ──────────────────────────── */}
            <div className="px-4 py-1.5 bg-card/30 text-[9px] text-secondary flex items-center justify-between">
                <span>⏰ 发现时间: {new Date(coin.discoveredAt).toLocaleString('zh-CN')}</span>
                <span>部署: {timeAgo(coin.deployTime)}</span>
            </div>
        </div>
    );
});

NewCoinCard.displayName = 'NewCoinCard';

// =========================================================================
// 子组件
// =========================================================================

/** 评分条 */
const ScoreBar: React.FC<{ icon: string; label: string; score: number; status?: string }> = memo(({ icon, label, score, status }) => (
    <div className="flex items-center gap-1.5">
        <span className="text-[9px] w-12 text-muted shrink-0">{icon} {label}</span>
        <div className="flex-1 h-1.5 bg-surface-hover rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${scoreBarColor(score)}`} style={{ width: `${score}%` }} />
        </div>
        <span className={`text-[9px] font-mono w-7 text-right shrink-0 ${scoreColor(score)}`}>{score}</span>
        {status && <span className="text-[8px] text-dim truncate max-w-[60px]">{status}</span>}
    </div>
));
ScoreBar.displayName = 'ScoreBar';

/** 加分标签 */
const BonusTag: React.FC<{ label: string; color: string }> = memo(({ label, color }) => (
    <span className={`text-[9px] px-1.5 py-0.5 rounded ${color}`}>{label}</span>
));
BonusTag.displayName = 'BonusTag';

export default NewCoinCard;
