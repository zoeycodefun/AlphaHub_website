/**
 * 新币筛选栏（New Coin Filter Bar）
 *
 * 水平筛选条，支持：
 *  - 关键词搜索
 *  - 按链筛选（All/Solana/Ethereum/BSC/Base/Arbitrum）
 *  - 按热度筛选（全部/热门/温热/冷门）
 *  - 按来源筛选
 */
import React, { memo } from 'react';
import type { CoinHeatLevel, NewCoinSource } from '../../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface NewCoinFilterBarProps {
    keyword: string;
    onKeywordChange: (v: string) => void;
    selectedChain: string;
    onChainChange: (v: string) => void;
    selectedHeat: CoinHeatLevel | 'all';
    onHeatChange: (v: CoinHeatLevel | 'all') => void;
    selectedSource: NewCoinSource | 'all';
    onSourceChange: (v: NewCoinSource | 'all') => void;
}

// =========================================================================
// 选项常量
// =========================================================================

const CHAIN_OPTIONS = ['all', 'Solana', 'Ethereum', 'BSC', 'Base', 'Arbitrum'];
const HEAT_OPTIONS: { value: CoinHeatLevel | 'all'; label: string }[] = [
    { value: 'all', label: '全部热度' },
    { value: 'hot', label: '🔥 热门' },
    { value: 'warm', label: '🌡️ 温热' },
    { value: 'cold', label: '❄️ 冷门' },
];
const SOURCE_OPTIONS: { value: NewCoinSource | 'all'; label: string }[] = [
    { value: 'all', label: '全部来源' },
    { value: 'dexscreener', label: 'DexScreener' },
    { value: 'birdeye', label: 'Birdeye' },
    { value: 'cex_listing', label: 'CEX 上币' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'onchain', label: '链上监控' },
];

// =========================================================================
// 主组件
// =========================================================================

const NewCoinFilterBar: React.FC<NewCoinFilterBarProps> = memo(({
    keyword, onKeywordChange,
    selectedChain, onChainChange,
    selectedHeat, onHeatChange,
    selectedSource, onSourceChange,
}) => {
    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4 space-y-3">
            {/* 第一行：搜索框 */}
            <input
                type="text"
                value={keyword}
                onChange={(e) => onKeywordChange(e.target.value)}
                placeholder="搜索币种名称/Symbol..."
                className="w-full bg-card/60 border border-strong/50 rounded-lg px-4 py-2 text-sm text-primary placeholder-gray-600 outline-none focus:border-blue-500/50"
            />

            {/* 第二行：链 + 热度 + 来源筛选 */}
            <div className="flex flex-wrap gap-2">
                {/* 链筛选 */}
                {CHAIN_OPTIONS.map((chain) => (
                    <button
                        key={chain}
                        onClick={() => onChainChange(chain)}
                        className={`text-xs px-3 py-1 rounded-full transition-colors ${
                            selectedChain === chain
                                ? 'bg-blue-600 text-white'
                                : 'bg-surface-hover/50 text-muted hover:text-primary'
                        }`}
                    >
                        {chain === 'all' ? '全部链' : chain}
                    </button>
                ))}

                {/* 分隔线 */}
                <div className="w-px h-6 bg-surface-hover/50 self-center mx-1" />

                {/* 热度筛选 */}
                {HEAT_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onHeatChange(opt.value)}
                        className={`text-xs px-3 py-1 rounded-full transition-colors ${
                            selectedHeat === opt.value
                                ? 'bg-orange-600 text-white'
                                : 'bg-surface-hover/50 text-muted hover:text-primary'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}

                {/* 分隔线 */}
                <div className="w-px h-6 bg-surface-hover/50 self-center mx-1" />

                {/* 来源筛选 */}
                <select
                    value={selectedSource}
                    onChange={(e) => onSourceChange(e.target.value as NewCoinSource | 'all')}
                    className="text-xs bg-surface-hover/50 border border-strong/50 text-secondary rounded-lg px-2 py-1 outline-none"
                >
                    {SOURCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
        </div>
    );
});

NewCoinFilterBar.displayName = 'NewCoinFilterBar';
export default NewCoinFilterBar;
