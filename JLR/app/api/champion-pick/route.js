import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

// Champion picks lock after 4 July 2026, 12:00 PM KSA time.
// 2026-07-04 12:00:00 KSA = 2026-07-04 09:00:00 UTC
const CHAMPION_PICK_DEADLINE = new Date('2026-07-04T09:00:00.000Z');

function picksLocked() {
  return new Date() > CHAMPION_PICK_DEADLINE;
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
  const locked = picksLocked();

  return NextResponse.json({ pick, teams, locked });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'err_mustLogin' }, { status: 401 });
  }

  if (picksLocked()) {
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
