const fs = require('fs');

let s = fs.readFileSync('app/rewards/page.js', 'utf8');

// Find the rules section
const rulesStart = s.indexOf('<section className="rounded-[2rem] border border-card-border/70 bg-white/75 p-5 shadow-sm">\n        <h2 className="mb-4 text-lg font-bold text-ink-heading">{t.rulesTitle}</h2>');

if (rulesStart === -1) {
  console.error('Rules section not found.');
  process.exit(1);
}

// Find end of rules section by locating next section after it
const nextSectionAfterRules = s.indexOf('\n\n      <section', rulesStart + 20);
if (nextSectionAfterRules === -1) {
  console.error('End of rules section not found.');
  process.exit(1);
}

const rulesSection = s.slice(rulesStart, nextSectionAfterRules);
s = s.slice(0, rulesStart) + s.slice(nextSectionAfterRules);

// Put rules section right after the intro/title section
const introEndMarker = '</section>\n\n      <section';
const introEnd = s.indexOf(introEndMarker);

if (introEnd === -1) {
  console.error('Intro section end not found.');
  process.exit(1);
}

s =
  s.slice(0, introEnd + '</section>'.length) +
  '\n\n      ' +
  rulesSection +
  '\n\n      ' +
  s.slice(introEnd + '</section>\n\n      '.length);

fs.writeFileSync('app/rewards/page.js', s, 'utf8');

console.log('Rules section moved to the top.');
