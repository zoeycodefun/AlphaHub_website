/**
 * Alpha 模块 API 服务层
 *
 * 封装信号分析、回测、策略管理、盈亏分析、对冲交易、山寨币持仓、新币监控等模块的
 * 全部 HTTP 接口调用。
 *
 * 架构设计：
 *   - 单例模式，与 tradingApiService 共享相同架构
 *   - JWT 拦截器自动附加 Authorization 头
 *   - 401 统一派发 auth:unauthorized 事件
 *   - 所有方法返回解包后的业务数据（剥离 { success, data } 外层）
 */
import axios, { type AxiosInstance } from 'axios';
import type {
    SignalRecord,
    SignalFilter,
    BacktestConfigRequest,
    BacktestResult,
    StrategyRecord,
    StrategyConfigRequest,
    StrategyExecutionLog,
    PnlRecord,
    PnlReport,
    HedgePairRecord,
    CreateHedgePairRequest,
    CorrelationEntry,
    AltcoinPositionRecord,
    AddAltcoinPositionRequest,
    AltcoinPortfolioSummary,
    NewCoinRecord,
    NewCoinAlertConfig,
    MarketNewsItem,
    TweetRecord,
    MarketSentimentSummary,
    TagTaxonomyResponse,
    DataSourceRegistryResponse,
    TrackedTwitterAccount,
    Web3ProjectRecord,
    ProjectScoreDimensions,
    DiscoverySource,
    VcInfo,
} from '../pages/trade_center_pages/type/alpha_module_types';
import type { PaginatedResponse, PaginationParams } from './trading_api.service';

// =========================================================================
// 通用响应结构
// =========================================================================

interface DataResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    timestamp: string;
}

// =========================================================================
// Alpha API Service 类
// =========================================================================

class AlphaApiService {
    private http: AxiosInstance;

