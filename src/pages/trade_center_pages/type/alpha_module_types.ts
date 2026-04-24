/**
 * Alpha 模块共享类型定义
 *
 * 涵盖信号分析、回测、策略管理、盈亏分析、对冲交易、山寨币持仓、新币监控等模块的
 * 前端类型定义。所有类型均与后端 DTO / 领域模型对齐。
 *
 * ─── 模块划分 ─────────────────────────────────────────────────
 *  1. 信号（Signal）            — 信号评分、方向、状态
 *  2. 回测（Backtesting）       — 回测配置、结果、权益曲线
 *  3. 策略（Strategy）          — 策略配置、执行日志
 *  4. 盈亏（PnL）              — 盈亏记录、统计报告
 *  5. 对冲（Hedge）            — 对冲组合、相关性矩阵
 *  6. 山寨币持仓（Altcoin）     — 持仓记录、组合汇总
 *  7. 新币监控（NewCoin）       — 新币信息、预警配置
 *  8. 市场情报（Market Intelligence）
 *  9. 投资研究（Investment Research）
 * 10. 交易员成长档案（Trader Growth Archive）
 * 11. 风险管理中枢（Risk Management Hub）
 * 12. AI 模型训练（AI Model Training）
 */

// =========================================================================
// 1. 信号模块（Signal）
// =========================================================================

/** 信号方向 */
export type SignalDirection = 'buy' | 'sell';

/** 信号状态（生命周期） */
export type SignalStatus = 'active' | 'triggered' | 'expired' | 'cancelled';

/** 信号强度等级 */
export type SignalStrengthLevel = 'weak' | 'moderate' | 'strong' | 'very_strong';

/** 单条信号记录 */
export interface SignalRecord {
    /** 信号 ID */
    id: string;
    /** 关联策略 ID */
    strategyId: string;
    /** 策略名称（冗余展示用） */
    strategyName: string;
    /** 交易对 */
    symbol: string;
    /** 交易所 */
    exchangeId: string;
    /** 信号方向 */
    direction: SignalDirection;
    /** 评分（0-100） */
    score: number;
    /** 强度等级 */
    strengthLevel: SignalStrengthLevel;
    /** 信号状态 */
    status: SignalStatus;
    /** 建议入场价 */
    suggestedEntryPrice: number | null;
    /** 建议止损价 */
    suggestedStopLoss: number | null;
    /** 建议止盈价 */
    suggestedTakeProfit: number | null;
    /** AI 解释摘要（若已生成） */
    aiExplanation: string | null;
    /** 指标快照 */
    indicatorSnapshot: Record<string, number>;
    /** 评分明细 */
    scoreBreakdown: ScoreBreakdownItem[];
    /** 产生时间 */
    createdAt: string;
    /** 过期时间 */
    expiresAt: string | null;
}

/** 评分明细条目 */
export interface ScoreBreakdownItem {
    /** 指标名称 */
    indicator: string;
    /** 得分 */
    score: number;
    /** 权重 */
    weight: number;
    /** 信号方向贡献 */
    direction: SignalDirection;
}

/** 信号筛选参数 */
export interface SignalFilter {
    symbol?: string;
    direction?: SignalDirection;
    status?: SignalStatus;
    minScore?: number;
    strategyId?: string;
}

// ─── 信号维度与调优系统 ────────────────────────────────────────────

/** 信号适用市场 */
export type SignalMarketType = 'spot' | 'futures';

/** 信号维度分类 */
export type SignalDimensionCategory =
    | 'technical'           // 技术指标
    | 'onchain'             // 链上数据
    | 'macro'               // 宏观经济
    | 'sentiment'           // 市场情绪
    | 'news'                // 新闻事件
    | 'pattern'             // 形态识别 (合约)
    | 'support_resistance'  // 支撑位与阻力位 (合约)
    | 'microstructure'      // 市场微观结构 (合约)
    | 'funding'             // 资金费率 (合约)
    | 'open_interest'       // 持仓量 (合约)
    | 'liquidation';        // 爆仓 (合约)

/** 信号维度中的单个指标 */
export interface SignalIndicatorItem {
    id: string;
    name: string;
    nameEn?: string;
    category: SignalDimensionCategory;
    /** 适用市场 */
    markets: SignalMarketType[];
    /** 当前状态 */
    status: 'production' | 'testing' | 'candidate' | 'disabled';
    /** 当前权重 (0-1) */
    weight: number;
    /** 方向贡献：1=看多，-1=看空，0=中性 */
    currentSignal: number;
    /** 当前评分 (0-100) */
    currentScore: number;
    /** 准确率（回测得出） */
    accuracy?: number;
    /** 胜率（回测得出） */
    winRate?: number;
    /** 夏普比率（回测得出） */
    sharpeRatio?: number;
    /** 最大回撤（回测得出） */
    maxDrawdown?: number;
    /** 数据源 */
    dataSource?: string;
    /** 更新频率描述 */
    updateFrequency?: string;
    /** 最近一次更新时间 */
    lastUpdated?: string;
    /** 简要描述 */
    description?: string;
}

/** 信号维度汇总（一个完整维度） */
export interface SignalDimensionSummary {
    category: SignalDimensionCategory;
    label: string;
    icon: string;
    /** 维度内指标数量 */
    totalIndicators: number;
    /** 正在使用中的指标数量 */
    activeIndicators: number;
    /** 维度综合得分 */
    compositeScore: number;
    /** 维度方向 */
    compositeDirection: 'bullish' | 'bearish' | 'neutral';
    /** 维度权重 */
    weight: number;
}

/** 综合信号结果 */
export interface CompositeSignalResult {
    market: SignalMarketType;
    symbol: string;
    /** 综合评分 (0-100) */
    compositeScore: number;
    /** 综合方向 */
    direction: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
    /** 7 级信号标签 */
    signalLevel: string;
    /** 各维度摘要 */
    dimensions: SignalDimensionSummary[];
    /** 维度间一致性 (0-1，越高越一致) */
    dimensionAgreement: number;
    /** AI 综合解读 */
    aiSummary?: string;
    /** 更新时间 */
    updatedAt: string;
}

/** 信号测试记录 */
export interface SignalTestRecord {
    id: string;
    /** 被测信号指标 ID */
    indicatorId: string;
    indicatorName: string;
    category: SignalDimensionCategory;
    market: SignalMarketType;
    /** 测试状态 */
    status: 'running' | 'completed' | 'failed';
    /** 测试周期 */
    testPeriod: string;
    /** 测试结果 */
    accuracy?: number;
    winRate?: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
    totalSignals?: number;
    /** 是否推荐加入生产 */
    recommended?: boolean;
    /** 开始时间 */
    startedAt: string;
    /** 完成时间 */
    completedAt?: string;
}

