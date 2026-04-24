/**
 * AI 模型训练页面（顶级导航 — "试试我们的模型"）
 *
 * 展示已有 AI 模型卡片：名称、描述、训练状态/进度、准确率、数据集大小、
 * 最近训练时间，以及"开始训练"/"重新训练"操作按钮。
 */
import React, { memo, useState } from 'react';
import type { AiModelInfo, AiModelStatus } from './trade_center_pages/type/alpha_module_types';

// ─── 状态样式 ───────────────────────────────────────────────────
const STATUS_MAP: Record<AiModelStatus, { label: string; color: string; bg: string }> = {
    idle:     { label: '空闲',   color: 'text-muted',   bg: 'bg-surface-hover' },
    training: { label: '训练中', color: 'text-blue-400',   bg: 'bg-blue-900/50' },
    ready:    { label: '就绪',   color: 'text-green-400',  bg: 'bg-green-900/50' },
    error:    { label: '异常',   color: 'text-red-400',    bg: 'bg-red-900/50' },
};

// ─── Mock 模型 ──────────────────────────────────────────────────
const MOCK_MODELS: AiModelInfo[] = [
    {
        id: 'model-signal-01',
        name: '信号预测模型',
        description: '基于 LSTM 的多时间框架信号评分预测，输入 K 线 + 链上数据，输出 1h/4h/1d 方向概率',
        status: 'ready',
        trainingProgress: 100,
        accuracy: 72.3,
        lastTrainedAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
        datasetSize: 128_000,
        createdAt: new Date(Date.now() - 30 * 86400_000).toISOString(),
    },
    {
        id: 'model-risk-01',
        name: '风险评分模型',
        description: '基于 XGBoost 的仓位风险实时评分，输入持仓结构 + 波动率 + 流动性，输出 0-100 风险分',
        status: 'training',
        trainingProgress: 64,
        accuracy: null,
        lastTrainedAt: null,
        datasetSize: 85_000,
        createdAt: new Date(Date.now() - 15 * 86400_000).toISOString(),
    },
    {
        id: 'model-emotion-01',
        name: '市场情绪模型',
        description: '基于 BERT 的社交媒体情绪分析 (Twitter / Telegram)，输出 Fear-Greed 指数与情绪极值检测',
        status: 'idle',
        trainingProgress: 0,
        accuracy: 68.9,
        lastTrainedAt: new Date(Date.now() - 10 * 86400_000).toISOString(),
        datasetSize: 520_000,
        createdAt: new Date(Date.now() - 60 * 86400_000).toISOString(),
    },
    {
        id: 'model-strategy-01',
        name: '策略优化模型',
        description: '基于强化学习 (PPO) 的策略参数自动调优，在回测引擎上迭代优化 Sharpe / Calmar',
        status: 'error',
        trainingProgress: 37,
        accuracy: null,
        lastTrainedAt: null,
        datasetSize: 42_000,
        createdAt: new Date(Date.now() - 5 * 86400_000).toISOString(),
    },
];

// =========================================================================
// 主组件
// =========================================================================

const AiModelTrainingPage: React.FC = memo(() => {
    const [models] = useState<AiModelInfo[]>(MOCK_MODELS);

    return (
        <div className="w-full min-h-screen p-4 lg:p-6 bg-base">
            {/* 顶部 */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-primary">试试我们的模型</h1>
                <p className="text-sm text-dim mt-1">管理与训练 AI 模型 · 监控训练进度 · 查看模型表现</p>
            </div>

            {/* 模型卡片网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {models.map(model => (
                    <ModelCard key={model.id} model={model} />
                ))}
            </div>
        </div>
    );
});

// ─── 模型卡片 ───────────────────────────────────────────────────

function ModelCard({ model }: { model: AiModelInfo }) {
    const stCfg = STATUS_MAP[model.status];

    return (
        <div className="bg-card/50 border border-base rounded-xl p-5 flex flex-col gap-4">
            {/* 头部: 名称 + 状态 */}
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-primary">{model.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${stCfg.bg} ${stCfg.color}`}>{stCfg.label}</span>
            </div>

            {/* 描述 */}
            <p className="text-xs text-muted leading-relaxed">{model.description}</p>

            {/* 训练进度（如果正在训练） */}
            {model.status === 'training' && (
                <div>
                    <div className="flex justify-between text-[10px] text-dim mb-1">
                        <span>训练进度</span>
                        <span>{model.trainingProgress}%</span>
                    </div>
                    <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${model.trainingProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* 指标 */}
            <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                    <span className="text-dim">准确率</span>
                    <p className="text-primary font-medium mt-0.5">
                        {model.accuracy !== null ? `${model.accuracy.toFixed(1)}%` : '--'}
                    </p>
                </div>
                <div>
                    <span className="text-dim">数据集</span>
                    <p className="text-primary font-medium mt-0.5">
                        {model.datasetSize >= 1000 ? `${(model.datasetSize / 1000).toFixed(0)}K` : model.datasetSize}
                    </p>
                </div>
                <div>
                    <span className="text-dim">最近训练</span>
                    <p className="text-primary font-medium mt-0.5">
                        {model.lastTrainedAt ? new Date(model.lastTrainedAt).toLocaleDateString() : '--'}
                    </p>
                </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 mt-auto">
                {model.status === 'idle' && (
                    <button className="flex-1 text-xs py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                        开始训练
                    </button>
                )}
                {model.status === 'ready' && (
                    <>
                        <button className="flex-1 text-xs py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                            重新训练
                        </button>
                        <button className="flex-1 text-xs py-2 rounded-lg bg-surface-hover text-secondary hover:bg-surface-hover transition-colors">
                            查看详情
                        </button>
                    </>
                )}
                {model.status === 'training' && (
                    <button className="flex-1 text-xs py-2 rounded-lg bg-surface-hover text-muted cursor-not-allowed" disabled>
                        训练中...
                    </button>
                )}
                {model.status === 'error' && (
                    <button className="flex-1 text-xs py-2 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors">
                        重试训练
                    </button>
                )}
            </div>
        </div>
    );
}

AiModelTrainingPage.displayName = 'AiModelTrainingPage';
export default AiModelTrainingPage;
