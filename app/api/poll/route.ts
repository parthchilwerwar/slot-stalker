// POST /api/poll — Trigger one poll cycle
import { NextRequest, NextResponse } from 'next/server';
import { pollStalk } from '@/lib/agent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stalkId } = body;

    if (!stalkId) {
      return NextResponse.json(
        { success: false, error: 'stalkId is required' },
        { status: 400 }
      );
    }

    const result = await pollStalk(stalkId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Poll error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
