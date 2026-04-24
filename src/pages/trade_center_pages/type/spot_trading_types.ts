/**
 * Spot trade type definitions(Spot Trading Types)
 * Define all Typescript types needed for spot trading page:
 * 1. Order related: order request, order response, order status enum
 * 2. Position/Asset: spot balance, account snapshot
 * 3. Symbol pairs information: spot trading rules, precision
 * 4. Page status: component props, UI interaction state
 * Design principles:
 * 1. Strictly align with backend DTO(field names match for easy mapping)
 * 2. Use readonly for all properties
 * 3. Use string literal types for enums (LIMIT / MARKET / STOP_LIMIT)
 */

// order direction & type & status
// order direction
export type OrderSide = 'buy' | 'sell';
// spot order types
export type SpotOrderType = 'limit' | 'market' | 'stop_limit' | 'stop_market';
// order status
export type OrderStatus =
    | 'pending'          
    | 'open'             
    | 'partially_filled'
    | 'filled'
    | 'cancelled'      
    | 'expired'         
    | 'rejected';        


// order request
// spot order request (frontend → backend)
export interface SpotOrderRequest {
    readonly exchangeId: string;
    readonly symbol: string;
    readonly side: OrderSide;
    readonly orderType: SpotOrderType;
    readonly amount: number;
    readonly price?: number;
    // stop loss / take profit trigger price
    readonly triggerPrice?: number;
    readonly clientOrderId?: string;
}

// order response
// spot order details(backend → frontend)
export interface SpotOrder {
    // order id
    readonly id: string;
    readonly exchangeOrderId: string;
    readonly exchangeId: string;
    readonly symbol: string;
    // trade direction(order direction)
    readonly side: OrderSide;
    readonly orderType: SpotOrderType;
    readonly amount: number;
    readonly filledAmount: number;
    readonly price: number;
    readonly averagePrice: number;
    readonly fee: number;
    readonly feeCurrency: string;
    // order status
    readonly status: OrderStatus;
    // trigger price of stop loss and take profit
    readonly triggerPrice?: number;
    readonly createdAt: string;
    readonly updatedAt: string;
}

// asset / balance
// single symbol balance
export interface SpotBalance {
    readonly currency: string;
    // available balance
    readonly available: number;
    // frozen asset for orders
    readonly frozen: number;
    // total asset
    readonly total: number;
    readonly usdtValue: number;
}

// sum of spot account asset
export interface SpotAccountSummary {
    readonly exchangeId: string;
    readonly totalUsdtValue: number;
    readonly balances: SpotBalance[];
    readonly updatedAt: string;
}


// symbol information
// symbol rules(precision & limits)
export interface SpotSymbolInfo {
    readonly symbol: string;
    readonly baseCurrency: string;
    readonly quoteCurrency: string;
    readonly pricePrecision: number;
    readonly amountPrecision: number;
    readonly minAmount: number;
    readonly maxAmount: number;
    // min order value
    readonly minNotional: number;
    readonly tradingEnabled: boolean;
}

// =========================================================================
// 页面交互状态
// =========================================================================

/** 现货下单表单状态 */
export interface SpotOrderFormState {
    /** 买卖方向 */
    side: OrderSide;
    /** 订单类型 */
    orderType: SpotOrderType;
    /** 价格输入（字符串，便于小数输入） */
    priceInput: string;
    /** 数量输入 */
    amountInput: string;
    /** 触发价输入（止损/止盈） */
    triggerPriceInput: string;
    /** 金额滑块百分比（0-100） */
    percentSlider: number;
    /** 提交中 */
    isSubmitting: boolean;
}

/** 现货订单筛选条件 */
export interface SpotOrderFilter {
    /** 订单状态筛选 */
    status?: OrderStatus | 'all';
    /** 交易对筛选 */
    symbol?: string;
    /** 买卖方向筛选 */
    side?: OrderSide | 'all';
    /** 时间范围（天数，0 表示全部） */
    dayRange: number;
}

/** 成交记录（逐笔成交） */
export interface SpotTradeRecord {
    /** 成交 ID */
    readonly tradeId: string;
    /** 关联订单 ID */
    readonly orderId: string;
    /** 交易对 */
    readonly symbol: string;
    /** 买卖方向 */
    readonly side: OrderSide;
    /** 成交价格 */
    readonly price: number;
    /** 成交数量 */
    readonly amount: number;
    /** 手续费 */
    readonly fee: number;
    /** 手续费币种 */
    readonly feeCurrency: string;
    /** 成交时间 */
    readonly timestamp: string;
}

