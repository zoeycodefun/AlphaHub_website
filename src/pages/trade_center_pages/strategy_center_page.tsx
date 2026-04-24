/**
 * 策略中心页面（Strategy Center Page）
 *
 * 交易中心子页面，管理所有自动化交易策略：
 *
 * ─── 布局 ────────────────────────────────────────────────────────
 *  ┌──────────────────────────────────────────────────────────┐
 *  │  页面标题 + 创建策略按钮                                 │
 *  ├───────────────────────────┬──────────────────────────────┤
 *  │  现货策略 (Spot)          │  合约策略 (Futures)           │
 *  │  ┌─────────────────────┐ │ ┌─────────────────────────┐  │
 *  │  │ 策略1 [7操作]       │ │ │ 策略A [7操作]            │  │
 *  │  │ 策略2 [7操作]       │ │ │ 策略B [7操作]            │  │
 *  │  └─────────────────────┘ │ └─────────────────────────┘  │
 *  ├───────────────────────────┴──────────────────────────────┤
 *  │  执行日志面板                                            │
 *  └──────────────────────────────────────────────────────────┘
 *
 * 7 个操作：启动、暂停、修改参数、策略配置详情、运行状态/日志、停止、删除
 * 当前使用 Mock 数据，后端 API 就绪后替换为 alphaApiService
 */
import React, { useState, useCallback, useMemo, memo, Suspense, lazy } from 'react';
import type { StrategyRecord, StrategyExecutionLog as LogType, StrategyConfigRequest, StrategyMarketType } from './type/alpha_module_types';

// ─── 子组件懒加载 ──────────────────────────────────────────────────
const StrategyListItem = lazy(() => import('./trade_center_pages_components/strategy_center_page_components/strategy_list_item'));
const StrategyDetailModal = lazy(() => import('./trade_center_pages_components/strategy_center_page_components/strategy_detail_modal'));
const StrategyConfigModal = lazy(() => import('./trade_center_pages_components/strategy_page_components/strategy_config_modal'));

