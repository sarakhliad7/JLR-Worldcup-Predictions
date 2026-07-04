import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ROUND_CONFIG = [
  {
    key: 'r32',
    roundKey: 'Round of 32',
    winnersCount: 2,
    startAt: '2026-06-28T00:00:00+03:00',
    endAt: '2026-07-04T12:00:00+03:00',
    labels: { en: 'Round of 32', ar: 'دور 32' },
    closeLabel: { en: '28 June - 4 July', ar: '28 يونيو - 4 يوليو' },
  },
  {
    key: 'r16',
    roundKey: 'Round of 16',
    winnersCount: 2,
    startAt: '2026-07-04T20:00:00+03:00',
    endAt: '2026-07-07T23:59:59+03:00',
    labels: { en: 'Round of 16', ar: 'دور 16' },
    closeLabel: { en: '4 July - 7 July', ar: '4 يوليو - 7 يوليو' },
  },
  {
    key: 'qf',
    roundKey: 'Quarter-final',
    winnersCount: 1,
    startAt: '2026-07-09T00:00:00+03:00',
    endAt: '2026-07-12T23:59:59+03:00',
    labels: { en: 'Quarter-final', ar: 'ربع النهائي' },
    closeLabel: { en: '9 July - 12 July', ar: '9 يوليو - 12 يوليو' },
  },
  {
    key: 'sf',
    roundKey: 'Semi-final',
    winnersCount: 1,
    startAt: '2026-07-14T00:00:00+03:00',
    endAt: '2026-07-15T23:59:59+03:00',
    labels: { en: 'Semi-final', ar: 'نصف النهائي' },
    closeLabel: { en: '14 July - 15 July', ar: '14 يوليو - 15 يوليو' },
  },
  {
    key: 'final',
    roundKey: 'Final',
    winnersCount: 1,
    startAt: '2026-07-19T00:00:00+03:00',
    endAt: '2026-07-19T23:59:59+03:00',
    labels: { en: 'Final', ar: 'النهائي' },
    closeLabel: { en: '19 July', ar: '19 يوليو' },
  },
];

function normalizeRound(round) {
  if (!round) return null;

  if (round === 'Quarter-finals') return 'Quarter-final';
  if (round === 'Semi-finals') return 'Semi-final';

  return round;
}

function getRoundStatus(config) {
  const now = new Date();
  const startAt = new Date(config.startAt);
  const endAt = new Date(config.endAt);

  if (now < startAt) return 'upcoming';
  if (now > endAt) return 'ended';
  return 'in_progress';
}

function getUserStatsForRound(user, roundKey) {
  const filteredPredictions = user.predictions.filter(
    (prediction) => normalizeRound(prediction.match?.round) === roundKey
  );

  const totalPoints = filteredPredictions.reduce(
    (sum, prediction) => sum + (prediction.pointsAwarded || 0),
    0
  );

  const exactCount = filteredPredictions.filter(
    (prediction) => prediction.pointsAwarded === 4
  ).length;

  const correctCount = filteredPredictions.filter(
    (prediction) => prediction.pointsAwarded != null && prediction.pointsAwarded > 0
  ).length;

  const correctTimes = filteredPredictions
    .filter((prediction) => prediction.pointsAwarded != null && prediction.pointsAwarded > 0)
    .map((prediction) => new Date(prediction.createdAt).getTime());

  const earliestSubmission = correctTimes.length ? Math.min(...correctTimes) : Infinity;

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
        id: `${config.key}-${index + 1}`,
        roundKey: config.roundKey,
        userId: winner.userId,
        points: winner.totalPoints,
      })),
    }),
  ]);
}

export async function GET() {
  const statusesByRound = new Map();

  for (const config of ROUND_CONFIG) {
    const status = getRoundStatus(config);
    statusesByRound.set(config.roundKey, status);
    await ensureRoundWinners(config, status);
  }

  const winners = await prisma.rewardWinner.findMany({
    include: {
      user: {
        select: {
          name: true,
          employeeCode: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const rounds = ROUND_CONFIG.map((config) => {
    const status = statusesByRound.get(config.roundKey) || getRoundStatus(config);

    const roundWinners = winners
      .filter((winner) => normalizeRound(winner.roundKey) === config.roundKey)
      .slice(0, config.winnersCount)
      .map((winner) => ({
        name: winner.user?.name || 'Unknown',
        employeeCode: winner.user?.employeeCode || '-',
        points: winner.points || 0,
      }));

    return {
      key: config.key,
      roundKey: config.roundKey,
      winnersCount: config.winnersCount,
      labels: config.labels,
      closeLabel: config.closeLabel,
      startAt: config.startAt,
      endAt: config.endAt,
      status,
      winners: roundWinners,
    };
  });

  return NextResponse.json(
    { rounds },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
