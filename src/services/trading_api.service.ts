/**
 * Trade API service layer(Trading API Service)
 * Seal all spot and futures trading related HTTP API calls:
 * 1. Spot trading: create order / cancel order / query order / query balance
 * 2. Futures trading: create order / cancel order / query order / query position / query account information / adjust leverage
 * 3. Universe: trading pairs information / trading history
 * Structure Design:
 * 1. Singleton pattern, all components and application share the same axios instance
 * 2. JWT authentication, request interceptor automatically attach token and authorization header
 * 3. 401 clear token and dispatch auth:unauthorized event for global handling automatically
 * 4. All methods return unwrapped business data (unwrap { success, data } structure)
 * 5. Security limitation: API key/Secret never pass through frontend, only associated by accountId in backend
 * 6. Sensitive operations (like order creation / order cancellation) require valid JWT token
 */

import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
// ❌
import type {
    SpotOrderRequest,
    SpotOrder,
    SpotBalance,
    SpotAccountSummary,
    SpotSymbolInfo,
    SpotTradeRecord,
    SpotOrderFilter,
} from '../pages/trade_center_pages/type/spot_trading_types';
import type {
    FuturesOrderRequest,
    FuturesOrder,
    FuturesPosition,
    FuturesAccountSummary,
    FundingRate,
    FuturesOrderFilter,
    MarginMode,
} from '../pages/trade_center_pages/type/futures_trading_types';

// =========================================================================
// 通用响应结构（与后端对齐）
// =========================================================================

interface BaseResponse {
    success: boolean;
    message: string;
    timestamp: string;
}

interface DataResponse<T> extends BaseResponse {
    data?: T;
}

/** 分页列表响应 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

/** 分页请求参数 */
export interface PaginationParams {
    page?: number;
    limit?: number;
}

// =========================================================================
// Trading API Service 类
// =========================================================================

class TradingApiService {
    private http: AxiosInstance;

    constructor() {
        /**
         * 创建独立 axios 实例
         * baseURL 从 Vite 环境变量获取，本地开发默认 http://localhost:3000/api
         */
        this.http = axios.create({
            baseURL: (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
            timeout: 30_000, // 交易接口超时设为 30s（交易所响应可能较慢）
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // 请求拦截器：自动附加 JWT Token
        this.http.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('auth_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error),
        );

        // 响应拦截器：全局 401 处理
        this.http.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('auth_token');
                    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
                }
                return Promise.reject(error);
            },
        );
    }

    // =====================================================================
    // 现货交易接口
    // =====================================================================

    /**
     * 现货下单
     * POST /trading/spot/orders
     */
    async createSpotOrder(payload: SpotOrderRequest): Promise<SpotOrder> {
        const response: AxiosResponse<DataResponse<SpotOrder>> =
            await this.http.post('/trading/spot/orders', payload);
        return response.data.data!;
    }

    /**
     * 撤销现货订单
     * DELETE /trading/spot/orders/:orderId
     */
    async cancelSpotOrder(orderId: string, exchangeId: string): Promise<void> {
        await this.http.delete(`/trading/spot/orders/${orderId}`, {
            params: { exchangeId },
        });
    }

    /**
     * 批量撤销现货订单
     * POST /trading/spot/orders/batch-cancel
     */
    async batchCancelSpotOrders(orderIds: string[], exchangeId: string): Promise<{ cancelledCount: number }> {
        const response: AxiosResponse<DataResponse<{ cancelledCount: number }>> =
            await this.http.post('/trading/spot/orders/batch-cancel', { orderIds, exchangeId });
        return response.data.data!;
    }

    /**
     * 查询当前挂单（Open Orders）
     * GET /trading/spot/orders/open
     */
    async getSpotOpenOrders(
        exchangeId: string,
        symbol?: string,
    ): Promise<SpotOrder[]> {
        const response: AxiosResponse<DataResponse<SpotOrder[]>> =
            await this.http.get('/trading/spot/orders/open', {
                params: { exchangeId, symbol },
            });
        return response.data.data ?? [];
    }

