import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'err_forbidden' }, { status: 403 });
  }

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  });

  return NextResponse.json({ announcements });
}

export async function POST(req) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'err_forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const title = (body.title || '').trim();
  const titleAr = (body.titleAr || '').trim();
  const announcementBody = (body.body || '').trim();
  const bodyAr = (body.bodyAr || '').trim();
  const pinned = Boolean(body.pinned);

  if (!title || !announcementBody) {
    return NextResponse.json({ error: 'admin_err_missingFields' }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      titleAr: titleAr || title,
      body: announcementBody,
      bodyAr: bodyAr || announcementBody,
      pinned,
    },
  });

  return NextResponse.json({ announcement });
}

export async function DELETE(req) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'err_forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'admin_err_missingFields' }, { status: 400 });
  }

  await prisma.announcement.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
