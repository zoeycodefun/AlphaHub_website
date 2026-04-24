/**
 * 信号回测页面（Signals Backtesting Page）
 *
 * 重新设计布局：
 *  ┌──────────────────────────────────────────────────────────┐
 *  │  标题 + 摘要                                             │
 *  │  [📚 历史信号数据库]   [🚀 一键信号回测]                  │
 *  ├──────────────────────────────────────────────────────────┤
 *  │  回测流程说明 / 回测进度 / 结果概览                       │
 *  └──────────────────────────────────────────────────────────┘
 *  + 弹窗：历史信号数据库（两栏季度文件）
 *  + 弹窗：回测报告（现货+合约统一报告）
 */
import React, { useState, useCallback, memo, Suspense, lazy } from 'react';
import type { UnifiedSignalBacktestReport } from './type/alpha_module_types';

// ─── 子组件懒加载 ──────────────────────────────────────────────────
const HistoricalSignalsDatabaseWindow = lazy(() => import('./trade_center_pages_components/signals_backtesting_page_components/historical_signals_database_window'));
const BacktestingReportCheckWindow = lazy(() => import('./trade_center_pages_components/signals_backtesting_page_components/backtesting_report_check_window'));

// =========================================================================
// 回测流程步骤
// =========================================================================

interface StepInfo {
    icon: string;
    title: string;
    description: string;
}

const WORKFLOW_STEPS: StepInfo[] = [
    { icon: '📚', title: '查看历史信号数据库', description: '按季度浏览历史信号存档（现货/合约分类），可下载 CSV 文件进行分析' },
    { icon: '🔍', title: '选择回测参数', description: '系统自动使用全量历史信号进行回测，信号强度 ≥ 60 分纳入统计' },
    { icon: '🚀', title: '一键执行回测', description: '对现货和合约信号分别回测，生成统一对比报告（约需 15-30 秒）' },
    { icon: '📊', title: '查看统一报告', description: '总体表现、按强度/周期分类、最佳/最差信号、优化建议' },
];

// =========================================================================
// 主组件
// =========================================================================