/** 信号调优管线状态 */
export interface SignalPipelineStatus {
    market: SignalMarketType;
    productionCount: number;
    testingCount: number;
    candidateCount: number;
    disabledCount: number;
    lastPromotedAt?: string;
    lastTestRunAt?: string;
}

// =========================================================================
// 2. 回测模块（Backtesting）
// =========================================================================

/** 回测时间范围 */
export type BacktestTimeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

/** 回测状态 */
export type BacktestStatus = 'pending' | 'running' | 'completed' | 'failed';

/** 回测配置请求 */
export interface BacktestConfigRequest {
    /** 策略 ID */
    strategyId: string;
    /** 交易对 */
    symbol: string;
    /** 交易所 */
    exchangeId: string;
    /** K 线周期 */
    timeframe: BacktestTimeframe;
    /** 起始日期（ISO） */
    startDate: string;
    /** 结束日期（ISO） */
    endDate: string;
    /** 初始资金 */
    initialCapital: number;
    /** 手续费率（如 0.001 = 0.1%） */
    feeRate: number;
    /** 滑点率 */
    slippageRate: number;
}

/** 回测结果 */
export interface BacktestResult {
    /** 回测 ID */
    id: string;
    /** 回测配置 */
    config: BacktestConfigRequest;
    /** 状态 */
    status: BacktestStatus;
    /** 统计指标 */
    statistics: BacktestStatistics | null;
    /** 权益曲线数据点 */
    equityCurve: EquityCurvePoint[];
    /** 交易记录 */
    trades: BacktestTrade[];
    /** 创建时间 */
    createdAt: string;
    /** 完成时间 */
    completedAt: string | null;
    /** 错误信息（失败时） */
    errorMessage: string | null;
}

/** 回测统计指标 */
export interface BacktestStatistics {
    /** 总收益率 (%) */
    totalReturnPct: number;
    /** 年化收益率 (%) */
    annualizedReturnPct: number;
    /** 最大回撤 (%) */
    maxDrawdownPct: number;
    /** 夏普比率 */
    sharpeRatio: number;
    /** Sortino 比率 */
    sortinoRatio: number;
    /** 胜率 (%) */
    winRatePct: number;
    /** 盈亏比 */
    profitFactor: number;
    /** 总交易次数 */
    totalTrades: number;
    /** 盈利次数 */
    winningTrades: number;
    /** 亏损次数 */
    losingTrades: number;
    /** 平均盈利 */
    avgWin: number;
    /** 平均亏损 */
    avgLoss: number;
    /** 最大连续盈利次数 */
    maxConsecutiveWins: number;
    /** 最大连续亏损次数 */
    maxConsecutiveLosses: number;
    /** 最终净值 */
    finalEquity: number;
}

/** 权益曲线数据点 */
export interface EquityCurvePoint {
    /** 时间戳 */
    timestamp: string;
    /** 净值 */
    equity: number;
    /** 回撤比例 */
    drawdownPct: number;
}

/** 回测交易记录 */
export interface BacktestTrade {
    /** 方向 */
    side: 'buy' | 'sell';
    /** 入场时间 */
    entryTime: string;
    /** 入场价 */
    entryPrice: number;
    /** 出场时间 */
    exitTime: string | null;
    /** 出场价 */
    exitPrice: number | null;
    /** 数量 */
    amount: number;
    /** 盈亏 */
    pnl: number | null;
    /** 盈亏比例 (%) */
    pnlPct: number | null;
}

// ─── 信号回测报告（现货+合约统一报告）─────────────────────────────

/** 信号历史数据库文件条目 */
export interface SignalArchiveFile {
    /** 季度标识 e.g. '2025-Q1' */
    quarter: string;
    /** 市场 */
    market: 'spot' | 'futures';
    /** 信号数量 */
    signalCount: number;
    /** 文件大小描述 */
    fileSize: string;
    /** 时间区间 */
    dateRange: string;
}

/** 按强度分类的信号统计 */
export interface SignalStrengthStat {
    level: string;
    accuracy: number;
    count: number;
}

/** 按周期分类的信号统计 */
export interface SignalPeriodStat {
    period: string;
    accuracy: number;
    avgReturn: number;
}

/** 最佳/最差信号 */
export interface SignalExtremeRecord {
    date: string;
    returnPct: number;
    strength: string;
    symbol: string;
}

/** 现货+合约统一回测报告 */
export interface UnifiedSignalBacktestReport {
    /** 回测时间范围描述 */
    dateRange: string;
    /** 生成时间 */
    generatedAt: string;
    /** 回测状态 */
    status: 'pending' | 'running' | 'completed' | 'failed';

    // ── 总体表现 ─────────────
    spotTotalSignals: number;
    contractTotalSignals: number;
    spotAccuracy: number;
    contractAccuracy: number;
    spotTotalReturn: number;
    contractTotalReturn: number;
    spotSharpeRatio: number;
    contractSharpeRatio: number;
    spotMaxDrawdown: number;
    contractMaxDrawdown: number;

    // ── 按强度分类 ───────────
    spotStrengthStats: SignalStrengthStat[];
    contractStrengthStats: SignalStrengthStat[];

    // ── 按周期分类 ───────────
    spotPeriodStats: SignalPeriodStat[];
    contractPeriodStats: SignalPeriodStat[];

    // ── 最佳/最差 ────────────
    spotBest: SignalExtremeRecord;
    spotWorst: SignalExtremeRecord;
    contractBest: SignalExtremeRecord;
    contractWorst: SignalExtremeRecord;

    // ── 优化建议 ─────────────
    improvementSuggestions: string[];
}

// =========================================================================
// 3. 策略模块（Strategy）
// =========================================================================

/** 策略状态 */
export type StrategyStatus = 'active' | 'paused' | 'stopped' | 'error';

/** 执行模式 */
export type ExecutionMode = 'live' | 'dry_run';

/** 策略市场类型 */
export type StrategyMarketType = 'spot' | 'futures';

/** 策略记录 */
export interface StrategyRecord {
    /** 策略 ID */
    id: string;
    /** 策略名称 */
    name: string;
    /** 策略描述 */
    description: string;
    /** 策略状态 */
    status: StrategyStatus;
    /** 市场类型（现货/合约） */
    marketType: StrategyMarketType;
    /** 交易对列表 */
    symbols: string[];
    /** 交易所 */
    exchangeId: string;
    /** 执行模式 */
    executionMode: ExecutionMode;
    /** 调度间隔（分钟） */
    intervalMinutes: number;
    /** 最近一次执行时间 */
    lastExecutedAt: string | null;
    /** 最近一次信号评分 */
    lastSignalScore: number | null;
    /** 总执行次数 */
    totalExecutions: number;
    /** 成功次数 */
    successfulExecutions: number;
    /** 累计盈亏（USDT） */
    totalPnl: number;
    /** 杠杆倍数（合约专用） */
    leverage: number | null;
    /** 创建时间 */
    createdAt: string;
}

