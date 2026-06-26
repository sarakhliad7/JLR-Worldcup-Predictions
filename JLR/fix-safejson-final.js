const fs = require('fs');

let s = fs.readFileSync('app/admin/employees/page.js', 'utf8');

// Remove any broken/old safeJson helper
s = s.replace(/async function safeJson\(res\) \{[\s\S]*?\n\}\n\n/g, '');
s = s.replace(/const safeJson = async \(res\) => \{[\s\S]*?\n\};\n\n/g, '');

// Insert safeJson after the last import
const helper = `async function safeJson(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

`;

const imports = [...s.matchAll(/^import .*;$/gm)];
if (imports.length > 0) {
  const last = imports[imports.length - 1];
  const insertAt = last.index + last[0].length;
  s = s.slice(0, insertAt) + '\n\n' + helper + s.slice(insertAt);
} else {
  s = helper + s;
}

// Make sure JSON calls use safeJson
s = s.replaceAll('await res.json()', 'await safeJson(res)');
s = s.replaceAll('await response.json()', 'await safeJson(response)');

// Remove Email from visible columns text
s = s.replaceAll(
  'Columns: Full Name, Email, Employee ID, ID Number, Department',
  'Columns: Full Name, Employee ID, ID Number, Department'
);

fs.writeFileSync('app/admin/employees/page.js', s, 'utf8');

// Also remove Email hint from dictionary if it exists there
const dictPath = 'lib/i18n/dictionary.js';
if (fs.existsSync(dictPath)) {
  let d = fs.readFileSync(dictPath, 'utf8');
  d = d.replaceAll(
    'Columns: Full Name, Email, Employee ID, ID Number, Department',
    'Columns: Full Name, Employee ID, ID Number, Department'
  );
  fs.writeFileSync(dictPath, d, 'utf8');
}

console.log('safeJson fixed and Email hint removed.');
