// Reset Calendar Data Script
// Run this to completely clear all calendar entries

const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

// You'll need to get these values from your Supabase dashboard
// And include a valid JWT token from an admin user

async function resetCalendar() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/content_calendar?reset=all`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        // Add admin JWT token here
        // 'Authorization': `Bearer admin-jwt-token-here`,
      },
    });

    const result = await response.json();
    console.log('Reset result:', result);
  } catch (error) {
    console.error('Reset failed:', error);
  }
}

// Uncomment to run:
// resetCalendar();