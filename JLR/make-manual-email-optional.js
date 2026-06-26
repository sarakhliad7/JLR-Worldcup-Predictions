const fs = require('fs');

let s = fs.readFileSync('app/api/admin/employees/route.js', 'utf8');

// make email optional where body is parsed
s = s.replace(
  /const\s+\{\s*name,\s*email,\s*employeeCode,\s*idNumber,\s*departmentId,\s*role\s*\}\s*=\s*body;/,
  "const { name, email, employeeCode, idNumber, departmentId, role } = body;\n    const finalEmail = email?.trim() || `${String(employeeCode).trim()}@no-email.jlr.local`;"
);

// replace required email checks
s = s.replaceAll("if (!name || !email || !employeeCode", "if (!name || !employeeCode");
s = s.replaceAll("if (!email || !name || !employeeCode", "if (!name || !employeeCode");

// replace email usage in duplicate check/create
s = s.replaceAll("{ email }", "{ email: finalEmail }");
s = s.replaceAll("email,", "email: finalEmail,");

fs.writeFileSync('app/api/admin/employees/route.js', s, 'utf8');

console.log('Manual employee API now allows missing email.');
