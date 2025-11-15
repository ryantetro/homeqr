// Database type definitions for HomeQR

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          brokerage: string | null;
          avatar_url: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          brokerage?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          brokerage?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      listings: {
        Row: {
          id: string;
          user_id: string;
          address: string;
          city: string | null;
          state: string | null;
          zip: string | null;
          price: number | null;
          description: string | null;
          image_url: string | null;
          mls_id: string | null;
          bedrooms: number | null;
          bathrooms: number | null;
          square_feet: number | null;
          status: string;
          created_at: string;
          updated_at: string;
          // AI enhancement fields
          ai_description: string | null;
          ai_key_features: string | null;
          ai_lifestyle_summary: string | null;
          ai_social_caption: string | null;
          ai_enhanced_at: string | null;
          ai_enhancement_status: string | null;
          // Additional property detail fields (from previous migrations)
          url: string | null;
          slug: string | null;
          property_type: string | null;
          property_subtype: string | null;
          year_built: number | null;
          lot_size: string | null;
          features: string | null;
          interior_features: string | null;
          exterior_features: string | null;
          parking_spaces: number | null;
          garage_spaces: number | null;
          stories: number | null;
          heating: string | null;
          cooling: string | null;
          flooring: string | null;
          fireplace_count: number | null;
          hoa_fee: number | null;
          tax_assessed_value: number | null;
          annual_tax_amount: number | null;
          price_per_sqft: number | null;
          zestimate: number | null;
          days_on_market: number | null;
          listing_date: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          address: string;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          price?: number | null;
          description?: string | null;
          image_url?: string | null;
          mls_id?: string | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          square_feet?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          // AI enhancement fields
          ai_description?: string | null;
          ai_key_features?: string | null;
          ai_lifestyle_summary?: string | null;
          ai_social_caption?: string | null;
          ai_enhanced_at?: string | null;
          ai_enhancement_status?: string | null;
          // Additional property detail fields
          url?: string | null;
          slug?: string | null;
          property_type?: string | null;
          property_subtype?: string | null;
          year_built?: number | null;
          lot_size?: string | null;
          features?: string | null;
          interior_features?: string | null;
          exterior_features?: string | null;
          parking_spaces?: number | null;
          garage_spaces?: number | null;
          stories?: number | null;
          heating?: string | null;
          cooling?: string | null;
          flooring?: string | null;
          fireplace_count?: number | null;
          hoa_fee?: number | null;
          tax_assessed_value?: number | null;
          annual_tax_amount?: number | null;
          price_per_sqft?: number | null;
          zestimate?: number | null;
          days_on_market?: number | null;
          listing_date?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          address?: string;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          price?: number | null;
          description?: string | null;
          image_url?: string | null;
          mls_id?: string | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          square_feet?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          // AI enhancement fields
          ai_description?: string | null;
          ai_key_features?: string | null;
          ai_lifestyle_summary?: string | null;
          ai_social_caption?: string | null;
          ai_enhanced_at?: string | null;
          ai_enhancement_status?: string | null;
          // Additional property detail fields
          url?: string | null;
          slug?: string | null;
          property_type?: string | null;
          property_subtype?: string | null;
          year_built?: number | null;
          lot_size?: string | null;
          features?: string | null;
          interior_features?: string | null;
          exterior_features?: string | null;
          parking_spaces?: number | null;
          garage_spaces?: number | null;
          stories?: number | null;
          heating?: string | null;
          cooling?: string | null;
          flooring?: string | null;
          fireplace_count?: number | null;
          hoa_fee?: number | null;
          tax_assessed_value?: number | null;
          annual_tax_amount?: number | null;
          price_per_sqft?: number | null;
          zestimate?: number | null;
          days_on_market?: number | null;
          listing_date?: string | null;
        };
      };
      qrcodes: {
        Row: {
          id: string;
          listing_id: string;
          qr_url: string | null;
          scan_count: number;
          redirect_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          qr_url?: string | null;
          scan_count?: number;
          redirect_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          qr_url?: string | null;
          scan_count?: number;
          redirect_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          listing_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          message: string | null;
          source: string;
          scan_timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          message?: string | null;
          source?: string;
          scan_timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          message?: string | null;
          source?: string;
          scan_timestamp?: string;
          created_at?: string;
        };
      };
      analytics: {
        Row: {
          id: number;
          listing_id: string;
          date: string;
          total_scans: number;
          total_leads: number;
          unique_visitors: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          listing_id: string;
          date: string;
          total_scans?: number;
          total_leads?: number;
          unique_visitors?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          listing_id?: string;
          date?: string;
          total_scans?: number;
          total_leads?: number;
          unique_visitors?: number;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: string;
          plan: string;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string;
          plan?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string;
          plan?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}




