/**
 * 信号详情卡片（Signal Detail Card）
 *
 * 渲染单条信号的完整信息：
 *  - 方向图标（买入/卖出）+ 交易对 + 强度等级
 *  - 评分进度条
 *  - 建议入场价 / 止损 / 止盈
 *  - 评分明细折叠区域
 *  - AI 解释摘要
 *  - 状态徽标 + 时间
 */
import React, { memo, useState, useCallback } from 'react';
import type { SignalRecord } from '../../../type/alpha_module_types';

// =========================================================================
// 常量
// =========================================================================

/** 强度等级配置 */
const STRENGTH_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    weak:        { label: '弱',   color: 'text-muted', bg: 'bg-gray-400/20' },
    moderate:    { label: '中等', color: 'text-yellow-400', bg: 'bg-yellow-400/20' },
    strong:      { label: '强',   color: 'text-green-400', bg: 'bg-green-400/20' },
    very_strong: { label: '极强', color: 'text-emerald-400', bg: 'bg-emerald-400/20' },
};

/** 状态配置 */
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    active:    { label: '活跃',   color: 'text-blue-400 bg-blue-400/10' },
    triggered: { label: '已触发', color: 'text-green-400 bg-green-400/10' },
    expired:   { label: '已过期', color: 'text-dim bg-base0/10' },
    cancelled: { label: '已取消', color: 'text-red-400 bg-red-400/10' },
};

// =========================================================================
// 工具函数
// =========================================================================

function formatPrice(v: number | null): string {
    if (v === null) return '—';
    return v >= 1 ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v.toPrecision(6);
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
}

// =========================================================================
// Props
// =========================================================================

interface SignalDetailCardProps {
    signal: SignalRecord;
    /** 点击卡片回调 */
    onClick?: (signal: SignalRecord) => void;
}

// =========================================================================
// 主组件
// =========================================================================

const SignalDetailCard: React.FC<SignalDetailCardProps> = memo(({ signal, onClick }) => {
    const [expanded, setExpanded] = useState(false);
    const strength = STRENGTH_CONFIG[signal.strengthLevel] || STRENGTH_CONFIG.weak;
    const status = STATUS_CONFIG[signal.status] || STATUS_CONFIG.active;
    const isBuy = signal.direction === 'buy';

    const handleToggle = useCallback(() => setExpanded(p => !p), []);
    const handleClick = useCallback(() => onClick?.(signal), [onClick, signal]);

    return (
        <div
            className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4 hover:border-strong/50 transition-all cursor-pointer"
            onClick={handleClick}
        >
            {/* ─── 顶部行：方向 + 交易对 + 强度 + 状态 ──────── */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {/* 方向图标 */}
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${isBuy ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                        {isBuy ? '▲ 买入' : '▼ 卖出'}
                    </span>
                    <span className="text-sm font-semibold text-primary">{signal.symbol}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${strength.bg} ${strength.color}`}>
                        {strength.label}
                    </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded ${status.color}`}>
                    {status.label}
                </span>
            </div>

            {/* ─── 评分进度条 ───────────────────────────────── */}
            <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted">信号评分</span>
                    <span className="text-primary font-bold">{signal.score}/100</span>
                </div>
                <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${
                            signal.score >= 80 ? 'bg-green-400' :
                            signal.score >= 60 ? 'bg-yellow-400' :
                            signal.score >= 40 ? 'bg-orange-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${signal.score}%` }}
                    />
                </div>
            </div>

            {/* ─── 建议价位 ─────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div className="bg-card/50 rounded p-2 text-center">
                    <div className="text-dim mb-0.5">入场价</div>
                    <div className="text-primary font-mono">{formatPrice(signal.suggestedEntryPrice)}</div>
                </div>
                <div className="bg-card/50 rounded p-2 text-center">
                    <div className="text-dim mb-0.5">止损</div>
                    <div className="text-red-400 font-mono">{formatPrice(signal.suggestedStopLoss)}</div>
                </div>
                <div className="bg-card/50 rounded p-2 text-center">
                    <div className="text-dim mb-0.5">止盈</div>
                    <div className="text-green-400 font-mono">{formatPrice(signal.suggestedTakeProfit)}</div>
                </div>
            </div>

            {/* ─── AI 解释 ──────────────────────────────────── */}
            {signal.aiExplanation && (
                <div className="mb-3 p-2 bg-blue-500/5 border border-blue-500/20 rounded text-xs text-blue-300 leading-relaxed">
                    🤖 {signal.aiExplanation}
                </div>
            )}

            {/* ─── 评分明细（可折叠） ──────────────────────── */}
            {signal.scoreBreakdown.length > 0 && (
                <div className="mb-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleToggle(); }}
                        className="text-xs text-dim hover:text-secondary transition-colors"
                    >
                        {expanded ? '▾ 收起明细' : '▸ 查看评分明细'}
                    </button>
                    {expanded && (
                        <div className="mt-2 space-y-1">
                            {signal.scoreBreakdown.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="text-muted">{item.indicator}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={item.direction === 'buy' ? 'text-green-400' : 'text-red-400'}>
                                            {item.score > 0 ? '+' : ''}{item.score.toFixed(1)}
                                        </span>
                                        <span className="text-secondary">×{item.weight}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ─── 底部信息 ─────────────────────────────────── */}
            <div className="flex items-center justify-between text-[10px] text-secondary pt-2 border-t border-strong/30">
                <span>{signal.strategyName}</span>
                <span>{timeAgo(signal.createdAt)}</span>
            </div>
        </div>
    );
});

SignalDetailCard.displayName = 'SignalDetailCard';
export default SignalDetailCard;
