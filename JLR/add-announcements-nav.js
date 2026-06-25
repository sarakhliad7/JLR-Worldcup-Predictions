const fs = require('fs');

// 1) Add Announcements link to admin nav
let layout = fs.readFileSync('app/admin/layout.js', 'utf8');

layout = layout.replace(
  "  { href: '/admin/matches', labelKey: 'admin_nav_matches' },\n  { href: '/admin/predictions', labelKey: 'admin_nav_predictions' },",
  "  { href: '/admin/matches', labelKey: 'admin_nav_matches' },\n  { href: '/admin/announcements', labelKey: 'admin_nav_announcements' },\n  { href: '/admin/predictions', labelKey: 'admin_nav_predictions' },"
);

fs.writeFileSync('app/admin/layout.js', layout, 'utf8');

// 2) Add dictionary labels
let dict = fs.readFileSync('lib/i18n/dictionary.js', 'utf8');

dict = dict.replace(
  "    admin_nav_matches: 'Matches',\n    admin_nav_predictions: 'Predictions',",
  "    admin_nav_matches: 'Matches',\n    admin_nav_announcements: 'Announcements',\n    admin_nav_predictions: 'Predictions',"
);

dict = dict.replace(
  "    admin_nav_matches: 'المباريات',\n    admin_nav_predictions: 'التوقعات',",
  "    admin_nav_matches: 'المباريات',\n    admin_nav_announcements: 'التعاميم',\n    admin_nav_predictions: 'التوقعات',"
);

fs.writeFileSync('lib/i18n/dictionary.js', dict, 'utf8');

console.log('Admin Announcements nav added.');
