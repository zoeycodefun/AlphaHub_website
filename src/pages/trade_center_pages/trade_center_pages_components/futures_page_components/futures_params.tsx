/**
 * 合约参数指标组件（FuturesParams）
 *
 * 展示合约特有的行情参数（紧凑水平布局）：
 *
 *   - 标记价格 / 指数价格
 *   - 资金费率 & 倒计时
 *   - 24H 涨跌幅 / 最高 / 最低
 *   - 24H 成交量
 *   - 持仓量（Open Interest）
 *
 * 数据来源：useTicker + tradingStore.fundingRate
 */
import React, { memo, useState, useEffect } from 'react';
import { useTradingStore } from '../../../../global_state_store/trading_global_state_store';
import { useTicker } from '../../../../global_state_store/market_data_store';
import { formatPrice, formatVolume, formatPercent, getPnlColorClass } from '../../../../hooks/use_format';

// =========================================================================
// 组件
// =========================================================================

const FuturesParams = memo(function FuturesParams() {
    const activeSymbol = useTradingStore((s) => s.activeSymbol);
    const activeExchangeId = useTradingStore((s) => s.activeExchangeId);
    const fundingRate = useTradingStore((s) => s.fundingRate);
    const fetchFundingRate = useTradingStore((s) => s.fetchFundingRate);

    const ticker = useTicker(activeSymbol, activeExchangeId);

    // 定时刷新资金费率
    useEffect(() => {
        fetchFundingRate();
        const interval = setInterval(fetchFundingRate, 60_000); // 每分钟刷新
        return () => clearInterval(interval);
    }, [fetchFundingRate]);

    // 资金费率倒计时
    const countdown = useFundingCountdown(fundingRate?.nextFundingTime);

    if (!ticker) {
        return (
            <div className="flex items-center gap-4 text-xs text-dim">
                <span>加载合约行情...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4 text-xs overflow-x-auto">
            {/* 标记价格 */}
            {ticker.markPrice != null && (
                <ParamItem label="标记价" value={formatPrice(ticker.markPrice)} colorClass="text-yellow-400" />
            )}
            {/* 资金费率 */}
            {fundingRate && (
                <ParamItem
                    label={`费率 ${countdown}`}
                    value={`${(fundingRate.fundingRate * 100).toFixed(4)}%`}
                    colorClass={fundingRate.fundingRate >= 0 ? 'text-green-400' : 'text-red-400'}
                />
            )}
            {/* 24H 涨跌幅 */}
            <ParamItem
                label="24H涨跌"
                value={formatPercent(ticker.changePercent)}
                colorClass={getPnlColorClass(ticker.changePercent)}
            />
            {/* 24H 最高 */}
            <ParamItem label="24H最高" value={formatPrice(ticker.high)} colorClass="text-primary" />
            {/* 24H 最低 */}
            <ParamItem label="24H最低" value={formatPrice(ticker.low)} colorClass="text-primary" />
            {/* 24H 成交量 */}
            <ParamItem label="24H量" value={formatVolume(ticker.volume)} colorClass="text-secondary" />
            {/* 持仓量 */}
            {ticker.openInterest != null && (
                <ParamItem label="持仓量" value={formatVolume(ticker.openInterest)} colorClass="text-blue-400" />
            )}
        </div>
    );
});

FuturesParams.displayName = 'FuturesParams';

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

// =========================================================================
// 资金费率倒计时 Hook
// =========================================================================

function useFundingCountdown(nextFundingTime?: string): string {
    const [countdown, setCountdown] = useState('');

    useEffect(() => {
        if (!nextFundingTime) {
            setCountdown('');
            return;
        }

        function update() {
            const diff = new Date(nextFundingTime!).getTime() - Date.now();
            if (diff <= 0) {
                setCountdown('00:00:00');
                return;
            }
            const hours = Math.floor(diff / 3_600_000);
            const minutes = Math.floor((diff % 3_600_000) / 60_000);
            const seconds = Math.floor((diff % 60_000) / 1_000);
            setCountdown(
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
            );
        }

        update();
        const interval = setInterval(update, 1_000);
        return () => clearInterval(interval);
    }, [nextFundingTime]);

    return countdown;
}

export default FuturesParams;
