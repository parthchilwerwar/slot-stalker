// GET/PATCH /api/stalk/[id] — Single stalk operations
import { NextRequest, NextResponse } from 'next/server';
import { getStalk, saveStalk } from '@/lib/state';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;
  const stalk = getStalk(id);
  if (!stalk) {
    return NextResponse.json(
      { success: false, error: 'Stalk not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, stalk });
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;
  const stalk = getStalk(id);
  if (!stalk) {
    return NextResponse.json(
      { success: false, error: 'Stalk not found' },
      { status: 404 }
    );
  }

  const updates = await req.json();
  const updated = { ...stalk, ...updates };
  saveStalk(updated);
  return NextResponse.json({ success: true, stalk: updated });
}
