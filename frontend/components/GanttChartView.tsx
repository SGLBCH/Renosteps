import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Menu, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ErrorBoundary } from './ErrorBoundary';
import { useProject } from '../contexts/ProjectContext';
import { useProjectTasks } from '../hooks/useProjectTasks';
import backend from '~backend/client';
import type { Task } from './TaskCardsView';

type ViewMode = 'day' | 'week' | 'month';

interface DragState {
  isDragging: boolean;
  taskId: string | null;
  startX: number;
  startColumn: number;
  currentColumn: number;
  originalStartDate: Date | null;
  originalEndDate: Date | null;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isScrolling: boolean;
  scrollStartX: number;
}

function GanttChartContent() {
  const { currentProject } = useProject();
  const { tasks, loading, error, loadTasks } = useProjectTasks();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    taskId: null,
    startX: 0,
    startColumn: 0,
    currentColumn: 0,
    originalStartDate: null,
    originalEndDate: null,
  });
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isScrolling: false,
    scrollStartX: 0,
  });
  const { toast } = useToast();
  const ganttRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Filter tasks that have both start and end dates
  const tasksWithDates = tasks.filter(task => task.startDate && task.endDate);

  const generateDateHeaders = () => {
    const dates = [];
    const startDate = new Date(currentDate);
    
    if (viewMode === 'day') {
      // Show 7 days on mobile, 14 on desktop
      const daysToShow = window.innerWidth < 768 ? 7 : 14;
      startDate.setDate(startDate.getDate() - Math.floor(daysToShow / 2));
      for (let i = 0; i < daysToShow; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dates.push({
          date: new Date(date),
          label: window.innerWidth < 768 
            ? date.toLocaleDateString('en-US', { day: 'numeric' })
            : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          key: date.toISOString().split('T')[0]
        });
      }
    } else if (viewMode === 'week') {
      // Show 4 weeks on mobile, 8 on desktop
      const weeksToShow = window.innerWidth < 768 ? 4 : 8;
      const startOfWeek = new Date(startDate);
      startOfWeek.setDate(startDate.getDate() - startDate.getDay() - (weeksToShow * 7 / 2));
      
      for (let i = 0; i < weeksToShow; i++) {
        const weekStart = new Date(startOfWeek);
        weekStart.setDate(weekStart.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        dates.push({
          date: new Date(weekStart),
          label: window.innerWidth < 768
            ? `W${Math.ceil((weekStart.getDate()) / 7)}`
            : `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          key: `week-${weekStart.toISOString().split('T')[0]}`
        });
      }
    } else if (viewMode === 'month') {
      // Show 3 months on mobile, 6 on desktop
      const monthsToShow = window.innerWidth < 768 ? 3 : 6;
      startDate.setMonth(startDate.getMonth() - Math.floor(monthsToShow / 2));
      startDate.setDate(1);
      
      for (let i = 0; i < monthsToShow; i++) {
        const monthDate = new Date(startDate);
        monthDate.setMonth(monthDate.getMonth() + i);
        dates.push({
          date: new Date(monthDate),
          label: window.innerWidth < 768
            ? monthDate.toLocaleDateString('en-US', { month: 'short' })
            : monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
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
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleZoomIn = () => {
    if (viewMode === 'month') {
      setViewMode('week');
    } else if (viewMode === 'week') {
      setViewMode('day');
    }
  };

  const handleZoomOut = () => {
    if (viewMode === 'day') {
      setViewMode('week');
    } else if (viewMode === 'week') {
      setViewMode('month');
    }
  };

  const calculateTaskBarPosition = (task: Task) => {
    if (!task.startDate || !task.endDate) return null;
    
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const totalColumns = dateHeaders.length;
    
    let startPosition = -1;
    let endPosition = -1;
    
    if (viewMode === 'day') {
      const firstHeaderDate = dateHeaders[0].date;
      const lastHeaderDate = new Date(dateHeaders[dateHeaders.length - 1].date);
      lastHeaderDate.setDate(lastHeaderDate.getDate() + 1);
      
      const daysSinceStart = (taskStart.getTime() - firstHeaderDate.getTime()) / (1000 * 60 * 60 * 24);
      startPosition = Math.max(0, daysSinceStart);
      
      const daysSinceStartForEnd = (taskEnd.getTime() - firstHeaderDate.getTime()) / (1000 * 60 * 60 * 24);
      endPosition = Math.min(totalColumns, daysSinceStartForEnd);
      
    } else if (viewMode === 'week') {
      const firstWeekStart = dateHeaders[0].date;
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      
      const weeksSinceStart = (taskStart.getTime() - firstWeekStart.getTime()) / msPerWeek;
      startPosition = Math.max(0, weeksSinceStart);
      
      const weeksSinceStartForEnd = (taskEnd.getTime() - firstWeekStart.getTime()) / msPerWeek;
      endPosition = Math.min(totalColumns, weeksSinceStartForEnd);
      
    } else if (viewMode === 'month') {
      const firstMonthStart = new Date(dateHeaders[0].date.getFullYear(), dateHeaders[0].date.getMonth(), 1);
      
      const startYear = taskStart.getFullYear();
      const startMonth = taskStart.getMonth();
      const startDay = taskStart.getDate();
      const firstYear = firstMonthStart.getFullYear();
      const firstMonth = firstMonthStart.getMonth();
      
      const monthsSinceStart = (startYear - firstYear) * 12 + (startMonth - firstMonth);
      const daysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate();
      const dayProgress = (startDay - 1) / daysInStartMonth;
      startPosition = Math.max(0, monthsSinceStart + dayProgress);
      
      const endYear = taskEnd.getFullYear();
      const endMonth = taskEnd.getMonth();
      const endDay = taskEnd.getDate();
      
      const monthsSinceStartForEnd = (endYear - firstYear) * 12 + (endMonth - firstMonth);
      const daysInEndMonth = new Date(endYear, endMonth + 1, 0).getDate();
      const dayProgressEnd = endDay / daysInEndMonth;
      endPosition = Math.min(totalColumns, monthsSinceStartForEnd + dayProgressEnd);
    }
    
    if (startPosition < 0 || endPosition < 0 || startPosition >= endPosition) return null;
    
    const width = ((endPosition - startPosition) / totalColumns) * 100;
    const left = (startPosition / totalColumns) * 100;
    
    const minWidth = window.innerWidth < 768 ? 5 : 2; // Larger minimum width on mobile
    const adjustedWidth = Math.max(width, minWidth);
    
    return { 
      left: `${Math.max(0, Math.min(left, 100 - adjustedWidth))}%`, 
      width: `${adjustedWidth}%`, 
      startColumn: Math.floor(startPosition), 
      endColumn: Math.ceil(endPosition) 
    };
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

  const getColumnFromX = (x: number) => {
    if (!ganttRef.current) return 0;
    
    const ganttRect = ganttRef.current.getBoundingClientRect();
    const timelineStart = window.innerWidth < 768 ? 200 : 300; // Smaller task info column on mobile
    const timelineWidth = ganttRect.width - timelineStart;
    const columnWidth = timelineWidth / dateHeaders.length;
    
    const relativeX = x - ganttRect.left - timelineStart;
    const column = Math.floor(relativeX / columnWidth);
    
    return Math.max(0, Math.min(column, dateHeaders.length - 1));
  };

  const calculateNewDates = (task: Task, newStartColumn: number) => {
    if (!task.startDate || !task.endDate) return null;
    
    const originalStart = new Date(task.startDate);
    const originalEnd = new Date(task.endDate);
    const taskDuration = originalEnd.getTime() - originalStart.getTime();
    
    const newStartDate = new Date(dateHeaders[newStartColumn].date);
    const newEndDate = new Date(newStartDate.getTime() + taskDuration);
    
    return { startDate: newStartDate, endDate: newEndDate };
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent, task?: Task) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: now,
      isScrolling: false,
      scrollStartX: timelineRef.current?.scrollLeft || 0,
    });

    if (task) {
      const position = calculateTaskBarPosition(task);
      if (!position || !task.startDate || !task.endDate) return;
      
      const column = getColumnFromX(touch.clientX);
      
      setDragState({
        isDragging: true,
        taskId: task.id,
        startX: touch.clientX,
        startColumn: column,
        currentColumn: column,
        originalStartDate: new Date(task.startDate),
        originalEndDate: new Date(task.endDate),
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;
    
    // Determine if this is a scroll gesture
    if (!touchState.isScrolling && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setTouchState(prev => ({ ...prev, isScrolling: true }));
    }

    if (dragState.isDragging && !touchState.isScrolling) {
      e.preventDefault();
      const column = getColumnFromX(touch.clientX);
      setDragState(prev => ({ ...prev, currentColumn: column }));
    } else if (touchState.isScrolling && timelineRef.current) {
      // Handle horizontal scrolling
      const newScrollLeft = touchState.scrollStartX - deltaX;
      timelineRef.current.scrollLeft = Math.max(0, newScrollLeft);
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchState.startX;
    const deltaTime = Date.now() - touchState.startTime;
    
    // Handle swipe gestures for navigation
    if (!dragState.isDragging && Math.abs(deltaX) > 50 && deltaTime < 300) {
      if (deltaX > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    }

    // Handle task drag completion
    if (dragState.isDragging && !touchState.isScrolling) {
      const task = tasksWithDates.find(t => t.id === dragState.taskId);
      if (task) {
        const columnDiff = dragState.currentColumn - dragState.startColumn;
        if (columnDiff !== 0) {
          const newDates = calculateNewDates(task, dragState.currentColumn);
          if (newDates) {
            try {
              await backend.tasks.update({
                id: task.id,
                startDate: newDates.startDate,
                endDate: newDates.endDate,
              });
              
              toast({
                title: "Task rescheduled",
                description: `${task.title} has been moved to ${newDates.startDate.toLocaleDateString()}.`,
              });
              
              await loadTasks();
            } catch (error) {
              console.error('Error updating task:', error);
              toast({
                title: "Error",
                description: "Failed to reschedule the task. Please try again.",
                variant: "destructive",
              });
            }
          }
        }
      }
    }
    
    setDragState({
      isDragging: false,
      taskId: null,
      startX: 0,
      startColumn: 0,
      currentColumn: 0,
      originalStartDate: null,
      originalEndDate: null,
    });
    
    setTouchState({
      startX: 0,
      startY: 0,
      startTime: 0,
      isScrolling: false,
      scrollStartX: 0,
    });
  };

  // Mouse event handlers (for desktop)
  const handleMouseDown = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    
    const position = calculateTaskBarPosition(task);
    if (!position || !task.startDate || !task.endDate) return;
    
    const column = getColumnFromX(e.clientX);
    
    setDragState({
      isDragging: true,
      taskId: task.id,
      startX: e.clientX,
      startColumn: column,
      currentColumn: column,
      originalStartDate: new Date(task.startDate),
      originalEndDate: new Date(task.endDate),
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging) return;
    
    const column = getColumnFromX(e.clientX);
    setDragState(prev => ({ ...prev, currentColumn: column }));
  };

  const handleMouseUp = async () => {
    if (!dragState.isDragging || !dragState.taskId) return;
    
    const task = tasksWithDates.find(t => t.id === dragState.taskId);
    if (!task) return;
    
    const columnDiff = dragState.currentColumn - dragState.startColumn;
    if (columnDiff === 0) {
      setDragState({
        isDragging: false,
        taskId: null,
        startX: 0,
        startColumn: 0,
        currentColumn: 0,
        originalStartDate: null,
        originalEndDate: null,
      });
      return;
    }
    
    const newDates = calculateNewDates(task, dragState.currentColumn);
    if (!newDates) return;
    
    try {
      await backend.tasks.update({
        id: task.id,
        startDate: newDates.startDate,
        endDate: newDates.endDate,
      });
      
      toast({
        title: "Task rescheduled",
        description: `${task.title} has been moved to ${newDates.startDate.toLocaleDateString()}.`,
      });
      
      await loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to reschedule the task. Please try again.",
        variant: "destructive",
      });
    }
    
    setDragState({
      isDragging: false,
      taskId: null,
      startX: 0,
      startColumn: 0,
      currentColumn: 0,
      originalStartDate: null,
      originalEndDate: null,
    });
  };

  const getDragPreviewPosition = (task: Task) => {
    if (!dragState.isDragging || dragState.taskId !== task.id) return null;
    
    const columnDiff = dragState.currentColumn - dragState.startColumn;
    if (columnDiff === 0) return null;
    
    const totalColumns = dateHeaders.length;
    const originalPosition = calculateTaskBarPosition(task);
    if (!originalPosition) return null;
    
    const columnWidth = 100 / totalColumns;
    const newLeft = parseFloat(originalPosition.left.replace('%', '')) + (columnDiff * columnWidth);
    
    return {
      left: `${Math.max(0, Math.min(newLeft, 100 - parseFloat(originalPosition.width.replace('%', ''))))}%`,
      width: originalPosition.width,
    };
  };

  // Update date headers when window resizes
  useEffect(() => {
    const handleResize = () => {
      // Force re-render of date headers with new responsive values
      setCurrentDate(new Date(currentDate));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentDate]);

  if (!currentProject) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Gantt Chart</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">No project selected</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Gantt Chart</h2>
          <p className="text-sm text-muted-foreground">{currentProject.name}</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading tasks...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Gantt Chart</h2>
          <p className="text-sm text-muted-foreground">{currentProject.name}</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-muted-foreground mb-4">{error}</div>
            <button 
              onClick={loadTasks}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Gantt Chart</h2>
        <p className="text-sm text-muted-foreground">{currentProject.name}</p>
      </div>
      
      <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col h-[calc(100vh-200px)]">
        {/* Mobile Toolbar */}
        <div className="md:hidden p-4 border-b border-border flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-8 w-8"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevious} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden p-4 border-b border-border bg-muted/50 space-y-4">
            <div className="flex items-center gap-2">
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

              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={handleZoomOut}
                  disabled={viewMode === 'month'}
                  title="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={handleZoomIn}
                  disabled={viewMode === 'day'}
                  title="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-sm font-medium text-center">{getCurrentDateRange()}</div>
          </div>
        )}

        {/* Desktop Toolbar */}
        <div className="hidden md:flex p-4 border-b border-border flex-wrap items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <ErrorBoundary>
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
            </ErrorBoundary>

            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={handleZoomOut}
                disabled={viewMode === 'month'}
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={handleZoomIn}
                disabled={viewMode === 'day'}
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

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

        {/* Gantt Grid - Scrollable */}
        <div 
          className="flex-1 overflow-auto touch-pan-x"
          ref={ganttRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="min-w-[600px] md:min-w-[800px] h-full" ref={timelineRef}>
            {/* Header Row */}
            <div 
              className={`grid border-b border-border sticky top-0 bg-card z-10`} 
              style={{ 
                gridTemplateColumns: window.innerWidth < 768 
                  ? `200px repeat(${dateHeaders.length}, 1fr)` 
                  : `300px repeat(${dateHeaders.length}, 1fr)` 
              }}
            >
              <div className="p-2 md:p-3 border-r border-border font-medium text-sm md:text-base">Task</div>
              {dateHeaders.map((header, index) => (
                <div key={header.key} className="p-1 md:p-2 text-center text-xs md:text-sm font-medium border-r border-border last:border-r-0">
                  {header.label}
                </div>
              ))}
            </div>

            {/* Task Rows */}
            <div className="divide-y divide-border">
              {tasksWithDates.length === 0 ? (
                <div className="p-4 md:p-8 text-center text-muted-foreground text-sm md:text-base">
                  No tasks with start and end dates found for {currentProject.name}. Add dates to your tasks to see them in the Gantt chart.
                </div>
              ) : (
                tasksWithDates.map((task) => {
                  const barPosition = calculateTaskBarPosition(task);
                  const dragPreviewPosition = getDragPreviewPosition(task);
                  const isDraggingThis = dragState.isDragging && dragState.taskId === task.id;
                  
                  return (
                    <ErrorBoundary key={task.id}>
                      <div 
                        className={`grid hover:bg-accent/50 transition-colors ${isDraggingThis ? 'bg-accent/30' : ''}`} 
                        style={{ 
                          gridTemplateColumns: window.innerWidth < 768 
                            ? `200px repeat(${dateHeaders.length}, 1fr)` 
                            : `300px repeat(${dateHeaders.length}, 1fr)` 
                        }}
                      >
                        {/* Task Info - Sticky Left Column */}
                        <div className="p-2 md:p-3 border-r border-border bg-card sticky left-0 z-10">
                          <div className="font-medium text-sm md:text-base truncate">{task.title}</div>
                          <div className="text-xs md:text-sm text-muted-foreground capitalize truncate">{task.category}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {task.progress}% complete
                          </div>
                        </div>
                        
                        {/* Timeline Grid */}
                        <div className="relative overflow-visible" style={{ gridColumn: `2 / ${dateHeaders.length + 2}` }}>
                          <div className={`grid h-12 md:h-16`} style={{ gridTemplateColumns: `repeat(${dateHeaders.length}, 1fr)` }}>
                            {dateHeaders.map((_, index) => (
                              <div key={index} className="border-r border-border last:border-r-0"></div>
                            ))}
                          </div>
                          
                          {/* Original Task Bar */}
                          {barPosition && (
                            <div
                              className={`absolute top-1/2 transform -translate-y-1/2 h-4 md:h-6 rounded-md flex items-center justify-center text-white text-xs font-medium shadow-sm cursor-move select-none ${isDraggingThis ? 'opacity-50' : 'opacity-80 hover:opacity-100'} transition-opacity z-10 touch-manipulation`}
                              style={{
                                left: barPosition.left,
                                width: barPosition.width,
                              }}
                              onMouseDown={(e) => handleMouseDown(e, task)}
                              onTouchStart={(e) => handleTouchStart(e, task)}
                            >
                              <div className={`w-full h-full rounded-md ${getTaskBarColor(task.priority)}`}>
                                <div className="w-full h-full bg-white/20 rounded-md flex items-center justify-center">
                                  <span className="truncate px-1 md:px-2 text-xs">{task.title}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Drag Preview */}
                          {dragPreviewPosition && isDraggingThis && (
                            <div
                              className="absolute top-1/2 transform -translate-y-1/2 h-4 md:h-6 rounded-md flex items-center justify-center text-white text-xs font-medium shadow-lg border-2 border-primary z-20 pointer-events-none"
                              style={{
                                left: dragPreviewPosition.left,
                                width: dragPreviewPosition.width,
                              }}
                            >
                              <div className={`w-full h-full rounded-md ${getTaskBarColor(task.priority)} opacity-90`}>
                                <div className="w-full h-full bg-white/30 rounded-md flex items-center justify-center">
                                  <span className="truncate px-1 md:px-2 text-xs">{task.title}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </ErrorBoundary>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="p-3 md:p-4 border-t border-border flex-shrink-0">
          <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm">
            <span className="font-medium">Priority:</span>
            <div className="flex items-center gap-1 md:gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-red-500 rounded"></div>
              <span>High</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-yellow-500 rounded"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded"></div>
              <span>Low</span>
            </div>
            <div className="ml-0 md:ml-6 text-muted-foreground text-xs">
              💡 Drag task bars to reschedule
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GanttChartView() {
  return (
    <ErrorBoundary>
      <GanttChartContent />
    </ErrorBoundary>
  );
}
