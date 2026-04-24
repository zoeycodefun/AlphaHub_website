import React, {useState, useCallback, useRef, memo} from 'react';
import axios, {type CancelTokenSource } from 'axios';

/**
 * search bar component: global search functionality, search for things in the current page, support fuzzy matching (intelligent search extension)
 * search results appear in a popup, not occupying the main page
 * search window has search bar, 
 */

interface SearchResult {
    id: string;
    title: string;
    description: string;
    category: string;
    url?: string;
}

interface SearchApiResponse {
    results: SearchResult[];
    totalCount: number;
    searchQuery: string;
}

const useSearch = () => {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = useCallback(async (query: string, cancelToken: CancelTokenSource) => {
        if (!query.trim()){
            setError('The search query cannot be empty.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResults([]);

        try {
            const response = await axios.get<SearchApiResponse>('/api/search/global', {
                params: { query: query.trim()},
                cancelToken: cancelToken.token,
                timeout: 5000,
            });
            setResults(response.data.results);
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

    const clearSearch = useCallback(() => {
        setResults([]);
        setError(null);
        setIsLoading(false);
    }, []);

    return { results, isLoading, error, search, clearSearch, setError };
};

const SearchBar: React.FC = memo(()=> {
    const [ showSearchWindow, setShowSearchWindow] = useState(false);
    const [ searchKeywordQuery, setSearchKeywordQuery] = useState('');
    const { results, isLoading, error, search, clearSearch, setError } = useSearch();
    const cancelTokenRef = useRef<CancelTokenSource | null>(null);
    
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
        const newCancelToken = axios.CancelToken.source();
        cancelTokenRef.current = newCancelToken;
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

    const handleResultClick = useCallback((result: SearchResult) => {
        if (result.url) {
            window.open(result.url, '_blank');
        }
        closeSearchWindow();
    }, [closeSearchWindow]);

    return (
        <>
        <button
        onClick={openSearchWindow}
        className='p-2 text-muted hover:text-primary hover:bg-surface-hover/50 rounded-lg transition-colors 
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

        {showSearchWindow && (
            <div
            className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-16 transition-opacity duration-300'
            onClick={closeSearchWindow}
            role='dialog'
            aria-modal='true'
            aria-labelledby='search-dialog-title'
            >
                <div
                className='w-full max-w-2xl bg-card rounded-lg shadow-2xl max-h-[80vh] overflow-hidden mx-4'
                onClick={(event) => event.stopPropagation()}
                >
                    <header
                    className='flex items-center justify-between p-4 border-b border-strong 
                    bg-surface rounded-t-lg 
                    '
                    >
                        <span className='text-xl text-primary'>Global Search</span>
                        <button
                        onClick={closeSearchWindow}
                        className='p-2 text-muted hover:text-muted hover:bg-surface-hover/50 
                        rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                        '
                        aria-label='close search window'
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </header>
                    <div className='p-4 border-b border-strong'>
                        <div className='flex gap-2'>
                            <div className='flex-1 relative'>
                                <input 
                                type="text"
                                value={searchKeywordQuery}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyboardDown}
                                placeholder='please input searching keyword...'
                                className='w-full px-2 py-3 pl-12 border border-strong rounded-full
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200
                                '
                                disabled={isLoading}
                                aria-describedby={error ? 'search-error-message' : undefined}
                                autoFocus
                                />
                                <svg className="absolute left-3 top-3.5 w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            <button
                            onClick={conductSearch}
                            disabled={isLoading || !searchKeywordQuery.trim()}
                            className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed
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
                                    Search
                                    </>
                                )}
                             </button>
                        </div>
                        {error && (
                            <p
                            id='search-error'
                            className='mt-2 text-sm text-red-600 bg-red-900/30 p-2 rounded-md'
                            role='alert'
                            >
                                {error}
                            </p>
                        )}
                    </div>

                    <main
                    className='overflow-y-auto max-h-96 p-4 scrollbar-hide '
                    >
                        {results.length > 0 ? (
                        <ul
                        className='divide-y divide-base'
                        role='listbox'

                        >
                            {results.map((result) => (
                                <li
                                key={result.id}
                                className='p-4 hover:bg-surface cursor-pointer transition-colors duration-200
                                focus:outline-none focus:bg-surface
                                '
                                onClick={() => handleResultClick(result)}
                                role='option'
                                tabIndex={0}
                                onKeyDown={(event) => event.key === 'Enter' && handleResultClick(result)}
                                >
                                    <div className='flex items-center justify-between'>
                                        <div className='flex-1'>
                                            <h3 className='text-sm text-primary mb-1'>{result.title}</h3>
                                            <p className='text-sm text-muted mb-2'>{result.description}</p>
                                            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-900/40 text-blue-300'>
                                                {result.category}
                                            </span>
                                        </div>
                                        <svg className="w-5 h-5 text-muted ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>

                                    </div>
                                </li>
                            ))}
                        </ul>
                    ):isLoading ? (
                        <div className='flex items-center justify-center py-12'>
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                             <span className='ml-3 text-muted'>Searching...</span>
                        </div>
                    ):searchKeywordQuery ? (
                        <div className='text-center py-12'>
                            <svg className="mx-auto h-12 w-12 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className='mt-2 text-dim'>Do not find matching results</p>
                        </div>
                    ):(
                        <div className='text-center py-12'>
                            <svg className="mx-auto h-12 w-12 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className='mt-2 text-dim'>Please input keywords for searching</p>
                        </div>
                    )}
                    </main>
                </div>
            </div>
        )}
        </>
    );
}) ;

SearchBar.displayName = 'SearchBar';
export default SearchBar;