'use client';

const categories = ['All', 'Seating', 'Tables', 'Storage', 'Lighting', 'Decor', 'Rugs'];

interface ProductFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

// Map our catalog categories to display categories
const categoryMap: Record<string, string> = {
  'sofa': 'Seating',
  'accent-chair': 'Seating',
  'coffee-table': 'Tables',
  'side-table': 'Tables',
  'bookshelf': 'Storage',
  'floor-lamp': 'Lighting',
  'area-rug': 'Rugs',
  'bed': 'Seating',
  'wall-art': 'Decor',
  'decor': 'Decor',
};

export function mapCategory(catalogCategory: string): string {
  return categoryMap[catalogCategory] || 'Decor';
}

export function ProductFilters({ selectedCategory, onCategoryChange }: ProductFiltersProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
            selectedCategory === category
              ? 'bg-primary text-primary-foreground'
              : 'bg-surface-soft text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