/** 策略执行日志 */
export interface StrategyExecutionLog {
    /** 日志 ID */
    id: string;
    /** 策略 ID */
    strategyId: string;
    /** 执行状态 */
    status: 'success' | 'failed' | 'skipped' | 'risk_rejected';
    /** 信号评分 */
    signalScore: number | null;
    /** 信号方向 */
    signalDirection: SignalDirection | null;
    /** 生成的订单 ID */
    orderId: string | null;
    /** 风控拒绝原因 */
    riskRejectionReason: string | null;
    /** 耗时（毫秒） */
    durationMs: number;
    /** 执行时间 */
    executedAt: string;
}

/** 创建/更新策略请求 */
export interface StrategyConfigRequest {
    /** 策略名称 */
    name: string;
    /** 描述 */
    description: string;
    /** 市场类型 */
    marketType: StrategyMarketType;
    /** 交易对 */
    symbols: string[];
    /** 交易所 */
    exchangeId: string;
    /** 执行模式 */
    executionMode: ExecutionMode;
    /** 调度间隔 */
    intervalMinutes: number;
    /** 杠杆倍数（合约专用） */
    leverage?: number;
}

// =========================================================================
// 4. 盈亏分析模块（PnL）
// =========================================================================

/** 盈亏记录来源 */
export type PnlSource = 'spot' | 'futures' | 'hedge' | 'dca' | 'manual';

/** 单条盈亏记录 */
export interface PnlRecord {
    /** 记录 ID */
    id: string;
    /** 交易对 */
    symbol: string;
    /** 来源 */
    source: PnlSource;
    /** 方向 */
    side: 'buy' | 'sell';
    /** 入场价 */
    entryPrice: number;
    /** 出场价 */
    exitPrice: number;
    /** 数量 */
    amount: number;
    /** 已实现盈亏 */
    realizedPnl: number;
    /** 盈亏比例 (%) */
    pnlPct: number;
    /** 手续费 */
    fee: number;
    /** 关联策略 */
    strategyId: string | null;
    /** 策略名称 */
    strategyName: string | null;
    /** 创建时间 */
    createdAt: string;
}

/** 盈亏汇总报告 */
export interface PnlReport {
    /** 统计周期 */
    period: string;
    /** 总已实现盈亏 */
    totalRealizedPnl: number;
    /** 总收益率 (%) */
    totalReturnPct: number;
    /** 胜率 (%) */
    winRatePct: number;
    /** 盈利笔数 */
    winCount: number;
    /** 亏损笔数 */
    lossCount: number;
    /** 盈亏比 */
    profitFactor: number;
    /** 最大单笔盈利 */
    maxWin: number;
    /** 最大单笔亏损 */
    maxLoss: number;
    /** 最大回撤 (%) */
    maxDrawdownPct: number;
    /** 按来源分组 */
    bySource: Record<PnlSource, { pnl: number; count: number }>;
    /** 按交易对分组 */
    bySymbol: Record<string, { pnl: number; count: number }>;
    /** 月度盈亏 */
    monthlyPnl: MonthlyPnlPoint[];
}

/** 月度盈亏数据点 */
export interface MonthlyPnlPoint {
    /** 月份（YYYY-MM） */
    month: string;
    /** 盈亏金额 */
    pnl: number;
    /** 交易笔数 */
    tradeCount: number;
}

// =========================================================================
// 5. 对冲交易模块（Hedge）—— BTC/ETH 专注版
// =========================================================================

/** 对冲组合状态 */
export type HedgePairStatus = 'active' | 'paused' | 'closed';

/** 对冲策略类型 */
export type HedgeStrategyType = 'same_exchange_cross_asset' | 'cross_exchange_same_asset';

/** 对冲组合记录（单交易所异币种：BTC vs ETH） */
export interface HedgePairRecord {
    id: string;
    name: string;
    longSymbol: string;
    shortSymbol: string;
    exchange: string;
    exchangeId: string;
    status: HedgePairStatus;
    strategyType: HedgeStrategyType;
    hedgeRatio: number;
    longAmount: number;
    shortAmount: number;
    longLeverage: number;
    shortLeverage: number;
    totalPnl: number;
    pnlPct: number;
    currentCorrelation: number;
    /** 多头强平估算价 */
    longLiquidationPrice: number | null;
    /** 空头强平估算价 */
    shortLiquidationPrice: number | null;
    /** 多头保证金 */
    longMargin: number;
    /** 空头保证金 */
    shortMargin: number;
    createdAt: string;
    updatedAt: string;
}

// ── 5.1 相关性追踪 ──────────────────────────────────────────────

/** 相关性时间窗口 */
export type CorrelationTimeframe = '1h' | '4h' | '1d' | '7d' | '30d' | '90d';

/** 相关性追踪条目 */
export interface CorrelationEntry {
    symbolA: string;
    symbolB: string;
    /** 皮尔逊相关系数 (-1 ~ 1) */
    coefficient: number;
    /** 兼容旧字段别名 */
    correlation: number;
    /** P 值 */
    pValue: number;
    isSignificant: boolean;
    timeframe: CorrelationTimeframe;
    period: string;
}

/** 背离事件记录 */
export interface DivergenceEvent {
    id: string;
    /** 背离类型 */
    type: 'price_divergence' | 'momentum_divergence' | 'volume_divergence';
    /** 背离方向：BTC 领先 or ETH 领先 */
    leadAsset: 'BTC' | 'ETH';
    /** 背离幅度 (%) */
    magnitude: number;
    /** 延迟时间（分钟） */
    lagMinutes: number;
    /** 发生时间 */
    startedAt: string;
    /** 持续时长（分钟） */
    durationMinutes: number;
    /** 是否已回归 */
    resolved: boolean;
    /** AI 解释 */
    explanation: string;
}

/** 相关性追踪面板数据 */
export interface CorrelationTrackingData {
    /** 当前相关系数 */
    currentCorrelation: number;
    /** 各时间窗口相关系数 */
    correlationByTimeframe: Record<CorrelationTimeframe, number>;
    /** 相关性变化趋势（最近 24 个点，每点 1h） */
    correlationHistory: { time: string; value: number }[];
    /** BTC 价格序列（与 correlationHistory 对齐） */
    btcPriceHistory: { time: string; price: number; change: number }[];
    /** ETH 价格序列 */
    ethPriceHistory: { time: string; price: number; change: number }[];
    /** 近期背离事件 */
    recentDivergences: DivergenceEvent[];
    /** 当前是否处于背离状态 */
    isDiverging: boolean;
    /** 当前背离幅度 */
    divergenceMagnitude: number;
}

// ── 5.2 双币对冲仓位计算器 ──────────────────────────────────────

