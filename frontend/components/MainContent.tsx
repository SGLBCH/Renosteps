import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskCardsView } from './TaskCardsView';
import { GanttChartView } from './GanttChartView';
import { Dashboard } from './Dashboard';
import { Budget } from './Budget';
import { Inspiration } from './Inspiration';
import { ErrorBoundary } from './ErrorBoundary';
import { ProjectTitleHeader } from './ProjectTitleHeader';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { useState } from 'react';

export function MainContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border flex-shrink-0">
        <ProjectTitleHeader />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
          <Tabs defaultValue="dashboard" className="h-full flex flex-col">
            <div className="px-4 md:px-6 pt-4 md:pt-6 flex-shrink-0">
              <TabsList className="grid w-full grid-cols-5 md:w-fit md:grid-cols-5">
                <TabsTrigger value="dashboard" className="text-xs md:text-sm">Dashboard</TabsTrigger>
                <TabsTrigger value="task-cards" className="text-xs md:text-sm">Tasks</TabsTrigger>
                <TabsTrigger value="gantt-chart" className="text-xs md:text-sm">Gantt</TabsTrigger>
                <TabsTrigger value="budget" className="text-xs md:text-sm">Budget</TabsTrigger>
                <TabsTrigger value="inspiration" className="text-xs md:text-sm">Ideas</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="dashboard" className="flex-1 overflow-hidden px-4 md:px-6 pb-4 md:pb-6 mt-4 md:mt-6">
              <div className="h-full overflow-y-auto">
                <Dashboard />
              </div>
            </TabsContent>
            
            <TabsContent value="task-cards" className="flex-1 overflow-hidden px-4 md:px-6 pb-4 md:pb-6 mt-4 md:mt-6">
              <div className="h-full overflow-hidden">
                <TaskCardsView />
              </div>
            </TabsContent>
            
            <TabsContent value="gantt-chart" className="flex-1 overflow-hidden px-4 md:px-6 pb-4 md:pb-6 mt-4 md:mt-6">
              <div className="h-full overflow-y-auto">
                <GanttChartView />
              </div>
            </TabsContent>
            
            <TabsContent value="budget" className="flex-1 overflow-hidden px-4 md:px-6 pb-4 md:pb-6 mt-4 md:mt-6">
              <div className="h-full overflow-y-auto">
                <Budget />
              </div>
            </TabsContent>
            
            <TabsContent value="inspiration" className="flex-1 overflow-hidden px-4 md:px-6 pb-4 md:pb-6 mt-4 md:mt-6">
              <div className="h-full overflow-y-auto">
                <Inspiration />
              </div>
            </TabsContent>
          </Tabs>
        </ErrorBoundary>
      </div>

      {/* Mobile Sidebar Menu - Fixed at bottom left */}
      <div className="lg:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="default" 
              size="icon" 
              className="fixed bottom-4 left-4 z-50 h-12 w-12 rounded-xl shadow-lg bg-primary hover:bg-primary/90"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <ErrorBoundary>
              <Sidebar collapsed={false} onToggleCollapse={() => {}} />
            </ErrorBoundary>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
