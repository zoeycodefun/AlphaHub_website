/**
 * 相关性矩阵面板（Hedge Correlation Panel）
 *
 * 使用纯 CSS 热力图展示交易对之间的相关系数：
 *  - 矩阵单元格颜色根据相关系数动态渐变
 *  - 正相关 → 绿色渐深，负相关 → 红色渐深
 *  - 鼠标悬停显示精确数值
 */
import React, { memo, useMemo } from 'react';
import type { CorrelationEntry } from '../../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface HedgeCorrelationPanelProps {
    data: CorrelationEntry[];
    symbols: string[];
}

// =========================================================================
// 工具函数
// =========================================================================

/** 将相关系数映射为热力图背景色 */
function heatmapColor(v: number): string {
    const abs = Math.abs(v);
    const alpha = Math.round(abs * 100);
    if (v >= 0) return `rgba(34,197,94,${(alpha * 0.6) / 100})`;   // green-500
    return `rgba(239,68,68,${(alpha * 0.6) / 100})`;               // red-500
}

/** 将相关系数映射为文字色 */
function textColor(v: number): string {
    const abs = Math.abs(v);
    if (abs > 0.6) return 'text-primary';
    if (abs > 0.3) return 'text-primary';
    return 'text-muted';
}

// =========================================================================
// 主组件
// =========================================================================

const HedgeCorrelationPanel: React.FC<HedgeCorrelationPanelProps> = memo(({ data, symbols }) => {
    /** 构造对称矩阵 map: "symbolA-symbolB" → value */
    const matrixMap = useMemo(() => {
        const map = new Map<string, number>();
        for (const entry of data) {
            map.set(`${entry.symbolA}-${entry.symbolB}`, entry.correlation);
            map.set(`${entry.symbolB}-${entry.symbolA}`, entry.correlation);
        }
        // 对角线 = 1
        for (const s of symbols) {
            map.set(`${s}-${s}`, 1);
        }
        return map;
    }, [data, symbols]);

    if (symbols.length === 0) {
        return (
            <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-6 text-center text-dim text-sm">
                暂无相关性数据
            </div>
        );
    }

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4">
            <h3 className="text-sm font-semibold text-primary mb-3">📊 相关性矩阵</h3>

            {/* 矩阵容器（可横向滚动） */}
            <div className="overflow-x-auto">
                <table className="border-collapse text-[10px]">
                    <thead>
                        <tr>
                            {/* 左上空格 */}
                            <th className="p-1.5 text-dim text-right" />
                            {symbols.map((s) => (
                                <th key={s} className="p-1.5 text-muted font-medium whitespace-nowrap">
                                    {s.replace('/USDT', '')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {symbols.map((rowSym) => (
                            <tr key={rowSym}>
                                <td className="p-1.5 text-muted font-medium text-right whitespace-nowrap">
                                    {rowSym.replace('/USDT', '')}
                                </td>
                                {symbols.map((colSym) => {
                                    const val = matrixMap.get(`${rowSym}-${colSym}`) ?? 0;
                                    return (
                                        <td
                                            key={colSym}
                                            className={`p-1.5 text-center font-mono ${textColor(val)} transition-colors`}
                                            style={{ backgroundColor: heatmapColor(val), minWidth: 40 }}
                                            title={`${rowSym} ↔ ${colSym} : ${val.toFixed(3)}`}
                                        >
                                            {val.toFixed(2)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 图例 */}
            <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-dim">
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded" style={{ background: 'rgba(239,68,68,0.5)' }} />
                    负相关
                </span>
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded bg-surface-hover" />
                    无相关
                </span>
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded" style={{ background: 'rgba(34,197,94,0.5)' }} />
                    正相关
                </span>
            </div>
        </div>
    );
});

HedgeCorrelationPanel.displayName = 'HedgeCorrelationPanel';
export default HedgeCorrelationPanel;
