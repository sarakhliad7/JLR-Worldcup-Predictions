import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  const [employeeCount, departmentCount, matchCount, predictionCount] = await Promise.all([
    prisma.user.count(),
    prisma.department.count(),
    prisma.match.count(),
    prisma.prediction.count(),
  ]);

  return NextResponse.json({
    employeeCount,
    departmentCount,
    matchCount,
    predictionCount,
  });
}
