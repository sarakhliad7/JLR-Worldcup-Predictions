import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ROUND_CONFIG = [
  {
    key: 'r32',
    winnersCount: 2,
    closingAt: '2026-06-29T20:59:59.000Z',
    labels: { en: 'Round of 32', ar: 'دور 32' },
    closeLabel: { en: 'Closes on 29 June', ar: 'يغلق في 29 يونيو' },
    match: (round) => {
      const r = String(round || '').toLowerCase();
      return r.includes('32') || r.includes('round of 32');
    }
  },
  {
    key: 'r16',
    winnersCount: 1,
    closingAt: '2026-07-05T20:59:59.000Z',
    labels: { en: 'Round of 16', ar: 'دور 16' },
    closeLabel: { en: 'Closes on 5 July', ar: 'يغلق في 5 يوليو' },
    match: (round) => {
      const r = String(round || '').toLowerCase();
      return r.includes('16') || r.includes('round of 16');
    }
  },
  {
    key: 'qf',
    winnersCount: 1,
    closingAt: '2026-07-09T20:59:59.000Z',
    labels: { en: 'Quarter-finals', ar: 'ربع النهائي' },
    closeLabel: { en: 'Closes on 9 July', ar: 'يغلق في 9 يوليو' },
    match: (round) => {
      const r = String(round || '').toLowerCase();
      return r.includes('quarter') || r.includes('8') || r.includes('qf');
    }
  },
  {
    key: 'sf',
    winnersCount: 1,
    closingAt: '2026-07-14T20:59:59.000Z',
    labels: { en: 'Semi-finals', ar: 'نصف النهائي' },
    closeLabel: { en: 'Closes on 14 July', ar: 'يغلق في 14 يوليو' },
    match: (round) => {
      const r = String(round || '').toLowerCase();
      return r.includes('semi') || r.includes('4') || r.includes('sf');
    }
  },
  {
    key: 'final',
    winnersCount: 1,
    closingAt: '2026-07-19T20:59:59.000Z',
    labels: { en: 'Final', ar: 'النهائي' },
    closeLabel: { en: 'Closes on 19 July', ar: 'يغلق في 19 يوليو' },
    match: (round) => {
      const r = String(round || '').toLowerCase();
      return r === 'final' || r.includes('final');
    }
  }
];

function getRoundStatus(config, matches) {
  const now = new Date();
  const closingAt = new Date(config.closingAt);

  if (now > closingAt) return 'ended';

  if (!matches.length) return 'upcoming';

  const anyLive = matches.some((m) => m.status === 'LIVE');
  if (anyLive) return 'live';

  const anyStarted = matches.some((m) => new Date(m.kickoffAt) <= now);
  if (anyStarted) return 'in_progress';

  return 'upcoming';
}

export async function GET() {
  const matches = await prisma.match.findMany({
    select: {
      id: true,
      round: true,
      kickoffAt: true,
      status: true
    },
    orderBy: { kickoffAt: 'asc' }
  });

  const rounds = [];

  for (const config of ROUND_CONFIG) {
    const roundMatches = matches.filter((m) => config.match(m.round));
    const status = getRoundStatus(config, roundMatches);
    let winners = [];

    if (status === 'ended' && roundMatches.length) {
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
      closeLabel: config.closeLabel,
      closingAt: config.closingAt,
      status,
      matchesCount: roundMatches.length,
      winners
    });
  }

  return NextResponse.json(
    { rounds },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
