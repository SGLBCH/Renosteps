export function BudgetCard() {
  const budget = {
    total: 50000,
    spent: 17500,
    remaining: 32500
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Budget</h3>
      
      <div className="bg-secondary rounded-lg p-4 space-y-3 shadow-sm">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-medium">{formatCurrency(budget.total)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Spent</span>
          <span className="font-medium">{formatCurrency(budget.spent)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Remaining</span>
          <span className="font-medium">{formatCurrency(budget.remaining)}</span>
        </div>
      </div>
    </div>
  );
}
