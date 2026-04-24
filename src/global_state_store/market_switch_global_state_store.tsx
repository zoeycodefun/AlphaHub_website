/**
 * 市场切换全局状态（MarketSwitchStore）
 *
 * 管理当前选中的市场板块（Crypto、美股、大宗商品等），核心职责：
 *
 *   1. 持久化当前选中板块 ID 到 localStorage（刷新不丢失）
 *   2. 从后端 /api/market-config 拉取板块列表（支持动态扩展）
 *   3. 提供 dashboardTitle / enabled 等元数据给 UI 层消费
 *   4. 作为全局市场上下文，驱动 Dashboard 标题、数据源切换等
 *
 * 后续扩展点：
 *   - 新增板块只需后端 MarketConfigService 追加一项
 *   - 启用新板块后前端自动展示（无需代码改动）
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// =========================================================================
// 类型（与后端 MarketSector 对齐）
// =========================================================================

export interface MarketSector {
    id: string;
    label: string;
    enabled: boolean;
    description: string;
    dashboardTitle: string;
    sortOrder: number;
    dataSources: string[];
    features: string[];
}

interface MarketSwitchState {
    /** 当前选中的市场板块 ID */
    selectedMarket: string;
    /** 从后端拉取的板块列表（为空时使用内置默认） */
    sectors: MarketSector[];
    /** 是否正在加载远程配置 */
    isLoadingConfig: boolean;

    /** 切换市场 */
    setSelectedMarket: (marketId: string) => void;
    /** 从后端拉取板块配置 */
    fetchMarketConfig: () => Promise<void>;
}

// =========================================================================
// 内置默认板块（后端不可用时的降级列表）
// =========================================================================

const BUILTIN_SECTORS: MarketSector[] = [
    { id: 'crypto_assets_web3', label: 'Crypto Assets & Web3', enabled: true, description: '加密资产与 Web3 生态', dashboardTitle: '加密资产与 Web3 市场概览', sortOrder: 0, dataSources: ['binance'], features: ['spot', 'futures'] },
    { id: 'us_equities', label: 'U.S. Equities', enabled: false, description: '美股市场', dashboardTitle: '美股市场概览', sortOrder: 1, dataSources: [], features: [] },
    { id: 'commodities', label: 'Commodities', enabled: false, description: '大宗商品', dashboardTitle: '大宗商品市场概览', sortOrder: 2, dataSources: [], features: [] },
    { id: 'foreign_exchange', label: 'Foreign Exchange', enabled: false, description: '外汇市场', dashboardTitle: '外汇市场概览', sortOrder: 3, dataSources: [], features: [] },
    { id: 'market_indices', label: 'Market Indices', enabled: false, description: '全球主要指数', dashboardTitle: '全球指数概览', sortOrder: 4, dataSources: [], features: [] },
    { id: 'interest_rates_fixed_income', label: 'Interest Rates & Fixed Income', enabled: false, description: '利率与固定收益', dashboardTitle: '利率与固定收益市场概览', sortOrder: 5, dataSources: [], features: [] },
];

const DEFAULT_MARKET = 'crypto_assets_web3';

// =========================================================================
// Store
// =========================================================================

export const useMarketSwitchStore = create<MarketSwitchState>()(
    persist(
        (set, get) => ({
            selectedMarket: DEFAULT_MARKET,
            sectors: BUILTIN_SECTORS,
            isLoadingConfig: false,

            setSelectedMarket: (marketId) => {
                const sectors = get().sectors;
                const target = sectors.find(s => s.id === marketId);
                if (target?.enabled) {
                    set({ selectedMarket: marketId });
                }
            },

            fetchMarketConfig: async () => {
                set({ isLoadingConfig: true });
                try {
                    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';
                    const res = await fetch(`${baseUrl}/market-config`);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const json = await res.json();
                    if (json.success && json.data?.sectors) {
                        const sectors: MarketSector[] = json.data.sectors;
                        set({ sectors });
                        // 如果当前选中的板块被后端禁用了，回退到默认
                        const current = get().selectedMarket;
                        const valid = sectors.find(s => s.id === current && s.enabled);
                        if (!valid) {
                            const fallback = json.data.defaultSectorId ?? DEFAULT_MARKET;
                            set({ selectedMarket: fallback });
                        }
                    }
                } catch {
                    // 后端不可用时保持内置默认，静默处理
                } finally {
                    set({ isLoadingConfig: false });
                }
            },
        }),
        {
            name: 'market-switch',
            storage: createJSONStorage(() => localStorage),
            // 只持久化选中项，不持久化板块列表（每次从后端刷新）
            partialize: (state) => ({ selectedMarket: state.selectedMarket }),
        },
    ),
);

// =========================================================================
// 选择器 Hooks
// =========================================================================

/** 当前板块完整信息 */
export function useCurrentSector(): MarketSector | undefined {
    return useMarketSwitchStore((s) => s.sectors.find(sec => sec.id === s.selectedMarket));
}

/** 当前板块的 Dashboard 标题 */
export function useDashboardTitle(): string {
    const sector = useCurrentSector();
    return sector?.dashboardTitle ?? 'Dashboard';
}