    constructor() {
        this.http = axios.create({
            baseURL: (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
            timeout: 30_000,
            headers: { 'Content-Type': 'application/json' },
        });

        // 请求拦截器：自动附加 JWT
        this.http.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('auth_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error),
        );

        // 响应拦截器：401 全局处理
        this.http.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('auth_token');
                    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
                }
                return Promise.reject(error);
            },
        );
    }

    /** 从标准响应结构中提取业务数据 */
    private extract<T>(response: { data: DataResponse<T> }): T {
        const body = response.data;
        if (!body.success || body.data === undefined) {
            throw new Error(body.message || '请求失败');
        }
        return body.data;
    }

    // =====================================================================
    // 1. 信号接口
    // =====================================================================

    /** 获取信号列表 */
    async getSignals(filter?: SignalFilter & PaginationParams): Promise<PaginatedResponse<SignalRecord>> {
        const res = await this.http.get('/signals', { params: filter });
        return this.extract(res);
    }

    /** 获取单个信号详情 */
    async getSignalById(id: string): Promise<SignalRecord> {
        const res = await this.http.get(`/signals/${encodeURIComponent(id)}`);
        return this.extract(res);
    }

    /** 获取信号 AI 解释 */
    async getSignalExplanation(signalId: string): Promise<{ explanation: string }> {
        const res = await this.http.get(`/signals/${encodeURIComponent(signalId)}/explanation`);
        return this.extract(res);
    }

    // =====================================================================
    // 2. 回测接口
    // =====================================================================

    /** 提交回测任务 */
    async runBacktest(config: BacktestConfigRequest): Promise<BacktestResult> {
        const res = await this.http.post('/backtesting/run', config);
        return this.extract(res);
    }

    /** 获取回测列表 */
    async getBacktestResults(params?: PaginationParams): Promise<PaginatedResponse<BacktestResult>> {
        const res = await this.http.get('/backtesting/results', { params });
        return this.extract(res);
    }

    /** 获取单个回测详情 */
    async getBacktestById(id: string): Promise<BacktestResult> {
        const res = await this.http.get(`/backtesting/results/${encodeURIComponent(id)}`);
        return this.extract(res);
    }

    // =====================================================================
    // 3. 策略接口
    // =====================================================================

    /** 获取策略列表 */
    async getStrategies(params?: PaginationParams): Promise<PaginatedResponse<StrategyRecord>> {
        const res = await this.http.get('/strategies', { params });
        return this.extract(res);
    }

    /** 获取单个策略详情 */
    async getStrategyById(id: string): Promise<StrategyRecord> {
        const res = await this.http.get(`/strategies/${encodeURIComponent(id)}`);
        return this.extract(res);
    }

    /** 创建策略 */
    async createStrategy(config: StrategyConfigRequest): Promise<StrategyRecord> {
        const res = await this.http.post('/strategies', config);
        return this.extract(res);
    }

    /** 切换策略状态（activate / pause / stop） */
    async toggleStrategyStatus(id: string, action: 'activate' | 'pause' | 'stop'): Promise<StrategyRecord> {
        const res = await this.http.patch(`/strategies/${encodeURIComponent(id)}/status`, { action });
        return this.extract(res);
    }

    /** 获取策略执行日志 */
    async getStrategyLogs(strategyId: string, params?: PaginationParams): Promise<PaginatedResponse<StrategyExecutionLog>> {
        const res = await this.http.get(`/strategies/${encodeURIComponent(strategyId)}/logs`, { params });
        return this.extract(res);
    }

    // =====================================================================
    // 4. 盈亏分析接口
    // =====================================================================

    /** 获取盈亏记录列表 */
    async getPnlRecords(params?: PaginationParams & { source?: string; symbol?: string }): Promise<PaginatedResponse<PnlRecord>> {
        const res = await this.http.get('/pnl/records', { params });
        return this.extract(res);
    }

    /** 获取盈亏汇总报告 */
    async getPnlReport(period?: string): Promise<PnlReport> {
        const res = await this.http.get('/pnl/report', { params: { period } });
        return this.extract(res);
    }

    // =====================================================================
    // 5. 对冲交易接口
    // =====================================================================

    /** 获取对冲组合列表 */
    async getHedgePairs(params?: PaginationParams): Promise<PaginatedResponse<HedgePairRecord>> {
        const res = await this.http.get('/hedge/pairs', { params });
        return this.extract(res);
    }

    /** 创建对冲组合 */
    async createHedgePair(req: CreateHedgePairRequest): Promise<HedgePairRecord> {
        const res = await this.http.post('/hedge/pairs', req);
        return this.extract(res);
    }

    /** 调整对冲比例 */
    async adjustHedgeRatio(pairId: string, newRatio: number): Promise<HedgePairRecord> {
        const res = await this.http.patch(`/hedge/pairs/${encodeURIComponent(pairId)}/ratio`, { hedgeRatio: newRatio });
        return this.extract(res);
    }

    /** 关闭对冲组合 */
    async closeHedgePair(pairId: string): Promise<void> {
        await this.http.post(`/hedge/pairs/${encodeURIComponent(pairId)}/close`);
    }

    /** 获取相关性矩阵 */
    async getCorrelationMatrix(symbols?: string[]): Promise<CorrelationEntry[]> {
        const res = await this.http.get('/hedge/correlation', { params: { symbols: symbols?.join(',') } });
        return this.extract(res);
    }

    // =====================================================================
    // 6. 山寨币持仓接口
    // =====================================================================

    /** 获取持仓列表 */
    async getAltcoinPositions(params?: PaginationParams): Promise<PaginatedResponse<AltcoinPositionRecord>> {
        const res = await this.http.get('/altcoin/positions', { params });
        return this.extract(res);
    }

    /** 新增持仓 */
    async addAltcoinPosition(req: AddAltcoinPositionRequest): Promise<AltcoinPositionRecord> {
        const res = await this.http.post('/altcoin/positions', req);
        return this.extract(res);
    }

    /** 卖出/部分卖出 */
    async sellAltcoinPosition(positionId: string, quantity: number, sellPrice: number): Promise<AltcoinPositionRecord> {
        const res = await this.http.post(`/altcoin/positions/${encodeURIComponent(positionId)}/sell`, { quantity, sellPrice });
        return this.extract(res);
    }

    /** 更新持仓备注 */
    async updateAltcoinNote(positionId: string, note: string): Promise<void> {
        await this.http.patch(`/altcoin/positions/${encodeURIComponent(positionId)}/note`, { note });
    }

    /** 删除持仓 */
    async deleteAltcoinPosition(positionId: string): Promise<void> {
        await this.http.delete(`/altcoin/positions/${encodeURIComponent(positionId)}`);
    }

    /** 获取持仓汇总 */
    async getAltcoinPortfolioSummary(): Promise<AltcoinPortfolioSummary> {
        const res = await this.http.get('/altcoin/summary');
        return this.extract(res);
    }

    // =====================================================================
    // 7. 新币监控接口
    // =====================================================================

    /** 获取新币列表 */
    async getNewCoins(params?: PaginationParams & { source?: string; chain?: string }): Promise<PaginatedResponse<NewCoinRecord>> {
        const res = await this.http.get('/new-coins', { params });
        return this.extract(res);
    }

    /** 设置新币预警 */
    async setNewCoinAlert(config: Omit<NewCoinAlertConfig, 'id'>): Promise<NewCoinAlertConfig> {
        const res = await this.http.post('/new-coins/alerts', config);
        return this.extract(res);
    }

    /** 获取预警列表 */
    async getNewCoinAlerts(): Promise<NewCoinAlertConfig[]> {
        const res = await this.http.get('/new-coins/alerts');
        return this.extract(res);
    }

    /** 删除预警 */
    async deleteNewCoinAlert(alertId: string): Promise<void> {
        await this.http.delete(`/new-coins/alerts/${encodeURIComponent(alertId)}`);
    }

    // =====================================================================
    // 8. 市场情报接口
    // =====================================================================

    /** 获取标签分类体系 */
    async getTagTaxonomy(): Promise<TagTaxonomyResponse> {
        const res = await this.http.get('/market-intelligence/tags');
        return this.extract(res);
    }

    /** 获取信息源注册表 */
    async getDataSourceRegistry(): Promise<DataSourceRegistryResponse> {
        const res = await this.http.get('/market-intelligence/sources');
        return this.extract(res);
    }

    /** 获取市场新闻（按标签筛选） */
    async getMarketNews(params?: PaginationParams & { tags?: string; importance?: string }): Promise<PaginatedResponse<MarketNewsItem>> {
        const res = await this.http.get('/market-intelligence/news', { params });
        return this.extract(res);
    }

    /** 获取 Twitter 分析 */
    async getTweetAnalysis(params?: PaginationParams): Promise<PaginatedResponse<TweetRecord>> {
        const res = await this.http.get('/market-intelligence/tweets', { params });
        return this.extract(res);
    }

    /** 获取追踪的 Twitter 账号列表 */
    async getTrackedTwitterAccounts(): Promise<TrackedTwitterAccount[]> {
        const res = await this.http.get('/market-intelligence/twitter/accounts');
        return this.extract(res);
    }

    /** 获取市场情绪汇总 */
    async getMarketSentiment(): Promise<MarketSentimentSummary> {
        const res = await this.http.get('/market-intelligence/sentiment');
        return this.extract(res);
    }

    /** 获取 AI 模板列表 */
    async getAiTemplates(): Promise<{ templates: string[] }> {
        const res = await this.http.get('/market-intelligence/ai/templates');
        return this.extract(res);
    }

    // =====================================================================
    // 9. 项目发现与投资研究（Investment Research）
    // =====================================================================

    /** 获取项目列表（支持筛选） */
    async getProjects(params?: {
        status?: string;
        chain?: string;
        minScore?: number;
        search?: string;
    }): Promise<{ items: Web3ProjectRecord[]; total: number }> {
        const res = await this.http.get('/invest-research/projects', { params });
        return this.extract(res);
    }

    /** 获取项目详情 */
    async getProjectDetail(id: string): Promise<Web3ProjectRecord> {
        const res = await this.http.get(`/invest-research/projects/${id}`);
        return this.extract(res);
    }

    /** 创建项目 */
    async createProject(data: {
        name: string;
        overview: string;
        chain: string;
        discoverySource?: string;
        vcBackers?: string[];
        tags?: string[];
    }): Promise<Web3ProjectRecord> {
        const res = await this.http.post('/invest-research/projects', data);
        return this.extract(res);
    }

    /** 更新项目评分 */
    async updateProjectScore(id: string, dimensions: Partial<ProjectScoreDimensions>): Promise<{
        id: string;
        dimensions: Partial<ProjectScoreDimensions>;
        compositeScore: number;
    }> {
        const res = await this.http.patch(`/invest-research/projects/${id}/score`, dimensions);
        return this.extract(res);
    }

    /** 更新项目状态 */
    async changeProjectStatus(id: string, action: 'watch' | 'invest' | 'exit' | 'archive', exitPrice?: number): Promise<void> {
        const res = await this.http.patch(`/invest-research/projects/${id}/status`, { action, exitPrice });
        return this.extract(res);
    }

    /** 更新关系图谱 */
    async updateProjectGraph(id: string, graph: { nodes: any[]; edges: any[] }): Promise<void> {
        const res = await this.http.patch(`/invest-research/projects/${id}/graph`, graph);
        return this.extract(res);
    }

    /** 记录投资 */
    async recordInvestment(id: string, data: {
        entryPrice: number;
        amount: number;
        costUsd: number;
        note?: string;
    }): Promise<void> {
        const res = await this.http.post(`/invest-research/projects/${id}/invest`, data);
        return this.extract(res);
    }

    /** 获取发现数据源列表 */
    async getDiscoverySources(params?: { chain?: string; tag?: string }): Promise<{
        sources: DiscoverySource[];
        categories: string[];
        stats: Record<string, number>;
    }> {
        const res = await this.http.get('/invest-research/discovery-sources', { params });
        return this.extract(res);
    }

    /** 获取 VC 注册表 */
    async getVcRegistry(): Promise<VcInfo[]> {
        const res = await this.http.get('/invest-research/vc-registry');
        return this.extract(res);
    }
}

/** 导出单例 */
export const alphaApiService = new AlphaApiService();
