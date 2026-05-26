'use client';

interface MaterialsRowProps {
  materials: string[];
}

export function MaterialsRow({ materials }: MaterialsRowProps) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border/50 transition-colors duration-500">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Materials & Elements</h3>
      <div className="flex flex-wrap gap-2">
        {materials.map((material) => (
          <span
            key={material}
            className="px-4 py-2 rounded-full text-sm font-medium bg-surface-soft text-muted-foreground"
          >
            {material}
          </span>
        ))}
      </div>
    </div>
  );
}
