import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

// Champion picks lock once the tournament's Round of 32 kicks off.
async function picksLocked() {
  const firstKnockout = await prisma.match.findFirst({
    where: { round: 'Round of 32' },
    orderBy: { kickoffAt: 'asc' },
  });
  if (!firstKnockout) return false;
  return new Date() >= new Date(firstKnockout.kickoffAt);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'err_mustLogin' }, { status: 401 });
  }

  const pick = await prisma.championPick.findUnique({
    where: { userId: session.user.id },
    include: { team: true },
  });

  const teams = await prisma.team.findMany({ orderBy: { nameEn: 'asc' } });
  const locked = await picksLocked();

  return NextResponse.json({ pick, teams, locked });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'err_mustLogin' }, { status: 401 });
  }

  if (await picksLocked()) {
    return NextResponse.json(
      { error: 'champion_lockedError' },
      { status: 403 }
    );
  }

  const { teamId } = await req.json();
  if (!teamId) {
    return NextResponse.json({ error: 'champion_chooseTeamError' }, { status: 400 });
  }

  const pick = await prisma.championPick.upsert({
    where: { userId: session.user.id },
    update: { teamId, lockedAt: new Date() },
    create: { userId: session.user.id, teamId },
  });

  return NextResponse.json({ pick });
}
