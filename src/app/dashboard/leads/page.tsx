'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import LeadTable from '@/components/leads/LeadTable';
import Card from '@/components/ui/Card';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's listings
      const { data: listings } = await supabase
        .from('listings')
        .select('id')
        .eq('user_id', user.id);

      const listingIds = listings?.map((l) => l.id) || [];

      // Get all leads for user's listings
      const { data: leadsData } = listingIds.length > 0
        ? await supabase
            .from('leads')
            .select(`
              *,
              listings (
                id,
                address,
                city,
                state
              )
            `)
            .in('listing_id', listingIds)
            .order('created_at', { ascending: false })
        : { data: [] };

      // Format leads with listing info
      const formattedLeads = (leadsData || []).map((lead: any) => ({
        ...lead,
        listing_address: lead.listings?.address || 'Unknown',
        listing_city: lead.listings?.city,
        listing_state: lead.listings?.state,
      }));

      setLeads(formattedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="mt-2 text-gray-600">
            Manage and track all leads from your properties
          </p>
        </div>
        <Card>
          <div className="p-6">
            <div className="text-center py-12">
              <p className="text-gray-600">Loading leads...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
        <p className="mt-2 text-gray-600">
          Manage and track all leads from your properties
        </p>
      </div>

      <Card>
        <div className="p-6">
          <LeadTable leads={leads} onRefresh={fetchLeads} />
        </div>
      </Card>
    </div>
  );
}

