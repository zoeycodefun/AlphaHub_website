/**
 * 风险管理中枢页面（Risk Management Hub）
 *
 * ─── 布局 ────────────────────────────────────────────────────────
 *  ┌──────────────────────────────────────────────────────────┐
 *  │  风险评分仪表盘 (0-100)                                  │
 *  ├─────────────────────────┬────────────────────────────────┤
 *  │  仓位风险监控列表       │  回撤监控 + 连亏保护           │
 *  ├─────────────────────────┴────────────────────────────────┤
 *  │  日/周亏损限额                                           │
 *  ├──────────────────────────────────────────────────────────┤
 *  │  黑天鹅预警                                              │
 *  ├──────────────────────────────────────────────────────────┤
 *  │  压力测试                                                │
 *  └──────────────────────────────────────────────────────────┘
 */
import React, { memo } from 'react';
import type {
    RiskDashboard,
    PositionRiskInfo,
    DrawdownMonitor,
    ConsecutiveLossProtection,
    LossLimitConfig,
    BlackSwanAlert,
    RiskScore,
    StressTestResult,
    RiskLevel,
    RiskColorLevel,
} from './type/alpha_module_types';

// ─── 工具函数 ────────────────────────────────────────────────────
const RISK_COLORS: Record<RiskLevel, string> = {
    low: 'text-green-400', medium: 'text-yellow-400', high: 'text-orange-400', extreme: 'text-red-400',
};
const RISK_BG: Record<RiskLevel, string> = {
    low: 'bg-green-900/30', medium: 'bg-yellow-900/30', high: 'bg-orange-900/30', extreme: 'bg-red-900/30',
};
const SCORE_COLORS: Record<RiskColorLevel, { text: string; bg: string; label: string }> = {
    green:  { text: 'text-green-400',  bg: 'bg-green-500', label: '低风险' },
    yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500', label: '中等风险' },
    orange: { text: 'text-orange-400', bg: 'bg-orange-500', label: '高风险' },
    red:    { text: 'text-red-400',    bg: 'bg-red-500', label: '极高风险' },
};

