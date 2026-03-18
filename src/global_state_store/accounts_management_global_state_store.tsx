// zustand global state store for accounts management
/**
 * accounts global state store
 * responsible for managing the data list, loading status, error info, and API actions of CEX/DEX accounts in client
 * design principles: use optimistic update for better user experience, handle errors gracefully, keep the state structure simple and clear
 * use small size loading indicators for each action to avoid blocking the whole page, and provide clear error messages when API calls fail
 * error info stored by the classification of CEX/DEX and the type of action
 */
import { create } from 'zustand';
import {
    accountApiService,
    type CexAccountResponse,
    type DexAccountResponse,
    type CreateCexAccountPayload,
    type CreateDexAccountPayload,
    type UpdateCexAccountPayload,
    type UpdateDexAccountPayload
} from '../services/accounts_management_api.service';

// store status and the defination of the action type
interface AccountState {
    // data
    cexAccounts: CexAccountResponse[];
    dexAccounts: DexAccountResponse[];
    // global loading state
    isLoadingCex: boolean;
    isLoadingDex: boolean;
    isSubmitting: boolean;
    // connection test status
    testingConnectionIds: Set<number>;
    cexError: string | null;
    dexError: string | null;
    // actions
    fetchCexAccounts: () => Promise<void>;
    fetchDexAccounts: () => Promise<void>;
    addCexAccount: (payload: CreateCexAccountPayload) => Promise<void>;
    addDexAccount: (payload: CreateDexAccountPayload) => Promise<void>;
    updateCexAccount: (id: number, payload: UpdateCexAccountPayload) => Promise<void>;
    updateDexAccount: (id: number, payload: UpdateDexAccountPayload) => Promise<void>;
    deleteCexAccount: (id: number) => Promise<void>;
    deleteDexAccount: (id: number) => Promise<void>;
    testCexAccountConnection: (id: number) => Promise<{ success: boolean; message: string }>;
    testDexAccountConnection: (id: number) => Promise<{
        errorMessage: string; success: boolean; message: string 
}>;
    clearErrors: () => void;
}
// util function to handle API errors and extract error messages
// get readable error message from axios error response, fallback to generic message if not available
function extractErrorMessage(error: any, fallback: string): string {
    return error?.response?.data?.message ?? fallback;
}
// create the zustand store
export const useAccountStore = create<AccountState>((set, get) => ({
    // initial state
    cexAccounts: [],
    dexAccounts: [],
    isLoadingCex: false,
    isLoadingDex: false,
    isSubmitting: false,
    testingConnectionIds: new Set(),
    cexError: null,
    dexError: null,
    // fetch CEX accounts list with pagination
    fetchCexAccounts: async () => {
        set({ isLoadingCex: true, cexError: null });
        try {
            const result = await accountApiService.getCexAccounts({ limit: 100 })
            set({ cexAccounts: result.items });
        } catch (error) {
            set({ cexError: extractErrorMessage(error, 'Failed to fetch CEX accounts') });
        } finally {
            set({ isLoadingCex: false });
        }
    },
    // fetch DEX accounts list with pagination
    fetchDexAccounts: async () => {
        set({ isLoadingDex: true, dexError: null });
        try {
            const result = await accountApiService.getDexAccounts({ limit: 100 })
            set({ dexAccounts: result.items });
        } catch (error) {
            set({ dexError: extractErrorMessage(error, 'Failed to fetch DEX accounts') });
        } finally {
            set({ isLoadingDex: false });
        }
    },
    // add CEX account
    addCexAccount: async (payload) => {
        set({ isSubmitting: true, cexError: null });
        try {
            const newAccount = await accountApiService.createCexAccount(payload);
            set((state) => ({ cexAccounts: [...state.cexAccounts, newAccount] }));
        } catch (error) {
            const errorMessage = extractErrorMessage(error, 'Failed to add CEX account');
            set({ cexError: errorMessage });
            throw new Error(errorMessage);
        } finally {
            set({ isSubmitting: false });
        }
    },
    // add DEX account
    addDexAccount: async (payload) => {
        set({ isSubmitting: true, dexError: null });
        try {
            const newAccount = await accountApiService.createDexAccount(payload);
            set((state) => ({ dexAccounts: [...state.dexAccounts, newAccount] }));
        } catch (error) {
            const errorMessage = extractErrorMessage(error, 'Failed to add DEX account');
            set({ dexError: errorMessage });
            throw error;
        } finally {
            set({ isSubmitting: false });
        }
    },
    // update CEX account
    updateCexAccount: async (id, payload) => {
        set({ isSubmitting: true, cexError: null });
        try{
            const updatedAccount = await accountApiService.updateCexAccount(id, payload);
            set((state) => ({
                cexAccounts: state.cexAccounts.map((account) => 
                    (account.id === id ? updatedAccount : account)),
           }));
        } catch (error) {
            const errorMessage = extractErrorMessage(error, 'Failed to update CEX account');
            set({ cexError: errorMessage });
            throw error;
        } finally {
            set({ isSubmitting: false });
        }
    },
    // update DEX account
    updateDexAccount: async (id, payload) => {
        set({ isSubmitting: true, dexError: null });
        try{
            const updatedAccount = await accountApiService.updateDexAccount(id, payload);
            set((state) => ({
                dexAccounts: state.dexAccounts.map((account) =>
                    (account.id === id ? updatedAccount : account)),
            }));
        } catch (error) {
            const errorMessage = extractErrorMessage(error, 'Failed to update DEX account');
            set({ dexError: errorMessage });
            throw error;
        } finally {
            set({ isSubmitting: false });
        }
    },
    // delete CEX account(positive deletion)
    deleteCexAccount: async (id) => {
        const snapshot = get().cexAccounts;
        set((state) => ({
            cexAccounts: state.cexAccounts.filter((account) => 
            account.id !== id),
        }));
        try {
            await accountApiService.deleteCexAccount(id);
        } catch (error) {
            set({ cexAccounts: snapshot, cexError: extractErrorMessage(error, 'Failed to delete CEX account') });
            throw error;
        }
    },
    // delete DEX account(positive deletion)
    deleteDexAccount: async (id) => {
        const snapshot = get().dexAccounts;
        set((state) => ({
            dexAccounts: state.dexAccounts.filter((account) =>
            account.id !== id),
        }));
        try {
            await accountApiService.deleteDexAccount(id);
        } catch (error) {
            set({ dexAccounts: snapshot, dexError: extractErrorMessage(error, 'Failed to delete DEX account') });
            throw error;
        }
    },
    // test CEX account connection
    testCexAccountConnection: async (id) => {
        set((state) => ({
            testingConnectionIds: new Set([...state.testingConnectionIds, id]),
        }));
        try {
            return await accountApiService.testCexAccountConnection(id);
        } finally {
            set((state) => {
                const next = new Set(state.testingConnectionIds);
                next.delete(id);
                return { testingConnectionIds: next };
            });
        }
    },
    // test DEX account connection
    testDexAccountConnection: async (id) => {
        set((state) => ({
            testingConnectionIds: new Set([...state.testingConnectionIds, id]),
        }));
        try {
            return await accountApiService.testDexAccountConnection(id);
        } finally {
            set((state) => {
                const next = new Set(state.testingConnectionIds);
                next.delete(id);
                return { testingConnectionIds: next };
            });
        }
    },
    // clear error messages
    clearErrors: () => {
        set({ cexError: null, dexError: null });
    },

}))
