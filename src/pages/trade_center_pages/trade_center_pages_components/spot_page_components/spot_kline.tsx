/**
 * 现货 K 线图组件（SpotKline）
 *
 * 展示当前交易对的实时 K 线行情图：
 *
 *   1. 时间周期切换（1m / 5m / 15m / 1h / 4h / 1D）
 *   2. 实时 WebSocket 推送更新最新 K 线柱
 *   3. 画线工具（趋势线 / 水平线 / 射线 / 线段 — 支持颜色选择）
 *   4. 标注工具（在任意位置添加便签，可折叠，点击展开弹窗）
 *   5. 图表引擎：后续接入 TradingView / lightweight-charts
 *
 * 当前版本为布局容器 + 数据连接层 + 工具栏 UI。
 */
import React, { memo, useState, useCallback } from 'react';
import { useTradingStore } from '../../../../global_state_store/trading_global_state_store';
import { useKlines, useMarketDataStore } from '../../../../global_state_store/market_data_store';
import { formatPrice, formatVolume } from '../../../../hooks/use_format';
import { useKlineSubscription } from '../../../../hooks/use_trading_subscription';
import type { DrawingLineType, KlineDrawing, KlineAnnotation } from '../../type/spot_trading_types';

// =========================================================================
// 时间周期配置
// =========================================================================

const TIMEFRAMES = [
    { value: '1m', label: '1分' },
    { value: '5m', label: '5分' },
    { value: '15m', label: '15分' },
    { value: '1h', label: '1时' },
    { value: '4h', label: '4时' },
    { value: '1D', label: '日线' },
] as const;

// =========================================================================
// 画线工具配置
// =========================================================================

type DrawingTool = 'none' | DrawingLineType | 'annotation';

const DRAWING_TOOLS: { key: DrawingTool; label: string; icon: string }[] = [
    { key: 'none',       label: '选择', icon: '↖' },
    { key: 'trend',      label: '趋势线', icon: '╲' },
    { key: 'horizontal', label: '水平线', icon: '━' },
    { key: 'ray',        label: '射线', icon: '╱→' },
    { key: 'segment',    label: '线段', icon: '╱' },
    { key: 'annotation', label: '标注', icon: '📌' },
];

const LINE_COLORS = [
    '#3B82F6', // blue
    '#22C55E', // green
    '#EF4444', // red
    '#EAB308', // yellow
    '#A855F7', // purple
    '#F97316', // orange
    '#06B6D4', // cyan
    '#FFFFFF', // white
];

// =========================================================================
// 组件
// =========================================================================