// ─── Mock 数据 ──────────────────────────────────────────────────
const MOCK_DASHBOARD: RiskDashboard = {
    positions: [
        { symbol: 'BTC/USDT', marketType: 'futures', side: 'long', notionalValue: 15000, margin: 3000, leverage: 5, unrealizedPnl: 450, liquidationPrice: 58200, liquidationDistance: 12.5, portfolioWeight: 35, riskLevel: 'medium' },
        { symbol: 'ETH/USDT', marketType: 'futures', side: 'long', notionalValue: 8000, margin: 800, leverage: 10, unrealizedPnl: -120, liquidationPrice: 2980, liquidationDistance: 8.2, portfolioWeight: 18, riskLevel: 'high' },
        { symbol: 'SOL/USDT', marketType: 'spot', side: 'long', notionalValue: 5000, margin: 5000, leverage: 1, unrealizedPnl: 220, liquidationPrice: null, liquidationDistance: null, portfolioWeight: 12, riskLevel: 'low' },
        { symbol: 'BNB/USDT', marketType: 'futures', side: 'short', notionalValue: 3000, margin: 1000, leverage: 3, unrealizedPnl: 85, liquidationPrice: 720, liquidationDistance: 15.3, portfolioWeight: 7, riskLevel: 'low' },
    ],
    drawdown: {
        currentDrawdown: 3.8,
        maxDrawdown: 8.3,
        peakEquity: 20500,
        currentEquity: 19720,
        maxAllowedDrawdown: 15,
        isAlertTriggered: false,
        history: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 86400_000).toISOString().slice(0, 10),
            drawdown: Math.random() * 10,
            equity: 18000 + Math.random() * 3000,
        })),
    },
    consecutiveLoss: {
        currentStreak: 1,
        threshold: 5,
        streakLossAmount: -120,
        isProtectionActive: false,
        recentLosses: [
            { tradeId: 't1', symbol: 'ETH/USDT', pnl: -120, time: new Date(Date.now() - 3600_000).toISOString() },
        ],
    },
    lossLimit: {
        dailyLimit: 500,
        weeklyLimit: 2000,
        dailyLossUsed: 120,
        weeklyLossUsed: 380,
        dailyUsageRate: 24,
        weeklyUsageRate: 19,
        isDailyLimitHit: false,
        isWeeklyLimitHit: false,
    },
    blackSwanAlerts: [
        {
            id: 'bs1', type: 'liquidation_cascade', severity: 'warning',
            title: '大规模清算风险提醒',
            description: '过去1小时BTC合约清算量超过$500M，市场波动性增大',
            affectedAssets: ['BTC/USDT', 'ETH/USDT'],
            recommendedAction: '建议降低杠杆或减少合约仓位',
            triggeredAt: new Date(Date.now() - 30 * 60_000).toISOString(),
            acknowledged: false,
        },
    ],
    riskScore: {
        overall: 42,
        colorLevel: 'yellow',
        concentrationScore: 55,
        leverageScore: 38,
        drawdownScore: 30,
        volatilityScore: 45,
        liquidityScore: 25,
        updatedAt: new Date().toISOString(),
    },
    stressTests: [
        { scenario: 'btc_drop_30', scenarioLabel: 'BTC 下跌 30%', estimatedLoss: -6800, estimatedLossPct: -34.5, remainingEquity: 12920, liquidatedPositions: [{ symbol: 'BTC/USDT', side: 'long', loss: -4500 }], survivalRate: 65 },
        { scenario: 'btc_drop_50', scenarioLabel: 'BTC 下跌 50%', estimatedLoss: -11200, estimatedLossPct: -56.8, remainingEquity: 8520, liquidatedPositions: [{ symbol: 'BTC/USDT', side: 'long', loss: -7500 }, { symbol: 'ETH/USDT', side: 'long', loss: -4000 }], survivalRate: 35 },
        { scenario: 'altcoin_zero', scenarioLabel: '山寨币归零', estimatedLoss: -5000, estimatedLossPct: -25.4, remainingEquity: 14720, liquidatedPositions: [{ symbol: 'SOL/USDT', side: 'long', loss: -5000 }], survivalRate: 75 },
        { scenario: 'contract_liquidation', scenarioLabel: '全合约爆仓', estimatedLoss: -4800, estimatedLossPct: -24.4, remainingEquity: 14920, liquidatedPositions: [{ symbol: 'BTC/USDT', side: 'long', loss: -3000 }, { symbol: 'ETH/USDT', side: 'long', loss: -800 }, { symbol: 'BNB/USDT', side: 'short', loss: -1000 }], survivalRate: 76 },
    ],
};

// =========================================================================
// 主组件
// =========================================================================

