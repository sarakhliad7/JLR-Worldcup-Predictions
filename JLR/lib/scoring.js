// Scoring rules for JLR's World Cup prediction league:
//   4 points = exact score (both teams' goal counts match)
//   2 points = correct outcome (winner or draw) but the exact score was wrong
//   0 points = completely wrong prediction

export const POINTS_EXACT = 4;
export const POINTS_OUTCOME = 2;
export const POINTS_WRONG = 0;
export const CHAMPION_BONUS = 20;

export function outcomeOf(home, away) {
  if (home === away) return 'DRAW';
  return home > away ? 'HOME' : 'AWAY';
}

/**
 * Calculate points for a single prediction against a finished match result.
 */
export function calculatePoints(predHome, predAway, actualHome, actualAway) {
  if (actualHome == null || actualAway == null) return null;

  if (predHome === actualHome && predAway === actualAway) {
    return POINTS_EXACT;
  }

  if (outcomeOf(predHome, predAway) === outcomeOf(actualHome, actualAway)) {
    return POINTS_OUTCOME;
  }

  return POINTS_WRONG;
}
