import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'err_mustLogin' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      department: true,
      userAchievements: { include: { achievement: true } },
    },
  });

  const allAchievements = await prisma.achievement.findMany();
  const unlockedIds = new Set(user.userAchievements.map((ua) => ua.achievementId));

  // overall rank
  const higherRanked = await prisma.user.count({
    where: { totalPoints: { gt: user.totalPoints } },
  });

  return NextResponse.json({
    user: {
      name: user.name,
      avatarLabel: user.avatarLabel || user.name.slice(0, 2),
      department: user.department?.name || null,
      departmentAr: user.department?.nameAr || user.department?.name || null,
      totalPoints: user.totalPoints,
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
