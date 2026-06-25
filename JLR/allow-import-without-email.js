const fs = require('fs');

let s = fs.readFileSync('app/api/admin/employees/import/route.js', 'utf8');

// Make email optional in required-field validation
s = s.replace(
  "if (!email || !fullName || !employeeCode || !idNumber) {",
  "if (!fullName || !employeeCode || !idNumber) {"
);

// Add generated email fallback before duplicate check
s = s.replace(
  "const existing = await prisma.user.findFirst({",
  "const finalEmail = email || `${employeeCode}@no-email.jlr.local`;\n\n    const existing = await prisma.user.findFirst({"
);

// Use finalEmail in duplicate check
s = s.replace(
  "OR: [\n          { email },",
  "OR: [\n          { email: finalEmail },"
);

// Use finalEmail in create
s = s.replace(
  "email,\n        employeeCode,",
  "email: finalEmail,\n        employeeCode,"
);

// Use finalEmail in credentials result
s = s.replace(
  "email,\n      employeeCode,",
  "email: finalEmail,\n      employeeCode,"
);

fs.writeFileSync('app/api/admin/employees/import/route.js', s, 'utf8');

console.log('Import now allows employees without email.');
