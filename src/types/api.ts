// API request and response types

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateListingRequest {
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: number;
  description?: string;
  image_url?: string;
  mls_id?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
}

export interface UpdateListingRequest extends Partial<CreateListingRequest> {
  id: string;
}

export interface GenerateQRRequest {
  listing_id: string;
  redirect_url?: string;
}

export interface GenerateQRResponse {
  id: string;
  qr_url: string;
  listing_id: string;
  scan_count: number;
}

export interface LeadSubmissionRequest {
  listing_id: string;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
}

export interface LeadSubmissionResponse {
  id: string;
  listing_id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
}




