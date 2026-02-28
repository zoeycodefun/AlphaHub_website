import { create } from "zustand";

interface LanguageState {
    currentLanguage: string;
    setCurrentLanguage: (language: string) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
    currentLanguage: 'zh',
    setCurrentLanguage: (language) => set({ currentLanguage: language})
}))
