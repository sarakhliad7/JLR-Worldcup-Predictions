// Seed script â€” adds JLR's real departments, the six achievement badges,
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
  { name: 'Product & Pricing', nameAr: 'ط§ظ„ظ…ظ†طھط¬ط§طھ ظˆط§ظ„طھط³ط¹ظٹط±', shortCode: 'P&P', colorHex: '#D9A441' },
  { name: 'Ordering', nameAr: 'ط§ظ„ط·ظ„ط¨ط§طھ', shortCode: 'ORD', colorHex: '#8B7FD9' },
  { name: 'HR', nameAr: 'ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©', shortCode: 'HR', colorHex: '#2C9587' },
  { name: 'Sales', nameAr: 'ط§ظ„ظ…ط¨ظٹط¹ط§طھ', shortCode: 'SLS', colorHex: '#6FA8B8' },
  { name: 'Marketing', nameAr: 'ط§ظ„طھط³ظˆظٹظ‚', shortCode: 'MKT', colorHex: '#E0599E' },
  { name: 'Finance', nameAr: 'ط§ظ„ظ…ط§ظ„ظٹط©', shortCode: 'FIN', colorHex: '#E2543A' },
  { name: 'CRM', nameAr: 'ط¹ظ„ط§ظ‚ط§طھ ط§ظ„ط¹ظ…ظ„ط§ط،', shortCode: 'CRM', colorHex: '#4F8FC0' },
  { name: 'Aftersales', nameAr: 'ط®ط¯ظ…ط§طھ ظ…ط§ ط¨ط¹ط¯ ط§ظ„ط¨ظٹط¹', shortCode: 'AFS', colorHex: '#7BAE5C' },
  { name: 'APO', nameAr: 'طھط®ط·ظٹط· ط§ظ„ط¹ظ…ظ„ظٹط§طھ ظˆط§ظ„ظ…ط¨ظٹط¹ط§طھ', shortCode: 'APO', colorHex: '#B98A3D' },
];

// Achievement display text now lives in lib/i18n/dictionary.js (keyed by `code`).
// This table only needs the code + icon key; name/description here are for
// admin reference only (e.g. when browsing the DB in Prisma Studio).
const ACHIEVEMENTS = [
  { code: 'astoori', name: 'Legend', description: 'Predicted an entire group correctly', icon: 'astoori' },
  { code: 'muhannak', name: 'Sharp Shooter', description: '5 correct in a row', icon: 'muhannak' },
  { code: 'batal_tawaqqu', name: 'Prediction Accuracy', description: 'Hit the exact score', icon: 'batal_tawaqqu' },
  { code: 'wahsh_usboo', name: 'Weekly Beast', description: "All of a week's predictions correct", icon: 'wahsh_usboo' },
  { code: 'saed_mufajaat', name: 'Upset Hunter', description: 'Correctly called an underdog win', icon: 'saed_mufajaat' },
  { code: 'sinbaq', name: 'Early Predictor', description: 'Predicted 24 hours ahead', icon: 'sinbaq' },
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
      titleAr: 'ظ…ط±ط­ط¨ظ‹ط§ ط¨ظƒظ… ظپظٹ ط¯ظˆط±ظٹ طھظˆظ‚ط¹ط§طھ JLR!',
      body: 'Submit your predictions for every World Cup 2026 match and compete with your colleagues for the top spot. 6 points for an exact score, 3 points for the correct winner. Good luck!',
      bodyAr: 'ط³ط¬ظ‘ظ„ طھظˆظ‚ط¹ط§طھظƒ ظ„ظƒظ„ ظ…ط¨ط§ط±ظٹط§طھ ظƒط£ط³ ط§ظ„ط¹ط§ظ„ظ… 2026 ظˆطھط³ط§ط¨ظ‚ ظ…ط¹ ط²ظ…ظ„ط§ط¦ظƒ ط¹ظ„ظ‰ ط§ظ„ظ‚ظ…ط©. 6 ظ†ظ‚ط§ط· ظ„ظ„ظ†طھظٹط¬ط© ط§ظ„ط¯ظ‚ظٹظ‚ط©طŒ 3 ظ†ظ‚ط§ط· ظ„ظ„ظپظˆط² ط§ظ„طµط­ظٹط­. ط¨ط§ظ„طھظˆظپظٹظ‚!',
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

