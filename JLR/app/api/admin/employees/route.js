import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hashPassword, generatePassword } from '../../../../lib/password';

export async function GET() {
  const employees = await prisma.user.findMany({
    include: { department: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    employees: employees.map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email,
      employeeCode: e.employeeCode,
      idNumber: e.idNumber,
      role: e.role,
      department: e.department ? { id: e.department.id, name: e.department.name } : null,
      totalPoints: e.totalPoints,
      createdAt: e.createdAt,
    })),
  });
}

export async function POST(req) {
  const body = await req.json();
  const name = (body.name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const employeeCode = (body.employeeCode || '').trim();
  const idNumber = (body.idNumber || '').trim() || null;
  const departmentId = body.departmentId || null;
  const role = body.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';

  if (!name || !employeeCode) {
    return NextResponse.json({ error: 'admin_err_missingFields' }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: finalEmail }, { employeeCode }, ...(idNumber ? [{ idNumber }] : [])] },
  });
  if (existing) {
    return NextResponse.json({ error: 'admin_err_duplicateUser' }, { status: 409 });
  }

  const plainPassword = generatePassword();
  const user = await prisma.user.create({
    data: {
      name,
      email: finalEmail,
      employeeCode,
      idNumber,
      passwordHash: hashPassword(plainPassword),
      avatarLabel: name.slice(0, 2).toUpperCase(),
      role,
      departmentId,
    },
  });

  return NextResponse.json({
    employee: { id: user.id, name: user.name, email: user.email, employeeCode: user.employeeCode, idNumber: user.idNumber },
    plainPassword,
  });
}
