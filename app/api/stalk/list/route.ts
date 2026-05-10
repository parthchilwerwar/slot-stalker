// GET /api/stalk/list — Return all stalks for userId
import { NextRequest, NextResponse } from 'next/server';
import { getAllStalks } from '@/lib/state';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || 'demo_user';
  const stalks = getAllStalks(userId);
  return NextResponse.json({ success: true, stalks });
}
