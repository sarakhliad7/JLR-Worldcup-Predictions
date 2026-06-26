const fs = require('fs');

let s = fs.readFileSync('app/admin/employees/page.js', 'utf8');

// Remove email from visible template/help text
s = s.replaceAll(
  'Columns: Full Name, Email, Employee ID, ID Number, Department',
  'Columns: Full Name, Employee ID, ID Number, Department'
);

s = s.replaceAll(
  'Columns: Full Name, Email Address, Employee ID, ID Number, Department',
  'Columns: Full Name, Employee ID, ID Number, Department'
);

// Remove Email from common template header arrays
s = s.replaceAll(
  "['Full Name', 'Email', 'Employee ID', 'ID Number', 'Department']",
  "['Full Name', 'Employee ID', 'ID Number', 'Department']"
);

s = s.replaceAll(
  '["Full Name", "Email", "Employee ID", "ID Number", "Department"]',
  '["Full Name", "Employee ID", "ID Number", "Department"]'
);

s = s.replaceAll(
  "['Full Name', 'Email Address', 'Employee ID', 'ID Number', 'Department']",
  "['Full Name', 'Employee ID', 'ID Number', 'Department']"
);

s = s.replaceAll(
  '["Full Name", "Email Address", "Employee ID", "ID Number", "Department"]',
  '["Full Name", "Employee ID", "ID Number", "Department"]'
);

// Remove email fields from sample rows if present
s = s.replaceAll(/,\s*Email:\s*['"][^'"]*['"]/g, '');
s = s.replaceAll(/,\s*'Email Address':\s*['"][^'"]*['"]/g, '');
s = s.replaceAll(/,\s*"Email Address":\s*['"][^'"]*['"]/g, '');

fs.writeFileSync('app/admin/employees/page.js', s, 'utf8');

console.log('Email removed from employee template.');
