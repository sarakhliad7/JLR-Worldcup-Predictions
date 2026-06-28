import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

const ACTIVE_STAGES = [
  {
    key: 'Round of 32',
    labelAr: 'دور ٣٢',
    start: '2026-06-28T00:00:00+03:00',
    end: '2026-07-04T23:59:59+03:00',
  },
  {
    key: 'Round of 16',
    labelAr: 'دور ١٦',
    start: '2026-07-05T00:00:00+03:00',
    end: '2026-07-07T23:59:59+03:00',
  },
  {
    key: 'Quarter-final',
    labelAr: 'ربع النهائي',
    start: '2026-07-09T00:00:00+03:00',
    end: '2026-07-12T23:59:59+03:00',
  },
  {
    key: 'Semi-final',
    labelAr: 'نصف النهائي',
    start: '2026-07-14T00:00:00+03:00',
    end: '2026-07-15T23:59:59+03:00',
  },
  {
    key: 'Final',
    labelAr: 'النهائي',
    start: '2026-07-19T00:00:00+03:00',
    end: '2026-07-19T23:59:59+03:00',
  },
];

function normalizeStage(round) {
  if (!round) return null;

  if (round === 'Quarter-finals') return 'Quarter-final';
  if (round === 'Semi-finals') return 'Semi-final';
  if (round === 'Match for Third Place') return null;
  if (round === 'Match for third place') return null;

  return round;
}

function getStageMeta(stageKey) {
  return ACTIVE_STAGES.find((stage) => stage.key === stageKey) || null;
}

async function getCurrentStage() {
  const now = new Date();

  const stageByDate = ACTIVE_STAGES.find((stage) => {
    const start = new Date(stage.start);
    const end = new Date(stage.end);
    return now >= start && now <= end;
  });

  if (stageByDate) {
    return stageByDate.key;
  }

  const nextStage = ACTIVE_STAGES.find((stage) => {
    const end = new Date(stage.end);
    return now <= end;
  });

  if (nextStage) {
    return nextStage.key;
  }

  return 'Final';
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const departmentId = searchParams.get('departmentId');
  const mode = searchParams.get('mode') || 'overall';

  const currentStage = await getCurrentStage();
  const currentStageMeta = getStageMeta(currentStage);

  const stage =
    mode === 'current'
      ? currentStage
      : searchParams.get('stage');

  const roundFilter = stage ? normalizeStage(stage) : null;

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
        : u.predictions.filter((p) => normalizeStage(p.match?.round));

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
    currentStageAr: currentStageMeta?.labelAr || currentStage,
    stage: stage || 'overall',
    stageAr: getStageMeta(stage)?.labelAr || 'العام',
  });
}