// ─── 加载占位 ──────────────────────────────────────────────────────
function LoadingPanel({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-card rounded-lg animate-pulse flex items-center justify-center ${className}`}>
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

// =========================================================================
// Mock 数据
// =========================================================================

const MOCK_STRATEGIES: StrategyRecord[] = [
    {
        id: 'st1', name: 'MACD 趋势策略', description: '基于 MACD 指标的趋势跟踪策略，适合中长周期操作。',
        status: 'active', marketType: 'spot', symbols: ['BTC/USDT', 'ETH/USDT'], exchangeId: 'binance',
        executionMode: 'live', intervalMinutes: 15, lastExecutedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
        lastSignalScore: 78, totalExecutions: 342, successfulExecutions: 298, totalPnl: 4520.80, leverage: null,
        createdAt: '2025-12-01T00:00:00Z',
    },
    {
        id: 'st2', name: 'RSI 超卖反弹', description: 'RSI 低位买入、高位卖出的均值回归策略。',
        status: 'active', marketType: 'spot', symbols: ['ETH/USDT', 'SOL/USDT'], exchangeId: 'binance',
        executionMode: 'dry_run', intervalMinutes: 60, lastExecutedAt: new Date(Date.now() - 45 * 60_000).toISOString(),
        lastSignalScore: 65, totalExecutions: 128, successfulExecutions: 105, totalPnl: 1280.50, leverage: null,
        createdAt: '2026-01-15T00:00:00Z',
    },
    {
        id: 'st3', name: '波动率突破(合约)', description: '布林带收窄后的突破策略，使用合约放大收益。',
        status: 'paused', marketType: 'futures', symbols: ['BTC/USDT', 'ETH/USDT'], exchangeId: 'okx',
        executionMode: 'live', intervalMinutes: 240, lastExecutedAt: new Date(Date.now() - 12 * 3600_000).toISOString(),
        lastSignalScore: 42, totalExecutions: 56, successfulExecutions: 38, totalPnl: -320.40, leverage: 5,
        createdAt: '2026-02-20T00:00:00Z',
    },
    {
        id: 'st4', name: '均线交叉(合约)', description: '双均线 EMA20/EMA50 交叉信号合约策略。',
        status: 'active', marketType: 'futures', symbols: ['BNB/USDT', 'SOL/USDT'], exchangeId: 'binance',
        executionMode: 'live', intervalMinutes: 60, lastExecutedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
        lastSignalScore: 81, totalExecutions: 189, successfulExecutions: 145, totalPnl: 6780.20, leverage: 10,
        createdAt: '2025-11-10T00:00:00Z',
    },
    {
        id: 'st5', name: '网格交易', description: '现货网格策略，适合震荡行情自动低买高卖。',
        status: 'stopped', marketType: 'spot', symbols: ['BTC/USDT'], exchangeId: 'binance',
        executionMode: 'live', intervalMinutes: 5, lastExecutedAt: new Date(Date.now() - 72 * 3600_000).toISOString(),
        lastSignalScore: null, totalExecutions: 89, successfulExecutions: 71, totalPnl: 560.30, leverage: null,
        createdAt: '2025-10-05T00:00:00Z',
    },
    {
        id: 'st6', name: '资金费率套利', description: '合约资金费率正负套利策略。',
        status: 'active', marketType: 'futures', symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'], exchangeId: 'binance',
        executionMode: 'live', intervalMinutes: 480, lastExecutedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
        lastSignalScore: 55, totalExecutions: 42, successfulExecutions: 36, totalPnl: 890.10, leverage: 3,
        createdAt: '2026-03-01T00:00:00Z',
    },
];

const MOCK_LOGS: LogType[] = [
    { id: 'l1', strategyId: 'st1', status: 'success', signalScore: 78, signalDirection: 'buy', orderId: 'ord_001', riskRejectionReason: null, durationMs: 245, executedAt: new Date(Date.now() - 5 * 60_000).toISOString() },
    { id: 'l2', strategyId: 'st1', status: 'success', signalScore: 62, signalDirection: 'sell', orderId: 'ord_002', riskRejectionReason: null, durationMs: 312, executedAt: new Date(Date.now() - 20 * 60_000).toISOString() },
    { id: 'l3', strategyId: 'st2', status: 'risk_rejected', signalScore: 85, signalDirection: 'buy', orderId: null, riskRejectionReason: '单品种持仓比例超限(30%)', durationMs: 156, executedAt: new Date(Date.now() - 45 * 60_000).toISOString() },
    { id: 'l4', strategyId: 'st4', status: 'success', signalScore: 81, signalDirection: 'buy', orderId: 'ord_004', riskRejectionReason: null, durationMs: 178, executedAt: new Date(Date.now() - 30 * 60_000).toISOString() },
    { id: 'l5', strategyId: 'st3', status: 'failed', signalScore: null, signalDirection: null, orderId: null, riskRejectionReason: null, durationMs: 5023, executedAt: new Date(Date.now() - 2 * 3600_000).toISOString() },
    { id: 'l6', strategyId: 'st6', status: 'success', signalScore: 55, signalDirection: 'buy', orderId: 'ord_006', riskRejectionReason: null, durationMs: 198, executedAt: new Date(Date.now() - 3 * 3600_000).toISOString() },
];

// =========================================================================
// 主组件
// =========================================================================

type DetailModalMode = 'config' | 'logs' | 'edit';

const StrategyCenterPage: React.FC = memo(() => {
    const [strategies, setStrategies] = useState(MOCK_STRATEGIES);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createMarketType, setCreateMarketType] = useState<StrategyMarketType>('spot');

    // 详情/日志弹窗
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailModalMode, setDetailModalMode] = useState<DetailModalMode>('config');
    const [selectedStrategy, setSelectedStrategy] = useState<StrategyRecord | null>(null);

    // 按市场类型分组
    const spotStrategies = useMemo(() => strategies.filter(s => s.marketType === 'spot'), [strategies]);
    const futuresStrategies = useMemo(() => strategies.filter(s => s.marketType === 'futures'), [strategies]);

    // ─── 操作回调 ─────────────────────────────────────
    const handleActivate = useCallback((id: string) => {
        setStrategies(prev => prev.map(s => s.id === id ? { ...s, status: 'active' as const } : s));
    }, []);

    const handlePause = useCallback((id: string) => {
        setStrategies(prev => prev.map(s => s.id === id ? { ...s, status: 'paused' as const } : s));
    }, []);

    const handleStop = useCallback((id: string) => {
        setStrategies(prev => prev.map(s => s.id === id ? { ...s, status: 'stopped' as const } : s));
    }, []);

    const handleDelete = useCallback((id: string) => {
        setStrategies(prev => prev.filter(s => s.id !== id));
    }, []);

    const handleEditParams = useCallback((strategy: StrategyRecord) => {
        setSelectedStrategy(strategy);
        setDetailModalMode('edit');
        setDetailModalOpen(true);
    }, []);

    const handleViewConfig = useCallback((strategy: StrategyRecord) => {
        setSelectedStrategy(strategy);
        setDetailModalMode('config');
        setDetailModalOpen(true);
    }, []);

    const handleViewLogs = useCallback((strategy: StrategyRecord) => {
        setSelectedStrategy(strategy);
        setDetailModalMode('logs');
        setDetailModalOpen(true);
    }, []);

    /** 创建策略 */
    const handleCreate = useCallback((config: StrategyConfigRequest) => {
        const newStrategy: StrategyRecord = {
            id: `st_${Date.now()}`,
            ...config,
            status: 'stopped',
            lastExecutedAt: null,
            lastSignalScore: null,
            totalExecutions: 0,
            successfulExecutions: 0,
            totalPnl: 0,
            leverage: config.leverage ?? null,
            createdAt: new Date().toISOString(),
        };
        setStrategies(prev => [newStrategy, ...prev]);
        setShowCreateModal(false);
    }, []);

    // 策略列表渲染
    const renderStrategyList = useCallback((list: StrategyRecord[], emptyMsg: string) => {
        if (list.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-dim">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-sm">{emptyMsg}</p>
                </div>
            );
        }
        return (
            <div className="space-y-3">
                {list.map(strategy => (
                    <StrategyListItem
                        key={strategy.id}
                        strategy={strategy}
                        onActivate={handleActivate}
                        onPause={handlePause}
                        onStop={handleStop}
                        onDelete={handleDelete}
                        onEditParams={handleEditParams}
                        onViewConfig={handleViewConfig}
                        onViewLogs={handleViewLogs}
                    />
                ))}
            </div>
        );
    }, [handleActivate, handlePause, handleStop, handleDelete, handleEditParams, handleViewConfig, handleViewLogs]);

    // 汇总统计
    const spotPnl = useMemo(() => spotStrategies.reduce((sum, s) => sum + s.totalPnl, 0), [spotStrategies]);
    const futuresPnl = useMemo(() => futuresStrategies.reduce((sum, s) => sum + s.totalPnl, 0), [futuresStrategies]);

    return (
        <div className="w-full min-h-screen p-4 lg:p-6 bg-base">
            {/* ─── 页面标题 + 操作 ──────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary">策略中心</h1>
                    <p className="text-sm text-dim mt-1">自动化交易策略 · 现货 / 合约分列管理 · 7大操作</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setCreateMarketType('spot'); setShowCreateModal(true); }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        + 现货策略
                    </button>
                    <button
                        onClick={() => { setCreateMarketType('futures'); setShowCreateModal(true); }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        + 合约策略
                    </button>
                </div>
            </div>

            {/* ─── 左右分栏：现货 | 合约 ──────────────────── */}
            <Suspense fallback={<LoadingPanel className="h-96" />}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* 现货策略区 */}
                    <div className="bg-card/50 border border-base rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <h2 className="text-lg font-semibold text-primary">现货策略</h2>
                                <span className="text-xs text-dim bg-surface px-2 py-0.5 rounded-full">
                                    {spotStrategies.length} 个
                                </span>
                            </div>
                            <span className={`text-sm font-medium ${spotPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {spotPnl >= 0 ? '+' : ''}{spotPnl.toFixed(2)} U
                            </span>
                        </div>
                        {renderStrategyList(spotStrategies, '暂无现货策略，点击上方按钮创建')}
                    </div>

                    {/* 合约策略区 */}
                    <div className="bg-card/50 border border-base rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-purple-500" />
                                <h2 className="text-lg font-semibold text-primary">合约策略</h2>
                                <span className="text-xs text-dim bg-surface px-2 py-0.5 rounded-full">
                                    {futuresStrategies.length} 个
                                </span>
                            </div>
                            <span className={`text-sm font-medium ${futuresPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {futuresPnl >= 0 ? '+' : ''}{futuresPnl.toFixed(2)} U
                            </span>
                        </div>
                        {renderStrategyList(futuresStrategies, '暂无合约策略，点击上方按钮创建')}
                    </div>
                </div>
            </Suspense>

            {/* ─── 执行日志 ─────────────────────────────────── */}
            <div className="bg-card/50 border border-base rounded-xl p-4">
                <h2 className="text-lg font-semibold text-primary mb-4">执行日志</h2>
                <div className="space-y-2">
                    {MOCK_LOGS.map(log => {
                        const statusMap: Record<string, { label: string; color: string }> = {
                            success: { label: '成功', color: 'text-green-400' },
                            failed: { label: '失败', color: 'text-red-400' },
                            skipped: { label: '跳过', color: 'text-muted' },
                            risk_rejected: { label: '风控拒绝', color: 'text-yellow-400' },
                        };
                        const s = statusMap[log.status] ?? statusMap.failed;
                        const relatedStrategy = strategies.find(st => st.id === log.strategyId);
                        return (
                            <div key={log.id} className="flex items-center justify-between py-2 px-3 bg-surface/60 rounded-lg text-xs">
                                <div className="flex items-center gap-3">
                                    <span className={`font-medium ${s.color}`}>{s.label}</span>
                                    <span className="text-muted">{relatedStrategy?.name ?? log.strategyId}</span>
                                    {log.signalDirection && (
                                        <span className={log.signalDirection === 'buy' ? 'text-green-400' : 'text-red-400'}>
                                            {log.signalDirection === 'buy' ? '买入' : '卖出'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-dim">
                                    <span>{log.durationMs}ms</span>
                                    <span>{new Date(log.executedAt).toLocaleString()}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── 弹窗 ─────────────────────────────────────── */}
            <Suspense fallback={null}>
                <StrategyDetailModal
                    isOpen={detailModalOpen}
                    mode={detailModalMode}
                    strategy={selectedStrategy}
                    logs={MOCK_LOGS}
                    onClose={() => setDetailModalOpen(false)}
                />
            </Suspense>

            <Suspense fallback={null}>
                <StrategyConfigModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreate}
                    isSubmitting={false}
                    defaultMarketType={createMarketType}
                />
            </Suspense>
        </div>
    );
});

StrategyCenterPage.displayName = 'StrategyCenterPage';
export default StrategyCenterPage;