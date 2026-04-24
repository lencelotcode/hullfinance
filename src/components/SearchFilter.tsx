import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onCategoryFilter: (category: string) => void;
  onDateFilter: (date: string) => void;
  categories: string[];
}

export default function SearchFilter({ onSearch, onCategoryFilter, onDateFilter, categories }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    onCategoryFilter(value === 'all' ? '' : value);
  };

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    onDateFilter(value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDate('');
    onSearch('');
    onCategoryFilter('');
    onDateFilter('');
  };

  const hasFilters = searchQuery || selectedCategory !== 'all' || selectedDate;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by note, amount..."
            className="pl-10 bg-zinc-800 border-zinc-700 text-zinc-200"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="text-zinc-400 hover:text-zinc-200"
        >
          Filters
        </Button>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-zinc-400 hover:text-red-400"
          >
            <X size={16} />
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="flex gap-2 animate-in slide-in-from-top-2">
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-200"
          />
        </div>
      )}
    </div>
  );
}
