const fs = require('fs');

let s = fs.readFileSync('app/admin/employees/page.js', 'utf8');

// remove email from employee mapping
s = s.replaceAll('      email: emp.email,\n', '');

// fix created credentials display: no email
s = s.replaceAll('key={c.email}', 'key={c.employeeCode}');
s = s.replaceAll('{c.name} ({c.email})', '{c.name} ({c.employeeCode})');

// remove Email Field block
s = s.replace(
/\s*<Field label=\{t\('admin_employees_email'\)\}>\s*<input[\s\S]*?value=\{form\.email\}[\s\S]*?onChange=\{\(e\) => setForm\(\{ \.\.\.form,\s*email: e\.target\.value \}\)\}[\s\S]*?<\/Field>/g,
''
);

// remove any remaining form email state/update
s = s.replaceAll("email: '',", '');
s = s.replaceAll('email: form.email,', '');
s = s.replaceAll('email: form.email?.trim(),', '');
s = s.replaceAll("email: employee.email || '',", '');
s = s.replaceAll('email: employee.email || "",', '');

fs.writeFileSync('app/admin/employees/page.js', s, 'utf8');

console.log('Remaining email references removed from employees page.');
