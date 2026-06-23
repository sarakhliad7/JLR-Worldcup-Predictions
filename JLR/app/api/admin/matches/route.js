import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoffAt: 'asc' },
    take: 500,
  });

  const teams = await prisma.team.findMany({ orderBy: { nameEn: 'asc' } });

  return NextResponse.json({
    matches: matches.map((m) => ({
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
      resultSource: m.resultSource,
    })),
    teams,
  });
}

export async function POST(req) {
  const body = await req.json();
  const round = (body.round || '').trim();
  const group = body.group ? body.group.trim() : null;
  const kickoffAt = body.kickoffAt ? new Date(body.kickoffAt) : null;
  const venue = body.venue ? body.venue.trim() : null;
  const homeTeamId = body.homeTeamId || null;
  const awayTeamId = body.awayTeamId || null;

  if (!round || !kickoffAt || isNaN(kickoffAt.getTime())) {
    return NextResponse.json({ error: 'admin_err_missingFields' }, { status: 400 });
  }

  const match = await prisma.match.create({
    data: {
      round,
      group,
      kickoffAt,
      lockAt: kickoffAt,
      venue,
      homeTeamId,
      awayTeamId,
      status: 'SCHEDULED',
    },
    include: { homeTeam: true, awayTeam: true },
  });

  return NextResponse.json({ match });
}
