'use client';

import { useState } from 'react';
import { Heart, Box } from 'lucide-react';
import { CuratedProduct } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: CuratedProduct;
  onView3D?: () => void;
}

export function ProductCard({ product, onView3D }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group bg-card rounded-xl border border-border/50 overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-soft">
        {!imgError ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}

        {/* Favorite Button */}
        <button className="absolute top-3 right-3 w-8 h-8 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-card transition-colors">
          <Heart className="w-4 h-4 text-muted-foreground hover:text-accent" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium text-foreground text-sm leading-tight">{product.name}</h3>
            <p className="text-lg font-semibold text-foreground mt-0.5">${product.price.toLocaleString()}</p>
          </div>
          <span className="text-xs text-muted-foreground">
            <span className="text-yellow-500">&#9733;</span> {product.rating}
          </span>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 italic">&ldquo;{product.vibe_note}&rdquo;</p>

        {/* Color swatches */}
        <div className="flex gap-1.5">
          {product.colors.map((color) => (
            <div
              key={color}
              className="w-4 h-4 rounded-full border border-border/30"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={onView3D}
          className="w-full rounded-lg text-xs h-8"
        >
          <Box className="w-3.5 h-3.5 mr-1.5" />
          Explore in 3D
        </Button>
      </div>
    </div>
  );
}
