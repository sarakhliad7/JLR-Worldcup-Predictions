import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'err_mustLogin' }, { status: 401 });
  }

  const { matchId } = params;
  const body = await req.json();
  const predHomeScore = Number(body.predHomeScore);
  const predAwayScore = Number(body.predAwayScore);

  if (
    !Number.isInteger(predHomeScore) ||
    !Number.isInteger(predAwayScore) ||
    predHomeScore < 0 ||
    predAwayScore < 0 ||
    predHomeScore > 30 ||
    predAwayScore > 30
  ) {
    return NextResponse.json({ error: 'err_invalidScore' }, { status: 400 });
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ error: 'err_matchNotFound' }, { status: 404 });
  }

  if (new Date() >= new Date(match.lockAt)) {
    return NextResponse.json(
      { error: 'err_predictionsClosed' },
      { status: 403 }
    );
  }

  const prediction = await prisma.prediction.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId } },
    update: { predHomeScore, predAwayScore },
    create: {
      userId: session.user.id,
      matchId,
      predHomeScore,
      predAwayScore,
    },
  });

  return NextResponse.json({ prediction });
}
