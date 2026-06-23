// Shared logic for recalculating prediction points, user totals/streaks,
// achievement unlocks, and the champion-pick bonus. Used by both the
// automatic score-sync cron job and the admin's manual result entry,
// so the two paths can never drift out of sync with each other.

import { prisma } from './prisma';
import { calculatePoints, CHAMPION_BONUS } from './scoring';

/**
 * Scores every prediction for a single match against its final result,
 * then recomputes totals/streaks/achievements/champion bonus for the league.
 * Call this any time a match's homeScore/awayScore is set (or corrected).
 */
export async function scoreMatchAndRecompute(matchId) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.homeScore == null || match.awayScore == null) {
    return { predictionsScored: 0 };
  }

  const predictions = await prisma.prediction.findMany({ where: { matchId } });
  let predictionsScored = 0;

  for (const p of predictions) {
    const points = calculatePoints(p.predHomeScore, p.predAwayScore, match.homeScore, match.awayScore);
    await prisma.prediction.update({
      where: { id: p.id },
      data: { pointsAwarded: points },
    });
    predictionsScored += 1;
  }

  await recomputeAllUserTotals();
  await checkChampionBonuses();
  await evaluateAchievements();

  return { predictionsScored };
}

export async function recomputeAllUserTotals() {
  const users = await prisma.user.findMany({
    include: { predictions: { orderBy: { match: { kickoffAt: 'asc' } }, include: { match: true } } },
  });

  for (const u of users) {
    const scored = u.predictions.filter((p) => p.pointsAwarded != null);
    const totalPoints = scored.reduce((sum, p) => sum + p.pointsAwarded, 0);

    // streak = consecutive correct (>0 point) predictions, most recent first,
    // walking backwards through chronologically-ordered finished matches.
    const chronological = scored
      .filter((p) => p.match.status === 'FINISHED')
      .sort((a, b) => new Date(a.match.kickoffAt) - new Date(b.match.kickoffAt));

    let currentStreak = 0;
    for (let i = chronological.length - 1; i >= 0; i--) {
      if (chronological[i].pointsAwarded > 0) currentStreak += 1;
      else break;
    }

    let bestStreak = 0;
    let running = 0;
    for (const p of chronological) {
      if (p.pointsAwarded > 0) {
        running += 1;
        bestStreak = Math.max(bestStreak, running);
      } else {
        running = 0;
      }
    }

    await prisma.user.update({
      where: { id: u.id },
      data: {
        totalPoints,
        currentStreak,
        bestStreak: Math.max(bestStreak, u.bestStreak),
      },
    });
  }
}

export async function checkChampionBonuses() {
  const finalMatch = await prisma.match.findFirst({
    where: { round: 'Final', status: 'FINISHED' },
  });
  if (!finalMatch || finalMatch.homeScore == null) return;

  // Note: if the final is decided by penalties after a draw, the score may
  // show the 90/120-minute tie. If homeScore === awayScore here, the champion
  // can't be determined automatically -- set it manually via the admin panel
  // (edit the match's score to reflect the shootout winner) and re-run.
  if (finalMatch.homeScore === finalMatch.awayScore) return;

  const championTeamId =
    finalMatch.homeScore > finalMatch.awayScore ? finalMatch.homeTeamId : finalMatch.awayTeamId;
  if (!championTeamId) return;

  const winners = await prisma.championPick.findMany({
    where: { teamId: championTeamId, bonusAwarded: false },
  });

  for (const pick of winners) {
    await prisma.user.update({
      where: { id: pick.userId },
      data: { totalPoints: { increment: CHAMPION_BONUS } },
    });
    await prisma.championPick.update({
      where: { id: pick.id },
      data: { bonusAwarded: true },
    });
  }
}

export async function evaluateAchievements() {
  const achievements = await prisma.achievement.findMany();
  const byCode = Object.fromEntries(achievements.map((a) => [a.code, a]));

  const users = await prisma.user.findMany({
    include: {
      predictions: { include: { match: true } },
      userAchievements: true,
    },
  });

  for (const u of users) {
    const unlocked = new Set(u.userAchievements.map((ua) => ua.achievementId));
    const finished = u.predictions.filter((p) => p.match.status === 'FINISHED' && p.pointsAwarded != null);
    const exactCount = finished.filter((p) => p.pointsAwarded === 6).length;
    const correctCount = finished.filter((p) => p.pointsAwarded > 0).length;

    const toUnlock = [];

    // muhannak (Sharp Shooter): 5 correct predictions in a row
    if (byCode.muhannak && u.currentStreak >= 5 && !unlocked.has(byCode.muhannak.id)) {
      toUnlock.push(byCode.muhannak.id);
    }
    // batal_tawaqqu (Prediction Champion): hit an exact score
    if (byCode.batal_tawaqqu && exactCount >= 1 && !unlocked.has(byCode.batal_tawaqqu.id)) {
      toUnlock.push(byCode.batal_tawaqqu.id);
    }
    // wahsh_usboo (Weekly Beast): a full week of correct predictions (simplified: 7-streak)
    if (byCode.wahsh_usboo && u.currentStreak >= 7 && !unlocked.has(byCode.wahsh_usboo.id)) {
      toUnlock.push(byCode.wahsh_usboo.id);
    }
    // astoori (Legend): predicted an entire group correctly (simplified: 12+ correct overall)
    if (byCode.astoori && correctCount >= 12 && !unlocked.has(byCode.astoori.id)) {
      toUnlock.push(byCode.astoori.id);
    }

    for (const achievementId of toUnlock) {
      await prisma.userAchievement.create({
        data: { userId: u.id, achievementId },
      });
    }
  }
}
