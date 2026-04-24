/**
 * 历史信号数据库窗口（Historical Signals Database Window）
 *
 * 重新设计：两栏季度文件浏览器
 *  - 左栏：合约信号（按季度）
 *  - 右栏：现货信号（按季度）
 *  - 每个文件卡片显示：季度标识、信号数量、文件大小、时间范围、下载按钮
 *  - 弹窗模式：visible + onClose
 */
import React, { memo, useMemo } from 'react';
import type { SignalArchiveFile } from '../../../type/alpha_module_types';

// =========================================================================
// Props
// =========================================================================

interface HistoricalSignalsDatabaseWindowProps {
    visible: boolean;
    onClose: () => void;
}

// =========================================================================
// Mock 数据：季度归档文件
// =========================================================================

const MOCK_ARCHIVES: SignalArchiveFile[] = [
    // 合约信号
    { quarter: '2025-Q2', market: 'futures', signalCount: 1842, fileSize: '24.5 MB', dateRange: '2025-04-01 ~ 2025-06-30' },
    { quarter: '2025-Q1', market: 'futures', signalCount: 2156, fileSize: '28.1 MB', dateRange: '2025-01-01 ~ 2025-03-31' },
    { quarter: '2024-Q4', market: 'futures', signalCount: 1980, fileSize: '25.8 MB', dateRange: '2024-10-01 ~ 2024-12-31' },
    { quarter: '2024-Q3', market: 'futures', signalCount: 1745, fileSize: '22.3 MB', dateRange: '2024-07-01 ~ 2024-09-30' },
    { quarter: '2024-Q2', market: 'futures', signalCount: 2010, fileSize: '26.0 MB', dateRange: '2024-04-01 ~ 2024-06-30' },
    { quarter: '2024-Q1', market: 'futures', signalCount: 1890, fileSize: '24.2 MB', dateRange: '2024-01-01 ~ 2024-03-31' },
    { quarter: '2023-Q4', market: 'futures', signalCount: 1650, fileSize: '21.0 MB', dateRange: '2023-10-01 ~ 2023-12-31' },
    { quarter: '2023-Q3', market: 'futures', signalCount: 1520, fileSize: '19.5 MB', dateRange: '2023-07-01 ~ 2023-09-30' },
    // 现货信号
    { quarter: '2025-Q2', market: 'spot', signalCount: 1456, fileSize: '18.2 MB', dateRange: '2025-04-01 ~ 2025-06-30' },
    { quarter: '2025-Q1', market: 'spot', signalCount: 1680, fileSize: '21.0 MB', dateRange: '2025-01-01 ~ 2025-03-31' },
    { quarter: '2024-Q4', market: 'spot', signalCount: 1520, fileSize: '19.4 MB', dateRange: '2024-10-01 ~ 2024-12-31' },
    { quarter: '2024-Q3', market: 'spot', signalCount: 1380, fileSize: '17.2 MB', dateRange: '2024-07-01 ~ 2024-09-30' },
    { quarter: '2024-Q2', market: 'spot', signalCount: 1590, fileSize: '20.1 MB', dateRange: '2024-04-01 ~ 2024-06-30' },
    { quarter: '2024-Q1', market: 'spot', signalCount: 1460, fileSize: '18.5 MB', dateRange: '2024-01-01 ~ 2024-03-31' },
    { quarter: '2023-Q4', market: 'spot', signalCount: 1280, fileSize: '16.0 MB', dateRange: '2023-10-01 ~ 2023-12-31' },
    { quarter: '2023-Q3', market: 'spot', signalCount: 1190, fileSize: '14.8 MB', dateRange: '2023-07-01 ~ 2023-09-30' },
];

// =========================================================================
// 季度文件卡片
// =========================================================================

