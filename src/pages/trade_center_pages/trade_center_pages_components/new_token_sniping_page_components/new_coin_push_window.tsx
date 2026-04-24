/**
 * 新币推送通知窗口（New Coin Push Window）
 *
 * 右下角实时推送弹窗，展示新发现代币的核心评估信息：
 *  - Token 名称与链标签
 *  - 综合评分 + 风险等级
 *  - 四维评分简报
 *  - 关键指标快照
 *  - 快速操作按钮
 *  - 自动消失 / 手动关闭
 */
import React, { memo, useCallback, useEffect, useState } from 'react';
import type { NewCoinRecord, TokenRiskLevel } from '../../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface NewCoinPushWindowProps {
    coin: NewCoinRecord;
    visible: boolean;
    onClose: () => void;
    onViewDetail?: (coin: NewCoinRecord) => void;
    /** 自动消失秒数（0=不自动消失） */
    autoCloseSeconds?: number;
}

// =========================================================================
// 常量
// =========================================================================

const RISK_CFG: Record<TokenRiskLevel, { label: string; color: string }> = {
    low:     { label: '低风险',   color: 'text-green-400' },
    medium:  { label: '中等风险', color: 'text-yellow-400' },
    high:    { label: '高风险',   color: 'text-orange-400' },
    extreme: { label: '极高风险', color: 'text-red-400' },
};

function fmtUsd(v: number | null): string {
    if (v === null) return '—';
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
}

function scoreColor(v: number): string {
    if (v >= 75) return 'text-green-400';
    if (v >= 55) return 'text-yellow-400';
    if (v >= 35) return 'text-orange-400';
    return 'text-red-400';
}

// =========================================================================
// 主组件
// =========================================================================

const NewCoinPushWindow: React.FC<NewCoinPushWindowProps> = memo(({
    coin, visible, onClose, onViewDetail, autoCloseSeconds = 15,
}) => {
    const [progress, setProgress] = useState(100);

    // 自动消失倒计时
    useEffect(() => {
        if (!visible || autoCloseSeconds <= 0) return;
        const interval = 50;
        const step = (interval / (autoCloseSeconds * 1000)) * 100;
        let current = 100;
        const timer = setInterval(() => {
            current -= step;
            if (current <= 0) {
                clearInterval(timer);
                onClose();
            } else {
                setProgress(current);
            }
        }, interval);
        return () => clearInterval(timer);
    }, [visible, autoCloseSeconds, onClose]);

    // 重置 progress on new push
    useEffect(() => {
        if (visible) setProgress(100);
    }, [visible, coin.id]);

    const handleView = useCallback(() => {
        onViewDetail?.(coin);
        onClose();
    }, [coin, onViewDetail, onClose]);

    if (!visible) return null;

    const risk = RISK_CFG[coin.riskLevel];

    return (
        <div className="fixed bottom-4 right-4 z-[300] w-80 animate-in slide-in-from-right-5">
            <div className="bg-surface border border-strong/50 rounded-xl shadow-2xl overflow-hidden">
                {/* 自动关闭进度条 */}
                {autoCloseSeconds > 0 && (
                    <div className="h-0.5 bg-surface-hover">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                )}

                {/* 头部 */}
                <div className="px-3 py-2 flex items-center justify-between border-b border-strong/50">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-green-400 animate-pulse">● LIVE</span>
                        <span className="text-[11px] font-bold text-primary">🆕 新币发现</span>
                    </div>
                    <button onClick={onClose} className="text-dim hover:text-primary text-sm leading-none">✕</button>
                </div>

                {/* Token 名称 */}
                <div className="px-3 py-2">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-bold text-primary">{coin.name}</span>
                        <span className="text-xs text-muted">({coin.symbol})</span>
                        <span className="text-[9px] text-dim bg-surface-hover/50 px-1 py-0.5 rounded">{coin.chain}</span>
                    </div>

                    {/* 评分 + 风险 */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted">⭐ 综合评分:</span>
                            <span className={`text-base font-bold font-mono ${scoreColor(coin.totalScore)}`}>{coin.totalScore}</span>
                            <span className="text-[9px] text-secondary">/100</span>
                        </div>
                        <span className={`text-[10px] ${risk.color}`}>⚠️ {risk.label}</span>
                    </div>

                    {/* 四维评分 */}
                    <div className="grid grid-cols-4 gap-1 mb-2 text-[9px]">
                        <div className="bg-card/60 rounded p-1.5 text-center">
                            <div className="text-dim">🔒 安全</div>
                            <div className={`font-mono font-bold ${scoreColor(coin.safetyScore)}`}>{coin.safetyScore}</div>
                        </div>
                        <div className="bg-card/60 rounded p-1.5 text-center">
                            <div className="text-dim">👥 持有</div>
                            <div className={`font-mono font-bold ${scoreColor(coin.holderScore)}`}>{coin.holderScore}</div>
                        </div>
                        <div className="bg-card/60 rounded p-1.5 text-center">
                            <div className="text-dim">💧 流动</div>
                            <div className={`font-mono font-bold ${scoreColor(coin.liquidityScore)}`}>{coin.liquidityScore}</div>
                        </div>
                        <div className="bg-card/60 rounded p-1.5 text-center">
                            <div className="text-dim">🔥 热度</div>
                            <div className={`font-mono font-bold ${scoreColor(coin.socialScore)}`}>{coin.socialScore}</div>
                        </div>
                    </div>

                    {/* 关键快照 */}
                    <div className="text-[9px] space-y-0.5 mb-2">
                        <div className="flex justify-between">
                            <span className="text-dim">价格: <span className="text-primary font-mono">${coin.currentPrice}</span></span>
                            <span className="text-dim">市值: <span className="text-primary">{fmtUsd(coin.marketCap)}</span></span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-dim">聪明钱: <span className="text-green-400">{coin.smartMoneyCount}地址</span></span>
                            <span className="text-dim">Top10: <span className={coin.top10Percentage > 50 ? 'text-red-400' : 'text-secondary'}>{coin.top10Percentage}%</span></span>
                        </div>
                    </div>

                    {/* 建议 */}
                    <div className="text-[9px] text-blue-300/80 mb-2">💡 {coin.recommendation}</div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 px-3 py-2 border-t border-strong/50">
                    <button onClick={handleView}
                        className="flex-1 text-[10px] py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                        查看详情
                    </button>
                    <button onClick={onClose}
                        className="flex-1 text-[10px] py-1.5 bg-surface-hover/30 text-muted rounded-lg hover:bg-surface-hover/50 transition-colors">
                        忽略
                    </button>
                </div>
            </div>
        </div>
    );
});

NewCoinPushWindow.displayName = 'NewCoinPushWindow';
export default NewCoinPushWindow;
