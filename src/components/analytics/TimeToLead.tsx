'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { calculateAvgTimeToLead, isHotLead } from '@/lib/utils/analytics';
import Card from '@/components/ui/Card';

interface TimeToLeadData {
  avgMinutes: number;
  hotLeads: number;
  totalLeads: number;
  timeDistribution: Array<{ range: string; count: number }>;
}

export default function TimeToLead({ listingIds }: { listingIds: string[] }) {
  const [data, setData] = useState<TimeToLeadData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTimeToLead() {
      if (listingIds.length === 0) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      
      // Get all leads with their scan sessions
      const { data: leads } = await supabase
        .from('leads')
        .select('id, created_at, scan_timestamp, listing_id')
        .in('listing_id', listingIds)
        .order('created_at', { ascending: false });

      if (!leads || leads.length === 0) {
        setData({
          avgMinutes: 0,
          hotLeads: 0,
          totalLeads: 0,
          timeDistribution: [],
        });
        setLoading(false);
        return;
      }

      // Calculate time-to-lead for each lead
      const timeToLeadData: number[] = [];
      let hotLeadsCount = 0;

      leads.forEach((lead) => {
        if (lead.scan_timestamp && lead.created_at) {
          const scanTime = new Date(lead.scan_timestamp);
          const leadTime = new Date(lead.created_at);
          const diffMs = leadTime.getTime() - scanTime.getTime();
          const diffMinutes = diffMs / (1000 * 60);

          if (diffMinutes >= 0 && diffMinutes < 10080) {
            // Only count if positive and less than 7 days
            timeToLeadData.push(diffMinutes);
            if (isHotLead(scanTime, leadTime)) {
              hotLeadsCount++;
            }
          }
        }
      });

      // Create time distribution buckets
      const buckets = [
        { range: '< 1 hour', min: 0, max: 60 },
        { range: '1-6 hours', min: 60, max: 360 },
        { range: '6-24 hours', min: 360, max: 1440 },
        { range: '1-3 days', min: 1440, max: 4320 },
        { range: '3+ days', min: 4320, max: Infinity },
      ];

      const distribution = buckets.map((bucket) => ({
        range: bucket.range,
        count: timeToLeadData.filter(
          (t) => t >= bucket.min && t < bucket.max
        ).length,
      }));

      setData({
        avgMinutes: calculateAvgTimeToLead(timeToLeadData),
        hotLeads: hotLeadsCount,
        totalLeads: leads.length,
        timeDistribution: distribution,
      });
      setLoading(false);
    }

    fetchTimeToLead();
  }, [listingIds]);

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-8 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      </Card>
    );
  }

  if (!data || data.totalLeads === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Time to Lead
          </h3>
          <p className="text-gray-500 text-center py-8">
            No lead timing data available yet
          </p>
        </div>
      </Card>
    );
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    if (minutes < 1440) {
      return `${Math.round(minutes / 60)} hours`;
    }
    return `${Math.round(minutes / 1440)} days`;
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Time to Lead
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatTime(data.avgMinutes)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Average</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {data.hotLeads}
            </p>
            <p className="text-xs text-gray-500 mt-1">Hot Leads (&lt;1hr)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {((data.hotLeads / data.totalLeads) * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Hot Lead Rate</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Lead Response Time Distribution
          </p>
          {data.timeDistribution.map((item) => {
            const percentage =
              data.totalLeads > 0
                ? (item.count / data.totalLeads) * 100
                : 0;
            return (
              <div key={item.range} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{item.range}</span>
                  <span className="text-gray-600 font-medium">
                    {item.count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

