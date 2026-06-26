const fs = require('fs');

let s = fs.readFileSync('app/api/admin/employees/import/route.js', 'utf8');

s = s.replace(
  `const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });`,
  `const workbook = XLSX.read(buffer, { type: 'buffer' });
    rows = workbook.SheetNames.flatMap((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(sheet, { defval: '' });
    });`
);

fs.writeFileSync('app/api/admin/employees/import/route.js', s, 'utf8');
console.log('Import now reads all sheets.');
