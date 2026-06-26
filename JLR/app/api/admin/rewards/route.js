import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const winners = await prisma.rewardWinner.findMany({
    include: {
      user: {
        select: {
          name: true,
          employeeCode: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return NextResponse.json({ winners });
}

export async function POST(request) {
  const body = await request.json();
  const roundKey = String(body.roundKey || '').trim();
  const employeeCode = String(body.employeeCode || '').trim();
  const points = Number(body.points || 0);

  if (!roundKey || !employeeCode) {
    return NextResponse.json(
      { error: 'Round and employee ID are required.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      employeeCode
    },
    select: {
      id: true,
      name: true,
      employeeCode: true
    }
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Employee not found.' },
      { status: 404 }
    );
  }

  const winner = await prisma.rewardWinner.create({
    data: {
      roundKey,
      userId: user.id,
      points,
      isAnnounced: true
    },
    include: {
      user: {
        select: {
          name: true,
          employeeCode: true
        }
      }
    }
  });

  return NextResponse.json({ winner });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Winner ID is required.' },
      { status: 400 }
    );
  }

  await prisma.rewardWinner.delete({
    where: { id }
  });

  return NextResponse.json({ ok: true });
}
