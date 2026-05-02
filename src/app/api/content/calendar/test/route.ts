// Test endpoint to verify calendar table exists
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test if table exists by trying to select from it
    const { data, error } = await supabase
      .from('content_calendar')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        table_exists: false,
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      table_exists: true,
      message: 'content_calendar table exists and is accessible'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      table_exists: false
    }, { status: 500 });
  }
}