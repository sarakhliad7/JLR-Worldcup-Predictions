const fs = require('fs');

let s = fs.readFileSync('app/api/admin/employees/import/route.js', 'utf8');

const oldFn = `function getField(row, candidates) {
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return String(row[key]).trim();
    }
  }
  return '';
}`;

const newFn = `function getField(row, candidates) {
  const normalizedRow = {};
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = String(key).trim().toLowerCase();
    normalizedRow[normalizedKey] = value;
  }

  for (const key of candidates) {
    const normalizedKey = String(key).trim().toLowerCase();
    const value = normalizedRow[normalizedKey];

    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }

  return '';
}`;

if (!s.includes(oldFn)) {
  console.error('getField function not found exactly.');
  process.exit(1);
}

s = s.replace(oldFn, newFn);

fs.writeFileSync('app/api/admin/employees/import/route.js', s, 'utf8');

console.log('Import headers are now flexible.');
