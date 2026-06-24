// Seed script — adds JLR's real departments, the six achievement badges,
// and a sample admin + employee account for first login.
// Run with: npm run db:seed

const { PrismaClient } = require('@prisma/client');
const { scryptSync, randomBytes } = require('crypto');

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

const prisma = new PrismaClient();

const DEPARTMENTS = [
  { name: 'Product & Pricing', nameAr: 'المنتجات والتسعير', shortCode: 'P&P', colorHex: '#D9A441' },
  { name: 'Ordering', nameAr: 'الطلبات', shortCode: 'ORD', colorHex: '#8B7FD9' },
  { name: 'HR', nameAr: 'الموارد البشرية', shortCode: 'HR', colorHex: '#2C9587' },
  { name: 'Sales', nameAr: 'المبيعات', shortCode: 'SLS', colorHex: '#6FA8B8' },
  { name: 'Marketing', nameAr: 'التسويق', shortCode: 'MKT', colorHex: '#E0599E' },
  { name: 'Finance', nameAr: 'المالية', shortCode: 'FIN', colorHex: '#E2543A' },
  { name: 'CRM', nameAr: 'علاقات العملاء', shortCode: 'CRM', colorHex: '#4F8FC0' },
  { name: 'Aftersales', nameAr: 'خدمات ما بعد البيع', shortCode: 'AFS', colorHex: '#7BAE5C' },
  { name: 'APO', nameAr: 'تخطيط العمليات والمبيعات', shortCode: 'APO', colorHex: '#B98A3D' },
];

// Achievement display text now lives in lib/i18n/dictionary.js (keyed by `code`).
// This table only needs the code + icon key; name/description here are for
// admin reference only (e.g. when browsing the DB in Prisma Studio).
const ACHIEVEMENTS = [
  { code: 'astoori', name: 'Full Group Prediction', description: 'Predicted all matches in a group', icon: 'astoori' },
  { code: 'muhannak', name: 'Winning Streak', description: '5 correct predictions in a row', icon: 'muhannak' },
  { code: 'batal_tawaqqu', name: 'Prediction Accuracy', description: 'Correctly predicted the exact score', icon: 'batal_tawaqqu' },
  { code: 'wahsh_usboo', name: 'Star of the Week', description: "Best weekly prediction performance", icon: 'wahsh_usboo' },
  { code: 'saed_mufajaat', name: 'Upset Predictor', description: 'Correctly predicted an underdog win', icon: 'saed_mufajaat' },
  { code: 'sinbaq', name: 'Early Predictor', description: 'Submitted predictions 24 hours early', icon: 'sinbaq' },
];

async function main() {
  console.log('Seeding departments...');
  const deptRecords = {};
  for (const d of DEPARTMENTS) {
    const rec = await prisma.department.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    });
    deptRecords[d.shortCode] = rec;
  }

  console.log('Seeding achievements...');
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      update: {},
      create: a,
    });
  }

  console.log('Seeding a sample admin + employee for first login...');
  const adminPass = hashPassword('admin123');
  await prisma.user.upsert({
    where: { employeeCode: '1001' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@jlr.com',
      employeeCode: '1001',
      passwordHash: adminPass,
      role: 'ADMIN',
      avatarLabel: 'SA',
      departmentId: deptRecords['CRM'].id,
    },
  });

  const empPass = hashPassword('1234');
  await prisma.user.upsert({
    where: { employeeCode: '1002' },
    update: {},
    create: {
      name: 'Demo Employee',
      email: 'demo@jlr.com',
      employeeCode: '1002',
      passwordHash: empPass,
      role: 'EMPLOYEE',
      avatarLabel: 'DE',
      departmentId: deptRecords['SLS'].id,
    },
  });

  console.log('Seeding a welcome announcement...');
  await prisma.announcement.create({
    data: {
      title: 'Welcome to the JLR World Cup Predictions League!',
      titleAr: 'مرحبًا بكم في دوري توقعات JLR!',
      body: 'Submit your predictions for every World Cup 2026 match and compete with your colleagues for the top spot. 6 points for an exact score, 3 points for the correct winner. Good luck!',
      bodyAr: 'سجّل توقعاتك لكل مباريات كأس العالم 2026 وتسابق مع زملائك على القمة. 6 نقاط للنتيجة الدقيقة، 3 نقاط للفوز الصحيح. بالتوفيق!',
      pinned: true,
    },
  });

  console.log('Done. Sign in with demo@jlr.com / 1002 / 1234 (employee) or admin@jlr.com / 1001 / admin123 (admin).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
