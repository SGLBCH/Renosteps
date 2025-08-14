import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskCardErrorBoundaryProps {
  children: React.ReactNode;
  taskTitle?: string;
  onRetry?: () => void;
}

export function TaskCardErrorBoundary({ children, taskTitle, onRetry }: TaskCardErrorBoundaryProps) {
  const fallback = (
    <div className="bg-card border border-destructive/20 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-3 text-destructive mb-4">
        <AlertTriangle className="w-5 h-5" />
        <h3 className="font-semibold">Task Error</h3>
      </div>
      <p className="text-muted-foreground text-sm mb-4">
        {taskTitle ? `Failed to load task "${taskTitle}"` : 'Failed to load this task'}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}
