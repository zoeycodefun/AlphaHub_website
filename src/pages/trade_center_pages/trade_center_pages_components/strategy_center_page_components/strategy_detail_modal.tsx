/**
 * 策略详情弹窗
 * 
 * 展示策略配置详情、运行状态、执行日志
 * 支持 mode: 'config' | 'logs' | 'edit'
 */
import React, { memo } from 'react';
import type { StrategyRecord, StrategyExecutionLog } from '../../type/alpha_module_types';

type ModalMode = 'config' | 'logs' | 'edit';

interface StrategyDetailModalProps {
    isOpen: boolean;
    mode: ModalMode;
    strategy: StrategyRecord | null;
    logs: StrategyExecutionLog[];
    onClose: () => void;
    onSaveParams?: (strategyId: string, params: Record<string, unknown>) => void;
}

const LOG_STATUS_STYLES: Record<string, { label: string; color: string }> = {
    success:       { label: '成功', color: 'text-green-400' },
    failed:        { label: '失败', color: 'text-red-400' },
    skipped:       { label: '跳过', color: 'text-muted' },
    risk_rejected: { label: '风控拒绝', color: 'text-yellow-400' },
};

const StrategyDetailModal: React.FC<StrategyDetailModalProps> = memo(({
    isOpen,
    mode,
    strategy,
    logs,
    onClose,
}) => {
    if (!isOpen || !strategy) return null;

    const filteredLogs = logs.filter(l => l.strategyId === strategy.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl max-h-[80vh] bg-card border border-strong rounded-xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* 头部 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-strong">
                    <div>
                        <h2 className="text-lg font-bold text-primary">{strategy.name}</h2>
                        <p className="text-xs text-dim mt-0.5">
                            {mode === 'config' ? '策略配置详情' : mode === 'logs' ? '运行状态与日志' : '编辑参数'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted hover:text-primary rounded-lg hover:bg-surface transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* 内容 */}
                <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(80vh - 72px)' }}>
                    {mode === 'config' && (
                        <div className="space-y-4">
                            <ConfigRow label="市场类型" value={strategy.marketType === 'spot' ? '现货' : '合约'} />
                            <ConfigRow label="交易对" value={strategy.symbols.join(', ')} />
                            <ConfigRow label="交易所" value={strategy.exchangeId} />
                            <ConfigRow label="执行模式" value={strategy.executionMode === 'live' ? '实盘' : '模拟'} />
                            <ConfigRow label="调度间隔" value={`${strategy.intervalMinutes} 分钟`} />
                            {strategy.leverage && <ConfigRow label="杠杆倍数" value={`${strategy.leverage}x`} />}
                            <ConfigRow label="总执行" value={`${strategy.totalExecutions} 次`} />
                            <ConfigRow label="成功执行" value={`${strategy.successfulExecutions} 次`} />
                            <ConfigRow label="累计盈亏" value={`${strategy.totalPnl >= 0 ? '+' : ''}${strategy.totalPnl.toFixed(2)} USDT`}
                                valueColor={strategy.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'} />
                            <ConfigRow label="创建时间" value={new Date(strategy.createdAt).toLocaleDateString()} />
                            <ConfigRow label="描述" value={strategy.description || '-'} />
                        </div>
                    )}

                    {mode === 'logs' && (
                        <div className="space-y-2">
                            {filteredLogs.length === 0 ? (
                                <p className="text-center text-dim py-8">暂无执行日志</p>
                            ) : (
                                filteredLogs.map(log => {
                                    const s = LOG_STATUS_STYLES[log.status] ?? LOG_STATUS_STYLES.failed;
                                    return (
                                        <div key={log.id} className="flex items-center justify-between py-2 px-3 bg-surface/60 rounded-lg text-xs">
                                            <div className="flex items-center gap-3">
                                                <span className={`font-medium ${s.color}`}>{s.label}</span>
                                                {log.signalScore !== null && (
                                                    <span className="text-muted">评分: {log.signalScore}</span>
                                                )}
                                                {log.signalDirection && (
                                                    <span className={log.signalDirection === 'buy' ? 'text-green-400' : 'text-red-400'}>
                                                        {log.signalDirection === 'buy' ? '买入' : '卖出'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-dim">
                                                <span>{log.durationMs}ms</span>
                                                <span>{new Date(log.executedAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {mode === 'edit' && (
                        <div className="text-center text-dim py-8">
                            参数编辑功能开发中...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

/** 配置展示行 */
function ConfigRow({ label, value, valueColor = 'text-secondary' }: { label: string; value: string; valueColor?: string }) {
    return (
        <div className="flex items-start justify-between py-2 border-b border-base last:border-0">
            <span className="text-sm text-dim shrink-0">{label}</span>
            <span className={`text-sm ${valueColor} text-right max-w-[60%]`}>{value}</span>
        </div>
    );
}

StrategyDetailModal.displayName = 'StrategyDetailModal';
export default StrategyDetailModal;