// =========================================================================
// 核心信号区（Core Signal Zone）— 现货综合信号推送
// =========================================================================

/**
 * 信号等级（由评分区间映射）
 *
 *   极强买入    85-100%   底部区域，重仓
 *   强烈买入    70-85%    上涨趋势，加仓
 *   定投建仓    55-70%    定投分批建仓
 *   观望        45-55%    震荡持币不动
 *   部分止盈    30-45%    获利分批减仓
 *   卖出减仓    15-30%    下跌趋势，减仓
 *   强烈卖出    0-15%     顶部区域，清仓
 */
export type CoreSignalLevel =
    | 'extreme_buy'    // 85-100%
    | 'strong_buy'     // 70-85%
    | 'dca_build'      // 55-70%
    | 'hold'           // 45-55%
    | 'partial_tp'     // 30-45%
    | 'sell_reduce'    // 15-30%
    | 'strong_sell';   // 0-15%

/** 核心信号等级配置 */
export interface CoreSignalLevelConfig {
    readonly level: CoreSignalLevel;
    readonly label: string;
    readonly range: [number, number];
    readonly color: string;
    readonly bgColor: string;
    readonly description: string;
}

// ── 链上数据维度 ──────────────────────────────────────────────

/** 交易所资金流向 */
export type ExchangeFlowDirection = 'net_inflow' | 'net_outflow' | 'neutral';

/** 巨鲸动向 */
export type WhaleAction = 'accumulating' | 'distributing' | 'dormant' | 'unknown';

/** 链上数据维度得分 */
export interface OnchainDimensionScore {
    /** 综合得分 0-100 */
    readonly score: number;
    /** MVRV 比率 */
    readonly mvrv: number;
    /** MVRV 状态描述 */
    readonly mvrvStatus: string;
    /** 交易所资金流向 */
    readonly exchangeFlowDirection: ExchangeFlowDirection;
    /** 交易所净流入/流出量 (BTC) */
    readonly exchangeFlowAmount: number;
    /** 交易所余额趋势 */
    readonly exchangeBalanceTrend: string;
    /** 巨鲸动向 */
    readonly whaleAction: WhaleAction;
    /** 增持巨鲸地址数 */
    readonly whaleAccumulatingCount: number;
    /** SOPR 指标 */
    readonly sopr: number;
    /** SOPR 状态描述 */
    readonly soprStatus: string;
    /** 活跃地址数 */
    readonly activeAddresses: number;
    /** 活跃地址数变化率 (%) */
    readonly activeAddressesChange: number;
    /** 矿工余额变化 (BTC) */
    readonly minerBalanceChange: number;
    /** UTXO 长期持有者占比 (%) */
    readonly utxoLongTermHolderPct: number;
}

// ── 技术指标维度 ──────────────────────────────────────────────

/** 趋势状态 */
export type TrendStatus = 'strong_up' | 'up' | 'sideways' | 'down' | 'strong_down';

/** 成交量状态 */
export type VolumeStatus = 'heavy' | 'above_avg' | 'average' | 'below_avg' | 'light';

/** 技术指标维度得分 */
export interface TechnicalDimensionScore {
    /** 综合得分 0-100 */
    readonly score: number;
    /** 趋势状态 */
    readonly trend: TrendStatus;
    /** 成交量状态 */
    readonly volumeStatus: VolumeStatus;
    /** 关键指标快照 (指标名 → 数值) */
    readonly indicators: Record<string, number>;
    /** 主要买入信号列表 */
    readonly buySignals: string[];
    /** 主要卖出信号列表 */
    readonly sellSignals: string[];
}

// ── 宏观经济维度 ──────────────────────────────────────────────

/** 宏观经济维度得分 */
export interface MacroDimensionScore {
    /** 综合得分 0-100 */
    readonly score: number;
    /** 美元指数 DXY */
    readonly dxy: number;
    /** DXY 变化率 (%) */
    readonly dxyChange: number;
    /** 纳斯达克指数变化 (%) */
    readonly nasdaqChange: number;
    /** 黄金价格 (USD) */
    readonly goldPrice: number;
    /** 黄金变化率 (%) */
    readonly goldChange: number;
    /** 美联储利率 (%) */
    readonly fedRate: number;
    /** 下次利率决议日期 */
    readonly nextFedMeeting: string | null;
    /** VIX 恐慌指数 */
    readonly vix: number;
}

