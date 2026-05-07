import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const hasSupabaseClientConfig = Boolean(supabaseUrl && supabaseAnonKey);

export async function uploadComplaintPhoto(file: File) {
  if (!supabase || !supabaseUrl) {
    throw new Error('Missing Supabase client configuration');
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `web/${Date.now()}_${safeName}`;
  const { error } = await supabase.storage
    .from('complaint-photos')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    throw new Error(`Photo upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from('complaint-photos').getPublicUrl(path);
  return data.publicUrl;
}
