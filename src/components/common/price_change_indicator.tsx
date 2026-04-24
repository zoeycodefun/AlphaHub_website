/**
 * 价格变化方向指示器（PriceChangeIndicator）
 *
 * 用于可视化展示价格变化方向的小型组件：
 *
 * ─── 功能 ────────────────────────────────────────────────────────
 *  1. **方向箭头**：上涨显示「▲」绿色、下跌显示「▼」红色、持平不显示
 *  2. **脉冲动画**：方向变化时触发 CSS 脉冲效果，引导用户注意力
 *  3. **多尺寸支持**：sm / md / lg 三种尺寸适配不同布局
 *
 * ─── 设计原则 ────────────────────────────────────────────────────
 *  - **纯展示组件**：无副作用，完全由 props 驱动
 *  - **零 JS 动画**：所有动画通过 CSS transition/keyframe 实现
 *  - **色觉友好**：除颜色外还用箭头方向区分涨跌
 *
 * ─── 使用方式 ────────────────────────────────────────────────────
 *  <PriceChangeIndicator direction="up" size="md" />
 *  <PriceChangeIndicator direction="down" size="sm" />
 */
import React, { useEffect, useRef } from 'react';

// =========================================================================
// 类型定义
// =========================================================================

/** 价格变化方向 */
export type PriceDirection = 'up' | 'down' | 'neutral';

export interface PriceChangeIndicatorProps {
    /** 价格方向：up=上涨 / down=下跌 / neutral=持平 */
    direction: PriceDirection;
    /** 尺寸：sm / md / lg（默认 md） */
    size?: 'sm' | 'md' | 'lg';
    /** 自定义 CSS 类名 */
    className?: string;
    /** 是否显示脉冲动画（默认 true） */
    animated?: boolean;
}

// =========================================================================
// 尺寸配置
// =========================================================================

const SIZE_CONFIG = {
    sm: { fontSize: 'text-[10px]', gap: 'gap-0.5' },
    md: { fontSize: 'text-xs',     gap: 'gap-1' },
    lg: { fontSize: 'text-sm',     gap: 'gap-1' },
} as const;

// =========================================================================
// 方向配置
// =========================================================================

const DIRECTION_CONFIG = {
    up: {
        symbol:     '▲',
        color:      'text-green-400',
        bgPulse:    'bg-green-400/20',
        ariaLabel:  '价格上涨',
    },
    down: {
        symbol:     '▼',
        color:      'text-red-400',
        bgPulse:    'bg-red-400/20',
        ariaLabel:  '价格下跌',
    },
    neutral: {
        symbol:     '',
        color:      'text-muted',
        bgPulse:    '',
        ariaLabel:  '价格持平',
    },
} as const;

// =========================================================================
// PriceChangeIndicator 组件
// =========================================================================

export const PriceChangeIndicator: React.FC<PriceChangeIndicatorProps> = ({
    direction,
    size = 'md',
    className = '',
    animated = true,
}) => {
    const elRef = useRef<HTMLSpanElement>(null);
    const prevDirectionRef = useRef<PriceDirection>(direction);

    const config = DIRECTION_CONFIG[direction];
    const sizeConfig = SIZE_CONFIG[size];

    // 方向变化时触发脉冲动画
    useEffect(() => {
        if (!animated || direction === 'neutral') return;
        if (direction === prevDirectionRef.current) return;

        prevDirectionRef.current = direction;

        const el = elRef.current;
        if (!el) return;

        // 触发 CSS 缩放脉冲
        el.classList.remove('animate-indicator-pulse');
        void el.offsetHeight; // 强制重排
        el.classList.add('animate-indicator-pulse');
    }, [direction, animated]);

    // neutral 方向不渲染
    if (direction === 'neutral') return null;

    return (
        <span
            ref={elRef}
            className={`
                inline-flex items-center justify-center
                ${sizeConfig.fontSize}
                ${config.color}
                ${sizeConfig.gap}
                leading-none
                transition-colors duration-150
                ${className}
            `.trim()}
            role="img"
            aria-label={config.ariaLabel}
        >
            {config.symbol}
        </span>
    );
};

export default PriceChangeIndicator;
