/**
 * 买入信息弹窗（BuyInfoWindow）
 *
 * 增强的添加持仓表单：
 *  - 币种名称 + Symbol + 交易所
 *  - 买入价格 / 数量 / 时间
 *  - 关联投研项目 (researchProjectId)
 *  - 卖出提醒价
 *  - 备注
 */
import React, { memo, useState, useCallback } from 'react';
import type { AddAltcoinPositionRequest } from '../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface BuyInfoWindowProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (req: AddAltcoinPositionRequest) => void;
}

// =========================================================================
// 候选列表
// =========================================================================

const SYMBOL_OPTIONS = [
    { symbol: 'SOL/USDT', name: 'Solana' },
    { symbol: 'AVAX/USDT', name: 'Avalanche' },
    { symbol: 'SUI/USDT', name: 'Sui' },
    { symbol: 'APT/USDT', name: 'Aptos' },
    { symbol: 'ARB/USDT', name: 'Arbitrum' },
    { symbol: 'OP/USDT', name: 'Optimism' },
    { symbol: 'PEPE/USDT', name: 'Pepe' },
    { symbol: 'WIF/USDT', name: 'dogwifhat' },
    { symbol: 'ONDO/USDT', name: 'Ondo Finance' },
    { symbol: 'TIA/USDT', name: 'Celestia' },
    { symbol: 'SEI/USDT', name: 'Sei' },
    { symbol: 'INJ/USDT', name: 'Injective' },
    { symbol: 'JUP/USDT', name: 'Jupiter' },
    { symbol: 'STRK/USDT', name: 'Starknet' },
    { symbol: 'PENDLE/USDT', name: 'Pendle' },
];

const EXCHANGE_OPTIONS = ['Binance', 'OKX', 'Bybit', 'Gate.io', 'Bitget', 'MEXC'];

// Mock 投研项目列表
const RESEARCH_PROJECTS = [
    { id: 'rp-1', name: 'Solana 生态深度分析' },
    { id: 'rp-2', name: 'RWA 赛道研报' },
    { id: 'rp-3', name: 'AI+Crypto 叙事跟踪' },
    { id: 'rp-4', name: 'L2 扩容方案对比' },
    { id: '', name: '（不关联投研）' },
];

// =========================================================================
// 主组件
// =========================================================================