// ── 市场情绪维度 ──────────────────────────────────────────────

/** 市场情绪维度得分 */
export interface SentimentDimensionScore {
    /** 综合得分 0-100 */
    readonly score: number;
    /** 恐惧贪婪指数 (0-100) */
    readonly fearGreedIndex: number;
    /** 恐惧贪婪标签 */
    readonly fearGreedLabel: string;
    /** 社交媒体情绪 (-1 ~ 1) */
    readonly socialSentiment: number;
    /** Google Trends 搜索热度 */
    readonly searchTrend: number;
    /** ETF 7天净流入 (USD) */
    readonly etfNetFlow7d: number;
    /** 机构持仓变化摘要 */
    readonly institutionalActivity: string;
}

// ── 新闻事件维度 ──────────────────────────────────────────────

/** 新闻影响等级 */
export type NewsImpactLevel = 'positive' | 'neutral' | 'negative' | 'critical';

/** 关键新闻摘要 */
export interface KeyNewsItem {
    readonly title: string;
    readonly impact: NewsImpactLevel;
    readonly source: string;
    readonly timestamp: string;
}

// ── 综合信号推送 ──────────────────────────────────────────────

/** 建仓建议（按风险偏好） */
export interface PositionSizeSuggestion {
    readonly conservative: string;
    readonly moderate: string;
    readonly aggressive: string;
}

/** 参考价位 */
export interface ReferencePriceLevels {
    readonly buyZoneLow: number;
    readonly buyZoneHigh: number;
    readonly stopLoss: number;
    readonly targetPrice: number;
}

/** 历史准确率 */
export interface SignalAccuracy {
    readonly accuracy7d: number;
    readonly accuracy30d: number;
}

/** 定投建议 */
export interface DcaSuggestion {
    readonly weeklyAmount: string;
    readonly timing: string;
    readonly note: string;
}

/** 核心信号推送记录（完整数据结构） */
export interface CoreSignalRecord {
    /** 信号 ID */
    readonly id: string;
    /** 交易对 */
    readonly symbol: string;
    /** 当前价格 */
    readonly currentPrice: number;
    /** 24h 涨跌幅 (%) */
    readonly change24h: number;
    /** 信号等级 */
    readonly signalLevel: CoreSignalLevel;
    /** 信号等级标签 (如 "强烈买入") */
    readonly signalLevelLabel: string;
    /** 综合评分 (0-100) */
    readonly compositeScore: number;
    /** 信号强度 (如 "78%") */
    readonly signalStrength: string;
    /** 置信度 (0-100) */
    readonly confidence: number;
    /** 操作建议（文字描述） */
    readonly recommendation: string;

    // ── 四大维度得分 ──
    readonly onchain: OnchainDimensionScore;
    readonly technical: TechnicalDimensionScore;
    readonly macro: MacroDimensionScore;
    readonly sentiment: SentimentDimensionScore;

    // ── 辅助信息 ──
    readonly referencePrices: ReferencePriceLevels;
    readonly positionSize: PositionSizeSuggestion;
    readonly signalAccuracy: SignalAccuracy;
    readonly dcaSuggestion: DcaSuggestion | null;
    readonly keyNews: KeyNewsItem[];

    /** 生成时间 */
    readonly generatedAt: string;
}

// ── 市场快讯（滚动推送） ──────────────────────────────────────

/** 市场快讯条目 */
export interface MarketFlashNews {
    readonly id: string;
    readonly content: string;
    readonly source: string;
    readonly importance: 'low' | 'medium' | 'high' | 'critical';
    readonly timestamp: string;
}

// ── K 线标注 ──────────────────────────────────────────────────

/** 画线类型 */
export type DrawingLineType = 'trend' | 'horizontal' | 'ray' | 'segment';

/** 画线数据 */
export interface KlineDrawing {
    readonly id: string;
    readonly type: DrawingLineType;
    readonly color: string;
    readonly startTime: number;
    readonly startPrice: number;
    readonly endTime?: number;
    readonly endPrice?: number;
}

/** 标注数据 */
export interface KlineAnnotation {
    readonly id: string;
    readonly time: number;
    readonly price: number;
    readonly title: string;
    readonly content: string;
    readonly color: string;
    readonly collapsed: boolean;
}
