'use client';

import { useState, useMemo, useEffect } from 'react';
import { formatDateTime, formatPhoneNumber } from '@/lib/utils/format';
import { convertToCSV, downloadCSV } from '@/lib/utils/csv';
import Button from '@/components/ui/Button';
import type { Lead } from '@/types/leads';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LeadTableProps {
  leads: (Lead & {
    listing_address?: string;
    listing_city?: string;
    listing_state?: string;
    status?: Status;
  })[];
  onRefresh?: () => void;
}

type Status = 'new' | 'contacted' | 'qualified' | 'converted';

const STATUS_COLORS: Record<Status, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-purple-100 text-purple-800',
  converted: 'bg-green-100 text-green-800',
};

const STATUS_LABELS: Record<Status, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  converted: 'Converted',
};

export default function LeadTable({ leads, onRefresh }: LeadTableProps) {
  const [loading, setLoading] = useState(false);
  const [hasCSVExport, setHasCSVExport] = useState(false);
  const [checkingFeature, setCheckingFeature] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user has CSV export feature
    const checkFeature = async () => {
      try {
        const response = await fetch('/api/subscription/features?feature=csv_export');
        if (response.ok) {
          const data = await response.json();
          setHasCSVExport(data.hasFeature || false);
        }
      } catch (error) {
        console.error('Error checking feature:', error);
      } finally {
        setCheckingFeature(false);
      }
    };
    checkFeature();
  }, []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'property' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Get unique properties for filter
  const properties = useMemo(() => {
    const unique = new Set<string>();
    leads.forEach((lead) => {
      if (lead.listing_address) {
        unique.add(lead.listing_address);
      }
    });
    return Array.from(unique).sort();
  }, [leads]);

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let filtered = [...leads];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.phone?.includes(search) ||
          lead.listing_address?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => (lead.status || 'new') === statusFilter);
    }

    // Property filter
    if (propertyFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.listing_address === propertyFilter);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (dateRange === 'today') {
        cutoff.setHours(0, 0, 0, 0);
      } else if (dateRange === 'week') {
        cutoff.setDate(now.getDate() - 7);
      } else if (dateRange === 'month') {
        cutoff.setDate(now.getDate() - 30);
      }
      filtered = filtered.filter((lead) => new Date(lead.created_at) >= cutoff);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'property') {
        comparison = (a.listing_address || '').localeCompare(b.listing_address || '');
      } else if (sortBy === 'status') {
        comparison = (a.status || 'new').localeCompare(b.status || 'new');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [leads, search, statusFilter, propertyFilter, dateRange, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, currentPage]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<Status, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
    };
    leads.forEach((lead) => {
      const status = (lead.status as Status) || 'new';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [leads]);

  const handleStatusUpdate = async (leadId: string, newStatus: Status) => {
    setLoading(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert('Failed to update lead status');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: Status) => {
    if (selectedLeads.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: selectedLeads, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update leads');
      }

      setSelectedLeads([]);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      alert('Failed to update leads');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!hasCSVExport) {
      // Show upgrade prompt or redirect to billing
      router.push('/dashboard/billing');
      return;
    }

    const headers = [
      'Name',
      'Email',
      'Phone',
      'Property',
      'Source',
      'Status',
      'Message',
      'Created At',
    ];
    const csvData = filteredLeads.map((lead) => ({
      Name: lead.name,
      Email: lead.email || '',
      Phone: lead.phone || '',
      Property: lead.listing_address || 'Unknown',
      Source: lead.source || 'unknown',
      Status: lead.status || 'new',
      Message: lead.message || '',
      'Created At': formatDateTime(lead.created_at),
    }));
    const csv = convertToCSV(csvData, headers);
    downloadCSV(csv, `leads-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const toggleSelectLead = (leadId: string) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === paginatedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(paginatedLeads.map((l) => l.id));
    }
  };

  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No leads captured yet.</p>
        <p className="text-gray-500 text-sm mt-2">
          Start generating QR codes to capture leads from your properties.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">New</p>
          <p className="text-2xl font-bold text-blue-600">{statusCounts.new}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Contacted</p>
          <p className="text-2xl font-bold text-yellow-600">{statusCounts.contacted}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Qualified</p>
          <p className="text-2xl font-bold text-purple-600">{statusCounts.qualified}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Converted</p>
          <p className="text-2xl font-bold text-green-600">{statusCounts.converted}</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1">
          {/* Search */}
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Property Filter */}
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Properties</option>
            {properties.map((prop) => (
              <option key={prop} value={prop}>
                {prop}
              </option>
            ))}
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>

        <div className="flex gap-2">
          {selectedLeads.length > 0 && (
            <Button
              onClick={() => handleBulkStatusUpdate('contacted')}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              Mark {selectedLeads.length} as Contacted
            </Button>
          )}
          <Button 
            onClick={handleExport} 
            variant="outline" 
            size="sm"
            disabled={checkingFeature}
            title={!hasCSVExport ? 'Upgrade to Pro to export leads' : 'Export leads to CSV'}
          >
            {checkingFeature ? 'Loading...' : hasCSVExport ? 'Export CSV' : 'Export CSV (Pro)'}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    paginatedLeads.length > 0 &&
                    selectedLeads.length === paginatedLeads.length
                  }
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => {
                  if (sortBy === 'name') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('name');
                    setSortOrder('asc');
                  }
                }}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => {
                  if (sortBy === 'property') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('property');
                    setSortOrder('asc');
                  }
                }}
              >
                Property {sortBy === 'property' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => {
                  if (sortBy === 'status') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('status');
                    setSortOrder('asc');
                  }
                }}
              >
                Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => {
                  if (sortBy === 'date') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('date');
                    setSortOrder('desc');
                  }
                }}
              >
                Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedLeads.map((lead) => {
              const status = (lead.status as Status) || 'new';
              const telLink = lead.phone ? `tel:${lead.phone.replace(/\D/g, '')}` : null;
              const smsLink = lead.phone
                ? `sms:${lead.phone.replace(/\D/g, '')}`
                : null;
              const emailLink = lead.email ? `mailto:${lead.email}` : null;

              return (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => toggleSelectLead(lead.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {lead.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="space-y-1">
                      {lead.email && (
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <a
                            href={emailLink || '#'}
                            className="text-blue-600 hover:underline truncate max-w-[200px]"
                            title={lead.email}
                          >
                            {lead.email}
                          </a>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span className="text-gray-900">
                            {formatPhoneNumber(lead.phone)}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {lead.listing_address ? (
                      <Link
                        href={`/dashboard/listings/${lead.listing_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {lead.listing_address}
                        {lead.listing_city && lead.listing_state && (
                          <span className="text-gray-500">
                            {' '}
                            ({lead.listing_city}, {lead.listing_state})
                          </span>
                        )}
                      </Link>
                    ) : (
                      'Unknown'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="capitalize">
                      {lead.source?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={status}
                      onChange={(e) =>
                        handleStatusUpdate(lead.id, e.target.value as Status)
                      }
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 ${STATUS_COLORS[status]}`}
                      disabled={loading}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDateTime(lead.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      {telLink && (
                        <a
                          href={telLink}
                          className="text-blue-600 hover:text-blue-800"
                          title="Call"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                        </a>
                      )}
                      {smsLink && (
                        <a
                          href={smsLink}
                          className="text-green-600 hover:text-green-800"
                          title="Text"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        </a>
                      )}
                      {emailLink && (
                        <a
                          href={emailLink}
                          className="text-purple-600 hover:text-purple-800"
                          title="Email"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredLeads.length)} of{' '}
            {filteredLeads.length} leads
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
