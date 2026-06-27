import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

function getStageFromRound(round) {
  if (!round) return null;

  // جميع Matchday تعتبر مرحلة واحدة
  if (round.startsWith('Matchday')) {
    return 'Group Stage';
  }

  return round;
}

export async function GET() {
  const matches = await prisma.match.findMany({
    where: {
      round: {
        not: '',
      },
    },
    select: {
      round: true,
      kickoffAt: true,
    },
    orderBy: {
      kickoffAt: 'asc',
    },
  });

  const seen = new Set();

  const rounds = matches
    .map((match) => ({
      key: getStageFromRound(match.round),
      kickoffAt: match.kickoffAt,
    }))
    .filter((stage) => stage.key)
    .filter((stage) => {
      if (seen.has(stage.key)) return false;
      seen.add(stage.key);
      return true;
    })
    .map((stage) => ({
      key: stage.key,
      label: stage.key,
    }));

  return NextResponse.json({ rounds });
}