const fs = require('fs');

const files = [
  'lib/i18n/dictionary.js',
  'prisma/seed.js',
];

const replacements = [
  // Arabic
  ['بطل التوقعات', 'دقّة التوقع'],
  ['محَنّك', 'سلسلة نجاح'],
  ['محنّك', 'سلسلة نجاح'],
  ['الأسطوري', 'توقع المجموعة كاملة'],
  ['السبّاق', 'التوقع المبكر'],
  ['السباق', 'التوقع المبكر'],
  ['صائد المفاجآت', 'توقع المفاجآت'],
  ['وحش الأسبوع', 'نجم الأسبوع'],

  // Arabic descriptions
  ['أصاب النتيجة بالضبط', 'أصاب النتيجة بالضبط'],
  ['5 صحيحة متتالية', '5 توقعات صحيحة متتالية'],
  ['توقع مجموعة كاملة', 'توقع جميع مباريات مجموعة كاملة'],
  ['توقع قبل 24 ساعة', 'أرسل توقعاته قبل 24 ساعة'],
  ['توقع فوز الأضعف', 'توقع فوز الفريق الأقل ترشيحًا'],
  ['كل توقعات الأسبوع صحيحة', 'أفضل أداء في توقعات الأسبوع'],

  // English names
  ['Prediction Champion', 'Prediction Accuracy'],
  ['Sharp Shooter', 'Winning Streak'],
  ['Legend', 'Full Group Prediction'],
  ['Early Bird', 'Early Predictor'],
  ['Upset Hunter', 'Upset Predictor'],
  ['Weekly Beast', 'Star of the Week'],

  // Other possible English names
  ['Prediction Hero', 'Prediction Accuracy'],
  ['Exact Score Hero', 'Prediction Accuracy'],
  ['Veteran', 'Winning Streak'],
  ['Legendary', 'Full Group Prediction'],
  ['The Legend', 'Full Group Prediction'],
  ['Surprise Hunter', 'Upset Predictor'],
  ['Week Beast', 'Star of the Week'],
  ['Beast of the Week', 'Star of the Week'],

  // English descriptions
  ['Hit the exact score', 'Correctly predicted the exact score'],
  ['5 correct in a row', '5 correct predictions in a row'],
  ['Predicted an entire group correctly', 'Predicted all matches in a group'],
  ['Predicted 24 hours ahead', 'Submitted predictions 24 hours early'],
  ['Correctly called an underdog win', 'Correctly predicted an underdog win'],
  ["All of a week's predictions correct", 'Best weekly prediction performance'],
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;

  const backup = `${file}.backup-before-achievement-labels`;
  if (!fs.existsSync(backup)) {
    fs.copyFileSync(file, backup);
  }

  let content = fs.readFileSync(file, 'utf8');
  let updated = content;

  for (const [from, to] of replacements) {
    updated = updated.split(from).join(to);
  }

  if (updated !== content) {
    fs.writeFileSync(file, updated, 'utf8');
    console.log(`Updated: ${file}`);
  } else {
    console.log(`No changes: ${file}`);
  }
}
