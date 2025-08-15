import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskCardsView } from './TaskCardsView';
import { GanttChartView } from './GanttChartView';
import { Dashboard } from './Dashboard';
import { Budget } from './Budget';
import { ErrorBoundary } from './ErrorBoundary';
import { ProjectTitleHeader } from './ProjectTitleHeader';

export function MainContent() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border flex-shrink-0">
        <ProjectTitleHeader />
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-hidden">
        <ErrorBoundary>
          <Tabs defaultValue="dashboard" className="h-full flex flex-col">
            <TabsList className="grid w-fit grid-cols-4 flex-shrink-0">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="task-cards">Task Cards</TabsTrigger>
              <TabsTrigger value="gantt-chart">Gantt Chart</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="mt-6 flex-1 overflow-hidden">
              <Dashboard />
            </TabsContent>
            
            <TabsContent value="task-cards" className="mt-6 flex-1 overflow-hidden">
              <TaskCardsView />
            </TabsContent>
            
            <TabsContent value="gantt-chart" className="mt-6 flex-1 overflow-hidden">
              <GanttChartView />
            </TabsContent>
            
            <TabsContent value="budget" className="mt-6 flex-1 overflow-hidden">
              <Budget />
            </TabsContent>
          </Tabs>
        </ErrorBoundary>
      </div>
    </div>
  );
}
