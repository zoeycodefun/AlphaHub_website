/**
 * 现货底部面板组件（SpotBalanceHistory）
 *
 * 6 个 Tab 页：
 *   1. 当前委托 — 挂单中的限价 / 止损限价订单
 *   2. 历史委托 — 已完成 / 已取消的历史订单
 *   3. 历史成交 — 已成交记录明细
 *   4. 持有币种 — 各币种余额概览
 *   5. 策略机器人 — 运行中的自动交易策略列表
 *   6. 账户信息 — 资产总览、手续费等级等
 */
import React, { memo, useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTradingStore } from '../../../../global_state_store/trading_global_state_store';
import { OrderHistoryTable, type OrderRecord } from '../../../../components/trading/order_history_table';
import { formatPrice, formatVolume } from '../../../../hooks/use_format';

// =========================================================================
// Tab 定义
// =========================================================================

type BottomTab = 'open_orders' | 'order_history' | 'trade_history' | 'holdings' | 'strategy_bots' | 'account';

const TAB_LIST: { key: BottomTab; label: string; icon: string }[] = [
    { key: 'open_orders',   label: '当前委托', icon: '📋' },
    { key: 'order_history', label: '历史委托', icon: '📜' },
    { key: 'trade_history', label: '历史成交', icon: '💹' },
    { key: 'holdings',      label: '持有币种', icon: '💰' },
    { key: 'strategy_bots', label: '策略机器人', icon: '🤖' },
    { key: 'account',       label: '账户信息', icon: 'ℹ️' },
];

// =========================================================================
// 组件
// =========================================================================

