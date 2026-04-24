/**
 * 信号维度目录（SignalDimensionCatalog）
 *
 * 左侧可折叠分类树，展示所有信号维度及其下的指标列表：
 *  - 维度分类（技术指标、链上、宏观、情绪、新闻…）
 *  - 每个指标的状态标签（生产/测试/候选/禁用）
 *  - 指标得分 / 权重 / 方向
 *  - 指标数量统计
 */
import React, { memo, useState, useMemo, useCallback } from 'react';
import type { SignalIndicatorItem, SignalDimensionCategory, SignalMarketType } from '../../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface SignalDimensionCatalogProps {
    indicators: SignalIndicatorItem[];
    market: SignalMarketType;
    onSelectIndicator?: (indicator: SignalIndicatorItem) => void;
    selectedIndicatorId?: string;
}

// =========================================================================
// 维度元数据
// =========================================================================

interface DimensionMeta {
    category: SignalDimensionCategory;
    label: string;
    icon: string;
    markets: SignalMarketType[];
}

const DIMENSION_META: DimensionMeta[] = [
    { category: 'technical', label: '技术指标', icon: '📈', markets: ['spot', 'futures'] },
    { category: 'onchain', label: '链上数据', icon: '⛓️', markets: ['spot', 'futures'] },
    { category: 'macro', label: '宏观经济', icon: '🌍', markets: ['spot', 'futures'] },
    { category: 'sentiment', label: '市场情绪', icon: '💭', markets: ['spot', 'futures'] },
    { category: 'news', label: '新闻事件', icon: '📰', markets: ['spot', 'futures'] },
    { category: 'pattern', label: '形态识别', icon: '🔍', markets: ['futures'] },
    { category: 'support_resistance', label: '支撑/阻力位', icon: '📊', markets: ['futures'] },
    { category: 'microstructure', label: '市场微观结构', icon: '🔬', markets: ['futures'] },
    { category: 'funding', label: '资金费率', icon: '💰', markets: ['futures'] },
    { category: 'open_interest', label: '持仓量', icon: '📋', markets: ['futures'] },
    { category: 'liquidation', label: '爆仓数据', icon: '💥', markets: ['futures'] },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    production: { label: '生产', color: 'text-green-400 bg-green-500/15' },
    testing: { label: '测试', color: 'text-yellow-400 bg-yellow-500/15' },
    candidate: { label: '候选', color: 'text-blue-400 bg-blue-500/15' },
    disabled: { label: '禁用', color: 'text-dim bg-base0/15' },
};

// =========================================================================
// 主组件
// =========================================================================

const SignalDimensionCatalog: React.FC<SignalDimensionCatalogProps> = memo(({
    indicators, market, onSelectIndicator, selectedIndicatorId
}) => {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['technical']));
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // 按当前市场筛选维度
    const visibleDimensions = useMemo(() =>
        DIMENSION_META.filter(d => d.markets.includes(market)),
    [market]);

    // 按维度分组指标
    const groupedIndicators = useMemo(() => {
        const map = new Map<SignalDimensionCategory, SignalIndicatorItem[]>();
        for (const ind of indicators) {
            if (!ind.markets.includes(market)) continue;
            if (statusFilter !== 'all' && ind.status !== statusFilter) continue;
            const arr = map.get(ind.category) || [];
            arr.push(ind);
            map.set(ind.category, arr);
        }
        return map;
    }, [indicators, market, statusFilter]);

    const toggleCategory = useCallback((cat: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat); else next.add(cat);
            return next;
        });
    }, []);

    // 统计
    const totalCount = indicators.filter(i => i.markets.includes(market)).length;
    const prodCount = indicators.filter(i => i.markets.includes(market) && i.status === 'production').length;
    const testCount = indicators.filter(i => i.markets.includes(market) && i.status === 'testing').length;

    return (
        <div className="h-full flex flex-col bg-card rounded-lg overflow-hidden">
            {/* Header */}
            <div className="px-3 py-2 border-b border-base shrink-0">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-primary">📂 信号维度目录</span>
                    <span className="text-[9px] text-dim">{totalCount} 个指标</span>
                </div>
                {/* 统计 */}
                <div className="flex gap-2 text-[9px] mb-1.5">
                    <span className="text-green-400">⬤ 生产 {prodCount}</span>
                    <span className="text-yellow-400">⬤ 测试 {testCount}</span>
                    <span className="text-dim">⬤ 候选 {totalCount - prodCount - testCount}</span>
                </div>
                {/* 状态筛选 */}
                <div className="flex gap-1">
                    {[
                        { key: 'all', label: '全部' },
                        { key: 'production', label: '生产' },
                        { key: 'testing', label: '测试' },
                        { key: 'candidate', label: '候选' },
                    ].map(f => (
                        <button key={f.key} onClick={() => setStatusFilter(f.key)}
                            className={`text-[9px] px-1.5 py-0.5 rounded ${statusFilter === f.key ? 'bg-blue-500/20 text-blue-400' : 'text-secondary hover:text-muted'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 维度列表 */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {visibleDimensions.map(dim => {
                    const items = groupedIndicators.get(dim.category) || [];
                    const isExpanded = expandedCategories.has(dim.category);
                    const dimProdCount = items.filter(i => i.status === 'production').length;

                    return (
                        <div key={dim.category}>
                            {/* 维度头 */}
                            <button onClick={() => toggleCategory(dim.category)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface/50 transition-colors border-b border-base/50">
                                <span className="text-[10px]">{dim.icon}</span>
                                <span className="text-[10px] text-primary font-medium flex-1 text-left">{dim.label}</span>
                                <span className="text-[9px] text-dim">{dimProdCount}/{items.length}</span>
                                <span className={`text-[9px] text-secondary transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▸</span>
                            </button>

                            {/* 指标列表 */}
                            {isExpanded && items.length > 0 && (
                                <div className="bg-base/30">
                                    {items.map(ind => {
                                        const stCfg = STATUS_CONFIG[ind.status];
                                        const isSelected = ind.id === selectedIndicatorId;
                                        const dirColor = ind.currentSignal > 0 ? 'text-green-400' : ind.currentSignal < 0 ? 'text-red-400' : 'text-dim';
                                        return (
                                            <button key={ind.id}
                                                onClick={() => onSelectIndicator?.(ind)}
                                                className={`w-full flex items-center gap-1.5 px-4 py-1.5 text-left hover:bg-surface/40 transition-colors ${isSelected ? 'bg-blue-500/10 border-l-2 border-blue-500' : 'border-l-2 border-transparent'}`}>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[9px] text-secondary truncate">{ind.name}</div>
                                                    {ind.accuracy !== undefined && (
                                                        <div className="text-[8px] text-secondary">准确率 {ind.accuracy}% · 胜率 {ind.winRate ?? '-'}%</div>
                                                    )}
                                                </div>
                                                <span className={`text-[9px] font-mono ${dirColor}`}>
                                                    {ind.currentScore}
                                                </span>
                                                <span className={`text-[8px] px-1 py-0 rounded ${stCfg.color}`}>
                                                    {stCfg.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {isExpanded && items.length === 0 && (
                                <div className="px-4 py-2 text-[9px] text-secondary">无匹配指标</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

SignalDimensionCatalog.displayName = 'SignalDimensionCatalog';
export default SignalDimensionCatalog;
