import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { Task } from './TaskCardsView';

interface BudgetData {
  total: number;
  spent: number;
  remaining: number;
  categories: {
    category: string;
    allocated: number;
    spent: number;
  }[];
}

interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  overdueTasks: number;
  upcomingTasks: number;
}

function DashboardContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Mock budget data - in a real app this would come from an API
  const budgetData: BudgetData = {
    total: 50000,
    spent: 17500,
    remaining: 32500,
    categories: [
      { category: 'Kitchen', allocated: 20000, spent: 8500 },
      { category: 'Bathroom', allocated: 15000, spent: 6000 },
      { category: 'Living Room', allocated: 10000, spent: 2500 },
      { category: 'Bedroom', allocated: 3000, spent: 500 },
      { category: 'Exterior', allocated: 2000, spent: 0 },
    ],
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await backend.tasks.list();
      setTasks(response.tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks');
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateProjectStats = (): ProjectStats => {
    const now = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    const notStartedTasks = tasks.filter(task => task.status === 'not-started').length;
    
    const overdueTasks = tasks.filter(task => {
      if (!task.endDate || task.status === 'completed') return false;
      return new Date(task.endDate) < now;
    }).length;

    const upcomingTasks = tasks.filter(task => {
      if (!task.startDate || task.status === 'completed') return false;
      const startDate = new Date(task.startDate);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return startDate >= now && startDate <= weekFromNow;
    }).length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      notStartedTasks,
      overdueTasks,
      upcomingTasks,
    };
  };

  const projectStats = calculateProjectStats();
  const projectProgress = projectStats.totalTasks > 0 
    ? Math.round((projectStats.completedTasks / projectStats.totalTasks) * 100)
    : 0;

  const budgetProgress = budgetData.total > 0 
    ? Math.round((budgetData.spent / budgetData.total) * 100)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
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
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Project Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectProgress}%</div>
            <p className="text-xs text-muted-foreground">
              {projectStats.completedTasks} of {projectStats.totalTasks} tasks completed
            </p>
            <Progress value={projectProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        {/* Budget Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetProgress}%</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(budgetData.spent)} of {formatCurrency(budgetData.total)}
            </p>
            <Progress value={budgetProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        {/* Active Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              {projectStats.notStartedTasks} not started
            </p>
            <div className="flex gap-1 mt-2">
              <div className="flex-1 bg-blue-100 h-2 rounded">
                <div 
                  className="bg-blue-500 h-2 rounded" 
                  style={{ 
                    width: projectStats.totalTasks > 0 
                      ? `${(projectStats.inProgressTasks / projectStats.totalTasks) * 100}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming & Overdue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Overdue</span>
                <Badge variant={projectStats.overdueTasks > 0 ? "destructive" : "secondary"}>
                  {projectStats.overdueTasks}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Due this week</span>
                <Badge variant={projectStats.upcomingTasks > 0 ? "default" : "secondary"}>
                  {projectStats.upcomingTasks}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-secondary rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="font-semibold">{formatCurrency(budgetData.total)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Spent</div>
                <div className="font-semibold text-red-600">{formatCurrency(budgetData.spent)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Remaining</div>
                <div className="font-semibold text-green-600">{formatCurrency(budgetData.remaining)}</div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-3">
              <h4 className="font-medium">By Category</h4>
              {budgetData.categories.map((category) => {
                const categoryProgress = category.allocated > 0 
                  ? (category.spent / category.allocated) * 100 
                  : 0;
                const remaining = category.allocated - category.spent;
                
                return (
                  <div key={category.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{category.category}</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatCurrency(category.spent)} / {formatCurrency(category.allocated)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(remaining)} remaining
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={categoryProgress} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {Math.round(categoryProgress)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Task Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Task Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Distribution */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <Badge variant="default" className="bg-green-500">
                    {projectStats.completedTasks}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">In Progress</span>
                  <Badge variant="default" className="bg-blue-500">
                    {projectStats.inProgressTasks}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Not Started</span>
                  <Badge variant="secondary">
                    {projectStats.notStartedTasks}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Overdue</span>
                  <Badge variant={projectStats.overdueTasks > 0 ? "destructive" : "secondary"}>
                    {projectStats.overdueTasks}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Progress Visualization */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{projectProgress}%</span>
              </div>
              <div className="flex h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 transition-all duration-300"
                  style={{ 
                    width: projectStats.totalTasks > 0 
                      ? `${(projectStats.completedTasks / projectStats.totalTasks) * 100}%` 
                      : '0%' 
                  }}
                ></div>
                <div 
                  className="bg-blue-500 transition-all duration-300"
                  style={{ 
                    width: projectStats.totalTasks > 0 
                      ? `${(projectStats.inProgressTasks / projectStats.totalTasks) * 100}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Completed: {projectStats.completedTasks}</span>
                <span>In Progress: {projectStats.inProgressTasks}</span>
                <span>Not Started: {projectStats.notStartedTasks}</span>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-2">
              <h4 className="font-medium">Recent Activity</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {tasks
                  .filter(task => task.status === 'completed')
                  .slice(0, 3)
                  .map((task) => (
                    <div key={task.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span className="truncate">{task.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {task.category}
                      </Badge>
                    </div>
                  ))}
                {projectStats.completedTasks === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No completed tasks yet
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">View Schedule</div>
                  <div className="text-sm text-muted-foreground">Gantt chart</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Add Task</div>
                  <div className="text-sm text-muted-foreground">Create new</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">Budget Details</div>
                  <div className="text-sm text-muted-foreground">View expenses</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium">Reports</div>
                  <div className="text-sm text-muted-foreground">View analytics</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function Dashboard() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}
