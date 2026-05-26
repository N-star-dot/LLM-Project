"use client";

import { StyleProfile } from "@/lib/types";

interface ThinkingStateProps {
  step: "idle" | "vision" | "vision_done" | "aesthetic" | "search" | "curate" | "done";
  profile: StyleProfile | null;
  searchCount: number;
  curateCount: number;
  extractedVibe: string | null;
  hasImage: boolean;
}

export function ThinkingState({ step, profile, searchCount, curateCount, extractedVibe, hasImage }: ThinkingStateProps) {
  const allSteps = [
    ...(hasImage
      ? [
          {
            key: "vision",
            label: "Reading your image",
            detail: extractedVibe ? [`Extracted: "${extractedVibe.slice(0, 120)}${extractedVibe.length > 120 ? "..." : ""}"`] : null,
          },
        ]
      : []),
    {
      key: "aesthetic",
      label: "Analyzing vibe",
      detail: profile
        ? [
            `Aesthetic: ${profile.aesthetic_name}`,
            `Palette: ${profile.color_palette.join(", ")}`,
            `Materials: ${profile.primary_materials.join(", ")}`,
            `Silhouettes: ${profile.silhouette_style}`,
            `Anchoring: ${profile.anchoring_categories.join(", ")}`,
          ]
        : null,
    },
    {
      key: "search",
      label: "Searching catalog",
      detail: searchCount > 0 ? [`Found ${searchCount} matching products`] : null,
    },
    {
      key: "curate",
      label: "Curating room set",
      detail: curateCount > 0 ? [`Selected ${curateCount} cohesive pieces`] : null,
    },
    {
      key: "done",
      label: "Generating mood board",
      detail: null,
    },
  ];

  const stepOrder = allSteps.map((s) => s.key);
  const effectiveStep = step === "vision_done" ? "vision_done" : step;
  const currentIdx = effectiveStep === "vision_done"
    ? stepOrder.indexOf("vision") + 0.5
    : stepOrder.indexOf(effectiveStep);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1">
            <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-white/60" />
            <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-white/60" />
            <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-white/60" />
          </div>
          <span className="text-white/40 text-sm font-mono">VibeShop Agent</span>
        </div>

        <div className="space-y-3">
          {allSteps.map((s, i) => {
            const isVisionDone = s.key === "vision" && effectiveStep === "vision_done";
            const isActive = s.key === effectiveStep;
            const isDone = currentIdx > i || isVisionDone;
            const isPending = !isActive && !isDone;

            return (
              <div
                key={s.key}
                className={`transition-all duration-300 ${isPending ? "opacity-20" : "opacity-100"}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-mono ${isActive && !isVisionDone ? "text-white" : isDone ? "text-green-400" : "text-white/30"}`}>
                    {isDone ? "done" : isActive ? "..." : "   "}
                  </span>
                  <span className={`text-sm ${isActive && !isVisionDone ? "text-white" : isDone ? "text-white/60" : "text-white/30"}`}>
                    {s.label}
                  </span>
                </div>

                {s.detail && (isDone || isActive) && (
                  <div className="ml-8 mt-1 space-y-0.5">
                    {s.detail.map((line, j) => (
                      <p key={j} className="text-xs text-white/40 font-mono animate-fade-in-up">
                        → {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {profile && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex gap-1.5">
              {profile.color_palette.map((color) => (
                <div
                  key={color}
                  className="w-6 h-6 rounded-full border border-white/10"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
