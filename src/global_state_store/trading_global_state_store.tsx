/**
 * Trade global state store
 * manage current trading status based on Zustand, management includes:
 * 1. context of current trading(selected trading pair like BTC/USDT, selected exchange, trade mode)
 * 2. spot orders(open orders and orders history), balance
 * 3. futures orders(open orders and orders history), positions, account information
 * 4. all async operation loading and error status
 * design: separate UI state and server data, form state is managed through component inner management, this Store and Status only store server data
 * selector hooks only exposed to specific subscription, avoid unnecessary re-render and load
 * error handling: all error will be caught and collected to lastError field, UI layer can decide how to display it 
 * persist(middleware only persist user preference like selected trading pair and exchange, not persist order data and other sensitive data)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// ❌
import { tradingApiService } from '../services/trading_api.service';
import type { SpotOrder, SpotBalance, SpotAccountSummary } from '../pages/trade_center_pages/type/spot_trading_types';
import type {
    FuturesOrder,
    FuturesPosition,
    FuturesAccountSummary,
    FundingRate,
    MarginMode,
} from '../pages/trade_center_pages/type/futures_trading_types';

// =========================================================================
// 交易模式枚举
// =========================================================================

/** 交易模式：现货 / 合约 */
export type TradingMode = 'spot' | 'futures';

// =========================================================================
// Store 状态类型
// =========================================================================

interface TradingState {
    // ─── 用户偏好（持久化） ───────────────────────────────────────
    /** 当前选中的交易对 */
    activeSymbol: string;
    /** 当前选中的交易所 ID */
    activeExchangeId: string;
    /** 交易模式 */
    tradingMode: TradingMode;

    // ─── 现货数据 ───────────────────────────────────────────────
    /** 当前挂单 */
    spotOpenOrders: SpotOrder[];
    /** 历史订单 */
    spotOrderHistory: SpotOrder[];
    /** 历史订单总数（分页用） */
    spotOrderHistoryTotal: number;
    /** 账户余额列表 */
    spotBalances: SpotBalance[];
    /** 账户汇总 */
    spotAccountSummary: SpotAccountSummary | null;

    // ─── 合约数据 ───────────────────────────────────────────────
    /** 合约当前挂单 */
    futuresOpenOrders: FuturesOrder[];
    /** 合约历史订单 */
    futuresOrderHistory: FuturesOrder[];
    /** 合约历史订单总数 */
    futuresOrderHistoryTotal: number;
    /** 当前持仓 */
    futuresPositions: FuturesPosition[];
    /** 合约账户汇总 */
    futuresAccountSummary: FuturesAccountSummary | null;
    /** 当前交易对资金费率 */
    fundingRate: FundingRate | null;

    // ─── 加载状态 ───────────────────────────────────────────────
    isLoadingSpotOrders: boolean;
    isLoadingSpotBalances: boolean;
    isLoadingFuturesOrders: boolean;
    isLoadingFuturesPositions: boolean;
    isLoadingFuturesAccount: boolean;
    isSubmittingOrder: boolean;

    // ─── 错误状态 ───────────────────────────────────────────────
    lastError: string | null;

    // ─── Actions: 用户偏好 ──────────────────────────────────────
    setActiveSymbol: (symbol: string) => void;
    setActiveExchangeId: (exchangeId: string) => void;
    setTradingMode: (mode: TradingMode) => void;
    clearError: () => void;

    // ─── Actions: 现货 ─────────────────────────────────────────
    /** 加载当前挂单 */
    fetchSpotOpenOrders: () => Promise<void>;
    /** 加载历史订单（支持分页） */
    fetchSpotOrderHistory: (page?: number, limit?: number) => Promise<void>;
    /** 加载余额 */
    fetchSpotBalances: () => Promise<void>;
    /** 加载账户汇总 */
    fetchSpotAccountSummary: () => Promise<void>;
    /** 下单 */
    submitSpotOrder: (params: Parameters<typeof tradingApiService.createSpotOrder>[0]) => Promise<SpotOrder | null>;
    /** 撤单 */
    cancelSpotOrder: (orderId: string) => Promise<boolean>;
    /** 批量撤单 */
    batchCancelSpotOrders: (orderIds: string[]) => Promise<number>;

