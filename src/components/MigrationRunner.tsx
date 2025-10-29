'use client'

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export function MigrationRunner() {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Run Migrations</h2>
      
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Run ONLY these 3 migrations (in order):</p>
              <ol className="text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
                <li><code>20251026095224_c075d242-9641-4e0c-a585-ca8d05e9c619.sql</code> (Main schema)</li>
                <li><code>20251027095224_add_user_roles_table.sql</code> (RBAC)</li>
                <li><code>20251029_add_disease_codes.sql</code> (WHO diseases - optional)</li>
              </ol>
              <p className="mt-3 font-semibold text-red-700 dark:text-red-300">⚠️ DO NOT run:</p>
              <ul className="text-red-600 dark:text-red-400 list-disc list-inside">
                <li><code>20251026095224_initial_schema.sql</code> (conflicts!)</li>
                <li><code>20251026095225_auth_setup.sql</code> (conflicts!)</li>
              </ul>
            </div>
          </div>
        </div>

        <Button 
          asChild
          size="lg"
          className="w-full"
        >
          <a 
            href="https://supabase.com/dashboard/project/ralsdfqtgnmstkvmacdp/sql/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Supabase SQL Editor →
          </a>
        </Button>

        <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900 p-3 rounded border">
          <p className="font-medium mb-2">How to run:</p>
          <ol className="space-y-1 list-decimal list-inside">
            <li>Click button above to open SQL Editor</li>
            <li>Open file: <code>supabase/migrations/20251026095224_c075d242...sql</code></li>
            <li>Copy entire file content</li>
            <li>Paste in SQL Editor and click Run</li>
            <li>Repeat for files #2 and #3</li>
          </ol>
        </div>
      </div>
    </Card>
  );
}
