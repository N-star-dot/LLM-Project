'use client';

interface ColorPaletteProps {
  palette: { name: string; color: string }[];
}

export function ColorPalette({ palette }: ColorPaletteProps) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border/50">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Color Palette</h3>
      <div className="flex flex-wrap gap-2">
        {palette.map((color) => (
          <div
            key={color.name}
            className="w-10 h-10 rounded-full shadow-sm border border-border/30 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: color.color }}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
}