    // ─── Actions: 合约 ─────────────────────────────────────────
    /** 加载当前挂单 */
    fetchFuturesOpenOrders: () => Promise<void>;
    /** 加载历史订单 */
    fetchFuturesOrderHistory: (page?: number, limit?: number) => Promise<void>;
    /** 加载持仓 */
    fetchFuturesPositions: () => Promise<void>;
    /** 加载账户汇总 */
    fetchFuturesAccountSummary: () => Promise<void>;
    /** 加载资金费率 */
    fetchFundingRate: () => Promise<void>;
    /** 下单 */
    submitFuturesOrder: (params: Parameters<typeof tradingApiService.createFuturesOrder>[0]) => Promise<FuturesOrder | null>;
    /** 撤单 */
    cancelFuturesOrder: (orderId: string) => Promise<boolean>;
    /** 调整杠杆 */
    setLeverage: (symbol: string, leverage: number) => Promise<boolean>;
    /** 切换保证金模式 */
    setMarginMode: (symbol: string, marginMode: MarginMode) => Promise<boolean>;
    /** 一键平仓 */
    closePosition: (symbol: string, positionSide: string) => Promise<boolean>;
}

// =========================================================================
// 工具函数
// =========================================================================

/** 从错误对象提取用户可读的消息 */
function extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        // axios 错误包含 response.data.message
        const axiosData = (error as any).response?.data;
        if (axiosData?.message) return axiosData.message;
        return error.message;
    }
    return '未知错误';
}

// =========================================================================
// Store 实现
// =========================================================================

