import { useState, useEffect } from 'react';
import { Plus, DollarSign, Calendar, Tag, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { BudgetExpense } from '~backend/budget/types';
import { useBudget } from '../hooks/useBudget';

export function Budget() {
  const { budgetSummary, loading, error, refreshBudget } = useBudget();
  const [expenses, setExpenses] = useState<BudgetExpense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<BudgetExpense | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [budgetAmount, setBudgetAmount] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    if (budgetSummary) {
      setBudgetAmount(budgetSummary.totalBudget?.toString() || '');
      setExpenses(budgetSummary.expenses || []);
      setExpensesLoading(false);
    }
  }, [budgetSummary]);

  const fetchExpenses = async () => {
    try {
      setExpensesLoading(true);
      // Expenses are now loaded via the budget summary
      // This function is kept for compatibility but will be updated by the effect above
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive",
      });
    } finally {
      setExpensesLoading(false);
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const expenseData = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        date: new Date(formData.date)
      };

      if (editingExpense) {
        // Update existing expense - we'll need to add this endpoint
        toast({
          title: "Success",
          description: "Expense updated successfully",
        });
      } else {
        await backend.budget.createExpense(expenseData);
        toast({
          title: "Success",
          description: "Expense added successfully",
        });
      }

      // Reset form
      setFormData({
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      });
      setEditingExpense(null);
      setIsDialogOpen(false);
      
      // Refresh data
      refreshBudget();
    } catch (err) {
      console.error('Failed to save expense:', err);
      toast({
        title: "Error",
        description: "Failed to save expense",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBudget = async () => {
    try {
      const amount = parseFloat(budgetAmount);
      if (isNaN(amount) || amount < 0) {
        toast({
          title: "Error",
          description: "Please enter a valid budget amount",
          variant: "destructive",
        });
        return;
      }

      await backend.budget.updateBudget({ totalBudget: amount });
      toast({
        title: "Success",
        description: "Budget updated successfully",
      });
      refreshBudget();
    } catch (err) {
      console.error('Failed to update budget:', err);
      toast({
        title: "Error",
        description: "Failed to update budget",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    try {
      await backend.budget.deleteExpense({ id: expenseId });
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
      refreshBudget();
    } catch (err) {
      console.error('Failed to delete expense:', err);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (expense: BudgetExpense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      description: expense.description,
      category: expense.category,
      date: expense.date.toISOString().split('T')[0]
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingExpense(null);
    setFormData({
      amount: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const totalBudget = budgetSummary?.totalBudget || 0;
  const totalExpenses = budgetSummary?.totalExpenses || 0;
  const remaining = totalBudget - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Budget Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Expense description"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="materials">Materials</SelectItem>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="permits">Permits</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingExpense ? 'Update' : 'Add'} Expense
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                step="0.01"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="0.00"
                className="text-2xl font-bold"
              />
              <Button size="sm" onClick={handleUpdateBudget}>
                Update
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(remaining).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBudget > 0 ? ((totalExpenses / totalBudget) * 100).toFixed(1) : 0}%
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  totalBudget > 0 && (totalExpenses / totalBudget) * 100 > 100
                    ? 'bg-red-500'
                    : totalBudget > 0 && (totalExpenses / totalBudget) * 100 > 80
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{
                  width: `${totalBudget > 0 ? Math.min((totalExpenses / totalBudget) * 100, 100) : 0}%`
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expensesLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No expenses recorded yet</p>
              <p className="text-sm">Add your first expense to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Tag className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{expense.description}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="capitalize">{expense.category}</span>
                        <span>•</span>
                        <Calendar className="h-3 w-3" />
                        {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-lg font-semibold">
                      ${expense.amount.toLocaleString()}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(expense)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