/** 对冲计算输入 */
export interface HedgeCalculatorInput {
    /** BTC 仓位方向 */
    btcSide: 'long' | 'short';
    /** ETH 仓位方向（与 BTC 相反） */
    ethSide: 'long' | 'short';
    btcAmount: number;
    ethAmount: number;
    btcLeverage: number;
    ethLeverage: number;
    btcEntryPrice: number;
    ethEntryPrice: number;
}

/** 对冲计算结果 */
export interface HedgeCalculatorResult {
    /** 组合净敞口 (USDT) */
    netExposure: number;
    /** BTC 仓位价值 */
    btcNotionalValue: number;
    /** ETH 仓位价值 */
    ethNotionalValue: number;
    /** BTC 保证金 */
    btcMarginRequired: number;
    /** ETH 保证金 */
    ethMarginRequired: number;
    /** 总保证金 */
    totalMarginRequired: number;
    /** BTC 强平价格 */
    btcLiquidationPrice: number;
    /** ETH 强平价格 */
    ethLiquidationPrice: number;
    /** 当前组合盈亏 */
    currentPnl: number;
    /** 组合盈亏率 */
    currentPnlPct: number;
    /** 推荐对冲比例（基于相关性与波动率） */
    recommendedHedgeRatio: number;
    /** 预估最大周期收益（基于历史回归统计） */
    estimatedCycleReturn: number;
    /** 预估回归周期（小时） */
    estimatedMeanReversionHours: number;
}

// ── 5.3 夜间行情监控 ─────────────────────────────────────────

/** 夜间监控时段 */
export interface NightSessionConfig {
    /** 开始时间 HH:mm（本地时区） */
    startTime: string;
    /** 结束时间 HH:mm */
    endTime: string;
    /** 价格波动告警阈值 (%) */
    priceAlertThreshold: number;
    /** 成交量激增告警阈值 (倍数) */
    volumeSpikeThreshold: number;
}

/** 夜间行情摘要 */
export interface NightSessionSummary {
    /** 监控时段 */
    period: string;
    /** BTC 夜间开盘价 */
    btcOpenPrice: number;
    /** BTC 夜间最高价 */
    btcHighPrice: number;
    /** BTC 夜间最低价 */
    btcLowPrice: number;
    /** BTC 夜间收盘价 */
    btcClosePrice: number;
    /** BTC 夜间涨跌幅 */
    btcChangePercent: number;
    /** ETH 同上 */
    ethOpenPrice: number;
    ethHighPrice: number;
    ethLowPrice: number;
    ethClosePrice: number;
    ethChangePercent: number;
    /** 夜间最大回撤 */
    maxDrawdown: number;
    /** 最大回撤资产 */
    maxDrawdownAsset: 'BTC' | 'ETH';
    /** 夜间重大事件 */
    events: NightMarketEvent[];
    /** 风险等级 */
    riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    /** AI 总结 */
    aiSummary: string;
}

/** 夜间市场事件 */
export interface NightMarketEvent {
    time: string;
    type: 'price_spike' | 'volume_spike' | 'liquidation_cascade' | 'funding_anomaly' | 'news';
    asset: 'BTC' | 'ETH' | 'both';
    description: string;
    severity: 'info' | 'warning' | 'critical';
}

// ── 5.4 强平价格对比器 ──────────────────────────────────────

/** 强平对比条目 */
export interface LiquidationComparisonEntry {
    symbol: string;
    side: 'long' | 'short';
    entryPrice: number;
    leverage: number;
    amount: number;
    liquidationPrice: number;
    /** 距强平距离 (%) */
    distancePercent: number;
    /** 风险等级 */
    riskLevel: 'safe' | 'warning' | 'danger';
}

// ── 5.5 跨交易所同币种对冲 ──────────────────────────────────

/** 跨交易所价差监控条目 */
export interface CrossExchangeSpread {
    symbol: string;
    exchangeA: string;
    exchangeB: string;
    priceA: number;
    priceB: number;
    /** 价差 (A - B) */
    spread: number;
    /** 价差比例 (%) */
    spreadPercent: number;
    /** 是否达到套利阈值 */
    isArbitrageable: boolean;
    /** 预估手续费 (含提币) */
    estimatedFees: number;
    /** 净套利利润 */
    netProfit: number;
    updatedAt: string;
}

/** 创建对冲组合请求（增强版） */
export interface CreateHedgePairRequest {
    name: string;
    longSymbol: string;
    shortSymbol: string;
    exchange: string;
    exchangeId: string;
    strategyType: HedgeStrategyType;
    hedgeRatio: number;
    longAmount: number;
    shortAmount: number;
    longLeverage: number;
    shortLeverage: number;
}

// =========================================================================
// 6. 山寨币持仓模块（Altcoin Position）—— 深度集成投研系统
// =========================================================================

/** 持仓状态 */
export type AltcoinPositionStatus = 'holding' | 'partially_sold' | 'closed';

/** 山寨币持仓记录（增强版，联动投研系统） */
export interface AltcoinPositionRecord {
    id: string;
    /** 交易对 */
    symbol: string;
    /** 币种名称 */
    coinName: string;
    /** 币种图标 URL */
    coinIconUrl: string;
    /** 交易所 */
    exchange: string;
    exchangeId: string;
    status: AltcoinPositionStatus;
    /** 买入均价 */
    avgEntryPrice: number;
    /** 持有数量 */
    quantity: number;
    /** 买入时间 */
    buyTime: string;
    /** 当前价格 */
    currentPrice: number;
    /** 24H 涨跌幅 (%) */
    change24h: number;
    /** 市值排名 */
    marketCapRank: number | null;
    /** 买入总额 (USDT) */
    totalCost: number;
    /** 持仓天数 */
    holdingDays: number;
    /** 当前市值 */
    currentValue: number;
    /** 浮动盈亏 (USDT) */
    unrealizedPnl: number;
    /** 浮动盈亏比例 (%) */
    pnlPct: number;
    /** 关联投研项目 ID（来自投资研究模块） */
    researchProjectId: string | null;
    /** 投研评分 */
    researchScore: number | null;
    /** 投研最新进展 */
    researchLatestUpdate: string | null;
    /** 备注 */
    note: string;
    /** 目标卖出价 */
    targetSellPrice: number | null;
    /** 止损价 */
    stopLossPrice: number | null;
    /** 卖出提醒价 */
    sellAlertPrice: number | null;
    createdAt: string;
    updatedAt: string;
}

/** 新增山寨币持仓请求 */
export interface AddAltcoinPositionRequest {
    symbol: string;
    coinName: string;
    exchange: string;
    exchangeId: string;
    avgEntryPrice: number;
    quantity: number;
    buyTime?: string;
    researchProjectId?: string;
    note?: string;
    targetSellPrice?: number;
    stopLossPrice?: number;
    sellAlertPrice?: number;
}

