const fs = require('fs');

let s = fs.readFileSync('app/rewards/page.js', 'utf8');

// Remove bad LanguageProvider import
s = s.replace(/import \{ useLanguage \} from ['"][^'"]+['"];\n\n/g, '');

// Force English content
s = s.replace(
  `  const { language } = useLanguage();
  const t = content[language] || content.en;
  const isArabic = language === 'ar';`,
  `  const t = content.en;
  const isArabic = false;`
);

fs.writeFileSync('app/rewards/page.js', s, 'utf8');

console.log('Rewards page fixed without LanguageProvider.');
