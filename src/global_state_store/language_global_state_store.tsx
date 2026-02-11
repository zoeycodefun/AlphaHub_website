import { create } from "zustand";

interface LanguageState {
    currentLanguage: string;
    setCurrentLanguage: (language: string) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
    currentLanguage: 'zh', // 默认语言为中文
    setCurrentLanguage: (language) => set({ currentLanguage: language})
}))
