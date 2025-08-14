import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterChips } from './FilterChips';

const mockCategories = ['All', 'Kitchen', 'Bathroom', 'Living Room'];

describe('FilterChips', () => {
  it('renders all category chips', () => {
    const onCategoryChange = vi.fn();
    
    render(
      <FilterChips
        categories={mockCategories}
        selectedCategory="All"
        onCategoryChange={onCategoryChange}
      />
    );

    mockCategories.forEach(category => {
      expect(screen.getByText(category)).toBeInTheDocument();
    });
  });

  it('highlights selected category', () => {
    const onCategoryChange = vi.fn();
    
    render(
      <FilterChips
        categories={mockCategories}
        selectedCategory="Kitchen"
        onCategoryChange={onCategoryChange}
      />
    );

    const kitchenChip = screen.getByText('Kitchen');
    const allChip = screen.getByText('All');

    // Selected chip should have default variant (darker)
    expect(kitchenChip).toHaveClass('bg-primary');
    // Non-selected chips should have secondary variant (lighter)
    expect(allChip).toHaveClass('bg-secondary');
  });

  it('calls onCategoryChange when chip is clicked', () => {
    const onCategoryChange = vi.fn();
    
    render(
      <FilterChips
        categories={mockCategories}
        selectedCategory="All"
        onCategoryChange={onCategoryChange}
      />
    );

    const bathroomChip = screen.getByText('Bathroom');
    fireEvent.click(bathroomChip);

    expect(onCategoryChange).toHaveBeenCalledWith('Bathroom');
  });

  it('does not call onCategoryChange when already selected chip is clicked', () => {
    const onCategoryChange = vi.fn();
    
    render(
      <FilterChips
        categories={mockCategories}
        selectedCategory="Kitchen"
        onCategoryChange={onCategoryChange}
      />
    );

    const kitchenChip = screen.getByText('Kitchen');
    fireEvent.click(kitchenChip);

    expect(onCategoryChange).toHaveBeenCalledWith('Kitchen');
  });

  it('handles empty categories array', () => {
    const onCategoryChange = vi.fn();
    
    render(
      <FilterChips
        categories={[]}
        selectedCategory=""
        onCategoryChange={onCategoryChange}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('handles single category', () => {
    const onCategoryChange = vi.fn();
    
    render(
      <FilterChips
        categories={['All']}
        selectedCategory="All"
        onCategoryChange={onCategoryChange}
      />
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('applies hover effects', () => {
    const onCategoryChange = vi.fn();
    
    render(
      <FilterChips
        categories={mockCategories}
        selectedCategory="All"
        onCategoryChange={onCategoryChange}
      />
    );

    const kitchenChip = screen.getByText('Kitchen');
    expect(kitchenChip).toHaveClass('hover:shadow-sm');
  });

  it('uses small button size', () => {
    const onCategoryChange = vi.fn();
    
    render(
      <FilterChips
        categories={mockCategories}
        selectedCategory="All"
        onCategoryChange={onCategoryChange}
      />
    );

    const allChip = screen.getByText('All');
    expect(allChip).toHaveClass('h-8'); // Small size class
  });
});
