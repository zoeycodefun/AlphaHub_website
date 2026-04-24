/**
 * 回测参数配置表单（Backtest Config Form）
 *
 * 允许用户配置回测参数并提交回测任务：
 *  - 策略选择
 *  - 交易对 + 交易所 + K 线周期
 *  - 起止日期
 *  - 初始资金 / 手续费率 / 滑点率
 */
import React, { memo, useState, useCallback } from 'react';
import type { BacktestConfigRequest, BacktestTimeframe } from '../../../type/alpha_module_types';

// =========================================================================
// 常量
// =========================================================================

const TIMEFRAME_OPTIONS: { value: BacktestTimeframe; label: string }[] = [
    { value: '1m', label: '1 分钟' },
    { value: '5m', label: '5 分钟' },
    { value: '15m', label: '15 分钟' },
    { value: '1h', label: '1 小时' },
    { value: '4h', label: '4 小时' },
    { value: '1d', label: '日线' },
];

const POPULAR_SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'];
const EXCHANGE_OPTIONS = ['binance', 'okx', 'hyperliquid'];

// =========================================================================
// Props
// =========================================================================

interface BacktestConfigFormProps {
    /** 可选策略列表 */
    strategies: { id: string; name: string }[];
    /** 提交回调 */
    onSubmit: (config: BacktestConfigRequest) => void;
    /** 是否正在提交 */
    isSubmitting: boolean;
}

// =========================================================================
// 主组件
// =========================================================================

const BacktestConfigForm: React.FC<BacktestConfigFormProps> = memo(({ strategies, onSubmit, isSubmitting }) => {
    const [config, setConfig] = useState<BacktestConfigRequest>({
        strategyId: strategies[0]?.id ?? '',
        symbol: 'BTC/USDT',
        exchangeId: 'binance',
        timeframe: '1h',
        startDate: new Date(Date.now() - 90 * 86400_000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        initialCapital: 10000,
        feeRate: 0.001,
        slippageRate: 0.0005,
    });

    const update = useCallback(<K extends keyof BacktestConfigRequest>(key: K, value: BacktestConfigRequest[K]) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(config);
    }, [config, onSubmit]);

    return (
        <form onSubmit={handleSubmit} className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4">
            <h3 className="text-sm font-semibold text-primary mb-4">回测参数配置</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 策略选择 */}
                <div>
                    <label className="text-xs text-muted block mb-1">选择策略</label>
                    <select
                        value={config.strategyId}
                        onChange={e => update('strategyId', e.target.value)}
                        className="w-full text-xs bg-card border border-strong/50 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-blue-500/50"
                    >
                        {strategies.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                {/* 交易对 */}
                <div>
                    <label className="text-xs text-muted block mb-1">交易对</label>
                    <select
                        value={config.symbol}
                        onChange={e => update('symbol', e.target.value)}
                        className="w-full text-xs bg-card border border-strong/50 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-blue-500/50"
                    >
                        {POPULAR_SYMBOLS.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                {/* 交易所 */}
                <div>
                    <label className="text-xs text-muted block mb-1">交易所</label>
                    <select
                        value={config.exchangeId}
                        onChange={e => update('exchangeId', e.target.value)}
                        className="w-full text-xs bg-card border border-strong/50 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-blue-500/50"
                    >
                        {EXCHANGE_OPTIONS.map(ex => (
                            <option key={ex} value={ex}>{ex.charAt(0).toUpperCase() + ex.slice(1)}</option>
                        ))}
                    </select>
                </div>

                {/* K 线周期 */}
                <div>
                    <label className="text-xs text-muted block mb-1">K 线周期</label>
                    <select
                        value={config.timeframe}
                        onChange={e => update('timeframe', e.target.value as BacktestTimeframe)}
                        className="w-full text-xs bg-card border border-strong/50 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-blue-500/50"
                    >
                        {TIMEFRAME_OPTIONS.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>

                {/* 起始日期 */}
                <div>
                    <label className="text-xs text-muted block mb-1">起始日期</label>
                    <input
                        type="date"
                        value={config.startDate}
                        onChange={e => update('startDate', e.target.value)}
                        className="w-full text-xs bg-card border border-strong/50 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-blue-500/50"
                    />
                </div>

                {/* 结束日期 */}
                <div>
                    <label className="text-xs text-muted block mb-1">结束日期</label>
                    <input
                        type="date"
                        value={config.endDate}
                        onChange={e => update('endDate', e.target.value)}
                        className="w-full text-xs bg-card border border-strong/50 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-blue-500/50"
                    />
                </div>

                {/* 初始资金 */}
                <div>
                    <label className="text-xs text-muted block mb-1">初始资金 (USDT)</label>
                    <input
                        type="number"
                        value={config.initialCapital}
                        onChange={e => update('initialCapital', Number(e.target.value))}
                        min={100}
                        step={100}
                        className="w-full text-xs bg-card border border-strong/50 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-blue-500/50"
                    />
                </div>

                {/* 手续费率 */}
                <div>
                    <label className="text-xs text-muted block mb-1">手续费率</label>
                    <input
                        type="number"
                        value={config.feeRate}
                        onChange={e => update('feeRate', Number(e.target.value))}
                        step={0.0001}
                        min={0}
                        max={0.01}
                        className="w-full text-xs bg-card border border-strong/50 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-blue-500/50"
                    />
                </div>
            </div>

            {/* 提交按钮 */}
            <button
                type="submit"
                disabled={isSubmitting || !config.strategyId}
                className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
                {isSubmitting ? '回测运行中...' : '🚀 开始回测'}
            </button>
        </form>
    );
});

BacktestConfigForm.displayName = 'BacktestConfigForm';
export default BacktestConfigForm;
