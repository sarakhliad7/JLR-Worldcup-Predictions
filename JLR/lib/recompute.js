// Shared logic for recalculating prediction points, user totals/streaks,
// achievement unlocks, and the champion-pick bonus. Used by both the
// automatic score-sync cron job and the admin's manual result entry.

import { prisma } from './prisma';
import { calculatePoints, CHAMPION_BONUS } from './scoring';

/**
 * Scores every prediction for a single match against its final result,
 * then recomputes champion bonuses, totals, streaks and achievements.
 */
export async function scoreMatchAndRecompute(matchId) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (
    !match ||
    match.homeScore == null ||
    match.awayScore == null
  ) {
    return { predictionsScored: 0 };
  }

  const predictions = await prisma.prediction.findMany({
    where: { matchId },
  });

  let predictionsScored = 0;

  for (const prediction of predictions) {
    const points = calculatePoints(
      prediction.predHomeScore,
      prediction.predAwayScore,
      match.homeScore,
      match.awayScore
    );

    await prisma.prediction.update({
      where: { id: prediction.id },
      data: { pointsAwarded: points },
    });

    predictionsScored += 1;
  }

  /*
   * Important order:
   * 1. Determine and save Champion Challenge bonuses.
   * 2. Recalculate totalPoints including the saved +20 bonus.
   */
  await checkChampionBonuses();
  await recomputeAllUserTotals();
  await evaluateAchievements();

  return { predictionsScored };
}

export async function recomputeAllUserTotals() {
  const users = await prisma.user.findMany({
    include: {
      championPick: true,
      predictions: {
        orderBy: {
          match: {
            kickoffAt: 'asc',
          },
        },
        include: {
          match: true,
        },
      },
    },
  });

  for (const user of users) {
    const scored = user.predictions.filter(
      (prediction) =>
        prediction.pointsAwarded != null
    );

    const predictionPoints = scored.reduce(
      (sum, prediction) =>
        sum + prediction.pointsAwarded,
      0
    );

    const championBonus =
      user.championPick?.bonusAwarded === true
        ? CHAMPION_BONUS
        : 0;

    const totalPoints =
      predictionPoints + championBonus;

    const chronological = scored
      .filter(
        (prediction) =>
          prediction.match.status === 'FINISHED'
      )
      .sort(
        (a, b) =>
          new Date(a.match.kickoffAt) -
          new Date(b.match.kickoffAt)
      );

    let currentStreak = 0;

    for (
      let index = chronological.length - 1;
      index >= 0;
      index -= 1
    ) {
      if (
        chronological[index].pointsAwarded > 0
      ) {
        currentStreak += 1;
      } else {
        break;
      }
    }

    let bestStreak = 0;
    let running = 0;

    for (const prediction of chronological) {
      if (prediction.pointsAwarded > 0) {
        running += 1;
        bestStreak = Math.max(
          bestStreak,
          running
        );
      } else {
        running = 0;
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalPoints,
        currentStreak,
        bestStreak: Math.max(
          bestStreak,
          user.bestStreak
        ),
      },
    });
  }
}

export async function checkChampionBonuses() {
  const finalMatch = await prisma.match.findFirst({
    where: {
      status: 'FINISHED',
      round: {
        in: ['Final', 'Finals', 'FINAL'],
      },
    },
    orderBy: {
      kickoffAt: 'desc',
    },
  });

  if (
    !finalMatch ||
    finalMatch.homeScore == null ||
    finalMatch.awayScore == null
  ) {
    return;
  }

  /*
   * The champion cannot be determined from a tied score.
   * For a penalty shootout, the saved admin score must show
   * which team won.
   */
  if (
    finalMatch.homeScore ===
    finalMatch.awayScore
  ) {
    return;
  }

  const championTeamId =
    finalMatch.homeScore >
    finalMatch.awayScore
      ? finalMatch.homeTeamId
      : finalMatch.awayTeamId;

  if (!championTeamId) {
    console.error(
      'Champion bonus could not be awarded: final match has no winning team ID.'
    );
    return;
  }

  /*
   * Reset all Champion Challenge flags first.
   * This keeps the result correct even if the final score
   * is corrected later by the admin.
   */
  await prisma.championPick.updateMany({
    data: {
      bonusAwarded: false,
    },
  });

  /*
   * Mark every employee who selected the winning team.
   * recomputeAllUserTotals() will then include +20 points.
   */
  await prisma.championPick.updateMany({
    where: {
      teamId: championTeamId,
    },
    data: {
      bonusAwarded: true,
    },
  });
}

export async function evaluateAchievements() {
  const achievements =
    await prisma.achievement.findMany();

  const byCode = Object.fromEntries(
    achievements.map((achievement) => [
      achievement.code,
      achievement,
    ])
  );

  const users = await prisma.user.findMany({
    include: {
      predictions: {
        include: {
          match: true,
        },
      },
      userAchievements: true,
    },
  });

  for (const user of users) {
    const unlocked = new Set(
      user.userAchievements.map(
        (userAchievement) =>
          userAchievement.achievementId
      )
    );

    const finished =
      user.predictions.filter(
        (prediction) =>
          prediction.match.status ===
            'FINISHED' &&
          prediction.pointsAwarded != null
      );

    const exactCount = finished.filter(
      (prediction) =>
        prediction.pointsAwarded === 4
    ).length;

    const correctCount = finished.filter(
      (prediction) =>
        prediction.pointsAwarded > 0
    ).length;

    const toUnlock = [];

    if (
      byCode.muhannak &&
      user.currentStreak >= 5 &&
      !unlocked.has(byCode.muhannak.id)
    ) {
      toUnlock.push(byCode.muhannak.id);
    }

    if (
      byCode.batal_tawaqqu &&
      exactCount >= 1 &&
      !unlocked.has(
        byCode.batal_tawaqqu.id
      )
    ) {
      toUnlock.push(
        byCode.batal_tawaqqu.id
      );
    }

    if (
      byCode.wahsh_usboo &&
      user.currentStreak >= 7 &&
      !unlocked.has(
        byCode.wahsh_usboo.id
      )
    ) {
      toUnlock.push(
        byCode.wahsh_usboo.id
      );
    }

    if (
      byCode.astoori &&
      correctCount >= 12 &&
      !unlocked.has(byCode.astoori.id)
    ) {
      toUnlock.push(byCode.astoori.id);
    }

    for (const achievementId of toUnlock) {
      await prisma.userAchievement.create({
        data: {
          userId: user.id,
          achievementId,
        },
      });
    }
  }
}