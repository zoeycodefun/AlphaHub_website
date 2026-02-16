import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronDown, Settings, Clock, TrendingUp } from 'lucide-react';
import {
    type Exchange,
    NavigationItem,
    TimeZone,
    TradeCenterNavigationProps,
    TIMEZONE_CONFIG,
    getCurrentTimeInTimeZone,
    MAX_EXCHANGE_MENU_HEIGHT,
    MOBILE_MENU_MAX_HEIGHT,
    NAVIGATION_HEIGHT
} from '../page_type/trade_center_navigation_type';

// 防抖钩子
const useDebounce = (value: string, delay: number): string => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
};

// 桌面端交易所下拉组件
const ExchangeDropdown: React.FC<{
    currentExchange: Exchange | null;
    exchanges: readonly Exchange[];
    onExchangeChange: (exchange: Exchange) => void;
}> = ({ currentExchange, exchanges, onExchangeChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭下拉菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 键盘导航
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape') setIsOpen(false);
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen(!isOpen);
        }
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors min-w-[120px] text-left"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-900 truncate">
                    {currentExchange?.name || '选择交易所'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                    style={{ maxHeight: MAX_EXCHANGE_MENU_HEIGHT }}
                    role="listbox"
                >
                    {exchanges.map((exchange) => (
                        <button
                            key={exchange.id}
                            onClick={() => {
                                onExchangeChange(exchange);
                                setIsOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between ${
                                currentExchange?.id === exchange.id ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500' : 'text-gray-700'
                            }`}
                            role="option"
                            aria-selected={currentExchange?.id === exchange.id}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{exchange.name}</span>
                                {exchange.isActive && <div className="w-2 h-2 bg-green-400 rounded-full"></div>}
                            </div>
                            <div className="text-xs text-gray-500">
                                可用: ${exchange.balance.available.toFixed(2)} {exchange.balance.currency}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// 桌面端时区显示组件
const TimeZoneDisplay: React.FC<{
    currentTimeZone: TimeZone;
    onTimeZoneChange: (timezone: TimeZone) => void;
}> = ({ currentTimeZone, onTimeZoneChange }) => {
    const [currentTime, setCurrentTime] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 实时更新时间
    useEffect(() => {
        const updateTime = () => setCurrentTime(getCurrentTimeInTimeZone(currentTimeZone));
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [currentTimeZone]);

    // 点击外部关闭
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentConfig = TIMEZONE_CONFIG.find(tz => tz.id === currentTimeZone);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <Clock className="w-4 h-4 text-green-400" />
                <div className="text-left">
                    <div className="text-xs text-gray-500">{currentConfig?.country}</div>
                    <div className="text-sm font-medium text-gray-900">{currentTime}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className="absolute top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                    role="listbox"
                >
                    {TIMEZONE_CONFIG.map((timezone) => (
                        <button
                            key={timezone.id}
                            onClick={() => {
                                onTimeZoneChange(timezone.id);
                                setIsOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-150 ${
                                currentTimeZone === timezone.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                            }`}
                            role="option"
                            aria-selected={currentTimeZone === timezone.id}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium">{timezone.label}</div>
                                    <div className="text-xs text-gray-500">{timezone.country}</div>
                                </div>
                                <div className="text-xs text-gray-500 font-mono">
                                    {getCurrentTimeInTimeZone(timezone.id)}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// 页面导航组件
const PageNavigation: React.FC<{
    currentPage: string;
    onPageChange: (pageId: string) => void;
}> = ({ currentPage, onPageChange }) => {
    const navigationItems: readonly NavigationItem[] = useMemo(() => [
        { id: 'spot_trading', label: '现货交易', isActive: currentPage === 'spot_trading' },
        { id: 'contract_trading', label: '合约交易', isActive: currentPage === 'contract_trading' },
        { id: 'hedge_trade', label: '对冲交易', isActive: currentPage === 'hedge_trade' },
        { id: 'signals_analysis_center', label: '信号分析中心', isActive: currentPage === 'signals_analysis_center' },
        { id: 'position_management', label: '持仓管理', badge: '3', isActive: currentPage === 'position_management' },
        { id: 'new_token_sniping', label: '新币狙击', isActive: currentPage === 'new_token_sniping', isComingSoon: true },
        { id: 'signals_backtesting', label: '信号回测', isActive: currentPage === 'signals_backtesting' },
        { id: 'strategies_center', label: '策略中心', isActive: currentPage === 'strategies_center', isComingSoon: true },
        { id: 'profit_loss_analysis', label: '盈亏分析', isActive: currentPage === 'profit_loss_analysis' },
    ], [currentPage]);

    return (
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {navigationItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 whitespace-nowrap text-sm font-medium ${
                        item.isActive
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : item.isComingSoon
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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

// 移动端设置菜单组件
const MobileSettingsMenu: React.FC<{
    currentExchange: Exchange | null;
    exchanges: readonly Exchange[];
    currentTimeZone: TimeZone;
    onExchangeChange: (exchange: Exchange) => void;
    onTimeZoneChange: (timezone: TimeZone) => void;
}> = ({ currentExchange, exchanges, currentTimeZone, onExchangeChange, onTimeZoneChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    // 实时更新时间
    useEffect(() => {
        const updateTime = () => setCurrentTime(getCurrentTimeInTimeZone(currentTimeZone));
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [currentTimeZone]);

    // 点击外部关闭
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentConfig = TIMEZONE_CONFIG.find(tz => tz.id === currentTimeZone);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                aria-expanded={isOpen}
                aria-label="设置"
            >
                <Settings className="w-5 h-5 text-gray-600" />
            </button>

            {isOpen && (
                <div
                    className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                    style={{ maxHeight: MOBILE_MENU_MAX_HEIGHT }}
                >
                    {/* 时区设置 */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-green-400" />
                            <span className="text-sm font-medium text-gray-900">时区设置</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">{currentConfig?.country} - {currentConfig?.label}</div>
                        <div className="text-lg font-mono text-gray-900 mb-3">{currentTime}</div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {TIMEZONE_CONFIG.map((timezone) => (
                                <button
                                    key={timezone.id}
                                    onClick={() => onTimeZoneChange(timezone.id)}
                                    className={`w-full px-3 py-2 text-left rounded hover:bg-gray-50 transition-colors duration-150 ${
                                        currentTimeZone === timezone.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium">{timezone.label}</div>
                                            <div className="text-xs text-gray-500">{timezone.country}</div>
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono">
                                            {getCurrentTimeInTimeZone(timezone.id)}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 交易所设置 */}
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium text-gray-900">交易所设置</span>
                        </div>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                            {exchanges.map((exchange) => (
                                <button
                                    key={exchange.id}
                                    onClick={() => {
                                        onExchangeChange(exchange);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-3 py-2 text-left rounded hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between ${
                                        currentExchange?.id === exchange.id ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500' : 'text-gray-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{exchange.name}</span>
                                        {exchange.isActive && <div className="w-2 h-2 bg-green-400 rounded-full"></div>}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        可用: ${exchange.balance.available.toFixed(2)} {exchange.balance.currency}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 主导航组件
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

    // 检测移动端
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (isMobile) {
        return (
            <div
                className="fixed top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-40 px-4 py-3"
                style={{ height: NAVIGATION_HEIGHT }}
            >
                <div className="flex items-center justify-between h-full">
                    {/* 页面导航（可滑动） */}
                    <div className="flex-1 mr-4">
                        <PageNavigation currentPage={currentPage} onPageChange={onPageChange} />
                    </div>

                    {/* 设置按钮 */}
                    <MobileSettingsMenu
                        currentExchange={currentExchange}
                        exchanges={exchanges}
                        currentTimeZone={currentTimeZone}
                        onExchangeChange={onExchangeChange}
                        onTimeZoneChange={onTimeZoneChange}
                    />
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-40 px-4 py-3"
            style={{ height: NAVIGATION_HEIGHT }}
        >
            <div className="flex items-center justify-between h-full max-w-7xl mx-auto">
                {/* 左侧：页面导航 */}
                <div className="flex-1">
                    <PageNavigation currentPage={currentPage} onPageChange={onPageChange} />
                </div>

                {/* 右侧：工具栏 */}
                <div className="flex items-center gap-4 ml-8">
                    <ExchangeDropdown
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