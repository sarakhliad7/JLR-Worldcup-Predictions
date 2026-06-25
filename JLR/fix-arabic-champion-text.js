const fs = require('fs');
const file = 'lib/i18n/dictionary.js';
let s = fs.readFileSync(file, 'utf8');

s = s.replace(
  "champion_bonus: '+30 نقطة لو أصبت'",
  "champion_bonus: '+20 نقطة لو أصبت · آخر موعد 3 July'"
);

s = s.replace(
  "champion_lockedError: 'أُغلق تحدي البطل بعد بداية دور الـ32'",
  "champion_lockedError: 'أُغلق تحدي البطل بعد 3 July'"
);

fs.writeFileSync(file, s, 'utf8');
console.log('Arabic champion text updated');
