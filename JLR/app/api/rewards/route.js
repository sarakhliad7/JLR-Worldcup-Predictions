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
    closeLabel: { en: '5 July - 7 July', ar: '5 يوليو - 7 يوليو' },
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

  if (
    round === 'Match for Third Place' ||
    round === 'Match for third place'
  ) {
    return null;
  }

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

function getStats(predictions) {
  const totalPoints = predictions.reduce(
    (sum, prediction) => sum + (prediction.pointsAwarded || 0),
    0
  );

  const exactCount = predictions.filter(
    (prediction) => prediction.pointsAwarded === 4
  ).length;

  const correctCount = predictions.filter(
    (prediction) =>
      prediction.pointsAwarded != null &&
      prediction.pointsAwarded > 0
  ).length;

  const correctTimes = predictions
    .filter(
      (prediction) =>
        prediction.pointsAwarded != null &&
        prediction.pointsAwarded > 0
    )
    .map((prediction) =>
      new Date(prediction.createdAt).getTime()
    );

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

function rankUsers(users, roundKey = null) {
  return users
    .map((user) => {
      const filteredPredictions = roundKey
        ? user.predictions.filter(
            (prediction) =>
              normalizeRound(prediction.match?.round) === roundKey
          )
        : user.predictions.filter((prediction) =>
            normalizeRound(prediction.match?.round)
          );

      return {
        user,
        ...getStats(filteredPredictions),
      };
    })
    .filter((item) => item.totalPoints > 0)
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }

      if (b.exactCount !== a.exactCount) {
        return b.exactCount - a.exactCount;
      }

      if (b.correctCount !== a.correctCount) {
        return b.correctCount - a.correctCount;
      }

      return a.earliestSubmission - b.earliestSubmission;
    });
}

async function ensureRoundWinners(config, status, users) {
  if (status !== 'ended') return;

  const ranked = rankUsers(users, config.roundKey).slice(
    0,
    config.winnersCount
  );

  if (!ranked.length) return;

  await prisma.$transaction([
    prisma.rewardWinner.deleteMany({
      where: {
        roundKey: config.roundKey,
      },
    }),

    prisma.rewardWinner.createMany({
      data: ranked.map((item) => ({
        roundKey: config.roundKey,
        userId: item.user.id,
        points: item.totalPoints,
      })),
    }),
  ]);
}

export async function GET() {
  const users = await prisma.user.findMany({
    where: {
      role: 'EMPLOYEE',
    },
    select: {
      id: true,
      name: true,
      employeeCode: true,
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

  for (const config of ROUND_CONFIG) {
    const status = getRoundStatus(config);

    await ensureRoundWinners(config, status, users);
  }

  const savedWinners = await prisma.rewardWinner.findMany({
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
    const status = getRoundStatus(config);

    const roundWinners = savedWinners
      .filter(
        (winner) =>
          normalizeRound(winner.roundKey) === config.roundKey
      )
      .slice(0, config.winnersCount)
      .map((winner, index) => ({
        rank: index + 1,
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

  const prankMode = true;

  const prankWinners = [
    {
      rank: 1,
      name: 'Rhett Noel Maxwell',
      employeeCode: '20006',
      points: 60,
      exactCount: 0,
      correctCount: 0,
    },
    {
      rank: 2,
      name: 'Ahmed Ali Alghamdi',
      employeeCode: '21592',
      points: 60,
      exactCount: 0,
      correctCount: 0,
    },
    {
      rank: 3,
      name: 'Rani Essam Mohammed Sindi',
      employeeCode: '19068',
      points: 58,
      exactCount: 0,
      correctCount: 0,
    },
    {
      rank: 4,
      name: 'Jimmy Sassine',
      employeeCode: '23577',
      points: 58,
      exactCount: 0,
      correctCount: 0,
    },
    {
      rank: 5,
      name: 'Eyad Yousef Alazhari',
      employeeCode: '20818',
      points: 58,
      exactCount: 0,
      correctCount: 0,
    },
  ];

  const grandPrizeEndDate = new Date('2026-07-20T00:00:00+03:00');

  const realGrandWinners =
    new Date() >= grandPrizeEndDate
      ? rankUsers(users)
          .slice(0, 5)
          .map((item, index) => ({
            rank: index + 1,
            name: item.user.name,
            employeeCode: item.user.employeeCode || '-',
            points: item.totalPoints,
            exactCount: item.exactCount,
            correctCount: item.correctCount,
          }))
      : [];

  const grandWinners = prankMode
    ? prankWinners
    : realGrandWinners;

  return NextResponse.json(
    {
      rounds,
      grandPrize: {
        winnersCount: 5,
        winners: grandWinners,
      },
    },
    {
      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate',
      },
    }
  );
}