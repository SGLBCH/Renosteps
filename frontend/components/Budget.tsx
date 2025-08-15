import { useState, useEffect } from 'react';
import { Plus, DollarSign, Calendar, Tag, Trash2, Edit, AlertCircle, Menu, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/use-toast';
import { useProject } from '../contexts/ProjectContext';
import { useProjectBudget } from '../hooks/useProjectBudget';
import backend from '~backend/client';
import type { BudgetExpense } from '~backend/budget/types';

export function Budget() {
  const { currentProject } = useProject();
  const { budgetSummary, loading, error, refreshBudget } = useProjectBudget();
  const [expenses, setExpenses] = useState<BudgetExpense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<BudgetExpense | null>(null);
  const [operationLoading, setOperationLoading] = useState<{
    create: boolean;
    update: boolean;
    delete: string | null;
    budgetUpdate: boolean;
  }>({
    create: false,
    update: false,
    delete: null,
    budgetUpdate: false,
  });
  const [apiError, setApiError] = useState<string | null>(null);
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
    if (budgetSummary) {
      setBudgetAmount(budgetSummary.totalBudget?.toString() || '');
      setExpenses(budgetSummary.expenses || []);
      setExpensesLoading(false);
    }
  }, [budgetSummary]);

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0]
    });
    setEditingExpense(null);
    setApiError(null);
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentProject) {
      toast({
        title: "Error",
        description: "No project selected",
        variant: "destructive",
      });
      return;
    }

    if (!formData.amount || !formData.description || !formData.category) {
      setApiError("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setApiError("Please enter a valid amount greater than 0");
      return;
    }

    try {
      setApiError(null);
      
      if (editingExpense) {
        setOperationLoading(prev => ({ ...prev, update: true }));
        
        await backend.budget.updateExpense({
          id: editingExpense.id,
          amount,
          description: formData.description,
          category: formData.category,
          date: new Date(formData.date),
          projectId: String(currentProject.id)
        });
        
        toast({
          title: "Success",
          description: "Expense updated successfully",
        });
      } else {
        setOperationLoading(prev => ({ ...prev, create: true }));
        
        await backend.budget.createExpense({
          amount,
          description: formData.description,
          category: formData.category,
          date: new Date(formData.date),
          projectId: String(currentProject.id)
        });
        
        toast({
          title: "Success",
          description: "Expense added successfully",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      refreshBudget();
    } catch (err: any) {
      console.error('Failed to save expense:', err);
      
      let errorMessage = "Failed to save expense";
      if (err?.message) {
        if (err.message.includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
        } else if (err.message.includes('network')) {
          errorMessage = "Network error. Please check your connection.";
        } else if (err.message.includes('validation')) {
          errorMessage = "Invalid data provided. Please check your input.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setApiError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setOperationLoading(prev => ({ 
        ...prev, 
        create: false, 
        update: false 
      }));
    }
  };

  const handleUpdateBudget = async () => {
    if (!currentProject) {
      toast({
        title: "Error",
        description: "No project selected",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid budget amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setOperationLoading(prev => ({ ...prev, budgetUpdate: true }));
      
      await backend.budget.updateBudget({ 
        totalBudget: amount,
        projectId: String(currentProject.id)
      });
      
      toast({
        title: "Success",
        description: "Budget updated successfully",
      });
      
      refreshBudget();
    } catch (err: any) {
      console.error('Failed to update budget:', err);
      
      let errorMessage = "Failed to update budget";
      if (err?.message) {
        if (err.message.includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
        } else if (err.message.includes('network')) {
          errorMessage = "Network error. Please check your connection.";
        } else {
          errorMessage = err.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setOperationLoading(prev => ({ ...prev, budgetUpdate: false }));
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      setOperationLoading(prev => ({ ...prev, delete: expenseId.toString() }));
      
      await backend.budget.deleteExpense({ id: expenseId });
      
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
      
      refreshBudget();
    } catch (err: any) {
      console.error('Failed to delete expense:', err);
      
      let errorMessage = "Failed to delete expense";
      if (err?.message) {
        if (err.message.includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
        } else if (err.message.includes('network')) {
          errorMessage = "Network error. Please check your connection.";
        } else if (err.message.includes('not found')) {
          errorMessage = "Expense not found. It may have already been deleted.";
        } else {
          errorMessage = err.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setOperationLoading(prev => ({ ...prev, delete: null }));
    }
  };

  const openEditDialog = (expense: BudgetExpense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      description: expense.description,
      category: expense.category,
      date: new Date(expense.date).toISOString().split('T')[0]
    });
    setApiError(null);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsDialogOpen(open);
  };

  if (!currentProject) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl md:text-2xl font-semibold">Budget</h2>
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
          <h2 className="text-xl md:text-2xl font-semibold">Budget</h2>
          <p className="text-sm text-muted-foreground">{currentProject.name}</p>
        </div>
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

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Budget</h2>
          <p className="text-sm text-muted-foreground">{currentProject.name}</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={refreshBudget}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalBudget = budgetSummary?.totalBudget || 0;
  const totalExpenses = budgetSummary?.totalSpent || 0;
  const remaining = totalBudget - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Mobile Header */}
      <div className="flex justify-between items-start md:items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Budget</h2>
          <p className="text-sm text-muted-foreground">{currentProject.name}</p>
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="space-y-4 mt-6">
                <Button onClick={openCreateDialog} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
                
                <div className="space-y-2">
                  <Label htmlFor="mobile-budget">Total Budget</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="mobile-budget"
                      type="number"
                      step="0.01"
                      min="0"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      placeholder="0.00"
                      disabled={operationLoading.budgetUpdate}
                    />
                    <Button 
                      size="sm" 
                      onClick={handleUpdateBudget}
                      disabled={operationLoading.budgetUpdate || !budgetAmount || parseFloat(budgetAmount) < 0}
                    >
                      {operationLoading.budgetUpdate ? 'Updating...' : 'Update'}
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Add Button */}
        <div className="hidden md:block">
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </DialogTitle>
                <DialogDescription>
                  {editingExpense 
                    ? 'Update the expense details below.' 
                    : 'Fill in the details to add a new expense to your budget.'
                  }
                </DialogDescription>
              </DialogHeader>
              
              {apiError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmitExpense} className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    disabled={operationLoading.create || operationLoading.update}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Expense description"
                    required
                    disabled={operationLoading.create || operationLoading.update}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    disabled={operationLoading.create || operationLoading.update}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                      <SelectItem value="bathroom">Bathroom</SelectItem>
                      <SelectItem value="living-room">Living Room</SelectItem>
                      <SelectItem value="bedroom">Bedroom</SelectItem>
                      <SelectItem value="exterior">Exterior</SelectItem>
                      <SelectItem value="materials">Materials</SelectItem>
                      <SelectItem value="labor">Labor</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="permits">Permits</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    disabled={operationLoading.create || operationLoading.update}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleDialogClose(false)}
                    disabled={operationLoading.create || operationLoading.update}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={operationLoading.create || operationLoading.update || !formData.amount || !formData.description || !formData.category}
                  >
                    {operationLoading.create || operationLoading.update ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        {editingExpense ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      editingExpense ? 'Update Expense' : 'Add Expense'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mobile Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </DialogTitle>
            <DialogDescription>
              {editingExpense 
                ? 'Update the expense details below.' 
                : 'Fill in the details to add a new expense to your budget.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {apiError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmitExpense} className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
                disabled={operationLoading.create || operationLoading.update}
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Expense description"
                required
                disabled={operationLoading.create || operationLoading.update}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                disabled={operationLoading.create || operationLoading.update}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="bathroom">Bathroom</SelectItem>
                  <SelectItem value="living-room">Living Room</SelectItem>
                  <SelectItem value="bedroom">Bedroom</SelectItem>
                  <SelectItem value="exterior">Exterior</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="permits">Permits</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={operationLoading.create || operationLoading.update}
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleDialogClose(false)}
                disabled={operationLoading.create || operationLoading.update}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={operationLoading.create || operationLoading.update || !formData.amount || !formData.description || !formData.category}
                className="w-full sm:w-auto"
              >
                {operationLoading.create || operationLoading.update ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    {editingExpense ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  editingExpense ? 'Update Expense' : 'Add Expense'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="hidden md:flex items-center space-x-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="0.00"
                className="text-xl md:text-2xl font-bold"
                disabled={operationLoading.budgetUpdate}
              />
              <Button 
                size="sm" 
                onClick={handleUpdateBudget}
                disabled={operationLoading.budgetUpdate || !budgetAmount || parseFloat(budgetAmount) < 0}
              >
                {operationLoading.budgetUpdate ? (
                  <>
                    <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Updating...
                  </>
                ) : (
                  'Update'
                )}
              </Button>
            </div>
            <div className="md:hidden">
              <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl md:text-2xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(remaining).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
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
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
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
              <p>No expenses recorded yet for {currentProject.name}</p>
              <p className="text-sm">Add your first expense to get started</p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="space-y-2 pr-2">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors space-y-2 sm:space-y-0"
                  >
                    <div className="flex items-start sm:items-center space-x-4 flex-1">
                      <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                        <Tag className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{expense.description}</div>
                        <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="capitalize">{expense.category.replace('-', ' ')}</span>
                          <span className="hidden sm:inline">•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(expense.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-2">
                      <div className="text-lg font-semibold">
                        ${expense.amount.toLocaleString()}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(expense)}
                          disabled={operationLoading.delete === expense.id.toString()}
                          title="Edit expense"
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteExpense(expense.id)}
                          disabled={operationLoading.delete === expense.id.toString()}
                          title="Delete expense"
                          className="h-8 w-8"
                        >
                          {operationLoading.delete === expense.id.toString() ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