const SpotBalanceHistory = memo(function SpotBalanceHistory() {
    const [activeTab, setActiveTab] = useState<BottomTab>('open_orders');

    const spotOpenOrders = useTradingStore((s) => s.spotOpenOrders);
    const spotOrderHistory = useTradingStore((s) => s.spotOrderHistory);
    const spotOrderHistoryTotal = useTradingStore((s) => s.spotOrderHistoryTotal);
    const spotBalances = useTradingStore((s) => s.spotBalances);
    const spotAccountSummary = useTradingStore((s) => s.spotAccountSummary);
    const isLoadingOrders = useTradingStore((s) => s.isLoadingSpotOrders);
    const isLoadingBalances = useTradingStore((s) => s.isLoadingSpotBalances);

    const fetchOpenOrders = useTradingStore((s) => s.fetchSpotOpenOrders);
    const fetchOrderHistory = useTradingStore((s) => s.fetchSpotOrderHistory);
    const fetchBalances = useTradingStore((s) => s.fetchSpotBalances);
    const fetchAccountSummary = useTradingStore((s) => s.fetchSpotAccountSummary);
    const cancelOrder = useTradingStore((s) => s.cancelSpotOrder);
    const batchCancel = useTradingStore((s) => s.batchCancelSpotOrders);

    const [historyPage, setHistoryPage] = useState(1);

    useEffect(() => {
        fetchOpenOrders();
        fetchOrderHistory(1);
        fetchBalances();
        fetchAccountSummary();
    }, [fetchOpenOrders, fetchOrderHistory, fetchBalances, fetchAccountSummary]);

    const handlePageChange = useCallback((page: number) => {
        setHistoryPage(page);
        fetchOrderHistory(page);
    }, [fetchOrderHistory]);

    const handleRefresh = useCallback(() => {
        fetchOpenOrders();
        fetchBalances();
        fetchAccountSummary();
    }, [fetchOpenOrders, fetchBalances, fetchAccountSummary]);

    const openOrderRecords: OrderRecord[] = spotOpenOrders.map((o) => ({
        id: o.id, symbol: o.symbol, side: o.side, orderType: o.orderType,
        amount: o.amount, filledAmount: o.filledAmount, price: o.price,
        averagePrice: o.averagePrice, status: o.status, createdAt: o.createdAt,
    }));

    const historyOrderRecords: OrderRecord[] = spotOrderHistory.map((o) => ({
        id: o.id, symbol: o.symbol, side: o.side, orderType: o.orderType,
        amount: o.amount, filledAmount: o.filledAmount, price: o.price,
        averagePrice: o.averagePrice, status: o.status, createdAt: o.createdAt,
    }));

    return (
        <div className="h-full bg-card rounded-lg flex flex-col overflow-hidden">
            {/* ─── Tab 栏（6 tabs） ───────────────────────────────── */}
            <div className="flex items-center justify-between border-b border-base px-2 shrink-0">
                <div className="flex overflow-x-auto hide-scrollbar">
                    {TAB_LIST.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-1 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                                activeTab === tab.key
                                    ? 'border-blue-500 text-primary'
                                    : 'border-transparent text-dim hover:text-secondary'
                            }`}
                        >
                            <span className="text-[10px]">{tab.icon}</span>
                            {tab.label}
                            {tab.key === 'open_orders' && spotOpenOrders.length > 0 && (
                                <span className="text-[8px] px-1 py-px rounded-full bg-blue-500/20 text-blue-400 ml-1">{spotOpenOrders.length}</span>
                            )}
                        </button>
                    ))}
                </div>
                <button onClick={handleRefresh} className="p-1.5 text-muted hover:text-primary transition-colors rounded hover:bg-surface shrink-0 ml-2" title="刷新">
                    <RefreshCw size={13} />
                </button>
            </div>

            {/* ─── 内容区 ─────────────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-auto">
                {activeTab === 'open_orders' && (
                    <OrderHistoryTable
                        openOrders={openOrderRecords}
                        historyOrders={[]}
                        historyTotal={0}
                        currentPage={1}
                        pageSize={20}
                        onPageChange={() => {}}
                        onCancelOrder={(id) => cancelOrder(id)}
                        onBatchCancel={(ids) => batchCancel(ids)}
                        isLoading={isLoadingOrders}
                        showLeverage={false}
                    />
                )}

                {activeTab === 'order_history' && (
                    <OrderHistoryTable
                        openOrders={[]}
                        historyOrders={historyOrderRecords}
                        historyTotal={spotOrderHistoryTotal}
                        currentPage={historyPage}
                        pageSize={20}
                        onPageChange={handlePageChange}
                        onCancelOrder={() => {}}
                        onBatchCancel={() => {}}
                        isLoading={isLoadingOrders}
                        showLeverage={false}
                    />
                )}

                {activeTab === 'trade_history' && <TradeHistoryPanel />}

                {activeTab === 'holdings' && (
                    <BalanceList
                        balances={spotBalances}
                        totalValue={spotAccountSummary?.totalUsdtValue ?? 0}
                        isLoading={isLoadingBalances}
                    />
                )}

                {activeTab === 'strategy_bots' && <StrategyBotsPanel />}

                {activeTab === 'account' && (
                    <AccountInfoPanel summary={spotAccountSummary} balances={spotBalances} />
                )}
            </div>
        </div>
    );
});

SpotBalanceHistory.displayName = 'SpotBalanceHistory';

// =========================================================================
// Tab 3: 历史成交面板
// =========================================================================

const MOCK_TRADES = [
    { id: 't-1', symbol: 'BTC/USDT', side: 'buy' as const, price: 67850.20, amount: 0.015, fee: 0.68, feeCurrency: 'USDT', time: new Date(Date.now() - 3600000).toISOString() },
    { id: 't-2', symbol: 'ETH/USDT', side: 'sell' as const, price: 3642.50, amount: 0.5, fee: 1.82, feeCurrency: 'USDT', time: new Date(Date.now() - 7200000).toISOString() },
    { id: 't-3', symbol: 'BTC/USDT', side: 'buy' as const, price: 67200.00, amount: 0.008, fee: 0.27, feeCurrency: 'USDT', time: new Date(Date.now() - 14400000).toISOString() },
];

const TradeHistoryPanel = memo(function TradeHistoryPanel() {
    return (
        <div>
            <div className="grid grid-cols-7 gap-2 px-4 py-2 text-[10px] text-dim font-medium border-b border-base/30">
                <span>时间</span><span>交易对</span><span>方向</span><span className="text-right">价格</span>
                <span className="text-right">数量</span><span className="text-right">金额</span><span className="text-right">手续费</span>
            </div>
            {MOCK_TRADES.map(t => (
                <div key={t.id} className="grid grid-cols-7 gap-2 px-4 py-2 text-xs border-b border-base/20 hover:bg-surface/30">
                    <span className="text-dim text-[10px]">{new Date(t.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span className="text-primary">{t.symbol}</span>
                    <span className={t.side === 'buy' ? 'text-green-400' : 'text-red-400'}>{t.side === 'buy' ? '买入' : '卖出'}</span>
                    <span className="text-right text-secondary font-mono">{formatPrice(t.price, 2)}</span>
                    <span className="text-right text-secondary font-mono">{t.amount}</span>
                    <span className="text-right text-secondary font-mono">{formatPrice(t.price * t.amount, 2)}</span>
                    <span className="text-right text-dim font-mono">{t.fee} {t.feeCurrency}</span>
                </div>
            ))}
            {MOCK_TRADES.length === 0 && (
                <div className="flex items-center justify-center py-12 text-dim text-xs">暂无成交记录</div>
            )}
        </div>
    );
});
TradeHistoryPanel.displayName = 'TradeHistoryPanel';

// =========================================================================
// Tab 5: 策略机器人面板
// =========================================================================

const MOCK_BOTS = [
    { id: 'bot-1', name: 'BTC 网格策略', pair: 'BTC/USDT', status: 'running' as const, pnl: 1250.40, pnlPct: 2.35, runtime: '12天 5小时', trades: 847 },
    { id: 'bot-2', name: 'ETH DCA 定投', pair: 'ETH/USDT', status: 'running' as const, pnl: 320.15, pnlPct: 1.82, runtime: '30天 0小时', trades: 60 },
    { id: 'bot-3', name: 'SOL 趋势追踪', pair: 'SOL/USDT', status: 'paused' as const, pnl: -85.20, pnlPct: -0.45, runtime: '5天 18小时', trades: 128 },
];

const StrategyBotsPanel = memo(function StrategyBotsPanel() {
    return (
        <div>
            <div className="grid grid-cols-7 gap-2 px-4 py-2 text-[10px] text-dim font-medium border-b border-base/30">
                <span>策略名称</span><span>交易对</span><span>状态</span><span className="text-right">盈亏</span>
                <span className="text-right">盈亏率</span><span className="text-right">运行时长</span><span className="text-right">成交笔数</span>
            </div>
            {MOCK_BOTS.map(bot => (
                <div key={bot.id} className="grid grid-cols-7 gap-2 px-4 py-2 text-xs border-b border-base/20 hover:bg-surface/30 cursor-pointer">
                    <span className="text-primary font-medium">{bot.name}</span>
                    <span className="text-secondary">{bot.pair}</span>
                    <span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            bot.status === 'running' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                            {bot.status === 'running' ? '运行中' : '已暂停'}
                        </span>
                    </span>
                    <span className={`text-right font-mono ${bot.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {bot.pnl >= 0 ? '+' : ''}{formatPrice(bot.pnl, 2)}
                    </span>
                    <span className={`text-right font-mono ${bot.pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {bot.pnlPct >= 0 ? '+' : ''}{bot.pnlPct}%
                    </span>
                    <span className="text-right text-muted">{bot.runtime}</span>
                    <span className="text-right text-muted font-mono">{bot.trades}</span>
                </div>
            ))}
            {MOCK_BOTS.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-dim text-xs">
                    <span className="text-2xl mb-2">🤖</span>
                    <span>暂无运行中的策略</span>
                </div>
            )}
        </div>
    );
});
StrategyBotsPanel.displayName = 'StrategyBotsPanel';

// =========================================================================
// Tab 6: 账户信息面板
// =========================================================================

interface AccountInfoPanelProps {
    summary: { totalUsdtValue?: number; [key: string]: unknown } | null;
    balances: Array<{ currency: string; available: number; frozen: number; total: number; usdtValue: number }>;
}

const AccountInfoPanel = memo(function AccountInfoPanel({ summary, balances }: AccountInfoPanelProps) {
    const totalValue = (summary?.totalUsdtValue as number) ?? 0;
    const holdingCount = balances.filter(b => b.total > 0).length;

    return (
        <div className="px-4 py-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoCard label="总资产估值" value={`$${formatPrice(totalValue, 2)}`} icon="💰" />
                <InfoCard label="持有币种数" value={`${holdingCount}`} icon="🪙" />
                <InfoCard label="手续费等级" value="VIP 1 (Maker 0.08%)" icon="⭐" />
                <InfoCard label="30天交易量" value="$125,842" icon="📊" />
                <InfoCard label="API 状态" value="已连接" icon="🔗" valueColor="text-green-400" />
                <InfoCard label="交易所" value="Binance" icon="🏛️" />
                <InfoCard label="账户类型" value="现货主账户" icon="📁" />
                <InfoCard label="创建时间" value="2024-01-15" icon="📅" />
            </div>
        </div>
    );
});
AccountInfoPanel.displayName = 'AccountInfoPanel';

const InfoCard: React.FC<{ label: string; value: string; icon: string; valueColor?: string }> = memo(({ label, value, icon, valueColor = 'text-primary' }) => (
    <div className="bg-surface/60 rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[12px]">{icon}</span>
            <span className="text-[10px] text-dim">{label}</span>
        </div>
        <span className={`text-sm font-medium ${valueColor}`}>{value}</span>
    </div>
));
InfoCard.displayName = 'InfoCard';

// =========================================================================
// Tab 4: 资产余额列表（保留原有实现）
// =========================================================================

interface BalanceListProps {
    balances: Array<{ currency: string; available: number; frozen: number; total: number; usdtValue: number }>;
    totalValue: number;
    isLoading: boolean;
}

const BalanceList = memo(function BalanceList({ balances, totalValue, isLoading }: BalanceListProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            </div>
        );
    }

    const filteredBalances = balances.filter((b) => b.total > 0);

    return (
        <div>
            <div className="px-4 py-3 border-b border-base">
                <div className="text-xs text-dim mb-1">总资产估值 (USDT)</div>
                <div className="text-lg text-primary font-bold font-mono">{formatPrice(totalValue, 2)}</div>
            </div>

            <div className="grid grid-cols-5 gap-2 px-4 py-2 text-[10px] text-dim font-medium">
                <span>币种</span><span className="text-right">可用</span><span className="text-right">冻结</span>
                <span className="text-right">总计</span><span className="text-right">估值 (USDT)</span>
            </div>

            {filteredBalances.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-dim text-xs">
                    <span className="text-xl mb-2">💰</span>
                    <span>暂无资产</span>
                </div>
            ) : (
                filteredBalances.map((balance) => (
                    <div key={balance.currency} className="grid grid-cols-5 gap-2 px-4 py-2 text-xs border-b border-base/30 hover:bg-surface/30">
                        <span className="text-primary font-medium">{balance.currency}</span>
                        <span className="text-right text-secondary font-mono">{formatVolume(balance.available, 4)}</span>
                        <span className="text-right text-dim font-mono">{balance.frozen > 0 ? formatVolume(balance.frozen, 4) : '-'}</span>
                        <span className="text-right text-primary font-mono">{formatVolume(balance.total, 4)}</span>
                        <span className="text-right text-muted font-mono">{formatPrice(balance.usdtValue, 2)}</span>
                    </div>
                ))
            )}
        </div>
    );
});
BalanceList.displayName = 'BalanceList';

export default SpotBalanceHistory;
