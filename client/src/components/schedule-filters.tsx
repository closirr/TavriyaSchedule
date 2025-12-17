import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import type { ScheduleFilters, FilterOptions } from '@/types/schedule';

interface ScheduleFiltersProps {
  filters: ScheduleFilters;
  filterOptions: FilterOptions;
  onFiltersChange: (filters: ScheduleFilters) => void;
}

interface SearchSuggestion {
  value: string;
  type: 'group' | 'teacher' | 'classroom';
  label: string;
}

export default function ScheduleFilters({ filters, filterOptions, onFiltersChange }: ScheduleFiltersProps) {
  const [search, setSearch] = useState(filters.search || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sync search state with external filters (but don't show suggestions)
  useEffect(() => {
    const currentSearch = filters.search || filters.group || filters.teacher || filters.classroom || '';
    if (currentSearch !== search) {
      setSearch(currentSearch);
      setIsUserTyping(false); // Don't show suggestions on external filter change
    }
  }, [filters]);

  // Generate suggestions based on input (only when user is typing)
  useEffect(() => {
    if (!search.trim() || !isUserTyping) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchLower = search.toLowerCase();
    const newSuggestions: SearchSuggestion[] = [];

    // Add group suggestions (from 1 character)
    filterOptions.groups.forEach((group: string) => {
      if (group.toLowerCase().includes(searchLower)) {
        newSuggestions.push({
          value: group,
          type: 'group',
          label: `${group} (група)`
        });
      }
    });

    // Add classroom suggestions (from 1 character)
    filterOptions.classrooms.forEach((classroom: string) => {
      if (classroom.toLowerCase().includes(searchLower)) {
        newSuggestions.push({
          value: classroom,
          type: 'classroom',
          label: `${classroom} (аудиторія)`
        });
      }
    });

    // Add teacher suggestions (from 1 character)
    filterOptions.teachers.forEach((teacher: string) => {
      if (teacher.toLowerCase().includes(searchLower)) {
        newSuggestions.push({
          value: teacher,
          type: 'teacher',
          label: `${teacher} (викладач)`
        });
      }
    });

    setSuggestions(newSuggestions.slice(0, 8)); // Limit to 8 suggestions
    setShowSuggestions(newSuggestions.length > 0);
    setSelectedIndex(-1);
  }, [search, filterOptions, isUserTyping]);

  const updateFilters = (searchTerm: string, type?: 'group' | 'teacher' | 'classroom') => {
    const newFilters: ScheduleFilters = {
      search: !type ? searchTerm.trim() || undefined : undefined,
      group: type === 'group' ? searchTerm : undefined,
      teacher: type === 'teacher' ? searchTerm : undefined,
      classroom: type === 'classroom' ? searchTerm : undefined
    };
    onFiltersChange(newFilters);
  };

  const handleInputChange = (value: string) => {
    setSearch(value);
    setIsUserTyping(true);
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setSearch(suggestion.value);
    setShowSuggestions(false);
    setIsUserTyping(false);
    updateFilters(suggestion.value, suggestion.type);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        if (showSuggestions && suggestions.length > 0) {
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        if (showSuggestions && suggestions.length > 0) {
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else if (suggestions.length === 1) {
          handleSuggestionSelect(suggestions[0]);
        } else if (search.trim()) {
          setShowSuggestions(false);
          updateFilters(search.trim());
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const clearSearch = () => {
    setSearch('');
    setShowSuggestions(false);
    onFiltersChange({});
    inputRef.current?.focus();
  };

  return (
    <div className="mb-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="relative w-full max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Група, викладач або аудиторія..."
              value={search}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="w-full pl-10 pr-10 focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
            />
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.type}-${suggestion.value}`}
                  className={`px-4 py-3 cursor-pointer transition-colors ${index === selectedIndex
                    ? 'bg-navy-50 dark:bg-navy-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {suggestion.value}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${suggestion.type === 'group'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : suggestion.type === 'teacher'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                      {suggestion.type === 'group' ? 'група' :
                        suggestion.type === 'teacher' ? 'викладач' : 'аудиторія'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
