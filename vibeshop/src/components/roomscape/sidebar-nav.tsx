'use client';

import { Home, LayoutGrid, Package, Box, FileText, Heart, Sparkles } from 'lucide-react';

export type NavItem = 'vibe' | 'moodboard' | 'products' | '3d-room' | 'recipe' | 'saved';

interface SidebarNavProps {
  activeItem: NavItem;
  onItemChange: (item: NavItem) => void;
}

const navItems = [
  { id: 'vibe' as const, icon: Sparkles, label: 'Vibe' },
  { id: 'moodboard' as const, icon: LayoutGrid, label: 'Moodboard' },
  { id: 'products' as const, icon: Package, label: 'Products' },
  { id: '3d-room' as const, icon: Box, label: '3D Room' },
  { id: 'recipe' as const, icon: FileText, label: 'Recipe' },
  { id: 'saved' as const, icon: Heart, label: 'Saved' },
];

export function SidebarNav({ activeItem, onItemChange }: SidebarNavProps) {
  return (
    <nav className="hidden lg:flex flex-col items-center py-6 px-3 bg-card border-r border-border/50 w-20 transition-colors duration-500">
      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-8">
        <Home className="w-5 h-5 text-primary-foreground" />
      </div>

      <div className="flex flex-col gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemChange(item.id)}
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
              activeItem === item.id
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export function MobileNav({ activeItem, onItemChange }: SidebarNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 px-2 py-2 z-50 transition-colors duration-500">
      <div className="flex items-center justify-around">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => onItemChange(item.id)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
              activeItem === item.id ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
