/**
 * 合约交易类型定义（Futures Trading Types）
 *
 * 在现货类型基础上扩展合约特有概念：
 *
 *   1. 合约类型 & 保证金模式 & 持仓方向
 *   2. 合约下单请求（含杠杆、止盈止损）
 *   3. 合约持仓（含强平价、未实现盈亏）
 *   4. 资金费率 & 合约账户信息
 *
 * 与 spot_trading_types.ts 共享基础枚举（OrderSide / OrderStatus），
 * 保持命名一致性便于组件层复用逻辑。
 */

import type { OrderSide, OrderStatus } from './spot_trading_types';

// =========================================================================
// 合约特有枚举
// =========================================================================

/** 合约品种类型 */
export type ContractType =
    | 'usdt_perpetual'  // USDT 永续合约
    | 'coin_perpetual'  // 币本位永续合约
    | 'usdt_delivery'   // USDT 交割合约
    | 'coin_delivery';  // 币本位交割合约

/** 保证金模式 */
export type MarginMode = 'cross' | 'isolated';

/** 持仓方向（单向 / 双向持仓） */
export type PositionSide =
    | 'long'    // 多头
    | 'short'   // 空头
    | 'both';   // 单向模式（净持仓），多空合并

/** 合约订单类型 */
export type FuturesOrderType =
    | 'limit'
    | 'market'
    | 'stop_limit'
    | 'stop_market'
    | 'take_profit'     // 止盈
    | 'stop_loss'       // 止损
    | 'trailing_stop';  // 追踪止损

// =========================================================================
// 下单请求
// =========================================================================

/** 合约下单请求（前端 → 后端） */
export interface FuturesOrderRequest {
    /** 交易所 ID */
    readonly exchangeId: string;
    /** 交易对（如 'BTC/USDT'） */
    readonly symbol: string;
    /** 合约品种类型 */
    readonly contractType: ContractType;
    /** 买卖方向 */
    readonly side: OrderSide;
    /** 持仓方向（双向持仓时必填） */
    readonly positionSide?: PositionSide;
    /** 订单类型 */
    readonly orderType: FuturesOrderType;
    /** 下单数量（张 / 币，取决于合约规则） */
    readonly amount: number;
    /** 限价单价格 */
    readonly price?: number;
    /** 触发价格（止损/止盈/追踪止损） */
    readonly triggerPrice?: number;
    /** 杠杆倍数 */
    readonly leverage: number;
    /** 保证金模式 */
    readonly marginMode: MarginMode;
    /** 止盈价格（可选，挂单时附带） */
    readonly takeProfitPrice?: number;
    /** 止损价格（可选，挂单时附带） */
    readonly stopLossPrice?: number;
    /** 追踪止损回调率（%，0.1 ~ 5） */
    readonly trailingStopRate?: number;
    /** 客户端订单 ID */
    readonly clientOrderId?: string;
    /** 是否只减仓 */
    readonly reduceOnly?: boolean;
}

// =========================================================================
// 订单响应
// =========================================================================

/** 合约订单详情（后端 → 前端） */
export interface FuturesOrder {
    /** 本地订单 ID */
    readonly id: string;
    /** 交易所侧订单 ID */
    readonly exchangeOrderId: string;
    /** 交易所标识 */
    readonly exchangeId: string;
    /** 交易对 */
    readonly symbol: string;
    /** 合约品种类型 */
    readonly contractType: ContractType;
    /** 买卖方向 */
    readonly side: OrderSide;
    /** 持仓方向 */
    readonly positionSide: PositionSide;
    /** 订单类型 */
    readonly orderType: FuturesOrderType;
    /** 下单数量 */
    readonly amount: number;
    /** 已成交数量 */
    readonly filledAmount: number;
    /** 下单价格 */
    readonly price: number;
    /** 平均成交价格 */
    readonly averagePrice: number;
    /** 手续费 */
    readonly fee: number;
    /** 手续费币种 */
    readonly feeCurrency: string;
    /** 杠杆倍数 */
    readonly leverage: number;
    /** 保证金模式 */
    readonly marginMode: MarginMode;
    /** 订单状态 */
    readonly status: OrderStatus;
    /** 触发价格 */
    readonly triggerPrice?: number;
    /** 止盈价格 */
    readonly takeProfitPrice?: number;
    /** 止损价格 */
    readonly stopLossPrice?: number;
    /** 创建时间 */
    readonly createdAt: string;
    /** 最后更新时间 */
    readonly updatedAt: string;
}

