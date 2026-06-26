const fs = require('fs');

let s = fs.readFileSync('app/api/admin/employees/route.js', 'utf8');

s = s.replace(
  "import { hashPassword } from '../../../../lib/auth';",
  "import crypto from 'crypto';"
);

s = s.replaceAll(
  'passwordHash: hashPassword(plainPassword),',
  "passwordHash: crypto.createHash('sha256').update(plainPassword).digest('hex'),"
);

fs.writeFileSync('app/api/admin/employees/route.js', s, 'utf8');

console.log('Password hash fixed.');
