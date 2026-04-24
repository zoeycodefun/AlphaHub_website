/**
 * 通用下单表单组件（OrderForm）
 *
 * 现货 & 合约共用的下单 UI 组件，功能包括：
 *
 *   1. 买入 / 卖出 Tab 切换
 *   2. 订单类型选择（限价 / 市价 / 止损限价）
 *   3. 价格 / 数量 / 金额输入（含数字验证）
 *   4. 百分比滑块（快捷设置仓位比例）
 *   5. 可用余额展示
 *   6. 下单按钮（含 loading 状态）
 *
 * Props 由父组件（Spot / Futures）传入，组件本身不依赖全局 Store，
 * 保持纯展示 + 回调模式，方便测试和复用。
 */
import React, { memo, useState, useCallback } from 'react';
import type { OrderSide } from '../../pages/trade_center_pages/type/spot_trading_types';

// =========================================================================
// 类型定义
// =========================================================================

/** 支持的订单类型选项 */
export interface OrderTypeOption {
    value: string;
    label: string;
}

/** 下单表单 Props */
export interface OrderFormProps {
    /** 当前交易对 */
    symbol: string;
    /** 可选订单类型列表 */
    orderTypes: OrderTypeOption[];
    /** 当前选中的订单类型值 */
    selectedOrderType: string;
    /** 订单类型变更回调 */
    onOrderTypeChange: (type: string) => void;
    /** 可用余额（计价币种，如 USDT） */
    availableQuoteBalance: number;
    /** 可用余额（基础币种，如 BTC） */
    availableBaseBalance: number;
    /** 计价币种名称 */
    quoteCurrency: string;
    /** 基础币种名称 */
    baseCurrency: string;
    /** 当前市场价格（用于市价单估算） */
    currentPrice: number;
    /** 价格精度（小数位数） */
    pricePrecision?: number;
    /** 数量精度（小数位数） */
    amountPrecision?: number;
    /** 提交下单回调 */
    onSubmit: (params: OrderFormSubmitParams) => void;
    /** 是否正在提交 */
    isSubmitting?: boolean;
    /** 是否显示触发价输入框（止损/止盈类型） */
    showTriggerPrice?: boolean;
    /** 额外的表单内容（如杠杆选择器），插入在数量输入之后 */
    extraContent?: React.ReactNode;
    /** 自定义 CSS */
    className?: string;
}

/** 提交参数 */
export interface OrderFormSubmitParams {
    side: OrderSide;
    orderType: string;
    price: string;
    amount: string;
    triggerPrice: string;
    percentSlider: number;
}

// =========================================================================
// 百分比快捷按钮
// =========================================================================

const PERCENT_OPTIONS = [25, 50, 75, 100];

// =========================================================================
// 组件实现
// =========================================================================

