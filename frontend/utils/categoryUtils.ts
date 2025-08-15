export const formatCategoryName = (category: string): string => {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'kitchen': 'bg-orange-100 text-orange-800',
    'bathroom': 'bg-blue-100 text-blue-800',
    'living-room': 'bg-green-100 text-green-800',
    'bedroom': 'bg-purple-100 text-purple-800',
    'exterior': 'bg-yellow-100 text-yellow-800',
    'other': 'bg-gray-100 text-gray-800',
    // Legacy categories for backward compatibility
    'materials': 'bg-amber-100 text-amber-800',
    'labor': 'bg-red-100 text-red-800',
    'equipment': 'bg-indigo-100 text-indigo-800',
    'permits': 'bg-teal-100 text-teal-800',
  };
  
  return colors[category] || 'bg-gray-100 text-gray-800';
};

export const BUDGET_CATEGORIES = [
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'living-room', label: 'Living Room' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'other', label: 'Other' },
] as const;
