export interface Exchange {
    id: string;
    name: string;
    isActive: boolean;
    balance: {
        total: number;
        available: number;
        currency: string;
    };
}

export interface NavigationItem {
    id: string;
    label: string;
    badge?: string;
    isActive: boolean;
    isComingSoon?: boolean;

}

export type TimeZone = 'UTC' | 'LOCAL' | '';

export interface TradeCenterNavigationProps {
    currentExchange: Exchange | null;
    exchanges: Exchange[];
    currentTimeZone: TimeZone;
    currentPage: string;
    onExchangeChange: (exchange: Exchange) => void;
    onTimeZoneChange: (timezone: TimeZone) => void;
    onPageChange: (pageId: string) => void;

} 
