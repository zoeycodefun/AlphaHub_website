/**
 * 交易员成长档案页面（Trader Growth Archive）
 *
 * ─── 布局 ────────────────────────────────────────────────────────
 *  ┌──────────────────────────────────────────────────────────┐
 *  │  页面标题 + 新增档案按钮 + 导出按钮                      │
 *  ├──────────────────────────────────────────────────────────┤
 *  │  当日档案汇总卡                                          │
 *  ├──────────────────────────────────────────────────────────┤
 *  │  当日交易日志列表                                        │
 *  ├──────────────────────────────────────────────────────────┤
 *  │  历史档案浏览器（日历选择 + 列表）                       │
 *  └──────────────────────────────────────────────────────────┘
 *
 * 功能要点：
 *  - 每笔交易弹窗记录：自动填充（交易详情/截图/链上数据）+ 手动填写（情绪/压力/纪律/分析/模式）
 *  - 仅展示当天档案，历史可浏览/导出
 *  - 数据留存一年
 */
import React, { useState, useCallback, memo, Suspense } from 'react';
import type {
    TradeJournalEntry,
    DailyArchiveSummary,
    TradeEmotion,
    DisciplineCompliance,
    TradePatternTag,
} from './type/alpha_module_types';

// ─── 常量 ────────────────────────────────────────────────────────
const EMOTION_LABELS: Record<TradeEmotion, { label: string; emoji: string }> = {
    calm:       { label: '冷静', emoji: '😌' },
    excited:    { label: '兴奋', emoji: '🤩' },
    anxious:    { label: '焦虑', emoji: '😰' },
    fearful:    { label: '恐惧', emoji: '😱' },
    greedy:     { label: '贪婪', emoji: '🤑' },
    frustrated: { label: '沮丧', emoji: '😤' },
    confident:  { label: '自信', emoji: '😎' },
    hesitant:   { label: '犹豫', emoji: '🤔' },
};

const DISCIPLINE_LABELS: Record<DisciplineCompliance, { label: string; color: string }> = {
    fully_compliant:     { label: '完全遵守', color: 'text-green-400' },
    mostly_compliant:    { label: '基本遵守', color: 'text-blue-400' },
    partially_compliant: { label: '部分遵守', color: 'text-yellow-400' },
    non_compliant:       { label: '未遵守', color: 'text-red-400' },
};

const PATTERN_LABELS: Record<TradePatternTag, string> = {
    trend_following: '趋势跟踪', mean_reversion: '均值回归', breakout: '突破', scalping: '超短线',
    swing: '波段', fomo_entry: 'FOMO入场', revenge_trade: '报复交易', overtrading: '过度交易',
    perfect_entry: '完美入场', early_exit: '过早退出', late_exit: '过晚退出', stop_loss_hit: '止损触发',
};

const TODAY = new Date().toISOString().slice(0, 10);

// ─── Mock 数据 ──────────────────────────────────────────────────
const MOCK_ENTRIES: TradeJournalEntry[] = [
    {
        id: 'tj1', tradeId: 'trade_001', symbol: 'BTC/USDT', marketType: 'spot', side: 'buy',
        entryPrice: 67200, exitPrice: 68500, amount: 0.1, realizedPnl: 130, pnlPct: 1.93,
        screenshotUrls: [], onchainDataUrl: null,
        tradingReason: 'MACD 金叉 + 成交量放大，趋势确认后入场',
        emotion: 'confident', stressLevel: 3, disciplineCompliance: 'fully_compliant',
        successAnalysis: '入场时机准确，趋势判断正确', failureAnalysis: '出场略早，未能吃到全部利润',
        patternTags: ['trend_following', 'early_exit'], notes: '下次可以用移动止盈',
        tradedAt: new Date(Date.now() - 3 * 3600_000).toISOString(), archiveDate: TODAY, createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    },
    {
        id: 'tj2', tradeId: 'trade_002', symbol: 'ETH/USDT', marketType: 'futures', side: 'sell',
        entryPrice: 3480, exitPrice: 3520, amount: 2, realizedPnl: -80, pnlPct: -1.15,
        screenshotUrls: [], onchainDataUrl: null,
        tradingReason: 'RSI 超买，尝试做空',
        emotion: 'anxious', stressLevel: 7, disciplineCompliance: 'partially_compliant',
        successAnalysis: '方向判断有部分依据', failureAnalysis: '未设止损就入场，违反纪律',
        patternTags: ['mean_reversion', 'overtrading'], notes: '情绪交易，需要冷静',
        tradedAt: new Date(Date.now() - 1 * 3600_000).toISOString(), archiveDate: TODAY, createdAt: new Date(Date.now() - 0.5 * 3600_000).toISOString(),
    },
];

