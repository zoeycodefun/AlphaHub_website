/**
 * auth_global_state_store.tsx
 * authentication related global state management using Zustand
 * state management:
 * 1. currentUser: store the current logged in user info, null if not logged in
 * 2. isAuthenticated: boolean flag to indicate if user is logged in, derived from currentUser
 * 3. isLoading: logining/registering/initializing user info status
 * 4. error: error message of the last operation
 * 5. isAuthModalOpen: control the visibility of login/register modal
 * 6. authModalTab: control the default tab of auth modal, "login" or "register"
 * actions:
 * 1. initAuth() -initialize the auth state, check if token exists and fetch user info
 * 2. login() -call login API, store token, update currentUser
 * 3. register() -call register API, auto login after successful registration
 * 4. logout() -clear token and currentUser
 * 5. openAuthModal() -open the auth modal
 * 6. closeAuthModal() -close the auth modal
 * 7. clearError() -clear the error message
 */
import { create } from "zustand";
import { useAccountStore } from './accounts_management_global_state_store';
import {
    authApiService,
    type AuthUser,
    type LoginPayload,
    type RegisterPayload,
} from '../services/auth_api.service';
// define the state type
interface AuthState {
    // data
    currentUser: AuthUser | null;
    isAuthenticated: boolean;
    // async status control
    isLoading: boolean;
    error: string | null;
    // auth modal control
    isAuthModalOpen: boolean;
    authModalTab: "login" | "register";
    // actions
    initAuth: () => Promise<void>;
    login: (payload: LoginPayload) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    logout: () => void;
    openAuthModal: (tab?: "login" | "register") => void;
    closeAuthModal: () => void;
    clearError: () => void;
}
// helper function
/**
 * helper function 1: get readable error message from axios error response, fallback to generic message if not available
 */
function extractErrorMessage(error: unknown, fallback: string): string {
    const errorMessage = error as Record<string, any>;
    if (typeof errorMessage?.response?.data?.message === "string") {
        return errorMessage.response.data.message;
    }
    return fallback;
}
// Zustand store
export const userAuthStore = create<AuthState>((set) => ({
    // initial state
    currentUser: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    isAuthModalOpen: false,
    authModalTab: "login",
    /**
     * initAuth
     * called in Layout component when mount
     * if token in localStorage, call /auth/me to validate and restore user info and status
     * if page refreshed and token is valid, user will stay logged in
     */
    initAuth: async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        set({ isLoading: true });
        try {
            const user = await authApiService.getMe();
            set({ currentUser: user, isAuthenticated: true });
            // refresh CEX/DEX accounts list
            useAccountStore.getState().fetchCexAccounts();
            useAccountStore.getState().fetchDexAccounts();
        } catch {
            authApiService.logout();
            set({ currentUser: null, isAuthenticated: false });
        } finally {
            set({ isLoading: false });
        }
    },
    /**
     * login
     * call POST /auth/login
     * if successful, JWT will be stored in localStorage by authApiService.login()
     * update currentUser and isAuthenticated status
     * close login modal
     */
    login: async (payload) => {
        set({ isLoading: true, error: null });
        try {
            const result = await authApiService.login(payload);
            set({
                currentUser: result.user,
                isAuthenticated: true,
                isAuthModalOpen: false,
                error: null,
            });
        } catch (error) {
            set({ error: extractErrorMessage(error, 'Login failed. Please check your email and password.') });
        } finally {
            set({ isLoading: false });
        }
    },
    /**
     * register
     * call POST /auth/register to create new account
     * automatically call POST /auth.login to get token
     * close modal, set currentUser, and close modal after successful registration
     */
    register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
            // create account: check uniqueness of email and password strength
            await authApiService.register(payload);
            // automatically login after successful registration and get JWT token
            const loginResult = await authApiService.login({
                email: payload.email,
                password: payload.password,
                rememberMe: false,
            });
            set({
                currentUser: loginResult.user,
                isAuthenticated: true,
                isAuthModalOpen: false,
                error: null,
            });
        } catch (error) {
            set({ error: extractErrorMessage(error, 'Registration failed. Please check your email and password.') });
        } finally {
            set({ isLoading: false });
        }
    },
    /**
     * logout
     * client side logout, delete token from localStorage and clear user info in Zustand store
     * JWT token has no state on server side, so no need to call backend API to invalidate token
     */
    logout: () => {
        authApiService.logout();
        set({
            currentUser: null,
            isAuthenticated: false,
            error: null,
        });
    },
    /**
     * openAuthModal
     * open login and register modal, default to login tab
     * @param tab 'login'(default) or 'register'
     */
    openAuthModal: (tab = 'login') => {
        set({
            isAuthModalOpen: true,
            authModalTab: tab,
            error: null,
        });
    },
    /**
     * closeAuthModal
     * close modal and clear error message
     */
    closeAuthModal: () => {
        set({ 
            isAuthModalOpen: false,
            error: null,
        });
    },
    /** 
     * clearError
     * clear error status
     */
    clearError: () => set({
        error: null,
    }),    
}));
