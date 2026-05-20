import { supabaseAdmin, checkDirectoryCache, logSearch } from '../../lib/supabase.js';
import { getSerpApiKey, rotateSerpApiKey } from '../../lib/api-keys.js';
import { extractEmails, extractPhones, normalizeUrl, safeFetch } from '../../lib/utils.js';

const NICHE_MAP = {
  'roofers': ['roofing', 'roof repair', 'roofing contractor'],
  'plumbers': ['plumbing', 'plumber', 'drain cleaning'],
  'electricians': ['electrical', 'electrician', 'wiring'],
  'dentists': ['dental', 'dentist', 'dental clinic'],
  'lawyers': ['attorney', 'law firm', 'legal'],
  'doctors': ['medical', 'physician', 'clinic'],
  'restaurants': ['restaurant', 'food', 'dining'],
  'hotels': ['hotel', 'motel', 'lodging'],
  'mechanics': ['auto repair', 'mechanic', 'car service'],
  'salons': ['hair salon', 'beauty salon', 'spa'],
  'gyms': ['fitness', 'gym', 'trainer'],
  'realtors': ['real estate', 'realtor', 'property'],
  'cleaners': ['cleaning', 'maid', 'janitorial'],
  'landscapers': ['landscaping', 'lawn care', 'gardening'],
  'painters': ['painting', 'painter', 'paint contractor'],
  'coaches': ['business coach', 'life coach', 'consultant'],
  'marketers': ['marketing', 'digital marketing', 'SEO'],
  'developers': ['software', 'web developer', 'app developer'],
  'designers': ['graphic design', 'web design', 'UI UX'],
  'accountants': ['accounting', 'accountant', 'CPA'],
};

function expandNiche(niche) {
  const clean = niche.toLowerCase().trim();
  return NICHE_MAP[clean] || [clean];
}

export async function POST(request) {
  const start = Date.now();
  try {
    const body = await request.json();
    const { niche, location, smartExpand = true } = body;

    if (!niche || !location) {
      return Response.json({ error: 'Niche and Location required' }, { status: 400 });
    }

    const cleanNiche = niche.trim().toLowerCase();
    const cleanLocation = location.trim().toLowerCase();

    // Check cache
    const cached = await checkDirectoryCache(cleanNiche, cleanLocation);
    if (cached && cached.length > 0) {
      await logSearch('directory', cleanNiche, cleanLocation, cached.length, 'cache', Date.now() - start);
      return Response.json({ success: true, source: 'cache', data: cached, count: cached.length });
    }

    // Fetch from SerpApi with key rotation
    let serpData = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !serpData) {
      try {
        const key = getSerpApiKey();
        const query = `${cleanNiche} ${cleanLocation}`;
        const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&api_key=${key}&num=10`;
        const res = await fetch(url, { next: { revalidate: 0 } });
        if (res.ok) {
          serpData = await res.json();
          break;
        } else if (res.status === 429 || res.status === 403) {
          rotateSerpApiKey();
          attempts++;
        } else {
          break;
        }
      } catch (e) {
        attempts++;
        if (attempts < maxAttempts) rotateSerpApiKey();
      }
    }

    if (!serpData || !serpData.local_results) {
      await logSearch('directory', cleanNiche, cleanLocation, 0, 'serpapi_empty', Date.now() - start);
      return Response.json({ success: true, source: 'api', data: [], count: 0 });
    }

    const results = serpData.local_results.slice(0, 8);
    const processed = [];

    for (const lead of results) {
      let email = null;
      let phone = lead.phone || null;
      let contactPerson = null;
      let socialMedia = {};
      const website = normalizeUrl(lead.website);

      if (website) {
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 2000);
          const pageRes = await fetch(website, {
            signal: ctrl.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          });
          clearTimeout(tid);
          const html = await pageRes.text();
          email = extractEmails(html);
          if (!phone) phone = extractPhones(html);

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
          // Skip scraping errors
        }
      }

      const newLead = {
        company_name: lead.title || 'Unknown',
        website: website || 'N/A',
        email: email || 'N/A',
        phone: phone || lead.phone || 'N/A',
        address: lead.address || 'N/A',
        niche: cleanNiche,
        location: cleanLocation,
        contact_person: contactPerson || 'N/A',
        social_media: socialMedia,
        rating: lead.rating || null,
        review_count: lead.reviews || 0,
        source: 'serpapi',
      };

      if (website && website !== 'N/A' && supabaseAdmin) {
        try {
          await supabaseAdmin.from('directory_leads').upsert(newLead, { onConflict: 'website' });
        } catch (e) {
          // Skip upsert errors
        }
      }

      processed.push(newLead);
    }

    await logSearch('directory', cleanNiche, cleanLocation, processed.length, 'serpapi', Date.now() - start);
    return Response.json({ success: true, source: 'api', data: processed, count: processed.length });

  } catch (err) {
    return Response.json({ error: err.message, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ status: 'ok', service: 'directory-search' });
}
