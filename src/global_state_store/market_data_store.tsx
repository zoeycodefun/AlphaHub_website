/**
 * 实时行情数据全局状态管理（useMarketDataStore）
 *
 * 基于 Zustand 的前端行情状态仓库，与 WebSocket 服务集成：
 *
 * ─── 数据结构 ────────────────────────────────────────────────────
 *  tickers:    Map<channelKey, TickerData>   — 实时价格快照
 *  orderBooks: Map<channelKey, OrderBookData> — 订单薄快照
 *  klines:     Map<channelKey, KlineBar[]>    — K 线数据缓冲
 *
 *  channelKey 格式：{symbol}:{exchangeId}（如 "BTC/USDT:binance"）
 *
 * ─── 工作流程 ────────────────────────────────────────────────────
 *  1. 组件挂载时调用 subscribeTicker('BTC/USDT', 'binance') 订阅频道
 *  2. WebSocket 收到 ticker 事件后更新 tickers Map
 *  3. 组件通过 useTicker('BTC/USDT', 'binance') 选择器获取数据
 *  4. 组件卸载时调用返回的 unsubscribe 函数清理
 *
 * ─── 性能优化 ────────────────────────────────────────────────────
 *  - 使用 Map 存储避免对象扩展引起全量渲染
 *  - 提供基于选择器的 hook（useTicker/useOrderBook）实现精确更新
 *  - K 线数据限制最大缓冲长度，防止内存泄漏
 */
import { create } from 'zustand';
import { wsService, type ConnectionStatus } from '../services/websocket.service';

// =========================================================================
// 数据类型（前端版本，与后端 DTO 对齐）
// =========================================================================

/** 价格快照（对应后端 MarketTicker） */
export interface TickerData {
    symbol:        string;
    exchangeId?:   string;   // 来源交易所（WebSocket 推送时携带）
    timestamp:     number;
    last:          number;
    bid:           number;
    ask:           number;
    high:          number;
    low:           number;
    open:          number;
    close:         number;
    volume:        number;
    quoteVolume:   number;
    change:        number;
    changePercent: number;
    // 前一次价格（用于判断涨跌方向，前端自行计算）
    prevLast?:     number;
    // 合约扩展字段
    markPrice?:     number;
    fundingRate?:   number;
    openInterest?:  number;
}

/** 订单薄快照 */
export interface OrderBookData {
    symbol:    string;
    timestamp: number;
    bids:      [number, number][];
    asks:      [number, number][];
}

/** K 线柱 */
export interface KlineBar {
    timestamp: number;
    open:      number;
    high:      number;
    low:       number;
    close:     number;
    volume:    number;
}

// =========================================================================
// Store 状态类型
// =========================================================================

/** K 线缓冲最大长度 */
const MAX_KLINE_BUFFER = 500;

/** 构建频道 key */
function channelKey(symbol: string, exchangeId: string): string {
    return `${symbol}:${exchangeId}`;
}

interface MarketDataState {
    // ─── 数据 ────────────────────────────────────────────────────
    tickers:    Map<string, TickerData>;
    orderBooks: Map<string, OrderBookData>;
    klines:     Map<string, KlineBar[]>;

    // ─── 连接状态 ────────────────────────────────────────────────
    wsStatus: ConnectionStatus;

    // ─── Actions ─────────────────────────────────────────────────

    /** 初始化 WebSocket 连接，注册事件回调 */
    initWebSocket: (token?: string) => void;

    /** 断开 WebSocket 连接 */
    disconnectWebSocket: () => void;

    /**
     * 订阅 Ticker 频道
     * @returns 取消订阅函数
     */
    subscribeTicker: (symbol: string, exchangeId: string) => () => void;

    /**
     * 订阅 OrderBook 频道
     * @returns 取消订阅函数
     */
    subscribeOrderBook: (symbol: string, exchangeId: string) => () => void;

    /**
     * 订阅 K 线频道
     * @returns 取消订阅函数
     */
    subscribeKline: (symbol: string, timeframe: string, exchangeId: string) => () => void;

    /** 内部：更新 ticker 数据 */
    _updateTicker: (data: TickerData) => void;

    /** 内部：更新 orderbook 数据 */
    _updateOrderBook: (data: OrderBookData) => void;

    /** 内部：追加 kline 数据 */
    _appendKline: (key: string, bar: KlineBar) => void;
}

// =========================================================================
// Store 实现
// =========================================================================

/** WebSocket 事件取消函数（用于清理） */
let wsCleanupFns: Array<() => void> = [];

