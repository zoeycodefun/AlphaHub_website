import React, { useState, useCallback, memo } from 'react';
import { type TradeCenterNavigationProps, type Exchange, type NavigationItem, type TimeZone } from '../page_type/trade_center_navigation_type';
// trade center navigation component
const TradeCenterNavigation: React.FC<TradeCenterNavigationProps> = memo(({
    currentExchange,
    exchanges,
    currentTimeZone,
    currentPage,
    onExchangeChange,
    onTimeZoneChange,
    onPageChange,
}) => {
    const [isExchangeMenuOpen, setIsExchangeMenuOpen] = useState(false);
    const [isTimeZoneMenuOpen, setIsTimeZoneMenuOpen] = useState(false);
    // navigation config
    const navigationItems: NavigationItem[] = [
        // home page is spot trading(contract trading)
        {
            id: 'spot_trading',
            label: '现货交易',
            isActive: currentPage === 'spot_trading',
        },
        {
            id: 'contract_trading',
            label: '合约交易',
            isActive: currentPage === 'contract_trading',
        },
        {
            id: 'hedge_trade',
            label: '对冲交易',
            isActive: currentPage === 'hedge_trade',
        },
        {
            id: 'signals_analysis_center',
            label: '信号分析中心',
            isActive: currentPage === 'signals_analysis_center',
        },
        {
            id: 'position_management',
            label: '持仓管理',
            isActive: currentPage === 'position_management',
        },
        {
            id: 'new_token_sniping',
            label: '新币狙击',
            isActive: currentPage === 'new_token_sniping',
        },
        {
            id: 'signals_backtesting',
            label: '信号回测',
            isActive: currentPage === 'signals_backtesting',
        },
        {
            id: 'strategies_center',
            label: '策略中心',
            isActive: currentPage === 'strategies_center',
        },
        {
            id: 'profit_loss_analysis',
            label: '盈亏分析',
            isActive: currentPage === 'profit_loss_analysis',
        },
    ];
    // exchange shift
})