const fs = require('fs');

function update(file, replacements) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [from, to] of replacements) {
    s = s.split(from).join(to);
  }
  fs.writeFileSync(file, s, 'utf8');
  console.log('Updated:', file);
}

// 1) Visible text
update('lib/i18n/dictionary.js', [
  ["pred_rulesHint: 'Exact score = 6 points · Correct winner = 3 points'", "pred_rulesHint: 'Exact score = 4 points · Correct winner = 2 points'"],
  ["pred_rulesHint: 'النتيجة بالضبط = 6 نقاط · الفائز الصحيح = 3 نقاط'", "pred_rulesHint: 'النتيجة بالضبط = 4 نقاط · الفائز الصحيح = 2 نقاط'"],
  ["champion_bonus: '+30 points if correct'", "champion_bonus: '+20 points if correct · Deadline: 3 July'"],
  ["champion_bonus: '+30 نقطة لو أصبت'", "champion_bonus: '+20 نقطة لو أصبت · آخر موعد 3 July'"],
  ["champion_lockedError: 'Champion picks closed once Round of 32 began'", "champion_lockedError: 'Champion picks closed after 3 July'"],
  ["champion_lockedError: 'أُغلق تحدي البطل بعد بداية دور الـ32'", "champion_lockedError: 'أُغلق تحدي البطل بعد 3 July'"],
]);

// 2) Actual scoring rules
update('lib/scoring.js', [
  ['6 points = exact score', '4 points = exact score'],
  ['3 points = correct outcome', '2 points = correct outcome'],
  ['export const POINTS_EXACT = 6;', 'export const POINTS_EXACT = 4;'],
  ['export const POINTS_OUTCOME = 3;', 'export const POINTS_OUTCOME = 2;'],
  ['export const CHAMPION_BONUS = 30;', 'export const CHAMPION_BONUS = 20;'],
]);

// 3) Leaderboard exact-score tie breaker
update('app/api/leaderboard/route.js', [
  ['p.pointsAwarded === 6', 'p.pointsAwarded === 4'],
]);

// 4) Achievements exact-score check
update('lib/recompute.js', [
  ['p.pointsAwarded === 6', 'p.pointsAwarded === 4'],
]);

console.log('Done');