export const useTradingStore = create<TradingState>()(
    persist(
        (set, get) => ({
            // ─── 初始状态 ────────────────────────────────────────
            activeSymbol: 'BTC/USDT',
            activeExchangeId: 'binance',
            tradingMode: 'spot',

            spotOpenOrders: [],
            spotOrderHistory: [],
            spotOrderHistoryTotal: 0,
            spotBalances: [],
            spotAccountSummary: null,

            futuresOpenOrders: [],
            futuresOrderHistory: [],
            futuresOrderHistoryTotal: 0,
            futuresPositions: [],
            futuresAccountSummary: null,
            fundingRate: null,

            isLoadingSpotOrders: false,
            isLoadingSpotBalances: false,
            isLoadingFuturesOrders: false,
            isLoadingFuturesPositions: false,
            isLoadingFuturesAccount: false,
            isSubmittingOrder: false,

            lastError: null,

            // ─── 用户偏好 Actions ────────────────────────────────
            setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),
            setActiveExchangeId: (exchangeId) => set({ activeExchangeId: exchangeId }),
            setTradingMode: (mode) => set({ tradingMode: mode }),
            clearError: () => set({ lastError: null }),

            // =================================================================
            // 现货 Actions
            // =================================================================

            fetchSpotOpenOrders: async () => {
                const { activeExchangeId, activeSymbol } = get();
                set({ isLoadingSpotOrders: true, lastError: null });
                try {
                    const orders = await tradingApiService.getSpotOpenOrders(activeExchangeId, activeSymbol);
                    set({ spotOpenOrders: orders });
                } catch (error) {
                    set({ lastError: extractErrorMessage(error) });
                } finally {
                    set({ isLoadingSpotOrders: false });
                }
            },

            fetchSpotOrderHistory: async (page = 1, limit = 20) => {
                const { activeExchangeId } = get();
                set({ isLoadingSpotOrders: true, lastError: null });
                try {
                    const result = await tradingApiService.getSpotOrderHistory(
                        activeExchangeId,
                        undefined,
                        { page, limit },
                    );
                    set({
                        spotOrderHistory: result.items,
                        spotOrderHistoryTotal: result.total,
                    });
                } catch (error) {
                    set({ lastError: extractErrorMessage(error) });
                } finally {
                    set({ isLoadingSpotOrders: false });
                }
            },

            fetchSpotBalances: async () => {
                const { activeExchangeId } = get();
                set({ isLoadingSpotBalances: true, lastError: null });
                try {
                    const balances = await tradingApiService.getSpotBalances(activeExchangeId);
                    set({ spotBalances: balances });
                } catch (error) {
                    set({ lastError: extractErrorMessage(error) });
                } finally {
                    set({ isLoadingSpotBalances: false });
                }
            },

            fetchSpotAccountSummary: async () => {
                const { activeExchangeId } = get();
                try {
                    const summary = await tradingApiService.getSpotAccountSummary(activeExchangeId);
                    set({ spotAccountSummary: summary });
                } catch (error) {
                    set({ lastError: extractErrorMessage(error) });
                }
            },

            submitSpotOrder: async (params) => {
                set({ isSubmittingOrder: true, lastError: null });
                try {
                    const order = await tradingApiService.createSpotOrder(params);
                    // 下单成功后刷新挂单列表和余额
                    get().fetchSpotOpenOrders();
                    get().fetchSpotBalances();
                    return order;
                } catch (error) {
                    set({ lastError: extractErrorMessage(error) });
                    return null;
                } finally {
                    set({ isSubmittingOrder: false });
                }
            },

            cancelSpotOrder: async (orderId) => {
                const { activeExchangeId } = get();
                try {
                    await tradingApiService.cancelSpotOrder(orderId, activeExchangeId);
                    // 乐观更新：从列表中移除已撤单项
                    set((state) => ({
                        spotOpenOrders: state.spotOpenOrders.filter((o) => o.id !== orderId),
                    }));
                    return true;
                } catch (error) {
                    set({ lastError: extractErrorMessage(error) });
                    return false;
                }
            },

            batchCancelSpotOrders: async (orderIds) => {
                const { activeExchangeId } = get();
                try {
                    const result = await tradingApiService.batchCancelSpotOrders(orderIds, activeExchangeId);
                    // 刷新挂单列表
                    get().fetchSpotOpenOrders();
                    return result.cancelledCount;
                } catch (error) {
                    set({ lastError: extractErrorMessage(error) });
                    return 0;
                }
            },

            // =================================================================
            // 合约 Actions
            // =================================================================

            fetchFuturesOpenOrders: async () => {
                const { activeExchangeId, activeSymbol } = get();
                set({ isLoadingFuturesOrders: true, lastError: null });
                try {
                    const orders = await tradingApiService.getFuturesOpenOrders(activeExchangeId, activeSymbol);
                    set({ futuresOpenOrders: orders });
                } catch (error) {
                    set({ lastError: extractErrorMessage(error) });
                } finally {
                    set({ isLoadingFuturesOrders: false });
                }
            },

            fetchFuturesOrderHistory: async (page = 1, limit = 20) => {
                const { activeExchangeId } = get();
                set({ isLoadingFuturesOrders: true, lastError: null });
                try {
                    const result = await tradingApiService.getFuturesOrderHistory(
                        activeExchangeId,
                        undefined,
                        { page, limit },
                    );
                    set({
                        futuresOrderHistory: result.items,
                        futuresOrderHistoryTotal: result.total,
                    });
                } catch (error) {
                    set({ lastError: extractErrorMessage(error) });
                } finally {
                    set({ isLoadingFuturesOrders: false });
                }
            },

            fetchFuturesPositions: async () => {
                const { activeExchangeId } = get();
                set({ isLoadingFuturesPositions: true, lastError: null });
                try {
                    const positions = await tradingApiService.getFuturesPositions(activeExchangeId);
                    set({ futuresPositions: positions });
                } catch (error) {
                    set({ lastError: extractErrorMessage(error) });
                } finally {
                    set({ isLoadingFuturesPositions: false });
                }
            },

            fetchFuturesAccountSummary: async () => {
                const { activeExchangeId } = get();
                set({ isLoadingFuturesAccount: true, lastError: null });
                try {
                    const summary = await tradingApiService.getFuturesAccountSummary(activeExchangeId);
                    set({ futuresAccountSummary: summary });
                } catch (error) {
                    set({ lastError: extractErrorMessage(error) });
                } finally {
                    set({ isLoadingFuturesAccount: false });
                }
            },

            fetchFundingRate: async () => {
                const { activeExchangeId, activeSymbol } = get();
                try {
                    const rate = await tradingApiService.getFundingRate(activeExchangeId, activeSymbol);
                    set({ fundingRate: rate });
                } catch (error) {
                    set({ lastError: extractErrorMessage(error) });
                }
            },

            submitFuturesOrder: async (params) => {
                set({ isSubmittingOrder: true, lastError: null });
                try {
                    const order = await tradingApiService.createFuturesOrder(params);
                    // 下单成功后刷新挂单和持仓
                    get().fetchFuturesOpenOrders();
                    get().fetchFuturesPositions();
                    return order;
                } catch (error) {
                    set({ lastError: extractErrorMessage(error) });
                    return null;
                } finally {
                    set({ isSubmittingOrder: false });
                }
            },

            cancelFuturesOrder: async (orderId) => {
                const { activeExchangeId } = get();
                try {
                    await tradingApiService.cancelFuturesOrder(orderId, activeExchangeId);
                    set((state) => ({
                        futuresOpenOrders: state.futuresOpenOrders.filter((o) => o.id !== orderId),
                    }));
                    return true;
                } catch (error) {
                    set({ lastError: extractErrorMessage(error) });
                    return false;
                }
            },

            setLeverage: async (symbol, leverage) => {
                const { activeExchangeId } = get();
                try {
                    await tradingApiService.setFuturesLeverage(activeExchangeId, symbol, leverage);
                    // 刷新持仓以获取最新杠杆
                    get().fetchFuturesPositions();
                    return true;
                } catch (error) {
                    set({ lastError: extractErrorMessage(error) });
                    return false;
                }
            },

            setMarginMode: async (symbol, marginMode) => {
                const { activeExchangeId } = get();
                try {
                    await tradingApiService.setFuturesMarginMode(activeExchangeId, symbol, marginMode);
                    return true;
                } catch (error) {
                    set({ lastError: extractErrorMessage(error) });
                    return false;
                }
            },

            closePosition: async (symbol, positionSide) => {
                const { activeExchangeId } = get();
                try {
                    await tradingApiService.closePosition(activeExchangeId, symbol, positionSide);
                    // 刷新持仓和账户
                    get().fetchFuturesPositions();
                    get().fetchFuturesAccountSummary();
                    return true;
                } catch (error) {
                    set({ lastError: extractErrorMessage(error) });
                    return false;
                }
            },
        }),
        {
            name: 'trading-preferences',
            storage: createJSONStorage(() => localStorage),
            // 只持久化用户偏好，不持久化服务端数据
            partialize: (state) => ({
                activeSymbol: state.activeSymbol,
                activeExchangeId: state.activeExchangeId,
                tradingMode: state.tradingMode,
            }),
        },
    ),
);

