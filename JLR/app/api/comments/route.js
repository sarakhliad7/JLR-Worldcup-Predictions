import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

function shapeUser(u) {
  return {
    name: u.name,
    avatarLabel: u.avatarLabel || u.name.slice(0, 2),
    department: u.department?.name || null,
    colorHex: u.department?.colorHex || '#9B6A43',
  };
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get('matchId');

  const comments = await prisma.comment.findMany({
    where: matchId ? { matchId } : { matchId: null },
    include: { user: { include: { department: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      user: shapeUser(c.user),
    })),
  });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'err_mustLogin' }, { status: 401 });
  }

  const { body, matchId } = await req.json();
  const trimmed = (body || '').trim();
  if (!trimmed) {
    return NextResponse.json({ error: 'err_emptyMessage' }, { status: 400 });
  }
  if (trimmed.length > 500) {
    return NextResponse.json({ error: 'err_messageTooLong' }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: { body: trimmed, matchId: matchId || null, userId: session.user.id },
    include: { user: { include: { department: true } } },
  });

  return NextResponse.json({
    comment: {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      user: shapeUser(comment.user),
    },
  });
}
