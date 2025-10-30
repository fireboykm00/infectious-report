import { AlertCircle } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  error: Error | string;
  retry?: () => void;
  className?: string;
}

export function ErrorState({ error, retry, className }: ErrorStateProps) {
  const errorMessage = typeof error === 'string' ? error : error.message || 'An unexpected error occurred';

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">{errorMessage}</p>
      {retry && (
        <Button onClick={retry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
}
