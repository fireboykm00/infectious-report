'use client'

import { MigrationRunner } from '@/components/MigrationRunner';
import { SupabaseTest } from '@/components/SupabaseTest';

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold mb-2">IDSR Platform Setup</h1>
          <p className="text-muted-foreground">
            Set up your database and test connections
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <SupabaseTest />
          <MigrationRunner />
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-2">Setup Steps:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Test your Supabase connection (left panel)</li>
            <li>If connection works but tables missing, run migrations (right panel)</li>
            <li>If automatic migration fails, copy SQL and run in Supabase Dashboard</li>
            <li>Once complete, go to <a href="/auth" className="text-blue-600 underline">Login Page</a></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