    /**
     * 查询历史订单（支持筛选 & 分页）
     * GET /trading/spot/orders/history
     */
    async getSpotOrderHistory(
        exchangeId: string,
        filter?: SpotOrderFilter,
        pagination?: PaginationParams,
    ): Promise<PaginatedResponse<SpotOrder>> {
        const response: AxiosResponse<DataResponse<PaginatedResponse<SpotOrder>>> =
            await this.http.get('/trading/spot/orders/history', {
                params: { exchangeId, ...filter, ...pagination },
            });
        return response.data.data!;
    }

    /**
     * 查询成交记录
     * GET /trading/spot/trades
     */
    async getSpotTrades(
        exchangeId: string,
        symbol?: string,
        pagination?: PaginationParams,
    ): Promise<PaginatedResponse<SpotTradeRecord>> {
        const response: AxiosResponse<DataResponse<PaginatedResponse<SpotTradeRecord>>> =
            await this.http.get('/trading/spot/trades', {
                params: { exchangeId, symbol, ...pagination },
            });
        return response.data.data!;
    }

    /**
     * 查询现货账户余额
     * GET /trading/spot/balances
     */
    async getSpotBalances(exchangeId: string): Promise<SpotBalance[]> {
        const response: AxiosResponse<DataResponse<SpotBalance[]>> =
            await this.http.get('/trading/spot/balances', {
                params: { exchangeId },
            });
        return response.data.data ?? [];
    }

    /**
     * 查询现货账户汇总
     * GET /trading/spot/account
     */
    async getSpotAccountSummary(exchangeId: string): Promise<SpotAccountSummary> {
        const response: AxiosResponse<DataResponse<SpotAccountSummary>> =
            await this.http.get('/trading/spot/account', {
                params: { exchangeId },
            });
        return response.data.data!;
    }

    /**
     * 获取交易对信息（精度、最小下单量等）
     * GET /trading/spot/symbols
     */
    async getSpotSymbolInfo(exchangeId: string, symbol: string): Promise<SpotSymbolInfo> {
        const response: AxiosResponse<DataResponse<SpotSymbolInfo>> =
            await this.http.get('/trading/spot/symbols', {
                params: { exchangeId, symbol },
            });
        return response.data.data!;
    }

    // =====================================================================
    // 合约交易接口
    // =====================================================================

    /**
     * 合约下单
     * POST /trading/futures/orders
     */
    async createFuturesOrder(payload: FuturesOrderRequest): Promise<FuturesOrder> {
        const response: AxiosResponse<DataResponse<FuturesOrder>> =
            await this.http.post('/trading/futures/orders', payload);
        return response.data.data!;
    }

    /**
     * 撤销合约订单
     * DELETE /trading/futures/orders/:orderId
     */
    async cancelFuturesOrder(orderId: string, exchangeId: string): Promise<void> {
        await this.http.delete(`/trading/futures/orders/${orderId}`, {
            params: { exchangeId },
        });
    }

    /**
     * 批量撤销合约订单
     * POST /trading/futures/orders/batch-cancel
     */
    async batchCancelFuturesOrders(orderIds: string[], exchangeId: string): Promise<{ cancelledCount: number }> {
        const response: AxiosResponse<DataResponse<{ cancelledCount: number }>> =
            await this.http.post('/trading/futures/orders/batch-cancel', { orderIds, exchangeId });
        return response.data.data!;
    }

    /**
     * 查询合约当前挂单
     * GET /trading/futures/orders/open
     */
    async getFuturesOpenOrders(
        exchangeId: string,
        symbol?: string,
    ): Promise<FuturesOrder[]> {
        const response: AxiosResponse<DataResponse<FuturesOrder[]>> =
            await this.http.get('/trading/futures/orders/open', {
                params: { exchangeId, symbol },
            });
        return response.data.data ?? [];
    }