const OrderForm = memo(function OrderForm(props: OrderFormProps) {
    const {
        symbol,
        orderTypes,
        selectedOrderType,
        onOrderTypeChange,
        availableQuoteBalance,
        availableBaseBalance,
        quoteCurrency,
        baseCurrency,
        currentPrice,
        pricePrecision = 2,
        amountPrecision = 6,
        onSubmit,
        isSubmitting = false,
        showTriggerPrice = false,
        extraContent,
        className = '',
    } = props;

    // 本地表单状态
    const [side, setSide] = useState<OrderSide>('buy');
    const [priceInput, setPriceInput] = useState('');
    const [amountInput, setAmountInput] = useState('');
    const [triggerPriceInput, setTriggerPriceInput] = useState('');
    const [percentSlider, setPercentSlider] = useState(0);

    const isMarketOrder = selectedOrderType === 'market';

    // 数字输入过滤（只允许数字和一个小数点）
    const sanitizeNumber = useCallback((value: string) => {
        return value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    }, []);

    // 百分比快捷操作
    const handlePercentClick = useCallback((percent: number) => {
        setPercentSlider(percent);
        const balance = side === 'buy' ? availableQuoteBalance : availableBaseBalance;
        if (side === 'buy' && currentPrice > 0) {
            // 买入时根据 USDT 余额计算可买数量
            const amount = (balance * percent) / 100 / currentPrice;
            setAmountInput(amount.toFixed(amountPrecision));
        } else {
            // 卖出时直接按持有数量百分比
            const amount = (balance * percent) / 100;
            setAmountInput(amount.toFixed(amountPrecision));
        }
    }, [side, availableQuoteBalance, availableBaseBalance, currentPrice, amountPrecision]);

    // 提交
    const handleSubmit = useCallback(() => {
        onSubmit({
            side,
            orderType: selectedOrderType,
            price: priceInput,
            amount: amountInput,
            triggerPrice: triggerPriceInput,
            percentSlider,
        });
    }, [side, selectedOrderType, priceInput, amountInput, triggerPriceInput, percentSlider, onSubmit]);

    // 预估总金额（用于展示）
    const estimatedTotal = (() => {
        const price = isMarketOrder ? currentPrice : parseFloat(priceInput) || 0;
        const amount = parseFloat(amountInput) || 0;
        return (price * amount).toFixed(pricePrecision);
    })();

    return (
        <div className={`bg-card rounded-lg p-4 ${className}`}>
            {/* ─── 买卖切换 ───────────────────────────────────────── */}
            <div className="flex mb-4 rounded-lg overflow-hidden border border-strong">
                <button
                    onClick={() => setSide('buy')}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                        side === 'buy'
                            ? 'bg-green-600 text-white'
                            : 'bg-surface text-muted hover:text-primary'
                    }`}
                >
                    买入
                </button>
                <button
                    onClick={() => setSide('sell')}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                        side === 'sell'
                            ? 'bg-red-600 text-white'
                            : 'bg-surface text-muted hover:text-primary'
                    }`}
                >
                    卖出
                </button>
            </div>

            {/* ─── 订单类型 ───────────────────────────────────────── */}
            <div className="flex gap-1 mb-4">
                {orderTypes.map((type) => (
                    <button
                        key={type.value}
                        onClick={() => onOrderTypeChange(type.value)}
                        className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                            selectedOrderType === type.value
                                ? 'bg-blue-600 text-white'
                                : 'bg-surface text-muted hover:text-primary'
                        }`}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            {/* ─── 可用余额 ───────────────────────────────────────── */}
            <div className="flex justify-between text-xs text-muted mb-3">
                <span>可用</span>
                <span className="font-mono">
                    {side === 'buy'
                        ? `${availableQuoteBalance.toFixed(2)} ${quoteCurrency}`
                        : `${availableBaseBalance.toFixed(amountPrecision)} ${baseCurrency}`
                    }
                </span>
            </div>

            {/* ─── 触发价（止损/止盈类型） ──────────────────────── */}
            {showTriggerPrice && (
                <div className="mb-3">
                    <label className="text-xs text-dim mb-1 block">触发价</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={triggerPriceInput}
                            onChange={(e) => setTriggerPriceInput(sanitizeNumber(e.target.value))}
                            placeholder="触发价格"
                            className="w-full px-3 py-2.5 bg-surface border border-strong rounded-md text-primary text-sm font-mono focus:outline-none focus:border-blue-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dim">
                            {quoteCurrency}
                        </span>
                    </div>
                </div>
            )}

            {/* ─── 价格输入（市价单时禁用） ──────────────────────── */}
            {!isMarketOrder && (
                <div className="mb-3">
                    <label className="text-xs text-dim mb-1 block">价格</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={priceInput}
                            onChange={(e) => setPriceInput(sanitizeNumber(e.target.value))}
                            placeholder={`价格 (${quoteCurrency})`}
                            className="w-full px-3 py-2.5 bg-surface border border-strong rounded-md text-primary text-sm font-mono focus:outline-none focus:border-blue-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dim">
                            {quoteCurrency}
                        </span>
                    </div>
                </div>
            )}

            {isMarketOrder && (
                <div className="mb-3 px-3 py-2.5 bg-surface border border-strong rounded-md">
                    <span className="text-xs text-dim">市价</span>
                    <span className="text-sm text-primary ml-2 font-mono">
                        ≈ {currentPrice.toFixed(pricePrecision)}
                    </span>
                </div>
            )}

            {/* ─── 数量输入 ───────────────────────────────────────── */}
            <div className="mb-3">
                <label className="text-xs text-dim mb-1 block">数量</label>
                <div className="relative">
                    <input
                        type="text"
                        value={amountInput}
                        onChange={(e) => setAmountInput(sanitizeNumber(e.target.value))}
                        placeholder={`数量 (${baseCurrency})`}
                        className="w-full px-3 py-2.5 bg-surface border border-strong rounded-md text-primary text-sm font-mono focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dim">
                        {baseCurrency}
                    </span>
                </div>
            </div>

            {/* ─── 百分比快捷按钮 ─────────────────────────────────── */}
            <div className="flex gap-2 mb-3">
                {PERCENT_OPTIONS.map((pct) => (
                    <button
                        key={pct}
                        onClick={() => handlePercentClick(pct)}
                        className={`flex-1 py-1 text-xs rounded border transition-colors ${
                            percentSlider === pct
                                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                                : 'border-strong text-dim hover:text-secondary'
                        }`}
                    >
                        {pct}%
                    </button>
                ))}
            </div>

            {/* ─── 额外内容插槽（如杠杆选择） ──────────────────── */}
            {extraContent}

            {/* ─── 预估总金额 ─────────────────────────────────────── */}
            <div className="flex justify-between text-xs text-muted mb-4">
                <span>预估金额</span>
                <span className="font-mono">{estimatedTotal} {quoteCurrency}</span>
            </div>

            {/* ─── 下单按钮 ───────────────────────────────────────── */}
            <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    side === 'buy'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
            >
                {isSubmitting
                    ? '提交中...'
                    : `${side === 'buy' ? '买入' : '卖出'} ${baseCurrency}`
                }
            </button>
        </div>
    );
});

OrderForm.displayName = 'OrderForm';

export { OrderForm };
