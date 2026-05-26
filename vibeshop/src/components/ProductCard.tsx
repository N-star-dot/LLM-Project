"use client";

import { CuratedProduct } from "@/lib/types";
import { useState } from "react";

interface ProductCardProps {
  product: CuratedProduct;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={onClick}
      className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-white/20 transition-all duration-300 animate-fade-in-up opacity-0"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
        {!imgError ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white text-sm font-medium px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
            Explore in 3D
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-white/90 leading-tight">
            {product.name}
          </h3>
          <span className="text-sm font-mono text-white/60 shrink-0">
            ${product.price.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-1.5">
          <span className="text-xs text-yellow-400/80">★</span>
          <span className="text-xs text-white/40">{product.rating}</span>
        </div>

        <p className="text-xs text-white/30 mt-2 leading-relaxed italic">
          &ldquo;{product.vibe_note}&rdquo;
        </p>

        {/* Color swatches */}
        <div className="flex gap-1 mt-3">
          {product.colors.map((color) => (
            <div
              key={color}
              className="w-3 h-3 rounded-full border border-white/10"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
