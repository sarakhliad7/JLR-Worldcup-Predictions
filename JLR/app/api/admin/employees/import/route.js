import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import crypto from 'crypto';
import { prisma } from '../../../../../lib/prisma';

export const dynamic = 'force-dynamic';

function clean(value) {
  return String(value ?? '').trim();
}

function normalizeKey(key) {
  return String(key || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function getField(row, candidates) {
  const normalizedRow = {};

  for (const [key, value] of Object.entries(row)) {
    normalizedRow[normalizeKey(key)] = value;
  }

  for (const candidate of candidates) {
    const value = normalizedRow[normalizeKey(candidate)];
    if (value !== undefined && value !== null && clean(value) !== '') {
      return clean(value);
    }
  }

  return '';
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({
        error: 'admin_err_missingFile',
        imported: 0,
        skipped: 0,
        skippedRows: []
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const rows = workbook.SheetNames.flatMap((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(sheet, { defval: '' });
    });

    const departments = await prisma.department.findMany();
    const deptByName = new Map();
    const deptByCode = new Map();

    for (const dept of departments) {
      deptByName.set(clean(dept.name).toLowerCase(), dept.id);
      deptByCode.set(clean(dept.code).toLowerCase(), dept.id);
    }

    const skippedRows = [];
    const createdCredentials = [];
    const data = [];

    const seenEmployeeCodes = new Set();
    const seenIdNumbers = new Set();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const fullName = getField(row, ['Full Name', 'Name', 'Employee Name', 'FullName']);
      const employeeCode = getField(row, ['Employee ID', 'EmployeeID', 'Employee Code', 'Employee Number', 'Emp ID', 'Staff ID']);
      const idNumber = getField(row, ['ID Number', 'IDNumber', 'National ID', 'NationalID', 'Iqama', 'Iqama ID', 'Iqama Number', 'ID No', 'ID']);
      const departmentName = getField(row, ['Department', 'Dept', 'Department Name', 'Division']);

      if (!fullName || !employeeCode || !idNumber) {
        skippedRows.push({ row: i + 2, reason: 'admin_err_missingFields' });
        continue;
      }

      if (seenEmployeeCodes.has(employeeCode) || seenIdNumbers.has(idNumber)) {
        skippedRows.push({ row: i + 2, reason: 'admin_err_duplicateInFile' });
        continue;
      }

      seenEmployeeCodes.add(employeeCode);
      seenIdNumbers.add(idNumber);

      const departmentId = departmentName
        ? deptByName.get(departmentName.toLowerCase()) ||
          deptByCode.get(departmentName.toLowerCase()) ||
          null
        : null;

      const plainPassword = employeeCode;

      data.push({
        name: fullName,
        employeeCode,
        idNumber,
        passwordHash: crypto.createHash('sha256').update(plainPassword).digest('hex'),
        avatarLabel: fullName.slice(0, 2).toUpperCase(),
        departmentId,
        role: 'EMPLOYEE'
      });

      createdCredentials.push({
        name: fullName,
        employeeCode,
        idNumber,
        password: plainPassword
      });
    }

    const employeeCodes = data.map((x) => x.employeeCode);
    const idNumbers = data.map((x) => x.idNumber);

    const existingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { employeeCode: { in: employeeCodes } },
          { idNumber: { in: idNumbers } }
        ]
      },
      select: {
        employeeCode: true,
        idNumber: true
      }
    });

    const existingEmployeeCodes = new Set(existingUsers.map((u) => u.employeeCode));
    const existingIdNumbers = new Set(existingUsers.map((u) => u.idNumber));

    const finalData = data.filter((x, index) => {
      const exists =
        existingEmployeeCodes.has(x.employeeCode) ||
        existingIdNumbers.has(x.idNumber);

      if (exists) {
        skippedRows.push({
          row: index + 2,
          reason: 'admin_err_duplicateUser'
        });
      }

      return !exists;
    });

    const result = await prisma.user.createMany({
      data: finalData,
      skipDuplicates: true
    });

    return NextResponse.json({
      imported: result.count,
      skipped: rows.length - result.count,
      skippedRows,
      createdCredentials: createdCredentials.slice(0, result.count)
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message || 'Import failed',
      imported: 0,
      skipped: 0,
      skippedRows: []
    }, { status: 500 });
  }
}