const SpotKline = memo(function SpotKline() {
    const activeSymbol = useTradingStore((s) => s.activeSymbol);
    const activeExchangeId = useTradingStore((s) => s.activeExchangeId);
    const [timeframe, setTimeframe] = useState('15m');

    // ── 画线 & 标注状态 ──
    const [activeTool, setActiveTool] = useState<DrawingTool>('none');
    const [activeColor, setActiveColor] = useState(LINE_COLORS[0]);
    const [drawings, setDrawings] = useState<KlineDrawing[]>([]);
    const [annotations, setAnnotations] = useState<KlineAnnotation[]>([]);
    const [showToolbar, setShowToolbar] = useState(false);
    const [selectedAnnotation, setSelectedAnnotation] = useState<KlineAnnotation | null>(null);

    // 订阅 K 线数据
    useKlineSubscription(timeframe, activeSymbol, activeExchangeId);

    // 获取 K 线数据
    const klines = useKlines(activeSymbol, timeframe, activeExchangeId);

    // 最新一根 K 线用于展示 OHLCV
    const latestBar = klines.length > 0 ? klines[klines.length - 1] : null;

    // ── 清除全部画线 / 标注 ──
    const handleClearAll = useCallback(() => {
        setDrawings([]);
        setAnnotations([]);
    }, []);

    // ── 删除单个标注 ──
    const handleDeleteAnnotation = useCallback((id: string) => {
        setAnnotations(prev => prev.filter(a => a.id !== id));
        setSelectedAnnotation(null);
    }, []);

    return (
        <div className="flex-[3] bg-card rounded-lg flex flex-col overflow-hidden">
            {/* ─── 工具栏：时间周期 + 画线工具 ───────────────────── */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-base shrink-0">
                <div className="flex items-center gap-1">
                    {/* 时间周期 */}
                    {TIMEFRAMES.map((tf) => (
                        <button
                            key={tf.value}
                            onClick={() => setTimeframe(tf.value)}
                            className={`px-2.5 py-1 text-xs rounded transition-colors ${
                                timeframe === tf.value
                                    ? 'bg-blue-600 text-white'
                                    : 'text-muted hover:text-primary hover:bg-surface'
                            }`}
                        >
                            {tf.label}
                        </button>
                    ))}

                    {/* 分隔线 */}
                    <div className="w-px h-4 bg-surface-hover mx-1" />

                    {/* 画线工具展开按钮 */}
                    <button
                        onClick={() => setShowToolbar(!showToolbar)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                            showToolbar ? 'bg-blue-600/20 text-blue-400' : 'text-dim hover:text-secondary hover:bg-surface'
                        }`}
                        title="画线 & 标注工具"
                    >
                        ✏️ 工具
                    </button>
                </div>

                {/* 最新 OHLCV 摘要 */}
                {latestBar && (
                    <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-dim">O</span>
                        <span className="text-primary">{formatPrice(latestBar.open)}</span>
                        <span className="text-dim">H</span>
                        <span className="text-green-500">{formatPrice(latestBar.high)}</span>
                        <span className="text-dim">L</span>
                        <span className="text-red-500">{formatPrice(latestBar.low)}</span>
                        <span className="text-dim">C</span>
                        <span className="text-primary">{formatPrice(latestBar.close)}</span>
                        <span className="text-dim">V</span>
                        <span className="text-secondary">{formatVolume(latestBar.volume)}</span>
                    </div>
                )}
            </div>

            {/* ─── 画线工具栏（折叠式） ──────────────────────────── */}
            {showToolbar && (
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-base/50 bg-card/80 shrink-0">
                    {/* 工具选择 */}
                    <div className="flex gap-0.5">
                        {DRAWING_TOOLS.map((tool) => (
                            <button
                                key={tool.key}
                                onClick={() => setActiveTool(tool.key)}
                                className={`px-2 py-1 text-[10px] rounded transition-colors ${
                                    activeTool === tool.key
                                        ? 'bg-blue-600/30 text-blue-400 ring-1 ring-blue-500/30'
                                        : 'text-dim hover:text-secondary hover:bg-surface'
                                }`}
                                title={tool.label}
                            >
                                <span className="mr-0.5">{tool.icon}</span> {tool.label}
                            </button>
                        ))}
                    </div>

                    {/* 颜色选择 */}
                    {activeTool !== 'none' && (
                        <>
                            <div className="w-px h-4 bg-surface-hover" />
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-dim mr-0.5">颜色</span>
                                {LINE_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setActiveColor(color)}
                                        className={`w-4 h-4 rounded-full border-2 transition-all ${
                                            activeColor === color ? 'border-white scale-110' : 'border-strong'
                                        }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* 清除 */}
                    {(drawings.length > 0 || annotations.length > 0) && (
                        <>
                            <div className="w-px h-4 bg-surface-hover" />
                            <button
                                onClick={handleClearAll}
                                className="text-[10px] text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded hover:bg-red-500/10 transition-colors"
                            >
                                清除全部 ({drawings.length + annotations.length})
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ─── K 线图容器 ─────────────────────────────────────── */}
            <div className="flex-1 relative min-h-0">
                {klines.length === 0 ? (
                    // 等待数据
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-dim">
                        <div className="w-8 h-8 border-2 border-strong border-t-blue-500 rounded-full animate-spin mb-3" />
                        <span className="text-sm">等待 K 线数据...</span>
                        <span className="text-xs text-secondary mt-1">{activeSymbol} · {timeframe}</span>
                    </div>
                ) : (
                    <>
                        {/* K 线简易可视化（后续替换为 TradingView / lightweight-charts） */}
                        <div className="absolute inset-0 flex items-end px-1 py-2 gap-px overflow-hidden">
                            {klines.slice(-120).map((bar, index) => {
                                const isGreen = bar.close >= bar.open;
                                const range = Math.max(...klines.slice(-120).map(b => b.high)) - Math.min(...klines.slice(-120).map(b => b.low));
                                const heightPercent = range > 0
                                    ? ((Math.abs(bar.close - bar.open) / range) * 100)
                                    : 1;

                                return (
                                    <div
                                        key={`${bar.timestamp}-${index}`}
                                        className="flex-1 min-w-[2px] max-w-[8px]"
                                        style={{ height: `${Math.max(heightPercent, 1)}%` }}
                                    >
                                        <div
                                            className={`w-full h-full rounded-sm ${
                                                isGreen ? 'bg-green-500/80' : 'bg-red-500/80'
                                            }`}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* 标注图标叠加层 */}
                        {annotations.length > 0 && (
                            <div className="absolute inset-0 pointer-events-none">
                                {annotations.map((ann) => (
                                    <div
                                        key={ann.id}
                                        className="absolute pointer-events-auto cursor-pointer"
                                        style={{
                                            left: `${((ann.time % 120) / 120) * 100}%`,
                                            top: `${(1 - ann.price / 100) * 80 + 5}%`,
                                        }}
                                        onClick={() => setSelectedAnnotation(ann)}
                                        title={ann.title}
                                    >
                                        <div
                                            className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-primary shadow-lg"
                                            style={{ backgroundColor: ann.color }}
                                        >
                                            📌
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 活动工具提示 */}
                        {activeTool !== 'none' && (
                            <div className="absolute top-2 left-2 text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded pointer-events-none">
                                {activeTool === 'annotation' ? '📌 点击图表添加标注' : `✏️ 拖拽绘制${DRAWING_TOOLS.find(t => t.key === activeTool)?.label ?? ''}`}
                            </div>
                        )}
                    </>
                )}

                {/* 标注弹窗 */}
                {selectedAnnotation && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                        <div
                            className="bg-surface border rounded-lg p-3 max-w-xs shadow-xl"
                            style={{ borderColor: selectedAnnotation.color }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-primary">{selectedAnnotation.title}</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleDeleteAnnotation(selectedAnnotation.id)}
                                        className="text-[10px] text-red-400 hover:text-red-300 px-1"
                                    >
                                        删除
                                    </button>
                                    <button
                                        onClick={() => setSelectedAnnotation(null)}
                                        className="text-dim hover:text-primary text-sm leading-none"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                            <p className="text-[11px] text-secondary leading-relaxed">{selectedAnnotation.content}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

SpotKline.displayName = 'SpotKline';

export default SpotKline;
