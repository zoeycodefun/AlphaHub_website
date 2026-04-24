// pages config interface
export interface PageConfig {
    readonly id: string;
    readonly path: string;
    readonly component: () => Promise<{ default: React.ComponentType}>;
    readonly isComingSoon?: boolean;
    readonly requiredPermissions?: readonly string[];
}

// page config array
export const PAGE_CONFIGS: readonly PageConfig[] = [
    {
        id: 'spot',
        path: '/trade_center/spot',
        component: () => import('../spot_trading_page.tsx'),
    },
    {
        id: 'futures',
        path: '/trade_center/futures',
        component: () => import('../futures_trading_page.tsx'),
    },
    {
        id: 'hedge_trade',
        path: '/trade_center/hedge_trade',
        component: () => import('../hedge_trade_page'),
    },
    {
        id: 'signals_analytics_center',
        path: '/trade_center/signals_analysis_center',
        component: () => import('../signals_analysis_center'),
    },
    {
        id: 'altcoin_position_management',
        path: '/trade_center/altcoin_position_management',
        component: () => import('../altcoin_position_management_page'),
    },
    {
        id: 'new_token_sniping',
        path: '/trade_center/new_token_sniping',
        component: () => import('../new_coins_monitor_page'),
    },
    {
        id: 'signals_backtesting',
        path: '/trade_center/signals_backtesting',
        component: () => import('../signals_backtesting_page'),
    },
    {
        id: 'strategy_center',
        path: '/trade_center/strategy_center',
        component: () => import('../strategy_center_page.tsx'),
    },
    {
        id: 'profit_loss_analysis',
        path: '/trade_center/profit_loss_analysis',
        component: () => import('../profit_loss_analysis_page'),
    },
    {
        id: 'trader_growth_archive',
        path: '/trade_center/trader_growth_archive',
        component: () => import('../trader_growth_archive_page'),
    },
    {
        id: 'risk_management_hub',
        path: '/trade_center/risk_management_hub',
        component: () => import('../risk_management_hub_page'),
    }
] as const;
