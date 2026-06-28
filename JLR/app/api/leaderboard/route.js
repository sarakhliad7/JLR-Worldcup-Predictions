import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

const ACTIVE_STAGES = [
  'Round of 32',
  'Round of 16',
  'Quarter-final',
  'Semi-final',
  'Match for third place',
  'Final',
];

function normalizeStage(round) {
  if (!round) return null;

  if (round === 'Quarter-finals') return 'Quarter-final';
  if (round === 'Semi-finals') return 'Semi-final';
  if (round === 'Match for Third Place') return 'Match for third place';

  return round;
}

function getRoundFilter(stage) {
  return normalizeStage(stage);
}

async function getCurrentStage() {
  for (const stage of ACTIVE_STAGES) {
    const match = await prisma.match.findFirst({
      where: {
        round: stage,
        status: {
          not: 'FINISHED',
        },
      },
      orderBy: {
        kickoffAt: 'asc',
      },
      select: {
        round: true,
      },
    });

    if (match) {
      return stage;
    }
  }

  return 'Final';
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const departmentId = searchParams.get('departmentId');
  const mode = searchParams.get('mode') || 'overall';

  const currentStage = await getCurrentStage();

  const stage =
    mode === 'current'
      ? currentStage
      : searchParams.get('stage');

  const roundFilter = stage ? getRoundFilter(stage) : null;

  const users = await prisma.user.findMany({
    where: {
      role: 'EMPLOYEE',
      ...(departmentId ? { departmentId } : {}),
    },
    include: {
      department: true,
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
      userAchievements: {
        include: {
          achievement: true,
        },
      },
    },
    take: 500,
  });

  const shaped = users
    .map((u) => {
      const filteredPredictions = roundFilter
        ? u.predictions.filter(
            (p) => normalizeStage(p.match?.round) === roundFilter
          )
        : u.predictions;

      const calculatedPoints = roundFilter
        ? filteredPredictions.reduce(
            (sum, p) => sum + (p.pointsAwarded || 0),
            0
          )
        : u.totalPoints;

      const exactCount = filteredPredictions.filter(
        (p) => p.pointsAwarded === 4
      ).length;

      const correctCount = filteredPredictions.filter(
        (p) => p.pointsAwarded != null && p.pointsAwarded > 0
      ).length;

      const earliestCorrectSubmission = filteredPredictions
        .filter((p) => p.pointsAwarded != null && p.pointsAwarded > 0)
        .map((p) => new Date(p.createdAt).getTime());

      const earliestSubmission = earliestCorrectSubmission.length
        ? Math.min(...earliestCorrectSubmission)
        : Infinity;

      return {
        id: u.id,
        name: u.name,
        avatarLabel: u.avatarLabel || u.name.slice(0, 2),
        department: u.department
          ? {
              name: u.department.name,
              nameAr: u.department.nameAr || u.department.name,
              colorHex: u.department.colorHex,
            }
          : null,
        totalPoints: calculatedPoints,
        exactCount,
        correctCount,
        currentStreak: u.currentStreak,
        badges: u.userAchievements.map((ua) => ua.achievement.icon),
        _earliestSubmission: earliestSubmission,
      };
    })
    .filter((u) => u.totalPoints > 0)
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.exactCount !== a.exactCount) return b.exactCount - a.exactCount;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      return a._earliestSubmission - b._earliestSubmission;
    })
    .map(({ _earliestSubmission, ...rest }, idx) => ({
      rank: idx + 1,
      ...rest,
    }));

  return NextResponse.json({
    leaderboard: shaped,
    participantCount: shaped.length,
    mode,
    currentStage,
    stage: stage || 'overall',
  });
}