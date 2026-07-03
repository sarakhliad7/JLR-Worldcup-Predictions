import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

function normalizeStage(round) {
  if (!round) return null;

  if (round === 'Quarter-finals') return 'Quarter-final';
  if (round === 'Semi-finals') return 'Semi-final';
  if (round === 'Match for Third Place') return null;
  if (round === 'Match for third place') return null;

  return round;
}

function getUserStats(user) {
  const filteredPredictions = user.predictions.filter((p) =>
    normalizeStage(p.match?.round)
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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'err_mustLogin' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      department: true,
      predictions: { include: { match: true } },
      userAchievements: { include: { achievement: true } },
    },
  });

  const allUsers = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    include: {
      predictions: { include: { match: true } },
    },
  });

  const rankedUsers = allUsers
    .map((u) => {
      const stats = getUserStats(u);
      return {
        id: u.id,
        ...stats,
      };
    })
    .filter((u) => u.totalPoints > 0)
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.exactCount !== a.exactCount) return b.exactCount - a.exactCount;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      return a.earliestSubmission - b.earliestSubmission;
    });

  const myStats = getUserStats(user);
  const myRankIndex = rankedUsers.findIndex((u) => u.id === user.id);
  const rank = myRankIndex >= 0 ? myRankIndex + 1 : rankedUsers.length + 1;

  const allAchievements = await prisma.achievement.findMany();
  const unlockedIds = new Set(user.userAchievements.map((ua) => ua.achievementId));

  return NextResponse.json({
    user: {
      name: user.name,
      avatarLabel: user.avatarLabel || user.name.slice(0, 2),
      department: user.department?.name || null,
      departmentAr: user.department?.nameAr || user.department?.name || null,
      totalPoints: myStats.totalPoints,
      currentStreak: user.currentStreak,
      bestStreak: user.bestStreak,
      rank,
    },
    achievements: allAchievements.map((a) => ({
      code: a.code,
      icon: a.icon,
      unlocked: unlockedIds.has(a.id),
    })),
  });
}
