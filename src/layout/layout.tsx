import React, { memo, useState, useCallback} from 'react';
import { Outlet, Link, useLocation} from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Navigation from './layout_components/navigation';
import MarketSelector from './layout_components/market_selector';
import LanguageSwitcher from './layout_components/language_switcher';
import SearchBar from './layout_components/search_bar';
import UserAccounts from './layout_components/user_accounts';


// layout布局：包含顶栏（系统名，市场选择，导航，语言切换，搜索，用户账户；以及下面的内容区）


const Layout: React.FC = memo(() => {
  const [isUserAccountsWindowOpen, setIsUserAccountsWindowOpen] = useState<boolean>(false);
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState<boolean>(false);
  const currentLocation = useLocation();

  // 触发函数
  const handleUserAccountsToggle = useCallback(() => {
    setIsUserAccountsWindowOpen((prev) => !prev);
  }, []);
  const handleMobileNavigationToggle = useCallback(() => {
    setIsMobileNavigationOpen((prev) => !prev);
  }, []);
  const handleMobileNavigationClose = useCallback(() => {
    setIsMobileNavigationOpen(false);
  }, [])
  const navigationItems = [
    {
      id: 'dashboard',
      path: '/',
      label: '首页Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
        </svg>
      ),
    },
    {
      id: 'market_info',
      path: '/market_info',
      label: '市场信息',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'investment_research',
      path: '/investment_research',
      label: '投资研究',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      id: 'trading_center',
      path: '/trading_center',
      label:'交易中心',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      badge: 'Core',
    },

  ];

  return (
    <div className='min-h-screen bg-gray-50 '>
      <header className='fixed w-full top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 '>
        <div className='w-full px-4 '>
          <div className='flex items-center justify-between h-16'>
            {/** 移动端导航，系统名称，市场选择 */}
            <div className='flex items-center space-x-3'>
              {/** 移动端导航菜单 */}
              <button
              onClick={handleMobileNavigationToggle}
              className='md:hidden rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200 
              '
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileNavigationOpen}
              >
                <Menu className='w-6 h-6' />
              </button>
              <span className='text-[14px] lg:text-[20px] font-bold text-gray-900'>
                AlphaHub</span>
                <MarketSelector/>
            </div>
            {/** 桌面端导航 */}
            <div className='hidden md:w-[370px] lg:w-[550px] xl:w-[850px] md:flex flex items-center overflow-x-auto'>
              <Navigation/>
            </div>
            {/** 功能按钮区域 */}
            <div className='flex items-center space-x-3 lg:space-x-5'>
              <LanguageSwitcher/>
              <SearchBar/>
              <button
              onClick={handleUserAccountsToggle}
              className='flex items-center px-2 py-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:ring-offset-2'
              aria-label="open users accounts menu"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className='hidden sm:inline '>账户</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      {/** 主内容区域 */}
      <main className='pt-20 pb-8 px-4'>
        <div className='max-w-7xl mx-auto'>
          <Outlet/>
        </div>
      </main>
      {/** 移动端导航弹窗 */}
      {isMobileNavigationOpen && (
        <div
        className='fixed inset-0 z-50 md:hidden'
        role='dialog'
        aria-modal="true"
        aria-label="Mobile navigation menu"
        >
          {/** 背景遮罩 */}
          <div
          className='fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300'
          onClick={handleMobileNavigationClose}
          >
            {/** 导航面板 - 居中固定小窗 */}
            <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 max-w-sm bg-white rounded-lg shadow-xl transition-all duration-300 ease-in-out'
            onClick={(event) => event.stopPropagation()}
            >
              {/** 弹窗头部 */}
              <div className='flex items-center justify-between p-4 border-b border-gray-100 rounded-t-lg'>
                <span className='text-sm font-medium text-gray-900'>导航菜单</span>
                <button
                onClick={handleMobileNavigationClose}
                className='p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500
                '
                aria-label="Close navigation menu"
                >
                  <X className='w-5 h-5'/>
                </button>
              </div>
              {/** 导航项列表 */}
              <nav className='max-h-96 overflow-y-auto scrollbar-hide py-2'
              role="navigation"
              >
                {navigationItems.map((item) => {
                  const isActive = currentLocation.pathname === item.path;
                  return (
                    <Link
                    key={item.id}
                    to={item.path}
                    onClick={handleMobileNavigationClose}
                    className={`flex items-center px-4 py-3 border-b border-gray-100 transition-colors duration-200
                      ${isActive ? 'bg-blue-50 text-blue-800 border-blue-200' : 'text-gray-900 hover:bg-gray-50 hover:text-gray-700'}
                      `}
                    aria-current={isActive ? 'page' : undefined}
                    >
                      <span className='mr-3 flex-shrink-0 text-gray-500 '>
                        {item.icon}
                      </span>
                      <span className='flex-1 '>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className='px-2 py-1 text-xs rounded-full bg-red-50 text-red-800'>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

        </div>
      )}
      {/** 用户账户弹窗 */}
      <UserAccounts
      openAccountWindow={isUserAccountsWindowOpen}
      closeAccountWindow={() => setIsUserAccountsWindowOpen(false)}/>
    </div>
  );
});
Layout.displayName = 'Layout'; // debug
export default Layout;