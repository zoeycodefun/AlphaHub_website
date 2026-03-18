// dex accounts binding form component
/**
 * dex account form: DEX accounts binding form component
 * responsible for letting users input and submit all parameters for binding their DEX accounts to the platform
 * DEX vs CEX: DEX just need wallet address(no API secret), but besides for Hyperliquid(it just need wallet address, but it will
 * generate a secret wallet address for placing orders, but do not have the permissions for other operations like withdrawing
 * it's secret wallet address need to be encrypted and stored in the database after encrypted)
 */
import React, { useState, useCallback, } from 'react';
import  { AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { useAccountStore } from '../../../../global_state_store/accounts_management_global_state_store';
import { type CreateDexAccountPayload } from '../../../../services/accounts_management_api.service';

// blockchain website configuration(cast to blockchainWebsiteId)
interface BlockchainWebsiteMeta {
    id: number;
    displayName: string;
    type: 'mainnet' | 'testnet';
    addressPrefix: string;
}
const BLOCKCHAIN_WEBSITE: BlockchainWebsiteMeta[] = [
    { id: 1, displayName: 'Ethereum Mainnet', type: 'mainnet', addressPrefix: '0x' },
    { id: 2, displayName: 'BNB Smart Chain', type: 'mainnet', addressPrefix: '0x' },
    { id: 3, displayName: 'Arbitrum One', type: 'mainnet', addressPrefix: '0x' },
    { id: 4, displayName: 'Optimism', type: 'mainnet', addressPrefix: '0x' },
    { id: 5, displayName: 'Polygon(MATIC)', type: 'mainnet', addressPrefix: '0x' },
    { id: 6, displayName: 'Hyperliquid L1', type: 'mainnet', addressPrefix: '0x' },
    { id: 99, displayName: 'Solana Mainnet', type: 'mainnet', addressPrefix: '' },
];
// DEX platform configuration(cast to dexPlatform enum)
interface DexPlatformMeta {
    id: string;
    displayName: string;
    recommendedNetworkId?: number;
}
const DEX_PLATFORMS: DexPlatformMeta[] = [
    { id: 'hyperliquid', displayName: 'Hyperliquid', recommendedNetworkId: 6 },
    { id: 'uniswap', displayName: 'Uniswap', recommendedNetworkId: 1 },
    { id: 'sushiswap', displayName: 'Sushiswap', recommendedNetworkId: 1 },
    { id: 'pancakeswap', displayName: 'Pancakeswap', recommendedNetworkId: 2 },
    { id: '1inch', displayName: '1inch', recommendedNetworkId: 1 },
    { id: 'other', displayName: 'Other', recommendedNetworkId: undefined },
];
// wallet type(cast to walletType enum)
const WALLET_TYPES = [
    { id: 'metamask', displayName: 'MetaMask' },
    { id: 'okx', displayName: 'OKX Web3 Wallet' },
    { id: 'trustwallet', displayName: 'Trust Wallet' },
    { id: 'coinbasewallet', displayName: 'Coinbase Wallet' },
    { id: 'phantomwallet', displayName: 'Phantom Wallet(Solana)' },
    { id: 'other', displayName: 'Other' },
] as const;
// form character type
interface DexFormFields {
    blockchainWebsiteId: number | '';
    dexPlatform: string;
    walletAddress: string;
    walletType: string;
    walletProvider: string;
    allowTrade: boolean;
}
type FormErrors = Partial<Record<keyof DexFormFields, string>>;
// main form component---DexAccountForm
interface DexAccountFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}
const DexAccountForm: React.FC<DexAccountFormProps> = ({ onSuccess, onCancel }) => {
    const { addDexAccount, isSubmitting } = useAccountStore();
    const [fields, setFields] = useState<DexFormFields>({
        blockchainWebsiteId: '',
        dexPlatform: '',
        walletAddress: '',
        walletType: '',
        walletProvider: '',
        allowTrade: false,
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    // helper for updating form fields
    const updateField = useCallback(<K extends keyof DexFormFields>(
        key: K,
        value: DexFormFields[K]
    ) => {
        setFields((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined })); // clear error on change
    }, []);
    // when choose wallet type, the wallet provider will be auto filled with the same value, and also disabled for editing, otherwise it's editable
    const handleWalletTypeChange = (walletTypeId: string) => {
        const meta = WALLET_TYPES.find((wallet) => wallet.id === walletTypeId);
        setFields((prev) => ({
            ...prev,
            walletType: walletTypeId,
            walletProvider: meta?.displayName ?? '',
        }));
        setErrors((prev) => ({ ...prev, walletType: undefined }));
        setSubmitError(null);
    };
    // when choose dex platform, if the platform has recommended website, auto change blockchainWebsiteId
    const handleDexPlatformChange = (platformId: string) => {
        const meta = DEX_PLATFORMS.find((platform) => platform.id === platformId);
        setFields((prev) => ({
            ...prev,
            dexPlatform: platformId,
            blockchainWebsiteId: meta?.recommendedNetworkId ?? prev.blockchainWebsiteId,
        }));
        setErrors((prev) => ({ ...prev, dexPlatform: undefined }));
        setSubmitError(null);
    };
    // frontend validation for form fields
    const validate = (): boolean => {
        const newErrors: FormErrors = {};
        if (!fields.blockchainWebsiteId) {
            newErrors.blockchainWebsiteId = 'Please select a blockchain website';
        }
        if (!fields.dexPlatform) {
            newErrors.dexPlatform = 'Please select a DEX platform';
        }
        // wallet address validation
        const evmPattern = /^0x[a-fA-F0-9]{40}$/;
        const solanaPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
        if (!fields.walletAddress.trim()) {
            newErrors.walletAddress = 'Wallet address is required';
        } else if (
            !evmPattern.test(fields.walletAddress.trim()) && 
            !solanaPattern.test(fields.walletAddress.trim())
        ) {
            newErrors.walletAddress = 'Invalid wallet address format'
        }
        if (!fields.walletType) {
            newErrors.walletType = 'Please select a wallet type';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    // handle form submission
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!validate()) return;

        const payload: CreateDexAccountPayload = {
            blockchainWebsiteId: fields.blockchainWebsiteId as number,
            walletAddress: fields.walletAddress.trim(),
            walletType: fields.walletType as CreateDexAccountPayload['walletType'],
            walletProvider: fields.walletProvider || fields.walletType,
            ...(fields.dexPlatform && { dexPlatform: fields.dexPlatform as CreateDexAccountPayload['dexPlatform'] }),
            permissions: ['read'],
            allowTrade: fields.allowTrade,
            allowLiquidity: false,
            allowStake: false,
        };
        try {
            await addDexAccount(payload);
            setSubmitSuccess(true);
            setTimeout(() => {
                setFields({
                    blockchainWebsiteId: '',
                    dexPlatform: '',
                    walletAddress: '',
                    walletType: '',
                    walletProvider: '',
                    allowTrade: false,
                });
                setSubmitSuccess(false);
                onSuccess();
            }, 1000);
        } catch (error: any) {
            setSubmitError(error?.response?.data?.message ?? 'Failed to submit. Please try again.');
        }
    };
    // render the form
    return (
        <form
    onSubmit={handleSubmit}
    noValidate
    className='space-y-5'
    >
        {/** DEX security inform */}
        <div className='bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex gap-2'>
            <AlertCircle className='w-4 h-4 flex-shrink-0 mt-1'/>
            <span>
                For DEX accounts, only need to provide <strong>wallet address</strong>,
                system just read the on-chain data.
                <strong>Please do not input and Secret Key or Wallet Mnemonic.</strong>
            </span>
        </div>
        {/** DEX platform selection */}
        <div>
            <label
            className='block text-sm text-gray-700 mb-1'
            >
                DEX Platform <span className='text-red-500 '>*</span>
            </label>
            <select
            value={fields.dexPlatform}
            onChange={(event) => handleDexPlatformChange(event.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm 
                focus:outline-none focus:ring-2 focus:ring-blue-100
                ${errors.dexPlatform ? 'border-red-300' : 'border-gray-300'}
                `}
            >
                <option value="">Please choose DEX platform</option>
                {DEX_PLATFORMS.map((platform) => (
                    <option
                    key={platform.id}
                    value={platform.displayName}
                    >{platform.displayName}</option>
                ))}
            </select>
            {errors.dexPlatform && (
                <p className='mt-1 text-xs text-red-500 flex items-center gap-1'>
                    <AlertCircle className='w-3 h-3 '/>
                    {errors.dexPlatform}
                </p>
            )}
        </div>
        {/** blockchainwebsite choose */}
        <div>
            <label className='block text-sm text-gray-700 mb-1'>
                Blockchain Website <span className='text-red-500 '>*</span>
            </label>
            <select 
            value={fields.blockchainWebsiteId}
            onChange={(event) => 
                updateField('blockchainWebsiteId', event.target.value ? Number(event.target.value) : '')
            }
            className={`w-full px-3 py-2 border rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-100
                ${errors.blockchainWebsiteId ? 'border-red-300' : 'border-gray-300'}
                `}
            >
                <option value="">Please choose a blockchain website</option>
                {BLOCKCHAIN_WEBSITE.map((website) => (
                    <option 
                    key={website.id}
                    value={website.id}
                    >
                        {website.displayName}
                        {website.type === 'testnet' ? '(Testnet)' : ''}
                    </option>
                ))}
            </select>
            {errors.blockchainWebsiteId && (
                <p className='mt-1 text-xs text-red-500 flex items-center gap-1'>
                    <AlertCircle className='w-3 h-3 '/>{errors.blockchainWebsiteId}
                </p>
            )}
        </div>
        {/** wallet address */}
        <div>
            <label className='block text-sm text-gray-700 mb-1'>
                Wallet Address <span className='text-red-500 '>*</span>
            </label>
            <input 
                type="text"
                value={fields.walletAddress}
                onChange={(event) => updateField('walletAddress', event.target.value.trim())}
                placeholder='0x... or Solana base58 address'
                spellCheck={false}
                autoComplete='off'
                className={`w-full px-3 py-2 border rounded-lg text-sm 
                    focus:outlin-none focus:ring-2 focus:ring-blue-100
                    ${errors.walletAddress ? 'border-red-300' : 'border-gray-300'}
                    `}
                />
                {errors.walletAddress && (
                    <p className='mt-1 text-xs text-red-500 flex items-center gap-1'>
                        <AlertCircle className='w-3 h-3'/>{errors.walletAddress}
                    </p>
                )}
                {/** fast validation: when the address input has content, show the length */}
                {fields.walletAddress && (
                    <p className='mt-1 text-xs text-gray-400'>
                        Address Length: {fields.walletAddress.length} characters
                    </p>
                )}
        </div>
        {/** wallet type */}
        <div>
            <label
            className='block text-sm text-gray-700 mb-1'
            >
                Wallet Type <span className='text-red-500 '>*</span>
            </label>
            <select
            value={fields.walletType}
            onChange={(event) => handleWalletTypeChange(event.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-100
                ${errors.walletType ? 'border-red-300' : 'border-gray-300'}
                `}
            >
                <option value="">Please choose a wallet type</option>
                {WALLET_TYPES.map((wallet) => (
                    <option
                    key={wallet.id}
                    value={wallet.id}
                    >{wallet.displayName}</option>
                ))}
            </select>
            {errors.walletType && (
                <p className='mt-1 text-xs text-red-400 flex items-center gap-1'>
                    <AlertCircle className='w-3 h-3 '/>{errors.walletType}
                </p>
            )}
        </div>
        {/** permissions settings */}
        <div className='bg-gray-50 rounded-lg p-3'>
            <p className='text-xs text-gray-600 mb-2'>
                Permissions Settings:
            </p>
            <label
            className='flex items-center gap-2 cursor-pointer'
            >
                <input 
                type="checkbox"
                checked={fields.allowTrade}
                onChange={(event) => updateField('allowTrade', event.target.checked)}
                className='w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-300'
                />
                <span className='text-sm text-gray-700'>Allow Onchain Trade</span>
            </label>
        </div>
        {/** global error */}
        {submitError && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex gap-2'>
                <AlertCircle className='w-4 h-4 flex-shrink-0 mt-1'/>
                {submitError}
            </div>
        )}
        {/** submit success feedback */}
        {submitSuccess && (
            <div className='bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2'>
                <CheckCircle className='w-4 h-4 '/>
                Successfully added DEX account!
            </div>
        )}
        {/** buttons */}
        <div className='flex justify-end gap-3 pt-2'>
            <button
            type='button'
            onClick={onCancel}
            disabled={isSubmitting}
            className='px-5 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg 
            hover:bg-gray-200 transition-colors disabled:opacity-50'
            >
                Cancel
            </button>
            <button
            type='submit'
            disabled={isSubmitting}
            className='px-5 py-2 text-sm bg-blue-600 text-white rounded-lg
            hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center gap-2
            '
            >
                {isSubmitting ? (
                    <><Loader className='w-4 h-4 animate-spin'/>Binding...</>
                ) : (
                    'Bind DEX Account'
                )}
            </button>
        </div>
    </form>
    
    );
};
export default DexAccountForm;

