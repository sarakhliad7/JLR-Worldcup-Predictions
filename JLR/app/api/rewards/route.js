import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ROUND_CONFIG = [
  {
    key: 'r32',
    winnersCount: 2,
    startAt: '2026-06-27T21:00:00.000Z',
    endAt: '2026-07-03T20:59:59.000Z',
    labels: { en: 'Round of 32', ar: 'دور 32' },
    closeLabel: { en: '28 June - 3 July', ar: '28 يونيو - 3 يوليو' },
    match: (round) => {
      const r = String(round || '').toLowerCase();
      return r.includes('32') || r.includes('round of 32');
    }
  },
  {
    key: 'r16',
    winnersCount: 1,
    startAt: '2026-07-03T21:00:00.000Z',
    endAt: '2026-07-07T20:59:59.000Z',
    labels: { en: 'Round of 16', ar: 'دور 16' },
    closeLabel: { en: '4 July - 7 July', ar: '4 يوليو - 7 يوليو' },
    match: (round) => {
      const r = String(round || '').toLowerCase();
      return r.includes('16') || r.includes('round of 16');
    }
  },
  {
    key: 'qf',
    winnersCount: 1,
    startAt: '2026-07-08T21:00:00.000Z',
    endAt: '2026-07-12T20:59:59.000Z',
    labels: { en: 'Quarter-finals', ar: 'ربع النهائي' },
    closeLabel: { en: '9 July - 12 July', ar: '9 يوليو - 12 يوليو' },
    match: (round) => {
      const r = String(round || '').toLowerCase();
      return r.includes('quarter') || r.includes('8') || r.includes('qf');
    }
  },
  {
    key: 'sf',
    winnersCount: 1,
    startAt: '2026-07-13T21:00:00.000Z',
    endAt: '2026-07-15T20:59:59.000Z',
    labels: { en: 'Semi-finals', ar: 'نصف النهائي' },
    closeLabel: { en: '14 July - 15 July', ar: '14 يوليو - 15 يوليو' },
    match: (round) => {
      const r = String(round || '').toLowerCase();
      return r.includes('semi') || r.includes('4') || r.includes('sf');
    }
  },
  {
    key: 'final',
    winnersCount: 1,
    startAt: '2026-07-18T21:00:00.000Z',
    endAt: '2026-07-19T20:59:59.000Z',
    labels: { en: 'Final', ar: 'النهائي' },
    closeLabel: { en: '19 July', ar: '19 يوليو' },
    match: (round) => {
      const r = String(round || '').toLowerCase();
      return r === 'final' || r.includes('final');
    }
  }
];

function getRoundStatus(config) {
  const now = new Date();
  const startAt = new Date(config.startAt);
  const endAt = new Date(config.endAt);

  if (now < startAt) return 'upcoming';
  if (now > endAt) return 'ended';
  return 'in_progress';
}

export async function GET() {
  const matches = await prisma.match.findMany({
    select: {
      id: true,
      round: true
    }
  });

  const rounds = [];

  for (const config of ROUND_CONFIG) {
    const roundMatches = matches.filter((m) => config.match(m.round));
    const status = getRoundStatus(config);
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
      startAt: config.startAt,
      endAt: config.endAt,
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