const BuyInfoWindow: React.FC<BuyInfoWindowProps> = memo(({ visible, onClose, onSubmit }) => {
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [exchange, setExchange] = useState(EXCHANGE_OPTIONS[0]);
    const [avgEntryPrice, setAvgEntryPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [buyTime, setBuyTime] = useState(new Date().toISOString().slice(0, 16));
    const [researchProjectId, setResearchProjectId] = useState('');
    const [sellAlertPrice, setSellAlertPrice] = useState('');
    const [note, setNote] = useState('');

    const selectedCoin = SYMBOL_OPTIONS[selectedIdx];

    const resetForm = useCallback(() => {
        setSelectedIdx(0);
        setExchange(EXCHANGE_OPTIONS[0]);
        setAvgEntryPrice('');
        setQuantity('');
        setBuyTime(new Date().toISOString().slice(0, 16));
        setResearchProjectId('');
        setSellAlertPrice('');
        setNote('');
    }, []);

    const handleSubmit = useCallback(() => {
        const price = parseFloat(avgEntryPrice);
        const qty = parseFloat(quantity);
        if (!price || price <= 0 || !qty || qty <= 0) return;
        onSubmit({
            symbol: selectedCoin.symbol,
            coinName: selectedCoin.name,
            exchange,
            avgEntryPrice: price,
            quantity: qty,
            buyTime: new Date(buyTime).toISOString(),
            researchProjectId: researchProjectId || undefined,
            sellAlertPrice: sellAlertPrice ? parseFloat(sellAlertPrice) : undefined,
            note: note.trim() || undefined,
        });
        resetForm();
        onClose();
    }, [selectedCoin, exchange, avgEntryPrice, quantity, buyTime, researchProjectId, sellAlertPrice, note, onSubmit, onClose, resetForm]);

    const handleCancel = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    if (!visible) return null;

    const price = parseFloat(avgEntryPrice) || 0;
    const qty = parseFloat(quantity) || 0;
    const totalCost = price * qty;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-strong/50 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
                {/* 标题 */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-strong/50">
                    <h3 className="text-sm font-semibold text-primary">💎 添加山寨币持仓</h3>
                    <button onClick={handleCancel} className="text-dim hover:text-primary text-lg">✕</button>
                </div>

                {/* 表单 */}
                <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
                    {/* 币种选择 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] text-dim mb-1">交易对</label>
                            <select value={selectedIdx} onChange={e => setSelectedIdx(Number(e.target.value))}
                                className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-xs text-primary outline-none focus:border-blue-500/50">
                                {SYMBOL_OPTIONS.map((s, i) => (
                                    <option key={s.symbol} value={i}>{s.symbol} ({s.name})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] text-dim mb-1">交易所</label>
                            <select value={exchange} onChange={e => setExchange(e.target.value)}
                                className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-xs text-primary outline-none focus:border-blue-500/50">
                                {EXCHANGE_OPTIONS.map(ex => (
                                    <option key={ex} value={ex}>{ex}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 价格 / 数量 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] text-dim mb-1">买入均价 (USDT)</label>
                            <input type="text" value={avgEntryPrice}
                                onChange={e => setAvgEntryPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder="0.00"
                                className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-xs text-primary font-mono placeholder-gray-600 outline-none focus:border-blue-500/50" />
                        </div>
                        <div>
                            <label className="block text-[10px] text-dim mb-1">数量</label>
                            <input type="text" value={quantity}
                                onChange={e => setQuantity(e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder="0"
                                className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-xs text-primary font-mono placeholder-gray-600 outline-none focus:border-blue-500/50" />
                        </div>
                    </div>

                    {/* 总成本预览 */}
                    {totalCost > 0 && (
                        <div className="bg-card/40 rounded-lg px-3 py-2 flex items-center justify-between text-[10px]">
                            <span className="text-dim">总成本</span>
                            <span className="text-primary font-mono">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    )}

                    {/* 买入时间 */}
                    <div>
                        <label className="block text-[10px] text-dim mb-1">买入时间</label>
                        <input type="datetime-local" value={buyTime}
                            onChange={e => setBuyTime(e.target.value)}
                            className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-xs text-primary outline-none focus:border-blue-500/50" />
                    </div>

                    {/* 关联投研 + 卖出提醒 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] text-dim mb-1">关联投研项目</label>
                            <select value={researchProjectId} onChange={e => setResearchProjectId(e.target.value)}
                                className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-xs text-primary outline-none focus:border-blue-500/50">
                                {RESEARCH_PROJECTS.map(rp => (
                                    <option key={rp.id || '__none'} value={rp.id}>{rp.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] text-dim mb-1">卖出提醒价 (USDT)</label>
                            <input type="text" value={sellAlertPrice}
                                onChange={e => setSellAlertPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder="选填"
                                className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-xs text-primary font-mono placeholder-gray-600 outline-none focus:border-blue-500/50" />
                        </div>
                    </div>

                    {/* 备注 */}
                    <div>
                        <label className="block text-[10px] text-dim mb-1">备注</label>
                        <textarea value={note} onChange={e => setNote(e.target.value)}
                            placeholder="买入理由、止盈止损计划..."
                            rows={2}
                            className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-xs text-primary placeholder-gray-600 outline-none resize-none focus:border-blue-500/50" />
                    </div>
                </div>

                {/* 底部 */}
                <div className="flex gap-3 px-5 py-3 border-t border-strong/50">
                    <button onClick={handleCancel}
                        className="flex-1 text-xs py-2 bg-surface-hover/50 text-secondary rounded-lg hover:bg-surface-hover transition-colors">
                        取消
                    </button>
                    <button onClick={handleSubmit}
                        disabled={price <= 0 || qty <= 0}
                        className="flex-1 text-xs py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-40">
                        添加持仓
                    </button>
                </div>
            </div>
        </div>
    );
});

BuyInfoWindow.displayName = 'BuyInfoWindow';
export default BuyInfoWindow;
