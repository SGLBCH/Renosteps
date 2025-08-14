import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { Task } from './TaskCardsView';

type ViewMode = 'day' | 'week' | 'month';

export function GanttChartView() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await backend.tasks.list();
      setTasks(response.tasks.filter(task => task.startDate && task.endDate));
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const generateDateHeaders = () => {
    const dates = [];
    const startDate = new Date(currentDate);
    
    if (viewMode === 'day') {
      // Show 14 days
      startDate.setDate(startDate.getDate() - 7);
      for (let i = 0; i < 14; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dates.push({
          date: new Date(date),
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          key: date.toISOString().split('T')[0]
        });
      }
    } else if (viewMode === 'week') {
      // Show 8 weeks
      const startOfWeek = new Date(startDate);
      startOfWeek.setDate(startDate.getDate() - startDate.getDay() - 21); // 3 weeks before
      
      for (let i = 0; i < 8; i++) {
        const weekStart = new Date(startOfWeek);
        weekStart.setDate(weekStart.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        dates.push({
          date: new Date(weekStart),
          label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          key: `week-${weekStart.toISOString().split('T')[0]}`
        });
      }
    } else if (viewMode === 'month') {
      // Show 6 months
      startDate.setMonth(startDate.getMonth() - 3);
      startDate.setDate(1);
      
      for (let i = 0; i < 6; i++) {
        const monthDate = new Date(startDate);
        monthDate.setMonth(monthDate.getMonth() + i);
        dates.push({
          date: new Date(monthDate),
          label: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          key: `month-${monthDate.getFullYear()}-${monthDate.getMonth()}`
        });
      }
    }
    
    return dates;
  };

  const dateHeaders = generateDateHeaders();

  const getCurrentDateRange = () => {
    if (dateHeaders.length === 0) return '';
    const first = dateHeaders[0];
    const last = dateHeaders[dateHeaders.length - 1];
    
    if (viewMode === 'day') {
      return `${first.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${last.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (viewMode === 'week') {
      return `${first.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${last.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return `${first.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${last.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 14);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 56); // 8 weeks
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 6);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 14);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 56); // 8 weeks
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 6);
    }
    setCurrentDate(newDate);
  };

  const calculateTaskBarPosition = (task: Task) => {
    if (!task.startDate || !task.endDate) return null;
    
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const totalColumns = dateHeaders.length;
    
    let startColumn = -1;
    let endColumn = -1;
    
    if (viewMode === 'day') {
      // Find which day columns the task spans
      dateHeaders.forEach((header, index) => {
        const headerDate = header.date;
        const nextDay = new Date(headerDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        if (taskStart <= nextDay && taskEnd >= headerDate) {
          if (startColumn === -1) startColumn = index;
          endColumn = index;
        }
      });
    } else if (viewMode === 'week') {
      // Find which week columns the task spans
      dateHeaders.forEach((header, index) => {
        const weekStart = header.date;
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        if (taskStart <= weekEnd && taskEnd >= weekStart) {
          if (startColumn === -1) startColumn = index;
          endColumn = index;
        }
      });
    } else if (viewMode === 'month') {
      // Find which month columns the task spans
      dateHeaders.forEach((header, index) => {
        const monthStart = new Date(header.date.getFullYear(), header.date.getMonth(), 1);
        const monthEnd = new Date(header.date.getFullYear(), header.date.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        if (taskStart <= monthEnd && taskEnd >= monthStart) {
          if (startColumn === -1) startColumn = index;
          endColumn = index;
        }
      });
    }
    
    if (startColumn === -1 || endColumn === -1) return null;
    
    const width = ((endColumn - startColumn + 1) / totalColumns) * 100;
    const left = (startColumn / totalColumns) * 100;
    
    return { left: `${left}%`, width: `${width}%` };
  };

  const getTaskBarColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Gantt Chart</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading tasks...</div>
        </div>
      </div>
    );
  }

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
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevious}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Date Range Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevious} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-4">{getCurrentDateRange()}</span>
            <Button variant="outline" size="icon" onClick={handleNext} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Gantt Grid */}
        <div className="overflow-auto">
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div className={`grid border-b border-border sticky top-0 bg-card z-10`} style={{ gridTemplateColumns: `300px repeat(${dateHeaders.length}, 1fr)` }}>
              <div className="p-3 border-r border-border font-medium">Task</div>
              {dateHeaders.map((header, index) => (
                <div key={header.key} className="p-2 text-center text-sm font-medium border-r border-border last:border-r-0">
                  {header.label}
                </div>
              ))}
            </div>

            {/* Task Rows */}
            <div className="divide-y divide-border">
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No tasks with start and end dates found. Add dates to your tasks to see them in the Gantt chart.
                </div>
              ) : (
                tasks.map((task) => {
                  const barPosition = calculateTaskBarPosition(task);
                  
                  return (
                    <div key={task.id} className={`grid hover:bg-accent/50 transition-colors`} style={{ gridTemplateColumns: `300px repeat(${dateHeaders.length}, 1fr)` }}>
                      {/* Task Info - Sticky Left Column */}
                      <div className="p-3 border-r border-border bg-card sticky left-0 z-10">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground capitalize">{task.category}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {task.progress}% complete
                        </div>
                      </div>
                      
                      {/* Timeline Grid */}
                      <div className="relative" style={{ gridColumn: `2 / ${dateHeaders.length + 2}` }}>
                        <div className={`grid h-16`} style={{ gridTemplateColumns: `repeat(${dateHeaders.length}, 1fr)` }}>
                          {dateHeaders.map((_, index) => (
                            <div key={index} className="border-r border-border last:border-r-0"></div>
                          ))}
                        </div>
                        
                        {/* Task Bar */}
                        {barPosition && (
                          <div
                            className="absolute top-1/2 transform -translate-y-1/2 h-6 rounded-md flex items-center justify-center text-white text-xs font-medium shadow-sm"
                            style={{
                              left: barPosition.left,
                              width: barPosition.width,
                            }}
                          >
                            <div className={`w-full h-full rounded-md ${getTaskBarColor(task.priority)} opacity-80 hover:opacity-100 transition-opacity`}>
                              <div className="w-full h-full bg-white/20 rounded-md flex items-center justify-center">
                                <span className="truncate px-2">{task.title}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-6 text-sm">
            <span className="font-medium">Priority:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
