export async function POST(request) {
  try {
    const body = await request.json();
    const { leads, type = 'directory' } = body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return Response.json({ error: 'No data' }, { status: 400 });
    }

    const headers = type === 'youtube'
      ? ['Channel Name', 'Website', 'Email', 'Phone', 'Contact Person', 'Subscribers', 'Videos', 'Views', 'Niche', 'Location', 'Country', 'YouTube URL', 'AI Enriched']
      : ['Company Name', 'Website', 'Email', 'Phone', 'Address', 'Contact Person', 'Niche', 'Location', 'Rating', 'Reviews', 'Source'];

    const rows = leads.map(lead => {
      if (type === 'youtube') {
        return [
          lead.channel_name || 'N/A', lead.website || 'N/A', lead.email || 'N/A',
          lead.phone || 'N/A', lead.contact_person || 'N/A', lead.subscriber_count || 0,
          lead.video_count || 0, lead.view_count || 0, lead.niche || 'N/A',
          lead.location || 'N/A', lead.country || 'N/A',
          lead.custom_url || `https://youtube.com/channel/${lead.channel_id}`,
          lead.ai_enriched ? 'Yes' : 'No',
        ];
      } else {
        return [
          lead.company_name || 'N/A', lead.website || 'N/A', lead.email || 'N/A',
          lead.phone || 'N/A', lead.address || 'N/A', lead.contact_person || 'N/A',
          lead.niche || 'N/A', lead.location || 'N/A', lead.rating || 'N/A',
          lead.review_count || 0, lead.source || 'N/A',
        ];
      }
    });

    const csv = [headers.join(','), ...rows.map(r =>
      r.map(c => {
        const s = String(c || '');
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    )].join('\n');

    return Response.json({ success: true, csvContent: csv, rowCount: leads.length });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ status: 'ok', service: 'sheets-export' });
}
