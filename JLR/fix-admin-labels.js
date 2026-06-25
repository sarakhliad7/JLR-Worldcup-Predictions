const fs = require('fs');

let dict = fs.readFileSync('lib/i18n/dictionary.js', 'utf8');

if (!dict.includes("admin_nav_announcements: 'Announcements'")) {
  dict = dict.replace(
    "admin_nav_matches: 'Matches',",
    "admin_nav_matches: 'Matches',\n    admin_nav_announcements: 'Announcements',"
  );
}

if (!dict.includes("admin_nav_announcements: 'التعاميم'")) {
  dict = dict.replace(
    "admin_nav_matches: 'المباريات',",
    "admin_nav_matches: 'المباريات',\n    admin_nav_announcements: 'التعاميم',"
  );
}

dict = dict.replace(
  "admin_employees_importHint: 'Columns: Email, Full Name, Department'",
  "admin_employees_importHint: 'Columns: Full Name, Email, Employee ID, ID Number, Department'"
);

dict = dict.replace(
  "admin_employees_importHint: 'الأعمدة: Email, Full Name, Department'",
  "admin_employees_importHint: 'الأعمدة: Full Name, Email, Employee ID, ID Number, Department'"
);

fs.writeFileSync('lib/i18n/dictionary.js', dict, 'utf8');
console.log('Fixed admin announcements label and import hint.');
