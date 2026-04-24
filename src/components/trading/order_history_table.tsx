/**
 * 订单历史表格组件（OrderHistoryTable）
 *
 * 现货 & 合约通用的订单列表展示组件：
 *
 *   1. Tab 切换：当前挂单 / 历史订单
 *   2. 表格展示：交易对、方向、类型、价格、数量、状态、时间
 *   3. 撤单操作（仅当前挂单显示）
 *   4. 分页加载
 *   5. 空状态 & 加载状态
 *
 * Props 驱动设计，不直接依赖全局 Store。
 */
import React, { memo, useState, useCallback } from 'react';
import { X, Clock, FileText } from 'lucide-react';
import type { OrderSide, OrderStatus } from '../../pages/trade_center_pages/type/spot_trading_types';
import { formatPrice, formatTimestamp } from '../../hooks/use_format';

// =========================================================================
// 类型定义
// =========================================================================

/** 通用订单数据（兼容现货 & 合约） */
export interface OrderRecord {
    id: string;
    symbol: string;
    side: OrderSide;
    orderType: string;
    amount: number;
    filledAmount: number;
    price: number;
    averagePrice: number;
    status: OrderStatus;
    createdAt: string;
    /** 合约特有字段 */
    leverage?: number;
    positionSide?: string;
}

/** 组件 Props */
export interface OrderHistoryTableProps {
    /** 当前挂单列表 */
    openOrders: OrderRecord[];
    /** 历史订单列表 */
    historyOrders: OrderRecord[];
    /** 历史订单总数（用于分页） */
    historyTotal?: number;
    /** 当前页码 */
    currentPage?: number;
    /** 每页数量 */
    pageSize?: number;
    /** 翻页回调 */
    onPageChange?: (page: number) => void;
    /** 撤单回调 */
    onCancelOrder?: (orderId: string) => void;
    /** 批量撤单回调 */
    onBatchCancel?: (orderIds: string[]) => void;
    /** 是否加载中 */
    isLoading?: boolean;
    /** 是否显示杠杆列（合约模式） */
    showLeverage?: boolean;
    /** 自定义 CSS */
    className?: string;
}

// =========================================================================
// 状态标签映射
// =========================================================================

const STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
    pending: { label: '待提交', color: 'text-yellow-500' },
    open: { label: '已挂单', color: 'text-blue-400' },
    partially_filled: { label: '部分成交', color: 'text-blue-300' },
    filled: { label: '全部成交', color: 'text-green-500' },
    cancelled: { label: '已撤单', color: 'text-dim' },
    expired: { label: '已过期', color: 'text-dim' },
    rejected: { label: '已拒绝', color: 'text-red-500' },
};

/** 订单类型显示名称 */
const ORDER_TYPE_LABELS: Record<string, string> = {
    limit: '限价',
    market: '市价',
    stop_limit: '止损限价',
    stop_market: '止损市价',
    take_profit: '止盈',
    stop_loss: '止损',
    trailing_stop: '追踪止损',
};

// =========================================================================
// 组件实现
// =========================================================================

type ActiveTab = 'open' | 'history';

