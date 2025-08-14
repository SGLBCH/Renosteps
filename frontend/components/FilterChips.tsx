import { Button } from '@/components/ui/button';

interface FilterChipsProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function FilterChips({ categories, selectedCategory, onCategoryChange }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "secondary"}
          size="sm"
          onClick={() => onCategoryChange(category)}
          className="transition-all hover:shadow-sm"
        >
          {category}
        </Button>
      ))}
    </div>
  );
}
