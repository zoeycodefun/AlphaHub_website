/**
 * 加密货币实时价格列表组件（CryptoPriceList）
 *
 * Dashboard 核心组件之一，展示自选或热门加密货币的实时价格：
 *
 * ─── 功能 ────────────────────────────────────────────────────────
 *  1. 预设热门币种列表（BTC/ETH/BNB/SOL/XRP/ADA/DOGE/AVAX）
 *  2. 实时价格更新（通过 WebSocket Ticker 订阅）
 *  3. 24H 涨跌幅、成交量展示
 *  4. 涨跌颜色高亮（绿涨红跌）
 *  5. 点击跳转至交易中心
 *
 * ─── 数据源 ────────────────────────────────────────────────────
 *  - useMarketDataStore: Zustand 实时行情数据
 *  - subscribeTicker:    自动订阅/退订 WebSocket 频道
 */
import React, { useEffect, useMemo, memo } from 'react';
import { useMarketDataStore, useTicker, type TickerData } from '../../../global_state_store/market_data_store';

// =========================================================================
// 默认展示币种
// =========================================================================

/** 热门币种配置 */
interface CoinConfig {
    /** 交易对（如 BTC/USDT） */
    symbol: string;
    /** 展示名称 */
    name: string;
    /** 缩写标识 */
    shortName: string;
    /** 图标颜色（Tailwind CSS 颜色类） */
    iconColor: string;
}

const DEFAULT_COINS: CoinConfig[] = [
    { symbol: 'BTC/USDT',  name: 'Bitcoin',   shortName: 'BTC',  iconColor: 'text-orange-400' },
    { symbol: 'ETH/USDT',  name: 'Ethereum',  shortName: 'ETH',  iconColor: 'text-blue-400' },
    { symbol: 'BNB/USDT',  name: 'BNB',       shortName: 'BNB',  iconColor: 'text-yellow-400' },
    { symbol: 'SOL/USDT',  name: 'Solana',    shortName: 'SOL',  iconColor: 'text-purple-400' },
    { symbol: 'XRP/USDT',  name: 'XRP',       shortName: 'XRP',  iconColor: 'text-secondary' },
    { symbol: 'ADA/USDT',  name: 'Cardano',   shortName: 'ADA',  iconColor: 'text-blue-300' },
    { symbol: 'DOGE/USDT', name: 'Dogecoin',  shortName: 'DOGE', iconColor: 'text-yellow-300' },
    { symbol: 'AVAX/USDT', name: 'Avalanche', shortName: 'AVAX', iconColor: 'text-red-400' },
];

/** 默认交易所 */
const DEFAULT_EXCHANGE = 'binance';

// =========================================================================
// 工具函数
// =========================================================================

/** 格式化价格 */
function formatPrice(price: number): string {
    if (price >= 10000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1)     return price.toFixed(4);
    if (price >= 0.01)  return price.toFixed(6);
    return price.toFixed(8);
}

/** 格式化成交量 */
function formatVolume(vol: number): string {
    if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(2)}B`;
    if (vol >= 1_000_000)     return `$${(vol / 1_000_000).toFixed(2)}M`;
    if (vol >= 1_000)         return `$${(vol / 1_000).toFixed(2)}K`;
    return `$${vol.toFixed(2)}`;
}

/** 格式化涨跌幅 */
function formatChange(pct: number): string {
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
}

/** 涨跌颜色 */
function changeColor(pct: number): string {
    if (pct > 0) return 'text-green-400';
    if (pct < 0) return 'text-red-400';
    return 'text-muted';
}

// =========================================================================
// 单行价格组件
// =========================================================================

interface CoinRowProps {
    coin: CoinConfig;
    exchangeId: string;
}

const CoinRow: React.FC<CoinRowProps> = memo(({ coin, exchangeId }) => {
    const ticker = useTicker(coin.symbol, exchangeId);
    const subscribeTicker = useMarketDataStore(s => s.subscribeTicker);

    // 自动订阅 Ticker
    useEffect(() => {
        const unsub = subscribeTicker(coin.symbol, exchangeId);
        return () => { unsub?.(); };
    }, [coin.symbol, exchangeId, subscribeTicker]);

    // 涨跌方向
    const changePct = ticker?.changePercent ?? 0;

    return (
        <div className="flex items-center justify-between py-2.5 px-3 hover:bg-card/5 rounded-lg transition-colors cursor-pointer group">
            {/* 左侧：图标 + 名称 */}
            <div className="flex items-center gap-3 min-w-0">
                {/* 币种首字母圆形图标 */}
                <div className={`w-8 h-8 rounded-full bg-card/10 flex items-center justify-center text-sm font-bold ${coin.iconColor}`}>
                    {coin.shortName.charAt(0)}
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-primary truncate">{coin.shortName}</div>
                    <div className="text-xs text-dim truncate">{coin.name}</div>
                </div>
            </div>

            {/* 右侧：价格 + 涨跌幅 */}
            <div className="text-right flex-shrink-0">
                <div className="text-sm font-mono text-primary">
                    {ticker ? `$${formatPrice(ticker.last)}` : '—'}
                </div>
                <div className={`text-xs font-mono ${changeColor(changePct)}`}>
                    {ticker ? formatChange(changePct) : '—'}
                </div>
            </div>
        </div>
    );
});

CoinRow.displayName = 'CoinRow';

// =========================================================================
// 主组件
// =========================================================================

export interface CryptoPriceListProps {
    /** 自定义币种列表（不传则使用默认热门列表） */
    coins?: CoinConfig[];
    /** 交易所 ID（默认 binance） */
    exchangeId?: string;
    /** 标题（默认 "实时行情"） */
    title?: string;
    /** 最大显示数量 */
    maxItems?: number;
}

const CryptoPriceList: React.FC<CryptoPriceListProps> = memo(({
    coins = DEFAULT_COINS,
    exchangeId = DEFAULT_EXCHANGE,
    title = '实时行情',
    maxItems = 8,
}) => {
    const displayCoins = useMemo(() => coins.slice(0, maxItems), [coins, maxItems]);

    return (
        <div className="bg-surface/60 backdrop-blur-sm rounded-xl border border-strong/50 p-4">
            {/* 标题栏 */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-primary">{title}</h3>
                <span className="text-xs text-dim">
                    {exchangeId.charAt(0).toUpperCase() + exchangeId.slice(1)}
                </span>
            </div>

            {/* 表头 */}
            <div className="flex items-center justify-between px-3 pb-2 text-xs text-dim border-b border-strong/30">
                <span>币种</span>
                <span>价格 / 涨跌</span>
            </div>

            {/* 列表 */}
            <div className="divide-y divide-strong/20">
                {displayCoins.map(coin => (
                    <CoinRow key={coin.symbol} coin={coin} exchangeId={exchangeId} />
                ))}
            </div>

            {/* 查看更多 */}
            {coins.length > maxItems && (
                <div className="mt-2 text-center">
                    <span className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer transition-colors">
                        查看全部 {coins.length} 个币种 →
                    </span>
                </div>
            )}
        </div>
    );
});

CryptoPriceList.displayName = 'CryptoPriceList';

export default CryptoPriceList;