const OrderHistoryTable = memo(function OrderHistoryTable(props: OrderHistoryTableProps) {
    const {
        openOrders,
        historyOrders,
        historyTotal = 0,
        currentPage = 1,
        pageSize = 20,
        onPageChange,
        onCancelOrder,
        onBatchCancel,
        isLoading = false,
        showLeverage = false,
        className = '',
    } = props;

    const [activeTab, setActiveTab] = useState<ActiveTab>('open');

    const orders = activeTab === 'open' ? openOrders : historyOrders;
    const totalPages = Math.ceil(historyTotal / pageSize);

    // 全部撤单
    const handleBatchCancel = useCallback(() => {
        if (openOrders.length > 0 && onBatchCancel) {
            onBatchCancel(openOrders.map((o) => o.id));
        }
    }, [openOrders, onBatchCancel]);

    return (
        <div className={`bg-card rounded-lg overflow-hidden ${className}`}>
            {/* ─── Tab 栏 ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between border-b border-base px-4">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('open')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'open'
                                ? 'border-blue-500 text-primary'
                                : 'border-transparent text-muted hover:text-primary'
                        }`}
                    >
                        当前挂单
                        {openOrders.length > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
                                {openOrders.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'history'
                                ? 'border-blue-500 text-primary'
                                : 'border-transparent text-muted hover:text-primary'
                        }`}
                    >
                        历史订单
                    </button>
                </div>

                {/* 全部撤单按钮（仅挂单 Tab 显示） */}
                {activeTab === 'open' && openOrders.length > 0 && onBatchCancel && (
                    <button
                        onClick={handleBatchCancel}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                        全部撤单
                    </button>
                )}
            </div>

            {/* ─── 表头 ───────────────────────────────────────────── */}
            <div className={`grid ${showLeverage ? 'grid-cols-9' : 'grid-cols-8'} gap-2 px-4 py-2 text-xs text-dim font-medium`}>
                <span>时间</span>
                <span>交易对</span>
                <span>方向</span>
                <span>类型</span>
                {showLeverage && <span className="text-right">杠杆</span>}
                <span className="text-right">价格</span>
                <span className="text-right">数量</span>
                <span className="text-right">状态</span>
                <span className="text-right">操作</span>
            </div>

            {/* ─── 内容区 ─────────────────────────────────────────── */}
            {isLoading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-dim text-sm">
                    <FileText size={24} className="mb-2 text-secondary" />
                    <span>{activeTab === 'open' ? '暂无挂单' : '暂无历史订单'}</span>
                </div>
            ) : (
                <>
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className={`grid ${showLeverage ? 'grid-cols-9' : 'grid-cols-8'} gap-2 px-4 py-2.5 border-b border-base/50 hover:bg-surface/30 text-sm items-center`}
                        >
                            {/* 时间 */}
                            <span className="text-muted text-xs font-mono">
                                {formatTimestamp(order.createdAt)}
                            </span>

                            {/* 交易对 */}
                            <span className="text-primary font-medium text-xs">{order.symbol}</span>

                            {/* 方向 */}
                            <span className={`text-xs font-medium ${
                                order.side === 'buy' ? 'text-green-500' : 'text-red-500'
                            }`}>
                                {order.side === 'buy' ? '买入' : '卖出'}
                            </span>

                            {/* 类型 */}
                            <span className="text-secondary text-xs">
                                {ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}
                            </span>

                            {/* 杠杆 */}
                            {showLeverage && (
                                <span className="text-right text-yellow-500 text-xs font-mono">
                                    {order.leverage ? `${order.leverage}x` : '-'}
                                </span>
                            )}

                            {/* 价格 */}
                            <span className="text-right text-primary font-mono text-xs">
                                {order.price > 0 ? formatPrice(order.price) : '市价'}
                            </span>

                            {/* 数量（已成交/总量） */}
                            <span className="text-right text-secondary font-mono text-xs">
                                {order.filledAmount > 0
                                    ? `${order.filledAmount}/${order.amount}`
                                    : order.amount
                                }
                            </span>

                            {/* 状态 */}
                            <span className={`text-right text-xs ${STATUS_MAP[order.status]?.color ?? 'text-muted'}`}>
                                {STATUS_MAP[order.status]?.label ?? order.status}
                            </span>

                            {/* 操作 */}
                            <div className="text-right">
                                {(order.status === 'open' || order.status === 'pending' || order.status === 'partially_filled') && onCancelOrder ? (
                                    <button
                                        onClick={() => onCancelOrder(order.id)}
                                        className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-0.5 ml-auto"
                                    >
                                        <X size={12} />
                                        撤单
                                    </button>
                                ) : (
                                    <span className="text-secondary text-xs">-</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* ─── 分页（仅历史 Tab） ──────────────────────── */}
                    {activeTab === 'history' && totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 py-3">
                            <button
                                disabled={currentPage <= 1}
                                onClick={() => onPageChange?.(currentPage - 1)}
                                className="px-3 py-1 text-xs rounded bg-surface text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                上一页
                            </button>
                            <span className="text-xs text-muted">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => onPageChange?.(currentPage + 1)}
                                className="px-3 py-1 text-xs rounded bg-surface text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                下一页
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
});

OrderHistoryTable.displayName = 'OrderHistoryTable';

export { OrderHistoryTable };
