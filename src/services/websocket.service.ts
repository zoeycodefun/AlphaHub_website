/**
 * WebSocket 客户端服务（WebSocketService）
 *
 * 前端 WebSocket 连接管理器，与后端 MarketDataGateway 通信：
 *
 * ─── 功能 ─────────────────────────────────────────────────────────
 *  1. 自动连接/断线重连（指数退避，最大重试 30s 间隔）
 *  2. JWT 认证（连接时通过 URL 参数传递 token）
 *  3. 频道订阅/取消订阅（ticker、orderbook、kline、orders、signals）
 *  4. 心跳保活（每 25 秒发送 ping，确保连接活跃）
 *  5. 消息分发：通过回调注册机制，按事件类型分发给消费者
 *
 * ─── 使用方式 ────────────────────────────────────────────────────
 *  import { wsService } from '@/services/websocket.service';
 *
 *  // 连接
 *  wsService.connect('your-jwt-token');
 *
 *  // 订阅频道
 *  wsService.subscribe('ticker:BTC/USDT:binance');
 *
 *  // 监听事件
 *  const unsub = wsService.on('ticker', (data) => { ... });
 *
 *  // 清理
 *  unsub();
 *  wsService.disconnect();
 *
 * ─── 与 Zustand 的集成 ──────────────────────────────────────────
 *  market_data_store.tsx 中调用 wsService.on() 注册回调，
 *  在回调中更新 Zustand store，实现 WebSocket → 状态 → UI 的响应链路。
 */

// =========================================================================
// 类型定义
// =========================================================================

/** 服务端推送消息结构（与后端 WsMessage 对齐） */
export interface WsMessage {
    event: string;
    data:  unknown;
    ts?:   number;
}

/** 事件回调函数签名 */
export type WsEventCallback = (data: unknown) => void;

/** 连接状态枚举 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/** 连接状态变化回调 */
export type StatusChangeCallback = (status: ConnectionStatus) => void;

// =========================================================================
// 常量配置
// =========================================================================

/** WebSocket 服务端地址（从环境变量读取，开发环境默认 localhost:3001） */
const WS_BASE_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001/ws';

/** 心跳间隔（毫秒）：客户端每 25s 发送一次 ping */
const HEARTBEAT_INTERVAL_MS = 25_000;

/** 初始重连延迟（毫秒） */
const INITIAL_RECONNECT_DELAY_MS = 1_000;

/** 最大重连延迟（毫秒） */
const MAX_RECONNECT_DELAY_MS = 30_000;

/** 最大重连尝试次数（0 = 无限） */
const MAX_RECONNECT_ATTEMPTS = 0;

// =========================================================================
// WebSocketService
// =========================================================================

class WebSocketService {
    private ws: WebSocket | null = null;
    private token: string | null = null;

    /** 当前连接状态 */
    private _status: ConnectionStatus = 'disconnected';

    /** 重连相关状态 */
    private reconnectAttempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    /** 心跳定时器 */
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    /** 已订阅的频道集合（用于重连后自动恢复订阅） */
    private subscribedChannels = new Set<string>();

    /** 事件监听器注册表（event → callbacks） */
    private listeners = new Map<string, Set<WsEventCallback>>();

    /** 连接状态变化回调集合 */
    private statusListeners = new Set<StatusChangeCallback>();

    // ================================================================
    // 公共接口
    // ================================================================

    /**
     * 建立 WebSocket 连接
     *
     * @param token JWT 认证令牌（可选，匿名连接仅能订阅公开频道）
     */
    connect(token?: string): void {
        if (this._status === 'connected' || this._status === 'connecting') return;

        this.token = token ?? null;
        this.reconnectAttempts = 0;
        this.doConnect();
    }

    /**
     * 断开连接（不自动重连）
     */
    disconnect(): void {
        this.clearReconnectTimer();
        this.clearHeartbeat();
        if (this.ws) {
            this.ws.onclose = null; // 防止触发重连
            this.ws.close(1000, '客户端主动断开');
            this.ws = null;
        }
        this.setStatus('disconnected');
    }

    /**
     * 更新认证令牌（已连接时会断开并重连）
     */
    updateToken(token: string): void {
        this.token = token;
        if (this._status === 'connected') {
            this.disconnect();
            this.connect(token);
        }
    }

    /**
     * 订阅一个或多个频道
     *
     * 频道命名规范：
     *  - ticker:BTC/USDT:binance
     *  - orderbook:ETH/USDT:okx
     *  - kline:BTC/USDT:1m:binance
     *  - orders（私有）
     *  - signals（私有）
     *
     * @param channels 频道名或频道名数组
     */
    subscribe(channels: string | string[]): void {
        const channelList = Array.isArray(channels) ? channels : [channels];
        for (const ch of channelList) {
            this.subscribedChannels.add(ch);
        }
        this.sendAction('subscribe', channelList);
    }

