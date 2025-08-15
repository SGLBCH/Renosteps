import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { DollarSign, Plus, Trash2, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import backend from '~backend/client';

interface BudgetExpense {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  expenses: BudgetExpense[];
  categoryBreakdown: {
    category: string;
    spent: number;
    count: number;
  }[];
}

const categories = ['Kitchen', 'Bathroom', 'Living Room', 'Bedroom', 'Exterior', 'Materials', 'Labor', 'Permits', 'Other'];

function BudgetContent() {
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState(false);
  const [newTotalBudget, setNewTotalBudget] = useState('');
  const [addingExpense, setAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'Kitchen',
    description: '',
    amount: '',
  });
  const { toast } = useToast();

  const loadBudgetSummary = async () => {
    try {
      setLoading(true);
      const response = await backend.budget.getSummary();
      setBudgetSummary(response);
    } catch (error) {
      console.error('Error loading budget summary:', error);
      toast({
        title: "Error",
        description: "Failed to load budget data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetSummary();
  }, []);

  const handleUpdateBudget = async () => {
    if (!newTotalBudget || isNaN(parseFloat(newTotalBudget))) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid budget amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      await backend.budget.updateBudget({
        totalBudget: parseFloat(newTotalBudget),
      });
      
      toast({
        title: "Budget updated",
        description: "Your total budget has been updated successfully.",
      });
      
      setEditingBudget(false);
      setNewTotalBudget('');
      await loadBudgetSummary();
    } catch (error) {
      console.error('Error updating budget:', error);
      toast({
        title: "Error",
        description: "Failed to update budget. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.description.trim() || !newExpense.amount || isNaN(parseFloat(newExpense.amount))) {
      toast({
        title: "Invalid expense",
        description: "Please fill in all fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    try {
      await backend.budget.createExpense({
        category: newExpense.category,
        description: newExpense.description.trim(),
        amount: parseFloat(newExpense.amount),
      });
      
      toast({
        title: "Expense added",
        description: "Your expense has been added successfully.",
      });
      
      setAddingExpense(false);
      setNewExpense({
        category: 'Kitchen',
        description: '',
        amount: '',
      });
      await loadBudgetSummary();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await backend.budget.deleteExpense({ id });
      
      toast({
        title: "Expense deleted",
        description: "The expense has been deleted successfully.",
      });
      
      await loadBudgetSummary();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Budget</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading budget...</div>
        </div>
      </div>
    );
  }

  if (!budgetSummary) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Budget</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-muted-foreground mb-4">Failed to load budget data</div>
            <button 
              onClick={loadBudgetSummary}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const budgetProgress = budgetSummary.totalBudget > 0 
    ? Math.round((budgetSummary.totalSpent / budgetSummary.totalBudget) * 100)
    : 0;

  const isOverBudget = budgetSummary.totalSpent > budgetSummary.totalBudget;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Budget</h2>
      
      {/* Budget Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Budget Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Total Budget</h3>
                <p className="text-2xl font-bold">{formatCurrency(budgetSummary.totalBudget)}</p>
              </div>
              {!editingBudget ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditingBudget(true);
                    setNewTotalBudget(budgetSummary.totalBudget.toString());
                  }}
                >
                  Edit Budget
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={newTotalBudget}
                    onChange={(e) => setNewTotalBudget(e.target.value)}
                    placeholder="Enter total budget"
                    className="w-32"
                  />
                  <Button size="sm" onClick={handleUpdateBudget}>
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setEditingBudget(false);
                      setNewTotalBudget('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Budget Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Budget Used</span>
                <span className={`text-sm font-medium ${isOverBudget ? 'text-destructive' : ''}`}>
                  {budgetProgress}%
                </span>
              </div>
              <Progress 
                value={Math.min(budgetProgress, 100)} 
                className={`h-3 ${isOverBudget ? '[&>div]:bg-destructive' : ''}`} 
              />
              {isOverBudget && (
                <p className="text-sm text-destructive">
                  ⚠️ Over budget by {formatCurrency(budgetSummary.totalSpent - budgetSummary.totalBudget)}
                </p>
              )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-secondary rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="font-semibold">{formatCurrency(budgetSummary.totalBudget)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Spent</div>
                <div className={`font-semibold ${isOverBudget ? 'text-destructive' : 'text-red-600'}`}>
                  {formatCurrency(budgetSummary.totalSpent)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Remaining</div>
                <div className={`font-semibold ${budgetSummary.remaining >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {formatCurrency(budgetSummary.remaining)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {budgetSummary.categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {budgetSummary.categoryBreakdown.map((category) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{category.category}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatCurrency(category.spent)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {category.count} expense{category.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={budgetSummary.totalBudget > 0 ? (category.spent / budgetSummary.totalBudget) * 100 : 0} 
                      className="flex-1 h-2" 
                    />
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {budgetSummary.totalBudget > 0 ? Math.round((category.spent / budgetSummary.totalBudget) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expenses</CardTitle>
            {!addingExpense && (
              <Button onClick={() => setAddingExpense(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Expense Form */}
          {addingExpense && (
            <div className="p-4 border border-border rounded-lg bg-accent/50 space-y-4">
              <h4 className="font-medium">Add New Expense</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-category">Category</Label>
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-description">Description</Label>
                  <Input
                    id="expense-description"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="Enter description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Amount ($)</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setAddingExpense(false);
                    setNewExpense({
                      category: 'Kitchen',
                      description: '',
                      amount: '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddExpense}>
                  Add Expense
                </Button>
              </div>
            </div>
          )}

          {/* Expenses List */}
          <div className="space-y-3">
            {budgetSummary.expenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No expenses recorded yet. Add your first expense to get started!
              </div>
            ) : (
              budgetSummary.expenses.map((expense) => (
                <div 
                  key={expense.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {expense.category}
                      </Badge>
                      <span className="font-medium">{expense.description}</span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(expense.date)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function Budget() {
  return (
    <ErrorBoundary>
      <BudgetContent />
    </ErrorBoundary>
  );
}
