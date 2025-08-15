import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskCardsView } from './TaskCardsView';
import { GanttChartView } from './GanttChartView';
import { Dashboard } from './Dashboard';
import { Budget } from './Budget';
import { ErrorBoundary } from './ErrorBoundary';
import { ProjectTitleHeader } from './ProjectTitleHeader';

export function MainContent() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border flex-shrink-0">
        <ProjectTitleHeader />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
          <Tabs defaultValue="dashboard" className="h-full flex flex-col">
            <div className="px-6 pt-6 flex-shrink-0">
              <TabsList className="grid w-fit grid-cols-4">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="task-cards">Task Cards</TabsTrigger>
                <TabsTrigger value="gantt-chart">Gantt Chart</TabsTrigger>
                <TabsTrigger value="budget">Budget</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="dashboard" className="flex-1 overflow-hidden px-6 pb-6 mt-6">
              <div className="h-full overflow-y-auto">
                <Dashboard />
              </div>
            </TabsContent>
            
            <TabsContent value="task-cards" className="flex-1 overflow-hidden px-6 pb-6 mt-6">
              <div className="h-full overflow-hidden">
                <TaskCardsView />
              </div>
            </TabsContent>
            
            <TabsContent value="gantt-chart" className="flex-1 overflow-hidden px-6 pb-6 mt-6">
              <div className="h-full overflow-y-auto">
                <GanttChartView />
              </div>
            </TabsContent>
            
            <TabsContent value="budget" className="flex-1 overflow-hidden px-6 pb-6 mt-6">
              <div className="h-full overflow-y-auto">
                <Budget />
              </div>
            </TabsContent>
          </Tabs>
        </ErrorBoundary>
      </div>
    </div>
  );
}