    /**
     * 取消订阅频道
     */
    unsubscribe(channels: string | string[]): void {
        const channelList = Array.isArray(channels) ? channels : [channels];
        for (const ch of channelList) {
            this.subscribedChannels.delete(ch);
        }
        this.sendAction('unsubscribe', channelList);
    }

    /**
     * 注册事件监听器
     *
     * @param event    事件类型（'ticker', 'orderbook', 'kline', 'order_update' 等）
     * @param callback 回调函数
     * @returns        取消订阅函数
     */
    on(event: string, callback: WsEventCallback): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        // 返回取消订阅函数
        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }

    /**
     * 注册连接状态变化监听器
     * @returns 取消订阅函数
     */
    onStatusChange(callback: StatusChangeCallback): () => void {
        this.statusListeners.add(callback);
        // 立即通知当前状态
        callback(this._status);
        return () => {
            this.statusListeners.delete(callback);
        };
    }

    /**
     * 获取当前连接状态
     */
    get status(): ConnectionStatus {
        return this._status;
    }

    /**
     * 获取当前已订阅的频道列表
     */
    get channels(): string[] {
        return Array.from(this.subscribedChannels);
    }

    // ================================================================
    // 私有：连接管理
    // ================================================================

    private doConnect(): void {
        this.setStatus('connecting');

        const url = this.token
            ? `${WS_BASE_URL}?token=${encodeURIComponent(this.token)}`
            : WS_BASE_URL;

        try {
            this.ws = new WebSocket(url);
        } catch {
            this.scheduleReconnect();
            return;
        }

        this.ws.onopen = () => {
            this.setStatus('connected');
            this.reconnectAttempts = 0;
            this.startHeartbeat();

            // 重连后恢复之前的订阅
            if (this.subscribedChannels.size > 0) {
                this.sendAction('subscribe', Array.from(this.subscribedChannels));
            }
        };

        this.ws.onmessage = (event: MessageEvent) => {
            this.handleMessage(event.data);
        };

        this.ws.onclose = (event: CloseEvent) => {
            this.clearHeartbeat();
            this.ws = null;

            // 认证失败不重连
            if (event.code === 4001) {
                this.setStatus('disconnected');
                this.dispatch('error', { message: '认证失败，请重新登录', code: 4001 });
                return;
            }

            this.scheduleReconnect();
        };

        this.ws.onerror = () => {
            // onerror 会紧接 onclose，不需要额外处理
        };
    }

    private handleMessage(raw: string | ArrayBuffer | Blob): void {
        if (typeof raw !== 'string') return;

        try {
            const msg = JSON.parse(raw) as WsMessage;
            this.dispatch(msg.event, msg.data);
        } catch {
            // 忽略非 JSON 消息
        }
    }

    // ================================================================
    // 私有：重连
    // ================================================================

    private scheduleReconnect(): void {
        if (MAX_RECONNECT_ATTEMPTS > 0 && this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            this.setStatus('disconnected');
            this.dispatch('error', { message: '重连次数已耗尽' });
            return;
        }

        this.setStatus('reconnecting');

        // 指数退避 + 随机抖动
        const baseDelay = Math.min(
            INITIAL_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts),
            MAX_RECONNECT_DELAY_MS,
        );
        const jitter = baseDelay * (0.5 + Math.random() * 0.5);
        const delay = Math.floor(jitter);

        this.reconnectAttempts++;
        this.reconnectTimer = setTimeout(() => {
            this.doConnect();
        }, delay);
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    // ================================================================
    // 私有：心跳
    // ================================================================

    private startHeartbeat(): void {
        this.clearHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            this.sendRaw({ action: 'ping' });
        }, HEARTBEAT_INTERVAL_MS);
    }

    private clearHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    // ================================================================
    // 私有：消息发送
    // ================================================================

    private sendAction(action: 'subscribe' | 'unsubscribe', channels: string[]): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.sendRaw({ action, channels });
    }

    private sendRaw(data: unknown): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        try {
            this.ws.send(JSON.stringify(data));
        } catch {
            // 静默失败
        }
    }

    // ================================================================
    // 私有：事件分发
    // ================================================================

    private dispatch(event: string, data: unknown): void {
        const callbacks = this.listeners.get(event);
        if (!callbacks) return;
        for (const cb of callbacks) {
            try {
                cb(data);
            } catch {
                // 消费者异常不影响其他订阅者
            }
        }
    }

    private setStatus(status: ConnectionStatus): void {
        if (this._status === status) return;
        this._status = status;
        for (const cb of this.statusListeners) {
            try {
                cb(status);
            } catch {
                // 忽略
            }
        }
    }
}

// =========================================================================
// 导出单例
// =========================================================================

/**
 * 全局 WebSocket 服务实例（单例）
 *
 * 整个前端应用共享同一个 WebSocket 连接。
 * 在 App.tsx 或全局初始化处调用 wsService.connect(token) 建立连接。
 */
export const wsService = new WebSocketService();
