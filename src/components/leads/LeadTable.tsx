'use client';

import { useState } from 'react';
import { formatDateTime, formatPhoneNumber } from '@/lib/utils/format';
import { convertToCSV, downloadCSV } from '@/lib/utils/csv';
import Button from '@/components/ui/Button';
import type { Lead } from '@/types/leads';

interface LeadTableProps {
  leads: Lead[];
  onRefresh?: () => void;
}

export default function LeadTable({ leads, onRefresh }: LeadTableProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Phone', 'Message', 'Source', 'Created At'];
    const csvData = leads.map((lead) => ({
      Name: lead.name,
      Email: lead.email || '',
      Phone: lead.phone || '',
      Message: lead.message || '',
      Source: lead.source,
      'Created At': formatDateTime(lead.created_at),
    }));
    const csv = convertToCSV(csvData, headers);
    downloadCSV(csv, `leads-${new Date().toISOString().split('T')[0]}.csv`);
  };

  if (leads.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No leads captured yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Leads ({leads.length})
        </h3>
        <Button onClick={handleExport} variant="outline" size="sm">
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Message
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {lead.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {lead.email || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {lead.phone ? formatPhoneNumber(lead.phone) : '—'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                  {lead.message || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDateTime(lead.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


