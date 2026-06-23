import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function PATCH(req, { params }) {
  const { id } = params;
  const body = await req.json();

  const data = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.nameAr !== undefined) data.nameAr = body.nameAr.trim() || null;
  if (body.shortCode !== undefined) data.shortCode = body.shortCode.trim();
  if (body.colorHex !== undefined) data.colorHex = body.colorHex;

  try {
    const department = await prisma.department.update({ where: { id }, data });
    return NextResponse.json({ department });
  } catch (e) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'admin_err_duplicateUser' }, { status: 409 });
    }
    return NextResponse.json({ error: 'admin_err_notFound' }, { status: 404 });
  }
}

export async function DELETE(req, { params }) {
  const { id } = params;
  try {
    await prisma.$transaction([
      prisma.user.updateMany({ where: { departmentId: id }, data: { departmentId: null } }),
      prisma.department.delete({ where: { id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'admin_err_notFound' }, { status: 404 });
  }
}