    /**
     * 查询合约历史订单
     * GET /trading/futures/orders/history
     */
    async getFuturesOrderHistory(
        exchangeId: string,
        filter?: FuturesOrderFilter,
        pagination?: PaginationParams,
    ): Promise<PaginatedResponse<FuturesOrder>> {
        const response: AxiosResponse<DataResponse<PaginatedResponse<FuturesOrder>>> =
            await this.http.get('/trading/futures/orders/history', {
                params: { exchangeId, ...filter, ...pagination },
            });
        return response.data.data!;
    }

    /**
     * 查询合约持仓
     * GET /trading/futures/positions
     */
    async getFuturesPositions(exchangeId: string, symbol?: string): Promise<FuturesPosition[]> {
        const response: AxiosResponse<DataResponse<FuturesPosition[]>> =
            await this.http.get('/trading/futures/positions', {
                params: { exchangeId, symbol },
            });
        return response.data.data ?? [];
    }

    /**
     * 查询合约账户汇总（权益 / 保证金 / 未实现盈亏）
     * GET /trading/futures/account
     */
    async getFuturesAccountSummary(exchangeId: string): Promise<FuturesAccountSummary> {
        const response: AxiosResponse<DataResponse<FuturesAccountSummary>> =
            await this.http.get('/trading/futures/account', {
                params: { exchangeId },
            });
        return response.data.data!;
    }

    /**
     * 调整杠杆倍数
     * PUT /trading/futures/leverage
     */
    async setFuturesLeverage(
        exchangeId: string,
        symbol: string,
        leverage: number,
    ): Promise<{ leverage: number }> {
        const response: AxiosResponse<DataResponse<{ leverage: number }>> =
            await this.http.put('/trading/futures/leverage', {
                exchangeId,
                symbol,
                leverage,
            });
        return response.data.data!;
    }

    /**
     * 切换保证金模式（全仓 / 逐仓）
     * PUT /trading/futures/margin-mode
     */
    async setFuturesMarginMode(
        exchangeId: string,
        symbol: string,
        marginMode: MarginMode,
    ): Promise<{ marginMode: MarginMode }> {
        const response: AxiosResponse<DataResponse<{ marginMode: MarginMode }>> =
            await this.http.put('/trading/futures/margin-mode', {
                exchangeId,
                symbol,
                marginMode,
            });
        return response.data.data!;
    }

    /**
     * 查询资金费率
     * GET /trading/futures/funding-rate
     */
    async getFundingRate(exchangeId: string, symbol: string): Promise<FundingRate> {
        const response: AxiosResponse<DataResponse<FundingRate>> =
            await this.http.get('/trading/futures/funding-rate', {
                params: { exchangeId, symbol },
            });
        return response.data.data!;
    }

    /**
     * 设置止盈止损（对已有持仓）
     * PUT /trading/futures/positions/tp-sl
     */
    async setPositionTpSl(
        exchangeId: string,
        symbol: string,
        positionSide: string,
        takeProfitPrice?: number,
        stopLossPrice?: number,
    ): Promise<void> {
        await this.http.put('/trading/futures/positions/tp-sl', {
            exchangeId,
            symbol,
            positionSide,
            takeProfitPrice,
            stopLossPrice,
        });
    }

    /**
     * 一键平仓
     * POST /trading/futures/positions/close
     */
    async closePosition(
        exchangeId: string,
        symbol: string,
        positionSide: string,
    ): Promise<FuturesOrder> {
        const response: AxiosResponse<DataResponse<FuturesOrder>> =
            await this.http.post('/trading/futures/positions/close', {
                exchangeId,
                symbol,
                positionSide,
            });
        return response.data.data!;
    }
}

/** 交易 API 服务单例 */
export const tradingApiService = new TradingApiService();
