import React from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { type PropertyTypeFilter, type SortOption } from '../../types/property.type';

interface FilterBarProps {
  searchTerm: string;
  selectedType: PropertyTypeFilter;
  sortBy: SortOption;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: PropertyTypeFilter) => void;
  onSortChange: (value: SortOption) => void;
  showTypeFilter?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  selectedType,
  sortBy,
  onSearchChange,
  onTypeChange,
  onSortChange,
  showTypeFilter = true
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl !p-4 !mb-6 shadow-sm">
      <div className={`grid grid-cols-1 ${showTypeFilter ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, địa chỉ..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full !py-2.5 !pl-10 !pr-4 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {showTypeFilter && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none z-10" />
            <select
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value as PropertyTypeFilter)}
              className="w-full !py-2.5 !pl-10 !pr-4 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm outline-none cursor-pointer appearance-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Tất cả loại hình</option>
              <option value="apartment">Căn hộ</option>
              <option value="house">Nhà</option>
              <option value="office">Văn phòng</option>
              <option value="room">Phòng trọ</option>
              <option value="land">Đất</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
          </div>
        )}

        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="w-full !py-2.5 !px-4 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm outline-none cursor-pointer appearance-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="price_high">Giá cao nhất</option>
            <option value="price_low">Giá thấp nhất</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};