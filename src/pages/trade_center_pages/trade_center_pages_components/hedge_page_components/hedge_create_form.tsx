/**
 * 创建对冲组合表单（Hedge Create Form）
 *
 * 用户配置并提交一个新的对冲组合：
 *  - 组合名称
 *  - 多头/空头交易对选择
 *  - 各自仓位金额
 *  - 初始对冲比例
 *  - 选择交易所
 */
import React, { memo, useState, useCallback } from 'react';
import type { CreateHedgePairRequest } from '../../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface HedgeCreateFormProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (req: CreateHedgePairRequest) => void;
}

// =========================================================================
// 候选交易对
// =========================================================================

const SYMBOL_OPTIONS = [
    'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT',
    'AVAX/USDT', 'DOGE/USDT', 'ADA/USDT', 'MATIC/USDT', 'DOT/USDT',
];

const EXCHANGE_OPTIONS = ['Binance', 'OKX', 'Bybit', 'Gate.io', 'Bitget'];

// =========================================================================
// 主组件
// =========================================================================

const HedgeCreateForm: React.FC<HedgeCreateFormProps> = memo(({ visible, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [longSymbol, setLongSymbol] = useState(SYMBOL_OPTIONS[0]);
    const [shortSymbol, setShortSymbol] = useState(SYMBOL_OPTIONS[1]);
    const [longAmount, setLongAmount] = useState(1000);
    const [shortAmount, setShortAmount] = useState(1000);
    const [hedgeRatio, setHedgeRatio] = useState(1.0);
    const [exchange, setExchange] = useState(EXCHANGE_OPTIONS[0]);

    /** 重置表单 */
    const resetForm = useCallback(() => {
        setName('');
        setLongSymbol(SYMBOL_OPTIONS[0]);
        setShortSymbol(SYMBOL_OPTIONS[1]);
        setLongAmount(1000);
        setShortAmount(1000);
        setHedgeRatio(1.0);
        setExchange(EXCHANGE_OPTIONS[0]);
    }, []);

    /** 提交 */
    const handleSubmit = useCallback(() => {
        if (!name.trim()) return;
        onSubmit({
            name: name.trim(),
            longSymbol,
            shortSymbol,
            longAmount,
            shortAmount,
            hedgeRatio,
            exchange,
        });
        resetForm();
        onClose();
    }, [name, longSymbol, shortSymbol, longAmount, shortAmount, hedgeRatio, exchange, onSubmit, onClose, resetForm]);

    /** 取消 */
    const handleCancel = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-strong/50 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
                {/* 标题栏 */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-strong/50">
                    <h3 className="text-sm font-semibold text-primary">新建对冲组合</h3>
                    <button onClick={handleCancel} className="text-dim hover:text-primary text-lg">✕</button>
                </div>

                {/* 表单内容 */}
                <div className="p-5 space-y-4">
                    {/* 组合名称 */}
                    <div>
                        <label className="block text-xs text-muted mb-1">组合名称</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例如：BTC-ETH 对冲"
                            className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-sm text-primary placeholder-gray-600 focus:border-blue-500/50 outline-none"
                        />
                    </div>

                    {/* 交易所 */}
                    <div>
                        <label className="block text-xs text-muted mb-1">交易所</label>
                        <select
                            value={exchange}
                            onChange={(e) => setExchange(e.target.value)}
                            className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-sm text-primary outline-none"
                        >
                            {EXCHANGE_OPTIONS.map((ex) => (
                                <option key={ex} value={ex}>{ex}</option>
                            ))}
                        </select>
                    </div>

                    {/* 多头 / 空头选择 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-green-400 mb-1">多头交易对</label>
                            <select
                                value={longSymbol}
                                onChange={(e) => setLongSymbol(e.target.value)}
                                className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-sm text-primary outline-none"
                            >
                                {SYMBOL_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-red-400 mb-1">空头交易对</label>
                            <select
                                value={shortSymbol}
                                onChange={(e) => setShortSymbol(e.target.value)}
                                className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-sm text-primary outline-none"
                            >
                                {SYMBOL_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 仓位金额 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-muted mb-1">多头金额 (USDT)</label>
                            <input
                                type="number"
                                value={longAmount}
                                onChange={(e) => setLongAmount(Number(e.target.value))}
                                min={0}
                                className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-sm text-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-muted mb-1">空头金额 (USDT)</label>
                            <input
                                type="number"
                                value={shortAmount}
                                onChange={(e) => setShortAmount(Number(e.target.value))}
                                min={0}
                                className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-sm text-primary outline-none"
                            />
                        </div>
                    </div>

                    {/* 对冲比例 */}
                    <div>
                        <label className="block text-xs text-muted mb-1">
                            对冲比例 <span className="text-secondary">（1.0 = 完全对冲）</span>
                        </label>
                        <input
                            type="number"
                            step={0.05}
                            min={0}
                            max={5}
                            value={hedgeRatio}
                            onChange={(e) => setHedgeRatio(Number(e.target.value))}
                            className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-sm text-primary outline-none"
                        />
                    </div>
                </div>

                {/* 底部按钮 */}
                <div className="flex gap-3 px-5 py-3 border-t border-strong/50">
                    <button
                        onClick={handleCancel}
                        className="flex-1 text-sm py-2 bg-surface-hover/50 text-secondary rounded-lg hover:bg-surface-hover transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className="flex-1 text-sm py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-40"
                    >
                        创建组合
                    </button>
                </div>
            </div>
        </div>
    );
});

HedgeCreateForm.displayName = 'HedgeCreateForm';
export default HedgeCreateForm;