const RiskManagementHubPage: React.FC = memo(() => {
    const d = MOCK_DASHBOARD;
    const scoreCfg = SCORE_COLORS[d.riskScore.colorLevel];

    return (
        <div className="w-full min-h-screen p-4 lg:p-6 bg-base">
            {/* 页面标题 */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-primary">风险管理中枢</h1>
                <p className="text-sm text-dim mt-1">实时监控 · 黑天鹅预警 · 风险评分 · 压力测试</p>
            </div>

            <div className="space-y-6">
                {/* 1. 风险评分仪表 */}
                <div className="bg-card/50 border border-base rounded-xl p-6">
                    <div className="flex items-center gap-8">
                        {/* 分数圆环 */}
                        <div className="relative w-32 h-32 shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="#1f2937" strokeWidth="8" />
                                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor"
                                    strokeWidth="8" strokeLinecap="round" strokeDasharray={`${d.riskScore.overall * 2.64} 264`}
                                    className={scoreCfg.text} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-3xl font-bold ${scoreCfg.text}`}>{d.riskScore.overall}</span>
                                <span className="text-xs text-dim">{scoreCfg.label}</span>
                            </div>
                        </div>
                        {/* 分项评分 */}
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                            <ScoreDim label="仓位集中度" score={d.riskScore.concentrationScore} />
                            <ScoreDim label="杠杆水平" score={d.riskScore.leverageScore} />
                            <ScoreDim label="回撤程度" score={d.riskScore.drawdownScore} />
                            <ScoreDim label="波动暴露" score={d.riskScore.volatilityScore} />
                            <ScoreDim label="流动性" score={d.riskScore.liquidityScore} />
                        </div>
                    </div>
                </div>

                {/* 2. 仓位风险 + 回撤/连亏 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 仓位风险 */}
                    <div className="bg-card/50 border border-base rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-primary mb-3">📊 仓位风险监控</h3>
                        <div className="space-y-2">
                            {d.positions.map(pos => (
                                <div key={`${pos.symbol}-${pos.side}`} className={`flex items-center justify-between p-3 rounded-lg ${RISK_BG[pos.riskLevel]}`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-primary font-medium">{pos.symbol}</span>
                                        <span className={`text-xs ${pos.side === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                                            {pos.side === 'long' ? '多' : '空'} {pos.leverage}x
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-muted">{pos.portfolioWeight}%</span>
                                        <span className={pos.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                            {pos.unrealizedPnl >= 0 ? '+' : ''}{pos.unrealizedPnl.toFixed(2)}
                                        </span>
                                        {pos.liquidationDistance !== null && (
                                            <span className={RISK_COLORS[pos.riskLevel]}>
                                                距强平 {pos.liquidationDistance.toFixed(1)}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 回撤 + 连亏 */}
                    <div className="space-y-4">
                        <div className="bg-card/50 border border-base rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-primary mb-3">📉 回撤监控</h3>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-dim">当前回撤</span>
                                    <p className={`text-lg font-bold ${d.drawdown.currentDrawdown > 10 ? 'text-red-400' : 'text-yellow-400'}`}>
                                        {d.drawdown.currentDrawdown.toFixed(1)}%
                                    </p>
                                </div>
                                <div>
                                    <span className="text-dim">最大回撤</span>
                                    <p className="text-lg font-bold text-red-400">{d.drawdown.maxDrawdown.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <span className="text-dim">峰值资产</span>
                                    <p className="text-sm text-secondary">{d.drawdown.peakEquity.toFixed(2)} U</p>
                                </div>
                                <div>
                                    <span className="text-dim">当前资产</span>
                                    <p className="text-sm text-secondary">{d.drawdown.currentEquity.toFixed(2)} U</p>
                                </div>
                            </div>
                            {/* 回撤进度条 */}
                            <div className="mt-3">
                                <div className="flex justify-between text-[10px] text-secondary mb-1">
                                    <span>0%</span>
                                    <span>允许上限 {d.drawdown.maxAllowedDrawdown}%</span>
                                </div>
                                <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            d.drawdown.currentDrawdown / d.drawdown.maxAllowedDrawdown > 0.7 ? 'bg-red-500' : 'bg-yellow-500'
                                        }`}
                                        style={{ width: `${Math.min((d.drawdown.currentDrawdown / d.drawdown.maxAllowedDrawdown) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-card/50 border border-base rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-primary mb-2">🛡️ 连亏保护</h3>
                            <div className="flex items-center gap-4 text-xs">
                                <span className="text-muted">当前连亏: <span className="text-primary font-medium">{d.consecutiveLoss.currentStreak}</span>/{d.consecutiveLoss.threshold}</span>
                                <span className="text-muted">累计: <span className="text-red-400">{d.consecutiveLoss.streakLossAmount.toFixed(2)} U</span></span>
                                {d.consecutiveLoss.isProtectionActive && (
                                    <span className="px-2 py-0.5 bg-red-900/50 text-red-400 rounded text-xs">⚠️ 保护已触发</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. 亏损限额 */}
                <div className="bg-card/50 border border-base rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-primary mb-3">💰 亏损限额</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <LimitBar label="每日限额" used={d.lossLimit.dailyLossUsed} limit={d.lossLimit.dailyLimit} rate={d.lossLimit.dailyUsageRate} isHit={d.lossLimit.isDailyLimitHit} />
                        <LimitBar label="每周限额" used={d.lossLimit.weeklyLossUsed} limit={d.lossLimit.weeklyLimit} rate={d.lossLimit.weeklyUsageRate} isHit={d.lossLimit.isWeeklyLimitHit} />
                    </div>
                </div>

                {/* 4. 黑天鹅预警 */}
                {d.blackSwanAlerts.length > 0 && (
                    <div className="bg-card/50 border border-red-900/50 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-primary mb-3">🦢 黑天鹅预警</h3>
                        <div className="space-y-2">
                            {d.blackSwanAlerts.map(alert => (
                                <div key={alert.id} className={`p-4 rounded-lg border ${
                                    alert.severity === 'emergency' ? 'bg-red-900/30 border-red-700/50' :
                                    alert.severity === 'critical' ? 'bg-orange-900/30 border-orange-700/50' :
                                    'bg-yellow-900/30 border-yellow-700/50'
                                }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-primary">{alert.title}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                            alert.severity === 'emergency' ? 'bg-red-600 text-white' :
                                            alert.severity === 'critical' ? 'bg-orange-600 text-white' :
                                            'bg-yellow-600 text-black'
                                        }`}>{alert.severity.toUpperCase()}</span>
                                    </div>
                                    <p className="text-xs text-muted mb-2">{alert.description}</p>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-dim">影响: {alert.affectedAssets.join(', ')}</span>
                                        <span className="text-blue-400">建议: {alert.recommendedAction}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. 压力测试 */}
                <div className="bg-card/50 border border-base rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-primary mb-3">🧪 压力测试</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {d.stressTests.map(test => (
                            <div key={test.scenario} className="bg-surface/60 border border-strong/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-primary">{test.scenarioLabel}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                        test.survivalRate >= 70 ? 'bg-green-900/50 text-green-400' :
                                        test.survivalRate >= 40 ? 'bg-yellow-900/50 text-yellow-400' :
                                        'bg-red-900/50 text-red-400'
                                    }`}>
                                        存活率 {test.survivalRate}%
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                                    <div>
                                        <span className="text-dim">预估损失</span>
                                        <p className="text-red-400 font-medium">{test.estimatedLoss.toFixed(0)} U</p>
                                    </div>
                                    <div>
                                        <span className="text-dim">损失率</span>
                                        <p className="text-red-400">{test.estimatedLossPct.toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <span className="text-dim">剩余资产</span>
                                        <p className="text-secondary">{test.remainingEquity.toFixed(0)} U</p>
                                    </div>
                                </div>
                                {test.liquidatedPositions.length > 0 && (
                                    <div className="text-[10px] text-dim">
                                        爆仓: {test.liquidatedPositions.map(p => `${p.symbol}(${p.loss.toFixed(0)})`).join(', ')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

// ─── 子组件 ─────────────────────────────────────────────────────

function ScoreDim({ label, score }: { label: string; score: number }) {
    const color = score <= 30 ? 'text-green-400' : score <= 60 ? 'text-yellow-400' : 'text-red-400';
    return (
        <div className="text-center">
            <p className="text-xs text-dim mb-1">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{score}</p>
        </div>
    );
}

function LimitBar({ label, used, limit, rate, isHit }: { label: string; used: number; limit: number; rate: number; isHit: boolean }) {
    return (
        <div>
            <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted">{label}</span>
                <span className={isHit ? 'text-red-400 font-medium' : 'text-secondary'}>
                    {used.toFixed(0)} / {limit.toFixed(0)} USDT ({rate}%)
                </span>
            </div>
            <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${isHit ? 'bg-red-500' : rate > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(rate, 100)}%` }}
                />
            </div>
        </div>
    );
}

RiskManagementHubPage.displayName = 'RiskManagementHubPage';
export default RiskManagementHubPage;
