import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
}

export function BudgetCard() {
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadBudgetSummary = async () => {
    try {
      setLoading(true);
      const response = await backend.budget.getSummary();
      setBudgetSummary({
        totalBudget: response.totalBudget,
        totalSpent: response.totalSpent,
        remaining: response.remaining,
      });
    } catch (error) {
      console.error('Error loading budget summary:', error);
      toast({
        title: "Error",
        description: "Failed to load budget data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetSummary();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Budget</h3>
        <div className="bg-secondary rounded-lg p-4 shadow-sm">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!budgetSummary) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Budget</h3>
        <div className="bg-secondary rounded-lg p-4 shadow-sm">
          <div className="text-center text-muted-foreground">Failed to load budget</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Budget</h3>
      
      <div className="bg-secondary rounded-lg p-4 space-y-3 shadow-sm">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-medium">{formatCurrency(budgetSummary.totalBudget)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Spent</span>
          <span className="font-medium">{formatCurrency(budgetSummary.totalSpent)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Remaining</span>
          <span className={`font-medium ${budgetSummary.remaining >= 0 ? 'text-green-600' : 'text-destructive'}`}>
            {formatCurrency(budgetSummary.remaining)}
          </span>
        </div>
      </div>
    </div>
  );
}
