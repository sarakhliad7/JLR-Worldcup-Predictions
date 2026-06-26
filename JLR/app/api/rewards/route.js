import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ROUND_CONFIG = [
  {
    key: 'r32',
    winnersCount: 2,
    labels: { en: 'Round of 32', ar: 'دور 32' },
    match: (round) => {
      const r = String(round || '').toLowerCase();
      return r.includes('32') || r.includes('round of 32');
    }
  },
  {
    key: 'r16',
    winnersCount: 1,
    labels: { en: 'Round of 16', ar: 'دور 16' },
    match: (round) => {
      const r = String(round || '').toLowerCase();
      return r.includes('16') || r.includes('round of 16');
    }
  },
  {
    key: 'qf',
    winnersCount: 1,
    labels: { en: 'Quarter-finals', ar: 'ربع النهائي' },
    match: (round) => {
      const r = String(round || '').toLowerCase();
      return r.includes('quarter') || r.includes('8') || r.includes('qf');
    }
  },
  {
    key: 'sf',
    winnersCount: 1,
    labels: { en: 'Semi-finals', ar: 'نصف النهائي' },
    match: (round) => {
      const r = String(round || '').toLowerCase();
      return r.includes('semi') || r.includes('4') || r.includes('sf');
    }
  },
  {
    key: 'final',
    winnersCount: 1,
    labels: { en: 'Final', ar: 'النهائي' },
    match: (round) => {
      const r = String(round || '').toLowerCase();
      return r === 'final' || r.includes('final');
    }
  }
];

function getRoundStatus(matches) {
  if (!matches.length) return 'upcoming';

  const allFinished = matches.every(
    (m) => m.status === 'FINISHED' && m.homeScore !== null && m.awayScore !== null
  );

  if (allFinished) return 'ended';

  const anyLive = matches.some((m) => m.status === 'LIVE');
  if (anyLive) return 'live';

  const now = new Date();
  const anyStarted = matches.some((m) => new Date(m.kickoffAt) <= now);
  if (anyStarted) return 'in_progress';

  return 'upcoming';
}

export async function GET() {
  const manualWinners = await prisma.rewardWinner.findMany({
    include: {
      user: {
        select: {
          name: true,
          employeeCode: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const matches = await prisma.match.findMany({
    select: {
      id: true,
      round: true,
      kickoffAt: true,
      status: true,
      homeScore: true,
      awayScore: true
    },
    orderBy: { kickoffAt: 'asc' }
  });

  const rounds = [];

  for (const config of ROUND_CONFIG) {
    const roundMatches = matches.filter((m) => config.match(m.round));
    const status = getRoundStatus(roundMatches);
    let winners = [];

    const announcedWinners = manualWinners
      .filter((winner) => winner.roundKey === config.key)
      .map((winner) => ({
        name: winner.user?.name || 'Unknown',
        employeeCode: winner.user?.employeeCode || '-',
        points: winner.points,
        manual: true
      }));

    if (announcedWinners.length) {
      winners = announcedWinners;
    } else if (status === 'ended' && roundMatches.length) {
      const matchIds = roundMatches.map((m) => m.id);

      const grouped = await prisma.prediction.groupBy({
        by: ['userId'],
        where: {
          matchId: { in: matchIds },
          pointsAwarded: { not: null }
        },
        _sum: { pointsAwarded: true }
      });

      const ranked = grouped
        .map((g) => ({
          userId: g.userId,
          points: g._sum.pointsAwarded || 0
        }))
        .filter((x) => x.points > 0)
        .sort((a, b) => b.points - a.points);

      const top = ranked.slice(0, config.winnersCount);

      const users = await prisma.user.findMany({
        where: { id: { in: top.map((x) => x.userId) } },
        select: {
          id: true,
          name: true,
          employeeCode: true
        }
      });

      winners = top.map((item) => {
        const user = users.find((u) => u.id === item.userId);

        return {
          name: user?.name || 'Unknown',
          employeeCode: user?.employeeCode || '-',
          points: item.points
        };
      });
    }

    rounds.push({
      key: config.key,
      winnersCount: config.winnersCount,
      labels: config.labels,
      status: announcedWinners.length ? 'announced' : status,
      matchesCount: roundMatches.length,
      winners
    });
  }

  return NextResponse.json(
    { rounds },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
