'use client';

import { Home } from 'lucide-react';

export function Header() {
  return (
    <header className="flex items-center justify-between py-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <Home className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-semibold text-foreground">Roomscape</span>
      </div>
    </header>
  );
}
