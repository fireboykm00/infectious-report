'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('testing');
      console.log('[SupabaseTest] Starting connection test...');
      
      // Test 1: Auth connection
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.error('[SupabaseTest] Auth error:', authError);
        throw new Error(`Auth failed: ${authError.message}`);
      }
      console.log('[SupabaseTest] Auth test passed');

      // Test 2: Database connection with a simple query that doesn't require tables
      const { data, error: dbError } = await supabase
        .from('case_reports')
        .select('id', { count: 'exact', head: true });
      
      if (dbError) {
        console.error('[SupabaseTest] Database error:', dbError);
        // If table doesn't exist, that's expected for new projects
        if (dbError.code === '42P01') {
          setConnectionStatus('error');
          setErrorMessage('Database connected but tables not created. Run migrations in Supabase dashboard.');
          return;
        }
        throw new Error(`Database query failed: ${dbError.message}`);
      }

      console.log('[SupabaseTest] Database test passed');
      setConnectionStatus('success');
      setErrorMessage('');
    } catch (error) {
      console.error('[SupabaseTest] Connection error:', error);
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Supabase Connection Test</h2>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <span>Status:</span>
          {connectionStatus === 'testing' && (
            <span className="text-yellow-500">Testing connection...</span>
          )}
          {connectionStatus === 'success' && (
            <span className="text-green-500">Connected successfully!</span>
          )}
          {connectionStatus === 'error' && (
            <span className="text-red-500">Connection failed</span>
          )}
        </div>

        {errorMessage && (
          <div className="text-red-500 text-sm">
            Error: {errorMessage}
          </div>
        )}

        <Button 
          onClick={testConnection}
          disabled={connectionStatus === 'testing'}
        >
          Test Connection
        </Button>

        <div className="text-sm text-gray-500 mt-4">
          <p>Environment variables:</p>
          <ul className="list-disc list-inside">
            <li>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing'}</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}