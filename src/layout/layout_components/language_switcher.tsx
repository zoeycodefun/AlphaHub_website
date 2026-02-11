// 语言切换器
import { useLanguageStore } from '../../global_state_store/language_global_state_store';
import React, {useCallback, memo} from 'react';
/**
 * 语言切换器：v1版本仅支持中英文语言互换，后期若产品拓展再拓展
 * 语言切换器为手动切换语言，更新全局状态，后端API根据状态返回对应的语言数据（中/英）
 */
// 语言选项接口-类型安全
interface LanguageOption {
    languageCode: string;
    label: string;
    icon: string;
}
// 语言选项统一配置
const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
    {languageCode: 'zh', label: '简体中文', icon: 'ZH'},
    {languageCode: 'en', label: 'English', icon: 'EN'},
] as const;

const LanguageSwitcher: React.FC = memo(() => {
    const { currentLanguage, setCurrentLanguage } = useLanguageStore() // 获取当前的语言状态与设置函数
    const currentLanguageConfig = LANGUAGE_OPTIONS.find((language) => language.languageCode === currentLanguage) || LANGUAGE_OPTIONS[0];
    const toggleLanguage = useCallback(() => {
        const currentLanguageIndex = LANGUAGE_OPTIONS.findIndex(
            (language) => language.languageCode === currentLanguage
        );
        const nextLanguageIndex = (currentLanguageIndex + 1) % LANGUAGE_OPTIONS.length; // 循环索引
        const nextLanguage = LANGUAGE_OPTIONS[nextLanguageIndex];
        setCurrentLanguage(nextLanguage.languageCode);
        // ‼️‼️‼️将语言选择存储到数据库，页面刷新仍旧是用户选择语言
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
            {/* 切换图标 */}
            <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true" // 对屏幕阅读器隐藏装饰性图标
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
LanguageSwitcher.displayName = 'LanguageSwitcher'; // 调试
export default LanguageSwitcher;
