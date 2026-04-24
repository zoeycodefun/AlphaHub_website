/**
 * 策略配置弹窗（Strategy Config Modal）
 *
 * 创建或编辑策略的模态表单：
 *  - 策略名称 + 描述
 *  - 交易对多选
 *  - 交易所 + 执行模式 + 调度间隔
 *  - 创建 / 保存 / 取消
 */
import React, { memo, useState, useCallback, useEffect } from 'react';
import type { StrategyConfigRequest, ExecutionMode, StrategyMarketType } from '../../../type/alpha_module_types';

// =========================================================================
// 常量
// =========================================================================

const AVAILABLE_SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'DOGE/USDT', 'ADA/USDT', 'AVAX/USDT'];
const EXCHANGE_OPTIONS = ['binance', 'okx', 'hyperliquid'];
const INTERVAL_OPTIONS = [
    { value: 1, label: '1 分钟' },
    { value: 5, label: '5 分钟' },
    { value: 15, label: '15 分钟' },
    { value: 60, label: '1 小时' },
    { value: 240, label: '4 小时' },
    { value: 1440, label: '24 小时' },
];

// =========================================================================
// Props
// =========================================================================

interface StrategyConfigModalProps {
    /** 是否显示 */
    isOpen: boolean;
    /** 关闭回调 */
    onClose: () => void;
    /** 提交回调 */
    onSubmit: (config: StrategyConfigRequest) => void;
    /** 编辑模式下的初始值 */
    initialValues?: Partial<StrategyConfigRequest>;
    /** 是否提交中 */
    isSubmitting: boolean;
    /** 默认市场类型 */
    defaultMarketType?: StrategyMarketType;
}

// =========================================================================
// 主组件
// =========================================================================

const StrategyConfigModal: React.FC<StrategyConfigModalProps> = memo(({
    isOpen, onClose, onSubmit, initialValues, isSubmitting, defaultMarketType,
}) => {
    const [form, setForm] = useState<StrategyConfigRequest>({
        name: '',
        description: '',
        marketType: defaultMarketType ?? 'spot',
        symbols: ['BTC/USDT'],
        exchangeId: 'binance',
        executionMode: 'dry_run',
        intervalMinutes: 15,
    });

    // 同步 defaultMarketType 变化
    useEffect(() => {
        if (defaultMarketType && isOpen) {
            setForm(prev => ({ ...prev, marketType: defaultMarketType }));
        }
    }, [defaultMarketType, isOpen]);

    // 编辑模式初始化
    useEffect(() => {
        if (initialValues && isOpen) {
            setForm(prev => ({ ...prev, ...initialValues }));
        }
    }, [initialValues, isOpen]);

    const updateField = useCallback(<K extends keyof StrategyConfigRequest>(key: K, value: StrategyConfigRequest[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    const toggleSymbol = useCallback((symbol: string) => {
        setForm(prev => {
            const exists = prev.symbols.includes(symbol);
            const next = exists ? prev.symbols.filter(s => s !== symbol) : [...prev.symbols, symbol];
            return { ...prev, symbols: next.length > 0 ? next : prev.symbols };
        });
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        onSubmit(form);
    }, [form, onSubmit]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-surface rounded-xl border border-strong/50 p-6 w-full max-w-lg mx-4"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-lg font-bold text-primary mb-4">
                    {initialValues ? '编辑策略' : '创建新策略'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 策略名称 */}
                    <div>
                        <label className="text-xs text-muted block mb-1">策略名称 *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => updateField('name', e.target.value)}
                            placeholder="例如：MACD 趋势策略"
                            className="w-full text-sm bg-card border border-strong/50 rounded-lg px-3 py-2 text-primary placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                            maxLength={50}
                        />
                    </div>

                    {/* 描述 */}
                    <div>
                        <label className="text-xs text-muted block mb-1">策略描述</label>
                        <textarea
                            value={form.description}
                            onChange={e => updateField('description', e.target.value)}
                            placeholder="简要描述策略逻辑..."
                            rows={2}
                            className="w-full text-sm bg-card border border-strong/50 rounded-lg px-3 py-2 text-primary placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none"
                            maxLength={200}
                        />
                    </div>

                    {/* 交易对多选 */}
                    <div>
                        <label className="text-xs text-muted block mb-1">交易对</label>
                        <div className="flex flex-wrap gap-1.5">
                            {AVAILABLE_SYMBOLS.map(sym => (
                                <button
                                    key={sym}
                                    type="button"
                                    onClick={() => toggleSymbol(sym)}
                                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                                        form.symbols.includes(sym)
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'bg-surface-hover/30 text-muted hover:bg-surface-hover/50'
                                    }`}
                                >
                                    {sym.replace('/USDT', '')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 市场类型 */}
                    <div>
                        <label className="text-xs text-muted block mb-1">市场类型</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => updateField('marketType', 'spot')}
                                className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                                    form.marketType === 'spot'
                                        ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50'
                                        : 'bg-surface-hover/30 text-muted hover:bg-surface-hover/50 border border-strong/50'
                                }`}
                            >
                                现货
                            </button>
                            <button
                                type="button"
                                onClick={() => updateField('marketType', 'futures')}
                                className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                                    form.marketType === 'futures'
                                        ? 'bg-purple-600/30 text-purple-400 border border-purple-500/50'
                                        : 'bg-surface-hover/30 text-muted hover:bg-surface-hover/50 border border-strong/50'
                                }`}
                            >
                                合约
                            </button>
                        </div>
                    </div>

                    {/* 杠杆倍数（合约） */}
                    {form.marketType === 'futures' && (
                        <div>
                            <label className="text-xs text-muted block mb-1">杠杆倍数</label>
                            <select
                                value={form.leverage ?? 3}
                                onChange={e => updateField('leverage', Number(e.target.value))}
                                className="w-full text-xs bg-card border border-strong/50 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-blue-500/50"
                            >
                                {[1, 2, 3, 5, 10, 20, 50].map(v => (
                                    <option key={v} value={v}>{v}x</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* 交易所 + 执行模式 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-muted block mb-1">交易所</label>
                            <select
                                value={form.exchangeId}
                                onChange={e => updateField('exchangeId', e.target.value)}
                                className="w-full text-xs bg-card border border-strong/50 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-blue-500/50"
                            >
                                {EXCHANGE_OPTIONS.map(ex => (
                                    <option key={ex} value={ex}>{ex.charAt(0).toUpperCase() + ex.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted block mb-1">执行模式</label>
                            <select
                                value={form.executionMode}
                                onChange={e => updateField('executionMode', e.target.value as ExecutionMode)}
                                className="w-full text-xs bg-card border border-strong/50 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-blue-500/50"
                            >
                                <option value="dry_run">模拟盘</option>
                                <option value="live">实盘</option>
                            </select>
                        </div>
                    </div>

                    {/* 调度间隔 */}
                    <div>
                        <label className="text-xs text-muted block mb-1">调度间隔</label>
                        <select
                            value={form.intervalMinutes}
                            onChange={e => updateField('intervalMinutes', Number(e.target.value))}
                            className="w-full text-xs bg-card border border-strong/50 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-blue-500/50"
                        >
                            {INTERVAL_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* 按钮区 */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 bg-surface-hover hover:bg-surface-hover text-secondary text-sm rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !form.name.trim()}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {isSubmitting ? '保存中...' : (initialValues ? '保存修改' : '创建策略')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

StrategyConfigModal.displayName = 'StrategyConfigModal';
export default StrategyConfigModal;
