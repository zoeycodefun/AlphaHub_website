import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronDown, Settings, Clock, TrendingUp } from 'lucide-react';
import {
    type Exchange,
    type NavigationItem,
    type TimeZone,
    type TradeCenterNavigationProps,
    TIMEZONE_CONFIG,
    getCurrentTimeInTimeZone,
    MAX_EXCHANGE_MENU_HEIGHT,
    // MOBILE_MENU_MAX_HEIGHT,
    NAVIGATION_HEIGHT
} from '../type/trade_center_navigation_type';

// debounce hook
/*
const useDebounce = (value: string, delay: number): string => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
};
*/
// desktop exchange dropdown menu component
const ExchangeDropdownMenu: React.FC<{
    currentExchange: Exchange | null;
    exchanges: readonly Exchange[];
    onExchangeChange: (exchange: Exchange) => void;
}> = ({ currentExchange, exchanges, onExchangeChange }) => {
    const [isOpenExchangeDropdownMenu, setIsOpenExchangeDropdownMenu] = useState(false);
    const exchangeDropdownRef = useRef<HTMLDivElement>(null);

    // click outside to close exchange dropdown menu 
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exchangeDropdownRef.current && !exchangeDropdownRef.current.contains(event.target as Node)) {
                setIsOpenExchangeDropdownMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // keyboard navigation
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape') setIsOpenExchangeDropdownMenu(false);
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpenExchangeDropdownMenu(!isOpenExchangeDropdownMenu);
        }
    }, [isOpenExchangeDropdownMenu]);

    return (
        <div className="relative" ref={exchangeDropdownRef}>
            <button
                onClick={() => setIsOpenExchangeDropdownMenu(!isOpenExchangeDropdownMenu)}
                onKeyDown={handleKeyDown}
                className="flex items-center gap-2 px-3 py-2 bg-surface hover:bg-surface-hover rounded-lg transition-colors min-w-[200px] text-left"
                aria-expanded={isOpenExchangeDropdownMenu}
                aria-haspopup="listbox"
            >
            {/**❌ check if the exchange name changes after selecting an exchange from the dropdown menu  */}
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-primary truncate">
                    {currentExchange?.name || 'choose exchange'}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${isOpenExchangeDropdownMenu ? 'rotate-180' : ''}`} />
            </button>
            {/** ❌ there should be two changes when opening the exchange dropdown menu: the selected exchange should change, and the dropdown menu should also be selected */}
            {isOpenExchangeDropdownMenu && (
                <div
                    className="absolute top-full mt-1 w-full bg-surface border border-strong rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                    style={{ maxHeight: MAX_EXCHANGE_MENU_HEIGHT }}
                    role="listbox"
                >
                    {exchanges.map((exchange) => (
                        <button
                            key={exchange.id}
                            onClick={() => {
                                // ❌not only should the selected exchange change, but the dropdown menu should also be selected
                                onExchangeChange(exchange);
                                setIsOpenExchangeDropdownMenu(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-surface-hover transition-colors duration-150 flex items-center justify-between 
                                ${currentExchange?.id === exchange.id ? 'bg-blue-900/40 text-blue-400 border-l-4 border-blue-500' : 'text-secondary'
                            }`}
                            role="option"
                            aria-selected={currentExchange?.id === exchange.id}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{exchange.name}</span>
                                {exchange.isActive && <div className="w-2 h-2 bg-green-400 rounded-full"></div>}
                            </div>
                            {/** ❌ balance format function */}
                            <div className="text-xs text-dim">
                                Avaliable: ${exchange.balance.available.toFixed(2)} {exchange.balance.currency}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// desktop timezone display component
