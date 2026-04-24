/**
 * 夜间睡眠市场监控 Agent（NightSleepSessionMarketWatcher）
 *
 * 核心功能：
 *   1. 夜间行情概览：BTC/ETH 开高低收、涨幅、最大回撤
 *   2. 事件时间线：价格异动、量能突增、连环爆仓、资金费率异常、新闻事件
 *   3. 风险等级判定 + AI 摘要
 *   4. 监控配置：起止时间、阈值设定
 *
 * 数据来源：Mock 数据，后续接入 WebSocket + AI。
 */
import React, { memo, useState, useMemo } from 'react';
import type { NightSessionConfig, NightSessionSummary, NightMarketEvent } from '../../type/alpha_module_types';

// =========================================================================
// Mock 数据
// =========================================================================

const MOCK_CONFIG: NightSessionConfig = {
    startTime: '23:00',
    endTime: '07:00',
    priceAlertThreshold: 2,
    volumeSpikeThreshold: 3,
};

const MOCK_EVENTS: NightMarketEvent[] = [
    { time: '23:42', type: 'volume_spike', asset: 'BTC', description: 'BTC 1 分钟成交量突增至 15 分钟均量的 4.2 倍', severity: 'warning' },
    { time: '01:15', type: 'price_spike', asset: 'ETH', description: 'ETH 5 分钟下跌 1.8%，触发价格异动', severity: 'warning' },
    { time: '02:30', type: 'funding_anomaly', asset: 'BTC', description: 'BTC 资金费率突升至 0.035%，多头过热信号', severity: 'info' },
    { time: '03:05', type: 'liquidation_cascade', asset: 'BTC', description: 'BTC 连续爆仓 $12M，以多头爆仓为主', severity: 'danger' },
    { time: '04:20', type: 'news', asset: 'BTC', description: 'SEC 发布 ETF 相关声明，市场短暂波动后回归', severity: 'info' },
    { time: '05:51', type: 'price_spike', asset: 'BTC', description: 'BTC 30 分钟反弹 2.1%，配合放量', severity: 'warning' },
];

const MOCK_SUMMARY: NightSessionSummary = {
    btcOpen: 68200, btcClose: 68550, btcHigh: 69100, btcLow: 67400,
    btcChangePercent: 0.51,
    ethOpen: 3850, ethClose: 3820, ethHigh: 3910, ethLow: 3760,
    ethChangePercent: -0.78,
    maxDrawdown: 3.2,
    events: MOCK_EVENTS,
    riskLevel: 'medium',
    aiSummary: '夜间整体呈现 V 型走势。BTC 于凌晨 3 点遭遇连环爆仓导致快速下跌至 67,400，随后受 ETF 相关消息刺激反弹。ETH 表现相对弱势，反弹力度不及 BTC。建议关注 BTC 69,000 压力位及 ETH/BTC 汇率的进一步走弱。',
};

// =========================================================================
// 辅助
// =========================================================================

