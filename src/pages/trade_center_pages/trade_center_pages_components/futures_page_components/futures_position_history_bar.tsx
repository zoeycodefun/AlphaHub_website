/**
 * 合约持仓 & 订单历史底部栏（FuturesPositionHistoryBar）
 *
 * 页面底部区域，包含八个 Tab：
 *
 *   Tab 1 —— 仓位：展示所有持仓，含未实现盈亏、强平价、杠杆等
 *   Tab 2 —— 当前委托：当前挂单列表
 *   Tab 3 —— 历史委托：已完成 / 已取消委托
 *   Tab 4 —— 历史成交：成交记录
 *   Tab 5 —— 资金费历史：资金费率收付记录
 *   Tab 6 —— 资金流水：划转、入金、出金等流水
 *   Tab 7 —— 策略机器人运行记录：Bot 运行日志
 *   Tab 8 —— 账户：合约账户权益、保证金使用率等
 *
 * 数据来源：useTradingStore（自动加载持仓 / 订单 / 账户信息）
 * Tab 4-7 当前为 Mock/空面板，后续接入后端数据。
 */
import React, { memo, useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTradingStore } from '../../../../global_state_store/trading_global_state_store';
import { PositionTable } from '../../../../components/trading/position_table';
import { OrderHistoryTable, type OrderRecord } from '../../../../components/trading/order_history_table';
import { formatPrice, formatPnl, formatPercent, getPnlColorClass } from '../../../../hooks/use_format';

// =========================================================================
// Tab 定义
// =========================================================================

type BottomTab = 'positions' | 'open_orders' | 'order_history' | 'trade_history' | 'funding_history' | 'fund_flow' | 'bot_logs' | 'account';

const TAB_CONFIG: { key: BottomTab; label: string }[] = [
    { key: 'positions',       label: '仓位' },
    { key: 'open_orders',     label: '当前委托' },
    { key: 'order_history',   label: '历史委托' },
    { key: 'trade_history',   label: '历史成交' },
    { key: 'funding_history', label: '资金费历史' },
    { key: 'fund_flow',       label: '资金流水' },
    { key: 'bot_logs',        label: '策略机器人' },
    { key: 'account',         label: '账户' },
];

// =========================================================================
// Mock 数据（后续替换为真实接口）
// =========================================================================

interface TradeRecord {
    id: string; symbol: string; side: string; price: number; amount: number; fee: number; time: string;
}

const MOCK_TRADES: TradeRecord[] = [
    { id: 't1', symbol: 'BTC/USDT', side: 'buy', price: 68200, amount: 0.1, fee: 6.82, time: '2024-01-15 14:32:10' },
    { id: 't2', symbol: 'ETH/USDT', side: 'sell', price: 3850, amount: 2, fee: 7.7, time: '2024-01-15 13:21:05' },
    { id: 't3', symbol: 'BTC/USDT', side: 'sell', price: 68500, amount: 0.05, fee: 3.43, time: '2024-01-15 11:10:22' },
];

interface FundingRecord {
    id: string; symbol: string; rate: number; amount: number; side: string; time: string;
}

const MOCK_FUNDING: FundingRecord[] = [
    { id: 'fr1', symbol: 'BTC/USDT', rate: 0.0001, amount: -3.42, side: '支付', time: '2024-01-15 16:00:00' },
    { id: 'fr2', symbol: 'BTC/USDT', rate: -0.0002, amount: 6.84, side: '收取', time: '2024-01-15 08:00:00' },
    { id: 'fr3', symbol: 'ETH/USDT', rate: 0.0003, amount: -2.31, side: '支付', time: '2024-01-15 00:00:00' },
];

interface FundFlowRecord {
    id: string; type: string; amount: number; currency: string; status: string; time: string;
}

