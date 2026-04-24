/**
 * 子母标签级联选择器（TagCascadeSelector）
 *
 * 从后端 API 动态加载标签树，支持：
 *  1. 点击母标签 → 展开/折叠该大类的子标签
 *  2. 点击子标签 → 切换选中/取消（多选）
 *  3. 选中母标签 = 选中该类所有子标签
 *  4. 清空所有选中 = 显示全部内容
 *
 * V1 使用静态 mock 数据，后续对接 API 获取。
 */
import React, { memo, useState, useMemo, useCallback } from 'react';
import type { ParentTag, ChildTag } from '../../trade_center_pages/type/alpha_module_types';

// =========================================================================
// V1 静态标签数据（与后端 TagTaxonomyService 同步）
// =========================================================================

const V1_TAGS: ParentTag[] = [
    {
        id: 'macro_environment', label: '宏观环境', description: '全球宏观政策、地缘政治事件', color: 'text-blue-400 bg-blue-400/10', icon: '🌍', weight: 3, enabled: true, sortOrder: 1,
        children: [
            { id: 'trump', label: '特朗普', keywords: [], enabled: true, sortOrder: 1, icon: '🇺🇸' },
            { id: 'musk', label: '马斯克', keywords: [], enabled: true, sortOrder: 2, icon: '🚀' },
            { id: 'war', label: '战争', keywords: [], enabled: true, sortOrder: 3, icon: '⚔️' },
            { id: 'fed', label: '美联储', keywords: [], enabled: true, sortOrder: 4, icon: '🏛️' },
            { id: 'meeting', label: '会议', keywords: [], enabled: true, sortOrder: 5, icon: '🤝' },
            { id: 'tariff', label: '关税', keywords: [], enabled: true, sortOrder: 6, icon: '📦' },
            { id: 'regulation', label: '市场监管', keywords: [], enabled: true, sortOrder: 7, icon: '⚖️' },
            { id: 'legislation', label: '立法', keywords: [], enabled: true, sortOrder: 8, icon: '📜' },
        ],
    },
    {
        id: 'macro_data', label: '宏观数据', description: '关键宏观经济指标', color: 'text-cyan-400 bg-cyan-400/10', icon: '📊', weight: 3, enabled: true, sortOrder: 2,
        children: [
            { id: 'dxy', label: '美元指数', keywords: [], enabled: true, sortOrder: 1, icon: '💵' },
            { id: 'nasdaq', label: '纳指', keywords: [], enabled: true, sortOrder: 2, icon: '📈' },
            { id: 'treasury', label: '国债', keywords: [], enabled: true, sortOrder: 3, icon: '🏦' },
            { id: 'gold', label: '黄金价格', keywords: [], enabled: true, sortOrder: 4, icon: '🥇' },
            { id: 'oil', label: '原油价格', keywords: [], enabled: true, sortOrder: 5, icon: '🛢️' },
            { id: 'tech_stocks', label: '科技股指数', keywords: [], enabled: true, sortOrder: 6, icon: '💻' },
        ],
    },
    {
        id: 'exchange_data', label: '交易所数据', description: '加密交易所关键指标', color: 'text-yellow-400 bg-yellow-400/10', icon: '🏪', weight: 3, enabled: true, sortOrder: 3,
        children: [
            { id: 'funding_rate', label: '资金费率', keywords: [], enabled: true, sortOrder: 1, icon: '💰' },
            { id: 'open_interest', label: '合约持仓', keywords: [], enabled: true, sortOrder: 2, icon: '📋' },
            { id: 'price_breakout', label: '价格突破', keywords: [], enabled: true, sortOrder: 3, icon: '🔔' },
            { id: 'liquidation', label: '爆仓数据', keywords: [], enabled: true, sortOrder: 4, icon: '💥' },
            { id: 'long_short_ratio', label: 'BTC多空比', keywords: [], enabled: true, sortOrder: 5, icon: '⚖️' },
            { id: 'whale', label: '鲸鱼', keywords: [], enabled: true, sortOrder: 6, icon: '🐋' },
            { id: 'fear_greed', label: '恐惧贪婪指数', keywords: [], enabled: true, sortOrder: 7, icon: '😨' },
        ],
    },
    {
        id: 'web3_projects', label: 'Web3项目', description: '具体项目动态追踪', color: 'text-purple-400 bg-purple-400/10', icon: '🔮', weight: 2, enabled: true, sortOrder: 4,
        children: [
            { id: 'spark', label: 'Spark', keywords: [], enabled: true, sortOrder: 1, icon: '✨' },
        ],
    },
    {
        id: 'dev_tech', label: '开发与技术', description: '核心开发人员动态、协议升级', color: 'text-green-400 bg-green-400/10', icon: '⚙️', weight: 2, enabled: true, sortOrder: 5,
        children: [
            { id: 'core_dev', label: '核心开发人员动态', keywords: [], enabled: true, sortOrder: 1, icon: '👨‍💻' },
            { id: 'tech_upgrade', label: '技术更新升级', keywords: [], enabled: true, sortOrder: 2, icon: '🔄' },
        ],
    },
    {
        id: 'investment', label: '投资', description: '机构动向、BTC 机构观点', color: 'text-orange-400 bg-orange-400/10', icon: '💼', weight: 3, enabled: true, sortOrder: 6,
        children: [
            { id: 'institutional', label: '机构项目', keywords: [], enabled: true, sortOrder: 1, icon: '🏢' },
            { id: 'btc_opinion', label: 'BTC机构观点', keywords: [], enabled: true, sortOrder: 2, icon: '₿' },
        ],
    },
    {
        id: 'entertainment', label: '娱乐热点', description: '热点人物、市场叙事、Meme', color: 'text-pink-400 bg-pink-400/10', icon: '🎭', weight: 1, enabled: true, sortOrder: 7,
        children: [
            { id: 'musk_entertainment', label: '马斯克', keywords: [], enabled: true, sortOrder: 1, icon: '🚀' },
            { id: 'hot_person', label: '热点人物', keywords: [], enabled: true, sortOrder: 2, icon: '🌟' },
            { id: 'narrative', label: '市场叙事', keywords: [], enabled: true, sortOrder: 3, icon: '📖' },
            { id: 'meme', label: 'Meme', keywords: [], enabled: true, sortOrder: 4, icon: '🐸' },
            { id: 'community', label: '社区热点', keywords: [], enabled: true, sortOrder: 5, icon: '🔥' },
        ],
    },
];