// =========================================================================
// 合约持仓
// =========================================================================

/** 合约持仓详情 */
export interface FuturesPosition {
    /** 持仓 ID */
    readonly positionId: string;
    /** 交易所标识 */
    readonly exchangeId: string;
    /** 交易对 */
    readonly symbol: string;
    /** 合约品种类型 */
    readonly contractType: ContractType;
    /** 持仓方向 */
    readonly positionSide: PositionSide;
    /** 持仓数量（正数=多头，负数=空头，取决于 positionSide） */
    readonly amount: number;
    /** 开仓均价 */
    readonly entryPrice: number;
    /** 标记价格（实时更新） */
    readonly markPrice: number;
    /** 强平价格（0 表示逐仓模式下暂未触及） */
    readonly liquidationPrice: number;
    /** 杠杆倍数 */
    readonly leverage: number;
    /** 保证金模式 */
    readonly marginMode: MarginMode;
    /** 持仓保证金 */
    readonly margin: number;
    /** 维持保证金 */
    readonly maintenanceMargin: number;
    /** 未实现盈亏（USDT） */
    readonly unrealizedPnl: number;
    /** 未实现盈亏百分比 */
    readonly unrealizedPnlPercent: number;
    /** 已实现盈亏（累计，USDT） */
    readonly realizedPnl: number;
    /** 止盈价格（已设置时有值） */
    readonly takeProfitPrice?: number;
    /** 止损价格（已设置时有值） */
    readonly stopLossPrice?: number;
    /** 最后更新时间 */
    readonly updatedAt: string;
}

// =========================================================================
// 资金费率
// =========================================================================

/** 资金费率信息 */
export interface FundingRate {
    /** 交易对 */
    readonly symbol: string;
    /** 当前资金费率（正数=多头支付空头） */
    readonly fundingRate: number;
    /** 预测下期资金费率 */
    readonly predictedRate: number;
    /** 下次结算时间（ISO 8601） */
    readonly nextFundingTime: string;
    /** 结算间隔（小时） */
    readonly fundingIntervalHours: number;
}

// =========================================================================
// 合约账户
// =========================================================================

/** 合约账户汇总 */
export interface FuturesAccountSummary {
    /** 交易所标识 */
    readonly exchangeId: string;
    /** 账户总权益（USDT） */
    readonly totalEquity: number;
    /** 可用保证金 */
    readonly availableMargin: number;
    /** 已用保证金 */
    readonly usedMargin: number;
    /** 维持保证金 */
    readonly maintenanceMargin: number;
    /** 保证金率（越低越危险） */
    readonly marginRatio: number;
    /** 总未实现盈亏 */
    readonly totalUnrealizedPnl: number;
    /** 快照时间 */
    readonly updatedAt: string;
}

// =========================================================================
// 页面交互状态
// =========================================================================

/** 合约下单表单状态 */
export interface FuturesOrderFormState {
    /** 买卖方向 */
    side: OrderSide;
    /** 持仓方向（双向持仓时） */
    positionSide: PositionSide;
    /** 订单类型 */
    orderType: FuturesOrderType;
    /** 价格输入 */
    priceInput: string;
    /** 数量输入 */
    amountInput: string;
    /** 触发价输入 */
    triggerPriceInput: string;
    /** 杠杆倍数 */
    leverage: number;
    /** 保证金模式 */
    marginMode: MarginMode;
    /** 止盈价输入 */
    takeProfitInput: string;
    /** 止损价输入 */
    stopLossInput: string;
    /** 金额滑块百分比（0-100） */
    percentSlider: number;
    /** 只减仓 */
    reduceOnly: boolean;
    /** 提交中 */
    isSubmitting: boolean;
}

