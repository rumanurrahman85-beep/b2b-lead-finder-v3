import { supabaseAdmin, checkYouTubeCache, logSearch } from '../../lib/supabase.js';
import { getYouTubeKey, rotateYouTubeKey } from '../../lib/api-keys.js';
import { extractEmails, extractPhones, normalizeUrl } from '../../lib/utils.js';

const YT_NICHE_MAP = {
  'roofers': ['roofing contractor', 'roof repair', 'roofing company'],
  'plumbers': ['plumbing service', 'plumber', 'drain cleaning'],
  'electricians': ['electrical contractor', 'electrician'],
  'dentists': ['dental clinic', 'dentist', 'orthodontist'],
  'lawyers': ['law firm', 'attorney', 'legal advisor'],
  'doctors': ['medical clinic', 'doctor', 'physician'],
  'restaurants': ['restaurant', 'food business', 'catering'],
  'hotels': ['hotel', 'hospitality', 'resort'],
  'mechanics': ['auto repair', 'mechanic', 'car service'],
  'salons': ['hair salon', 'beauty salon', 'barbershop'],
  'gyms': ['fitness center', 'gym', 'personal trainer'],
  'realtors': ['real estate', 'realtor', 'property agent'],
  'cleaners': ['cleaning service', 'maid service', 'janitorial'],
  'landscapers': ['landscaping', 'lawn care', 'gardening'],
  'painters': ['painting contractor', 'house painter'],
  'coaches': ['business coach', 'life coach', 'consultant'],
  'marketers': ['marketing agency', 'digital marketing', 'SEO'],
  'developers': ['software developer', 'web developer', 'app developer'],
  'designers': ['graphic designer', 'web designer', 'UI UX'],
  'accountants': ['accounting firm', 'accountant', 'CPA'],
};

function expandYouTubeNiche(niche) {
  const clean = niche.toLowerCase().trim();
  return YT_NICHE_MAP[clean] || [clean, `${clean} business`];
}

async function fetchYouTubeChannels(query, location, maxResults) {
  const key = getYouTubeKey();
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${key}`;

  const searchRes = await fetch(searchUrl, { next: { revalidate: 0 } });
  if (!searchRes.ok) {
    if (searchRes.status === 403) {
      rotateYouTubeKey();
      return fetchYouTubeChannels(query, location, maxResults);
    }
    throw new Error(`YouTube API error: ${searchRes.status}`);
  }

  const searchData = await searchRes.json();
  const items = searchData.items || [];
  if (items.length === 0) return [];

  const channelIds = items.map(i => i.snippet?.channelId || i.id?.channelId).filter(Boolean);
  if (channelIds.length === 0) return [];

  const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelIds.join(',')}&key=${key}`;
  const statsRes = await fetch(statsUrl, { next: { revalidate: 0 } });
  if (!statsRes.ok) throw new Error(`YouTube Stats API error: ${statsRes.status}`);

  const statsData = await statsRes.json();
  const statsMap = {};
  for (const ch of statsData.items || []) statsMap[ch.id] = ch;

  const enriched = [];
  for (const item of items) {
    const cid = item.snippet?.channelId || item.id?.channelId;
    const stats = statsMap[cid];
    if (!stats) continue;

    const snippet = stats.snippet || {};
    const stat = stats.statistics || {};
    const brand = stats.brandingSettings || {};
    const ch = brand.channel || {};

    let website = null;
    const desc = snippet.description || '';
    const urls = desc.match(/(https?:\/\/[^\s]+)/g);
    if (urls && urls.length > 0) website = normalizeUrl(urls[0]);

    enriched.push({
      channel_id: cid,
      channel_name: snippet.title || 'Unknown',
      description: desc,
      website: website,
      custom_url: snippet.customUrl ? `https://youtube.com/@${snippet.customUrl}` : null,
      thumbnail_url: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url,
      subscriber_count: parseInt(stat.subscriberCount) || 0,
      video_count: parseInt(stat.videoCount) || 0,
      view_count: parseInt(stat.viewCount) || 0,
      country: snippet.country || location || null,
      published_at: snippet.publishedAt,
    });
  }

  return enriched;
}

