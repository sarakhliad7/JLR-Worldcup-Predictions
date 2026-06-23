import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

// Round buckets used by the filter chips on the predictions page
const ROUND_GROUPS = {
  group: ['Matchday'], // any round starting with "Matchday"
  r32: ['Round of 32'],
  r16: ['Round of 16'],
  knockout: ['Quarter-final', 'Semi-final', 'Match for third place', 'Final'],
};

export async function GET(req) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter') || 'upcoming'; // upcoming | finished | all | group | r32 | r16 | knockout

  let where = {};
  const now = new Date();

  if (filter === 'upcoming') {
    where = { status: { in: ['SCHEDULED', 'LIVE'] } };
  } else if (filter === 'finished') {
    where = { status: 'FINISHED' };
  } else if (filter === 'group') {
    where = { round: { startsWith: 'Matchday' } };
  } else if (filter === 'r32') {
    where = { round: 'Round of 32' };
  } else if (filter === 'r16') {
    where = { round: 'Round of 16' };
  } else if (filter === 'knockout') {
    where = { round: { in: ROUND_GROUPS.knockout } };
  }
  // 'all' -> no filter

  const matches = await prisma.match.findMany({
    where,
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: session?.user?.id
        ? { where: { userId: session.user.id } }
        : false,
    },
    orderBy: { kickoffAt: 'asc' },
    take: 100,
  });

  const shaped = matches.map((m) => ({
    id: m.id,
    round: m.round,
    group: m.group,
    kickoffAt: m.kickoffAt,
    venue: m.venue,
    status: m.status,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeTeamLabel: m.homeTeamLabel,
    awayTeamLabel: m.awayTeamLabel,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    locked: now >= new Date(m.lockAt),
    myPrediction: m.predictions?.[0]
      ? {
          predHomeScore: m.predictions[0].predHomeScore,
          predAwayScore: m.predictions[0].predAwayScore,
          pointsAwarded: m.predictions[0].pointsAwarded,
        }
      : null,
  }));

  return NextResponse.json({ matches: shaped });
}
