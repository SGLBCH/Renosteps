import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

type ViewMode = 'day' | 'week' | 'month';

const mockTasks = [
  { id: '1', name: 'Demolition', category: 'Kitchen' },
  { id: '2', name: 'Plumbing Rough-In', category: 'Kitchen' },
  { id: '3', name: 'Electrical Work', category: 'Kitchen' },
  { id: '4', name: 'Drywall Installation', category: 'Kitchen' },
  { id: '5', name: 'Cabinet Installation', category: 'Kitchen' },
  { id: '6', name: 'Countertop Installation', category: 'Kitchen' },
  { id: '7', name: 'Tile Backsplash', category: 'Kitchen' },
  { id: '8', name: 'Appliance Installation', category: 'Kitchen' }
];

export function GanttChartView() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDateRange, setCurrentDateRange] = useState('7 Aug - 21 Aug');

  const generateDateHeaders = () => {
    const dates = [];
    for (let i = 7; i <= 21; i++) {
      dates.push(`${i}/8`);
    }
    return dates;
  };

  const dateHeaders = generateDateHeaders();

  const handlePrevious = () => {
    // Logic to navigate to previous date range
    console.log('Navigate to previous range');
  };

  const handleNext = () => {
    // Logic to navigate to next date range
    console.log('Navigate to next range');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Gantt Chart</h2>
      
      <div className="bg-card border border-border rounded-lg shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* View Mode Select */}
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Date Range Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevious} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-4">{currentDateRange}</span>
            <Button variant="outline" size="icon" onClick={handleNext} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Gantt Grid */}
        <div className="overflow-auto">
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div className="grid grid-cols-[300px_1fr] border-b border-border sticky top-0 bg-card z-10">
              <div className="p-3 border-r border-border font-medium">Task</div>
              <div className="grid grid-cols-15 gap-0">
                {dateHeaders.map((date, index) => (
                  <div key={index} className="p-2 text-center text-sm font-medium border-r border-border last:border-r-0">
                    {date}
                  </div>
                ))}
              </div>
            </div>

            {/* Task Rows */}
            <div className="divide-y divide-border">
              {mockTasks.map((task) => (
                <div key={task.id} className="grid grid-cols-[300px_1fr] hover:bg-accent/50 transition-colors">
                  {/* Task Info - Sticky Left Column */}
                  <div className="p-3 border-r border-border bg-card sticky left-0 z-10">
                    <div className="font-medium">{task.name}</div>
                    <div className="text-sm text-muted-foreground">{task.category}</div>
                  </div>
                  
                  {/* Timeline Grid */}
                  <div className="grid grid-cols-15 gap-0">
                    {dateHeaders.map((_, index) => (
                      <div key={index} className="h-16 border-r border-border last:border-r-0 relative">
                        {/* Task bars will be implemented in future iterations */}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
