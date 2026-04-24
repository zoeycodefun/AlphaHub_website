/**
 * 添加山寨币持仓表单（Altcoin Add Form）
 *
 * 弹窗表单，用户填写：
 *  - 交易对（symbol）
 *  - 交易所
 *  - 买入均价 / 数量
 *  - 备注
 */
import React, { memo, useState, useCallback } from 'react';
import type { AddAltcoinPositionRequest } from '../../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface AltcoinAddFormProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (req: AddAltcoinPositionRequest) => void;
}

// =========================================================================
// 候选列表
// =========================================================================

const SYMBOL_OPTIONS = [
    'SOL/USDT', 'AVAX/USDT', 'SUI/USDT', 'APT/USDT', 'ARB/USDT',
    'OP/USDT', 'PEPE/USDT', 'WIF/USDT', 'ONDO/USDT', 'TIA/USDT',
    'SEI/USDT', 'INJ/USDT', 'JUP/USDT', 'STRK/USDT', 'PENDLE/USDT',
];

const EXCHANGE_OPTIONS = ['Binance', 'OKX', 'Bybit', 'Gate.io', 'Bitget', 'MEXC'];

// =========================================================================
// 主组件
// =========================================================================

const AltcoinAddForm: React.FC<AltcoinAddFormProps> = memo(({ visible, onClose, onSubmit }) => {
    const [symbol, setSymbol] = useState(SYMBOL_OPTIONS[0]);
    const [exchange, setExchange] = useState(EXCHANGE_OPTIONS[0]);
    const [avgEntryPrice, setAvgEntryPrice] = useState<number>(0);
    const [quantity, setQuantity] = useState<number>(0);
    const [note, setNote] = useState('');

    const resetForm = useCallback(() => {
        setSymbol(SYMBOL_OPTIONS[0]);
        setExchange(EXCHANGE_OPTIONS[0]);
        setAvgEntryPrice(0);
        setQuantity(0);
        setNote('');
    }, []);

    const handleSubmit = useCallback(() => {
        if (avgEntryPrice <= 0 || quantity <= 0) return;
        onSubmit({ symbol, exchange, avgEntryPrice, quantity, note: note.trim() || undefined });
        resetForm();
        onClose();
    }, [symbol, exchange, avgEntryPrice, quantity, note, onSubmit, onClose, resetForm]);

    const handleCancel = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-strong/50 rounded-xl w-full max-w-md mx-4 shadow-2xl">
                {/* 标题 */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-strong/50">
                    <h3 className="text-sm font-semibold text-primary">添加山寨币持仓</h3>
                    <button onClick={handleCancel} className="text-dim hover:text-primary text-lg">✕</button>
                </div>

                {/* 表单 */}
                <div className="p-5 space-y-4">
                    {/* 交易对 */}
                    <div>
                        <label className="block text-xs text-muted mb-1">交易对</label>
                        <select
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-sm text-primary outline-none"
                        >
                            {SYMBOL_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
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

                    {/* 买入均价 / 数量 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-muted mb-1">买入均价 (USDT)</label>
                            <input
                                type="number"
                                step="any"
                                min={0}
                                value={avgEntryPrice || ''}
                                onChange={(e) => setAvgEntryPrice(Number(e.target.value))}
                                placeholder="0.00"
                                className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-sm text-primary placeholder-gray-600 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-muted mb-1">数量</label>
                            <input
                                type="number"
                                step="any"
                                min={0}
                                value={quantity || ''}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                placeholder="0"
                                className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-sm text-primary placeholder-gray-600 outline-none"
                            />
                        </div>
                    </div>

                    {/* 备注 */}
                    <div>
                        <label className="block text-xs text-muted mb-1">备注（可选）</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="买入理由、止盈止损计划等..."
                            rows={2}
                            className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-sm text-primary placeholder-gray-600 outline-none resize-none"
                        />
                    </div>
                </div>

                {/* 底部 */}
                <div className="flex gap-3 px-5 py-3 border-t border-strong/50">
                    <button
                        onClick={handleCancel}
                        className="flex-1 text-sm py-2 bg-surface-hover/50 text-secondary rounded-lg hover:bg-surface-hover transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={avgEntryPrice <= 0 || quantity <= 0}
                        className="flex-1 text-sm py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-40"
                    >
                        添加持仓
                    </button>
                </div>
            </div>
        </div>
    );
});

AltcoinAddForm.displayName = 'AltcoinAddForm';
export default AltcoinAddForm;
