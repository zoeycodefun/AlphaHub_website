// all accounts management

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Plus, Link, Settings, Trash2, Loader} from 'lucide-react'


interface Exchange {
    id: string;
    name: string; 
    type: 'CEX' | 'DEX' | 'OTHER';
    isConnected: boolean;
}

interface ExchangeAccount {
    id: string; 
    exchangeId: string;
    name: string;
    apiKey? : string;
    apiSecretKey?: string;
    walletAddress?: string;
    createdAt: Date;
    lastConnectedAt?: Date; 
    isConnecting?: boolean;
}
type AccountType = 'CEX' | 'DEX' | 'OTHER';
type operateWindowType = 'connect' | 'add' | 'manage' | null;


const EXCHANGE_TYPES = {
    CEX: '中心化交易所',
    DEX: '去中心化交易所',
    OTHER: '其他账户',
} as const;

const EXCHANGES: Exchange[] = [
    // CEX
    { id: 'binance', name: 'Binance', type: 'CEX', isConnected: false},
    { id: 'okx', name: 'OKX', type: 'CEX', isConnected: false},
    // DEX
    { id: 'hyperliquid', name: 'Hyperliquid', type: 'DEX', isConnected: false},

    // OTHER
];

const UserAccounts: React.FC<{ openAccountWindow: boolean; closeAccountWindow: () => void }> = ({
    openAccountWindow,
    closeAccountWindow,
}) => {
    
    const [activeExchangeType, setActiveExchangeType] = useState<AccountType>('CEX');
    const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
    const [activeOperateWindow, setActiveOperateWindow] = useState<operateWindowType>(null);
    const [allAccounts, setAllAccounts] = useState<ExchangeAccount[]>([]);

    
    useEffect(() => {
        const savedAccounts = localStorage.getItem('exchangeAccounts');
        if (savedAccounts) {
            try {
                const accounts_parsed = JSON.parse(savedAccounts);
                setAllAccounts(
                    accounts_parsed.map((account: any) => ({
                    ...account,
                    createdAt: new Date(account.createdAt),
                    lastConnectedAt: account.lastConnected ? new Date(account.lastConnected) : undefined,
                    isConnecting: false,
                }))
            );
            } catch (error) {
                console.error('Failed to load accounts:', error);
            }
        }
    }, []);

    const saveAccounts = useCallback((newAccounts: ExchangeAccount[]) => {
        setAllAccounts(newAccounts);
        localStorage.setItem('exchangeAccounts', JSON.stringify(newAccounts));
    }, []);
    
    
    
    const filteredExchanges = useMemo(
        () => EXCHANGES.filter((exchange) => exchange.type === activeExchangeType),
        [activeExchangeType]
    );

    const getExchangeAccounts = useCallback(
        (exchangeId: string) => allAccounts.filter((account) => account.exchangeId === exchangeId),
        [allAccounts]
    );

    
    // connect account function
    const handleConnectAccount = useCallback(
        async (acc: ExchangeAccount) => {
            setAllAccounts((prevAccount) => (
                prevAccount.map((account) => 
                account.id === acc.id ? {
                    ...account, isConnecting: true
                } : account
                )
            ));
            try {
                
                await new Promise((reslove, reject) => {
                    setTimeout(() => Math.random() > 0.2 ? reslove(true) :
                reject(new Error('Connection failded: Please check API credentials or network.')), 2000);
            });
            const updatedAccounts = allAccounts.map((account) => (
                account.id === account.id
                ? { ...account, lastConnectedAt: new Date(), isConnecting: false }
                : account));
                saveAccounts(updatedAccounts);
                setActiveOperateWindow(null);
            } catch (error) {
                console.error('Failed to connect account:', error);
                setAllAccounts((prevAccounts) => 
                    prevAccounts.map((account) => 
                    account.id === account.id ? { ...account, isConnecting: false} : account
                    )
                );
                
            }
        }, [allAccounts, saveAccounts]
        );


    // add account function
    const handleAddAccount = useCallback(
        (exchangeId: string, accountData: Partial<ExchangeAccount>) => {
            const newAccount: ExchangeAccount = {
                id: `${exchangeId}_${Date.now()}`,
                exchangeId,
                name: accountData.name || `${EXCHANGES.find((exchange) => exchange.id === exchangeId)?.name} Account`,
                ...accountData,
                createdAt: new Date(),
            };
            saveAccounts([...allAccounts, newAccount]);
            setActiveOperateWindow(null);
        },
        [allAccounts, saveAccounts]
    );

    // delete account function
    const handleDeleteAccount = useCallback(
        (accountId: string) => {
            const updatedAccounts = allAccounts.filter((account) => account.id !== accountId);
            saveAccounts(updatedAccounts)
        }, [allAccounts, saveAccounts]
    );
    if (!openAccountWindow) return null;


    return (
        <div>
            
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                {/** main window */}
                <div className='bg-white rounded-xl w-full h-full md:h-auto md:max-w-4xl md:max-h-[80vh] md:h-[80vh] overflow-hidden flex flex-col 
                md:grid md:grid-rows-[auto-1fr] md:grid-cols-[1fr-3fr]
                '>
                    <div className='flex justify-between items-center p-4 border-b 
                    md:col-span-2
                    '>
                        <span className='text-lg md:text-xl '>账户管理</span>
                        <button
                        onClick={closeAccountWindow}
                        className='p-2 hover:bg-gray-200 rounded-full transition-colors '
                        aria-label="关闭账户管理弹窗"
                        >
                            <X className="w-6 h-6 md:w-7 md:h-7" />
                        </button>
                    </div>
                    {/** window content */}
                    <div className='w-full md:w-auto p-4 border-r md:border-r-0 md:border-b md:row-start-2'>
                            <nav className='flex flex-col space-y-2'>
                                {Object.entries(EXCHANGE_TYPES).map(([key, label]) => (
                                    <button
                                    key={key}
                                    onClick={() => setActiveExchangeType(key as AccountType)}
                                    className={`w-full md:w-auto p-3 text-left rounded-lg transiton-colors
                                        ${activeExchangeType === key ?
                                            'bg-blue-50'
                                            :'hover:bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </nav>
                    </div>
                    <div className='flex-1 p-4 overflow-y-auto scrollbar-hide md:row-start-2 md:col-start-2 min-h-0 min-h-[300px]'>
                        <h3 className='text-sm md:text-lg mb-4'>{EXCHANGE_TYPES[activeExchangeType]}列表</h3>
                        <div className='space-y-4 overflow-y-auto'>
                            {filteredExchanges.map((exchange)=> {
                                const exchangeAccounts = getExchangeAccounts(exchange.id);
                                return (
                                    <div
                                    key={exchange.id}
                                    className='border rounded-lg p-4'
                                    >
                                        {/** exchange */}
                                        <div className='flex flex-col justify-between items-start mb-4 '>
                                            <div>
                                                <div className='mb-2 flex flex-col '>
                                                    <span className='text-sm md:text-lg'>{exchange.name}</span>
                                                    <span>{exchangeAccounts.length}个账户</span>
                                                </div>
                                            </div>
                                            <div className='flex flex-wrap gap-3'>
                                                {/** connection */}
                                                <button
                                                onClick={() => {
                                                    setSelectedExchange(exchange)
                                                    setActiveOperateWindow('connect')
                                                }}
                                                className='flex items-center gap-2 px-3 py-2 md:px-4 md:py-2'
                                                >
                                                    <Link className='w-4 h-4'/>
                                                    连接账户
                                                    
                                                </button>
                                                {/** add account */}
                                                <button
                                                onClick={() => {
                                                    setSelectedExchange(exchange)
                                                    setActiveOperateWindow('add');
                                                }}
                                                className='flex items-center gap-2 px-3'
                                                >
                                                    <Plus className='w-4 h-4 '/>
                                                    新增账户
                                                </button>
                                                {/** manage account */}
                                                <button
                                                onClick={() => {
                                                    setSelectedExchange(exchange)
                                                    setActiveOperateWindow('manage');
                                                }}
                                                className='flex items-center gap-2 px-3 py-2 md:py-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors'
                                                >
                                                    <Settings className='w-4 h-4'/>
                                                    管理账户
                                                </button>
                                            </div>
                                        </div>
                                        {/** all connected accounts */}
                                        {exchangeAccounts.length > 0 && (
                                            <div
                                            className='text-sm text-gray-600'
                                            >
                                                已连接账户：{exchangeAccounts.map(account => account.name).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/** sub window of account window */}
            {activeOperateWindow === 'connect' && selectedExchange && (
                <ConnectAccountSubWindow
                exchange={selectedExchange}
                accounts={getExchangeAccounts(selectedExchange.id)}
                onConnect={handleConnectAccount}
                onClose={() => setActiveOperateWindow(null)}
                />
            )}
            {activeOperateWindow === 'add' && selectedExchange && (
                <AddAccountSubWindow
                exchange={selectedExchange}
                onAdd={(accountData) => handleAddAccount(selectedExchange.id, accountData)}
                onClose={() => setActiveOperateWindow(null)}
                />
            )}
            {activeOperateWindow === 'manage' && selectedExchange && (
                <ManageAccountSubWindow
                exchange={selectedExchange}
                accounts={getExchangeAccounts(selectedExchange.id)}
                onDelete={handleDeleteAccount}
                onClose={() => setActiveOperateWindow(null)}
                />
            )}
        </div>
    );
};
// connect account window
const ConnectAccountSubWindow: React.FC<{
    exchange: Exchange;
    accounts: ExchangeAccount[];
    onConnect: (account: ExchangeAccount) => void;
    onClose: () => void;
}> = ({
    exchange,
    accounts,
    onConnect,
    onClose
}) => {
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            {/** window */}
            <div className='bg-white rounded-lg max-w-md w-full p-4 md:p-6 flex flex-col'>
                <span className='text-lg mb-4'>连接{exchange.name}账户</span>
                {accounts.length === 0 ? (
                    <span className='text-gray-600'>暂无可连接账户，请先新增账户</span>
                ):(
                    // select account form
                    <div className='mb-4'>
                        <label className='block text-sm mb-2'>选择要连接的账户</label>
                        <select
                        value={selectedAccountId}
                        onChange={(event) => setSelectedAccountId(event.target.value)}
                        className='w-full p-3 border rounded-lg '
                        >
                            <option value="">请选择账户</option>
                            {accounts.map((account) => (
                                <option 
                                key = {account.id}
                                value = {account.id}
                                >{account.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                {/** bottom action buttons */}
                <div 
                className='flex flex-col sm:flex-row justify-end gap-2 mt-2'
                >
                    <button
                    onClick={onClose}
                    className='px-4 py-3 md:px-6 md:py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors'
                    >取消</button>
                    <button
                    onClick={()=>{
                        const account = accounts.find(account => account.id === selectedAccountId);
                        if (account) {
                            onConnect(account);
                        }
                    }}
                    disabled={!selectedAccountId}
                    className='px-4 py-3 md:px-6 md:py-2 bg-blue-50 rounded-full hover:bg-blue-100 disabled:opacity-50 transition-colors'
                    >
                        连接
                    </button>
                </div>
            </div>
        </div>        
    );
};

// add account window
const AddAccountSubWindow: React.FC<{
    exchange: Exchange;
    onAdd: (accountData: Partial<ExchangeAccount>) => void;
    onClose: () => void;
}> = ({
    exchange,
    onAdd,
    onClose
}) => {
    const [accountFormData, setAccountFormData] = useState({
        name: '',
        apiKey: '',
        apiSecretKey: '',
        walletAddress: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!accountFormData.name.trim()) newErrors.name = 'Account name is required';
        if (exchange.type === 'CEX') {
            if (!accountFormData.apiKey?.trim()) newErrors.apiKey = 'API Key is required';
            if (!accountFormData.apiSecretKey?.trim()) newErrors.apiSecretKey = 'Secret Key is required';
        } else if (!accountFormData.walletAddress?.trim()) {
            newErrors.walletAddress = 'Wallet address is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmitAccountInfo = (event: React.FormEvent) => {
        event.preventDefault();
        if (validateForm()) {
            onAdd(accountFormData);
            setAccountFormData({name: '', apiKey: '', apiSecretKey: '', walletAddress: ''});
        }
    };
    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-lg max-w-md w-full p-4 md:p-6'>
                <h3 className='text-lg mb-4'>新增{exchange.name}账户</h3>
                <form
                onSubmit={handleSubmitAccountInfo}
                className='space-y-4'
                action="">
                    <label
                    className='block text-sm mb-1'
                    >
                        账户名称
                    </label>
                    <input 
                    type="text"
                    value={accountFormData.name}
                    onChange={(event) => setAccountFormData({ ...accountFormData, name: event.target.value })}
                    className='w-full p-3 border rounded-full focus:outline-none'
                    placeholder='请输入账户名称'
                    required
                    />
                    {errors.name && <p className='text-red-500 text-sm mt-1'>{errors.name}</p>}
        
                        {exchange.type === 'CEX' && (
                            <>
                            <div>
                                <label
                                className='block text-sm mb-1'
                                >API Key</label>
                                <input 
                                type="text"
                                value={accountFormData.apiKey}
                                onChange={(event) => setAccountFormData({...accountFormData, apiKey: event.target.value})}
                                className='w-full p-3 border rounded-full focus:outline-none'
                                placeholder='请输入API Key'
                                required
                                />
                                {errors.apiKey && <p className='text-red-500 text-sm mt-1'>{errors.apiKey}</p>}
                            </div>
                            <div>
                                <label
                                className='block text-sm mb-1'
                                >Secret Key</label>
                                <input 
                                type="password"
                                value={ accountFormData.apiSecretKey}
                                onChange={(event) => setAccountFormData({...accountFormData, apiSecretKey: event.target.value})}
                                className='w-full p-3 border rounded-full focus:outline-none'
                                placeholder='输入Secret Key'
                                required
                                />
                                {errors.apiSecretKey && <p className='text-red-500 text-sm mt-1'>{errors.apiSecretKey}</p>}
                            </div>
                            </>
                        )}
                        {exchange.type === 'DEX' || exchange.type === 'OTHER' ? (
                            <div>
                                <label 
                                className='block text-sm mb-1'
                                >钱包地址</label>
                                <input 
                                type="text"
                                value={accountFormData.walletAddress}
                                onChange={(event) => setAccountFormData({...accountFormData, walletAddress: event.target.value})}
                                className='w-full p-3 border rounded-full focus:outline-none'
                                placeholder='输入钱包地址'
                                required
                                />
                                {errors.walletAddress && <p className='text-red-500 text-sm mt-1'>{errors.walletAddress}</p>}
                            </div>
                        ): null}
                        <div
                        className='flex flex-col sm:flex-row justify-end gap-2'
                        >
                            <button
                            type= "button"
                            onClick= {onClose}
                            className='px-4 py-3 md:px-6 md:py-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors'
                            >
                                取消
                            </button>
                            <button
                            type="submit"
                            className='px-4 py-3 md:py-2 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors'
                            >新增账户</button>
                        </div>
                </form>
            </div>
        </div>
    );
};
// manage account
const ManageAccountSubWindow: React.FC<{
    exchange: Exchange;
    accounts: ExchangeAccount[];
    onDelete: (accountId: string) => void;
    onClose: () => void;
}> = ({
    exchange,
    accounts,
    onDelete,
    onClose
}) => {
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    return (
        <div
        className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
        >
            <div 
            className='bg-white rounded-lg max-w-lg w-full p-4 md:p-6'
            >
                <h3 className='text-lg mb-4'>
                    管理{exchange.name}账户
                </h3>
                {accounts.length === 0 ? (
                    <span>暂无可管理账户，请先新增账户</span>

                ):(
                    
                    <div className='space-y-4'>
                        {accounts.map((account) => (
                            <div 
                            key={account.id}
                            className='flex justify-between items-center p-4 border rounded-lg'
                            >
                                <div className='flex-1'>
                                    <p className=''>{account.name}</p>
                                    <p className=''>创建时间：{account.createdAt.toLocaleDateString()}</p>
                                    {account.lastConnectedAt && (
                                    <p className=''>最后连接：{account.lastConnectedAt.toLocaleDateString()}</p>
                                )}
                                {account.isConnecting && (
                                    <div className='flex items-center gap-2 text-blue-100'>
                                        <Loader className='w-4 h-4 animate-spin'/>
                                        连接中...
                                    </div>
                                )}
                                </div>
                                <button
                                onClick={() => setDeleteConfirm(account.id)}
                                className='p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors'
                                aria-label="删除账户"
                                >
                                    <Trash2 className='w-4 h-4'/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className='flex justify-end mt-4'>
                    <button
                    onClick={onClose}
                    className='px-4 py-3 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors'
                    >
                        关闭
                    </button>
                </div>
            </div>
            {/** delete window */}
            {deleteConfirm && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-lg max-w-sm w-full p-4 md:p-6'>
                        <h4 className='text-lg mb-4'>确认删除</h4>
                        <p className='text-gray-600 mb-4'>确定要删除该账户吗？此操作不可撤销。</p>
                        <div className='flex flex-col sm:flex-row justify-end gap-2'>
                            <button
                            onClick={() => setDeleteConfirm(null)}
                            className='px-4 py-3 md:px-6 md:py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors'
                            >取消</button>
                            <button
                            onClick={() => {
                                onDelete(deleteConfirm)
                                setDeleteConfirm(null)
                            }}
                            className='px-4 py-3 md:px-6 md:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors'
                            >
                                删除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserAccounts;
