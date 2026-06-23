import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { hashPassword, generatePassword } from '../../../../../lib/password';

export async function PATCH(req, { params }) {
  const { id } = params;
  const body = await req.json();

  const data = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.email !== undefined) data.email = body.email.trim().toLowerCase();
  if (body.employeeCode !== undefined) data.employeeCode = body.employeeCode.trim();
  if (body.departmentId !== undefined) data.departmentId = body.departmentId || null;
  if (body.role !== undefined) data.role = body.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';

  let plainPassword;
  if (body.resetPassword) {
    plainPassword = generatePassword();
    data.passwordHash = hashPassword(plainPassword);
  }

  try {
    const user = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({
      employee: { id: user.id, name: user.name, email: user.email, employeeCode: user.employeeCode },
      plainPassword,
    });
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
    // Clean up dependent rows first since they reference the user.
    await prisma.$transaction([
      prisma.userAchievement.deleteMany({ where: { userId: id } }),
      prisma.championPick.deleteMany({ where: { userId: id } }),
      prisma.comment.deleteMany({ where: { userId: id } }),
      prisma.prediction.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'admin_err_notFound' }, { status: 404 });
  }
}
