'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'active' | 'inactive' | 'deleted';

export default function StatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const currentFilter: StatusFilter = 
    statusParam === null ? 'active' : 
    (statusParam === 'all' || statusParam === 'inactive' || statusParam === 'deleted') ? statusParam as StatusFilter :
    'active';

  const filters: { value: StatusFilter; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'deleted', label: 'Deleted' },
    { value: 'all', label: 'All' },
  ];

  const handleFilterChange = (filter: StatusFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === 'active') {
      params.delete('status');
    } else {
      params.set('status', filter);
    }
    router.push(`/dashboard/listings?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 mb-6">
      <span className="text-sm font-medium text-gray-700 mr-2">Filter:</span>
      <div className="flex items-center gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => handleFilterChange(filter.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              currentFilter === filter.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}

