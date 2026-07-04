@'
const fs = require('fs');

const p = 'app/api/rewards/route.js';
let s = fs.readFileSync(p, 'utf8');

const helper = `
function getUserStatsForRound(user, roundKey) {
  const filteredPredictions = user.predictions.filter(
    (p) => normalizeRound(p.match?.round) === roundKey
  );

  const totalPoints = filteredPredictions.reduce(
    (sum, p) => sum + (p.pointsAwarded || 0),
    0
  );

  const exactCount = filteredPredictions.filter(
    (p) => p.pointsAwarded === 4
  ).length;

  const correctCount = filteredPredictions.filter(
    (p) => p.pointsAwarded != null && p.pointsAwarded > 0
  ).length;

  const correctTimes = filteredPredictions
    .filter((p) => p.pointsAwarded != null && p.pointsAwarded > 0)
    .map((p) => new Date(p.createdAt).getTime());

  const earliestSubmission = correctTimes.length
    ? Math.min(...correctTimes)
    : Infinity;

  return {
    totalPoints,
    exactCount,
    correctCount,
    earliestSubmission,
  };
}

async function ensureRoundWinners(config, status) {
  if (status !== 'ended') return;

  const existingCount = await prisma.rewardWinner.count({
    where: { roundKey: config.roundKey },
  });

  if (existingCount >= config.winnersCount) return;

  const users = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    include: {
      predictions: {
        select: {
          pointsAwarded: true,
          createdAt: true,
          match: {
            select: {
              round: true,
            },
          },
        },
      },
    },
  });

  const topWinners = users
    .map((user) => {
      const stats = getUserStatsForRound(user, config.roundKey);
      return {
        userId: user.id,
        ...stats,
      };
    })
    .filter((user) => user.totalPoints > 0)
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.exactCount !== a.exactCount) return b.exactCount - a.exactCount;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      return a.earliestSubmission - b.earliestSubmission;
    })
    .slice(0, config.winnersCount);

  if (!topWinners.length) return;

  await prisma.$transaction([
    prisma.rewardWinner.deleteMany({
      where: { roundKey: config.roundKey },
    }),
    prisma.rewardWinner.createMany({
      data: topWinners.map((winner, index) => ({
        id: \`\${config.key}-\${index + 1}\`,
        roundKey: config.roundKey,
        userId: winner.userId,
        points: winner.totalPoints,
      })),
    }),
  ]);
}
`;

if (!s.includes('async function ensureRoundWinners')) {
  s = s.replace('export async function GET() {', helper + '\nexport async function GET() {');
}

const oldGet = `export async function GET() {
  const winners = await prisma.rewardWinner.findMany({`;

const newGet = `export async function GET() {
  const statusesByRound = new Map();

  for (const config of ROUND_CONFIG) {
    const status = getRoundStatus(config);
    statusesByRound.set(config.roundKey, status);
    await ensureRoundWinners(config, status);
  }

  const winners = await prisma.rewardWinner.findMany({`;

s = s.replace(oldGet, newGet);

s = s.replace(
  `const status = getRoundStatus(config);`,
  `const status = statusesByRound.get(config.roundKey) || getRoundStatus(config);`
);

fs.writeFileSync(p, s, 'utf8');
'@ | Set-Content .\auto-reward-winners.js -Encoding UTF8

node .\auto-reward-winners.js
