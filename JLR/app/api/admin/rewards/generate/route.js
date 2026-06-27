import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export const dynamic = 'force-dynamic';

function getMatchRoundFilter(roundKey) {
  if (roundKey === 'Group Stage') {
    return {
      startsWith: 'Matchday',
    };
  }

  return roundKey;
}

export async function POST(request) {
  const body = await request.json();
  const roundKey = String(body.roundKey || '').trim();

  if (!roundKey) {
    return NextResponse.json(
      { error: 'Round is required.' },
      { status: 400 }
    );
  }

  const existingWinner = await prisma.rewardWinner.findFirst({
    where: { roundKey },
    include: {
      user: {
        select: {
          name: true,
          employeeCode: true,
        },
      },
    },
  });

  if (existingWinner) {
    return NextResponse.json({
      winner: existingWinner,
      alreadyExists: true,
    });
  }

  const roundFilter = getMatchRoundFilter(roundKey);

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
        name: user.name,
        employeeCode: user.employeeCode,
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

  if (ranked.length === 0) {
    return NextResponse.json(
      { error: 'No predictions with points found for this round.' },
      { status: 404 }
    );
  }

  const topUser = ranked[0];

  const winner = await prisma.rewardWinner.create({
    data: {
      roundKey,
      userId: topUser.id,
      points: topUser.points,
    },
    include: {
      user: {
        select: {
          name: true,
          employeeCode: true,
        },
      },
    },
  });

  return NextResponse.json({
    winner,
    alreadyExists: false,
  });
}