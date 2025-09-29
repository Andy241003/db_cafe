// src/components/categories/SearchFilters.tsx

import React from 'react';
import type { CategoryFilters } from '../../types/categories';

interface SearchFiltersProps {
  filters: CategoryFilters;
  onFiltersChange: (filters: Partial<CategoryFilters>) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onFiltersChange({ search: event.target.value });
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    onFiltersChange({ status: event.target.value });
  };

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    onFiltersChange({ type: event.target.value });
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6">
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search categories..."
          value={filters.search}
          onChange={handleSearchChange}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <select
          value={filters.status}
          onChange={handleStatusChange}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={filters.type}
          onChange={handleTypeChange}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="system">System</option>
          <option value="custom">Custom</option>
        </select>
      </div>
    </div>
  );
};