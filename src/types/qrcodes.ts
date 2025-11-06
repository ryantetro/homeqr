import { Database } from './database';

export type QRCode = Database['public']['Tables']['qrcodes']['Row'];
export type QRCodeInsert = Database['public']['Tables']['qrcodes']['Insert'];
export type QRCodeUpdate = Database['public']['Tables']['qrcodes']['Update'];