// =========================================================================
// 选择器 Hooks（精确订阅，减少不必要的重渲染）
// =========================================================================

/** 获取当前交易上下文 */
export function useTradingContext() {
    return useTradingStore((s) => ({
        activeSymbol: s.activeSymbol,
        activeExchangeId: s.activeExchangeId,
        tradingMode: s.tradingMode,
    }));
}

/** 获取现货挂单列表 */
export function useSpotOpenOrders() {
    return useTradingStore((s) => s.spotOpenOrders);
}

/** 获取现货余额列表 */
export function useSpotBalances() {
    return useTradingStore((s) => s.spotBalances);
}

/** 获取指定币种的现货余额 */
export function useSpotBalance(currency: string) {
    return useTradingStore((s) =>
        s.spotBalances.find((b) => b.currency === currency),
    );
}

/** 获取合约持仓列表 */
export function useFuturesPositions() {
    return useTradingStore((s) => s.futuresPositions);
}

/** 获取合约账户汇总 */
export function useFuturesAccount() {
    return useTradingStore((s) => s.futuresAccountSummary);
}

/** 获取下单提交状态 */
export function useIsSubmittingOrder() {
    return useTradingStore((s) => s.isSubmittingOrder);
}

/** 获取最后错误消息 */
export function useTradingError() {
    return useTradingStore((s) => s.lastError);
}
