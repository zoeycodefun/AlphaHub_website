/**
 * 权益曲线图（Backtest Equity Curve）
 *
 * 以 SVG 折线图展示回测期间的权益变化：
 *  - 主曲线：净值走势
 *  - 阴影区：回撤区域
 *  - 基准线：初始资金
 *
 * 纯 SVG 实现，无第三方图表库依赖。
 */
import React, { memo, useMemo } from 'react';
import type { EquityCurvePoint } from '../../../type/alpha_module_types';

// =========================================================================
// 常量
// =========================================================================

/** 图表尺寸 */
const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const PADDING = { top: 10, right: 10, bottom: 30, left: 60 };

/** 有效绘图区域 */
const PLOT_W = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_H = CHART_HEIGHT - PADDING.top - PADDING.bottom;

// =========================================================================
// Props
// =========================================================================

interface BacktestEquityCurveProps {
    /** 权益曲线数据点 */
    data: EquityCurvePoint[];
    /** 初始资金基准线 */
    initialCapital: number;
}

// =========================================================================
// 工具函数
// =========================================================================

function buildPath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

// =========================================================================
// 主组件
// =========================================================================

const BacktestEquityCurve: React.FC<BacktestEquityCurveProps> = memo(({ data, initialCapital }) => {
    const { pathD, areaD, yTicks, baselineY, minEquity, maxEquity } = useMemo(() => {
        if (data.length === 0) {
            return { pathD: '', areaD: '', yTicks: [] as number[], baselineY: 0, minEquity: 0, maxEquity: 0 };
        }

        const equities = data.map(d => d.equity);
        const minE = Math.min(...equities, initialCapital) * 0.98;
        const maxE = Math.max(...equities, initialCapital) * 1.02;
        const rangeE = maxE - minE || 1;

        // 坐标映射
        const toX = (i: number) => PADDING.left + (i / (data.length - 1)) * PLOT_W;
        const toY = (v: number) => PADDING.top + (1 - (v - minE) / rangeE) * PLOT_H;

        const points = data.map((d, i) => ({ x: toX(i), y: toY(d.equity) }));
        const pathStr = buildPath(points);

        // 面积路径（曲线 → 底部 → 封闭）
        const areaStr = pathStr +
            ` L${points[points.length - 1].x.toFixed(1)},${(PADDING.top + PLOT_H).toFixed(1)}` +
            ` L${points[0].x.toFixed(1)},${(PADDING.top + PLOT_H).toFixed(1)} Z`;

        // Y 轴刻度
        const tickCount = 5;
        const ticks: number[] = [];
        for (let i = 0; i <= tickCount; i++) {
            ticks.push(minE + (rangeE * i) / tickCount);
        }

        return {
            pathD: pathStr,
            areaD: areaStr,
            yTicks: ticks,
            baselineY: toY(initialCapital),
            minEquity: minE,
            maxEquity: maxE,
        };
    }, [data, initialCapital]);

    if (data.length === 0) {
        return (
            <div className="bg-surface/60 rounded-xl border border-strong/50 p-4 text-center text-dim text-sm">
                暂无权益曲线数据
            </div>
        );
    }

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4">
            <h3 className="text-sm font-semibold text-primary mb-3">权益曲线</h3>
            <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-auto">
                {/* Y 轴网格线 + 标签 */}
                {yTicks.map((tick, i) => {
                    const y = PADDING.top + (1 - (tick - minEquity) / ((maxEquity - minEquity) || 1)) * PLOT_H;
                    return (
                        <g key={i}>
                            <line x1={PADDING.left} y1={y} x2={CHART_WIDTH - PADDING.right} y2={y} stroke="#374151" strokeWidth={0.5} strokeDasharray="4,4" />
                            <text x={PADDING.left - 5} y={y + 3} textAnchor="end" fill="#6B7280" fontSize={9} fontFamily="monospace">
                                {tick >= 1000 ? `${(tick / 1000).toFixed(1)}K` : tick.toFixed(0)}
                            </text>
                        </g>
                    );
                })}

                {/* 基准线（初始资金） */}
                <line
                    x1={PADDING.left} y1={baselineY}
                    x2={CHART_WIDTH - PADDING.right} y2={baselineY}
                    stroke="#60A5FA" strokeWidth={1} strokeDasharray="6,3" opacity={0.5}
                />

                {/* 面积填充 */}
                <path d={areaD} fill="url(#equityGradient)" opacity={0.3} />

                {/* 主曲线 */}
                <path d={pathD} fill="none" stroke="#34D399" strokeWidth={1.5} />

                {/* 渐变定义 */}
                <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34D399" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                    </linearGradient>
                </defs>
            </svg>

            {/* 图例 */}
            <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-dim">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> 净值曲线
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-blue-400 inline-block border-dashed" style={{ borderBottomWidth: 1, borderStyle: 'dashed' }} /> 初始资金
                </span>
            </div>
        </div>
    );
});

BacktestEquityCurve.displayName = 'BacktestEquityCurve';
export default BacktestEquityCurve;
