/**
 * 现货交易对参数组件（SpotParams）
 *
 * 展示当前交易对的关键行情指标（紧凑水平布局）：
 *
 *   - 最新价格（大字号高亮）
 *   - 24H 涨跌幅
 *   - 24H 最高 / 最低
 *   - 24H 成交量 / 成交额
 *   - 市场总值
 *
 * 数据来源：useTicker 选择器（实时 WebSocket 推送）
 */
import React, { memo } from 'react';
import { useTradingStore } from '../../../../global_state_store/trading_global_state_store';
import { useTicker } from '../../../../global_state_store/market_data_store';
import { formatPrice, formatVolume, formatPercent, getPnlColorClass } from '../../../../hooks/use_format';

// =========================================================================
// 工具函数
// =========================================================================

function formatMarketCap(value: number | undefined | null): string {
    if (!value) return '—';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
}

// =========================================================================
// 组件
// =========================================================================

const SpotParams = memo(function SpotParams() {
    const activeSymbol = useTradingStore((s) => s.activeSymbol);
    const activeExchangeId = useTradingStore((s) => s.activeExchangeId);
    const ticker = useTicker(activeSymbol, activeExchangeId);

    if (!ticker) {
        return (
            <div className="flex items-center gap-4 text-xs text-dim">
                <span>加载行情数据...</span>
            </div>
        );
    }

    const isPositive = (ticker.changePercent ?? 0) >= 0;

    return (
        <div className="flex items-center gap-4 text-xs overflow-x-auto">
            {/* 最新价格 */}
            <div className="flex flex-col gap-0.5 shrink-0 mr-1">
                <span className={`text-lg font-bold font-mono leading-tight ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPrice(ticker.last)}
                </span>
                <span className={`text-[10px] font-mono ${getPnlColorClass(ticker.changePercent)}`}>
                    {formatPercent(ticker.changePercent)}
                </span>
            </div>

            <div className="w-px h-6 bg-surface-hover/50 shrink-0" />

            {/* 24H 涨跌幅 */}
            <ParamItem
                label="24H涨跌"
                value={formatPercent(ticker.changePercent)}
                colorClass={getPnlColorClass(ticker.changePercent)}
            />
            {/* 24H 最高价 */}
            <ParamItem
                label="24H最高"
                value={formatPrice(ticker.high)}
                colorClass="text-primary"
            />
            {/* 24H 最低价 */}
            <ParamItem
                label="24H最低"
                value={formatPrice(ticker.low)}
                colorClass="text-primary"
            />
            {/* 24H 成交量 */}
            <ParamItem
                label="24H量"
                value={formatVolume(ticker.volume)}
                colorClass="text-secondary"
            />
            {/* 24H 成交额 */}
            <ParamItem
                label="24H额"
                value={`$${formatVolume(ticker.quoteVolume)}`}
                colorClass="text-secondary"
            />
            {/* 市场总值 */}
            <ParamItem
                label="市值"
                value={formatMarketCap((ticker as Record<string, unknown>).marketCap as number | undefined)}
                colorClass="text-secondary"
            />
        </div>
    );
});

SpotParams.displayName = 'SpotParams';

// =========================================================================
// 参数项子组件
// =========================================================================

interface ParamItemProps {
    label: string;
    value: string;
    colorClass: string;
}

const ParamItem = memo(function ParamItem({ label, value, colorClass }: ParamItemProps) {
    return (
        <div className="flex flex-col gap-0.5 shrink-0">
            <span className="text-dim text-[10px]">{label}</span>
            <span className={`font-mono font-medium ${colorClass}`}>{value}</span>
        </div>
    );
});

ParamItem.displayName = 'ParamItem';

export default SpotParams;