const MOCK_FUND_FLOW: FundFlowRecord[] = [
    { id: 'ff1', type: '划转入', amount: 5000, currency: 'USDT', status: '完成', time: '2024-01-15 09:00:00' },
    { id: 'ff2', type: '划转出', amount: -2000, currency: 'USDT', status: '完成', time: '2024-01-14 20:00:00' },
    { id: 'ff3', type: '已实现盈亏', amount: 320.5, currency: 'USDT', status: '完成', time: '2024-01-14 15:30:00' },
];

interface BotLogRecord {
    id: string; botName: string; symbol: string; action: string; profit: number; status: string; time: string;
}

const MOCK_BOT_LOGS: BotLogRecord[] = [
    { id: 'bl1', botName: '网格策略 #1', symbol: 'BTC/USDT', action: '开多 0.01 BTC @ 67800', profit: 12.5, status: '运行中', time: '2024-01-15 14:00:00' },
    { id: 'bl2', botName: 'DCA 策略 #2', symbol: 'ETH/USDT', action: '定投买入 0.5 ETH', profit: -3.2, status: '运行中', time: '2024-01-15 12:00:00' },
    { id: 'bl3', botName: '套利策略 #3', symbol: 'BTC/USDT', action: '资金费率套利 收取', profit: 6.84, status: '已暂停', time: '2024-01-15 08:00:00' },
];

// =========================================================================
// 组件
// =========================================================================

