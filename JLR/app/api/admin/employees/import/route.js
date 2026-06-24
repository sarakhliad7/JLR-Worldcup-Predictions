import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '../../../../../lib/prisma';
import { hashPassword, generatePassword } from '../../../../../lib/password';

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json(
      { error: 'admin_err_noFile' },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let rows;

  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  } catch (e) {
    return NextResponse.json(
      { error: 'admin_err_invalidFile' },
      { status: 400 }
    );
  }

  if (!rows.length) {
    return NextResponse.json(
      { error: 'admin_err_emptyFile' },
      { status: 400 }
    );
  }

  function getField(row, candidates) {
    const keys = Object.keys(row);

    for (const candidate of candidates) {
      const match = keys.find(
        (k) => k.trim().toLowerCase() === candidate.toLowerCase()
      );

      if (match && String(row[match]).trim()) {
        return String(row[match]).trim();
      }
    }

    return '';
  }

  const departments = await prisma.department.findMany();

  const deptByName = new Map(
    departments.map((d) => [d.name.toLowerCase(), d.id])
  );

  let imported = 0;
  let skipped = 0;

  const skippedRows = [];
  const createdCredentials = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const email = getField(row, [
      'email',
      'e-mail',
      'email address'
    ]).toLowerCase();

    const fullName = getField(row, [
      'full name',
      'fullname',
      'name',
      'employee name en'
    ]);

    const departmentName = getField(row, [
      'department',
      'dept',
      'division'
    ]);

    const employeeCode = getField(row, [
      'employee id',
      'employeeid',
      'employee code',
      'emp id',
      'id'
    ]);

    if (!email || !fullName) {
      skipped++;
      skippedRows.push({
        row: i + 2,
        reason: 'admin_err_missingFields'
      });
      continue;
    }

    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      skipped++;
      skippedRows.push({
        row: i + 2,
        reason: 'admin_err_duplicateUser'
      });
      continue;
    }

    const departmentId = departmentName
      ? deptByName.get(departmentName.toLowerCase()) || null
      : null;

    const finalEmployeeCode =
      employeeCode || `EMP${Date.now().toString().slice(-6)}${i}`;

    const plainPassword = generatePassword();

    await prisma.user.create({
      data: {
        name: fullName,
        email,
        employeeCode: finalEmployeeCode,
        passwordHash: hashPassword(plainPassword),
        avatarLabel: fullName.slice(0, 2).toUpperCase(),
        departmentId
      }
    });

    imported++;

    createdCredentials.push({
      name: fullName,
      email,
      employeeCode: finalEmployeeCode,
      password: plainPassword
    });
  }

  return NextResponse.json({
    imported,
    skipped,
    skippedRows,
    createdCredentials
  });
}