const ArchiveCard: React.FC<{ file: SignalArchiveFile }> = memo(({ file }) => {
    const isLatest = file.quarter === '2025-Q2';

    return (
        <div className="bg-surface/50 rounded-lg border border-strong/40 p-3 hover:border-strong/60 transition-colors group">
            {/* 头部：季度 + 标签 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">{file.quarter}</span>
                    {isLatest && (
                        <span className="text-[8px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">最新</span>
                    )}
                </div>
                <span className="text-[10px] text-dim">{file.fileSize}</span>
            </div>

            {/* 信号数量 */}
            <div className="text-xs text-muted mb-1">
                <span className="font-mono text-blue-400 font-bold">{file.signalCount.toLocaleString()}</span> 条信号
            </div>

            {/* 时间范围 */}
            <div className="text-[10px] text-secondary mb-3">{file.dateRange}</div>

            {/* 下载按钮 */}
            <button
                onClick={() => console.log(`[信号数据库] 下载 ${file.market} ${file.quarter}`)}
                className="w-full text-[10px] py-1.5 rounded bg-surface-hover/50 text-muted hover:bg-blue-500/20 hover:text-blue-400 transition-colors flex items-center justify-center gap-1"
            >
                <span>⬇</span> 下载 CSV
            </button>
        </div>
    );
});
ArchiveCard.displayName = 'ArchiveCard';

// =========================================================================
// 栏标题组件
// =========================================================================

const ColumnHeader: React.FC<{ label: string; icon: string; count: number; totalSignals: number }> = memo(
    ({ label, icon, count, totalSignals }) => (
        <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
                <span>{icon}</span>
                <span className="text-sm font-bold text-primary">{label}</span>
                <span className="text-[10px] text-dim">{count} 个季度</span>
            </div>
            <span className="text-[10px] text-dim">
                共 <span className="text-blue-400 font-mono">{totalSignals.toLocaleString()}</span> 条
            </span>
        </div>
    ),
);
ColumnHeader.displayName = 'ColumnHeader';

// =========================================================================
// 主组件
// =========================================================================

const HistoricalSignalsDatabaseWindow: React.FC<HistoricalSignalsDatabaseWindowProps> = memo(({ visible, onClose }) => {
    const futuresFiles = useMemo(() => MOCK_ARCHIVES.filter(f => f.market === 'futures'), []);
    const spotFiles = useMemo(() => MOCK_ARCHIVES.filter(f => f.market === 'spot'), []);

    const futuresTotal = useMemo(() => futuresFiles.reduce((s, f) => s + f.signalCount, 0), [futuresFiles]);
    const spotTotal = useMemo(() => spotFiles.reduce((s, f) => s + f.signalCount, 0), [spotFiles]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* 遮罩 */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* 弹窗主体 */}
            <div className="relative w-full max-w-4xl max-h-[85vh] bg-card rounded-2xl border border-strong/50 shadow-2xl flex flex-col mx-4">
                {/* 顶部 */}
                <div className="shrink-0 px-6 py-4 border-b border-base flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                            📚 历史信号数据库
                        </h2>
                        <p className="text-[11px] text-dim mt-1">
                            按季度归档（3 个月 / 文件）· 数据保留 3 年 · 共 {(futuresTotal + spotTotal).toLocaleString()} 条信号
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="text-dim hover:text-primary transition-colors text-lg leading-none p-1">
                        ✕
                    </button>
                </div>

                {/* 两栏内容 */}
                <div className="flex-1 overflow-y-auto min-h-0 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 左栏：合约信号 */}
                        <div>
                            <ColumnHeader label="合约信号" icon="📈" count={futuresFiles.length} totalSignals={futuresTotal} />
                            <div className="space-y-2">
                                {futuresFiles.map(f => (
                                    <ArchiveCard key={`${f.market}-${f.quarter}`} file={f} />
                                ))}
                            </div>
                        </div>

                        {/* 右栏：现货信号 */}
                        <div>
                            <ColumnHeader label="现货信号" icon="💰" count={spotFiles.length} totalSignals={spotTotal} />
                            <div className="space-y-2">
                                {spotFiles.map(f => (
                                    <ArchiveCard key={`${f.market}-${f.quarter}`} file={f} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 底部说明 */}
                <div className="shrink-0 px-6 py-3 border-t border-base flex items-center justify-between">
                    <span className="text-[10px] text-secondary">
                        💡 数据以 CSV 格式存储，支持第三方工具分析。最早可追溯至 2023-Q3。
                    </span>
                    <button onClick={onClose}
                        className="text-xs px-3 py-1.5 rounded-lg bg-surface text-muted hover:bg-surface-hover transition-colors">
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
});

HistoricalSignalsDatabaseWindow.displayName = 'HistoricalSignalsDatabaseWindow';
export default HistoricalSignalsDatabaseWindow;
