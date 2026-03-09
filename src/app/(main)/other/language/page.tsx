'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Globe, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Goback from '@/components/goback';

const languages = [
  { code: 'th', nativeName: 'ไทย', name: 'Thai', flag: '🇹🇭' },
  { code: 'en', nativeName: 'English', name: 'English', flag: '🇺🇸' },
];

export default function LanguagePage() {
  const { i18n, t, ready } = useTranslation();
  const router = useRouter();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (!ready) return <div className="p-10 text-center">กำลังโหลด...</div>;

  const currentLang = i18n.language;

  return (
    <>
      {/* Mobile Header */}
      <Goback title="ภาษา / Language" />
     
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">{t('language')} / Language</h1>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {languages.map((lang) => {
            const active = currentLang.startsWith(lang.code);

            return (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`
                  flex items-center justify-between px-5 py-5 rounded-xl border transition
                  ${active ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}
                `}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{lang.flag}</span>
                  <div className="text-left">
                    <div className={`font-semibold text-lg ${active ? 'text-blue-700' : ''}`}>
                      {lang.nativeName}
                    </div>
                    <div className="text-gray-500">{lang.name}</div>
                  </div>
                </div>
                {active && (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}