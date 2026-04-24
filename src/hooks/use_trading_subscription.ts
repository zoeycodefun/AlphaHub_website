/**
 * 交易数据订阅 Hook（useTradingSubscription）
 *
 * 自动管理与当前交易对相关的 WebSocket 订阅：
 *
 *   1. 组件挂载时订阅 Ticker + OrderBook 频道
 *   2. 交易对 / 交易所切换时自动取消旧订阅、建立新订阅
 *   3. 组件卸载时自动清理所有订阅
 *
 * 使用方式：
 *   function SpotTradingPage() {
 *       useTradingSubscription();  // 自动订阅当前选中交易对
 *       return <div>...</div>;
 *   }
 *
 * 也可传入覆盖参数：
 *   useTradingSubscription({ symbol: 'ETH/USDT', exchangeId: 'okx' });
 */
import { useEffect, useRef } from 'react';
import { useMarketDataStore } from '../global_state_store/market_data_store';
import { useTradingStore } from '../global_state_store/trading_global_state_store';

// =========================================================================
// Hook 参数
// =========================================================================

export interface TradingSubscriptionOptions {
    /** 覆盖订阅的交易对（默认从 tradingStore 读取） */
    symbol?: string;
    /** 覆盖订阅的交易所 ID */
    exchangeId?: string;
    /** 是否订阅 Ticker（默认 true） */
    subscribeTicker?: boolean;
    /** 是否订阅 OrderBook（默认 true） */
    subscribeOrderBook?: boolean;
    /** 是否订阅 K 线（默认 false，需指定 timeframe） */
    subscribeKline?: boolean;
    /** K 线时间周期（如 '1m'、'5m'、'1h'） */
    klineTimeframe?: string;
}

// =========================================================================
// Hook 实现
// =========================================================================

export function useTradingSubscription(options?: TradingSubscriptionOptions) {
    // 从全局 Store 获取当前交易上下文
    const storeSymbol = useTradingStore((s) => s.activeSymbol);
    const storeExchangeId = useTradingStore((s) => s.activeExchangeId);

    // 允许外部参数覆盖
    const symbol = options?.symbol ?? storeSymbol;
    const exchangeId = options?.exchangeId ?? storeExchangeId;
    const enableTicker = options?.subscribeTicker !== false;
    const enableOrderBook = options?.subscribeOrderBook !== false;
    const enableKline = options?.subscribeKline === true;
    const klineTimeframe = options?.klineTimeframe ?? '1m';

    // 获取订阅方法
    const subscribeTicker = useMarketDataStore((s) => s.subscribeTicker);
    const subscribeOrderBook = useMarketDataStore((s) => s.subscribeOrderBook);
    const subscribeKline = useMarketDataStore((s) => s.subscribeKline);

    // 使用 ref 跟踪取消订阅函数，避免闭包问题
    const unsubscribeRef = useRef<Array<() => void>>([]);

    useEffect(() => {
        // 清理上一轮订阅
        unsubscribeRef.current.forEach((unsub) => unsub());
        unsubscribeRef.current = [];

        if (!symbol || !exchangeId) return;

        // 建立新订阅
        if (enableTicker) {
            unsubscribeRef.current.push(subscribeTicker(symbol, exchangeId));
        }
        if (enableOrderBook) {
            unsubscribeRef.current.push(subscribeOrderBook(symbol, exchangeId));
        }
        if (enableKline) {
            unsubscribeRef.current.push(subscribeKline(symbol, klineTimeframe, exchangeId));
        }

        // 组件卸载或依赖变化时清理
        return () => {
            unsubscribeRef.current.forEach((unsub) => unsub());
            unsubscribeRef.current = [];
        };
    }, [symbol, exchangeId, enableTicker, enableOrderBook, enableKline, klineTimeframe, subscribeTicker, subscribeOrderBook, subscribeKline]);
}

// =========================================================================
// 便捷变体
// =========================================================================

/**
 * 仅订阅 Ticker（用于轻量场景，如导航栏价格展示）
 */
export function useTickerSubscription(symbol?: string, exchangeId?: string) {
    useTradingSubscription({
        symbol,
        exchangeId,
        subscribeTicker: true,
        subscribeOrderBook: false,
        subscribeKline: false,
    });
}

/**
 * 订阅 K 线（用于 K 线图组件）
 */
export function useKlineSubscription(timeframe: string = '1m', symbol?: string, exchangeId?: string) {
    useTradingSubscription({
        symbol,
        exchangeId,
        subscribeTicker: false,
        subscribeOrderBook: false,
        subscribeKline: true,
        klineTimeframe: timeframe,
    });
}
