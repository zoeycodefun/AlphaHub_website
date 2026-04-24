/**
 * 项目状态组件（ProjectStatus）
 *
 * 用于持仓列表行内展示关联投研项目的状态：
 *  - 投研评分（带颜色指示）
 *  - 最近更新时间
 *  - 简要状态标签
 */
import React, { memo } from 'react';

// =========================================================================
// Props
// =========================================================================

interface ProjectStatusProps {
    /** 投研评分 0-100 */
    score?: number;
    /** 最近一次更新描述 */
    latestUpdate?: string;
    /** 是否已关联投研项目 */
    hasResearch: boolean;
}

// =========================================================================
// 主组件
// =========================================================================

const ProjectStatus: React.FC<ProjectStatusProps> = memo(({ score, latestUpdate, hasResearch }) => {
    if (!hasResearch) {
        return (
            <div className="flex items-center gap-1 text-[9px] text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                <span>未关联</span>
            </div>
        );
    }

    const scoreColor = (score ?? 0) >= 70 ? 'text-green-400' : (score ?? 0) >= 40 ? 'text-yellow-400' : 'text-red-400';
    const scoreBg = (score ?? 0) >= 70 ? 'bg-green-500/10' : (score ?? 0) >= 40 ? 'bg-yellow-500/10' : 'bg-red-500/10';

    return (
        <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold font-mono ${scoreColor} ${scoreBg} px-1 py-0 rounded`}>
                    {score ?? '--'}
                </span>
                <span className="text-[9px] text-dim">分</span>
            </div>
            {latestUpdate && (
                <div className="text-[8px] text-secondary truncate max-w-[100px]" title={latestUpdate}>
                    {latestUpdate}
                </div>
            )}
        </div>
    );
});

ProjectStatus.displayName = 'ProjectStatus';
export default ProjectStatus;
