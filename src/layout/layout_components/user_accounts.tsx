/**
 * user accounts management component
 * use useAccountStore and backend API
 * mainfunctions:
 * 1. show platform user management panel and inform users to bind platform account
 * 2. show platform account information or login inform
 * 3. CEX accounts list(display, refresh, delete, connection test, add) and DEX accounts list
 * 4. add account form (embedded CexAccountForm/DexAccountForm)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    X,
    Plus,
    Trash2,
    Loader,
    User,
    CheckCircle,
    XCircle,
    Zap,
    RefreshCw,
    Clock,
    Mail,
    Phone,
    AlertTriangle
} from 'lucide-react'
import { useAccountStore } from '../../global_state_store/accounts_management_global_state_store';
import {
    type CexAccountResponse,
    type DexAccountResponse,
    // AuthUser is the real user shape returned from backend - reuse instead of duplicating
} from '../../services/accounts_management_api.service'
import { type AuthUser } from '../../services/auth_api.service';
import CexAccountForm from './user_accounts_connections/CEX/cex_account_form';
import DexAccountForm from './user_accounts_connections/DEX/dex_accounts_form';
import { userAuthStore } from '../../global_state_store/auth_global_state_store';
// current opened window type: add CEX / add DEX
type ModalType = 'add-cex' | 'add-dex' | null;

// API connection test response type (returned from backend / state store)
type ConnectionTestResult = {
    success: boolean;
    latencyMs?: number;
    errorMessage?: string;
};

// sub component: platform account information display 
const PlatformUserInfo: React.FC<{
    user: AuthUser;
    onEdit: () => void;
    onLogout: () => void;
}> = ({ user, onEdit, onLogout }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    return (
        <div className='bg-white border border-gray-100 rounded-lg p-4 mb-5'>
            {/** header */}
            <div className='flex items-center justify-between mb-3'>
                <p className='text-sm text-gray-900'>Platform Account</p>
                <div className='flex items-center gap-2'>
                    <button
                    onClick={onEdit}
                    className='text-blue-700 hover:text-blue-900 text-xs transition-colors'
                    >
                        Edit
                    </button>
                    <button
                    onClick={onLogout}
                    className='text-gray-600 hover:text-gray-900 text-xs transition-colors'
                    >
                        Logout
                    </button>
                    {!showDeleteConfirm ? (
                        <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className='text-red-600 hover:text-red-800 text-xs transition-colors'
                        >
                            Delete Account
                        </button>
                    ) : (
                        <div className='flex items-center gap-1'>
                            <button
                            onClick={() => {
                                // TODO: 实现删除账户 API
                                alert('Delete account API not yet implemented');
                                setShowDeleteConfirm(false);
                            }}
                            className='px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700'
                            >
                                Confirm
                            </button>
                            <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className='px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300'
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/** user information main content */}
            <div className='flex items-center gap-3'>
                {/** photo */}
                <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    {user.avatar ? (
                        <img src={user.avatar} alt="avatar" className='w-10 h-10 rounded-full object-cover' />
                    ):(
                        <User className='w-5 h-5 text-blue-600' />
                    )}
                </div>
                {/** user details */}
                <div className='flex-1 min-w-0'>
                    {/** username+enabled badge+role badge */}
                    <div className='flex items-center gap-2 flex-wrap'>
                        <span className='text-sm text-gray-900 truncate'>
                            {user.nickname || user.username}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full 
                            ${user.enabled ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-800'}
                        `}>
                            {user.enabled ? 'Active' : 'Disabled'}
                        </span>
                        <span className='px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full'>
                            {user.role}
                        </span>
                    </div>
                    {/** username+email+phone(with validation icon) */}
                    <div className='flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-400'>
                        <span className='flex items-center gap-1'>
                            <User className='w-3 h-3'/>
                            {user.username}
                        </span>
                        {user.email && (
                            <span className='flex items-center gap-1'>
                                <Mail className='w-3 h-3'/>
                                {user.email}
                            </span>
                        )}
                        {user.phone && (
                            <span className='flex items-center gap-1'>
                                <Phone className='w-3 h-3' />
                                {user.phone}
                                {user.phoneVerified && (
                                    <CheckCircle className='w-3 h-3 text-green-600'/>
                                )}
                            </span>
                        )}
                    </div>
                    {/** last login time */}
                    {user.lastLoginAt && (
                        <p className='text-xs text-gray-400 mt-1'>
                            last login: {new Date(user.lastLoginAt).toLocaleString()}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
// sub component 2: inform window when user do not login or register platform
const PlatformAccountLoginRegisterRequired: React.FC<{
    onBind: () => void;
}> = ({ onBind }) => (
    <div className='bg-blue-50 border border-blue-100 rounded-lg p-4 mb-5'>
        <div className='flex items-center gap-3'>
            <AlertTriangle className='w-5 h-5 text-blue-600 mt-1 flex-shrink-0'/>
            <div>
                {/** main alert content */}
                <p className='text-sm text-blue-800 mb-1'>
                    Please log in or register a platform account to connect exchange accounts and use more features.
                </p>
                {/** sub alert content */}
                <p className='text-xs text-blue-700 mb-3'>
                    A platform account is required to link exchange accounts for trading. Please create or bind a platform account first.
                </p>
                {/** action button */}
                <button
                onClick={onBind}
                className='px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors'
                >
                    Sign In / Register
                </button>
            </div>
        </div>
    </div>
);
// sub component 3: accounts connection status badge(according to the status and enabled characteristics to judge)
const StatusBadge: React.FC<{
    status: string;
    enabled: boolean;
}> = ({ status, enabled }) => {
    if (!enabled) {
        return (
            <span className='flex items-center gap-1 text-xs text-gray-400'>
                <XCircle className='w-3 h-3 '/>
                Disabled
            </span>
        );
    }
    // status and their color and text mapping
    const statusMap: Record<string, { label: string; colorClass: string }> = {
        active: { label: 'Active', colorClass: 'text-green-600' },
        inactive: { label: 'Inactive', colorClass: 'text-yellow-600' },
        suspended: { label: 'Suspended', colorClass: 'text-red-600' },
        expired: { label: 'Expired', colorClass: 'text-gray-600' },
    };
    // get configuration, default to gray
    const config = statusMap[status] || { label: status, colorClass: 'text-gray-600' };
    return (
        <span className={`flex items-center gap-1 text-xs ${config.colorClass}`}>
            <CheckCircle className='w-3 h-3'/>
            {config.label}
        </span>
    );
};
// sub component 4: CEX accounts card(display account information, connection test, delete action)
const CexAccountCard: React.FC<{
    account: CexAccountResponse;
    onDelete: (accountId: number) => void;
    onTest: (accountId: number) => void;
    isTesting: boolean;
}> = ({ account, onDelete, onTest, isTesting }) => {
    // local status
    const [confirmDelete, setConfirmDelete] = useState(false);
    return (
        <div className='border border-gray-100 rounded-lg p-3 bg-white hover:border-gray-100 transition-colors'>
            {/** account information+status badge */}
            <div className='flex items-start justify-between gap-2'>
                {/** account details information  */}
                <div className='min-w-0 flex-1'>
                    {/** account name */}
                    <p className='text-sm text-gray-800 truncate'>
                        {account.accountName}
                    </p>
                    {/** exchange name+account type+account environment */}
                    <div className='flex items-center gap-2 mt-1 flex-wrap'>
                        <span className='text-xs text-gray-500'>
                            {account.exchangeDisplayName}
                        </span>
                        <span className='px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded'>
                            {account.accountType}
                        </span>
                        {account.accountEnvironment !== 'live' && (
                            <span className='px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded'>
                                {account.accountEnvironment}
                            </span>
                        )}
                    </div>
                    {/** API Key mask(backend just return masked key) */}
                    {account.apiKeyMasked && (
                        <p className='mt-1 text-xs text-gray-500 truncate'>
                            API Key: {account.apiKeyMasked}
                        </p>
                    )}
                    {/** last connected time */}
                    {account.lastConnectedAt && (
                        <p className='mt-1 text-xs text-gray-500 flex items-center gap-1'>
                            <Clock className='w-3 h-3' />
                            {new Date(account.lastConnectedAt).toLocaleString()}
                        </p>
                    )}
                </div>
                {/** right: connection status badge */}
                <StatusBadge status={account.status} enabled={account.enabled} />
            </div>
            {/** bottom: action buttons */}
            <div className='flex items-center gap-2 mt-3'>
                {/** connection test button */}
                <button
                onClick={() => onTest(account.id)}
                disabled={isTesting}
                className='flex items-center gap-1 px-3 py-2 text-xs bg-blue-50 text-blue-700 
                rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50'
                >
                    {isTesting 
                    ? <Loader className='w-3 h-3 animate-spin' />
                    : <Zap className='w-3 h-3' />}
                    {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
                {/** delete button */}
                {!confirmDelete ? (
                    <button
                    onClick={() => setConfirmDelete(true)}
                    className='flex items-center gap-1 px-3 py-2 text-xs bg-gray-50 text-gray-600
                    rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors
                    '
                    >
                        <Trash2 className='w-3 h-3 '/>
                        Delete
                    </button>
                ) : (
                    // second confirmation
                    <div className='flex items-center gap-2'>
                        <span className='text-xs text-red-600'>Sure to delete?</span>
                        {/** confirm delete */}
                        <button
                        onClick={() => {
                            onDelete(account.id)
                            setConfirmDelete(false);
                        }}
                        className='px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors'
                        >
                            YES
                        </button>
                        {/** cancel delete */}
                        <button 
                        onClick={() => setConfirmDelete(false)}
                        className='px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors'
                        >NO</button>
                    </div>
                )}
            </div>
        </div>
    );
};
// sub component 5: DEX accounts card(display account information, delete action)
const DexAccountCard: React.FC<{
    account: DexAccountResponse;
    onDelete: (accountId: number) => void;
    onTest: (accountId: number) => void;
    isTesting: boolean;
}> = ({ account, onDelete, onTest, isTesting }) => {
    // local status
    const [confirmDelete, setConfirmDelete] = useState(false);
    // wallet address display with middle part masked
    const shortAddress = account.walletAddress.length > 12
    ? `${account.walletAddress.slice(0, 6)}...${account.walletAddress.slice(-4)}`
    : account.walletAddress;
    return (
        <div className='border border-gray-100 rounded-lg p-3 bg-white hover:border-gray-100 transition-colors'>
            {/** account information+status */}
            <div className='flex items-start justify-between gap-2'>
                {/** DEX platform name */}
                <p className='text-sm text-gray-800'>
                    {account.dexPlatform 
                    ? account.dexPlatform.charAt(0).toUpperCase() + account.dexPlatform.slice(1)
                : account.blockchainWebsiteDisplayName}
                </p>
                {/** chain name+wallet type */}
                <div className='flex items-center gap-2 mt-1 flex-wrap'>
                    <span className='text-xs text-gray-600'>
                        {account.blockchainWebsiteDisplayName}
                    </span>
                    <span className='px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded'>
                        {account.walletType}
                    </span>
                </div>
                {/** wallet address */}
                <p
                className='mt-1 text-xs text-gray-400 '
                title={account.walletAddress}
                >
                    {shortAddress}
                </p>
                {/** last connection time */}
                {account.lastConnectedAt && (
                    <p className='mt-1 text-xs text-gray-500 flex items-center gap-1'>
                        <Clock className='w-3 h-3'/>
                        {new Date(account.lastConnectedAt).toLocaleString()}
                    </p>
                )}
                {/** connection status badge */}
                <StatusBadge status={account.status} enabled={account.enabled} />
            </div>
            {/** action buttons */}
            <div className='flex items-center gap-2 mt-3'>
                <button
                onClick={() => onTest(account.id)}
                disabled={isTesting}
                className='flex items-center gap-1 px-3 py-2 text-xs bg-blue-50 text-blue-700
                rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50
                '
                >
                    {isTesting
                    ? <Loader className='w-3 h-3 animate-spin'/>
                : <Zap className='h-3 w-3 ' />}
                {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
                {/** delete button+second confirmation */}
                {!confirmDelete ? (
                    <button
                    onClick={() => setConfirmDelete(true)}
                    className='flex items-center gap-1 px-3 py-2 text-xs bg-gray-50 text-gray-600
                    rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors
                    '
                    >
                        <Trash2 className='w-3 h-3 '/>
                        Delete
                    </button>
                ) : (
                    <div className='flex items-center gap-2'>
                        <span className='text-xs text-red-600 '>Sure to delete?</span>
                        <button
                        onClick={() => { onDelete(account.id); setConfirmDelete(false) }}
                        className='px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors'
                        >
                            YES
                        </button>
                        <button
                        onClick={() => setConfirmDelete(false)}
                        className='px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-300 transition-colors'
                        >
                            NO
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
// sub component 6: add account window(modal container), render CexAccountForm or DexAccountForm according to the exchange type
const AddAccountModal: React.FC<{
    type: 'cex' | 'dex';
    onClose: () => void;
}> = ({ type, onClose }) => (
    // background overlay with click to close
    <div
    className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4'
    onClick={onClose}
    >
        {/** modal content container */}
        <div className='bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto '
        onClick={(event) => event.stopPropagation()}
        >
            {/** model title */}
            <div className='flex items-center justify-between mb-5'>
                <p className='text-gray-900 text-sm p-4'>
                    {type === 'cex' ? 'Add CEX Account' : 'Add DEX Account'}
                </p>
                {/** close button */}
                <button
                onClick={onClose}
                className='p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors'
                aria-label='Close'
                >
                    <X className='w-4 h-4'/>
                </button>
            </div>
            {/** render form component according to type */}
            {type === 'cex' ? (
                <CexAccountForm onSuccess={onClose} onCancel={onClose}/>
            ) : (
                <DexAccountForm onSuccess={onClose} onCancel={onClose}/>
            )}
        </div>
    </div>
);

// main component: user accounts(accept openAccountWindow and closeAccountWindow, currentUser props from Layout)
const UserAccounts: React.FC<{
    openAccountWindow: boolean;
    closeAccountWindow: () => void;
    currentUser?: AuthUser;
}> = ({ openAccountWindow, closeAccountWindow, currentUser }) => {
    // unpack all states from Zustand store
    const {
        cexAccounts,
        dexAccounts,
        isLoadingCex,
        isLoadingDex,
        isSubmitting, // if has form is submitting, avoid submit again
        testingConnectionIds,
        cexError,
        dexError,
        fetchCexAccounts,
        fetchDexAccounts,
        deleteCexAccount,
        deleteDexAccount,
        testCexAccountConnection,
        testDexAccountConnection,
        clearErrors
    } = useAccountStore();
    // type of current opened window
    const [modal, setModal] = useState<ModalType>(null)
    const [testResults, setTestResults] = useState<Record<number, { success: boolean; message: string }>>({});
    // if modal opened and user has logined, fetch account data from backend 
    useEffect(() => {
        if (openAccountWindow && currentUser) {
            fetchCexAccounts();
            fetchDexAccounts();
        }
    }, [openAccountWindow, currentUser, fetchCexAccounts, fetchDexAccounts]);
    // dependent array: restart when openAccountWindow or currentUser changes, to ensure data is up to date when user open the account management window

    // auto-refresh account lists after page reload or login
    useEffect(() => {
        if (currentUser) {
            fetchCexAccounts();
            fetchDexAccounts();
        }
    }, [currentUser, fetchCexAccounts, fetchDexAccounts]);

    // close modal handler: clear form status and errors
    const handleCloseModal = useCallback(() => {
        clearErrors();
        closeAccountWindow();
    }, [clearErrors, closeAccountWindow]);
    // CEX account connection test handler
    const handleTestCexConnection = useCallback(async (accountId: number) => {
        // call the method of store, and the store will put id into testingConnectionIds
        const result = (await testCexAccountConnection(accountId)) as ConnectionTestResult;
        // test result will be written in local testResults for display
        setTestResults((prev) => ({
            ...prev,
            [accountId]: {
                success: result.success,
                message: result.success
                    ? `Latency: ${result.latencyMs ?? '-'}ms`
                    : (result.errorMessage ?? 'Connection failed'),
            },
        }));
        // clear test result after 5 seconds
        setTimeout(() => {
            setTestResults((prev) => {
                const next = {...prev};
                delete next[accountId];
                return next;
            });
        }, 5000)
    }, [testCexAccountConnection]);
    // DEX account connection test handler
    const handleTestDexConnection = useCallback(async (accountId: number) => {
        const result = await testDexAccountConnection(accountId);
        setTestResults((prev) => ({
            ...prev,
            [accountId]: {
                success: result.success,
                message: result.success
                ? 'Connected Successfully'
                : (result.errorMessage ?? 'Connection failed'),
            },
        }));
        // clear test result after 5 seconds
        setTimeout(() => {
            setTestResults((prev) => {
                const next = {...prev};
                delete next[accountId];
                return next;
            });
        }, 5000)
    }, [testDexAccountConnection]);
    // performance optimization: when the modal is closed, do not render any DOM
    if (!openAccountWindow) return null;
    
    // main render
    return (
        <>
        {/** main accounts management modal */}
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'>
            {/** modal main content */}
            <div className='bg-white w-full h-full sm:w-[450px] flex flex-col'>
                {/** header */}
                <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0'>
                    <span className='text-base text-gray-900'>
                        Account Management
                    </span>
                    {/** close button */}
                    <button
                    onClick={handleCloseModal}
                    className='p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors'
                    aria-label='Close account management panel'
                    >
                        <X className='w-5 h-5' />
                    </button>
                </div>
                {/** content can be rolled */}
                <div className='flex-1 overflow-y-auto px-5 py-3'>
                    {/** situation 1: user do not login, inform user to login or register */}
                    {!currentUser ? (
                        <PlatformAccountLoginRegisterRequired
                        onBind={() => userAuthStore.getState().openAuthModal('login')}
                        />
                    ) : (
                        // situation 2: user has logined, show complete accounts management panel
                        <>
                        {/** platform user information card */}
                        <PlatformUserInfo
                        user={currentUser}
                        onEdit={() => {
                            // TODO: 实现编辑平台账户功能（需要后端编辑用户 API）
                            alert('User profile editing feature is under development.\nPlease use the admin panel to modify user information.');
                        }}
                        onLogout={() => {
                            if (confirm('Are you sure you want to logout?')) {
                                userAuthStore.getState().logout();
                                // 清空账户数据
                                clearErrors();
                            }
                        }}
                        />
                        {/** ================CEX accounts content=============== */}
                        <section>
                            {/** title line: left(title+ammount+refresh button); right(add button) */}
                            <div className='flex items-center justify-between mb-3'>
                                {/** left */}
                                <div className='flex items-center gap-2'>
                                    <span className='text-sm text-gray-800'>
                                        CEX Accounts
                                    </span>
                                    <span className='px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded-full'>
                                        {cexAccounts.length}
                                    </span>
                                    <button 
                                    onClick={fetchCexAccounts}
                                    disabled={isLoadingCex}
                                    className='text-gray-500 hover:text-gray-700 disabled:opacity-40 transition-colors'
                                    aria-label='Refresh CEX accounts'
                                    >
                                        <RefreshCw className={`w-3 h-3 ${isLoadingCex ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                {/** right: add account button */}
                                <button
                                onClick={() => setModal('add-cex')}
                                disabled={isSubmitting}
                                className='flex items-center gap-1 px-3 py-2 text-xs
                                bg-blue-500 text-white rounded-lg hover:bg-blue-600
                                transition-colors disabled:opacity-50
                                '
                                >
                                    <Plus className='w-3 h-3' />
                                    Add CEX
                                </button>
                            </div>
                            {/** CEX operations error information */}
                            {cexError && (
                                <div className='mb-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700'>
                                    {cexError}
                                </div>
                            )}
                            {/** render CEX accounts list(three status: loading, enpty, show data list) */}
                            {isLoadingCex ? (
                                 // loading state
                                 <div className='flex items-center justify-center py-10 text-gray-500'>
                                    <Loader className='w-5 h-5 animate-spin mr-2' />
                                    <span className='text-sm'>Loading...</span>
                                 </div>
                            ) : cexAccounts.length === 0 ? (
                                // empty list state
                                <div className='py-10 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg'>
                                    No CEX accounts connected. Please add an account.
                                    <br />
                                    <button 
                                    onClick={() => setModal('add-cex')}
                                    className='mt-2 text-blue-700 hover:underline text-xs'
                                    >
                                        Add CEX Account
                                    </button>
                                </div>  
                            ) : (
                                // if has data, render accounts list
                                <div className='space-y-2 '>
                                    {cexAccounts.map((account) => (
                                        <div key={account.id}>
                                            {/** CEX account card */}
                                            <CexAccountCard
                                            account={account}
                                            onDelete={deleteCexAccount}
                                            onTest={handleTestCexConnection}
                                            isTesting={testingConnectionIds.has(account.id)}
                                            />
                                            {/** test connection result inform(green for success, red for failure) */}
                                            {testResults[account.id] && (
                                                <p className={`mt-1 ml-1 text-xs
                                                    ${testResults[account.id].success
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                    }
                                                    `}>
                                                        {testResults[account.id].success ? '✔️' : '✖️'}{' '}
                                                        {testResults[account.id].message}
                                                    </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                        {/** ================DEX accounts section =============== */}
                        <section>
                            {/** title */}
                            <div className='flex items-center justify-between mb-3'>
                                <div className='flex items-center gap-2'>
                                    <span className='text-sm text-gray-800'>
                                        DEX Accounts
                                    </span>
                                    {/** accounts amount badge */}
                                    <span className='px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded-full'>
                                        {dexAccounts.length}
                                    </span>
                                    {/** refresh button */}
                                    <button
                                    onClick={fetchDexAccounts}
                                    disabled={isLoadingDex}
                                    className='text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors'
                                    aria-label='Refresh DEX accounts'
                                    >
                                        <RefreshCw className={`w-3 h-3 ${isLoadingDex ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                {/** add DEX account button  */}
                                <button 
                                onClick={() => setModal('add-dex')}
                                disabled={isSubmitting}
                                className='flex items-center gap-1 px-3 py-2 text-xs 
                                bg-indigo-500 text-white rounded-lg hover:bg-indigo-600
                                transition-colors disabled:opacity-50
                                '
                                >
                                    <Plus className='w-3 h-3' />
                                    Add DEX
                                </button>
                            </div>
                            {/** DEX operation error inform */}
                            {dexError && (
                                <div className='mb-3 px-3 py-2 bg-red-50 border border-red-50 rounded-lg text-xs text-red-700'>
                                    {dexError}
                                </div>
                            )}
                            {/** render DEX accounts list */}
                            {isLoadingDex ? (
                                <div className='flex items-center justify-center py-10 text-gray-500'>
                                    <Loader className='w-5 h-5 animate-spin mr-2'/>
                                    <span className='text-sm'>Loading...</span>
                                </div>
                            ) : dexAccounts.length === 0 ? (
                                <div className='py-10 text-center text-sm text-gray-400 border border-dashed border-gray-100 rounded-lg'>
                                    No DEX accounts connected. Please add an account.
                                    <br />
                                    <button
                                    onClick={() => setModal('add-dex')}
                                    className='mt-2 text-indigo-600 hover:underline text-xs'
                                    >
                                        Add DEX Account
                                    </button>
                                </div>
                            ) : (
                                <div className='space-y-2'>
                                    {dexAccounts.map((account) => (
                                        <div
                                        key={account.id}
                                        >
                                            <DexAccountCard
                                            account={account}
                                            onDelete={deleteDexAccount}
                                            onTest={handleTestDexConnection}
                                            isTesting={testingConnectionIds.has(account.id)}
                                            />
                                            {/** text results inform */}
                                            {testResults[account.id] && (
                                                <p className={`mt-1 ml-1 text-xs
                                                    ${testResults[account.id].success
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                    }
                                                    `}>
                                                        {testResults[account.id].success ? '✔️' : '✖️'}{' '}
                                                        {testResults[account.id].message}
                                                    </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                        </>
                    )}
                </div>
                {/** main content end */}
            </div>
            {/** accounts modal end */}
        </div>
        {/** main modal end */}
        {/** add account window, show above main modal, use z-[60]
         * rendered when modal is not null, otherwise do not load DOM
         */}
         {modal && (
            <AddAccountModal
            type={modal === 'add-cex' ? 'cex' : 'dex'}
            onClose={() => setModal(null)}
            />
         )}
        </>
    );
};

export default UserAccounts;