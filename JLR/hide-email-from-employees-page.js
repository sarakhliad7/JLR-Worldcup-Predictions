const fs = require('fs');

let s = fs.readFileSync('app/admin/employees/page.js', 'utf8');

// 1) Remove email from search placeholder
s = s.replace(
  'placeholder="Search by name, ID number, employee ID, email, or department..."',
  'placeholder="Search by name, ID number, employee ID, or department..."'
);

// 2) Remove email from search matching
s = s.replace(
  "        e.email?.toLowerCase().includes(term) ||\n        e.idNumber?.toLowerCase().includes(term) ||",
  "        e.idNumber?.toLowerCase().includes(term) ||"
);

// 3) Remove Email header
s = s.replace(
  `              <th className="px-4 py-3 text-start font-semibold">
                {t('admin_employees_email')}
              </th>
`,
  ''
);

// 4) Remove Email cell
s = s.replace(
  `                <td className="px-4 py-3 text-ink-body">{e.email}</td>
`,
  ''
);

// 5) Change import hint visible text if hardcoded somewhere is still old
s = s.replace(
  'Columns: Full Name, Email, Employee ID, ID Number, Department',
  'Columns: Full Name, Employee ID, ID Number, Department'
);

fs.writeFileSync('app/admin/employees/page.js', s, 'utf8');

console.log('Email column hidden from Employees page.');
