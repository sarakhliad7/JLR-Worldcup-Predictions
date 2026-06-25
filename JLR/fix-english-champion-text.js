const fs = require('fs');
const file = 'lib/i18n/dictionary.js';
let s = fs.readFileSync(file, 'utf8');

s = s.replace(
  "champion_bonus: '+30 points if correct'",
  "champion_bonus: '+20 points if correct · Deadline: 3 July'"
);

s = s.replace(
  "champion_lockedError: 'Champion picks closed once Round of 32 began'",
  "champion_lockedError: 'Champion picks closed after 3 July'"
);

fs.writeFileSync(file, s, 'utf8');
console.log('English champion text updated');