// =========================================================================
// Props
// =========================================================================

interface TagCascadeSelectorProps {
    /** 当前选中的子标签 ID 集合 */
    selectedTags: Set<string>;
    /** 选中变化回调 */
    onSelectedChange: (tags: Set<string>) => void;
    /** 外部传入标签数据（可选，默认用 V1 静态数据） */
    tags?: ParentTag[];
}

// =========================================================================
// 组件
// =========================================================================

const TagCascadeSelector: React.FC<TagCascadeSelectorProps> = memo(({
    selectedTags,
    onSelectedChange,
    tags = V1_TAGS,
}) => {
    const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

    const enabledTags = useMemo(
        () => tags.filter(t => t.enabled).sort((a, b) => a.sortOrder - b.sortOrder),
        [tags],
    );

    const allChildIds = useMemo(
        () => new Set(enabledTags.flatMap(p => p.children.filter(c => c.enabled).map(c => c.id))),
        [enabledTags],
    );

    const isAllSelected = selectedTags.size === 0; // 空集 = 显示全部

    const toggleParentExpand = useCallback((parentId: string) => {
        setExpandedParents(prev => {
            const next = new Set(prev);
            if (next.has(parentId)) next.delete(parentId);
            else next.add(parentId);
            return next;
        });
    }, []);

    const toggleParentSelect = useCallback((parent: ParentTag) => {
        const childIds = parent.children.filter(c => c.enabled).map(c => c.id);
        const allChildSelected = childIds.every(id => selectedTags.has(id));
        const next = new Set(selectedTags);
        if (allChildSelected) {
            // 取消该母标签下所有子标签
            childIds.forEach(id => next.delete(id));
        } else {
            // 选中该母标签下所有子标签
            childIds.forEach(id => next.add(id));
        }
        onSelectedChange(next);
    }, [selectedTags, onSelectedChange]);

    const toggleChildSelect = useCallback((childId: string) => {
        const next = new Set(selectedTags);
        if (next.has(childId)) next.delete(childId);
        else next.add(childId);
        onSelectedChange(next);
    }, [selectedTags, onSelectedChange]);

    const clearAll = useCallback(() => {
        onSelectedChange(new Set());
    }, [onSelectedChange]);

    return (
        <div className="space-y-2">
            {/* 顶部操作栏 */}
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-dim">
                    {isAllSelected
                        ? '显示全部内容'
                        : `已选 ${selectedTags.size} / ${allChildIds.size} 标签`}
                </span>
                {!isAllSelected && (
                    <button
                        onClick={clearAll}
                        className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        清空筛选
                    </button>
                )}
            </div>

            {/* 母标签列表 */}
            <div className="flex flex-wrap gap-1.5">
                {enabledTags.map(parent => {
                    const childIds = parent.children.filter(c => c.enabled).map(c => c.id);
                    const selectedCount = childIds.filter(id => selectedTags.has(id)).length;
                    const isExpanded = expandedParents.has(parent.id);
                    const isParentActive = selectedCount > 0;

                    return (
                        <div key={parent.id} className="w-full">
                            {/* 母标签按钮行 */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => toggleParentSelect(parent)}
                                    className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg transition-all ${
                                        isParentActive
                                            ? `${parent.color} ring-1 ring-current/30`
                                            : 'bg-surface-hover/40 text-muted hover:text-primary'
                                    }`}
                                >
                                    <span>{parent.icon}</span>
                                    <span>{parent.label}</span>
                                    {selectedCount > 0 && (
                                        <span className="text-[9px] bg-card/10 px-1 rounded">
                                            {selectedCount}/{childIds.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => toggleParentExpand(parent.id)}
                                    className="text-muted hover:text-muted transition-colors text-[10px] px-1"
                                >
                                    {isExpanded ? '▼' : '▶'}
                                </button>
                            </div>

                            {/* 子标签展开区域 */}
                            {isExpanded && (
                                <div className="flex flex-wrap gap-1 mt-1 ml-4 mb-1">
                                    {parent.children
                                        .filter(c => c.enabled)
                                        .sort((a, b) => a.sortOrder - b.sortOrder)
                                        .map(child => {
                                            const isSelected = selectedTags.has(child.id);
                                            return (
                                                <button
                                                    key={child.id}
                                                    onClick={() => toggleChildSelect(child.id)}
                                                    className={`flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full transition-all ${
                                                        isSelected
                                                            ? `${parent.color} ring-1 ring-current/30`
                                                            : 'bg-surface/60 text-dim hover:text-secondary'
                                                    }`}
                                                >
                                                    {child.icon && <span className="text-[9px]">{child.icon}</span>}
                                                    <span>{child.label}</span>
                                                </button>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

TagCascadeSelector.displayName = 'TagCascadeSelector';
export default TagCascadeSelector;
