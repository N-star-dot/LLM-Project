'use client';

interface VibeDNACardProps {
  aestheticDNA: { name: string; percentage: number }[];
}

export function VibeDNACard({ aestheticDNA }: VibeDNACardProps) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border/50 transition-colors duration-500">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Vibe DNA</h3>
      <div className="space-y-2.5">
        {aestheticDNA.map((item, index) => (
          <div key={item.name} className="flex items-center gap-3">
            <span className="text-sm text-foreground w-28 truncate">{item.name}</span>
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  index === 0 ? 'bg-accent' : index === 1 ? 'bg-accent/80' : index === 2 ? 'bg-accent/60' : 'bg-accent/40'
                }`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-10 text-right">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