export async function POST(request) {
  const start = Date.now();
  try {
    const body = await request.json();
    const { niche, location, maxResults = 10, smartExpand = true } = body;

    if (!niche) {
      return Response.json({ error: 'Niche is required' }, { status: 400 });
    }

    const cleanNiche = niche.trim().toLowerCase();
    const cleanLocation = location ? location.trim().toLowerCase() : null;

    // Check cache
    const cached = await checkYouTubeCache(cleanNiche, cleanLocation);
    if (cached && cached.length > 0) {
      await logSearch('youtube', cleanNiche, cleanLocation, cached.length, 'cache', Date.now() - start);
      return Response.json({ success: true, source: 'cache', data: cached, count: cached.length });
    }

    // Build queries
    const queries = smartExpand ? expandYouTubeNiche(cleanNiche) : [cleanNiche];
    const searchQueries = cleanLocation
      ? queries.slice(0, 3).map(q => `${q} ${cleanLocation}`)
      : queries.slice(0, 3);

    let allChannels = [];
    for (const q of searchQueries) {
      try {
        const channels = await fetchYouTubeChannels(q, cleanLocation, Math.ceil(maxResults / 2));
        allChannels = [...allChannels, ...channels];
        const seen = new Set();
        allChannels = allChannels.filter(c => { if (seen.has(c.channel_id)) return false; seen.add(c.channel_id); return true; });
        if (allChannels.length >= maxResults) break;
      } catch (e) {
        // Continue to next query
      }
    }

    if (allChannels.length === 0) {
      await logSearch('youtube', cleanNiche, cleanLocation, 0, 'youtube_empty', Date.now() - start);
      return Response.json({ success: true, source: 'api', data: [], count: 0 });
    }

    // Enrich with website scraping
    const processed = [];
    for (const channel of allChannels.slice(0, maxResults)) {
      let email = null;
      let phone = null;
      let contactPerson = null;
      let socialMedia = {};

      if (channel.website) {
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 2000);
          const res = await fetch(channel.website, {
            signal: ctrl.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          });
          clearTimeout(tid);
          const html = await res.text();
          email = extractEmails(html);
          phone = extractPhones(html);

          const patterns = {
            facebook: /facebook\.com\/[^"'\s<>]+/i,
            instagram: /instagram\.com\/[^"'\s<>]+/i,
            twitter: /twitter\.com\/[^"'\s<>]+/i,
            linkedin: /linkedin\.com\/[^"'\s<>]+/i,
          };
          for (const [p, r] of Object.entries(patterns)) {
            const m = html.match(r);
            if (m) socialMedia[p] = 'https://' + m[0];
          }

          const nm = html.match(/Contact\s*:?\s*([A-Z][a-z]+\s[A-Z][a-z]+)/i) ||
                     html.match(/Owner\s*:?\s*([A-Z][a-z]+\s[A-Z][a-z]+)/i);
          if (nm) contactPerson = nm[1];
        } catch (e) {
          // Skip
        }
      }

      if (!email && channel.description) email = extractEmails(channel.description);
      if (!phone && channel.description) phone = extractPhones(channel.description);

      const newLead = {
        channel_id: channel.channel_id,
        channel_name: channel.channel_name,
        description: channel.description || 'N/A',
        website: channel.website || 'N/A',
        email: email || 'N/A',
        phone: phone || 'N/A',
        contact_person: contactPerson || 'N/A',
        social_media: socialMedia,
        subscriber_count: channel.subscriber_count,
        video_count: channel.video_count,
        view_count: channel.view_count,
        niche: cleanNiche,
        location: cleanLocation || 'N/A',
        country: channel.country || 'N/A',
        thumbnail_url: channel.thumbnail_url,
        custom_url: channel.custom_url,
        published_at: channel.published_at,
        ai_enriched: false,
        gemini_analysis: null,
        source: 'youtube_api',
      };

      if (supabaseAdmin) {
        try {
          await supabaseAdmin.from('youtube_leads').upsert(newLead, { onConflict: 'channel_id' });
        } catch (e) {
          // Skip
        }
      }

      processed.push(newLead);
    }

    await logSearch('youtube', cleanNiche, cleanLocation, processed.length, 'youtube_api', Date.now() - start);
    return Response.json({ success: true, source: 'api', data: processed, count: processed.length });

  } catch (err) {
    return Response.json({ error: err.message, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ status: 'ok', service: 'youtube-search' });
}
