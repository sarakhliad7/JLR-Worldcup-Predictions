import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId');

  const baseWhere = {
    role: 'EMPLOYEE',
    ...(departmentId ? { departmentId } : {}),
  };

  const users = await prisma.user.findMany({
    where: {
      ...baseWhere,
      totalPoints: { gt: 0 },
    },
    include: {
      department: true,
      predictions: {
        select: {
          pointsAwarded: true,
          createdAt: true,
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
      const exactCount = u.predictions.filter((p) => p.pointsAwarded === 4).length;
      const correctCount = u.predictions.filter(
        (p) => p.pointsAwarded != null && p.pointsAwarded > 0
      ).length;

      const earliestCorrectSubmission = u.predictions
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
        totalPoints: u.totalPoints,
        exactCount,
        correctCount,
        currentStreak: u.currentStreak,
        badges: u.userAchievements.map((ua) => ua.achievement.icon),
        _earliestSubmission: earliestSubmission,
      };
    })
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
  });
}
