/**
 * Cex accounts binding form component
 * responsible for let users input CEX account information to bind CEX accounts
 * the API key, secret, passphrase using type= "password" to display, and support show/hide toggle, aviod shoulder surfing risk
 * form information will not be written in localStorage, only exist shortly in memory, and will be cleared immediately after submission, no sensitive information will be stored in browser
 * only transmit the sensitive information through HTTPS, backend will handle AES encryption and storage
 */
import React, { useState, useCallback } from 'react';
import { Eye, EyeOff, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { useAccountStore } from '../../../../global_state_store/accounts_management_global_state_store';
import { type CreateCexAccountPayload } from '../../../../services/accounts_management_api.service';
// configuration form for supported CEX
interface CexExchangeMeta {
    id: string;
    displayName: string;
    requiresPassphrase: boolean;
    apiDocUrl: string;
}
const SUPPORTED_CEX_EXCHANGES: CexExchangeMeta[] = [
    {
        id: 'binance',
        displayName: 'Binance',
        requiresPassphrase: false,
        apiDocUrl: 'https://www.binance.com/zh-CN/my/settings/api-management',
    },
    {
        id: 'okx',
        displayName: 'OKX',
        requiresPassphrase: true,
        apiDocUrl: 'https://www.okx.com/cn/account/my-api',
    },
    {
        id: 'bybit',
        displayName: 'Bybit',
        requiresPassphrase: false,
        apiDocUrl: 'https://www.bybit.com/app/user/api-management',
    },
    {
        id: 'gate',
        displayName: 'Gate.io',
        requiresPassphrase: false,
        apiDocUrl: 'https://www.gate.io/myaccount/api_key_management',
    },
    {
        id: 'kucoin',
        displayName: 'KuCoin',
        requiresPassphrase: true,
        apiDocUrl: 'https://www.kucoin.com/account/api',
    },
    {
        id: 'bitget',
        displayName: 'Bitget',
        requiresPassphrase: true,
        apiDocUrl: 'https://www.bitget.com/zh-CN/account/newapi',
    },
];
// local state type of the form
interface CexFormFields {
    exchange: string;
    accountType: 'spot' | 'futures';
    accountEnvironment: 'live' | 'test' | 'demo';
    accountName: string;
    apiKey: string;
    apiSecret: string;
    apiPassphrase: string;
    allowTrade?: boolean;
}
// define the validation error messages for form fields
type FormErrors = Partial<Record<keyof CexFormFields, string>>;

// sub component: password input with show/hide toggle
interface SecretInputProps {
    id: string;
    label: string;
    value: string;
    placeholder: string;
    error?: string;
    onChange: (value: string) => void;
}
// show/hide toggle for password input
const SecretInput: React.FC<SecretInputProps> = ({
    id, label, value, placeholder, error, onChange,
}) => {
    const [showSecret, setShowSecret] = useState(false);
    return (
        <div>
            {/** label */}
            <label htmlFor={id} className='block text-sm text-gray-700 mb-1'>
                {label}
            </label>
            {/** input and toggle */}
            <div className=''>
                <input 
                id={id}
                type={showSecret ? 'text' : 'password'}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                autoComplete='off'
                spellCheck={false}
                className={`w-full pr-10 pl-3 py-2.5 border rounded-lg text-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-100 
                    ${error ? 'border-red-400 bg-red-50 ': 'border-gray-300 bg-white'}`}
                />
                {/** show/hide toggle button */}
                <button
                type="button"
                onClick={() => setShowSecret((show) => !show)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                hover:text-gray-600 transition-colors'
                aria-label={showSecret ? 'Hide secret' : 'Show secret'}

                >
                    {showSecret ? <EyeOff className='w-4 h-4' />:<Eye className='w-4 h-4' />}
                </button>
            </div>
            {error && (
                <p className='mt-1 text-xs text-red-400 flex items-center gap-1'>
                    <AlertCircle className='w-3 h-3'/>
                    {error}
                </p>
            )}
        </div>
    );
};
// main form component---CexAccountForm
interface CexAccountFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}
const CexAccountForm: React.FC<CexAccountFormProps> = ({
    onSuccess, onCancel,
}) => {
    const { addCexAccount, isSubmitting } = useAccountStore();
    const [fields, setfields] = useState<CexFormFields>({
        exchange: '',
        accountType: 'spot',
        accountEnvironment: 'live',
        accountName: '',
        apiKey: '',
        apiSecret: '',
        apiPassphrase: '',
        allowTrade: false
    });
    // form validation errors
    const [errors, setErrors] = useState<FormErrors>({});
    // submit failed global error
    const [submitError, setSubmitError] = useState<string | null>(null);
    // submit success feedback
    const [submitSuccess, setSubmitSuccess] = useState(false);
    // metadata of the selected exchange, used for judge if need passphrase
    const selectedExchangeMeta = SUPPORTED_CEX_EXCHANGES.find(
        (exchange) => exchange.id === fields.exchange
    );
    // helper of field change, update specific field value and clear this field and global error
    const updateField = useCallback(<K extends keyof CexFormFields>(
        key: K,
        value: CexFormFields[K]
    ) => {
        setfields((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
        setSubmitError(null);
    }, []);
    // frontend validation
    const frontendValidate = (): boolean => {
        const newErrors: FormErrors = {};
        // must choose exchange
        if (!fields.exchange) {
            newErrors.exchange = 'Please select an exchange';
        }
        // other account name
        if (!fields.accountName.trim()) {
            newErrors.accountName = 'Please enter an account name';
        } else if (fields.accountName.length > 100) {
            newErrors.accountName = 'Account name must be less than 100 characters';
        }
        // api key
        if (!fields.apiKey.trim()) {
            newErrors.apiKey = 'Please enter the API key';
        } else if (fields.apiKey.length < 10 || fields.apiKey.length > 256) {
            newErrors.apiKey = 'API key must be between 10 and 256 characters';
        }
        // api secret
        if (!fields.apiSecret.trim()) {
            newErrors.apiSecret = 'Please enter the API secret';
        } else if (fields.apiSecret.length < 10 || fields.apiSecret.length > 256) {
            newErrors.apiSecret = 'API secret must be between 10 and 256 characters';
        }
        // api passphrase, if selected exchange requires
        if (selectedExchangeMeta?.requiresPassphrase && !fields.apiPassphrase?.trim()) {
            newErrors.apiPassphrase = `${selectedExchangeMeta.displayName} requires API passphrase, please enter it`;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    // handle form submission
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!frontendValidate) return
        // create payload(cast to the backend CreateCexAccountPayload)
        const patload: CreateCexAccountPayload = {
            exchange: fields.exchange,
            accountType: fields.accountType,
            accountEnvironment: fields.accountEnvironment,
            accountName: fields.accountName.trim(),
            apiKey: fields.apiKey.trim(),
            apiSecret: fields.apiSecret.trim(),
            // only include passphrase if it's required and provided, avoid send empty string to backend
            ...(fields.apiPassphrase.trim() && { apiPassphrase: fields.apiPassphrase.trim() }),
            permissions: ['read'],
            allowTrade: fields.allowTrade,
            allowWithdraw: false,
            allowTransfer: false,
        };
        try {
            await addCexAccount(patload);
            setSubmitSuccess(true);
            // clear form immediately after submission, no sensitive information will be stored in browser
            // clear form and close modal after 1 second, give user feedback about success
            setTimeout(() => {
                setfields({
                    exchange: '',
                    accountType: 'spot',
                    accountEnvironment: 'live',
                    accountName: '',
                    apiKey: '',
                    apiSecret: '',
                    apiPassphrase: '',
                    allowTrade: false,
                });
                setSubmitSuccess(false);
                onSuccess();
                }, 1000)
        } catch (error: any) {
            setSubmitError(error?.response?.data?.message ?? 'Failed to add CEX account, please try again');
        }
    };
    // render form 
    return (
        <form 
        onSubmit={handleSubmit}
        noValidate
        className='space-y-5'
        >
            {/** security alert */}
            <div className='bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 flex gap-2'>
                <AlertCircle className='w-4 h-4 flex-shrink-0 mt-1'/>
                <span>
                    For your account security, please make sure you understand the risks of binding CEX accounts, 
                    and only bind accounts with API key that has trading permission but <strong>no withdrawal</strong> permission. 
                    We will never store your API key and secret in our server in plain text, 
                    all sensitive information will be encrypted and securely stored, 
                    and only used for fetching your account balance and placing trades. 
                    Please make sure you trust our platform before binding your CEX account.
                </span>
            </div>
            {/** exchange select */}
            <div>
                <label
                className='block text-sm text-gray-700 mb-1'
                >
                    Exchange <span className='text-red-500'>*</span>
                    </label>
                <select 
                value={fields.exchange}
                onChange={(event) => updateField('exchange', event.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-100
                    ${errors.exchange ? 'border-red-100':'border-gray-300'}`}
                    >
                        <option value="">Please select an exchange</option>
                        {SUPPORTED_CEX_EXCHANGES.map((exchange) => (
                            <option key={exchange.id} value={exchange.id}>
                                {exchange.displayName}
                            </option>
                        ))}
                    </select>
                    {errors.exchange && (
                        <p className='mt-1 text-xs text-red-500 flex items-center gap-1'>
                            <AlertCircle className='w-3 h-3 '/>
                            {errors.exchange}
                        </p>
                    )}
                    {/** already selected exchange, jump to the API management page link */}
                    {selectedExchangeMeta && (
                        <a 
                        href={selectedExchangeMeta.apiDocUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='mt-1 text-xs text-blue-700 hover:underline inline-block'

                        >
                            Don't have API key? Click here to go to {selectedExchangeMeta.displayName} API management page.
                        </a>
                    )}
            </div>
            {/** account type and environment */}
            <div className='grid grid-cols-2 gap-3'>
                {/** account type */}
                <div className=''>
                    <label
                    className='block text-sm text-gray-700 mb-1'
                    >Account Type</label>
                    <select
                        value={fields.accountType}
                        onChange={(event) => updateField('accountType', event.target.value as 'spot' | 'futures')}
                        className='w-full px-3 py-2 border border-gray-100 rounded-lg focus:outline-none'
                    >
                        <option value='spot'>Spot</option>
                        <option value='futures'>Futures</option>
                    </select>
                </div>
                {/** account environment */}
                <div>
                    <label className='block text-sm text-gray-700 mb-1'
                    >Account Environment</label>
                    <select
                    value={fields.accountEnvironment}
                    onChange={(event) => updateField('accountEnvironment', event.target.value as 'live' | 'test' | 'demo' )}
                    className='w-full px-3 py-2 border border-gray-100 rounded-lg text-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-100'
                    >
                        <option value="live">Live</option>
                        <option value="test">Test</option>
                        <option value="demo">Demo</option>
                    </select>
                </div>
            </div>
            {/** other account name */}
            <div>
                <label className='block text-sm text-gray-700 mb-1'>
                    Other Account Name <span className='text-red-500'>*</span>
                </label>
                <input type="text"
                value={fields.accountName}
                onChange={(event) => updateField('accountName', event.target.value)}
                placeholder='e.g. main account of Binance(spot)'
                maxLength={100}
                className={`w-full px-3 py-2 border rounded-lg text-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-100
                    ${errors.accountName ? 'border-red-400 bg-red-50 ': 'border-gray-300'}`}
                />
                {errors.accountName && (
                    <p className='mt-1 text-xs text-red-500 flex items-center gap-1'>
                        <AlertCircle className='w-3 h-3'/>{errors.accountName}
                    </p>
                )}
            </div>
            {/** API key */}
            <SecretInput
            id="cex-api-key"
            label="API Key *"
            value={fields.apiKey}
            placeholder='Enter your API key'
            error={errors.apiKey}
            onChange={(value) => updateField('apiKey', value)}
            />
            {/** API secret with show/hide toggle */}
            <SecretInput
            id="cex-api-secret"
            label="API Secret *"
            value={fields.apiSecret}
            placeholder='Enter your API secret'
            error={errors.apiSecret}
            onChange={(value) => updateField('apiSecret', value)}
            />
            {/** API passphrase, only show when selected exchange requires */}
            {selectedExchangeMeta?.requiresPassphrase && (
                <SecretInput
                id="cex-api-passphrase"
                label={`Passphrase ${selectedExchangeMeta.displayName} requires *`}
                value={fields.apiPassphrase || ''}
                placeholder='the passphrase you set when create API key, required by some exchanges like OKX and KuCoin'
                error={errors.apiPassphrase}
                onChange={(value) => updateField('apiPassphrase', value)}
                />
            )}
            {/** permissions settings */}
            <div className='bg-gray-50 rounded-lg p-3 space-y-2'>
                <p className='text-xs text-gray-600 mb-2'>
                    API Permissions (optional, default to read-only, 
                    you can choose more permissions but for your account security, 
                    we recommend to only enable trading permission and keep withdrawal permission disabled)
                </p>
                {/** allow trade checkbox */}
                <label
                className='flex items-center gap-2 cursor-point'
                >
                    <input 
                    type="text"
                    checked={fields.allowTrade}
                    onChange={(event) => updateField('allowTrade', event.target.checked)}
                    className='w-4 h-4 rounded border-gray-100 text-blue-600 focus:ring-blue-100'
                    />
                    <span className='text-sm text-gray-700'>Allow Trade(if you enable it, the system can place order)</span>
                </label>
                <p className='text-xs text-gray-400 '>Withdraw/transfer permission is disabled for security reasons</p>
            </div>
            {/** global submission error information */}
            {submitError && (
                <div className='bg-red-50 border border-red-100 rounded-lg p-3
                text-sm text-red-700 flex items-start gap-2
                '>
                    <AlertCircle className='w-4 h-4 flex-shrink-0 mt-1'/>
                    {submitError}
                </div>
            )}
            {/** feedback of successful submission */}
            {submitSuccess && (
                <div className='bg-green-50 border border-green-100 rounded-lg p-3
                text-sm text-green-700 flex items-center gap-2
                '>
                    <CheckCircle className='w-4 h-4 '/>
                    CEX account added successfully!
                </div>
            )}
            {/** operation button */}
            <div className='flex justify-end gap-3 pt-2'>
                {/** cancel button */}
                <button
                type='button'
                onClick={onCancel}
                disabled={isSubmitting}
                className='px-5 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg 
                hover:bg-gray-100 transition-colors disabled:upcity-50
                '
                >
                    Cancel
                </button>
                {/** submit button */}
                <button
                type='submit'
                disabled={isSubmitting}
                className='px-5 py-2 text-sm bg-blue-400 text-white rounded-lg
                hover:bg-blue-500 transition-colors disabled:opacity-60
                flex items-center gap-2
                '>
                    {isSubmitting ? (
                        <>
                        <Loader className='w-4 h-4 animate-spin'/>
                        Binding...
                        </>
                    ) : (
                        <>
                        Bind Account
                        </>
                    )}
                </button>
                </div>
            </form>
    );
};
export default CexAccountForm;

