'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { translate } from './dictionary';

const LocaleContext = createContext({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
  dir: 'ltr',
});

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState('en');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;
    if (saved === 'ar' || saved === 'en') {
      setLocaleState(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  function setLocale(next) {
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', next);
    }
  }

  const t = (key) => translate(locale, key);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
