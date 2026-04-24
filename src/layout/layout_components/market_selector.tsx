import { useMarketSwitchStore } from '../../global_state_store/market_switch_global_state_store';
import type { MarketSector } from '../../global_state_store/market_switch_global_state_store';
import React, { useState, useCallback, useRef, useEffect, memo } from 'react';

/**
 * Market Selector
 *
 * 数据驱动的市场板块选择器：
 *   - 板块列表从 Zustand store 读取（由后端 /api/market-config 填充）
 *   - 新增市场只需后端配置，前端零改动
 *   - 禁用板块自动灰化、禁止选择
 *   - 键盘导航 + ARIA 可访问性
 */

const MarketSelector: React.FC = memo(() => {
    const { selectedMarket, setSelectedMarket, sectors, fetchMarketConfig } = useMarketSwitchStore();
    const [openMarketSwitchMenu, setOpenMarketSwitchMenu] = useState(false);
    const marketSwitchMenuRef = useRef<HTMLDivElement>(null);

    // 首次挂载时从后端拉取最新板块配置
    useEffect(() => {
        fetchMarketConfig();
    }, [fetchMarketConfig]);

    const currentSector: MarketSector | undefined = sectors.find(s => s.id === selectedMarket);
    const currentLabel = currentSector?.label ?? 'Choose Market';

    const toggleMarketSwitchMenu = useCallback(() => {
        setOpenMarketSwitchMenu(prev => !prev);
    }, []);

    const closeMarketSwitchMenu = useCallback(() => {
        setOpenMarketSwitchMenu(false);
    }, []);

    const handleMarketSelect = useCallback((sector: MarketSector) => {
        if (!sector.enabled) return;
        setSelectedMarket(sector.id);
        closeMarketSwitchMenu();
    }, [setSelectedMarket, closeMarketSwitchMenu]);

    const handleKeyboardDown = useCallback((event: React.KeyboardEvent, sector?: MarketSector) => {
        if (event.key === 'Escape') {
            closeMarketSwitchMenu();
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (sector) {
                handleMarketSelect(sector);
            } else {
                toggleMarketSwitchMenu();
            }
        } else if (event.key === 'ArrowDown' && !sector) {
            event.preventDefault();
            setOpenMarketSwitchMenu(true);
        }
    }, [closeMarketSwitchMenu, handleMarketSelect, toggleMarketSwitchMenu]);

    // 点击外部关闭
    useEffect(() => {
        if (!openMarketSwitchMenu) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (marketSwitchMenuRef.current && !marketSwitchMenuRef.current.contains(event.target as Node)) {
                closeMarketSwitchMenu();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMarketSwitchMenu, closeMarketSwitchMenu]);

    return (
        <div className="relative" ref={marketSwitchMenuRef}>
            <button
                onClick={toggleMarketSwitchMenu}
                onKeyDown={(event) => handleKeyboardDown(event)}
                className={`relative flex items-center justify-between w-full px-4 py-2 text-[10px] sm:text-[14px] lg:text-[13px] text-primary border-strong
                    rounded-full hover:bg-surface focus:outline-none focus:ring-2 focus:ring-blue-900/50 focus:border-blue-700 transition-all duration-200 ease-in-out
                    ${openMarketSwitchMenu ? 'ring-2 ring-blue-100 border-blue-100' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={openMarketSwitchMenu}
                aria-label={`current market: ${currentLabel}`}
            >
                <span>{currentLabel}</span>
                <svg
                    className={`w-3 h-3 text-dim transition-transform duration-200 ${openMarketSwitchMenu ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {openMarketSwitchMenu && (
                <ul
                    className="absolute top-full left-0 right-0 z-50 mt-1 bg-card rounded-lg max-h-80 overflow-y-auto scrollbar-hide fade-in"
                    role="listbox"
                    aria-label="market options"
                >
                    {sectors.map((sector) => (
                        <li
                            key={sector.id}
                            onClick={() => handleMarketSelect(sector)}
                            onKeyDown={(event) => handleKeyboardDown(event, sector)}
                            className={`px-1 py-2 relative transition-colors cursor-pointer flex items-center justify-center
                                ${sector.id === selectedMarket ? 'bg-blue-900/30' : 'text-secondary'}
                                ${sector.enabled ? 'hover:bg-surface-hover/50' : 'opacity-50 cursor-not-allowed'}`}
                            role="option"
                            aria-selected={sector.id === selectedMarket}
                            aria-disabled={!sector.enabled}
                            tabIndex={sector.enabled ? 0 : -1}
                        >
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-[13px]">{sector.label}</span>
                                {sector.id === selectedMarket && (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
});

MarketSelector.displayName = 'MarketSelector';
export default MarketSelector;