/** 持仓详情弹窗数据（点击"查看详情"加载） */
export interface AltcoinPositionDetail {
    position: AltcoinPositionRecord;
    /** K 线数据（标注买入成本线） */
    klineData: { time: string; open: number; high: number; low: number; close: number; volume: number }[];
    /** 买入成本线标记 */
    costLine: number;
    /** 项目信息（同步投研系统） */
    projectInfo: {
        score: number;
        category: string;
        chain: string;
        tvl: number | null;
        description: string;
        website: string | null;
        twitter: string | null;
    } | null;
    /** 相关新闻（同步市场信息监控） */
    relatedNews: { title: string; source: string; time: string; sentiment: 'positive' | 'negative' | 'neutral'; url: string }[];
    /** 链上数据变化 */
    onchainData: {
        holders: number;
        holdersChange7d: number;
        liquidity: number;
        liquidityChange7d: number;
        topHoldersPct: number;
        smartMoneyFlow: 'inflow' | 'outflow' | 'neutral';
    } | null;
    /** 项目进展时间线 */
    timeline: { date: string; event: string; type: 'milestone' | 'partnership' | 'release' | 'airdrop' | 'listing' | 'other' }[];
}

/** 持仓组合汇总 */
export interface AltcoinPortfolioSummary {
    totalPositions: number;
    holdingPositions: number;
    totalCost: number;
    totalValue: number;
    totalUnrealizedPnl: number;
    totalPnlPct: number;
    profitableCount: number;
    losingCount: number;
    /** 最佳持仓 */
    bestPerformer: { symbol: string; pnlPct: number } | null;
    /** 最差持仓 */
    worstPerformer: { symbol: string; pnlPct: number } | null;
}

// =========================================================================
// 7. 新币狙击模块（New Token Sniper）
// =========================================================================

/** 新币发现来源 */
export type NewCoinSource = 'dexscreener' | 'birdeye' | 'cex_listing' | 'twitter' | 'onchain' | 'launchpad';

/** 新币热度等级 */
export type CoinHeatLevel = 'hot' | 'warm' | 'cold';

/** 风险等级 */
export type TokenRiskLevel = 'low' | 'medium' | 'high' | 'extreme';

/** 合约检测状态 */
export type ContractCheckStatus = 'safe' | 'warning' | 'danger' | 'unknown';

/** 新币记录（含狙击风险评估） */
export interface NewCoinRecord {
    /** 记录 ID */
    id: string;
    /** 币种符号 */
    symbol: string;
    /** 币种全称 */
    name: string;
    /** 来源 */
    source: NewCoinSource;
    /** 链（如 Ethereum / Solana / BSC） */
    chain: string;
    /** 热度等级 */
    heatLevel: CoinHeatLevel;
    /** 合约地址 */
    contractAddress: string | null;
    /** 部署时间 */
    deployTime: string;
    /** 当前价格 */
    currentPrice: number;
    /** 初始价格 */
    initialPrice: number;
    /** 市值 */
    marketCap: number | null;
    /** 流动性规模 (USDT) */
    liquidity: number | null;
    /** 24H 成交量 */
    volume24h: number | null;

    // ── 综合评分体系 ──────────────────
    /** 综合评分 (0-100) */
    totalScore: number;
    /** 安全性评分 (0-100) */
    safetyScore: number;
    /** 安全状态描述 */
    safetyStatus: string;
    /** 持有者评分 (0-100) */
    holderScore: number;
    /** 持有者状态描述 */
    holderStatus: string;
    /** 流动性评分 (0-100) */
    liquidityScore: number;
    /** 流动性状态描述 */
    liquidityStatus: string;
    /** 社交热度评分 (0-100) */
    socialScore: number;

    // ── 关键指标 ──────────────────────
    /** 合约检测状态 */
    contractCheck: ContractCheckStatus;
    /** 合约检测详情（Honeypot/Rug Pull/黑名单…） */
    contractCheckDetail?: string;
    /** Top 10 地址持有占比 % */
    top10Percentage: number;
    /** LP 锁定状态 */
    lpLockStatus: 'locked' | 'unlocked' | 'partial' | 'unknown';
    /** LP 锁定天数 */
    lpLockDays: number | null;
    /** 聪明钱买入地址数 */
    smartMoneyCount: number;
    /** 交易笔数 */
    txCount: number;

    // ── 加分项 ────────────────────────
    /** VC/KOL 推荐 */
    vcKolRecommended?: boolean;
    /** 巨鲸入场 */
    whaleEntry?: boolean;
    /** 有 GitHub */
    hasGithub?: boolean;
    /** 有 Twitter */
    hasTwitter?: boolean;
    /** 有审计报告 */
    hasAudit?: boolean;

    // ── 社交指标 ──────────────────────
    /** 推特提及数 */
    twitterMentions?: number;
    /** 持有者数量 */
    holders?: number;

    // ── 操作建议 ──────────────────────
    /** 操作建议 */
    recommendation: string;
    /** 风险等级 */
    riskLevel: TokenRiskLevel;

    // ── 快速链接 ──────────────────────
    /** Dexscreener 链接 */
    dexscreenerLink?: string;
    /** 合约浏览器链接 */
    contractLink?: string;
    /** Telegram 链接 */
    telegramLink?: string;
    /** 官方网站 */
    website?: string;

    /** 发现时间 */
    discoveredAt: string;
}

/** 新币预警配置 */
export interface NewCoinAlertConfig {
    /** 预警 ID */
    id: string;
    /** 关联新币 ID */
    coinId: string;
    /** 价格上限预警 */
    priceAbove: number | null;
    /** 价格下限预警 */
    priceBelow: number | null;
    /** 成交量突破预警（USDT） */
    volumeAbove: number | null;
    /** 是否启用 */
    isEnabled: boolean;
}

// =========================================================================
// 8. 市场情报模块（Market Intelligence）
// =========================================================================

// ── 子母标签体系 ──────────────────────────────────────────────

/** 子标签 */
export interface ChildTag {
    id: string;
    label: string;
    keywords: string[];
    enabled: boolean;
    sortOrder: number;
    icon?: string;
}

/** 母标签 */
export interface ParentTag {
    id: string;
    label: string;
    description: string;
    color: string;
    icon: string;
    weight: number;
    enabled: boolean;
    sortOrder: number;
    children: ChildTag[];
}

/** 标签分类体系完整响应 */
export interface TagTaxonomyResponse {
    version: string;
    updatedAt: string;
    tags: ParentTag[];
}

// ── 信息源 ──────────────────────────────────────────────────

export type DataSourceType = 'TWITTER' | 'RSS' | 'API' | 'ONCHAIN' | 'MANUAL';
export type DataSourceStatus = 'ACTIVE' | 'PAUSED' | 'ERROR' | 'DISABLED';

export interface DataSourceConfig {
    id: string;
    type: DataSourceType;
    name: string;
    description: string;
    endpoint?: string;
    fetchFrequency: string;
    associatedTagIds: string[];
    status: DataSourceStatus;
    requiresAiProcessing: boolean;
    priority: number;
    lastFetchAt?: string;
    lastError?: string;
}

