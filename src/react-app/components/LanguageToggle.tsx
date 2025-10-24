import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { useState } from 'react';

export default function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'ja', name: t('common.japanese'), flag: '🇯🇵' },
    { code: 'en', name: t('common.english'), flag: '🇺🇸' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
        title={t('common.language')}
      >
        <Languages className="w-4 h-4" />
        <span className="text-sm">{currentLanguage.flag}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-gray-700 rounded-lg shadow-lg border border-gray-600 min-w-[140px] z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center space-x-3 px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                i18n.language === language.code
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <span>{language.name}</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
