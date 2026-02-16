// trade center navigation types
export interface Exchange {
    readonly id: string;
    readonly name: string;
    readonly isActive: boolean;
    readonly balance: {
        readonly total: number;
        readonly available: number;
        readonly currency: string;
    };
}

export interface NavigationItem {
    readonly id: string;
    readonly label: string;
    readonly badge?: string;
    readonly isActive: boolean;
    readonly isComingSoon?: boolean;
}

// timezone types and utilities
export type TimeZone = 'UTC' | 'EST' | 'CST' | 'PST' | 'GMT' | 'JST' | 'LOCAL' | 'HKT' | 'KST' | 'ICT' | 'SGT' | 'AEDT' | 'NZDT';

// timezone config
export const TIMEZONE_CONFIG: ReadonlyArray<{
    readonly id: TimeZone;
    readonly label: string;
    readonly country: string;
    readonly offset: number;
    readonly description: string;
}> = [
    { id: 'UTC', label: '协调世界时', country: '国际', offset: 0, description: 'Coordinated Universal Time' },
    { id: 'EST', label: '东部标准时间', country: '美国', offset: -5, description: 'Eastern Standard Time' },
    { id: 'CST', label: '中部标准时间', country: '美国', offset: -6, description: 'Central Standard Time' },
    { id: 'PST', label: '太平洋标准时间', country: '美国', offset: -8, description: 'Pacific Standard Time' },
    { id: 'GMT', label: '格林尼治标准时间', country: '英国', offset: 0, description: 'Greenwich Mean Time' },
    { id: 'JST', label: '日本标准时间', country: '日本', offset: 9, description: 'Japan Standard Time' },
    { id: 'HKT', label: '香港时间', country: '中国香港', offset: 8, description: 'Hong Kong Time' },
    { id: 'KST', label: '韩国标准时间', country: '韩国', offset: 9, description: 'Korea Standard Time' },
    { id: 'ICT', label: '印度支那时间', country: '泰国', offset: 7, description: 'Indochina Time' },
    { id: 'SGT', label: '新加坡时间', country: '新加坡', offset: 8, description: 'Singapore Time' },
    { id: 'AEDT', label: '澳大利亚东部夏令时', country: '澳大利亚', offset: 10, description: 'Australian Eastern Daylight Time' },
    { id: 'NZDT', label: '新西兰夏令时', country: '新西兰', offset: 12, description: 'New Zealand Daylight Time' },
    { id: 'LOCAL', label: '本地时间', country: '本地', offset: new Date().getTimezoneOffset() / -60, description: 'Local Time' },
] as const;

// get current time in specified timezone (including seconds)
export const getCurrentTimeInTimeZone = (timezoneId: TimeZone): string => {
    const config = TIMEZONE_CONFIG.find(timezone => timezone.id === timezoneId);
    if (!config) return '';

    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utcTime + (config.offset * 3600000));

    return targetTime.toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

// navigation props interface
export interface TradeCenterNavigationProps {
    readonly currentExchange: Exchange | null;
    readonly exchanges: readonly Exchange[];
    readonly currentTimeZone: TimeZone;
    readonly currentPage: string;
    readonly onExchangeChange: (exchange: Exchange) => void;
    readonly onTimeZoneChange: (timezone: TimeZone) => void;
    readonly onPageChange: (pageId: string) => void;
}

// type guard function
export const isValidTimeZone = (value: string): value is TimeZone => {
    return TIMEZONE_CONFIG.some(timezone => timezone.id === value);
};

// constant definitions
export const MAX_EXCHANGE_MENU_HEIGHT = 240;
export const MOBILE_MENU_MAX_HEIGHT = '80vh';
export const NAVIGATION_HEIGHT = 64; // navigation bar height (px)