/** 合约持仓筛选条件 */
export interface FuturesPositionFilter {
    /** 交易对筛选 */
    symbol?: string;
    /** 持仓方向筛选 */
    positionSide?: PositionSide | 'all';
    /** 是否只显示有持仓（amount > 0） */
    hideEmpty: boolean;
}

/** 合约订单筛选条件 */
export interface FuturesOrderFilter {
    /** 订单状态筛选 */
    status?: OrderStatus | 'all';
    /** 交易对筛选 */
    symbol?: string;
    /** 买卖方向筛选 */
    side?: OrderSide | 'all';
    /** 合约类型 */
    contractType?: ContractType | 'all';
    /** 时间范围（天数） */
    dayRange: number;
}

// =========================================================================
// 合约综合信号体系（核心信号区）
// =========================================================================

/**
 * 合约信号强度等级（百分比区间）：
 *
 *   极强多头    80-100%   趋势延续，强势加仓
 *   强烈多头    60-80%    上涨趋势，做多为主
 *   中性偏多    50-60%    轻仓做多 / 观察
 *   中性        40-50%    震荡区间，观望
 *   中性偏空    30-40%    轻仓做空 / 观察
 *   强烈空头    20-30%    下跌趋势，做空为主
 *   极强空头    0-20%     趋势崩塌，强势做空
 */
export type FuturesSignalLevel =
    | 'extreme_long'    // 80-100%
    | 'strong_long'     // 60-80%
    | 'neutral_long'    // 50-60%
    | 'neutral'         // 40-50%
    | 'neutral_short'   // 30-40%
    | 'strong_short'    // 20-30%
    | 'extreme_short';  // 0-20%

/** 合约信号方向 */
export type FuturesSignalDirection = 'long' | 'short' | 'neutral';

/** 合约信号等级配置 */
export interface FuturesSignalLevelConfig {
    readonly level: FuturesSignalLevel;
    readonly label: string;
    readonly range: [number, number];
    readonly color: string;
    readonly bgColor: string;
    readonly direction: FuturesSignalDirection;
    readonly description: string;
}

// ── 合约信号维度得分 ──────────────────────────────────────────

/**
 * 技术指标维度（合约）
 * 【核心信号区 — 后期维护者请在此调整涉及的指标】
 */
export interface FuturesTechDimensionScore {
    /** 综合得分 0-100 */
    readonly score: number;
    /** 趋势方向 */
    readonly trendDirection: 'up' | 'down' | 'sideways';
    /** 趋势强度 (0-100) */
    readonly trendStrength: number;
    /** 形态识别结果 */
    readonly patternDetected: string | null;
    /** 支撑位列表 */
    readonly supportLevels: number[];
    /** 阻力位列表 */
    readonly resistanceLevels: number[];
    /** 关键技术指标快照 (指标名 → 数值) */
    readonly indicators: Record<string, number>;
    /** 主要做多信号 */
    readonly longSignals: string[];
    /** 主要做空信号 */
    readonly shortSignals: string[];
}

/**
 * 链上数据维度（合约）
 * 【核心信号区 — 后期维护者请在此调整涉及的指标】
 */
export interface FuturesOnchainDimensionScore {
    /** 综合得分 0-100 */
    readonly score: number;
    /** 交易所净流入/流出 (BTC) */
    readonly exchangeNetFlow: number;
    readonly exchangeFlowDirection: 'inflow' | 'outflow' | 'neutral';
    /** 巨鲸动向 */
    readonly whaleActivity: string;
    /** 巨鲸增减持数量 */
    readonly whaleAccumulatingCount: number;
    /** UTXO 长期持有者占比 (%) */
    readonly utxoLongTermHolderPct: number;
}

/**
 * 资金费率维度（合约特有）
 * 【核心信号区 — 后期维护者请在此调整涉及的指标】
 */
