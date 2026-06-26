const fs = require('fs');

let s = fs.readFileSync('app/api/admin/employees/route.js', 'utf8');

// Fix all broken email syntax caused by previous replace
s = s.replaceAll('email: e.email: finalEmail,', 'email: e.email,');
s = s.replaceAll('email: user.email: finalEmail,', 'email: user.email,');
s = s.replaceAll('email: finalEmail: finalEmail,', 'email: finalEmail,');

fs.writeFileSync('app/api/admin/employees/route.js', s, 'utf8');

console.log('All broken email syntax fixed.');
