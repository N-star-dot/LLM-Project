"use client";

import { VibeContext, CuratedProduct } from "@/lib/types";
import { ProductCard } from "./ProductCard";

interface MoodBoardProps {
  context: VibeContext;
  onProductClick: (product: CuratedProduct) => void;
  onReset: () => void;
}

export function MoodBoard({ context, onProductClick, onReset }: MoodBoardProps) {
  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-8">
        <button
          onClick={onReset}
          className="text-xs text-white/30 hover:text-white/60 transition-colors mb-4 inline-block"
        >
          ← Start over
        </button>
        <h2 className="text-3xl font-light text-white tracking-tight">
          {context.board_title}
        </h2>
        <p className="text-white/40 mt-2 text-lg">
          {context.board_description}
        </p>
        <div className="flex justify-center gap-2 mt-4">
          {context.color_palette_hex.map((color) => (
            <div
              key={color}
              className="w-8 h-8 rounded-full border border-white/10"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="masonry-grid stagger-children">
        {context.products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => onProductClick(product)}
          />
        ))}
      </div>
    </div>
  );
}
