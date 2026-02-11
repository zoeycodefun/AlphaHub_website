import React, {useState, useCallback, useRef, memo} from 'react';
import axios, {type CancelTokenSource } from 'axios';

/**
 * 搜索栏组件：全局搜索的功能，全局搜索，在当前进入的界面显示搜索的东西，支持模糊匹配（智能搜索拓展）
 * 搜索结果以弹窗的形式出现，不占据主页面
 * 弹窗内有搜索栏，输入关键词后端调用模糊匹配数据库内容，搜索结果弹窗下方显示，支持滑动浏览
 */

// 定义搜索结果的接口确保类型安全
interface SearchResult {
    id: string;
    title: string;
    description: string;
    category: string;
    url?: string;
}

// 定义API响应接口
interface SearchApiResponse {
    results: SearchResult[];
    totalCount: number;
    searchQuery: string;
}

// 封装搜索逻辑以复用
const useSearch = () => {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 搜索函数：useCallback减少重渲染
    const search = useCallback(async (query: string, cancelToken: CancelTokenSource) => {
        if (!query.trim()){
            setError('The search query cannot be empty.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResults([]);

        try {
            // 后端API支持请求取消
            const response = await axios.get<SearchApiResponse>('/api/search/global', {
                params: { query: query.trim()},
                cancelToken: cancelToken.token,
                timeout: 5000, // 设置请求超时时间为5秒
            });
            setResults(response.data.results); // 更新搜索结果
        } catch (err) {
            if (axios.isCancel(err)) {
                console.log('Search request canceled');
                return;
            }
            console.error('Search error:', err);
            setError('An error occurred while searching. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);
    // 清空搜索状态
    const clearSearch = useCallback(() => {
        setResults([]);
        setError(null);
        setIsLoading(false);
    }, []);

    return { results, isLoading, error, search, clearSearch, setError };
};
// 搜索栏组件：类型安全，性能优化，错误处理，可取消请求，无障碍支持

const SearchBar: React.FC = memo(()=> { // 优化重渲染
    const [ showSearchWindow, setShowSearchWindow] = useState(false);
    const [ searchKeywordQuery, setSearchKeywordQuery] = useState('');
    const { results, isLoading, error, search, clearSearch, setError } = useSearch();
    const cancelTokenRef = useRef<CancelTokenSource | null>(null); // 改为useRef，初始为null
    
    const openSearchWindow = useCallback(() => {
        setShowSearchWindow(true);
        setSearchKeywordQuery('');
        clearSearch();
    }, [clearSearch]);

    const closeSearchWindow = useCallback(() => {
        if (cancelTokenRef.current) {
            cancelTokenRef.current.cancel('Search window closed by user');
        }
        setShowSearchWindow(false);
    }, []);

    const conductSearch = useCallback(() => {
        // 执行搜索以后申请新的取消令牌
        const newCancelToken = axios.CancelToken.source();
        cancelTokenRef.current = newCancelToken; // 执行新令牌引用
        search(searchKeywordQuery, newCancelToken);
    }, [searchKeywordQuery, search])

    const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchKeywordQuery(event.target.value);
        if (error) setError (null);
    }, [error]);

    const handleKeyboardDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            conductSearch();
        } else if (event.key === 'Escape') {
            closeSearchWindow();
        }
    }, [conductSearch, closeSearchWindow]);

    // 搜索处理结果点击：‼️跳转逻辑拓展
    const handleResultClick = useCallback((result: SearchResult) => {
        if (result.url) {
            window.open(result.url, '_blank');
        }
        // ‼️ 路由跳转与内容显示
        closeSearchWindow();
    }, [closeSearchWindow]);

    return (
        <>
        {/** 顶栏搜索按钮（无障碍） */}
        <button
        onClick={openSearchWindow}
        className='p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors 
        duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 
        focus:ring-offset-2
        '
        aria-label='open global search'
        title='global search'
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </button>

        {/** 搜索弹窗(Portal性能提升) */}
        {showSearchWindow && (
            // 遮蔽罩
            <div
            className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-16 transition-opacity duration-300'
            onClick={closeSearchWindow}
            role='dialog'
            aria-modal='true'
            aria-labelledby='search-dialog-title'
            >
                {/** 弹窗内容区 */}
                <div
                className='w-full max-w-2xl bg-white rounded-lg shadow-2xl max-h-[80vh] overflow-hidden mx-4'
                onClick={(event) => event.stopPropagation()}
                >
                    {/** 弹窗头部顶栏 */}
                    <header
                    className='flex items-center justify-between p-4 border-b border-gray-200 
                    bg-gray-50 rounded-t-lg 
                    '
                    >
                        <span className='text-xl text-gray-900'>全局搜索</span>
                        <button
                        onClick={closeSearchWindow}
                        className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                        rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                        '
                        aria-label='close search window'
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </header>
                    {/** 搜索输入与输出区 */}
                    <div className='p-4 border-b border-gray-200'>
                        <div className='flex gap-2'>
                            <div className='flex-1 relative'>
                                <input 
                                type="text"
                                value={searchKeywordQuery}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyboardDown}
                                placeholder='请输入搜索关键词...'
                                className='w-full px-2 py-3 pl-12 border border-gray-300 rounded-full
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200
                                '
                                disabled={isLoading}
                                aria-describedby={error ? 'search-error-message' : undefined}
                                autoFocus
                                />
                                <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            <button
                            onClick={conductSearch}
                            disabled={isLoading || !searchKeywordQuery.trim()}
                            className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                            transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                            flex items-center gap-2
                            '
                            aria-label='execute search'
                             >
                                {isLoading ? (
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ):(
                                    <>
                                    搜索
                                    </>
                                )}
                             </button>
                        </div>
                        {/** 错误信息显示 */}
                        {error && (
                            <p
                            id='search-error'
                            className='mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md'
                            role='alert'
                            >
                                {error}
                            </p>
                        )}
                    </div>

                    {/** 搜索结果显示区 */}
                    <main
                    className='overflow-y-auto max-h-96 p-4 scrollbar-hide '
                    >
                        {results.length > 0 ? (
                        <ul
                        className='divide-y divide-gray-100'
                        role='listbox'

                        >
                            {results.map((result) => (
                                <li
                                key={result.id}
                                className='p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200
                                focus:outline-none focus:bg-gray-50
                                '
                                onClick={() => handleResultClick(result)}
                                role='option'
                                tabIndex={0}
                                onKeyDown={(event) => event.key === 'Enter' && handleResultClick(result)}
                                >
                                    <div className='flex items-center justify-between'>
                                        <div className='flex-1'>
                                            <h3 className='text-sm text-gray-900 mb-1'>{result.title}</h3>
                                            <p className='text-sm text-gray-600 mb-2'>{result.description}</p>
                                            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800'>
                                                {result.category}
                                            </span>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>

                                    </div>
                                </li>
                            ))}
                        </ul>
                    ):isLoading ? (
                        <div className='flex items-center justify-center py-12'>
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                             <span className='ml-3 text-gray-600'>搜索中...</span>
                        </div>
                    ):searchKeywordQuery ? (
                        <div className='text-center py-12'>
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className='mt-2 text-gray-500'>未找到匹配结果</p>
                        </div>
                    ):(
                        <div className='text-center py-12'>
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className='mt-2 text-gray-500'>请输入关键词开始搜索</p>
                        </div>
                    )}
                    </main>
                </div>
            </div>
        )}
        </>
    );
}) ;

SearchBar.displayName = 'SearchBar'; // 调试
export default SearchBar;