export interface DataSourceRegistryResponse {
    sources: DataSourceConfig[];
    supportedTypes: DataSourceType[];
}

// ── 新闻与推文 ──────────────────────────────────────────────

/** 新闻重要性等级 */
export type ImportanceLevel = 'low' | 'medium' | 'high' | 'critical';

/** 情绪方向 */
export type SentimentDirection = 'bullish' | 'bearish' | 'neutral';

/** 市场新闻 */
export interface MarketNewsItem {
    id: string;
    title: string;
    summary: string;
    /** 主标签 ID（子标签） */
    primaryTag: string;
    /** 附加标签 ID 列表 */
    secondaryTags: string[];
    importance: ImportanceLevel;
    sentiment: SentimentDirection;
    sentimentScore: number;
    affectedSymbols: string[];
    source: string;
    sourceType: DataSourceType;
    publishedAt: string;
    /** AI 处理后的一句话摘要 */
    aiSummary?: string;
}

/** Twitter / 社交媒体记录 */
export interface TweetRecord {
    id: string;
    authorHandle: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    sentiment: SentimentDirection;
    sentimentScore: number;
    tags: string[];
    importance: ImportanceLevel;
    followers: number;
    retweets: number;
    likes: number;
    replies: number;
    mentionedSymbols: string[];
    publishedAt: string;
    /** AI 中文摘要 */
    summaryZh?: string;
    /** 参考价值（0-100） */
    referenceValue?: number;
}

/** 追踪的 Twitter 账号 */
export interface TrackedTwitterAccount {
    handle: string;
    name: string;
    avatar?: string;
    bio?: string;
    followers: number;
    /** 关注领域标签 */
    focusTags: string[];
    /** 近期情绪 */
    recentSentiment: SentimentDirection;
    /** 是否活跃 */
    isActive: boolean;
    /** 添加时间 */
    addedAt: string;
    /** 最近推文时间 */
    lastTweetAt?: string;
}

/** KOL 关系图谱边 */
export interface TwitterRelationshipEdge {
    from: string;
    to: string;
    type: 'mentor' | 'peer' | 'antagonist' | 'amplifier';
    strength: number;
    commonTopics: string[];
}

/** 市场情绪汇总（用于情绪侧边栏） */
export interface MarketSentimentSummary {
    overallDirection: SentimentDirection;
    overallScore: number;
    bullishPct: number;
    bearishPct: number;
    neutralPct: number;
    fearGreedIndex: number;
    btcSentiment: SentimentDirection;
    ethSentiment: SentimentDirection;
    longRatio: number;
    shortRatio: number;
    netInflowUsd24h: number;
    updatedAt: string;
}

// =========================================================================
// 9. 项目发现与投资研究模块（Investment Research / Web3 Project Discovery）
// =========================================================================

// ── 项目基础类型 ──────────────────────────────────────────────

/** 项目状态 */
export type ProjectStatus = 'DISCOVERED' | 'WATCHING' | 'INVESTED' | 'EXITED' | 'ARCHIVED';

/** 支持的链 */
export type ProjectChain =
    | 'ethereum' | 'solana' | 'base' | 'arbitrum' | 'optimism'
    | 'polygon' | 'bsc' | 'avalanche' | 'sei' | 'fuel'
    | 'sui' | 'aptos' | 'near' | 'ton' | 'other';

/** 项目评分维度 */
export interface ProjectScoreDimensions {
    codeQuality: number;
    teamBackground: number;
    funding: number;
    communityActivity: number;
    vcScore: number;
}

/** 风险评估 */
export interface ProjectRiskAssessment {
    honeypotCheck: 'safe' | 'warning' | 'danger' | 'unknown';
    contractAudit: 'audited' | 'partial' | 'unaudited' | 'unknown';
    lpLocked: boolean;
    lpLockDuration?: string;
    lpLockPlatform?: string;
    top10HoldersPct: number | null;
    contractVerified: boolean;
    riskWarnings: string[];
}

/** 代币详情 */
export interface TokenDetails {
    symbol: string;
    contractAddress: string;
    decimals: number;
    totalSupply: string | null;
    circulatingSupply: string | null;
    initialPrice: number | null;
    currentPrice: number | null;
    marketCap: number | null;
}

/** 社区链接 */
export interface ProjectCommunityLinks {
    website?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
    github?: string;
    docs?: string;
    medium?: string;
}

/** 关系图谱节点 */
export interface RelationshipNode {
    id: string;
    type: 'twitter_account' | 'project' | 'vc' | 'person';
    label: string;
    meta?: Record<string, string>;
}

/** 关系图谱边 */
export interface RelationshipEdge {
    from: string;
    to: string;
    type: 'invested' | 'advises' | 'mentions' | 'partners' | 'founded_by' | 'follows' | 'custom';
    label?: string;
    strength: number;
}

/** 关系图谱 */
export interface ProjectRelationshipGraph {
    nodes: RelationshipNode[];
    edges: RelationshipEdge[];
    updatedAt: string;
}

/** 投资记录 */
export interface InvestmentRecord {
    entryDate: string;
    entryPrice: number;
    amount: number;
    costUsd: number;
    soldAmount: number;
    exitPrice: number | null;
    realizedPnl: number;
    note: string;
}

/** 链上数据快照 */
export interface OnchainDataSnapshot {
    dailyActiveAddresses: number | null;
    transactions24h: number | null;
    tvl: number | null;
    volume24h: number | null;
    holdersCount: number | null;
    snapshotAt: string;
}

/** Web3 项目完整记录 */
export interface Web3ProjectRecord {
    id: string;
    name: string;
    overview: string;
    chain: ProjectChain;
    status: ProjectStatus;
    token: TokenDetails | null;
    communityLinks: ProjectCommunityLinks;
    discoverySource: string;
    vcBackers: string[];
    tags: string[];
    scoreDimensions: ProjectScoreDimensions;
    compositeScore: number;
    riskAssessment: ProjectRiskAssessment;
    relationshipGraph: ProjectRelationshipGraph;
    investmentRecords: InvestmentRecord[];
    onchainData: OnchainDataSnapshot | null;
    discoveredAt: string;
    createdAt: string;
    updatedAt: string;
}

// ── 数据源类型 ──────────────────────────────────────────────

export type DiscoverySourceCategory =
    | 'GITHUB_MONITOR' | 'DEX_MONITOR' | 'ONCHAIN_MONITOR'
    | 'ANALYTICS_PLATFORM' | 'WALLET_TRACKER' | 'ANOMALY_DETECTION'
    | 'VC_INCUBATOR' | 'ECOSYSTEM_UPSTREAM';

export type DiscoverySourceStatus = 'ACTIVE' | 'PLANNED' | 'PAUSED' | 'DEPRECATED';

