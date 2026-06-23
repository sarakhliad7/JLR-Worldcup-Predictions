import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get('matchId');

  const predictions = await prisma.prediction.findMany({
    where: matchId ? { matchId } : {},
    include: {
      user: { include: { department: true } },
      match: { include: { homeTeam: true, awayTeam: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });

  return NextResponse.json({
    predictions: predictions.map((p) => ({
      id: p.id,
      predHomeScore: p.predHomeScore,
      predAwayScore: p.predAwayScore,
      pointsAwarded: p.pointsAwarded,
      createdAt: p.createdAt,
      user: {
        name: p.user.name,
        email: p.user.email,
        department: p.user.department?.name || null,
      },
      match: {
        id: p.match.id,
        round: p.match.round,
        homeTeam: p.match.homeTeam?.nameEn || p.match.homeTeamLabel,
        awayTeam: p.match.awayTeam?.nameEn || p.match.awayTeamLabel,
        homeScore: p.match.homeScore,
        awayScore: p.match.awayScore,
      },
    })),
  });
}
