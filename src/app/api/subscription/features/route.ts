import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasFeature } from '@/lib/subscription/features';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const feature = searchParams.get('feature') as 'advanced_analytics' | 'csv_export' | null;

    if (!feature) {
      return NextResponse.json({ error: 'Feature parameter required' }, { status: 400 });
    }

    if (feature !== 'advanced_analytics' && feature !== 'csv_export') {
      return NextResponse.json({ error: 'Invalid feature' }, { status: 400 });
    }

    const hasAccess = await hasFeature(user.id, feature);

    return NextResponse.json({ hasFeature: hasAccess });
  } catch (error: unknown) {
    console.error('Feature check error:', error);
    const message = error instanceof Error ? error.message : 'Failed to check feature';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