export interface DiscoverySource {
    id: string;
    name: string;
    category: DiscoverySourceCategory;
    description: string;
    chains: string[];
    endpoint?: string;
    monitorFrequency: string;
    status: DiscoverySourceStatus;
    priority: number;
    requiresApiKey: boolean;
    tags: string[];
}

// ── VC 注册表 ────────────────────────────────────────────────

export type VcTier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

export interface VcInfo {
    name: string;
    tier: VcTier;
    score: number;
    portfolio?: string[];
}

// ── 市场叙事词云 ─────────────────────────────────────────────

export interface NarrativeWord {
    text: string;
    weight: number;
    trend: 'rising' | 'stable' | 'falling';
}

// =========================================================================
// 10. 交易员成长档案（Trader Growth Archive）
// =========================================================================

/** 情绪标签 */
export type TradeEmotion = 'calm' | 'excited' | 'anxious' | 'fearful' | 'greedy' | 'frustrated' | 'confident' | 'hesitant';

/** 交易纪律合规度 */
export type DisciplineCompliance = 'fully_compliant' | 'mostly_compliant' | 'partially_compliant' | 'non_compliant';

/** 交易模式标签 */
export type TradePatternTag =
    | 'trend_following' | 'mean_reversion' | 'breakout' | 'scalping'
    | 'swing' | 'fomo_entry' | 'revenge_trade' | 'overtrading'
    | 'perfect_entry' | 'early_exit' | 'late_exit' | 'stop_loss_hit';

/** 交易日志条目（单笔交易档案） */
export interface TradeJournalEntry {
    /** 日志 ID */
    id: string;
    /** 关联交易 ID（自动填充） */
    tradeId: string | null;
    /** 交易对 */
    symbol: string;
    /** 市场类型 */
    marketType: StrategyMarketType;
    /** 方向 */
    side: 'buy' | 'sell';
    /** 入场价 */
    entryPrice: number;
    /** 出场价 */
    exitPrice: number | null;
    /** 数量 */
    amount: number;
    /** 已实现盈亏 */
    realizedPnl: number | null;
    /** 盈亏比例 (%) */
    pnlPct: number | null;
    /** 交易截图 URL */
    screenshotUrls: string[];
    /** 链上数据快照 URL */
    onchainDataUrl: string | null;

    // ── 手动填写字段 ──────────────
    /** 交易理由 */
    tradingReason: string;
    /** 交易时情绪 */
    emotion: TradeEmotion;
    /** 压力等级 (1-10) */
    stressLevel: number;
    /** 纪律合规度 */
    disciplineCompliance: DisciplineCompliance;
    /** 成功点分析 */
    successAnalysis: string;
    /** 失败点分析 */
    failureAnalysis: string;
    /** 交易模式标签 */
    patternTags: TradePatternTag[];
    /** 自由笔记 */
    notes: string;

    /** 交易时间 */
    tradedAt: string;
    /** 归档日期（YYYY-MM-DD） */
    archiveDate: string;
    /** 创建时间 */
    createdAt: string;
}

/** 当日档案汇总 */
export interface DailyArchiveSummary {
    /** 日期 */
    date: string;
    /** 当日交易笔数 */
    totalTrades: number;
    /** 当日盈亏 */
    dailyPnl: number;
    /** 当日胜率 */
    winRate: number;
    /** 主要情绪分布 */
    emotionDistribution: Record<TradeEmotion, number>;
    /** 平均压力等级 */
    avgStressLevel: number;
    /** 纪律合规率 */
    complianceRate: number;
    /** 当日模式统计 */
    patternStats: Record<TradePatternTag, number>;
    /** 当日日志条目 */
    entries: TradeJournalEntry[];
}

/** 档案导出请求 */
export interface ArchiveExportRequest {
    /** 开始日期 */
    startDate: string;
    /** 结束日期 */
    endDate: string;
    /** 导出格式 */
    format: 'csv' | 'json' | 'pdf';
}

// =========================================================================
// 11. 风险管理中枢（Risk Management Hub）
// =========================================================================

/** 风险等级 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';

/** 风险等级颜色映射：low=绿 medium=黄 high=橙 extreme=红 */
export type RiskColorLevel = 'green' | 'yellow' | 'orange' | 'red';

/** 仓位风险信息 */
export interface PositionRiskInfo {
    /** 交易对 */
    symbol: string;
    /** 市场类型 */
    marketType: StrategyMarketType;
    /** 方向 */
    side: 'long' | 'short';
    /** 仓位价值（USDT） */
    notionalValue: number;
    /** 保证金 */
    margin: number;
    /** 杠杆 */
    leverage: number;
    /** 未实现盈亏 */
    unrealizedPnl: number;
    /** 强平价格 */
    liquidationPrice: number | null;
    /** 距强平距离 (%) */
    liquidationDistance: number | null;
    /** 仓位占总资金比 (%) */
    portfolioWeight: number;
    /** 风险等级 */
    riskLevel: RiskLevel;
}

/** 回撤监控 */
export interface DrawdownMonitor {
    /** 当前回撤 (%) */
    currentDrawdown: number;
    /** 最大回撤 (%) */
    maxDrawdown: number;
    /** 峰值资产 */
    peakEquity: number;
    /** 当前资产 */
    currentEquity: number;
    /** 最大可承受回撤 (%) */
    maxAllowedDrawdown: number;
    /** 回撤预警已触发 */
    isAlertTriggered: boolean;
    /** 回撤历史（最近 30 天） */
    history: { date: string; drawdown: number; equity: number }[];
}

/** 连亏保护 */
export interface ConsecutiveLossProtection {
    /** 当前连亏次数 */
    currentStreak: number;
    /** 连亏保护阈值 */
    threshold: number;
    /** 连亏累计金额 */
    streakLossAmount: number;
    /** 是否已触发保护（暂停交易） */
    isProtectionActive: boolean;
    /** 最近连亏交易列表 */
    recentLosses: { tradeId: string; symbol: string; pnl: number; time: string }[];
}

/** 日/周亏损限额 */
export interface LossLimitConfig {
    /** 每日亏损限额（USDT） */
    dailyLimit: number;
    /** 每周亏损限额（USDT） */
    weeklyLimit: number;
    /** 今日已亏损 */
    dailyLossUsed: number;
    /** 本周已亏损 */
    weeklyLossUsed: number;
    /** 每日限额使用率 (%) */
    dailyUsageRate: number;
    /** 每周限额使用率 (%) */
    weeklyUsageRate: number;
    /** 是否已触发每日限额 */
    isDailyLimitHit: boolean;
    /** 是否已触发每周限额 */
    isWeeklyLimitHit: boolean;
}

