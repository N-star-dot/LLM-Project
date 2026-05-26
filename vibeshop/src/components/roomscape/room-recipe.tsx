'use client';

import { Heart, ShoppingCart } from 'lucide-react';
import { CuratedProduct } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface RoomRecipeProps {
  title: string;
  subtitle: string;
  products: CuratedProduct[];
  budget: number;
  spent: number;
}

export function RoomRecipe({ title, subtitle, products, budget, spent }: RoomRecipeProps) {
  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <p className="text-xs text-muted-foreground mt-1">{products.length} items</p>
      </div>

      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-soft">
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
              <p className="text-sm text-muted-foreground">${product.price}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="text-lg font-semibold text-foreground">${spent.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

interface BudgetBreakdownProps {
  budget: number;
  spent: number;
}

export function BudgetBreakdown({ budget, spent }: BudgetBreakdownProps) {
  const remaining = budget - spent;
  const percentage = (spent / budget) * 100;

  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 space-y-4">
      <h3 className="font-medium text-foreground">Budget Breakdown</h3>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Budget</span>
          <span className="font-medium text-foreground">${budget.toLocaleString()}.00</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Spent</span>
          <span className="font-medium text-foreground">${spent.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Remaining</span>
          <span className="font-medium text-success">${remaining.toFixed(2)}</span>
        </div>
      </div>

      <div className="h-2 bg-surface-soft rounded-full overflow-hidden">
        <div className="h-full bg-sage rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
      </div>

      <div className="space-y-2 pt-2">
        <Button className="w-full rounded-lg bg-primary hover:bg-primary/90">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add All to Cart
        </Button>
        <Button variant="outline" className="w-full rounded-lg">
          <Heart className="w-4 h-4 mr-2" />
          Save Room
        </Button>
      </div>
    </div>
  );
}
