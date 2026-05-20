import { getGeminiKey } from '../../lib/api-keys.js';
import { supabaseAdmin } from '../../lib/supabase.js';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function callGemini(prompt) {
  const key = getGeminiKey();
  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    }),
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { channelId, channelName, description, website, niche } = body;

    if (!channelId) return Response.json({ error: 'Channel ID required' }, { status: 400 });

    const prompt = `Analyze this YouTube channel and extract business contact info. Return ONLY valid JSON:

Channel: ${channelName || 'Unknown'}
Description: ${description || 'None'}
Website: ${website || 'None'}
Niche: ${niche || 'General'}

Return JSON:
{
  "contact_person": "name or null",
  "business_email": "email or null",
  "business_phone": "phone or null",
  "business_type": "type",
  "target_audience": "audience",
  "services": ["service1"],
  "social_media": {"instagram":"url","twitter":"url","facebook":"url","linkedin":"url"},
  "location": "location or null",
  "confidence_score": "High/Medium/Low",
  "analysis_summary": "brief summary"
}`;

    const text = await callGemini(prompt);

    let analysis;
    try {
      const match = text.match(/\{[\s\S]*\}/);
      analysis = match ? JSON.parse(match[0]) : JSON.parse(text);
    } catch {
      analysis = {
        contact_person: null, business_email: null, business_phone: null,
        business_type: 'Unknown', target_audience: 'General', services: [],
        social_media: {}, location: null, confidence_score: 'Low',
        analysis_summary: text.substring(0, 200),
      };
    }

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('youtube_leads').update({
          ai_enriched: true,
          gemini_analysis: JSON.stringify(analysis),
          contact_person: analysis.contact_person || null,
          email: analysis.business_email || null,
          phone: analysis.business_phone || null,
          location: analysis.location || null,
          social_media: analysis.social_media || {},
        }).eq('channel_id', channelId);
      } catch (e) {
        // Skip
      }
    }

    return Response.json({ success: true, channelId, analysis });

  } catch (err) {
    return Response.json({ error: err.message, code: 'GEMINI_ERROR' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ status: 'ok', service: 'gemini-enrichment' });
}
