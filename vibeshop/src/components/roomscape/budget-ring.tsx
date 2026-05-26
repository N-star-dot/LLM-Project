'use client';

interface BudgetRingProps {
  budget: number;
  spent: number;
}

export function BudgetRing({ budget, spent }: BudgetRingProps) {
  const percentage = Math.min((spent / budget) * 100, 100);
  const remaining = budget - spent;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-card rounded-xl p-4 border border-border/50 transition-colors duration-500">
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--secondary)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r={radius} fill="none"
              stroke="var(--accent)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground">Budget</span>
            <span className="text-lg font-semibold text-foreground">${budget.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spent</span>
            <span className="font-medium text-foreground">${spent.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className="font-medium text-accent">${remaining.toFixed(2)}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
