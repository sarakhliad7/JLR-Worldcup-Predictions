const fs = require('fs');

let s = fs.readFileSync('prisma/schema.prisma', 'utf8');

// remove hidden BOM character at the start
s = s.replace(/^\uFEFF/, '');

fs.writeFileSync('prisma/schema.prisma', s, { encoding: 'utf8' });

console.log('Removed BOM from schema.prisma');
