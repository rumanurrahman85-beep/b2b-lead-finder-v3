import { supabaseAdmin } from '../../lib/supabase.js';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return Response.json({
        success: true,
        stats: { totalDirectory: 0, totalYouTube: 0, totalLeads: 0, todayDirectory: 0, todayYouTube: 0, aiEnriched: 0 },
        recentActivity: [],
      });
    }

    const today = new Date().toISOString().split('T')[0];

    const { count: dirCount } = await supabaseAdmin.from('directory_leads').select('*', { count: 'exact', head: true });
    const { count: ytCount } = await supabaseAdmin.from('youtube_leads').select('*', { count: 'exact', head: true });
    const { count: enrichedCount } = await supabaseAdmin.from('youtube_leads').select('*', { count: 'exact', head: true }).eq('ai_enriched', true);
    const { count: todayDir } = await supabaseAdmin.from('directory_leads').select('*', { count: 'exact', head: true }).gte('created_at', today);
    const { count: todayYt } = await supabaseAdmin.from('youtube_leads').select('*', { count: 'exact', head: true }).gte('created_at', today);

    const { data: recentSearches } = await supabaseAdmin.from('search_logs').select('*').order('created_at', { ascending: false }).limit(10);

    return Response.json({
      success: true,
      stats: {
        totalDirectory: dirCount || 0,
        totalYouTube: ytCount || 0,
        totalLeads: (dirCount || 0) + (ytCount || 0),
        todayDirectory: todayDir || 0,
        todayYouTube: todayYt || 0,
        aiEnriched: enrichedCount || 0,
      },
      recentActivity: recentSearches || [],
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
