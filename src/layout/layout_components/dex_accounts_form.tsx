// dex accounts binding form component
/**
 * dex account form: DEX accounts binding form component
 * responsible for letting users input and submit all parameters for binding their DEX accounts to the platform
 * DEX vs CEX: DEX just need wallet address(no API secret), but besides for Hyperliquid(it just need wallet address, but it will
 * generate a secret wallet address for placing orders, but do not have the permissions for other operations like withdrawing
 * it's secret wallet address need to be encrypted and stored in the database after encrypted)
 */
import React, { useState, useCallback, } from 'react';
import  { AlertCircle, Loader, CheckCircle, ExternalLink } from 'lucide-react';
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
        
    }


}