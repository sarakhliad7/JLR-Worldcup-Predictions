import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { scoreMatchAndRecompute } from '../../../../../lib/recompute';

export async function PATCH(req, { params }) {
  const { id } = params;
  const body = await req.json();

  const data = {};
  if (body.round !== undefined) data.round = body.round.trim();
  if (body.group !== undefined) data.group = body.group ? body.group.trim() : null;
  if (body.kickoffAt !== undefined) {
    const d = new Date(body.kickoffAt);
    if (!isNaN(d.getTime())) {
      data.kickoffAt = d;
      data.lockAt = d;
    }
  }
  if (body.venue !== undefined) data.venue = body.venue ? body.venue.trim() : null;
  if (body.homeTeamId !== undefined) data.homeTeamId = body.homeTeamId || null;
  if (body.awayTeamId !== undefined) data.awayTeamId = body.awayTeamId || null;

  // Entering/correcting a result is the important path: it marks the match
  // as admin-sourced (so the auto-sync won't overwrite it), flips status to
  // FINISHED, and triggers a full points recalculation for this match.
  let enteredResult = false;
  if (body.homeScore !== undefined && body.awayScore !== undefined) {
    const homeScore = Number(body.homeScore);
    const awayScore = Number(body.awayScore);
    if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
      return NextResponse.json({ error: 'err_invalidScore' }, { status: 400 });
    }
    data.homeScore = homeScore;
    data.awayScore = awayScore;
    data.status = 'FINISHED';
    data.resultSource = 'ADMIN';
    enteredResult = true;
  }

  try {
    const match = await prisma.match.update({
      where: { id },
      data,
      include: { homeTeam: true, awayTeam: true },
    });

    let predictionsScored = 0;
    if (enteredResult) {
      const result = await scoreMatchAndRecompute(id);
      predictionsScored = result.predictionsScored;
    }

    return NextResponse.json({ match, predictionsScored });
  } catch (e) {
    return NextResponse.json({ error: 'admin_err_notFound' }, { status: 404 });
  }
}

export async function DELETE(req, { params }) {
  const { id } = params;
  try {
    await prisma.$transaction([
      prisma.prediction.deleteMany({ where: { matchId: id } }),
      prisma.match.delete({ where: { id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'admin_err_notFound' }, { status: 404 });
  }
}
