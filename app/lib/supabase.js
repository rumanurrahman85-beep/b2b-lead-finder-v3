import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create admin client safely
let supabaseAdmin;
try {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} catch (e) {
  console.error('Supabase admin init error:', e.message);
  supabaseAdmin = null;
}

// Create public client safely
let supabaseClient;
try {
  supabaseClient = createClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
} catch (e) {
  console.error('Supabase client init error:', e.message);
  supabaseClient = null;
}

export { supabaseAdmin, supabaseClient };

// Cache helpers with null checks
export async function checkDirectoryCache(niche, location) {
  if (!supabaseAdmin) return null;
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from('directory_leads')
      .select('*')
      .eq('niche', niche.toLowerCase().trim())
      .eq('location', location.toLowerCase().trim())
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false });
    if (error) return null;
    return data && data.length > 0 ? data : null;
  } catch (e) {
    return null;
  }
}

export async function checkYouTubeCache(niche, location) {
  if (!supabaseAdmin) return null;
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let query = supabaseAdmin
      .from('youtube_leads')
      .select('*')
      .eq('niche', niche.toLowerCase().trim())
      .gte('created_at', oneDayAgo);
    if (location && location.trim()) {
      query = query.ilike('location', `%${location.trim()}%`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return null;
    return data && data.length > 0 ? data : null;
  } catch (e) {
    return null;
  }
}

export async function logSearch(searchType, niche, location, resultsCount, source, durationMs, success = true, errorMsg = null) {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from('search_logs').insert({
      search_type: searchType,
      niche: niche.toLowerCase().trim(),
      location: location ? location.toLowerCase().trim() : null,
      results_count: resultsCount,
      source_used: source,
      duration_ms: durationMs,
      success,
      error_message: errorMsg,
    });
  } catch (e) {
    // Silently fail logging
  }
}
