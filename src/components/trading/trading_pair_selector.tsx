/**
 * 交易对选择器组件（TradingPairSelector）
 *
 * 提供交易对搜索 & 快捷切换功能：
 *
 *   1. 搜索框：支持模糊搜索（BTC / btc / BTC/USDT ）
 *   2. 热门交易对快捷列表
 *   3. 点击选中后更新全局 Store 的 activeSymbol
 *   4. 下拉面板，点击外部自动关闭
 *
 * 使用方式：
 *   <TradingPairSelector />
 */
import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown, Star } from 'lucide-react';
import { useTradingStore } from '../../global_state_store/trading_global_state_store';
import { useTicker } from '../../global_state_store/market_data_store';
import { formatPrice, formatPercent, getPnlColorClass } from '../../hooks/use_format';

// =========================================================================
// 热门交易对预设（后续可从 API 获取）
// =========================================================================

const POPULAR_PAIRS = [
    'BTC/USDT',
    'ETH/USDT',
    'SOL/USDT',
    'BNB/USDT',
    'XRP/USDT',
    'DOGE/USDT',
    'ADA/USDT',
    'AVAX/USDT',
    'DOT/USDT',
    'MATIC/USDT',
    'LINK/USDT',
    'UNI/USDT',
];

// =========================================================================
// 组件
// =========================================================================

const TradingPairSelector = memo(function TradingPairSelector() {
    const activeSymbol = useTradingStore((s) => s.activeSymbol);
    const activeExchangeId = useTradingStore((s) => s.activeExchangeId);
    const setActiveSymbol = useTradingStore((s) => s.setActiveSymbol);

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // 当前选中交易对的 Ticker（用于展示实时价格）
    const currentTicker = useTicker(activeSymbol, activeExchangeId);

    // 过滤交易对列表
    const filteredPairs = POPULAR_PAIRS.filter((pair) =>
        pair.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // 点击外部关闭下拉面板
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // 打开面板时聚焦搜索框
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // 选择交易对
    const handleSelect = useCallback((pair: string) => {
        setActiveSymbol(pair);
        setIsOpen(false);
        setSearchQuery('');
    }, [setActiveSymbol]);

    // 从交易对中提取基础币种
    const baseCurrency = activeSymbol.split('/')[0] ?? activeSymbol;

    return (
        <div ref={dropdownRef} className="relative">
            {/* ─── 触发按钮 ───────────────────────────────────────── */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface hover:bg-surface-hover transition-colors border border-strong"
            >
                {/* 交易对名称 */}
                <span className="text-primary font-semibold text-base">
                    {activeSymbol}
                </span>

                {/* 实时价格 */}
                {currentTicker && (
                    <span className={`text-sm font-mono ${getPnlColorClass(currentTicker.changePercent)}`}>
                        {formatPrice(currentTicker.last)}
                    </span>
                )}

                {/* 涨跌幅 */}
                {currentTicker && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                        currentTicker.changePercent >= 0
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-red-500/20 text-red-500'
                    }`}>
                        {formatPercent(currentTicker.changePercent)}
                    </span>
                )}

                <ChevronDown
                    size={16}
                    className={`text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* ─── 下拉面板 ───────────────────────────────────────── */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-card border border-strong rounded-lg shadow-xl z-50 overflow-hidden">
                    {/* 搜索框 */}
                    <div className="p-3 border-b border-strong">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="搜索交易对..."
                                className="w-full pl-9 pr-3 py-2 bg-surface border border-strong rounded-md text-sm text-primary placeholder-dim focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* 交易对列表 */}
                    <div className="max-h-64 overflow-y-auto">
                        {filteredPairs.length === 0 ? (
                            <div className="p-4 text-center text-dim text-sm">
                                未找到匹配的交易对
                            </div>
                        ) : (
                            filteredPairs.map((pair) => (
                                <PairRow
                                    key={pair}
                                    pair={pair}
                                    exchangeId={activeExchangeId}
                                    isActive={pair === activeSymbol}
                                    onSelect={handleSelect}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

TradingPairSelector.displayName = 'TradingPairSelector';

// =========================================================================
// 交易对列表行
// =========================================================================

interface PairRowProps {
    pair: string;
    exchangeId: string;
    isActive: boolean;
    onSelect: (pair: string) => void;
}

const PairRow = memo(function PairRow({ pair, exchangeId, isActive, onSelect }: PairRowProps) {
    const ticker = useTicker(pair, exchangeId);
    const baseCurrency = pair.split('/')[0];

    return (
        <button
            onClick={() => onSelect(pair)}
            className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface transition-colors ${
                isActive ? 'bg-surface border-l-2 border-blue-500' : ''
            }`}
        >
            <div className="flex items-center gap-2">
                <Star size={14} className="text-secondary" />
                <span className="text-primary text-sm font-medium">{pair}</span>
            </div>

            <div className="flex items-center gap-3 text-right">
                <span className="text-primary text-sm font-mono">
                    {ticker ? formatPrice(ticker.last) : '--'}
                </span>
                <span className={`text-xs w-16 text-right ${
                    ticker ? getPnlColorClass(ticker.changePercent) : 'text-dim'
                }`}>
                    {ticker ? formatPercent(ticker.changePercent) : '--'}
                </span>
            </div>
        </button>
    );
});

PairRow.displayName = 'PairRow';

export { TradingPairSelector };
