import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskCardsView } from './TaskCardsView';
import { GanttChartView } from './GanttChartView';

export function MainContent() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-3xl font-semibold tracking-tight">Home Renovation Project</h1>
        <p className="text-muted-foreground leading-7 mt-1">1-6-2023 - 30-9-2023</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Tabs defaultValue="task-cards" className="h-full">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="task-cards">Task Cards</TabsTrigger>
            <TabsTrigger value="gantt-chart">Gantt Chart</TabsTrigger>
          </TabsList>
          
          <TabsContent value="task-cards" className="mt-6 h-full">
            <TaskCardsView />
          </TabsContent>
          
          <TabsContent value="gantt-chart" className="mt-6 h-full">
            <GanttChartView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
