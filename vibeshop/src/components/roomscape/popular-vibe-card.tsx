'use client';

interface PopularVibe {
  id: string;
  name: string;
  image: string;
}

interface PopularVibeCardProps {
  vibe: PopularVibe;
  onSelect: (vibe: PopularVibe) => void;
}

export function PopularVibeCard({ vibe, onSelect }: PopularVibeCardProps) {
  return (
    <button
      onClick={() => onSelect(vibe)}
      className="group relative flex-shrink-0 w-[120px] cursor-pointer"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden mb-2 ring-2 ring-transparent group-hover:ring-primary/40 transition-all duration-200">
        <img
          src={vibe.image}
          alt={vibe.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors">
        {vibe.name}
      </span>
    </button>
  );
}
