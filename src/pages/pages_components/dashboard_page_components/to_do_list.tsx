/**
 * 交易待办/预警列表组件（TodoList）
 *
 * Dashboard 核心组件之一，展示用户待处理的交易操作和预警通知：
 *
 * ─── 功能 ────────────────────────────────────────────────────────
 *  1. 待处理信号提醒（有 BUY/SELL 信号未执行）
 *  2. DCA 定投执行提醒（即将到期的定投计划）
 *  3. 价格预警触达通知（自选列表中的预警价格）
 *  4. 策略异常通知（策略连续失败、被挂起）
 *  5. 支持标记为已完成/忽略
 *
 * ─── 数据源 ────────────────────────────────────────────────────
 *  - 当前使用 Mock 数据（后端 API 就绪后切换为真实请求）
 *  - 预留 onDismiss / onAction 回调供实际操作
 */
import React, { useState, useCallback, useMemo, memo } from 'react';

// =========================================================================
// 类型定义
// =========================================================================

/** 待办优先级 */
export type TodoPriority = 'HIGH' | 'MEDIUM' | 'LOW';

/** 待办类型 */
export type TodoType =
    | 'SIGNAL'        // 信号提醒
    | 'DCA'           // 定投提醒
    | 'PRICE_ALERT'   // 价格预警
    | 'STRATEGY'      // 策略异常
    | 'SYSTEM';       // 系统通知

/** 待办条目 */
export interface TodoItem {
    /** 唯一 ID */
    id: string;
    /** 类型 */
    type: TodoType;
    /** 标题 */
    title: string;
    /** 描述 */
    description: string;
    /** 优先级 */
    priority: TodoPriority;
    /** 关联交易对 */
    symbol?: string;
    /** 创建时间 */
    createdAt: string;
    /** 是否已完成 */
    completed: boolean;
}

// =========================================================================
// 样式配置
// =========================================================================

/** 优先级颜色 */
const PRIORITY_STYLES: Record<TodoPriority, { dot: string; border: string }> = {
    HIGH:   { dot: 'bg-red-400',    border: 'border-l-red-400' },
    MEDIUM: { dot: 'bg-yellow-400', border: 'border-l-yellow-400' },
    LOW:    { dot: 'bg-blue-400',   border: 'border-l-blue-400' },
};

/** 类型图标 */
const TYPE_ICONS: Record<TodoType, string> = {
    SIGNAL:      '📊',
    DCA:         '🔄',
    PRICE_ALERT: '🔔',
    STRATEGY:    '⚡',
    SYSTEM:      'ℹ️',
};

// =========================================================================
// Mock 数据
// =========================================================================

const MOCK_TODOS: TodoItem[] = [
    {
        id: '1', type: 'SIGNAL', title: 'BTC/USDT 强看多信号',
        description: '趋势跟踪策略生成强看多信号（强度 85），建议关注入场机会。',
        priority: 'HIGH', symbol: 'BTC/USDT', createdAt: new Date(Date.now() - 10 * 60000).toISOString(), completed: false,
    },
    {
        id: '2', type: 'DCA', title: 'ETH 定投计划即将执行',
        description: '「以太坊周定投」计划将于今日 20:00 自动执行，投入金额 200 USDT。',
        priority: 'MEDIUM', symbol: 'ETH/USDT', createdAt: new Date(Date.now() - 30 * 60000).toISOString(), completed: false,
    },
    {
        id: '3', type: 'PRICE_ALERT', title: 'SOL 价格接近预警上界',
        description: 'SOL/USDT 当前价格 $182.5，距离预警价 $185.0 仅差 1.4%。',
        priority: 'MEDIUM', symbol: 'SOL/USDT', createdAt: new Date(Date.now() - 60 * 60000).toISOString(), completed: false,
    },
    {
        id: '4', type: 'STRATEGY', title: '网格策略执行异常',
        description: '「BTC 网格交易」策略连续 3 次下单失败，已自动暂停。请检查 API 密钥或余额。',
        priority: 'HIGH', symbol: 'BTC/USDT', createdAt: new Date(Date.now() - 120 * 60000).toISOString(), completed: false,
    },
    {
        id: '5', type: 'SYSTEM', title: '系统维护通知',
        description: 'Binance CEX 账号同步将于今晚 02:00-03:00 进行例行维护，期间自动交易暂停。',
        priority: 'LOW', createdAt: new Date(Date.now() - 240 * 60000).toISOString(), completed: false,
    },
];