export interface FuturesFundingDimensionScore {
    /** 综合得分 0-100 */
    readonly score: number;
    /** 当前资金费率 */
    readonly currentFundingRate: number;
    /** 资金费率趋势 */
    readonly fundingRateTrend: 'rising' | 'falling' | 'stable';
    /** 持仓量 (USD) */
    readonly openInterest: number;
    /** 持仓量变化 (%) */
    readonly oiChange24h: number;
    /** 持仓量 + 价格联动判断 */
    readonly oiPriceSignal: string;
    /** 多空比 */
    readonly longShortRatio: number;
    /** 爆仓数据 — 24h多头爆仓 (USD) */
    readonly longLiquidation24h: number;
    /** 爆仓数据 — 24h空头爆仓 (USD) */
    readonly shortLiquidation24h: number;
    /** 清算热力图关键区间 */
    readonly liquidationClusters: Array<{ price: number; amount: number; side: 'long' | 'short' }>;
}

/**
 * 市场情绪维度（合约）
 * 【核心信号区 — 后期维护者请在此调整涉及的指标】
 */
export interface FuturesSentimentDimensionScore {
    /** 综合得分 0-100 */
    readonly score: number;
    /** 恐惧贪婪指数 (0-100) */
    readonly fearGreedIndex: number;
    readonly fearGreedLabel: string;
    /** 社交媒体情绪 (-1 ~ 1) */
    readonly socialSentiment: number;
    /** 宏观新闻摘要 */
    readonly macroNewsSummary: string;
    /** DXY 美元指数 */
    readonly dxy: number;
    /** 纳斯达克变化 (%) */
    readonly nasdaqChange: number;
}

// ── 市场微观结构 ──────────────────────────────────────────────

/**
 * 市场微观结构数据（合约特有）
 * 肉眼与交易所界面无法直接获取的数据
 * 【核心信号区 — 后期维护者请在此调整涉及的指标】
 */
export interface MarketMicrostructure {
    /** 买方挂单墙 (价格 → 数量) */
    readonly buyWalls: Array<{ price: number; size: number }>;
    /** 卖方挂单墙 (价格 → 数量) */
    readonly sellWalls: Array<{ price: number; size: number }>;
    /** 大额主动买入量 (USD) */
    readonly aggressiveBuyVolume: number;
    /** 大额主动卖出量 (USD) */
    readonly aggressiveSellVolume: number;
    /** 清算热力图 */
    readonly liquidationMap: Array<{ price: number; liquidationAmount: number; side: 'long' | 'short' }>;
}

// ── 合约综合信号推送记录 ──────────────────────────────────────

/** 合约参考价位 */
export interface FuturesReferencePrices {
    /** 入场价位（做多） */
    readonly longEntryZone: [number, number];
    /** 入场价位（做空） */
    readonly shortEntryZone: [number, number];
    /** 做多止损 */
    readonly longStopLoss: number;
    /** 做空止损 */
    readonly shortStopLoss: number;
    /** 做多目标 */
    readonly longTarget: number;
    /** 做空目标 */
    readonly shortTarget: number;
}

/** 合约核心信号推送记录（完整数据结构） */
export interface FuturesSignalRecord {
    /** 信号 ID */
    readonly id: string;
    /** 交易对 */
    readonly symbol: string;
    /** 当前价格 */
    readonly currentPrice: number;
    /** 信号方向 */
    readonly signalDirection: FuturesSignalDirection;
    /** 信号等级 */
    readonly signalLevel: FuturesSignalLevel;
    /** 信号等级标签 (如 "强烈多头") */
    readonly signalLevelLabel: string;
    /** 综合评分 (0-100) */
    readonly compositeScore: number;
    /** 信号强度 (如 "72%") */
    readonly signalStrength: string;
    /** 置信度 (0-100) */
    readonly confidence: number;
    /** 建议操作（文字描述） */
    readonly recommendation: string;

    // ── 四大维度得分 ──
    readonly technical: FuturesTechDimensionScore;
    readonly onchain: FuturesOnchainDimensionScore;
    readonly funding: FuturesFundingDimensionScore;
    readonly sentiment: FuturesSentimentDimensionScore;

    // ── 辅助数据 ──
    readonly microstructure: MarketMicrostructure | null;
    readonly referencePrices: FuturesReferencePrices;
    readonly signalAccuracy: { readonly accuracy7d: number; readonly accuracy30d: number };

    /** 生成时间 */
    readonly generatedAt: string;
}