function getSeverityColor(severity: string) {
    if (severity === 'danger') return { text: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-400' };
    if (severity === 'warning') return { text: 'text-yellow-400', bg: 'bg-yellow-500/10', dot: 'bg-yellow-400' };
    return { text: 'text-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-400' };
}

function getRiskLabel(level: string) {
    if (level === 'high') return { text: '高风险', color: 'text-red-400 bg-red-500/10' };
    if (level === 'medium') return { text: '中等风险', color: 'text-yellow-400 bg-yellow-500/10' };
    return { text: '低风险', color: 'text-green-400 bg-green-500/10' };
}

function getEventIcon(type: NightMarketEvent['type']) {
    switch (type) {
        case 'price_spike': return '📈';
        case 'volume_spike': return '📊';
        case 'liquidation_cascade': return '💥';
        case 'funding_anomaly': return '💰';
        case 'news': return '📰';
        default: return '⚡';
    }
}

// =========================================================================
// 主组件
// =========================================================================

const NightSleepSessionMarketWatcher = memo(function NightSleepSessionMarketWatcher() {
    const [activeTab, setActiveTab] = useState<'summary' | 'config'>('summary');
    const [config, setConfig] = useState<NightSessionConfig>(MOCK_CONFIG);
    const summary = MOCK_SUMMARY;
    const risk = getRiskLabel(summary.riskLevel);

    return (
        <div className="h-full bg-card rounded-lg flex flex-col overflow-hidden">
            {/* ─── Header ──────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-base shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">🌙 夜间市场监控</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${risk.color}`}>{risk.text}</span>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setActiveTab('summary')}
                        className={`text-[10px] px-2 py-0.5 rounded ${activeTab === 'summary' ? 'bg-indigo-500/20 text-indigo-400' : 'text-dim'}`}>
                        概览
                    </button>
                    <button onClick={() => setActiveTab('config')}
                        className={`text-[10px] px-2 py-0.5 rounded ${activeTab === 'config' ? 'bg-indigo-500/20 text-indigo-400' : 'text-dim'}`}>
                        设置
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
                {activeTab === 'summary' ? (
                    <div className="p-4 space-y-3">
                        {/* ── BTC/ETH OHLC 卡片 ──────────────── */}
                        <div className="grid grid-cols-2 gap-2">
                            {/* BTC */}
                            <div className="bg-surface/50 rounded-lg p-2.5 border border-strong/30">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] text-orange-400 font-medium">BTC</span>
                                    <span className={`text-[10px] font-mono ${summary.btcChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {summary.btcChangePercent >= 0 ? '+' : ''}{summary.btcChangePercent}%
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px]">
                                    <div className="flex justify-between"><span className="text-secondary">开</span><span className="text-secondary font-mono">{summary.btcOpen.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="text-secondary">收</span><span className="text-secondary font-mono">{summary.btcClose.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="text-secondary">高</span><span className="text-green-400 font-mono">{summary.btcHigh.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="text-secondary">低</span><span className="text-red-400 font-mono">{summary.btcLow.toLocaleString()}</span></div>
                                </div>
                            </div>
                            {/* ETH */}
                            <div className="bg-surface/50 rounded-lg p-2.5 border border-strong/30">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] text-blue-400 font-medium">ETH</span>
                                    <span className={`text-[10px] font-mono ${summary.ethChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {summary.ethChangePercent >= 0 ? '+' : ''}{summary.ethChangePercent}%
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px]">
                                    <div className="flex justify-between"><span className="text-secondary">开</span><span className="text-secondary font-mono">{summary.ethOpen.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="text-secondary">收</span><span className="text-secondary font-mono">{summary.ethClose.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="text-secondary">高</span><span className="text-green-400 font-mono">{summary.ethHigh.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="text-secondary">低</span><span className="text-red-400 font-mono">{summary.ethLow.toLocaleString()}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* ── 最大回撤 ───────────────────────── */}
                        <div className="flex items-center gap-2 bg-surface/30 rounded px-3 py-1.5">
                            <span className="text-[9px] text-dim">夜间最大回撤</span>
                            <span className={`text-[10px] font-mono ${summary.maxDrawdown > 3 ? 'text-red-400' : summary.maxDrawdown > 1.5 ? 'text-yellow-400' : 'text-green-400'}`}>
                                -{summary.maxDrawdown}%
                            </span>
                            <span className="text-[9px] text-secondary ml-auto">监控时段: {config.startTime} - {config.endTime}</span>
                        </div>

                        {/* ── AI 摘要 ────────────────────────── */}
                        <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-lg p-3">
                            <div className="text-[10px] text-indigo-400 font-medium mb-1">🤖 AI 夜间摘要</div>
                            <p className="text-[10px] text-muted leading-relaxed">{summary.aiSummary}</p>
                        </div>

                        {/* ── 事件时间线 ──────────────────────── */}
                        <div>
                            <div className="text-[10px] text-dim font-medium mb-2">📋 事件时间线 ({summary.events.length})</div>
                            <div className="space-y-0.5">
                                {summary.events.map((evt, idx) => {
                                    const s = getSeverityColor(evt.severity);
                                    return (
                                        <div key={idx} className={`flex items-start gap-2 rounded p-2 ${s.bg}`}>
                                            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                                <span className="text-[10px]">{getEventIcon(evt.type)}</span>
                                                <span className="text-[9px] font-mono text-muted w-10">{evt.time}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1">
                                                    <span className={`text-[9px] px-1 py-0 rounded ${s.text} bg-card/30`}>{evt.asset}</span>
                                                </div>
                                                <p className="text-[9px] text-muted mt-0.5 leading-relaxed">{evt.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── 设置 Tab ─────────────────────────── */
                    <div className="p-4 space-y-3">
                        <div className="text-[10px] text-dim font-medium">监控配置</div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] text-secondary">开始时间</label>
                                <input type="time" value={config.startTime}
                                    onChange={e => setConfig(prev => ({ ...prev, startTime: e.target.value }))}
                                    className="w-full px-2 py-1.5 bg-surface border border-strong rounded text-xs text-primary focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="text-[9px] text-secondary">结束时间</label>
                                <input type="time" value={config.endTime}
                                    onChange={e => setConfig(prev => ({ ...prev, endTime: e.target.value }))}
                                    className="w-full px-2 py-1.5 bg-surface border border-strong rounded text-xs text-primary focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="text-[9px] text-secondary">价格异动阈值 (%)</label>
                                <input type="number" value={config.priceAlertThreshold}
                                    onChange={e => setConfig(prev => ({ ...prev, priceAlertThreshold: parseFloat(e.target.value) || 0 }))}
                                    className="w-full px-2 py-1.5 bg-surface border border-strong rounded text-xs text-primary font-mono focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="text-[9px] text-secondary">量能突增倍数</label>
                                <input type="number" value={config.volumeSpikeThreshold}
                                    onChange={e => setConfig(prev => ({ ...prev, volumeSpikeThreshold: parseFloat(e.target.value) || 0 }))}
                                    className="w-full px-2 py-1.5 bg-surface border border-strong rounded text-xs text-primary font-mono focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>
                        <button className="w-full py-2 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-medium hover:bg-indigo-500/30 transition-colors">
                            保存配置
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

NightSleepSessionMarketWatcher.displayName = 'NightSleepSessionMarketWatcher';

export default NightSleepSessionMarketWatcher;