const SignalsBacktestingPage: React.FC = memo(() => {
    // 弹窗状态
    const [showDatabase, setShowDatabase] = useState(false);
    const [showReport, setShowReport] = useState(false);

    // 回测状态
    const [isRunning, setIsRunning] = useState(false);
    const [report, setReport] = useState<UnifiedSignalBacktestReport | null>(null);
    const [lastRunAt, setLastRunAt] = useState<string | null>(null);

    /** 执行一键回测 */
    const handleRunBacktest = useCallback(async () => {
        setIsRunning(true);

        // 模拟回测过程
        await new Promise(resolve => setTimeout(resolve, 2500));

        // 动态导入 mock 数据
        const { MOCK_UNIFIED_REPORT } = await import('./trade_center_pages_components/signals_backtesting_page_components/backtesting_report_check_window');
        setReport(MOCK_UNIFIED_REPORT);
        setLastRunAt(new Date().toLocaleString('zh-CN'));
        setIsRunning(false);
        setShowReport(true);
    }, []);

    return (
        <div className="w-full min-h-screen p-4 lg:p-6 bg-base">
            {/* ─── 页面标题 ─────────────────────────────────── */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-primary">信号回测</h1>
                <p className="text-sm text-dim mt-1">
                    历史信号数据库 · 现货+合约统一回测 · 多维度绩效分析
                </p>
            </div>

            {/* ─── 操作按钮区 ──────────────────────────────── */}
            <div className="flex flex-wrap gap-4 mb-8">
                <button
                    onClick={() => setShowDatabase(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-surface/60 border border-strong/50 rounded-xl text-primary hover:bg-surface-hover/60 hover:border-strong transition-all group"
                >
                    <span className="text-xl">📚</span>
                    <div className="text-left">
                        <div className="text-sm font-bold">历史信号数据库</div>
                        <div className="text-[10px] text-dim group-hover:text-muted">浏览 & 下载季度归档</div>
                    </div>
                </button>

                <button
                    onClick={handleRunBacktest}
                    disabled={isRunning}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-primary transition-all ${
                        isRunning
                            ? 'bg-blue-500/30 border border-blue-500/30 cursor-wait'
                            : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                    }`}
                >
                    {isRunning ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <div className="text-left">
                                <div className="text-sm">回测执行中...</div>
                                <div className="text-[10px] text-blue-200/60">正在遍历全量历史信号</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="text-xl">🚀</span>
                            <div className="text-left">
                                <div className="text-sm">一键信号回测</div>
                                <div className="text-[10px] text-blue-200/60">现货 + 合约统一报告</div>
                            </div>
                        </>
                    )}
                </button>

                {/* 查看报告（回测完成后显示） */}
                {report && (
                    <button
                        onClick={() => setShowReport(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-green-600/20 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-600/30 transition-all"
                    >
                        <span className="text-xl">📊</span>
                        <div className="text-left">
                            <div className="text-sm font-bold">查看报告</div>
                            <div className="text-[10px] text-green-400/60">{lastRunAt} 生成</div>
                        </div>
                    </button>
                )}
            </div>

            {/* ─── 上次回测摘要（如有）────────────────────── */}
            {report && (
                <div className="mb-8 bg-surface/40 rounded-xl border border-strong/40 p-5">
                    <div className="text-xs text-dim mb-3">📋 最近回测摘要 · {report.dateRange}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <SummaryCard label="现货信号" value={report.spotTotalSignals.toLocaleString()} sub="条" />
                        <SummaryCard label="合约信号" value={report.contractTotalSignals.toLocaleString()} sub="条" />
                        <SummaryCard label="现货准确率"
                            value={`${report.spotAccuracy.toFixed(1)}%`}
                            color={report.spotAccuracy >= 60 ? 'text-green-400' : 'text-yellow-400'} />
                        <SummaryCard label="合约准确率"
                            value={`${report.contractAccuracy.toFixed(1)}%`}
                            color={report.contractAccuracy >= 60 ? 'text-green-400' : 'text-yellow-400'} />
                        <SummaryCard label="现货收益率"
                            value={`+${report.spotTotalReturn.toFixed(1)}%`}
                            color="text-green-400" />
                    </div>
                </div>
            )}

            {/* ─── 回测流程说明 ───────────────────────────── */}
            <div className="mb-8">
                <h2 className="text-sm font-bold text-muted mb-4">回测流程</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {WORKFLOW_STEPS.map((step, i) => (
                        <div key={i} className="bg-surface/30 rounded-xl border border-strong/30 p-4 hover:border-strong/50 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{step.icon}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-secondary font-mono">0{i + 1}</span>
                                    <span className="text-sm font-bold text-primary">{step.title}</span>
                                </div>
                            </div>
                            <p className="text-[11px] text-dim leading-relaxed">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── 补充说明 ───────────────────────────────── */}
            <div className="bg-surface/20 rounded-xl border border-strong/20 p-5">
                <h3 className="text-xs font-bold text-dim mb-2">💡 说明</h3>
                <ul className="text-[11px] text-secondary space-y-1.5 list-disc list-inside">
                    <li>历史信号数据以季度为单位存储（3 个月 / 文件），数据保留 3 年</li>
                    <li>回测将对现货和合约信号<span className="text-muted">分别</span>执行，最终生成<span className="text-muted">统一对比报告</span></li>
                    <li>报告包含：总体表现、按强度分类、按周期分类、最佳/最差信号、优化建议</li>
                    <li>与「信号研究中心」的区别：研究中心关注<span className="text-muted">实时/未来信号</span>，回测关注<span className="text-muted">历史稳定性</span></li>
                    <li>工作流建议：信号研究 → 信号回测 → 信号投产使用</li>
                </ul>
            </div>

            {/* ─── 弹窗：历史信号数据库 ──────────────────── */}
            <Suspense fallback={null}>
                <HistoricalSignalsDatabaseWindow
                    visible={showDatabase}
                    onClose={() => setShowDatabase(false)}
                />
            </Suspense>

            {/* ─── 弹窗：回测报告 ────────────────────────── */}
            <Suspense fallback={null}>
                <BacktestingReportCheckWindow
                    visible={showReport}
                    onClose={() => setShowReport(false)}
                    report={report}
                />
            </Suspense>
        </div>
    );
});

SignalsBacktestingPage.displayName = 'SignalsBacktestingPage';

// =========================================================================
// 小组件
// =========================================================================

const SummaryCard: React.FC<{ label: string; value: string; sub?: string; color?: string }> = memo(
    ({ label, value, sub, color = 'text-primary' }) => (
        <div className="bg-surface/40 rounded-lg px-3 py-2 text-center">
            <div className="text-[9px] text-dim mb-0.5">{label}</div>
            <div className={`text-sm font-bold font-mono ${color}`}>
                {value}{sub && <span className="text-[10px] text-dim ml-0.5">{sub}</span>}
            </div>
        </div>
    ),
);
SummaryCard.displayName = 'SummaryCard';
export default SignalsBacktestingPage;