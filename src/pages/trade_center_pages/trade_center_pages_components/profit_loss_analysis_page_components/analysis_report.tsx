/**
 * 盈亏分析报告生成与下载组件
 */
import React, { memo, useCallback } from 'react';
import type { PnlComprehensiveReport } from '../../../type/alpha_module_types';

interface Props {
    report: PnlComprehensiveReport;
}

const AnalysisReport: React.FC<Props> = memo(({ report }) => {
    const handleDownload = useCallback(() => {
        const content = generateReportText(report);
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AlphaHub_PnL_Report_${report.period.replace(/\s/g, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }, [report]);

    return (
        <button
            onClick={handleDownload}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
            <span>📥</span>
            下载完整报告
        </button>
    );
});

function generateReportText(r: PnlComprehensiveReport): string {
    return `
═══════════════════════════════════════════
  ${r.title}
  统计周期：${r.period}
  生成时间：${r.generatedAt}
═══════════════════════════════════════════

📊 资金概览
─────────────────────────────
  初始资金：${r.fundOverview.initialCapital.toFixed(2)} USDT
  当前权益：${r.fundOverview.currentEquity.toFixed(2)} USDT
  净盈亏：${r.fundOverview.netPnl >= 0 ? '+' : ''}${r.fundOverview.netPnl.toFixed(2)} USDT (${r.fundOverview.netReturnPct >= 0 ? '+' : ''}${r.fundOverview.netReturnPct.toFixed(2)}%)

💰 收益表现
─────────────────────────────
  已实现盈亏：${r.performanceSummary.totalRealizedPnl.toFixed(2)} USDT
  未实现盈亏：${r.performanceSummary.unrealizedPnl.toFixed(2)} USDT
  年化收益率：${r.performanceSummary.annualizedReturnPct.toFixed(2)}%
  夏普比率：${r.performanceSummary.sharpeRatio.toFixed(2)}
  索提诺比率：${r.performanceSummary.sortinoRatio.toFixed(2)}
  最大回撤：${r.performanceSummary.maxDrawdownPct.toFixed(2)}%
  卡尔玛比率：${r.performanceSummary.calmarRatio.toFixed(2)}

📈 交易统计
─────────────────────────────
  总交易次数：${r.tradeStats.totalTrades}
  盈利次数：${r.tradeStats.winCount}
  亏损次数：${r.tradeStats.lossCount}
  胜率：${r.tradeStats.winRatePct.toFixed(1)}%
  盈亏比：${r.tradeStats.profitFactor.toFixed(2)}
  平均盈利：${r.tradeStats.avgWin.toFixed(2)} USDT
  平均亏损：${r.tradeStats.avgLoss.toFixed(2)} USDT

🎯 最佳表现
─────────────────────────────
  最佳交易：${r.bestPerformance.bestTrade.symbol} +${r.bestPerformance.bestTrade.pnl.toFixed(2)} (${r.bestPerformance.bestTrade.date})
  最佳日：${r.bestPerformance.bestDay.date} +${r.bestPerformance.bestDay.pnl.toFixed(2)}
  最长连胜：${r.bestPerformance.longestWinStreak} 次

⚠️ 需要改进
─────────────────────────────
  最差交易：${r.areasForImprovement.worstTrade.symbol} ${r.areasForImprovement.worstTrade.pnl.toFixed(2)} (${r.areasForImprovement.worstTrade.date})
  最差日：${r.areasForImprovement.worstDay.date} ${r.areasForImprovement.worstDay.pnl.toFixed(2)}
  最长连亏：${r.areasForImprovement.longestLossStreak} 次

💡 优化建议
─────────────────────────────
${r.suggestions.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}
`.trim();
}

AnalysisReport.displayName = 'AnalysisReport';
export default AnalysisReport;
