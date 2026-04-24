/**
 * 新币预警配置（New Coin Alert Config）
 *
 * 弹窗：配置新币上线提醒规则
 *  - 监控链（多选）
 *  - 最低热度等级
 *  - 关键词包含
 *  - 推送方式（Telegram/Discord/邮件）
 */
import React, { memo, useState, useCallback } from 'react';
import type { CoinHeatLevel } from '../../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface NewCoinAlertConfigProps {
    visible: boolean;
    onClose: () => void;
    onSave: (config: AlertFormData) => void;
}

interface AlertFormData {
    chains: string[];
    minHeat: CoinHeatLevel;
    keywords: string;
    pushChannels: string[];
}

// =========================================================================
// 常量
// =========================================================================

const CHAIN_LIST = ['Solana', 'Ethereum', 'BSC', 'Base', 'Arbitrum', 'Polygon', 'Avalanche'];
const HEAT_OPTIONS: { value: CoinHeatLevel; label: string }[] = [
    { value: 'cold', label: '冷门及以上' },
    { value: 'warm', label: '温热及以上' },
    { value: 'hot', label: '仅热门' },
];
const PUSH_CHANNELS = ['Telegram', 'Discord', 'Email', 'WebPush'];

// =========================================================================
// 主组件
// =========================================================================

const NewCoinAlertConfig: React.FC<NewCoinAlertConfigProps> = memo(({ visible, onClose, onSave }) => {
    const [chains, setChains] = useState<string[]>(['Solana', 'Ethereum']);
    const [minHeat, setMinHeat] = useState<CoinHeatLevel>('warm');
    const [keywords, setKeywords] = useState('');
    const [pushChannels, setPushChannels] = useState<string[]>(['Telegram']);

    const toggleChain = useCallback((chain: string) => {
        setChains((prev) =>
            prev.includes(chain) ? prev.filter((c) => c !== chain) : [...prev, chain],
        );
    }, []);

    const toggleChannel = useCallback((ch: string) => {
        setPushChannels((prev) =>
            prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
        );
    }, []);

    const handleSave = useCallback(() => {
        onSave({ chains, minHeat, keywords: keywords.trim(), pushChannels });
        onClose();
    }, [chains, minHeat, keywords, pushChannels, onSave, onClose]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-strong/50 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
                {/* 标题 */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-strong/50">
                    <h3 className="text-sm font-semibold text-primary">🔔 新币预警配置</h3>
                    <button onClick={onClose} className="text-dim hover:text-primary text-lg">✕</button>
                </div>

                <div className="p-5 space-y-4">
                    {/* 监控链 */}
                    <div>
                        <label className="block text-xs text-muted mb-2">监控链（多选）</label>
                        <div className="flex flex-wrap gap-2">
                            {CHAIN_LIST.map((chain) => (
                                <button
                                    key={chain}
                                    onClick={() => toggleChain(chain)}
                                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                                        chains.includes(chain)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-surface-hover/50 text-muted hover:text-primary'
                                    }`}
                                >
                                    {chain}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 最低热度 */}
                    <div>
                        <label className="block text-xs text-muted mb-2">最低热度等级</label>
                        <div className="flex gap-2">
                            {HEAT_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setMinHeat(opt.value)}
                                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                                        minHeat === opt.value
                                            ? 'bg-orange-600 text-white'
                                            : 'bg-surface-hover/50 text-muted hover:text-primary'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 关键词 */}
                    <div>
                        <label className="block text-xs text-muted mb-1">包含关键词（可选，逗号分隔）</label>
                        <input
                            type="text"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="AI, RWA, DePIN..."
                            className="w-full bg-card/60 border border-strong/50 rounded-lg px-3 py-2 text-sm text-primary placeholder-gray-600 outline-none"
                        />
                    </div>

                    {/* 推送渠道 */}
                    <div>
                        <label className="block text-xs text-muted mb-2">推送渠道</label>
                        <div className="flex gap-2">
                            {PUSH_CHANNELS.map((ch) => (
                                <button
                                    key={ch}
                                    onClick={() => toggleChannel(ch)}
                                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                                        pushChannels.includes(ch)
                                            ? 'bg-green-600 text-white'
                                            : 'bg-surface-hover/50 text-muted hover:text-primary'
                                    }`}
                                >
                                    {ch}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 底部按钮 */}
                <div className="flex gap-3 px-5 py-3 border-t border-strong/50">
                    <button
                        onClick={onClose}
                        className="flex-1 text-sm py-2 bg-surface-hover/50 text-secondary rounded-lg hover:bg-surface-hover transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 text-sm py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                    >
                        保存配置
                    </button>
                </div>
            </div>
        </div>
    );
});

NewCoinAlertConfig.displayName = 'NewCoinAlertConfig';
export default NewCoinAlertConfig;
