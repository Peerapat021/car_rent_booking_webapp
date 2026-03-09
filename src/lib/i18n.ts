'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// import ไฟล์ภาษาตรงๆ แทน HttpBackend
import th from '../../public/locales/th/translation.json';
import en from '../../public/locales/en/translation.json';

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        th: { translation: th },
        en: { translation: en },
      },
      supportedLngs: ['th', 'en'],
      fallbackLng: 'th',
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
      },
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;