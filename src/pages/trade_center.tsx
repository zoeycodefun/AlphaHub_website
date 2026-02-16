import React, { useState, useCallback, memo } from 'react';
import TradeCenterNavigation from './trade_center_pages/trade_center_pages_components/trade_center_navigation';
import { Exchange, TimeZone } from './trade_center_pages/page_type/trade_center_navigation_type';

/**
 * 交易中心页面 - 导航测试界面
 * 
 * 最终修复版特性：
 * - 一栏式导航设计：左侧页面导航，右侧工具
 * - 交易所选择正确高亮和响应
 * - 时区实时显示时间（精确到秒）
 * - 移动端菜单可滚动
 * - 点击外部关闭菜单
 * - 固定定位，紧贴主导航
 */
const TradeCenter: React.FC = memo(() => {
    // 状态管理
    const [currentExchange, setCurrentExchange] = useState<Exchange | null>(null);
    const [currentTimeZone, setCurrentTimeZone] = useState<TimeZone>('LOCAL');
    const [currentPage, setCurrentPage] = useState<string>('spot_trading');

    // 事件处理函数
    const handleExchangeChange = useCallback((exchange: Exchange) => {
        // 更新所有交易所的isActive状态
        setCurrentExchange(exchange);
        console.log('交易所切换:', exchange);
    }, []);

    const handleTimeZoneChange = useCallback((timeZone: TimeZone) => {
        setCurrentTimeZone(timeZone);
        console.log('时区切换:', timeZone);
    }, []);

    const handlePageChange = useCallback((pageId: string) => {
        setCurrentPage(pageId);
        console.log('页面切换:', pageId);
    }, []);

    // 模拟交易所数据
    const exchanges: readonly Exchange[] = [
        {
            id: 'binance',
            name: 'Binance',
            isActive: true,
            balance: { total: 1000, available: 950, currency: 'USDT' }
        },
        {
            id: 'okx',
            name: 'OKX',
            isActive: false,
            balance: { total: 500, available: 480, currency: 'USDT' }
        },
        {
            id: 'bybit',
            name: 'Bybit',
            isActive: false,
            balance: { total: 300, available: 295, currency: 'USDT' }
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 交易中心导航组件 */}
            <TradeCenterNavigation
                currentExchange={currentExchange}
                exchanges={exchanges}
                currentTimeZone={currentTimeZone}
                currentPage={currentPage}
                onExchangeChange={handleExchangeChange}
                onTimeZoneChange={handleTimeZoneChange}
                onPageChange={handlePageChange}
            />

            {/* 页面内容区域 - 考虑导航高度 */}
            <main className="pt-32 md:pt-32 max-w-7xl mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 导航功能测试</h3>
                    
                    {/* 状态展示 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-500 mb-1">当前交易所</div>
                            <div className="text-lg font-medium text-gray-900">
                                {currentExchange ? currentExchange.name : '未选择'}
                            </div>
                            {currentExchange && (
                                <div className="text-sm text-gray-600 mt-1">
                                    可用余额: ${currentExchange.balance.available.toFixed(2)} {currentExchange.balance.currency}
                                </div>
                            )}
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-500 mb-1">当前时区</div>
                            <div className="text-lg font-medium text-gray-900">{currentTimeZone}</div>
                            <div className="text-sm text-gray-600 mt-1">
                                {currentTimeZone === 'LOCAL' ? '本地时间' : 'UTC时间'}
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-500 mb-1">当前页面</div>
                            <div className="text-lg font-medium text-gray-900">{currentPage}</div>
                            <div className="text-sm text-gray-600 mt-1">
                                {currentPage === 'spot_trading' ? '现货交易页面' : '其他页面'}
                            </div>
                        </div>
                    </div>

                    {/* 测试指南 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-blue-900 mb-2">🧪 测试指南</h4>
                        <div className="text-blue-800 space-y-2">
                            <p><strong>桌面端测试：</strong></p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>一栏式导航：左侧页面导航可滚动，右侧交易所和时区工具</li>
                                <li>点击交易所下拉，选择后立即高亮显示并更新状态</li>
                                <li>时区显示实时时间（精确到秒），每秒自动更新</li>
                                <li>点击菜单外部自动关闭下拉菜单</li>
                                <li>导航固定定位，滚动时紧贴主导航</li>
                            </ul>
                            
                            <p className="mt-3"><strong>移动端测试：</strong></p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>导航紧贴主导航，设置按钮打开完整菜单</li>
                                <li>菜单内容可滚动（overflow-y-auto），背景禁止滚动</li>
                                <li>选择交易所和时区后自动关闭菜单并更新状态</li>
                                <li>页面导航支持完整功能</li>
                            </ul>
                        </div>
                    </div>

                    {/* 技术实现说明 */}
                    <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-gray-900 mb-2">🔧 技术实现</h4>
                        <div className="text-gray-700 space-y-1">
                            <p>• <strong>一栏式设计：</strong>左侧页面导航，右侧工具栏</p>
                            <p>• <strong>状态同步：</strong>交易所选择后立即更新所有相关状态</p>
                            <p>• <strong>实时时间：</strong>使用setInterval每秒更新时区时间</p>
                            <p>• <strong>滚动控制：</strong>移动端菜单打开时禁止body滚动</p>
                            <p>• <strong>点击外部关闭：</strong>useEffect监听mousedown事件</p>
                            <p>• <strong>固定定位：</strong>fixed top-16紧贴主导航</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
});

TradeCenter.displayName = 'TradeCenter';

export default TradeCenter;