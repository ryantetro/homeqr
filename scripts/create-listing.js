// Script to create a mock listing directly using Supabase
// Run: node scripts/create-listing.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  }
}

loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const USER_ID = '61302292-e236-4db3-bea8-08c82be3e4ba';

const mockListing = {
  user_id: USER_ID,
  address: '123 Main Street',
  city: 'Salt Lake City',
  state: 'UT',
  zip: '84101',
  price: 450000,
  description: 'Beautiful modern home in the heart of downtown. Features include hardwood floors, updated kitchen, and spacious backyard. Perfect for families or professionals looking for a move-in ready home.',
  bedrooms: 3,
  bathrooms: 2.5,
  square_feet: 1800,
  mls_id: 'MLS-12345',
  image_url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
  status: 'active',
};

async function createListing() {
  console.log('Creating listing...');
  console.log('Listing data:', JSON.stringify(mockListing, null, 2));

  const { data, error } = await supabase
    .from('listings')
    .insert(mockListing)
    .select()
    .single();

  if (error) {
    console.error('Error creating listing:', error);
    process.exit(1);
  }

  console.log('\n✅ Listing created successfully!');
  console.log('\nListing ID:', data.id);
  console.log('\nFull listing data:');
  console.log(JSON.stringify(data, null, 2));
  
  return data;
}

createListing().catch(console.error);

