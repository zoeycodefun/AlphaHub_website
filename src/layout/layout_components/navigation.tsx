// navigation
import { Link, useLocation } from 'react-router-dom';
import React, { memo, useCallback, useMemo } from 'react';

/**
 * navigation component: only display horizontal scrollable navigation bar on desktop
 */


interface NavigationItem {
    readonly id: string;
    readonly path: string;
    readonly label: string;
    readonly icon: React.ReactElement;
    readonly disabled?: boolean;
}


const NAVIGATION_CONFIG: readonly NavigationItem[] = [
    {
        id: 'dashboard',
        path: '/',
        label: 'Dashboard',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
            </svg>
        ),
    },
    {
        id: 'market_intelligence',
        path: '/market_intelligence',
        label: 'Market Intelligence',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    },
    {
        id: 'investment_research',
        path: '/investment_research',
        label: 'Investment Research',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        )
    },
    {
        id: 'trading_center',
        path: '/trading_center',
        label: 'Trading Center',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
        )
    },
    {
        id: 'ai_model_training',
        path: '/ai_model_training',
        label: 'AI Models',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        )
    },
] as const;


interface NavigationItemProps {
    item: NavigationItem;
    isActive: boolean;
}
const NavigationItemComponents: React.FC<NavigationItemProps> = memo(({
    item,
    isActive,
}) => {
    return (
        <Link
        to={item.path}
        className={`w-60 group flex items-center px-2 py-2 rounded-full text-sm lg:text-[14px] transition-all duration-200 ease-in-out whitespace-nowrap
            ${isActive ? 'bg-blue-900/30 text-blue-400' : 'text-muted hover:bg-surface hover:text-primary'}
            ${item.disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
            `}
            aria-current={isActive ? 'page' : undefined}
            title={item.label}
        >
            <span className={`mr-2 transition-colors duration-200
                ${isActive ? 'text-blue-400' : 'text-dim group-hover:text-secondary'}
                `}>
                    {item.icon}
            </span>
            <span className='w-20'>
                {item.label}
            </span>
            
        </Link>
    );
});
NavigationItemComponents.displayName = 'NavigationItemComponents';


interface NavigationProps {
    className?: string;
}
const Navigation: React.FC<NavigationProps> = memo(({
    className = '',
}) => {
    const currentLocation = useLocation();
    const getIsNavigationItemActive = useCallback((item: NavigationItem): boolean => {
        
        // as for trading center, support nested route matching
        if (item.path === '/trading_center') {
            return currentLocation.pathname.startsWith('/trading_center');
        }
        if (item.path === '/ai_model_training') {
            return currentLocation.pathname.startsWith('/ai_model_training');
        }
        return currentLocation.pathname === item.path;
    }, [currentLocation.pathname]);
    
    // filter available navigation items, memoized for performance optimization
    const availableItems = useMemo(() => {
        return NAVIGATION_CONFIG.filter(item => !item.disabled);
    }, []);

    return (
        <nav 
        className={` mr-5 ml-3 hiddem md:flex items-center overflow-x-auto scrollbar-hide 
            ${className}`}
            role="navigation"
            aria-label="main guide"
        >
            <div className='flex items-center space-x-1 min-w-max px-1'>
                {availableItems.map((item) => (
                    <NavigationItemComponents
                    key={item.id}
                    item={item}
                    isActive={getIsNavigationItemActive(item)}
                    />
                ))}
            </div>
        </nav>
    );
});

Navigation.displayName = "Navigation";
export default Navigation;
