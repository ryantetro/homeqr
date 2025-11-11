-- Add additional property detail fields to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS lot_size text,
ADD COLUMN IF NOT EXISTS year_built integer,
ADD COLUMN IF NOT EXISTS property_type text,
ADD COLUMN IF NOT EXISTS property_subtype text,
ADD COLUMN IF NOT EXISTS features text, -- JSON array of features
ADD COLUMN IF NOT EXISTS interior_features text, -- JSON array
ADD COLUMN IF NOT EXISTS exterior_features text, -- JSON array
ADD COLUMN IF NOT EXISTS parking_spaces integer,
ADD COLUMN IF NOT EXISTS garage_spaces integer,
ADD COLUMN IF NOT EXISTS stories integer,
ADD COLUMN IF NOT EXISTS heating text,
ADD COLUMN IF NOT EXISTS cooling text,
ADD COLUMN IF NOT EXISTS flooring text,
ADD COLUMN IF NOT EXISTS fireplace_count integer,
ADD COLUMN IF NOT EXISTS hoa_fee numeric,
ADD COLUMN IF NOT EXISTS tax_assessed_value numeric,
ADD COLUMN IF NOT EXISTS annual_tax_amount numeric,
ADD COLUMN IF NOT EXISTS price_per_sqft numeric,
ADD COLUMN IF NOT EXISTS zestimate numeric,
ADD COLUMN IF NOT EXISTS days_on_market integer,
ADD COLUMN IF NOT EXISTS listing_date date;

-- Add index for property type searches
CREATE INDEX IF NOT EXISTS listings_property_type_idx ON public.listings(property_type) WHERE property_type IS NOT NULL;

-- Add index for year built searches
CREATE INDEX IF NOT EXISTS listings_year_built_idx ON public.listings(year_built) WHERE year_built IS NOT NULL;