const FuturesPositionHistoryBar = memo(function FuturesPositionHistoryBar() {
    const [activeTab, setActiveTab] = useState<BottomTab>('positions');

    // Store 数据
    const futuresPositions = useTradingStore((s) => s.futuresPositions);
    const futuresOpenOrders = useTradingStore((s) => s.futuresOpenOrders);
    const futuresOrderHistory = useTradingStore((s) => s.futuresOrderHistory);
    const futuresOrderHistoryTotal = useTradingStore((s) => s.futuresOrderHistoryTotal);
    const futuresAccountSummary = useTradingStore((s) => s.futuresAccountSummary);
    const isLoadingPositions = useTradingStore((s) => s.isLoadingFuturesPositions);
    const isLoadingOrders = useTradingStore((s) => s.isLoadingFuturesOrders);
    const isLoadingAccount = useTradingStore((s) => s.isLoadingFuturesAccount);

    // Store Actions
    const fetchPositions = useTradingStore((s) => s.fetchFuturesPositions);
    const fetchOpenOrders = useTradingStore((s) => s.fetchFuturesOpenOrders);
    const fetchOrderHistory = useTradingStore((s) => s.fetchFuturesOrderHistory);
    const fetchAccountSummary = useTradingStore((s) => s.fetchFuturesAccountSummary);
    const cancelOrder = useTradingStore((s) => s.cancelFuturesOrder);
    const closePosition = useTradingStore((s) => s.closePosition);

    const [historyPage, setHistoryPage] = useState(1);

    // 初始加载
    useEffect(() => {
        fetchPositions();
        fetchOpenOrders();
        fetchOrderHistory(1);
        fetchAccountSummary();
    }, [fetchPositions, fetchOpenOrders, fetchOrderHistory, fetchAccountSummary]);

    const handlePageChange = useCallback((page: number) => {
        setHistoryPage(page);
        fetchOrderHistory(page);
    }, [fetchOrderHistory]);

    const handleRefresh = useCallback(() => {
        fetchPositions();
        fetchOpenOrders();
        fetchAccountSummary();
    }, [fetchPositions, fetchOpenOrders, fetchAccountSummary]);

    const handleClosePosition = useCallback((symbol: string, positionSide: string) => {
        closePosition(symbol, positionSide);
    }, [closePosition]);

    // 转换订单数据
    const openOrderRecords: OrderRecord[] = futuresOpenOrders.map((o) => ({
        id: o.id, symbol: o.symbol, side: o.side, orderType: o.orderType,
        amount: o.amount, filledAmount: o.filledAmount, price: o.price,
        averagePrice: o.averagePrice, status: o.status, createdAt: o.createdAt,
        leverage: o.leverage, positionSide: o.positionSide,
    }));

    const historyOrderRecords: OrderRecord[] = futuresOrderHistory.map((o) => ({
        id: o.id, symbol: o.symbol, side: o.side, orderType: o.orderType,
        amount: o.amount, filledAmount: o.filledAmount, price: o.price,
        averagePrice: o.averagePrice, status: o.status, createdAt: o.createdAt,
        leverage: o.leverage, positionSide: o.positionSide,
    }));

    // 获取 badge
    const getBadge = (tab: BottomTab): number | undefined => {
        if (tab === 'positions') return futuresPositions.filter(p => p.amount !== 0).length || undefined;
        if (tab === 'open_orders') return futuresOpenOrders.length || undefined;
        return undefined;
    };

    return (
        <div className="h-full bg-card rounded-lg flex flex-col overflow-hidden">
            {/* ─── Tab 栏 ─────────────────────────────────────── */}
            <div className="flex items-center justify-between border-b border-base px-2 shrink-0">
                <div className="flex overflow-x-auto">
                    {TAB_CONFIG.map((tab) => (
                        <TabButton
                            key={tab.key}
                            isActive={activeTab === tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            label={tab.label}
                            badge={getBadge(tab.key)}
                        />
                    ))}
                </div>
                <button onClick={handleRefresh} className="p-1.5 text-muted hover:text-primary transition-colors rounded hover:bg-surface shrink-0" title="刷新">
                    <RefreshCw size={14} />
                </button>
            </div>

            {/* ─── 内容区 ─────────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-auto">
                {/* Tab 1: 仓位 */}
                {activeTab === 'positions' && (
                    <PositionTable positions={futuresPositions} isLoading={isLoadingPositions} onClosePosition={handleClosePosition} />
                )}

                {/* Tab 2: 当前委托 */}
                {activeTab === 'open_orders' && (
                    <OrderHistoryTable
                        openOrders={openOrderRecords} historyOrders={[]}
                        historyTotal={0} currentPage={1} pageSize={20}
                        onPageChange={() => {}} onCancelOrder={(id) => cancelOrder(id)}
                        isLoading={isLoadingOrders} showLeverage={true}
                    />
                )}

                {/* Tab 3: 历史委托 */}
                {activeTab === 'order_history' && (
                    <OrderHistoryTable
                        openOrders={[]} historyOrders={historyOrderRecords}
                        historyTotal={futuresOrderHistoryTotal} currentPage={historyPage} pageSize={20}
                        onPageChange={handlePageChange} onCancelOrder={() => {}}
                        isLoading={isLoadingOrders} showLeverage={true}
                    />
                )}

                {/* Tab 4: 历史成交 */}
                {activeTab === 'trade_history' && <TradeHistoryPanel />}

                {/* Tab 5: 资金费历史 */}
                {activeTab === 'funding_history' && <FundingHistoryPanel />}

                {/* Tab 6: 资金流水 */}
                {activeTab === 'fund_flow' && <FundFlowPanel />}

                {/* Tab 7: 策略机器人运行记录 */}
                {activeTab === 'bot_logs' && <BotLogsPanel />}

                {/* Tab 8: 账户 */}
                {activeTab === 'account' && (
                    <FuturesAccountPanel summary={futuresAccountSummary} isLoading={isLoadingAccount} />
                )}
            </div>
        </div>
    );
});

FuturesPositionHistoryBar.displayName = 'FuturesPositionHistoryBar';

// =========================================================================
// Tab 按钮
// =========================================================================

interface TabButtonProps {
    isActive: boolean;
    onClick: () => void;
    label: string;
    badge?: number;
}

const TabButton = memo(function TabButton({ isActive, onClick, label, badge }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1 px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive ? 'border-blue-500 text-primary' : 'border-transparent text-muted hover:text-primary'
            }`}
        >
            {label}
            {badge != null && badge > 0 && (
                <span className="px-1 py-0.5 text-[9px] rounded-full bg-blue-500/20 text-blue-400">{badge}</span>
            )}
        </button>
    );
});
TabButton.displayName = 'TabButton';

// =========================================================================
// Tab 4: 历史成交面板
// =========================================================================

const TradeHistoryPanel = memo(function TradeHistoryPanel() {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
                <thead>
                    <tr className="text-dim border-b border-base">
                        <th className="text-left px-3 py-2 font-medium">时间</th>
                        <th className="text-left px-3 py-2 font-medium">交易对</th>
                        <th className="text-left px-3 py-2 font-medium">方向</th>
                        <th className="text-right px-3 py-2 font-medium">成交价</th>
                        <th className="text-right px-3 py-2 font-medium">数量</th>
                        <th className="text-right px-3 py-2 font-medium">手续费</th>
                    </tr>
                </thead>
                <tbody>
                    {MOCK_TRADES.map((t) => (
                        <tr key={t.id} className="border-b border-base/50 hover:bg-surface/30">
                            <td className="px-3 py-2 text-muted font-mono">{t.time}</td>
                            <td className="px-3 py-2 text-primary">{t.symbol}</td>
                            <td className={`px-3 py-2 ${t.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                                {t.side === 'buy' ? '做多' : '做空'}
                            </td>
                            <td className="px-3 py-2 text-right text-primary font-mono">{t.price.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right text-secondary font-mono">{t.amount}</td>
                            <td className="px-3 py-2 text-right text-dim font-mono">{t.fee.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});
TradeHistoryPanel.displayName = 'TradeHistoryPanel';

// =========================================================================
// Tab 5: 资金费历史面板
// =========================================================================

const FundingHistoryPanel = memo(function FundingHistoryPanel() {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
                <thead>
                    <tr className="text-dim border-b border-base">
                        <th className="text-left px-3 py-2 font-medium">时间</th>
                        <th className="text-left px-3 py-2 font-medium">交易对</th>
                        <th className="text-right px-3 py-2 font-medium">资金费率</th>
                        <th className="text-left px-3 py-2 font-medium">收付</th>
                        <th className="text-right px-3 py-2 font-medium">金额 (USDT)</th>
                    </tr>
                </thead>
                <tbody>
                    {MOCK_FUNDING.map((f) => (
                        <tr key={f.id} className="border-b border-base/50 hover:bg-surface/30">
                            <td className="px-3 py-2 text-muted font-mono">{f.time}</td>
                            <td className="px-3 py-2 text-primary">{f.symbol}</td>
                            <td className={`px-3 py-2 text-right font-mono ${f.rate > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {(f.rate * 100).toFixed(4)}%
                            </td>
                            <td className={`px-3 py-2 ${f.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>{f.side}</td>
                            <td className={`px-3 py-2 text-right font-mono ${f.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {f.amount > 0 ? '+' : ''}{f.amount.toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});
FundingHistoryPanel.displayName = 'FundingHistoryPanel';

// =========================================================================
// Tab 6: 资金流水面板
// =========================================================================

const FundFlowPanel = memo(function FundFlowPanel() {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
                <thead>
                    <tr className="text-dim border-b border-base">
                        <th className="text-left px-3 py-2 font-medium">时间</th>
                        <th className="text-left px-3 py-2 font-medium">类型</th>
                        <th className="text-right px-3 py-2 font-medium">金额</th>
                        <th className="text-left px-3 py-2 font-medium">币种</th>
                        <th className="text-left px-3 py-2 font-medium">状态</th>
                    </tr>
                </thead>
                <tbody>
                    {MOCK_FUND_FLOW.map((f) => (
                        <tr key={f.id} className="border-b border-base/50 hover:bg-surface/30">
                            <td className="px-3 py-2 text-muted font-mono">{f.time}</td>
                            <td className="px-3 py-2 text-primary">{f.type}</td>
                            <td className={`px-3 py-2 text-right font-mono ${f.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {f.amount > 0 ? '+' : ''}{f.amount.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-secondary">{f.currency}</td>
                            <td className="px-3 py-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">{f.status}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});
FundFlowPanel.displayName = 'FundFlowPanel';

// =========================================================================
// Tab 7: 策略机器人运行记录
// =========================================================================

const BotLogsPanel = memo(function BotLogsPanel() {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
                <thead>
                    <tr className="text-dim border-b border-base">
                        <th className="text-left px-3 py-2 font-medium">时间</th>
                        <th className="text-left px-3 py-2 font-medium">策略名称</th>
                        <th className="text-left px-3 py-2 font-medium">交易对</th>
                        <th className="text-left px-3 py-2 font-medium">操作</th>
                        <th className="text-right px-3 py-2 font-medium">盈亏</th>
                        <th className="text-left px-3 py-2 font-medium">状态</th>
                    </tr>
                </thead>
                <tbody>
                    {MOCK_BOT_LOGS.map((b) => (
                        <tr key={b.id} className="border-b border-base/50 hover:bg-surface/30">
                            <td className="px-3 py-2 text-muted font-mono">{b.time}</td>
                            <td className="px-3 py-2 text-primary">{b.botName}</td>
                            <td className="px-3 py-2 text-secondary">{b.symbol}</td>
                            <td className="px-3 py-2 text-secondary">{b.action}</td>
                            <td className={`px-3 py-2 text-right font-mono ${b.profit > 0 ? 'text-green-400' : b.profit < 0 ? 'text-red-400' : 'text-muted'}`}>
                                {b.profit > 0 ? '+' : ''}{b.profit.toFixed(2)}
                            </td>
                            <td className="px-3 py-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${b.status === '运行中' ? 'bg-green-500/10 text-green-400' : 'bg-base0/10 text-muted'}`}>
                                    {b.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});
BotLogsPanel.displayName = 'BotLogsPanel';

// =========================================================================
// Tab 8: 合约账户面板
// =========================================================================

interface FuturesAccountPanelProps {
    summary: import('../../type/futures_trading_types').FuturesAccountSummary | null;
    isLoading: boolean;
}

const FuturesAccountPanel = memo(function FuturesAccountPanel({ summary, isLoading }: FuturesAccountPanelProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-dim text-sm">
                <span>暂无账户数据</span>
            </div>
        );
    }

    const marginUsagePercent = summary.totalEquity > 0 ? (summary.usedMargin / summary.totalEquity) * 100 : 0;
    const marginRatioColor = summary.marginRatio > 50 ? 'text-green-500' : summary.marginRatio > 20 ? 'text-yellow-500' : 'text-red-500';

    return (
        <div className="p-4">
            <div className="grid grid-cols-4 gap-6">
                <div>
                    <div className="text-xs text-dim mb-1">账户权益</div>
                    <div className="text-lg text-primary font-bold font-mono">{formatPrice(summary.totalEquity, 2)}</div>
                    <div className="text-[10px] text-dim">USDT</div>
                </div>
                <div>
                    <div className="text-xs text-dim mb-1">可用保证金</div>
                    <div className="text-sm text-primary font-mono">{formatPrice(summary.availableMargin, 2)}</div>
                    <div className="mt-1 w-full h-1 bg-surface-hover rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(marginUsagePercent, 100)}%` }} />
                    </div>
                    <div className="text-[10px] text-dim mt-0.5">已用 {marginUsagePercent.toFixed(1)}%</div>
                </div>
                <div>
                    <div className="text-xs text-dim mb-1">未实现盈亏</div>
                    <div className={`text-sm font-mono font-medium ${getPnlColorClass(summary.totalUnrealizedPnl)}`}>
                        {formatPnl(summary.totalUnrealizedPnl)} USDT
                    </div>
                </div>
                <div>
                    <div className="text-xs text-dim mb-1">保证金率</div>
                    <div className={`text-sm font-mono font-medium ${marginRatioColor}`}>{formatPercent(summary.marginRatio)}</div>
                    <div className="text-[10px] text-dim">维持保证金: {formatPrice(summary.maintenanceMargin, 2)}</div>
                </div>
            </div>
        </div>
    );
});
FuturesAccountPanel.displayName = 'FuturesAccountPanel';

export default FuturesPositionHistoryBar;
