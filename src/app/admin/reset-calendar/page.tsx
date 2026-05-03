// Admin Calendar Reset Page
// Visit /admin/reset-calendar to reset all calendar data

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ResetCalendarPage() {
  const { user, loading } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const checkAdminStatus = async () => {
      if (user?.id) {
        try {
          const { supabase } = await import('@/lib/supabase');
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          setIsAdmin(data?.role === 'admin');
        } catch (error) {
          console.error('Failed to check admin status:', error);
        }
      }
    };

    if (!loading && user) {
      checkAdminStatus();
    }
  }, [user, loading]);

  const handleReset = async () => {
    if (!confirm('Are you sure you want to delete ALL calendar entries? This action cannot be undone!')) {
      return;
    }

    setResetting(true);
    setResult(null);

    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setResult('Authentication required');
        return;
      }

      const response = await fetch('/api/content/calendar?reset=all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`✅ Success: ${data.message}`);
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Access Denied</h2>
            <p>Please login to continue.</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Admin Access Required</h2>
            <p>You need admin privileges to access this page.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Reset Calendar Data</h1>
            <p className="text-gray-600">
              This will permanently delete ALL calendar entries for ALL users.
              This action cannot be undone.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">What will be deleted:</h3>
            <ul className="text-red-700 text-sm space-y-1">
              <li>• All scheduled social media posts</li>
              <li>• All calendar events and reminders</li>
              <li>• All AI-generated content schedules</li>
              <li>• All manual calendar entries</li>
            </ul>
          </div>

          {result && (
            <div className={`p-4 rounded-lg mb-6 ${
              result.startsWith('✅')
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <p className="font-medium">{result}</p>
            </div>
          )}

          <div className="flex justify-center">
            <Button
              onClick={handleReset}
              loading={resetting}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
            >
              {resetting ? 'Resetting...' : '🗑️ Reset All Calendar Data'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}