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

function calculatePoints(user) {
  return user.predictions
    .filter((p) => normalizeStage(p.match?.round))
    .reduce((sum, p) => sum + (p.pointsAwarded || 0), 0);
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
    include: {
      predictions: { include: { match: true } },
    },
  });

  const totalPoints = calculatePoints(user);

  const higherRanked = allUsers.filter((u) => {
    return calculatePoints(u) > totalPoints;
  }).length;

  const allAchievements = await prisma.achievement.findMany();
  const unlockedIds = new Set(user.userAchievements.map((ua) => ua.achievementId));

  return NextResponse.json({
    user: {
      name: user.name,
      avatarLabel: user.avatarLabel || user.name.slice(0, 2),
      department: user.department?.name || null,
      departmentAr: user.department?.nameAr || user.department?.name || null,
      totalPoints,
      currentStreak: user.currentStreak,
      bestStreak: user.bestStreak,
      rank: higherRanked + 1,
    },
    achievements: allAchievements.map((a) => ({
      code: a.code,
      icon: a.icon,
      unlocked: unlockedIds.has(a.id),
    })),
  });
}
