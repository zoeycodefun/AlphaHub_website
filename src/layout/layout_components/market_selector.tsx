import { useMarketSwitchStore } from "../../global_state_store/market_switch_global_state_store" // 引入市场选择的全局状态store钩子
import React, { useState, useCallback, useRef, useEffect, memo } from "react";
/**
 * market type selector component
 */

interface MarketOption {
    value: string;
    label: string;
    enabled: boolean;
}

const MARKET_OPTIONS: readonly MarketOption[] = [
    {value: 'cryptocurrency_web3', label: '加密资产与web3', enabled: true},
    {value: 'us_stock', label: '美股', enabled: false},
    {value: 'commodities', label: '商品', enabled: false},
    {value: 'forex', label:'外汇', enabled: false},
    {value: 'equity_index', label:'指数', enabled: false},
    {value: 'interest_rate', label:'债务利率', enabled: false},
] as const;


const MarketSelector: React.FC = memo(() => {
    const { selectedMarket, setSelectedMarket } = useMarketSwitchStore();
    const [openMarketSwitchMenu, setOpenMarketSwitchMenu] = useState(false);
    
    const marketSwitchMenuRef = useRef<HTMLDivElement>(null);

    const currentChooseMarketLabel = MARKET_OPTIONS.find(
        (market) => market.value === selectedMarket
    )?.label || '选择市场';

    
    const toggleMarketSwitchMenu = useCallback(() => {
        setOpenMarketSwitchMenu((prev) => !prev);
    }, []);
    const closeMarketSwitchMenu = useCallback(()=> {
        setOpenMarketSwitchMenu(false);
    }, []);


    
    const handleMarketSelect = useCallback((value: string) => {
        setSelectedMarket(value)
        closeMarketSwitchMenu();
    }, [setSelectedMarket, closeMarketSwitchMenu]);


    const handleKeyboardDown = useCallback((event: React.KeyboardEvent, marketValue?: string) => {
        if (event.key === 'Escape') {
            closeMarketSwitchMenu();
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (marketValue) {
                handleMarketSelect(marketValue);
            } else {
                toggleMarketSwitchMenu();
            }
        } else if (event.key === 'ArrowDown' && !marketValue) {
            event.preventDefault();
            setOpenMarketSwitchMenu(true);
        }
    }, [closeMarketSwitchMenu, handleMarketSelect, toggleMarketSwitchMenu]);


    useEffect(() => {
        if (!openMarketSwitchMenu) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (marketSwitchMenuRef.current && !marketSwitchMenuRef.current.contains(event.target as Node)) {
                closeMarketSwitchMenu();
            }
        };


        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMarketSwitchMenu, closeMarketSwitchMenu]);



    return (
        <div className="relative"
        ref= {marketSwitchMenuRef}
        >
            <button
            onClick={toggleMarketSwitchMenu}
            onKeyDown={(event) => handleKeyboardDown(event)}
            className={`relative flex items-center justify-between w-full px-1 py-1 text-[10px] sm:text-[14px] lg:text-[15px] text-gray-900 border-gray-300
            rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-100 transition-all
            duration-200 ease-in-out 
            ${openMarketSwitchMenu ? 'ring-2 ring-blue-100 border-blue-100':''}
    `}
            aria-haspopup="listbox"
            aria-expanded={openMarketSwitchMenu}
            aria-label={`当前市场：${currentChooseMarketLabel}`}
            >
                <span>{currentChooseMarketLabel}</span>
                <svg
                    className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${
                    openMarketSwitchMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            </button>


            {openMarketSwitchMenu && (
                <ul
                className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-lg max-h-80 overflow-y-auto scrollbar-hide
                fade-in
                "
                role="listbox"
                aria-label="市场选择菜单"
                >
                   {MARKET_OPTIONS.map((market) => (
                    <li
                    key={market.value}
                    onClick={() => market.enabled && handleMarketSelect(market.value)}
                    onKeyDown={(event) => market.enabled && handleKeyboardDown(event, market.value)}
                    className={`
                        px-2 py-2 relativetransition-colors cursor-pointer 
                        ${market.value === selectedMarket ? 'bg-blue-50':'text-grey-700'}
                        ${market.enabled ? 'hover:bg-grey-100':'opcity-50 cursor-not-allowed'}
                        `}
                    role="option"
                    aria-selected={market.value === selectedMarket}
                    aria-disabled={!market.enabled}

                    >
                        <div className="flex items-center justify-center">
                            <span className="text-[13px]">{market.label}</span>
                            
                            {market.value === selectedMarket && (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        
                            {!market.enabled && (
                                <span></span>
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

