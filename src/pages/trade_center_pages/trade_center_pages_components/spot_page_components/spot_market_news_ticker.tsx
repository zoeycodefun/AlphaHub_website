/**
 * 市场快讯滚动条（SpotMarketNewsTicker）
 *
 * 来自市场信息中心的非结构化新闻推送，单行横向滚动：
 *
 *   ⚡ [快讯] 美联储维持利率不变，市场反应积极  ←───滚动────
 *
 * 数据来源：后续接入市场信息中心 WebSocket，当前使用 Mock。
 */
import React, { memo, useMemo } from 'react';
import type { MarketFlashNews } from '../../type/spot_trading_types';

// =========================================================================
// 常量
// =========================================================================

const IMPORTANCE_COLORS: Record<MarketFlashNews['importance'], string> = {
    critical: 'text-red-400',
    high:     'text-yellow-400',
    medium:   'text-blue-400',
    low:      'text-muted',
};

const IMPORTANCE_ICONS: Record<MarketFlashNews['importance'], string> = {
    critical: '🔴',
    high:     '🟡',
    medium:   '🔵',
    low:      '⚪',
};

// =========================================================================
// Mock 数据
// =========================================================================

const MOCK_NEWS: MarketFlashNews[] = [
    { id: 'fn1', content: '美联储维持利率不变，鲍威尔暗示年内可能降息两次', source: '华尔街日报', importance: 'critical', timestamp: new Date().toISOString() },
    { id: 'fn2', content: 'BlackRock IBIT 单日净流入 $520M，创近 30 天新高', source: 'Bloomberg', importance: 'high', timestamp: new Date(Date.now() - 600_000).toISOString() },
    { id: 'fn3', content: 'Coinbase 获欧洲 MiCA 牌照，加密市场监管框架再进一步', source: 'CoinDesk', importance: 'medium', timestamp: new Date(Date.now() - 1_200_000).toISOString() },
    { id: 'fn4', content: 'BTC 算力突破 800 EH/s 创历史新高，矿工信心强劲', source: 'Glassnode', importance: 'medium', timestamp: new Date(Date.now() - 1_800_000).toISOString() },
    { id: 'fn5', content: 'Circle USDC 储备报告：$33.2B 全额美国国债支撑', source: 'Circle', importance: 'low', timestamp: new Date(Date.now() - 3_600_000).toISOString() },
];

// =========================================================================
// 组件
// =========================================================================

const SpotMarketNewsTicker = memo(function SpotMarketNewsTicker() {
    const newsItems = useMemo(() => MOCK_NEWS, []);

    // 构造滚动文本（重复两次以实现无缝循环）
    const tickerContent = useMemo(() => {
        return newsItems.map((item) => ({
            ...item,
            colorClass: IMPORTANCE_COLORS[item.importance],
            icon: IMPORTANCE_ICONS[item.importance],
        }));
    }, [newsItems]);

    if (tickerContent.length === 0) return null;

    return (
        <div className="bg-card/80 border border-base/50 rounded-lg px-3 py-1.5 overflow-hidden relative shrink-0">
            <div className="flex items-center gap-2">
                {/* 标签 */}
                <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded shrink-0">
                    快讯
                </span>

                {/* 滚动区域 */}
                <div className="flex-1 overflow-hidden relative">
                    <div className="flex animate-ticker whitespace-nowrap">
                        {/* 两份相同内容实现无缝循环 */}
                        {[0, 1].map((copy) => (
                            <div key={copy} className="flex items-center gap-6 shrink-0 pr-8">
                                {tickerContent.map((item) => (
                                    <span
                                        key={`${copy}-${item.id}`}
                                        className={`text-[11px] ${item.colorClass} shrink-0 cursor-default`}
                                        title={`[${item.source}] ${item.content}`}
                                    >
                                        {item.icon} {item.content}
                                        <span className="text-secondary ml-1.5">{item.source}</span>
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CSS 动画 — 内联 keyframes 通过 style 标签注入 */}
            <style>{`
                @keyframes ticker-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-ticker {
                    animation: ticker-scroll 60s linear infinite;
                }
                .animate-ticker:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
});

SpotMarketNewsTicker.displayName = 'SpotMarketNewsTicker';

export default SpotMarketNewsTicker;
