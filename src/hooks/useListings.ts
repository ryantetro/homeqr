'use client';

import { useState, useEffect } from 'react';
import type { Listing, ListingWithQR } from '@/types/listings';

interface UseListingsOptions {
  page?: number;
  limit?: number;
}

export function useListings(options: UseListingsOptions = {}) {
  const [listings, setListings] = useState<ListingWithQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchListings = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(options.page || 1),
        limit: String(options.limit || 10),
      });

      const response = await fetch(`/api/listings?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch listings');
      }

      setListings(data.data || []);
      setPagination(data.pagination || pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [options.page, options.limit]);

  return {
    listings,
    loading,
    error,
    pagination,
    refetch: fetchListings,
  };
}