// =========================================================================
// 工具函数
// =========================================================================

function formatRelativeTime(isoStr: string): string {
    const diff = Date.now() - new Date(isoStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
}

// =========================================================================
// 单条待办组件
// =========================================================================

interface TodoRowProps {
    item: TodoItem;
    onDismiss?: (id: string) => void;
}

const TodoRow: React.FC<TodoRowProps> = memo(({ item, onDismiss }) => {
    const priorityStyle = PRIORITY_STYLES[item.priority];
    const icon = TYPE_ICONS[item.type];

    const handleDismiss = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDismiss?.(item.id);
    }, [item.id, onDismiss]);

    return (
        <div
            className={`flex items-start gap-3 py-2.5 px-3 hover:bg-card/5 rounded-lg transition-colors border-l-2 ${priorityStyle.border} ${
                item.completed ? 'opacity-50' : ''
            }`}
        >
            {/* 图标 */}
            <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm font-medium ${item.completed ? 'text-dim line-through' : 'text-primary'}`}>
                        {item.title}
                    </span>
                    {item.symbol && (
                        <span className="text-[10px] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded flex-shrink-0">
                            {item.symbol.replace('/USDT', '')}
                        </span>
                    )}
                </div>
                <div className="text-xs text-dim leading-relaxed line-clamp-2">
                    {item.description}
                </div>
                <div className="text-[10px] text-muted mt-1">
                    {formatRelativeTime(item.createdAt)}
                </div>
            </div>

            {/* 操作按钮 */}
            {!item.completed && onDismiss && (
                <button
                    onClick={handleDismiss}
                    className="text-muted hover:text-muted transition-colors flex-shrink-0 mt-1"
                    title="标记为已处理"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </button>
            )}
        </div>
    );
});

TodoRow.displayName = 'TodoRow';

// =========================================================================
// 主组件
// =========================================================================

export interface TodoListProps {
    /** 待办数据（不传则使用 Mock 数据） */
    todos?: TodoItem[];
    /** 标题 */
    title?: string;
    /** 最大显示条数 */
    maxItems?: number;
    /** 标记为已处理回调 */
    onDismiss?: (id: string) => void;
}

const TodoList: React.FC<TodoListProps> = memo(({
    todos: externalTodos,
    title = '待办与预警',
    maxItems = 5,
    onDismiss: externalOnDismiss,
}) => {
    // 内部状态管理（当无外部数据时使用 Mock）
    const [internalTodos, setInternalTodos] = useState<TodoItem[]>(MOCK_TODOS);
    const todos = externalTodos ?? internalTodos;

    // 内部处理完成（当无外部回调时使用） 
    const handleDismiss = useCallback((id: string) => {
        if (externalOnDismiss) {
            externalOnDismiss(id);
        } else {
            setInternalTodos(prev => prev.map(t => t.id === id ? { ...t, completed: true } : t));
        }
    }, [externalOnDismiss]);

    // 未完成优先排序
    const sortedTodos = useMemo(() => {
        const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return [...todos]
            .sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            })
            .slice(0, maxItems);
    }, [todos, maxItems]);

    const pendingCount = todos.filter(t => !t.completed).length;

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4">
            {/* 标题栏 */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-primary">{title}</h3>
                    {pendingCount > 0 && (
                        <span className="text-[10px] bg-red-900/300/20 text-red-400 px-1.5 py-0.5 rounded-full font-medium">
                            {pendingCount}
                        </span>
                    )}
                </div>
            </div>

            {/* 列表 */}
            <div className="space-y-1">
                {sortedTodos.length > 0 ? (
                    sortedTodos.map(item => (
                        <TodoRow key={item.id} item={item} onDismiss={handleDismiss} />
                    ))
                ) : (
                    <div className="text-center py-8 text-dim text-sm">
                        🎉 没有待处理事项
                    </div>
                )}
            </div>
        </div>
    );
});

TodoList.displayName = 'TodoList';

export default TodoList;
