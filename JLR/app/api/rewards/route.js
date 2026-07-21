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
    closeLabel: {
      en: '28 June - 4 July',
      ar: '28 يونيو - 4 يوليو',
    },
  },
  {
    key: 'r16',
    roundKey: 'Round of 16',
    winnersCount: 2,
    startAt: '2026-07-04T20:00:00+03:00',
    endAt: '2026-07-07T23:59:59+03:00',
    labels: { en: 'Round of 16', ar: 'دور 16' },
    closeLabel: {
      en: '5 July - 7 July',
      ar: '5 يوليو - 7 يوليو',
    },
  },
  {
    key: 'qf',
    roundKey: 'Quarter-final',
    winnersCount: 1,
    startAt: '2026-07-09T00:00:00+03:00',
    endAt: '2026-07-12T23:59:59+03:00',
    labels: {
      en: 'Quarter-final',
      ar: 'ربع النهائي',
    },
    closeLabel: {
      en: '9 July - 12 July',
      ar: '9 يوليو - 12 يوليو',
    },
  },
  {
    key: 'sf',
    roundKey: 'Semi-final',
    winnersCount: 1,
    startAt: '2026-07-14T00:00:00+03:00',
    endAt: '2026-07-15T23:59:59+03:00',
    labels: {
      en: 'Semi-final',
      ar: 'نصف النهائي',
    },
    closeLabel: {
      en: '14 July - 15 July',
      ar: '14 يوليو - 15 يوليو',
    },
  },
  {
    key: 'final',
    roundKey: 'Final',
    winnersCount: 1,
    startAt: '2026-07-19T00:00:00+03:00',
    endAt: '2026-07-19T23:59:59+03:00',
    labels: {
      en: 'Final',
      ar: 'النهائي',
    },
    closeLabel: {
      en: '19 July',
      ar: '19 يوليو',
    },
  },
];

function normalizeRound(round) {
  if (!round) return null;

  if (round === 'Quarter-finals') {
    return 'Quarter-final';
  }

  if (round === 'Semi-finals') {
    return 'Semi-final';
  }

  if (
    round === 'Match for Third Place' ||
    round === 'Match for third place'
  ) {
    return null;
  }

  return round;
}

function getRoundStatus(config, matches) {
  const now = new Date();
  const startAt = new Date(config.startAt);

  if (now < startAt) {
    return 'upcoming';
  }

  const roundMatches = matches.filter(
    (match) =>
      normalizeRound(match.round) === config.roundKey
  );

  if (roundMatches.length === 0) {
    return 'in_progress';
  }

  const allMatchesFinished = roundMatches.every(
    (match) =>
      match.status === 'FINISHED' &&
      match.homeScore !== null &&
      match.awayScore !== null
  );

  const allPredictionsScored = roundMatches.every(
    (match) =>
      match.predictions.length === 0 ||
      match.predictions.every(
        (prediction) =>
          prediction.pointsAwarded !== null
      )
  );

  if (allMatchesFinished && allPredictionsScored) {
    return 'ended';
  }

  return 'in_progress';
}

function getStats(predictions) {
  const predictionPoints = predictions.reduce(
    (sum, prediction) =>
      sum + (prediction.pointsAwarded || 0),
    0
  );

  const exactCount = predictions.filter(
    (prediction) =>
      prediction.pointsAwarded === 4
  ).length;

  const correctCount = predictions.filter(
    (prediction) =>
      prediction.pointsAwarded !== null &&
      prediction.pointsAwarded > 0
  ).length;

  const correctTimes = predictions
    .filter(
      (prediction) =>
        prediction.pointsAwarded !== null &&
        prediction.pointsAwarded > 0
    )
    .map((prediction) =>
      new Date(prediction.createdAt).getTime()
    );

  const earliestSubmission = correctTimes.length
    ? Math.min(...correctTimes)
    : Infinity;

  return {
    predictionPoints,
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
              normalizeRound(
                prediction.match?.round
              ) === roundKey
          )
        : user.predictions.filter((prediction) =>
            normalizeRound(
              prediction.match?.round
            )
          );

      const stats = getStats(filteredPredictions);

      const totalPoints = roundKey
        ? stats.predictionPoints
        : user.totalPoints;

      return {
        user,
        totalPoints,
        exactCount: stats.exactCount,
        correctCount: stats.correctCount,
        earliestSubmission:
          stats.earliestSubmission,
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

      return (
        a.earliestSubmission -
        b.earliestSubmission
      );
    });
}

async function ensureRoundWinners(
  config,
  status,
  users
) {
  if (status !== 'ended') return;

  const ranked = rankUsers(
    users,
    config.roundKey
  ).slice(0, config.winnersCount);

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
  const [users, matches] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
      },
      select: {
        id: true,
        name: true,
        employeeCode: true,
        totalPoints: true,
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
    }),

    prisma.match.findMany({
      select: {
        id: true,
        round: true,
        status: true,
        homeScore: true,
        awayScore: true,
        predictions: {
          select: {
            pointsAwarded: true,
          },
        },
      },
    }),
  ]);

  for (const config of ROUND_CONFIG) {
    const status = getRoundStatus(
      config,
      matches
    );

    await ensureRoundWinners(
      config,
      status,
      users
    );
  }

  const savedWinners =
    await prisma.rewardWinner.findMany({
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

  const rounds = ROUND_CONFIG.map(
    (config) => {
      const status = getRoundStatus(
        config,
        matches
      );

      const roundWinners = savedWinners
        .filter(
          (winner) =>
            normalizeRound(
              winner.roundKey
            ) === config.roundKey
        )
        .slice(0, config.winnersCount)
        .map((winner, index) => ({
          rank: index + 1,
          name:
            winner.user?.name ||
            'Unknown',
          employeeCode:
            winner.user?.employeeCode ||
            '-',
          points: winner.points || 0,
        }));

      return {
        key: config.key,
        roundKey: config.roundKey,
        winnersCount:
          config.winnersCount,
        labels: config.labels,
        closeLabel:
          config.closeLabel,
        startAt: config.startAt,
        endAt: config.endAt,
        status,
        winners:
          status === 'ended'
            ? roundWinners
            : [],
      };
    }
  );

  const finalConfig = ROUND_CONFIG.find(
    (config) => config.key === 'final'
  );

  const finalStatus = finalConfig
    ? getRoundStatus(
        finalConfig,
        matches
      )
    : 'in_progress';

  const grandWinners =
    finalStatus === 'ended'
      ? rankUsers(users)
          .slice(0, 5)
          .map((item, index) => ({
            rank: index + 1,
            name: item.user.name,
            employeeCode:
              item.user.employeeCode ||
              '-',
            points: item.totalPoints,
            exactCount:
              item.exactCount,
            correctCount:
              item.correctCount,
          }))
      : [];

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