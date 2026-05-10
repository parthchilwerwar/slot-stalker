// POST /api/book — Confirm a table reservation
import { NextRequest, NextResponse } from 'next/server';
import { bookSlot } from '@/lib/agent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stalkId, slot, restaurantId } = body;

    if (!stalkId || !slot || !restaurantId) {
      return NextResponse.json(
        { success: false, error: 'stalkId, slot, and restaurantId are required' },
        { status: 400 }
      );
    }

    const result = await bookSlot(stalkId, slot, restaurantId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Book error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