const MOCK_SUMMARY: DailyArchiveSummary = {
    date: TODAY,
    totalTrades: 2,
    dailyPnl: 50,
    winRate: 50,
    emotionDistribution: { calm: 0, excited: 0, anxious: 1, fearful: 0, greedy: 0, frustrated: 0, confident: 1, hesitant: 0 },
    avgStressLevel: 5,
    complianceRate: 50,
    patternStats: {} as Record<TradePatternTag, number>,
    entries: MOCK_ENTRIES,
};

// ─── 加载占位 ──────────────────────────────────────────────────
function LoadingPanel({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-card rounded-lg animate-pulse flex items-center justify-center ${className}`}>
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

// =========================================================================
// 新增档案弹窗
// =========================================================================
interface JournalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: Omit<TradeJournalEntry, 'id' | 'createdAt'>) => void;
}

const JournalEntryModal: React.FC<JournalModalProps> = memo(({ isOpen, onClose, onSave }) => {
    const [form, setForm] = useState({
        symbol: 'BTC/USDT',
        marketType: 'spot' as const,
        side: 'buy' as const,
        entryPrice: 0,
        exitPrice: 0,
        amount: 0,
        tradingReason: '',
        emotion: 'calm' as TradeEmotion,
        stressLevel: 5,
        disciplineCompliance: 'fully_compliant' as DisciplineCompliance,
        successAnalysis: '',
        failureAnalysis: '',
        patternTags: [] as TradePatternTag[],
        notes: '',
    });

    const handleSave = useCallback(() => {
        const pnl = form.side === 'buy'
            ? (form.exitPrice - form.entryPrice) * form.amount
            : (form.entryPrice - form.exitPrice) * form.amount;
        onSave({
            tradeId: null,
            symbol: form.symbol,
            marketType: form.marketType,
            side: form.side,
            entryPrice: form.entryPrice,
            exitPrice: form.exitPrice,
            amount: form.amount,
            realizedPnl: pnl,
            pnlPct: form.entryPrice > 0 ? (pnl / (form.entryPrice * form.amount)) * 100 : 0,
            screenshotUrls: [],
            onchainDataUrl: null,
            tradingReason: form.tradingReason,
            emotion: form.emotion,
            stressLevel: form.stressLevel,
            disciplineCompliance: form.disciplineCompliance,
            successAnalysis: form.successAnalysis,
            failureAnalysis: form.failureAnalysis,
            patternTags: form.patternTags,
            notes: form.notes,
            tradedAt: new Date().toISOString(),
            archiveDate: TODAY,
        });
        onClose();
    }, [form, onSave, onClose]);

    const togglePattern = useCallback((tag: TradePatternTag) => {
        setForm(prev => ({
            ...prev,
            patternTags: prev.patternTags.includes(tag)
                ? prev.patternTags.filter(t => t !== tag)
                : [...prev.patternTags, tag],
        }));
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-2xl max-h-[85vh] bg-card border border-strong rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-strong">
                    <h2 className="text-lg font-bold text-primary">📝 新增交易档案</h2>
                    <button onClick={onClose} className="p-2 text-muted hover:text-primary rounded-lg hover:bg-surface">✕</button>
                </div>
                <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(85vh - 72px)' }}>
                    {/* 交易对 + 方向 + 市场 */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs text-dim block mb-1">交易对</label>
                            <input value={form.symbol} onChange={e => setForm(p => ({ ...p, symbol: e.target.value }))}
                                className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 text-primary" />
                        </div>
                        <div>
                            <label className="text-xs text-dim block mb-1">方向</label>
                            <select value={form.side} onChange={e => setForm(p => ({ ...p, side: e.target.value as 'buy' | 'sell' }))}
                                className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 text-primary">
                                <option value="buy">买入</option>
                                <option value="sell">卖出</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-dim block mb-1">市场</label>
                            <select value={form.marketType} onChange={e => setForm(p => ({ ...p, marketType: e.target.value as 'spot' | 'futures' }))}
                                className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 text-primary">
                                <option value="spot">现货</option>
                                <option value="futures">合约</option>
                            </select>
                        </div>
                    </div>

                    {/* 入场/出场/数量 */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs text-dim block mb-1">入场价</label>
                            <input type="number" value={form.entryPrice || ''} onChange={e => setForm(p => ({ ...p, entryPrice: Number(e.target.value) }))}
                                className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 text-primary" />
                        </div>
                        <div>
                            <label className="text-xs text-dim block mb-1">出场价</label>
                            <input type="number" value={form.exitPrice || ''} onChange={e => setForm(p => ({ ...p, exitPrice: Number(e.target.value) }))}
                                className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 text-primary" />
                        </div>
                        <div>
                            <label className="text-xs text-dim block mb-1">数量</label>
                            <input type="number" value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))}
                                className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 text-primary" />
                        </div>
                    </div>

                    {/* 交易理由 */}
                    <div>
                        <label className="text-xs text-dim block mb-1">交易理由 *</label>
                        <textarea value={form.tradingReason} onChange={e => setForm(p => ({ ...p, tradingReason: e.target.value }))}
                            rows={2} className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 text-primary resize-none" maxLength={500} />
                    </div>

                    {/* 情绪 + 压力 + 纪律 */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs text-dim block mb-1">交易时情绪</label>
                            <select value={form.emotion} onChange={e => setForm(p => ({ ...p, emotion: e.target.value as TradeEmotion }))}
                                className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 text-primary">
                                {(Object.entries(EMOTION_LABELS) as [TradeEmotion, { label: string; emoji: string }][]).map(([key, val]) => (
                                    <option key={key} value={key}>{val.emoji} {val.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-dim block mb-1">压力等级 ({form.stressLevel}/10)</label>
                            <input type="range" min={1} max={10} value={form.stressLevel}
                                onChange={e => setForm(p => ({ ...p, stressLevel: Number(e.target.value) }))}
                                className="w-full accent-blue-500" />
                        </div>
                        <div>
                            <label className="text-xs text-dim block mb-1">纪律合规</label>
                            <select value={form.disciplineCompliance} onChange={e => setForm(p => ({ ...p, disciplineCompliance: e.target.value as DisciplineCompliance }))}
                                className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 text-primary">
                                {(Object.entries(DISCIPLINE_LABELS) as [DisciplineCompliance, { label: string }][]).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 成功/失败分析 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-dim block mb-1">成功点分析</label>
                            <textarea value={form.successAnalysis} onChange={e => setForm(p => ({ ...p, successAnalysis: e.target.value }))}
                                rows={2} className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 text-primary resize-none" />
                        </div>
                        <div>
                            <label className="text-xs text-dim block mb-1">失败点分析</label>
                            <textarea value={form.failureAnalysis} onChange={e => setForm(p => ({ ...p, failureAnalysis: e.target.value }))}
                                rows={2} className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 text-primary resize-none" />
                        </div>
                    </div>

                    {/* 模式标签 */}
                    <div>
                        <label className="text-xs text-dim block mb-1">交易模式标签</label>
                        <div className="flex flex-wrap gap-1.5">
                            {(Object.entries(PATTERN_LABELS) as [TradePatternTag, string][]).map(([key, label]) => (
                                <button key={key} type="button" onClick={() => togglePattern(key)}
                                    className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                                        form.patternTags.includes(key)
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'bg-surface-hover/30 text-dim hover:bg-surface-hover/50'
                                    }`}>{label}</button>
                            ))}
                        </div>
                    </div>

                    {/* 笔记 */}
                    <div>
                        <label className="text-xs text-dim block mb-1">自由笔记</label>
                        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                            rows={2} className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 text-primary resize-none" />
                    </div>

                    {/* 保存按钮 */}
                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 py-2 bg-surface-hover hover:bg-surface-hover text-secondary text-sm rounded-lg">取消</button>
                        <button onClick={handleSave} disabled={!form.tradingReason.trim()}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg">
                            保存档案
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});
JournalEntryModal.displayName = 'JournalEntryModal';

