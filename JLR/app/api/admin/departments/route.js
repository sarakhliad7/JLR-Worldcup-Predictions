import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  const departments = await prisma.department.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({
    departments: departments.map((d) => ({
      id: d.id,
      name: d.name,
      nameAr: d.nameAr || '',
      shortCode: d.shortCode,
      colorHex: d.colorHex,
      userCount: d._count.users,
    })),
  });
}

export async function POST(req) {
  const body = await req.json();
  const name = (body.name || '').trim();
  const nameAr = (body.nameAr || '').trim();
  const shortCode = (body.shortCode || '').trim();
  const colorHex = body.colorHex || '#9B6A43';

  if (!name || !shortCode) {
    return NextResponse.json({ error: 'admin_err_missingFields' }, { status: 400 });
  }

  try {
    const department = await prisma.department.create({
      data: { name, nameAr: nameAr || null, shortCode, colorHex },
    });
    return NextResponse.json({ department });
  } catch (e) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'admin_err_duplicateUser' }, { status: 409 });
    }
    throw e;
  }
}