// ❌ display the current time in the selected timezone, and update it every second
const TimeZoneDisplay: React.FC<{
    currentTimeZone: TimeZone;
    onTimeZoneChange: (timezone: TimeZone) => void;
}> = ({ currentTimeZone, onTimeZoneChange }) => {
    const [currentTime, setCurrentTime] = useState('');
    const [isOpenTimeZoneMenu, setIsOpenTimeZoneMenu] = useState(false);
    const timezoneDropdownRef = useRef<HTMLDivElement>(null);

    // update current time every second based on the selected timezone
    useEffect(() => {
        const updateTime = () => setCurrentTime(getCurrentTimeInTimeZone(currentTimeZone));
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [currentTimeZone]);

    // handle click outside to close timezone dropdown menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (timezoneDropdownRef.current && !timezoneDropdownRef.current.contains(event.target as Node)) {
                setIsOpenTimeZoneMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentConfig = TIMEZONE_CONFIG.find(timezone => timezone.id === currentTimeZone);

    return (
        <div className="relative" ref={timezoneDropdownRef}>
            <button
                onClick={() => setIsOpenTimeZoneMenu(!isOpenTimeZoneMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-surface hover:bg-surface-hover rounded-lg transition-colors min-w-[120px]"
                aria-expanded={isOpenTimeZoneMenu}
                aria-haspopup="listbox"
            >
                <Clock className="w-4 h-4 text-green-400" />
                <div className="text-left">
                    <div className="text-xs text-dim">{currentConfig?.country}</div>
                    <div className="text-sm font-medium text-primary">{currentTime}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 
                    ${isOpenTimeZoneMenu ? 'rotate-180' : ''}`} />
            </button>
            {/** ❌ when open timezone menu, ensure it can be scrolled and show the time of specific timezone when choose */}
            {isOpenTimeZoneMenu && (
                <div
                    className="scrollbar-hide absolute top-full mt-1  w-[12vw] bg-surface border border-strong rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                    role="listbox"
                >
                    {TIMEZONE_CONFIG.map((timezone) => (
                        <button
                            key={timezone.id}
                            onClick={() => {
                                onTimeZoneChange(timezone.id);
                                setIsOpenTimeZoneMenu(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-surface-hover transition-colors duration-150 
                                ${currentTimeZone === timezone.id ? 'bg-blue-900/40 text-blue-400' : 'text-secondary'
                            }`}
                            role="option"
                            aria-selected={currentTimeZone === timezone.id}
                        >
                            <div className="flex items-center gap-4">
                                    <div className="text-xs font-medium">{timezone.label}</div>
                                    <div className="text-xs text-dim">{timezone.country}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};


// page navigation component
const PageNavigation: React.FC<{
    currentPage: string;
    onPageChange: (pageId: string) => void;
}> = ({ currentPage, onPageChange }) => {
    const navigationItems: readonly NavigationItem[] = useMemo(() => [
        { id: 'spot', label: 'Spot', isActive: currentPage === 'spot' },
        { id: 'futures', label: 'Futures', isActive: currentPage === 'futures' },
        { id: 'hedge_trade', label: 'Hedging Trading', isActive: currentPage === 'hedge_trade' },
        { id: 'signals_analytics_center', label: 'Signals Center', isActive: currentPage === 'signals_analytics_center' },
        { id: 'altcoin_position_management', label: 'Position Management', badge: '3', isActive: currentPage === 'altcoin_position_management' },
        { id: 'new_token_sniping', label: 'Token Sniping', isActive: currentPage === 'new_token_sniping' },
        { id: 'signals_backtesting', label: 'Signals Backtesting', isActive: currentPage === 'signals_backtesting' },
        { id: 'strategy_center', label: 'Strategy Center', isActive: currentPage === 'strategy_center'},
        { id: 'profit_loss_analysis', label: 'P&L Analytics', isActive: currentPage === 'profit_loss_analysis' },
        { id: 'trader_growth_archive', label: 'Growth Archive', isActive: currentPage === 'trader_growth_archive' },
        { id: 'risk_management_hub', label: 'Risk Hub', isActive: currentPage === 'risk_management_hub' },
    ], [currentPage]);

    return (
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {navigationItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 whitespace-nowrap text-sm font-medium
                        ${item.isActive
                            ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50'
                            : item.isComingSoon
                            ? 'text-secondary cursor-not-allowed'
                            : 'text-muted hover:bg-surface hover:text-primary'
                    } ${item.isComingSoon ? 'opacity-50' : ''}`}
                    disabled={item.isComingSoon}
                >
                    {item.label}
                    {item.badge && (
                        <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            {item.badge}
                        </span>
                    )}
                </button>
            ))}
        </nav>
    );
};

// ❌ mobile settings menu component--just have one icon and full-screen menu when clicking the icon, the menu should include timezone settings, exchange settings and page navigation
const MobileNavigationMenu: React.FC<{
    isOpenMobileNavigationMenu: boolean;
    onClose: () => void;
    currentExchange: Exchange | null;
    exchanges: readonly Exchange[];
    currentTimeZone: TimeZone;
    currentPage: string;
    onExchangeChange: (exchange: Exchange) => void;
    onTimeZoneChange: (timezone: TimeZone) => void;
    onPageChange: (pageId: string) => void;
}> = ({ 
    isOpenMobileNavigationMenu,
    onClose,
    currentExchange,
    exchanges,
    currentTimeZone,
    currentPage,
    onExchangeChange,
    onTimeZoneChange,
    onPageChange
}) => {
    const [currentTime, setCurrentTime] = useState('');
    const timezoneMenuRef = useRef<HTMLDivElement>(null);

    // update current time every second based on the selected timezone
    useEffect(() => {
        const updateTime = () => setCurrentTime(getCurrentTimeInTimeZone(currentTimeZone));
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [currentTimeZone]);

    // close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (timezoneMenuRef.current && !timezoneMenuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpenMobileNavigationMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpenMobileNavigationMenu, onClose]);
    
    // close on escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpenMobileNavigationMenu) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpenMobileNavigationMenu, onClose]);

    const currentConfig = TIMEZONE_CONFIG.find(timezone => timezone.id === currentTimeZone);

    if (!isOpenMobileNavigationMenu) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
            <div
            ref={timezoneMenuRef}
            className='w-full bg-card rounded-t-lg max-h-[90vh] overflow-y-auto border-t border-strong'
            style={{maxHeight: '90vh'}}
            >
                {/** header */}
                <div className='flex items-center justify-between p-4 border-b border-base'>
                    <p className='text-lg font-semibold text-primary'>Navigation Settings</p>
                    <button
                    onClick={onClose}
                    className='p-2 hover:bg-surface rounded-lg transition-colors'
                    aria-label="close"
                    >
                        <ChevronDown className='w-5 h-5 text-dim rotate-45' />
                    </button>
                </div>
                {/** content */}
                <div className='p-4 space-y-6'>
                    {/** page navigation */}
                    <div>
                        <div className='flex items-center gap-2 mb-3'>
                            <span className='text-sm font-medium text-primary'>Navigation</span>
                        </div>
                        <div className='grid grid-cols-2 gap-2'>
                            {[
                                { id: 'spot', label: 'Spot' },
                                { id: 'futures', label: 'Futures' },
                                { id: 'hedge_trade', label: 'Hedging Trading' },
                                { id: 'signals_analytics_center', label: 'Signals Center' },
                                { id: 'altcoin_position_management', label: 'Position Management' },
                                { id: 'new_token_sniping', label: 'Token Sniping' },
                                { id: 'signals_backtesting', label: 'Signals Backtesting' },
                                { id: 'strategy_center', label: 'Strategy Center'},
                                { id: 'profit_loss_analysis', label: 'P&L Analytics' },
                                { id: 'trader_growth_archive', label: 'Growth Archive' },
                                { id: 'risk_management_hub', label: 'Risk Hub' },
                            ].map((item) => (
                                <button
                                key={item.id}
                                onClick={() => {
                                    onPageChange(item.id);
                                    onClose;
                                }}
                                className={`p-3 rounded-lg transition-colors text-left
                                    ${currentPage === item.id 
                                        ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50'
                                        : 'text-secondary hover:bg-surface'
                                    }`}
                                >
                                    <div className='text-sm font-medium'>{item.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                    {/** timezone settings
                     * ❌ mobile timezone should also show the realtime of the selected timezone, shows on the top
                     */}
                    <div 
                    className='flex items-center gap-2 mb-3'
                    >
                        <Clock className='w-4 h-4 text-green-400'/>
                        <span className='text-sm font-medium text-primary'>Timezone Settings</span>
                    </div>
                    <div className='text-xs text-dim mb-2'>{currentConfig?.country} - {currentConfig?.label}</div>
                    <div className='text-lg font-mono text-primary mb-3'>{currentTime}</div>
                    <div className='space-y-2 max-h-40 overflow-y-auto'>
                        {TIMEZONE_CONFIG.map((timezone) => (
                            <button 
                            key={timezone.id}
                            onClick={() => onTimeZoneChange(timezone.id)}
                            className={`w-full px-3 py-2 text-left rounded hover:bg-surface transition-colors duration-150
                                ${currentTimeZone === timezone.id ? 'bg-blue-900/40 text-blue-400' : 'text-secondary'}`}
                            >
                                <div className='flex items-center justify-between'>
                                    <div className=''>
                                        <div className='text-sm font-medium'>{timezone.label}</div>
                                        <div className='text-xs text-dim'>{timezone.country}</div>
                                    </div>
                                    <div className='text-xs text-dim font-mono'>
                                        {getCurrentTimeInTimeZone(timezone.id)}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                {/** exchange settings
                 * ❌ check if it can be choosed and showed
                 */}
                <div>
                    <div className='flex items-center gap-2 mb-3'>
                        <TrendingUp className='w-4 h-4 text-blue-400'/>
                        <span className='text-sm font-medium text-primary'>Exchanges Settings</span>
                    </div>
                    <div className='space-y-2 max-h-40 overflow-y-auto'>
                        {exchanges.map((exchange) => (
                            <button 
                            key={exchange.id}
                            onClick={() => {
                                onExchangeChange(exchange);
                                onClose();
                            }}
                            className={`w-full px-3 py-2 text-left rounded hover:bg-surface transition-colors duration-150 flex items-center justify-between
                                ${currentExchange?.id === exchange.id ? 'bg-blue-900/40 text-blue-400 border-l-4 border-blue-500' : 'text-secondary'}`}
                            >
                                <div className='flex items-center gap-2'>
                                    <span className='text-sm font-medium'>{exchange.name}</span>
                                    {/** green point to indicate exchange active */}
                                    {exchange.isActive && <div className='w-2 h-2 bg-green-400 rounded-full'></div>}
                                </div>
                                <div className='text-xs text-dim'>
                                    Avaliable: ${exchange.balance.available.toFixed(2)} {exchange.balance.currency}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// main navigation component(desktop)
const TradeCenterNavigation: React.FC<TradeCenterNavigationProps> = ({
    currentExchange,
    exchanges,
    currentTimeZone,
    currentPage,
    onExchangeChange,
    onTimeZoneChange,
    onPageChange,
}) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isMobileNavigationMenuOpen, setIsMobileNavigationMenuOpen] = useState(false);

    // detect mobile
    useEffect(() => {
        const checkIfMobile = () => setIsMobile(window.innerWidth < 1280);
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    if (isMobile) {
        return (
            <>
            <div
                className="fixed top-16 left-0 right-0 bg-card border-b border-base shadow-sm z-40 px-4 py-3"
                style={{ height: NAVIGATION_HEIGHT }}
            >
                <div className="flex items-center justify-end h-full">
                    {/** settings button(specific for mobile) */}
                    <button 
                    onClick={() => setIsMobileNavigationMenuOpen(true)}
                    className='p-2 bg-surface rounded-lg hover:bg-surface-hover transition-colors '
                    aria-label="navigation settings"
                    >
                        <Settings className='w-5 h-5 text-secondary'/>
                    </button>
                </div>
            </div>
            <MobileNavigationMenu
                isOpenMobileNavigationMenu={isMobileNavigationMenuOpen}
                onClose={() => setIsMobileNavigationMenuOpen(false)}
                currentExchange={currentExchange}
                exchanges={exchanges}
                currentTimeZone={currentTimeZone}
                currentPage={currentPage}
                onExchangeChange={onExchangeChange}
                onTimeZoneChange={onTimeZoneChange}
                onPageChange={onPageChange}
            />
            </>
        );
    }

    return (
        <div
            className="fixed top-16 left-0 right-0 bg-card border-b border-base shadow-sm z-40 px-4 py-3"
            style={{ height: NAVIGATION_HEIGHT }}
        >
            <div className="flex items-center justify-between h-full max-w-7xl mx-auto">
                {/* left: page navigation */}
                <div className="flex-1 min-w-0">
                    <PageNavigation currentPage={currentPage} onPageChange={onPageChange} />
                </div>

                {/* right: toolbar */}
                <div className="flex items-center gap-4 ml-8">
                    <ExchangeDropdownMenu
                        currentExchange={currentExchange}
                        exchanges={exchanges}
                        onExchangeChange={onExchangeChange}
                    />
                    <TimeZoneDisplay
                        currentTimeZone={currentTimeZone}
                        onTimeZoneChange={onTimeZoneChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default TradeCenterNavigation;
