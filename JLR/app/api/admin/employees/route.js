import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  const employees = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      department: true
    }
  });

  return NextResponse.json({
    employees: employees.map((e) => ({
      id: e.id,
      name: e.name,
      employeeCode: e.employeeCode,
      idNumber: e.idNumber,
      role: e.role,
      totalPoints: e.totalPoints,
      avatarLabel: e.avatarLabel,
      department: e.department
        ? { id: e.department.id, name: e.department.name, code: e.department.code }
        : null,
      createdAt: e.createdAt
    }))
  });
}

export async function POST(request) {
  const body = await request.json();

  const name = String(body.name || '').trim();
  const employeeCode = String(body.employeeCode || '').trim();
  const idNumber = String(body.idNumber || '').trim();
  const departmentId = body.departmentId ? String(body.departmentId) : null;
  const role = body.role || 'EMPLOYEE';

  if (!name || !employeeCode || !idNumber) {
    return NextResponse.json(
      { error: 'admin_err_missingFields' },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { employeeCode },
        { idNumber }
      ]
    }
  });

  if (existing) {
    return NextResponse.json(
      { error: 'admin_err_duplicateUser' },
      { status: 409 }
    );
  }

  const plainPassword = employeeCode;

  const user = await prisma.user.create({
    data: {
      name,
      employeeCode,
      idNumber,
      passwordHash: crypto.createHash('sha256').update(plainPassword).digest('hex'),
      avatarLabel: name.slice(0, 2).toUpperCase(),
      departmentId,
      role
    },
    include: {
      department: true
    }
  });

  return NextResponse.json({
    employee: {
      id: user.id,
      name: user.name,
      employeeCode: user.employeeCode,
      idNumber: user.idNumber,
      role: user.role,
      totalPoints: user.totalPoints,
      avatarLabel: user.avatarLabel,
      department: user.department
        ? { id: user.department.id, name: user.department.name, code: user.department.code }
        : null,
      createdAt: user.createdAt
    },
    plainPassword
  });
}
