-- ============================================================
-- JLR World Cup Predictions League -- database setup
-- Paste this whole file into Neon Console -> SQL Editor -> Run
-- Creates all tables and seeds initial data (departments, achievements, demo users)
-- ============================================================

-- ---------- Tables ----------

CREATE TABLE IF NOT EXISTS "Department" (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  "nameAr" TEXT,
  "shortCode" TEXT UNIQUE NOT NULL,
  "colorHex" TEXT NOT NULL DEFAULT '#9B6A43',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  "employeeCode" TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "avatarLabel" TEXT,
  role TEXT NOT NULL DEFAULT 'EMPLOYEE',
  "departmentId" TEXT REFERENCES "Department"(id),
  "totalPoints" INTEGER NOT NULL DEFAULT 0,
  "currentStreak" INTEGER NOT NULL DEFAULT 0,
  "bestStreak" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "User_totalPoints_idx" ON "User" ("totalPoints");

CREATE TABLE IF NOT EXISTS "Team" (
  id TEXT PRIMARY KEY,
  "nameEn" TEXT UNIQUE NOT NULL,
  "nameAr" TEXT,
  "flagEmoji" TEXT,
  "group" TEXT
);

CREATE TABLE IF NOT EXISTS "Match" (
  id TEXT PRIMARY KEY,
  "externalRef" TEXT UNIQUE,
  round TEXT NOT NULL,
  "group" TEXT,
  "kickoffAt" TIMESTAMP NOT NULL,
  venue TEXT,
  "homeTeamId" TEXT REFERENCES "Team"(id),
  "awayTeamId" TEXT REFERENCES "Team"(id),
  "homeTeamLabel" TEXT,
  "awayTeamLabel" TEXT,
  "homeScore" INTEGER,
  "awayScore" INTEGER,
  status TEXT NOT NULL DEFAULT 'SCHEDULED',
  "resultSource" TEXT NOT NULL DEFAULT 'AUTO',
  "lockAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Match_kickoffAt_idx" ON "Match" ("kickoffAt");
CREATE INDEX IF NOT EXISTS "Match_round_idx" ON "Match" (round);

CREATE TABLE IF NOT EXISTS "Prediction" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  "matchId" TEXT NOT NULL REFERENCES "Match"(id),
  "predHomeScore" INTEGER NOT NULL,
  "predAwayScore" INTEGER NOT NULL,
  "pointsAwarded" INTEGER,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE ("userId", "matchId")
);
CREATE INDEX IF NOT EXISTS "Prediction_matchId_idx" ON "Prediction" ("matchId");

CREATE TABLE IF NOT EXISTS "ChampionPick" (
  id TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL REFERENCES "User"(id),
  "teamId" TEXT NOT NULL REFERENCES "Team"(id),
  "lockedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "bonusAwarded" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "Achievement" (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  "pointThreshold" INTEGER
);

CREATE TABLE IF NOT EXISTS "UserAchievement" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  "achievementId" TEXT NOT NULL REFERENCES "Achievement"(id),
  "unlockedAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE ("userId", "achievementId")
);

CREATE TABLE IF NOT EXISTS "Announcement" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  "titleAr" TEXT,
  body TEXT NOT NULL,
  "bodyAr" TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Comment" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  "matchId" TEXT,
  body TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Comment_matchId_idx" ON "Comment" ("matchId");
CREATE INDEX IF NOT EXISTS "Comment_createdAt_idx" ON "Comment" ("createdAt");

-- ---------- Seed data ----------

INSERT INTO "Department" (id, name, "nameAr", "shortCode", "colorHex") VALUES
  ('dept_pp',  'Product & Pricing', 'المنتجات والتسعير',         'P&P', '#D9A441'),
  ('dept_ord', 'Ordering',          'الطلبات',                   'ORD', '#8B7FD9'),
  ('dept_hr',  'HR',                'الموارد البشرية',           'HR',  '#2C9587'),
  ('dept_sls', 'Sales',             'المبيعات',                  'SLS', '#6FA8B8'),
  ('dept_mkt', 'Marketing',         'التسويق',                   'MKT', '#E0599E'),
  ('dept_fin', 'Finance',           'المالية',                   'FIN', '#E2543A'),
  ('dept_crm', 'CRM',               'علاقات العملاء',            'CRM', '#4F8FC0'),
  ('dept_afs', 'Aftersales',        'خدمات ما بعد البيع',        'AFS', '#7BAE5C'),
  ('dept_apo', 'APO',               'تخطيط العمليات والمبيعات',   'APO', '#B98A3D')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "Achievement" (id, code, name, description, icon) VALUES
  ('ach_astoori',       'astoori',       'Legend',               'Predicted an entire group correctly', 'astoori'),
  ('ach_muhannak',      'muhannak',      'Sharp Shooter',        '5 correct in a row',                  'muhannak'),
  ('ach_batal_tawaqqu', 'batal_tawaqqu', 'Prediction Champion',  'Hit the exact score',                 'batal_tawaqqu'),
  ('ach_wahsh_usboo',   'wahsh_usboo',   'Weekly Beast',         'All of a week''s predictions correct','wahsh_usboo'),
  ('ach_saed_mufajaat', 'saed_mufajaat', 'Upset Hunter',         'Correctly called an underdog win',    'saed_mufajaat'),
  ('ach_sinbaq',        'sinbaq',        'Early Bird',           'Predicted 24 hours ahead',            'sinbaq')
ON CONFLICT (code) DO NOTHING;

-- Demo users for first login
-- Admin: admin@jlr.com / Employee ID 1001 / password admin123
-- Employee: demo@jlr.com / Employee ID 1002 / password 1234
INSERT INTO "User" (id, name, email, "employeeCode", "passwordHash", role, "avatarLabel", "departmentId") VALUES
  ('user_admin', 'System Admin',  'admin@jlr.com', '1001', 'scrypt:77dd49015e83c888ea901ca944ec9b0d:8e2f74273ec4d27336afdc05f4abf48c7b1dea8cda683542f0fbe6178a6c7434433b49b21f6188ec6fca493e4f18a420578522770538f27e5caedf8d6ec77e7b', 'ADMIN',    'SA', 'dept_crm'),
  ('user_demo',  'Demo Employee', 'demo@jlr.com',  '1002', 'scrypt:8ca5c825864bea5fb9b2dc169bb3cf99:85e666f3a27ee7e0d90324347229395ced981ca0cf01e1fafd9d1360ce0e9125913691499ea67c415b043b47a764bfdd0e35ee5dbe36e5b52c61a1ffe22785b4', 'EMPLOYEE', 'DE', 'dept_sls')
ON CONFLICT ("employeeCode") DO NOTHING;

INSERT INTO "Announcement" (id, title, "titleAr", body, "bodyAr", pinned) VALUES
  ('ann_welcome',
   'Welcome to the JLR World Cup Predictions League!',
   'مرحبًا بكم في دوري توقعات JLR!',
   'Submit your predictions for every World Cup 2026 match and compete with your colleagues for the top spot. 6 points for an exact score, 3 points for the correct winner. Good luck!',
   'سجّل توقعاتك لكل مباريات كأس العالم 2026 وتسابق مع زملائك على القمة. 6 نقاط للنتيجة الدقيقة، 3 نقاط للفوز الصحيح. بالتوفيق!',
   true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Done. Sign in with demo@jlr.com / Employee ID 1002 / password 1234
-- World Cup fixtures load automatically once the site is live
-- (the cron job runs its first sync within 15 minutes of deployment)
-- ============================================================
