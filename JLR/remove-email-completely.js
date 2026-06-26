const fs = require('fs');

let importFile = fs.readFileSync('app/api/admin/employees/import/route.js', 'utf8');

// لا نقرأ email ولا نستخدم finalEmail
importFile = importFile.replace(/const email = getField\(row, \[[\s\S]*?\]\);\s*/g, '');
importFile = importFile.replace(/const finalEmail = email \|\| `\$\{employeeCode\}@no-email\.jlr\.local`;\s*/g, '');

// duplicate check بدون email
importFile = importFile.replace(/\s*\{ email: finalEmail \},\s*/g, '');

// create بدون email
importFile = importFile.replace(/\s*email: finalEmail,\s*/g, '\n');

// credentials بدون email
importFile = importFile.replace(/\s*email: finalEmail,\s*/g, '\n');

fs.writeFileSync('app/api/admin/employees/import/route.js', importFile, 'utf8');


let page = fs.readFileSync('app/admin/employees/page.js', 'utf8');

// النصوص
page = page.replaceAll('Columns: Full Name, Email, Employee ID, ID Number, Department', 'Columns: Full Name, Employee ID, ID Number, Department');
page = page.replaceAll('Columns: Full Name, Email Address, Employee ID, ID Number, Department', 'Columns: Full Name, Employee ID, ID Number, Department');
page = page.replaceAll('Search by name, ID number, employee ID, email, or department...', 'Search by name, ID number, employee ID, or department...');

// شيل أي بلوك فيه name="email"
page = page.replace(/<div[^>]*>\s*<label[^>]*>[\s\S]*?Email[\s\S]*?name=["']email["'][\s\S]*?<\/div>/gi, '');
page = page.replace(/<div[^>]*>[\s\S]*?name=["']email["'][\s\S]*?<\/div>/gi, '');

// شيل email من state/payload/search
page = page.replaceAll("email: '',", '');
page = page.replaceAll('email: form.email,', '');
page = page.replaceAll('email: form.email?.trim(),', '');
page = page.replaceAll('email: employee.email || \'\',', '');
page = page.replaceAll('email: employee.email || "",', '');
page = page.replace(/.*\.email\?\.[^\n]*\n/g, '');

fs.writeFileSync('app/admin/employees/page.js', page, 'utf8');


let api = fs.readFileSync('app/api/admin/employees/route.js', 'utf8');

// صلحي أي خراب سابق
api = api.replaceAll('email: e.email: finalEmail,', 'email: e.email,');
api = api.replaceAll('email: user.email: finalEmail,', 'email: user.email,');
api = api.replaceAll('email: finalEmail: finalEmail,', 'email: finalEmail,');

// لا يكون الإيميل مطلوب
api = api.replaceAll('if (!name || !email || !employeeCode', 'if (!name || !employeeCode');
api = api.replaceAll('if (!email || !name || !employeeCode', 'if (!name || !employeeCode');

// لا نسوي finalEmail
api = api.replace(/const finalEmail =[\s\S]*?;\s*/g, '');

// duplicate check بدون email
api = api.replace(/\s*\{ email: finalEmail \},\s*/g, '');
api = api.replace(/\s*\{ email \},\s*/g, '');

// create بدون email
api = api.replace(/\s*email: finalEmail,\s*/g, '\n');
api = api.replace(/\s*email,\s*/g, '\n');

// response بدون email
api = api.replace(/,\s*email: user\.email/g, '');
api = api.replace(/email: e\.email,\s*/g, '');

fs.writeFileSync('app/api/admin/employees/route.js', api, 'utf8');

console.log('Email fully removed from employee import, form, and API.');
