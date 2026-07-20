import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ACTIVE_STAGES = [
  {
    key: 'Round of 32',
    labelAr: 'دور ٣٢',
    start: '2026-06-28T00:00:00+03:00',
    end: '2026-07-04T12:00:00+03:00',
  },
  {
    key: 'Round of 16',
    labelAr: 'دور ١٦',
    start: '2026-07-04T20:00:00+03:00',
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

  if (
    round === 'Match for Third Place' ||
    round === 'Match for third place'
  ) {
    return null;
  }

  return round;
}

function getStageMeta(stageKey) {
  return (
    ACTIVE_STAGES.find(
      (stage) => stage.key === stageKey
    ) || null
  );
}

async function getCurrentStage() {
  const now = new Date();

  const stageByDate = ACTIVE_STAGES.find(
    (stage) => {
      const start = new Date(stage.start);
      const end = new Date(stage.end);

      return now >= start && now <= end;
    }
  );

  if (stageByDate) {
    return stageByDate.key;
  }

  const nextStage = ACTIVE_STAGES.find(
    (stage) => {
      const end = new Date(stage.end);
      return now <= end;
    }
  );

  if (nextStage) {
    return nextStage.key;
  }

  return 'Final';
}

function getUserPoints(user, roundFilter) {
  const filteredPredictions = roundFilter
    ? user.predictions.filter(
        (prediction) =>
          normalizeStage(
            prediction.match?.round
          ) === roundFilter
      )
    : user.predictions.filter(
        (prediction) =>
          normalizeStage(
            prediction.match?.round
          )
      );

  /*
   * Stage leaderboard:
   * Show only points earned during that stage.
   *
   * Overall leaderboard:
   * Use User.totalPoints because it includes
   * prediction points plus the +20 Champion bonus.
   */
  const totalPoints = roundFilter
    ? filteredPredictions.reduce(
        (sum, prediction) =>
          sum +
          (prediction.pointsAwarded || 0),
        0
      )
    : user.totalPoints;

  return {
    filteredPredictions,
    totalPoints,
  };
}

function buildUserLeaderboard(
  users,
  roundFilter
) {
  return users
    .map((user) => {
      const {
        filteredPredictions,
        totalPoints,
      } = getUserPoints(
        user,
        roundFilter
      );

      const exactCount =
        filteredPredictions.filter(
          (prediction) =>
            prediction.pointsAwarded === 4
        ).length;

      const correctCount =
        filteredPredictions.filter(
          (prediction) =>
            prediction.pointsAwarded != null &&
            prediction.pointsAwarded > 0
        ).length;

      const correctSubmissionTimes =
        filteredPredictions
          .filter(
            (prediction) =>
              prediction.pointsAwarded != null &&
              prediction.pointsAwarded > 0
          )
          .map((prediction) =>
            new Date(
              prediction.createdAt
            ).getTime()
          );

      const earliestSubmission =
        correctSubmissionTimes.length
          ? Math.min(
              ...correctSubmissionTimes
            )
          : Infinity;

      return {
        id: user.id,
        name: user.name,
        avatarLabel:
          user.avatarLabel ||
          user.name.slice(0, 2),

        department: user.department
          ? {
              id: user.department.id,
              name: user.department.name,
              nameAr:
                user.department.nameAr ||
                user.department.name,
              colorHex:
                user.department.colorHex,
            }
          : null,

        totalPoints,
        exactCount,
        correctCount,
        currentStreak:
          user.currentStreak,

        badges:
          user.userAchievements.map(
            (userAchievement) =>
              userAchievement.achievement.icon
          ),

        _earliestSubmission:
          earliestSubmission,
      };
    })
    .filter(
      (user) => user.totalPoints > 0
    )
    .sort((a, b) => {
      if (
        b.totalPoints !== a.totalPoints
      ) {
        return (
          b.totalPoints - a.totalPoints
        );
      }

      if (
        b.exactCount !== a.exactCount
      ) {
        return b.exactCount - a.exactCount;
      }

      if (
        b.correctCount !== a.correctCount
      ) {
        return (
          b.correctCount -
          a.correctCount
        );
      }

      return (
        a._earliestSubmission -
        b._earliestSubmission
      );
    })
    .map(
      (
        {
          _earliestSubmission,
          ...user
        },
        index
      ) => ({
        rank: index + 1,
        ...user,
      })
    );
}

function buildDepartmentLeaderboard(
  users
) {
  const departments = new Map();

  for (const user of users) {
    if (!user.department) {
      continue;
    }

    /*
     * Use User.totalPoints here too,
     * so department totals include
     * Champion Challenge bonuses.
     */
    const totalPoints = user.totalPoints;

    if (totalPoints <= 0) {
      continue;
    }

    const departmentId =
      user.department.id;

    if (
      !departments.has(departmentId)
    ) {
      departments.set(departmentId, {
        id: departmentId,
        name: user.department.name,
        nameAr:
          user.department.nameAr ||
          user.department.name,
        colorHex:
          user.department.colorHex,
        totalPoints: 0,
        participantCount: 0,
      });
    }

    const department =
      departments.get(departmentId);

    department.totalPoints +=
      totalPoints;

    department.participantCount += 1;
  }

  return Array.from(
    departments.values()
  )
    .filter(
      (department) =>
        department.totalPoints > 0
    )
    .sort(
      (a, b) =>
        b.totalPoints - a.totalPoints
    )
    .map((department, index) => ({
      rank: index + 1,
      id: department.id,
      name: department.name,
      nameAr: department.nameAr,
      avatarLabel:
        department.name
          .slice(0, 2)
          .toUpperCase(),
      department: null,
      totalPoints:
        department.totalPoints,
      participantCount:
        department.participantCount,
      colorHex:
        department.colorHex,
      isDepartment: true,
    }));
}

export async function GET(req) {
  const { searchParams } = new URL(
    req.url
  );

  const mode =
    searchParams.get('mode') ||
    'overall';

  const currentStage =
    await getCurrentStage();

  const currentStageMeta =
    getStageMeta(currentStage);

  const stage =
    mode === 'current'
      ? currentStage
      : searchParams.get('stage');

  const roundFilter = stage
    ? normalizeStage(stage)
    : null;

  const users =
    await prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
      },

      select: {
        id: true,
        name: true,
        avatarLabel: true,
        totalPoints: true,
        currentStreak: true,

        department: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            colorHex: true,
          },
        },

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
          select: {
            achievement: {
              select: {
                icon: true,
              },
            },
          },
        },
      },
    });

  const leaderboard =
    mode === 'department'
      ? buildDepartmentLeaderboard(
          users
        )
      : buildUserLeaderboard(
          users,
          roundFilter
        );

  return NextResponse.json(
    {
      leaderboard,
      participantCount:
        leaderboard.length,
      mode,
      currentStage,
      currentStageAr:
        currentStageMeta?.labelAr ||
        currentStage,
      stage: stage || 'overall',
      stageAr:
        getStageMeta(stage)?.labelAr ||
        'العام',
    },
    {
      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate',
      },
    }
  );
}