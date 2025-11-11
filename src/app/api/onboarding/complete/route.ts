import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mark onboarding as completed
    const { error } = await supabase
      .from('users')
      .update({ onboarding_completed: true })
      .eq('id', user.id);

    if (error) {
      console.error('Failed to mark onboarding as complete:', error);
      return NextResponse.json(
        { error: 'Failed to complete onboarding' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Onboarding completion error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

