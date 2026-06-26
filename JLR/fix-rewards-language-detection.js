const fs = require('fs');

let s = fs.readFileSync('app/rewards/page.js', 'utf8');

s = s.replace(
`function getSavedLanguage() {
  if (typeof window === 'undefined') return 'en';

  const keys = ['language', 'lang', 'locale', 'jlr-language', 'app-language'];

  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value === 'ar' || value === 'en') return value;
  }

  const htmlLang = document.documentElement.lang;
  if (htmlLang === 'ar' || htmlLang === 'en') return htmlLang;

  return 'en';
}`,
`function getSavedLanguage() {
  if (typeof window === 'undefined') return 'en';

  const htmlLang = document.documentElement.lang;
  const htmlDir = document.documentElement.dir;

  if (htmlLang === 'ar' || htmlDir === 'rtl') return 'ar';
  if (htmlLang === 'en' || htmlDir === 'ltr') return 'en';

  const possibleValues = Object.keys(window.localStorage)
    .map((key) => window.localStorage.getItem(key))
    .filter(Boolean);

  if (possibleValues.includes('ar')) return 'ar';
  if (possibleValues.includes('en')) return 'en';

  return 'en';
}`
);

s = s.replace(
`  useEffect(() => {
    setLanguage(getSavedLanguage());

    fetch('/api/rewards', { cache: 'no-store' })`,
`  useEffect(() => {
    const updateLanguage = () => setLanguage(getSavedLanguage());

    updateLanguage();
    const interval = setInterval(updateLanguage, 300);

    fetch('/api/rewards', { cache: 'no-store' })`
);

s = s.replace(
`      .catch(() => {
        setRounds(fallbackRounds);
      });
  }, []);`,
`      .catch(() => {
        setRounds(fallbackRounds);
      });

    return () => clearInterval(interval);
  }, []);`
);

fs.writeFileSync('app/rewards/page.js', s, 'utf8');

console.log('Rewards language detection fixed.');
