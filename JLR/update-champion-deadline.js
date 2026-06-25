const fs = require('fs');

const file = 'app/api/champion-pick/route.js';

const content = `import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

// Champion picks lock after 3 July 2026, end of day KSA time.
// 2026-07-03 23:59:59 KSA = 2026-07-03 20:59:59 UTC
const CHAMPION_PICK_DEADLINE = new Date('2026-07-03T20:59:59.000Z');

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
`;

fs.writeFileSync(file, content, 'utf8');
console.log('Updated champion deadline:', file);
