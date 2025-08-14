import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectOverview } from './ProjectOverview';
import { BudgetCard } from './BudgetCard';
import { ContractorsList } from './ContractorsList';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <div 
      className={`
        h-full bg-card border-r border-border transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-80'}
      `}
    >
      <div className="p-4 space-y-6">
        {/* Collapse Button */}
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

        {!collapsed && (
          <div className="space-y-6 animate-fade-in">
            <ProjectOverview />
            <BudgetCard />
            <ContractorsList />
          </div>
        )}
      </div>
    </div>
  );
}