export const useMarketDataStore = create<MarketDataState>()((set, get) => ({
    // ─── 初始状态 ────────────────────────────────────────────────
    tickers:    new Map(),
    orderBooks: new Map(),
    klines:     new Map(),
    wsStatus:   'disconnected',

    // ─── initWebSocket ──────────────────────────────────────────
    initWebSocket: (token?: string) => {
        // 清理之前的监听器
        wsCleanupFns.forEach(fn => fn());
        wsCleanupFns = [];

        // 注册状态变化监听
        wsCleanupFns.push(
            wsService.onStatusChange((status) => {
                set({ wsStatus: status });
            }),
        );

        // 注册 ticker 事件
        wsCleanupFns.push(
            wsService.on('ticker', (data) => {
                get()._updateTicker(data as TickerData);
            }),
        );

        // 注册 orderbook 事件
        wsCleanupFns.push(
            wsService.on('orderbook', (data) => {
                get()._updateOrderBook(data as OrderBookData);
            }),
        );

        // 注册 kline 事件
        wsCleanupFns.push(
            wsService.on('kline', (data) => {
                const bar = data as KlineBar & { symbol?: string; exchangeId?: string; timeframe?: string };
                if (bar.symbol && bar.exchangeId && bar.timeframe) {
                    const key = `${bar.symbol}:${bar.timeframe}:${bar.exchangeId}`;
                    get()._appendKline(key, bar);
                }
            }),
        );

        // 建立连接
        wsService.connect(token);
    },

    // ─── disconnectWebSocket ────────────────────────────────────
    disconnectWebSocket: () => {
        wsCleanupFns.forEach(fn => fn());
        wsCleanupFns = [];
        wsService.disconnect();
        set({ wsStatus: 'disconnected' });
    },

    // ─── subscribeTicker ────────────────────────────────────────
    subscribeTicker: (symbol: string, exchangeId: string) => {
        const channel = `ticker:${symbol}:${exchangeId}`;
        wsService.subscribe(channel);
        return () => {
            wsService.unsubscribe(channel);
        };
    },

    // ─── subscribeOrderBook ─────────────────────────────────────
    subscribeOrderBook: (symbol: string, exchangeId: string) => {
        const channel = `orderbook:${symbol}:${exchangeId}`;
        wsService.subscribe(channel);
        return () => {
            wsService.unsubscribe(channel);
        };
    },

    // ─── subscribeKline ─────────────────────────────────────────
    subscribeKline: (symbol: string, timeframe: string, exchangeId: string) => {
        const channel = `kline:${symbol}:${timeframe}:${exchangeId}`;
        wsService.subscribe(channel);
        return () => {
            wsService.unsubscribe(channel);
        };
    },

    // ─── 内部数据更新 ───────────────────────────────────────────
    _updateTicker: (data: TickerData) => {
        set((state) => {
            const newTickers = new Map(state.tickers);
            // 优先使用服务端推送携带的 exchangeId 构建精确 key
            const key = data.exchangeId
                ? channelKey(data.symbol, data.exchangeId)
                : data.symbol;

            // 记录前一次价格（用于涨跌方向判断动画）
            const prev = newTickers.get(key);
            if (prev) {
                data.prevLast = prev.last;
            }

            newTickers.set(key, data);
            return { tickers: newTickers };
        });
    },

    _updateOrderBook: (data: OrderBookData) => {
        set((state) => {
            const newOrderBooks = new Map(state.orderBooks);
            const key = (data as any).exchangeId
                ? channelKey(data.symbol, (data as any).exchangeId)
                : data.symbol;
            newOrderBooks.set(key, data);
            return { orderBooks: newOrderBooks };
        });
    },

    _appendKline: (key: string, bar: KlineBar) => {
        set((state) => {
            const newKlines = new Map(state.klines);
            const existing = newKlines.get(key) ?? [];

            // 如果最后一根 K 线时间戳相同，更新（实时推送的当前 K 线）
            if (existing.length > 0 && existing[existing.length - 1].timestamp === bar.timestamp) {
                const updated = [...existing];
                updated[updated.length - 1] = bar;
                newKlines.set(key, updated);
            } else {
                // 追加新 K 线，限制最大长度
                const updated = [...existing, bar];
                if (updated.length > MAX_KLINE_BUFFER) {
                    updated.splice(0, updated.length - MAX_KLINE_BUFFER);
                }
                newKlines.set(key, updated);
            }

            return { klines: newKlines };
        });
    },
}));

// =========================================================================
// 选择器 Hooks（精确订阅，避免无关数据变化引起重渲染）
// =========================================================================

/**
 * 获取指定交易对的实时 Ticker
 * @param symbol     交易对（如 'BTC/USDT'）
 * @param exchangeId 交易所 ID（如 'binance'）
 */
export function useTicker(symbol: string, exchangeId: string): TickerData | undefined {
    return useMarketDataStore((state) => {
        const key = channelKey(symbol, exchangeId);
        return state.tickers.get(key) ?? state.tickers.get(symbol);
    });
}

/**
 * 获取指定交易对的订单薄
 */
export function useOrderBook(symbol: string, exchangeId: string): OrderBookData | undefined {
    return useMarketDataStore((state) => {
        const key = channelKey(symbol, exchangeId);
        return state.orderBooks.get(key) ?? state.orderBooks.get(symbol);
    });
}

/**
 * 获取指定交易对/周期的 K 线数据
 */
const EMPTY_KLINES: KlineBar[] = [];

export function useKlines(symbol: string, timeframe: string, exchangeId: string): KlineBar[] {
    return useMarketDataStore((state) => {
        const key = `${symbol}:${timeframe}:${exchangeId}`;
        return state.klines.get(key) ?? EMPTY_KLINES;
    });
}

/**
 * 获取 WebSocket 连接状态
 */
export function useWsStatus(): ConnectionStatus {
    return useMarketDataStore((state) => state.wsStatus);
}
