import { Database } from './database';

export type Listing = Database['public']['Tables']['listings']['Row'];
export type ListingInsert = Database['public']['Tables']['listings']['Insert'];
export type ListingUpdate = Database['public']['Tables']['listings']['Update'];

export interface ListingWithQR extends Listing {
  qrcodes: {
    id: string;
    qr_url: string | null;
    scan_count: number;
  }[];
}

export interface ListingWithStats extends Listing {
  total_scans: number;
  total_leads: number;
}


