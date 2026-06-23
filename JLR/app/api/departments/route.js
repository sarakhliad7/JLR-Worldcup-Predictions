import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { users: true } } },
  });

  return NextResponse.json({
    departments: departments.map((d) => ({
      id: d.id,
      name: d.name,
      nameAr: d.nameAr || d.name,
      shortCode: d.shortCode,
      colorHex: d.colorHex,
      userCount: d._count.users,
    })),
  });
}
