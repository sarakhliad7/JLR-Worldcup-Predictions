const fs = require('fs');

let s = fs.readFileSync('app/admin/employees/page.js', 'utf8');

// Remove email from initial form state if present
s = s.replaceAll("email: '',", "");

// Remove email input block - common patterns
s = s.replace(
/\s*<div>\s*<label[^>]*>\s*\{?t\(['"]admin_employees_email['"]\)\}?\s*<\/label>\s*<input[\s\S]*?name=["']email["'][\s\S]*?\/>\s*<\/div>/g,
''
);

s = s.replace(
/\s*<div>\s*<label[^>]*>\s*Email\s*<\/label>\s*<input[\s\S]*?name=["']email["'][\s\S]*?\/>\s*<\/div>/g,
''
);

// Remove email from submit payload if direct object has it
s = s.replaceAll("email: form.email,", "");
s = s.replaceAll("email: form.email?.trim(),", "");
s = s.replaceAll("email: form.email.trim(),", "");

// Remove email from edit object if present
s = s.replaceAll("email: employee.email || '',", "");

fs.writeFileSync('app/admin/employees/page.js', s, 'utf8');

console.log('Email removed from manual employee form.');
