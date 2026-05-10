// POST /api/stalk/create — Parse intent → search → slots → score → save
import { NextRequest, NextResponse } from 'next/server';
import { createStalk } from '@/lib/agent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawText, userId } = body;

    if (!rawText) {
      return NextResponse.json(
        { success: false, error: 'rawText is required' },
        { status: 400 }
      );
    }

    const result = await createStalk(rawText, userId || 'demo_user');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Create stalk error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