/** 黑天鹅预警事件 */
export interface BlackSwanAlert {
    /** 事件 ID */
    id: string;
    /** 事件类型 */
    type: 'exchange_halt' | 'flash_crash' | 'liquidation_cascade' | 'stablecoin_depeg' | 'regulatory' | 'hack';
    /** 严重程度 */
    severity: 'warning' | 'critical' | 'emergency';
    /** 标题 */
    title: string;
    /** 描述 */
    description: string;
    /** 受影响资产 */
    affectedAssets: string[];
    /** 建议动作 */
    recommendedAction: string;
    /** 发生时间 */
    triggeredAt: string;
    /** 是否已确认 */
    acknowledged: boolean;
}

/** 风险评分（0-100） */
export interface RiskScore {
    /** 综合评分 */
    overall: number;
    /** 颜色等级 */
    colorLevel: RiskColorLevel;
    /** 仓位集中度评分 */
    concentrationScore: number;
    /** 杠杆评分 */
    leverageScore: number;
    /** 回撤评分 */
    drawdownScore: number;
    /** 波动率暴露评分 */
    volatilityScore: number;
    /** 流动性评分 */
    liquidityScore: number;
    /** 评分更新时间 */
    updatedAt: string;
}

/** 压力测试场景 */
export type StressTestScenario = 'btc_drop_30' | 'btc_drop_50' | 'altcoin_zero' | 'contract_liquidation' | 'custom';

/** 压力测试结果 */
export interface StressTestResult {
    /** 场景 */
    scenario: StressTestScenario;
    /** 场景描述 */
    scenarioLabel: string;
    /** 预测账户损失（USDT） */
    estimatedLoss: number;
    /** 预测损失率 (%) */
    estimatedLossPct: number;
    /** 剩余资产 */
    remainingEquity: number;
    /** 会触发强平的仓位 */
    liquidatedPositions: { symbol: string; side: string; loss: number }[];
    /** 存活率 (%) */
    survivalRate: number;
}

/** 风险管理面板汇总 */
export interface RiskDashboard {
    /** 仓位风险列表 */
    positions: PositionRiskInfo[];
    /** 回撤监控 */
    drawdown: DrawdownMonitor;
    /** 连亏保护 */
    consecutiveLoss: ConsecutiveLossProtection;
    /** 亏损限额 */
    lossLimit: LossLimitConfig;
    /** 黑天鹅预警 */
    blackSwanAlerts: BlackSwanAlert[];
    /** 风险评分 */
    riskScore: RiskScore;
    /** 压力测试结果 */
    stressTests: StressTestResult[];
}

// =========================================================================
// 12. AI 模型训练（AI Model Training）
// =========================================================================

/** 模型状态 */
export type AiModelStatus = 'idle' | 'training' | 'ready' | 'error';

/** AI 模型信息 */
export interface AiModelInfo {
    /** 模型 ID */
    id: string;
    /** 模型名称 */
    name: string;
    /** 模型描述 */
    description: string;
    /** 模型状态 */
    status: AiModelStatus;
    /** 训练进度 (0-100) */
    trainingProgress: number;
    /** 准确率 */
    accuracy: number | null;
    /** 最近训练时间 */
    lastTrainedAt: string | null;
    /** 数据集大小 */
    datasetSize: number;
    /** 创建时间 */
    createdAt: string;
}

// ── 盈亏综合报告（下载用） ──────────────────────────────────────

/** 盈亏综合报告（匹配下载格式） */
export interface PnlComprehensiveReport {
    /** 报告标题 */
    title: string;
    /** 统计周期 */
    period: string;
    /** 生成时间 */
    generatedAt: string;

    // 📊 资金概览
    fundOverview: {
        initialCapital: number;
        currentEquity: number;
        totalDeposit: number;
        totalWithdraw: number;
        netPnl: number;
        netReturnPct: number;
    };

    // 💰 收益表现
    performanceSummary: {
        totalRealizedPnl: number;
        unrealizedPnl: number;
        totalReturnPct: number;
        annualizedReturnPct: number;
        sharpeRatio: number;
        sortinoRatio: number;
        maxDrawdownPct: number;
        maxDrawdownDuration: string;
        calmarRatio: number;
    };

    // 📈 交易统计
    tradeStats: {
        totalTrades: number;
        winCount: number;
        lossCount: number;
        winRatePct: number;
        avgWin: number;
        avgLoss: number;
        profitFactor: number;
        avgHoldingMinutes: number;
        avgTradesPerDay: number;
    };

    // 🎯 最佳表现
    bestPerformance: {
        bestTrade: { symbol: string; pnl: number; pnlPct: number; date: string };
        bestDay: { date: string; pnl: number };
        bestWeek: { week: string; pnl: number };
        bestMonth: { month: string; pnl: number };
        longestWinStreak: number;
    };

    // ⚠️ 需要改进
    areasForImprovement: {
        worstTrade: { symbol: string; pnl: number; pnlPct: number; date: string };
        worstDay: { date: string; pnl: number };
        longestLossStreak: number;
        avgLossStreak: number;
        revengeTradeCount: number;
    };

    // 📊 分类分析
    categorizedAnalysis: {
        bySource: Record<PnlSource, { pnl: number; count: number; winRate: number }>;
        bySymbol: Record<string, { pnl: number; count: number; winRate: number }>;
        byTimeOfDay: Record<string, { pnl: number; count: number }>;
    };

    // 💡 优化建议
    suggestions: string[];
}

/** 盈亏实时反馈 */
export interface PnlRealtimeFeedback {
    /** 今日盈亏 */
    todayPnl: number;
    /** 今日收益率 */
    todayReturnPct: number;
    /** 当前持仓盈亏 */
    openPositionPnl: number;
    /** 已平仓盈亏 */
    closedPnl: number;
    /** 今日交易笔数 */
    todayTradeCount: number;
    /** 今日胜率 */
    todayWinRate: number;
    /** 实时权益曲线（当日分钟级） */
    intraday: { time: string; equity: number }[];
}

/** 多维指标面板 */
export interface PnlMultiDimensionMetrics {
    /** 夏普比率 */
    sharpeRatio: number;
    /** 索提诺比率 */
    sortinoRatio: number;
    /** 卡尔玛比率 */
    calmarRatio: number;
    /** 最大回撤 (%) */
    maxDrawdownPct: number;
    /** 年化收益率 (%) */
    annualizedReturnPct: number;
    /** 波动率 (%) */
    volatility: number;
    /** 盈亏比 */
    profitFactor: number;
    /** 期望收益 (R) */
    expectancy: number;
    /** 平均盈利 */
    avgWin: number;
    /** 平均亏损 */
    avgLoss: number;
    /** 平均持仓时间（分钟） */
    avgHoldingMinutes: number;
    /** 最大连胜次数 */
    maxWinStreak: number;
    /** 最大连亏次数 */
    maxLossStreak: number;
    /** 日均交易次数 */
    avgTradesPerDay: number;
}

/** 盈亏时间粒度 */
export type PnlTimeGranularity = 'day' | 'week' | 'month' | 'year';