// =========================================================================
// 主组件
// =========================================================================

const TraderGrowthArchivePage: React.FC = memo(() => {
    const [entries, setEntries] = useState(MOCK_ENTRIES);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(TODAY);

    const todayEntries = entries.filter(e => e.archiveDate === TODAY);
    const todayPnl = todayEntries.reduce((sum, e) => sum + (e.realizedPnl ?? 0), 0);
    const todayWinRate = todayEntries.length > 0
        ? (todayEntries.filter(e => (e.realizedPnl ?? 0) > 0).length / todayEntries.length * 100)
        : 0;

    const handleSave = useCallback((entry: Omit<TradeJournalEntry, 'id' | 'createdAt'>) => {
        const newEntry: TradeJournalEntry = {
            ...entry,
            id: `tj_${Date.now()}`,
            createdAt: new Date().toISOString(),
        };
        setEntries(prev => [newEntry, ...prev]);
    }, []);

    const handleExport = useCallback(() => {
        const data = JSON.stringify(entries.filter(e => e.archiveDate === selectedDate), null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trade_journal_${selectedDate}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [entries, selectedDate]);

    return (
        <div className="w-full min-h-screen p-4 lg:p-6 bg-base">
            {/* 页面标题 */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary">交易员成长档案</h1>
                    <p className="text-sm text-dim mt-1">逐笔记录 · 情绪追踪 · 模式识别 · 持续成长</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleExport}
                        className="px-4 py-2 bg-surface-hover hover:bg-surface-hover text-secondary text-sm rounded-lg transition-colors">
                        📤 导出档案
                    </button>
                    <button onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
                        + 新增档案
                    </button>
                </div>
            </div>

            {/* 当日汇总 */}
            <div className="bg-card/50 border border-base rounded-xl p-4 mb-6">
                <h2 className="text-sm font-semibold text-primary mb-3">📅 今日汇总 ({TODAY})</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                        <p className="text-xs text-dim">交易笔数</p>
                        <p className="text-lg font-bold text-primary">{todayEntries.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-dim">今日盈亏</p>
                        <p className={`text-lg font-bold ${todayPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {todayPnl >= 0 ? '+' : ''}{todayPnl.toFixed(2)} U
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-dim">胜率</p>
                        <p className="text-lg font-bold text-primary">{todayWinRate.toFixed(0)}%</p>
                    </div>
                    <div>
                        <p className="text-xs text-dim">主要情绪</p>
                        <div className="flex gap-1 mt-1">
                            {todayEntries.map(e => (
                                <span key={e.id} title={EMOTION_LABELS[e.emotion].label}>
                                    {EMOTION_LABELS[e.emotion].emoji}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-dim">平均压力</p>
                        <p className="text-lg font-bold text-primary">
                            {todayEntries.length > 0
                                ? (todayEntries.reduce((sum, e) => sum + e.stressLevel, 0) / todayEntries.length).toFixed(1)
                                : '-'
                            }/10
                        </p>
                    </div>
                </div>
            </div>

            {/* 当日交易日志 */}
            <div className="bg-card/50 border border-base rounded-xl p-4 mb-6">
                <h2 className="text-sm font-semibold text-primary mb-3">📋 当日交易日志</h2>
                {todayEntries.length === 0 ? (
                    <div className="text-center py-12 text-dim">
                        <p className="text-4xl mb-3">📝</p>
                        <p className="text-sm">今天还没有交易档案，完成交易后点击"新增档案"记录吧</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todayEntries.map(entry => (
                            <div key={entry.id} className="bg-surface/60 border border-strong/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold text-primary">{entry.symbol}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${entry.side === 'buy' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                            {entry.side === 'buy' ? '买入' : '卖出'}
                                        </span>
                                        <span className="text-xs text-dim">{entry.marketType === 'spot' ? '现货' : '合约'}</span>
                                    </div>
                                    <span className={`text-sm font-medium ${(entry.realizedPnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {(entry.realizedPnl ?? 0) >= 0 ? '+' : ''}{(entry.realizedPnl ?? 0).toFixed(2)} U
                                    </span>
                                </div>

                                <p className="text-xs text-muted mb-2">{entry.tradingReason}</p>

                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span title="情绪">{EMOTION_LABELS[entry.emotion].emoji} {EMOTION_LABELS[entry.emotion].label}</span>
                                    <span className="text-dim">压力: {entry.stressLevel}/10</span>
                                    <span className={DISCIPLINE_LABELS[entry.disciplineCompliance].color}>
                                        {DISCIPLINE_LABELS[entry.disciplineCompliance].label}
                                    </span>
                                    {entry.patternTags.map(tag => (
                                        <span key={tag} className="px-1.5 py-0.5 bg-surface-hover/50 text-muted rounded">
                                            {PATTERN_LABELS[tag]}
                                        </span>
                                    ))}
                                </div>

                                {(entry.successAnalysis || entry.failureAnalysis) && (
                                    <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                                        {entry.successAnalysis && (
                                            <div className="bg-green-900/20 rounded p-2">
                                                <span className="text-green-500">✅ </span>
                                                <span className="text-muted">{entry.successAnalysis}</span>
                                            </div>
                                        )}
                                        {entry.failureAnalysis && (
                                            <div className="bg-red-900/20 rounded p-2">
                                                <span className="text-red-500">❌ </span>
                                                <span className="text-muted">{entry.failureAnalysis}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 历史档案浏览 */}
            <div className="bg-card/50 border border-base rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-primary">📚 历史档案</h2>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="text-xs bg-surface border border-strong rounded-lg px-3 py-1.5 text-primary"
                    />
                </div>
                {entries.filter(e => e.archiveDate === selectedDate && selectedDate !== TODAY).length === 0 && selectedDate !== TODAY ? (
                    <p className="text-center text-dim text-sm py-8">该日期无档案记录</p>
                ) : selectedDate === TODAY ? (
                    <p className="text-center text-dim text-sm py-4">选择历史日期查看过往档案（数据留存一年）</p>
                ) : null}
            </div>

            {/* 新增弹窗 */}
            <Suspense fallback={null}>
                <JournalEntryModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleSave} />
            </Suspense>
        </div>
    );
});

TraderGrowthArchivePage.displayName = 'TraderGrowthArchivePage';
export default TraderGrowthArchivePage;
