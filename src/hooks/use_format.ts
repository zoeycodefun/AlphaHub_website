/**
 * 交易数据格式化 Hooks（useFormat）
 *
 * 提供价格、数量、金额、盈亏等数据的格式化工具：
 *
 *   - useFormatPrice：根据精度自动格式化价格
 *   - useFormatVolume：大数缩写（K / M / B）
 *   - useFormatPnl：盈亏带正负号、颜色
 *   - useFormatPercent：百分比格式化（带 ± 号）
 *
 * 所有 hook 返回纯函数引用（useCallback / 模块级函数），
 * 不会引起组件重渲染，可安全在渲染路径中调用。
 */
import { useCallback, useMemo } from 'react';

// =========================================================================
// 核心格式化函数（纯函数，模块级共享）
// =========================================================================

/**
 * 格式化价格
 * 根据价格量级自动决定小数位数，也可指定精度
 */
export function formatPrice(value: number, precision?: number): string {
    if (value === 0) return '0.00';

    // 如果指定了精度，直接使用
    if (precision !== undefined) {
        return value.toFixed(precision);
    }

    // 根据价格量级自动选择精度
    const absValue = Math.abs(value);
    if (absValue >= 10_000) return value.toFixed(2);
    if (absValue >= 100) return value.toFixed(2);
    if (absValue >= 1) return value.toFixed(4);
    if (absValue >= 0.01) return value.toFixed(6);
    return value.toFixed(8);
}

/**
 * 格式化成交量 / 金额
 * 超过阈值时使用 K / M / B 缩写
 */
export function formatVolume(value: number, decimals: number = 2): string {
    if (value === 0) return '0';

    const absValue = Math.abs(value);
    if (absValue >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(decimals)}B`;
    if (absValue >= 1_000_000) return `${(value / 1_000_000).toFixed(decimals)}M`;
    if (absValue >= 1_000) return `${(value / 1_000).toFixed(decimals)}K`;
    return value.toFixed(decimals);
}

/**
 * 格式化盈亏金额
 * 正数带 '+' 前缀，保留指定小数位
 */
export function formatPnl(value: number, decimals: number = 2): string {
    const formatted = Math.abs(value).toFixed(decimals);
    if (value > 0) return `+${formatted}`;
    if (value < 0) return `-${formatted}`;
    return formatted;
}

/**
 * 格式化百分比
 * 正数带 '+' 前缀，自动追加 '%'
 */
export function formatPercent(value: number, decimals: number = 2): string {
    const formatted = Math.abs(value).toFixed(decimals);
    if (value > 0) return `+${formatted}%`;
    if (value < 0) return `-${formatted}%`;
    return `${formatted}%`;
}

/**
 * 获取盈亏对应的 Tailwind 颜色类名
 */
export function getPnlColorClass(value: number): string {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-gray-400';
}

/**
 * 格式化时间戳为本地时间字符串
 */
export function formatTimestamp(isoString: string, includeSeconds: boolean = false): string {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        ...(includeSeconds ? { second: '2-digit' } : {}),
    };
    return date.toLocaleString('zh-CN', options);
}

// =========================================================================
// React Hooks 版本（提供 memoized formatter，方便组件内按需使用）
// =========================================================================

/**
 * 返回一个根据指定精度格式化价格的函数
 * 精度变化时自动更新引用
 */
export function useFormatPrice(precision?: number) {
    return useCallback(
        (value: number) => formatPrice(value, precision),
        [precision],
    );
}

/**
 * 返回格式化成交量的函数
 */
export function useFormatVolume(decimals: number = 2) {
    return useCallback(
        (value: number) => formatVolume(value, decimals),
        [decimals],
    );
}

/**
 * 返回格式化盈亏的函数
 */
export function useFormatPnl(decimals: number = 2) {
    return useCallback(
        (value: number) => formatPnl(value, decimals),
        [decimals],
    );
}

/** 
 * 返回格式化百分比的函数
 */
export function useFormatPercent(decimals: number = 2) {
    return useCallback(
        (value: number) => formatPercent(value, decimals),
        [decimals],
    );
}

/**
 * 综合格式化 Hook
 * 一次获取所有格式化函数，减少导入
 */
export function useFormatters(pricePrecision?: number) {
    const fmtPrice = useFormatPrice(pricePrecision);
    const fmtVolume = useFormatVolume();
    const fmtPnl = useFormatPnl();
    const fmtPercent = useFormatPercent();

    return useMemo(() => ({
        formatPrice: fmtPrice,
        formatVolume: fmtVolume,
        formatPnl: fmtPnl,
        formatPercent: fmtPercent,
        getPnlColorClass,
        formatTimestamp,
    }), [fmtPrice, fmtVolume, fmtPnl, fmtPercent]);
}
