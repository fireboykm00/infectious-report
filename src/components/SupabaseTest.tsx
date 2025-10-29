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
      
      // Try to get the current user to test auth connection
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;

      // Try to query the database
      const { error: dbError } = await supabase
        .from('case_reports')
        .select('count')
        .limit(1)
        .single();
      
      if (dbError && dbError.code !== 'PGRST116') { // Ignore "no rows returned" error
        throw dbError;
      }

      setConnectionStatus('success');
      setErrorMessage('');
    } catch (error) {
      console.error('Supabase connection error:', error);
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