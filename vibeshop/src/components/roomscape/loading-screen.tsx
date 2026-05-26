'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { StyleProfile } from '@/lib/types';

type ThinkingStep = 'idle' | 'vision' | 'vision_done' | 'aesthetic' | 'search' | 'curate' | 'done';

interface LoadingScreenProps {
  step: ThinkingStep;
  profile: StyleProfile | null;
  searchCount: number;
  curateCount: number;
  extractedVibe: string | null;
  hasImage: boolean;
}

export function LoadingScreen({ step, profile, searchCount, curateCount, extractedVibe, hasImage }: LoadingScreenProps) {
  const allSteps = [
    ...(hasImage
      ? [{
          key: 'vision',
          label: 'Reading your image',
          detail: extractedVibe ? [`Extracted: "${extractedVibe.slice(0, 120)}${extractedVibe.length > 120 ? '...' : ''}"`] : null,
        }]
      : []),
    {
      key: 'aesthetic',
      label: 'Building your aesthetic DNA',
      detail: profile
        ? [
            `Aesthetic: ${profile.aesthetic_name}`,
            `Palette: ${profile.color_palette.join(', ')}`,
            `Materials: ${profile.primary_materials.join(', ')}`,
          ]
        : null,
    },
    {
      key: 'search',
      label: 'Matching furniture pieces',
      detail: searchCount > 0 ? [`Found ${searchCount} matching products`] : null,
    },
    {
      key: 'curate',
      label: 'Creating your Roomscape',
      detail: curateCount > 0 ? [`Selected ${curateCount} cohesive pieces`] : null,
    },
    {
      key: 'done',
      label: 'Preparing your room',
      detail: null,
    },
  ];

  const stepOrder = allSteps.map((s) => s.key);
  const effectiveStep = step === 'vision_done' ? 'vision_done' : step;
  const currentIdx = effectiveStep === 'vision_done'
    ? stepOrder.indexOf('vision') + 0.5
    : stepOrder.indexOf(effectiveStep);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50 transition-colors duration-500">
      <div className="text-center space-y-8 px-6 max-w-md w-full">
        <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto" />

        <div className="space-y-3 text-left">
          {allSteps.map((s, i) => {
            const isVisionDone = s.key === 'vision' && effectiveStep === 'vision_done';
            const isActive = s.key === effectiveStep;
            const isDone = currentIdx > i || isVisionDone;
            const isPending = !isActive && !isDone;

            return (
              <div key={s.key} className={`transition-all duration-300 ${isPending ? 'opacity-30' : 'opacity-100'}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-mono w-8 ${isActive && !isVisionDone ? 'text-foreground' : isDone ? 'text-accent' : 'text-muted-foreground/30'}`}>
                    {isDone ? 'done' : isActive ? '...' : '   '}
                  </span>
                  <span className={`text-sm ${isActive && !isVisionDone ? 'text-foreground font-medium' : isDone ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                    {s.label}
                  </span>
                </div>

                {s.detail && (isDone || isActive) && (
                  <div className="ml-11 mt-1 space-y-0.5">
                    {s.detail.map((line, j) => (
                      <p key={j} className="text-xs text-muted-foreground animate-fade-in-up">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {profile && (
          <div className="flex justify-center gap-2">
            {profile.color_palette.map((color) => (
              <div
                key={color}
                className="w-8 h-8 rounded-full border border-border/30 shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}

        <p className="text-muted-foreground text-sm">Designing your room around your vibe...</p>
      </div>
    </div>
  );
}
