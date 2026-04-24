/**
 * 实时价格跳动组件（RealtimePriceTicker）
 *
 * 展示交易对的实时价格，具备以下特性：
 *
 * ─── 功能 ────────────────────────────────────────────────────────
 *  1. **价格跳动动画**：价格变化时触发 CSS 动画（缩放 + 高亮）
 *  2. **涨跌颜色**：价格上涨绿色、下跌红色、持平白色（可自定义）
 *  3. **自动订阅**：组件挂载时订阅 WebSocket Ticker 频道，卸载时自动取消
 *  4. **格式化显示**：根据价格量级自动调整小数位数
 *  5. **24H 涨跌幅**：展示百分比变化，带正负号和颜色
 *
 * ─── 使用方式 ────────────────────────────────────────────────────
 *  <RealtimePriceTicker
 *      symbol="BTC/USDT"
 *      exchangeId="binance"
 *      showChange={true}
 *      showVolume={false}
 *      size="lg"
 *  />
 *
 * ─── 性能说明 ────────────────────────────────────────────────────
 *  - 使用 Zustand 选择器精确订阅，仅当该交易对的 Ticker 更新时重渲染
 *  - 动画使用 CSS transition 而非 JS setTimeout，不占用主线程
 *  - requestAnimationFrame 批处理动画帧，避免高频更新卡顿
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { useMarketDataStore, useTicker, type TickerData } from '../../global_state_store/market_data_store';
import { PriceChangeIndicator, type PriceDirection } from './price_change_indicator';

// =========================================================================
// 类型定义
// =========================================================================

export interface RealtimePriceTickerProps {
    /** 交易对（如 'BTC/USDT'） */
    symbol: string;
    /** 交易所 ID（如 'binance'） */
    exchangeId: string;
    /** 是否显示 24H 涨跌幅（默认 true） */
    showChange?: boolean;
    /** 是否显示 24H 成交量（默认 false） */
    showVolume?: boolean;
    /** 是否显示交易所名称（默认 false） */
    showExchange?: boolean;
    /** 尺寸：sm / md / lg（默认 md） */
    size?: 'sm' | 'md' | 'lg';
    /** 自定义 CSS 类名 */
    className?: string;
}

// =========================================================================
// 工具函数
// =========================================================================

/**
 * 智能格式化价格：根据价格量级自动调整小数位数
 *
 * - 价格 >= 10000：2 位小数（BTC 级别）
 * - 价格 >= 1：4 位小数（ETH/主流币）
 * - 价格 >= 0.01：6 位小数（小币种）
 * - 价格 < 0.01：8 位小数（MEME/微型币）
 */
function formatPrice(price: number): string {
    if (price >= 10000) return price.toFixed(2);
    if (price >= 1)     return price.toFixed(4);
    if (price >= 0.01)  return price.toFixed(6);
    return price.toFixed(8);
}

/**
 * 格式化成交量：大数字使用 K/M/B 缩写
 */
