// src/components/properties/SearchFilters.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

interface SearchFiltersProps {
  searchQuery: string;
  statusFilter: string;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchQuery,
  statusFilter,
  setSearchQuery,
  setStatusFilter
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex items-center gap-4">
      <div className="relative flex-grow">
        <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none" 
          placeholder="Search hotels by name or address..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <select 
        className="px-4 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none" 
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
};