import { prisma } from './prisma';

function getStageFromRound(round) {
  if (!round) return null;
  if (round.startsWith('Matchday')) return 'Group Stage';
  return round;
}

function getRoundWhereForStage(stage) {
  if (stage === 'Group Stage') {
    return {
      startsWith: 'Matchday',
    };
  }

  return stage;
}

export async function generateRewardWinnerForStage(stage) {
  if (!stage) return null;

  const existingWinner = await prisma.rewardWinner.findFirst({
    where: {
      roundKey: stage,
    },
  });

  if (existingWinner) {
    return existingWinner;
  }

  const roundFilter = getRoundWhereForStage(stage);

  const matches = await prisma.match.findMany({
    where: {
      round: roundFilter,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!matches.length) {
    return null;
  }

  const allFinished = matches.every((match) => match.status === 'FINISHED');

  if (!allFinished) {
    return null;
  }

  const users = await prisma.user.findMany({
    where: {
      role: 'EMPLOYEE',
    },
    select: {
      id: true,
      name: true,
      employeeCode: true,
      predictions: {
        where: {
          match: {
            round: roundFilter,
          },
          pointsAwarded: {
            gt: 0,
          },
        },
        select: {
          pointsAwarded: true,
          createdAt: true,
        },
      },
    },
  });

  const ranked = users
    .map((user) => {
      const points = user.predictions.reduce(
        (sum, prediction) => sum + (prediction.pointsAwarded || 0),
        0
      );

      const exactCount = user.predictions.filter(
        (prediction) => prediction.pointsAwarded === 4
      ).length;

      const earliestSubmissionTimes = user.predictions.map((prediction) =>
        new Date(prediction.createdAt).getTime()
      );

      const earliestSubmission = earliestSubmissionTimes.length
        ? Math.min(...earliestSubmissionTimes)
        : Infinity;

      return {
        id: user.id,
        points,
        exactCount,
        earliestSubmission,
      };
    })
    .filter((user) => user.points > 0)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.exactCount !== a.exactCount) return b.exactCount - a.exactCount;
      return a.earliestSubmission - b.earliestSubmission;
    });

  if (!ranked.length) {
    return null;
  }

  const topUser = ranked[0];

  const winner = await prisma.rewardWinner.create({
    data: {
      roundKey: stage,
      userId: topUser.id,
      points: topUser.points,
    },
  });

  return winner;
}

export function getStageKeyFromRound(round) {
  return getStageFromRound(round);
}