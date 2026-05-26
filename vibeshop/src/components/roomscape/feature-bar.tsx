'use client';

import { Sparkles, Box, Replace, PiggyBank, Home } from 'lucide-react';

const features = [
  { icon: Sparkles, title: 'AI-Powered', description: 'Understands your style, space, budget, and preferences.' },
  { icon: Box, title: 'Interactive 3D Rooms', description: 'See, rotate, and interact with furniture in your space.' },
  { icon: Replace, title: 'Swap & Customize', description: 'Replace items and explore alternatives that fit your vibe.' },
  { icon: PiggyBank, title: 'Smart Budgeting', description: 'Beautiful rooms that fit your budget.' },
  { icon: Home, title: 'From Vibe to Home', description: 'From inspiration to a complete shoppable room.' },
];

export function FeatureBar() {
  return (
    <div className="bg-card border-t border-border py-6 px-4 transition-colors duration-500">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
