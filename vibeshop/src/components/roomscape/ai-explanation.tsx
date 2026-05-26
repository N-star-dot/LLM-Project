'use client';

import { Sparkles } from 'lucide-react';

interface AIExplanationProps {
  explanation: string;
}

export function AIExplanation({ explanation }: AIExplanationProps) {
  return (
    <div className="bg-sage/10 rounded-xl p-4 border border-sage/20">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-sage/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-olive" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-foreground mb-1">Why this vibe?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
        </div>
      </div>
    </div>
  );
}
