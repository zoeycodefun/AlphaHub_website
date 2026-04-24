// language switcher
import { useLanguageStore } from '../../global_state_store/language_global_state_store';
import React, {useCallback, memo} from 'react';
/**
 * language switcher: v1 version only supports Chinese and English language switching, more languages will be added in the future if needed
 * language switcher is a manual switch, updates the global state, backend API returns corresponding language data (Chinese/English) based on the state
 */

interface LanguageOption {
    languageCode: string;
    label: string;
    icon: string;
}
// language options, can be extended in the future for more languages, currently only Chinese and English
const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
    {languageCode: 'zh', label: '简体中文', icon: 'ZH'},
    {languageCode: 'en', label: 'English', icon: 'EN'},
] as const;

const LanguageSwitcher: React.FC = memo(() => {
    const { currentLanguage, setCurrentLanguage } = useLanguageStore()
    const currentLanguageConfig = LANGUAGE_OPTIONS.find((language) => language.languageCode === currentLanguage) || LANGUAGE_OPTIONS[0];
    const toggleLanguage = useCallback(() => {
        const currentLanguageIndex = LANGUAGE_OPTIONS.findIndex(
            (language) => language.languageCode === currentLanguage
        );
        const nextLanguageIndex = (currentLanguageIndex + 1) % LANGUAGE_OPTIONS.length; // 循环索引
        const nextLanguage = LANGUAGE_OPTIONS[nextLanguageIndex];
        setCurrentLanguage(nextLanguage.languageCode);
        // save to local storage for persistence
    }, [currentLanguage, setCurrentLanguage]);
    const handleKeyboardDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleLanguage();
        }
    }, [toggleLanguage]);
    return (
        <button
        onClick={toggleLanguage}
        onKeyDown={handleKeyboardDown}
        className=' text-xs'
        >
            <span>
                {currentLanguageConfig.icon}
            </span>
            {/* change icon */}
            <svg
                className="w-4 h-4 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
            </svg>
        </button>
    );
});
LanguageSwitcher.displayName = 'LanguageSwitcher';
export default LanguageSwitcher;
