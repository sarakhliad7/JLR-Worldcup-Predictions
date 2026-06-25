const fs = require('fs');

const content = `import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const announcements = await prisma.announcement.findMany({
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  });

  return NextResponse.json(
    { announcements },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
`;

fs.writeFileSync('app/api/announcements/route.js', content, 'utf8');
console.log('Public announcements API forced dynamic.');
