import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ROUND_CONFIG = [
  {
    key: 'r32',
    roundKey: 'Round of 32',
    winnersCount: 2,
    startAt: '2026-06-28T00:00:00+03:00',
    endAt: '2026-07-04T12:00:00+03:00',
    labels: { en: 'Round of 32', ar: 'دور 32' },
    closeLabel: { en: '28 June - 4 July', ar: '28 يونيو - 4 يوليو' },
  },
  {
    key: 'r16',
    roundKey: 'Round of 16',
    winnersCount: 2,
    startAt: '2026-07-04T20:00:00+03:00',
    endAt: '2026-07-07T23:59:59+03:00',
    labels: { en: 'Round of 16', ar: 'دور 16' },
    closeLabel: { en: '5 July - 7 July', ar: '5 يوليو - 7 يوليو' },
  },
  {
    key: 'qf',
    roundKey: 'Quarter-final',
    winnersCount: 1,
    startAt: '2026-07-09T00:00:00+03:00',
    endAt: '2026-07-12T23:59:59+03:00',
    labels: { en: 'Quarter-final', ar: 'ربع النهائي' },
    closeLabel: { en: '9 July - 12 July', ar: '9 يوليو - 12 يوليو' },
  },
  {
    key: 'sf',
    roundKey: 'Semi-final',
    winnersCount: 1,
    startAt: '2026-07-14T00:00:00+03:00',
    endAt: '2026-07-15T23:59:59+03:00',
    labels: { en: 'Semi-final', ar: 'نصف النهائي' },
    closeLabel: { en: '14 July - 15 July', ar: '14 يوليو - 15 يوليو' },
  },
  {
    key: 'final',
    roundKey: 'Final',
    winnersCount: 1,
    startAt: '2026-07-19T00:00:00+03:00',
    endAt: '2026-07-19T23:59:59+03:00',
    labels: { en: 'Final', ar: 'النهائي' },
    closeLabel: { en: '19 July', ar: '19 يوليو' },
  },
];

function normalizeRound(round) {
  if (!round) return null;

  if (round === 'Quarter-finals') return 'Quarter-final';
  if (round === 'Semi-finals') return 'Semi-final';

  return round;
}

function getRoundStatus(config) {
  const now = new Date();
  const startAt = new Date(config.startAt);
  const endAt = new Date(config.endAt);

  if (now < startAt) return 'upcoming';
  if (now > endAt) return 'ended';
  return 'in_progress';
}

export async function GET() {
  const winners = await prisma.rewardWinner.findMany({
    include: {
      user: {
        select: {
          name: true,
          employeeCode: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const rounds = ROUND_CONFIG.map((config) => {
    const status = getRoundStatus(config);

    const roundWinners = winners
      .filter((winner) => normalizeRound(winner.roundKey) === config.roundKey)
      .slice(0, config.winnersCount)
      .map((winner) => ({
        name: winner.user?.name || 'Unknown',
        employeeCode: winner.user?.employeeCode || '-',
        points: winner.points || 0,
      }));

    return {
      key: config.key,
      roundKey: config.roundKey,
      winnersCount: config.winnersCount,
      labels: config.labels,
      closeLabel: config.closeLabel,
      startAt: config.startAt,
      endAt: config.endAt,
      status,
      winners: roundWinners,
    };
  });

  return NextResponse.json(
    { rounds },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
