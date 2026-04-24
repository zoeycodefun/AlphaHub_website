/**
 * auth_modal.tsx
 * login and register modal component
 * including two tabs:
 * - "Sign In": email+password+remember me - call POST /auth/login
 * - "Register": email+nickname+password+confirm password - call POST /auth/register
 * design principles:
 * form data only stored in local component state, not in global store
 * call backend through useAuthStore, do not call API directly
 * password fields use type="password" to hide input
 * show password strength indicator real-time when user input password in register form
 * show error in the form of banner 
 */
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { userAuthStore } from '../../global_state_store/auth_global_state_store';
// password strength check sub component
/**
 * calculate password strength based on length and character variety(4 points)
 */
function getPasswrodStrength(password: string): number {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;
    return score;
}
// labels and colors that correspond to the strength score
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400'];
/**
 * register form password strength indicator component
 */
const PasswordStrengthBar: React.FC<{ password: string }> = ({ password }) => {
    if (!password) return null;
    const score = getPasswrodStrength(password);
    return (
        <div className='mt-2'>
            <div className='flex gap-1'>
                {[1,2,3,4].map((segment) => (
                    <div
                    key={segment}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300
                        ${score >= segment ? STRENGTH_COLORS[score] : 'bg-surface-hover'}`}
                    />
                ))}
            </div>
            {/** strength label */}
            <p className={`text-xs mt-1
                ${score >= 4 ? 'text-green-600' : score >= 2 ? 'text-yellow-600' : 'text-red-500'}
                `}>
                    {STRENGTH_LABELS[score]}
            </p>
        </div>
    );
};
// login form component
const LoginForm: React.FC = () => {
    const { login, isLoading, error, clearError } = userAuthStore();
    // form fields(local state, not global store)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    // local error
    const [localError, setLocalError] = useState<string | null>(null);
    // monitor store error(return the error and show in local state)
    useEffect(() => {
        if (error) setLocalError(error);
    }, [error]);
    // frontend local validation before call API
    const validate = (): boolean => {
        if (!email.trim()) {
            setLocalError('Email is required');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setLocalError('Invalid email format');
            return false;
        }
        if (!password) {
            setLocalError('Password is required');
            return false;
        }
        return true;
    };
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLocalError(null);
        clearError();
        if (!validate()) return;
        // call login action in store
        await login({
            email: email.trim().toLowerCase(),
            password,
            rememberMe,
        });
    };
    return (
        <form
        onSubmit={handleSubmit}
        noValidate
        className='space-y-4'
        >
            {/** error banner */}
            {localError && (
                <div className='flex items-start gap-2 px-3 py-2 bg-red-900/30 border border-red-100 rounded-lg'>
                    <AlertCircle className='w-4 h-4 text-red-500 flex-shrink-0 mt-1'/>
                    <p className='text-xs text-red-600'>{localError}</p>
                </div>
            )}
            {/** email input bar */}
            <div>
                <label htmlFor="login-email"
                className='block text-sm text-secondary mb-1'
                >
                    Email <span className='text-red-500'>*</span>
                </label>
                <input
                id='login-email'
                type='email'
                value={email}
                onChange={(event) => {
                    setEmail(event.target.value);
                    setLocalError(null);
                    clearError();
                }}
                autoComplete='email'
                placeholder='***@email.com'
                className='w-full px-3 py-2 border border-strong rounded-lg text-sm 
                focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-700'
                />
            </div>
            {/** password input bar */}
            <div>
                <label 
                htmlFor="login-password"
                className='block text-sm text-secondary mb-1'
                >
                    Password <span className='text-red-500'>*</span>
                </label>
                <input
                id='login-password'
                type='password'
                value={password}
                onChange={(event) => {
                    setPassword(event.target.value);
                    setLocalError(null);
                    clearError();
                }}
                autoComplete='current-password'
                placeholder='********'
                className='w-full px-3 py-2 border border-strong rounded-lg text-sm 
                focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-700'
                />
            </div>
            {/** remember me checkbox */}
            <label 
            className='flex items-center gap-2 cursor-pointer select-none'
            >
                <input
                type='checkbox'
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className='w-4 h-4 text-blue-600 border-strong rounded focus:ring-blue-500'
                />
                <span className='text-sm text-muted'>Remember me(stay logged in for 7 days)</span>
            </label>
            {/** submit button: if logining show loading spinner */}
            <button
            type='submit'
            disabled={isLoading}
            className='w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60
            flex items-center justify-center gap-2
            '
            >
                {isLoading ? <><Loader className='w-4 h-4 animate-spin'/>Signing in...</>
                : 'Sign In'}
            </button>
        </form>
    );
};
// register form component
const RegisterForm: React.FC = () => {
    const { register, isLoading, error, clearError } = userAuthStore();
    const [email, setEmail] = useState('');
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    // synchronize store error to local error
    useEffect(() => {
        if (error) setLocalError(error);
    }, [error]);
    // frontend complete validation(corresponding to backend RegisterDto validation rules)
    const validate = (): boolean => {
        if (!email.trim()) {
            setLocalError('Email is required');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setLocalError('Invalid email format');
            return false;
        }
        if (password.length < 8) {
            setLocalError('Password must be at least 8 characters');
            return false;
        }
        if (!/(?=.*[a-z])/.test(password)) {
            setLocalError('Password must contain at least one lowercase letter');
            return false;
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            setLocalError('Password must contain at least one uppercase letter');
            return false;
        }
        if (!/(?=.*\d)/.test(password)) {
            setLocalError('Password must contain at least one number');
            return false;
        }
        if (!/(?=.*[@$!%*?&])/.test(password)) {
            setLocalError('Password must contain at least one special character(@$!*?&)');
            return false;
        }
        if (password !== confirmPassword) {
            setLocalError('Passwords do not match');
            return false;
        }
        return true;
    };
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLocalError(null);
        clearError();
        if (!validate()) return;
        // call register action in store: register - auto login - close modal - set currentUser
        await register({
            email: email.trim().toLowerCase(),
            password,
            confirmPassword,
            nickname: nickname.trim() || undefined,
        });
    };
    return (
        <form
        onSubmit={handleSubmit}
        noValidate
        className='space-y-4'
        >
            {/** error banner */}
            {localError && (
                <div className='flex items-start gap-2 px-3 py-2 bg-red-900/30 border border-red-100 rounded-lg'>
                    <AlertCircle className='w-4 h-4 text-red-500 flex-shrink-0 mt-1'/>
                    <p className='text-xs text-red-600'>{localError}</p>
                </div>
            )}
            {/** email input bar */}
            <div>
                <label htmlFor="reg-email"
                className='block text-sm text-secondary mb-1'
                >
                    Email <span className='text-red-500'>*</span>
                </label>
                <input
                id='reg-email'
                type='email'
                value={email}
                onChange={(event) => {
                    setEmail(event.target.value);
                    setLocalError(null);
                    clearError();
                }}
                autoComplete='email'
                placeholder='your@email.com'
                className='w-full px-3 py-2 border border-strong rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:border-blue-400'
                />
            </div>
            {/** nickname input bar(optional)  */}
            <div>
                <label htmlFor="reg-nickname"
                className='block text-sm text-secondary mb-1'>
                    Nickname <span className='ml-1 text-muted text-xs'>(optional)</span>
                </label>
                <input
                id='reg-nickname'
                type='text'
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                autoComplete='nickname'
                placeholder='How should we call you?'
                maxLength={64}
                className='w-full px-3 py-2 border- border-strong rounded-lg text-sm 
                focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-700/50'
                />
            </div>
            {/** password input bar(including strength indicator) */}
            <div>
                <label htmlFor="reg-password"
                className='block text-sm text-secondary mb-1'>
                    Password <span className='text-red-500'>*</span>
                </label>
                <input
                id='reg-password'
                type='password'
                value={password}
                onChange={(event) => {
                    setPassword(event.target.value);
                    setLocalError(null);
                    clearError();
                }}
                autoComplete='new-password'
                placeholder='Create a strong password'
                className='w-full px-3 py-2 border border-strong rounded-lg text-sm 
                focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-700/50'
                />
                <PasswordStrengthBar password={password}
                />
            </div>
            {/** confirm password input bar */}
            <div>
                <label htmlFor="reg-confirm" 
                className='block text-sm text-secondary mb-1'>
                    Confirm Password <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                    <input
                    id='reg-confirm'
                    type='password'
                    value={confirmPassword}
                    onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setLocalError(null);
                        clearError();
                    }}
                    autoComplete='new-password'
                    placeholder='Re-enter your password'
                    className='w-full px-3 py-2 border border-strong rounded-lg text-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-700/50'
                    />
                    {/** real-time password match indicator */}
                    {confirmPassword && password && (
                        <span className='absolute right-3 top-1/2 -translate-y-1/2'>
                            {confirmPassword === password
                            ? <CheckCircle className='w-4 h-4 text-green-500'/>
                            : <AlertCircle className='w-4 h-4 text-red-500'/>
                            }
                        </span>
                    )}
                </div>
            </div>
            {/** data security notice */}
            <p className='text-xs text-muted'>
                By registering, you agree to our <a href="#" className='text-blue-600 underline'>Terms of Service</a> and <a href="#" className='text-blue-600 underline'>Privacy Policy</a>. We take your data security seriously.
            </p>
            {/** submit button */}
            <button
            type='submit'
            disabled={isLoading}
            className='w-full py-2 bg-blue-600 text-white text-sm rounded-lg
            hover:bg-blue-700 transition-colors disabled:opacity-60
            flex items-center  justify-center gap-2 
            '
            >
                {isLoading ?
                <><Loader className='w-4 h-4 animate-spin'/>Creating account...</>
                : 'Create Account'
                }
            </button>
        </form>
    );
};
// main auth modal component
const AuthModal: React.FC = () => {
    const { isAuthModalOpen, authModalTab, closeAuthModal } = userAuthStore();
    const [activeTab, setActiveTab] = useState<"login" | "register">(authModalTab);
    // synchronize tab with global store when modal open
    useEffect(() => {
        setActiveTab(authModalTab);
    }, [authModalTab, isAuthModalOpen]);
    // do not render any DOM when modal is closed
    if (!isAuthModalOpen) return null;
    return (
        // overlay--most top
        <div
        className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4'
        onClick={closeAuthModal}
        >
            {/** modal main body */}
            <div
            className='bg-card rounded-xl w-full max-w-md shadow-2xl overflow-hidden'
            onClick={(event) => event.stopPropagation()}
            >
                {/** header title */}
                <div className='flex items-center justify-between px-6 py-4 border-b border-base'>
                    <span className='text-base text-primary'>
                        {activeTab === 'login' ? 'Sign In to Your Account' : 'Create a New Account'}
                    </span>
                    <button 
                    onClick={closeAuthModal}
                    className='p-2 rounded-lg text-muted hover:text-muted hover:bg-surface-hover/50 transition-colors'
                    aria-label='Close authentication modal'
                    >
                        <X className='w-4 h-4'/>
                    </button>
                </div>
                {/** tab switcher */}
                <div className='flex border-b border-base'>
                    {(['login', 'register'] as const).map((tab) => (
                        <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm transition-colors border-b-2
                            ${activeTab === tab 
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-dim hover:text-secondary'
                            }`}
                        >
                            {tab === 'login' ? 'Sign In' : 'Register'}
                        </button>
                    ))}
                </div>
                {/** form content */}
                <div className='px-6 py-5'>
                    {/** render form according to activeTab, unload old form, reset state when change tab */}
                    {activeTab === 'login' ? <LoginForm/> : <RegisterForm/>}
                </div>
                {/** tab switcher in bottom */}
                <div className='px-6 pb-5 text-center'>
                    <p className='text-xs text-dim'>
                        {activeTab === 'login' ? (
                            <>
                            Don&apos;t have an account?{' '}
                            <button
                            onClick={() => setActiveTab('register')}
                            className='text-blue-600 hover:underline'
                            >
                                Create one!
                            </button>
                            </>
                        ) : (
                            <>
                            Already have an account?{' '}
                            <button
                            onClick={() => setActiveTab('login')}
                            className='text-blue-600 hover:underline '
                            >
                                Sign in
                            </button>
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
};
export default AuthModal;