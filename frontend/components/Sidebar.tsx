import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectOverview } from './ProjectOverview';
import { BudgetCard } from './BudgetCard';
import { ContractorsList } from './ContractorsList';
import { ErrorBoundary } from './ErrorBoundary';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <div 
      className={`
        h-full bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col
        ${collapsed ? 'w-16' : 'w-80'}
      `}
    >
      {/* Header with collapse button */}
      <div className="p-4 flex-shrink-0">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 transition-transform" />
            ) : (
              <ChevronLeft className="h-4 w-4 transition-transform" />
            )}
          </Button>
        </div>
      </div>

      {/* Scrollable content */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-4 pb-4 space-y-6 animate-fade-in">
            <ErrorBoundary>
              <ProjectOverview />
            </ErrorBoundary>
            <ErrorBoundary>
              <BudgetCard />
            </ErrorBoundary>
            <ErrorBoundary>
              <ContractorsList />
            </ErrorBoundary>
          </div>
        </div>
      )}
    </div>
  );
}
