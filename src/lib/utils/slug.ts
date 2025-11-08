/**
 * Converts an address string to a URL-friendly slug
 * Example: "123 Main St" -> "123-Main-St"
 */
export function generateSlug(address: string): string {
  if (!address) {
    throw new Error('Address is required to generate slug');
  }

  return address
    .toLowerCase()
    .trim()
    // Replace common address abbreviations
    .replace(/\b(street|st)\b/g, 'St')
    .replace(/\b(avenue|ave)\b/g, 'Ave')
    .replace(/\b(road|rd)\b/g, 'Rd')
    .replace(/\b(drive|dr)\b/g, 'Dr')
    .replace(/\b(lane|ln)\b/g, 'Ln')
    .replace(/\b(court|ct)\b/g, 'Ct')
    .replace(/\b(place|pl)\b/g, 'Pl')
    .replace(/\b(boulevard|blvd)\b/g, 'Blvd')
    .replace(/\b(parkway|pkwy)\b/g, 'Pkwy')
    // Remove special characters except spaces and hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Replace spaces with hyphens
    .replace(/\s/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Capitalize first letter of each word
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

/**
 * Generates a unique slug by appending a number if the slug already exists
 */
export async function generateUniqueSlug(
  address: string,
  checkExists: (slug: string) => Promise<boolean>,
  maxAttempts: number = 10
): Promise<string> {
  const baseSlug = generateSlug(address);
  let slug = baseSlug;
  let attempt = 0;

  while (attempt < maxAttempts) {
    const exists = await checkExists(slug);
    if (!exists) {
      return slug;
    }
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  // Fallback to timestamp if all attempts fail
  return `${baseSlug}-${Date.now()}`;
}

