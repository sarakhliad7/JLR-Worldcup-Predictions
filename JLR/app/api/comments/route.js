import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ comments: [] });
}

export async function POST() {
  return NextResponse.json(
    { error: 'err_forbidden' },
    { status: 403 }
  );
}