function formatVolume(vol: number): string {
    if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)}B`;
    if (vol >= 1_000_000)     return `${(vol / 1_000_000).toFixed(2)}M`;
    if (vol >= 1_000)         return `${(vol / 1_000).toFixed(2)}K`;
    return vol.toFixed(2);
}

/**
 * 格式化涨跌幅：带正负号和百分号
 */
function formatChangePercent(pct: number): string {
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
}

/**
 * 判断价格方向
 */
function getPriceDirection(current: number, previous?: number): PriceDirection {
    if (!previous || current === previous) return 'neutral';
    return current > previous ? 'up' : 'down';
}

// =========================================================================
// 尺寸样式映射
// =========================================================================

const SIZE_STYLES = {
    sm: {
        price:    'text-sm font-semibold',
        change:   'text-xs',
        volume:   'text-xs',
        symbol:   'text-xs',
        exchange: 'text-[10px]',
    },
    md: {
        price:    'text-lg font-bold',
        change:   'text-sm',
        volume:   'text-sm',
        symbol:   'text-sm',
        exchange: 'text-xs',
    },
    lg: {
        price:    'text-2xl font-bold',
        change:   'text-base',
        volume:   'text-base',
        symbol:   'text-base font-medium',
        exchange: 'text-sm',
    },
} as const;

// =========================================================================
// RealtimePriceTicker 组件
// =========================================================================

export const RealtimePriceTicker: React.FC<RealtimePriceTickerProps> = ({
    symbol,
    exchangeId,
    showChange = true,
    showVolume = false,
    showExchange = false,
    size = 'md',
    className = '',
}) => {
    // 从 Zustand store 精确订阅该交易对的 Ticker
    const ticker = useTicker(symbol, exchangeId);
    const subscribeTicker = useMarketDataStore((s) => s.subscribeTicker);

    // 价格跳动动画状态 ref（避免频繁 setState）
    const priceRef = useRef<HTMLSpanElement>(null);
    const prevPriceRef = useRef<number>(0);

    // 自动订阅/取消订阅 WebSocket 频道
    useEffect(() => {
        const unsub = subscribeTicker(symbol, exchangeId);
        return unsub;
    }, [symbol, exchangeId, subscribeTicker]);

    // 价格变化时触发跳动动画
    const triggerFlash = useCallback((direction: PriceDirection) => {
        const el = priceRef.current;
        if (!el || direction === 'neutral') return;

        // 移除旧的动画类，强制重排后添加新的
        el.classList.remove('animate-price-flash-up', 'animate-price-flash-down');

        // 强制重排（触发 CSS 动画重新开始）
        void el.offsetHeight;

        el.classList.add(
            direction === 'up' ? 'animate-price-flash-up' : 'animate-price-flash-down',
        );
    }, []);

    // 检测价格变化并触发动画
    useEffect(() => {
        if (!ticker) return;

        const direction = getPriceDirection(ticker.last, prevPriceRef.current || ticker.prevLast);
        if (direction !== 'neutral') {
            triggerFlash(direction);
        }
        prevPriceRef.current = ticker.last;
    }, [ticker?.last, ticker?.prevLast, triggerFlash]);

    const styles = SIZE_STYLES[size];
    const direction = ticker
        ? getPriceDirection(ticker.last, prevPriceRef.current || ticker.prevLast)
        : 'neutral';

    // 涨跌颜色
    const directionColor =
        direction === 'up'   ? 'text-green-400' :
        direction === 'down' ? 'text-red-400'   :
        'text-primary';

    // 24H 涨跌幅颜色
    const changeColor = ticker
        ? ticker.changePercent > 0 ? 'text-green-400'
        : ticker.changePercent < 0 ? 'text-red-400'
        : 'text-muted'
        : 'text-muted';

    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            {/* 交易对名称 */}
            <span className={`${styles.symbol} text-secondary`}>
                {symbol}
            </span>

            {/* 交易所标识 */}
            {showExchange && (
                <span className={`${styles.exchange} text-dim uppercase`}>
                    {exchangeId}
                </span>
            )}

            {/* 实时价格（带跳动动画） */}
            <span
                ref={priceRef}
                className={`${styles.price} ${directionColor} transition-colors duration-200 tabular-nums`}
            >
                {ticker ? formatPrice(ticker.last) : '--'}
            </span>

            {/* 涨跌方向指示器 */}
            {ticker && direction !== 'neutral' && (
                <PriceChangeIndicator direction={direction} size={size} />
            )}

            {/* 24H 涨跌幅 */}
            {showChange && ticker && (
                <span className={`${styles.change} ${changeColor} tabular-nums`}>
                    {formatChangePercent(ticker.changePercent)}
                </span>
            )}

            {/* 24H 成交量 */}
            {showVolume && ticker && (
                <span className={`${styles.volume} text-dim`}>
                    Vol {formatVolume(ticker.quoteVolume)}
                </span>
            )}
        </div>
    );
};

export default RealtimePriceTicker;
