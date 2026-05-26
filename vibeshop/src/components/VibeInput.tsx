"use client";

import { useState } from "react";

const SUGGESTIONS = [
  "dark academia library with warm lighting and velvet textures",
  "Japandi minimalism, neutral tones, natural wood",
  "coastal grandmother — linen, light blues, wicker, relaxed",
  "maximalist grandmillennial with bold patterns and antique pieces",
  "mid-century modern den with warm wood and clean lines",
  "industrial loft with exposed brick and raw metals",
];

export function VibeInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (vibe: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Describe the vibe, aesthetic, or feeling you want your space to have..."
          disabled={disabled}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 resize-none transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="absolute bottom-4 right-4 bg-white text-black px-5 py-2 rounded-xl text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {disabled ? "Thinking..." : "Find my vibe"}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setValue(s);
              if (!disabled) onSubmit(s);
            }}
            disabled={disabled}
            className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-all disabled:opacity-30"
          >
            {s.length > 40 ? s.slice(0, 40) + "..." : s}
          </button>
        ))}
      </div>
    </div>
  );
}
