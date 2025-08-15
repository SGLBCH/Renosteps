import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBudget } from '../hooks/useBudget';

export function BudgetCard() {
  const { budgetSummary, loading, error } = useBudget();

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !budgetSummary) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error || 'No budget data available'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalBudget = budgetSummary.totalBudget || 0;
  const totalExpenses = budgetSummary.totalExpenses || 0;
  const remaining = totalBudget - totalExpenses;
  const percentageUsed = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Budget Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Budget</span>
            <span className="font-medium">${totalBudget.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spent</span>
            <span className="font-medium">${totalExpenses.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className={`font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(remaining).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{percentageUsed.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                percentageUsed > 100 ? 'bg-red-500' : percentageUsed > 80 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            />
          </div>
        </div>

        {remaining < 0 && (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <TrendingDown className="h-3 w-3" />
            Over budget by ${Math.abs(remaining).toLocaleString()}
          </div>
        )}

        {remaining >= 0 && percentageUsed < 80 && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="h-3 w-3" />
            On track
          </div>
        )}
      </CardContent>
    </Card>
  );
}
