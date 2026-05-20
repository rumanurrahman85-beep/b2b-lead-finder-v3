'use client';

import { useState } from 'react';
import { Search, Download, Loader2, Youtube, Globe, Mail, Phone, User, ExternalLink, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Sparkles, Users, Play, Eye, Brain, BarChart3 } from 'lucide-react';
import { exportToCSV, formatNumber } from '../lib/utils.js';

export default function YouTubeSearch() {
  const [niche, setNiche] = useState('');
  const [location, setLocation] = useState('');
  const [smartExpand, setSmartExpand] = useState(true);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [enrichingId, setEnrichingId] = useState(null);
  const [history, setHistory] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!niche) return;
    setLoading(true);
    setLeads([]);
    setSource('');
    setError(null);
    setStatus('Searching YouTube channels...');

    try {
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, location, maxResults: 10, smartExpand }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setLeads(result.data || []);
        setSource(result.source || 'api');
        setHistory(prev => [{ niche, location: location || 'Global', count: result.count, source: result.source, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
      } else {
        setError(result.error || 'Search failed');
      }
    } catch {
      setError('Failed to connect to YouTube API');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleEnrich = async (channelId) => {
    setEnrichingId(channelId);
    const lead = leads.find(l => l.channel_id === channelId);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, channelName: lead.channel_name, description: lead.description, website: lead.website, niche: lead.niche }),
      });
      const result = await res.json();
      if (result.success) {
        setLeads(prev => prev.map(l => l.channel_id === channelId ? { ...l, ai_enriched: true, gemini_analysis: JSON.stringify(result.analysis), ...result.analysis } : l));
      }
    } catch (e) {
      console.error('Enrichment error:', e);
    } finally {
      setEnrichingId(null);
    }
  };

  const handleExport = () => {
    if (leads.length === 0) return;
    exportToCSV(leads, `youtube_${niche}_${location || 'global'}_${Date.now()}.csv`);
  };

  const toggleRow = (idx) => setExpandedRow(expandedRow === idx ? null : idx);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-surface-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
            <Youtube className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-900">YouTube Intelligence</h2>
            <p className="text-sm text-surface-500">Find business leads from YouTube channels</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-700">Channel Niche</label>
              <input type="text" placeholder="e.g., Business Coach, Marketing Agency..." value={niche} onChange={e => setNiche(e.target.value)}
                className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-surface-900 placeholder-surface-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-700">Location (Optional)</label>
              <input type="text" placeholder="e.g., USA, UK..." value={location} onChange={e => setLocation(e.target.value)}
                className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-surface-900 placeholder-surface-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={smartExpand} onChange={e => setSmartExpand(e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-red-600 focus:ring-red-500" />
              <span className="text-sm text-surface-600">Smart niche expansion</span>
            </label>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-surface-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-red-500/20">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Youtube className="w-5 h-5" />}
              {loading ? 'Searching...' : 'Search YouTube'}
            </button>
          </div>
        </form>
      </div>

      {status && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">{status}</span>
        </div>
      )}

      {source && !loading && (
        <div className="flex items-center gap-3">
          {source === 'cache' ? <span className="badge badge-purple"><CheckCircle className="w-3 h-3" /> From Cache</span>
            : <span className="badge badge-info"><Youtube className="w-3 h-3" /> Fresh Search</span>}
          {leads.length > 0 && <span className="badge badge-success"><CheckCircle className="w-3 h-3" /> {leads.length} channels</span>}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {history.length > 0 && !loading && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-surface-500 font-medium">Recent:</span>
          {history.map((h, i) => (
            <button key={i} onClick={() => { setNiche(h.niche); setLocation(h.location === 'Global' ? '' : h.location); }}
              className="text-xs bg-surface-100 hover:bg-surface-200 text-surface-600 px-2.5 py-1 rounded-full transition">
              {h.niche} {h.location !== 'Global' ? `in ${h.location}` : ''}
            </button>
          ))}
        </div>
      )}

      {leads.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-surface-100">
            <div>
              <h3 className="font-semibold text-surface-900">Channel Results</h3>
              <p className="text-sm text-surface-500">{leads.length} channels found</p>
            </div>
            <button onClick={handleExport}
              className="flex items-center gap-2 bg-surface-800 hover:bg-surface-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-lg">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          <div className="divide-y divide-surface-100">
            {leads.map((lead, idx) => (
              <div key={lead.channel_id} className="animate-fade-in">
                <div className="p-5 cursor-pointer hover:bg-surface-50/50 transition" onClick={() => toggleRow(idx)}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {lead.thumbnail_url ? (
                        <img src={lead.thumbnail_url} alt={lead.channel_name} className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-red-100 flex items-center justify-center">
                          <Youtube className="w-8 h-8 text-red-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-surface-900 text-sm">{lead.channel_name}</h4>
                          <p className="text-xs text-surface-500 mt-1 line-clamp-2">{lead.description !== 'N/A' ? lead.description : 'No description'}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          {lead.ai_enriched && <span className="badge badge-purple"><Sparkles className="w-3 h-3" /> AI Enriched</span>}
                          {expandedRow === idx ? <ChevronUp className="w-4 h-4 text-surface-400" /> : <ChevronDown className="w-4 h-4 text-surface-400" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1 text-xs text-surface-600"><Users className="w-3.5 h-3.5 text-red-500" />{formatNumber(lead.subscriber_count)} subs</span>
                        <span className="flex items-center gap-1 text-xs text-surface-600"><Play className="w-3.5 h-3.5 text-accent-500" />{formatNumber(lead.video_count)} videos</span>
                        <span className="flex items-center gap-1 text-xs text-surface-600"><Eye className="w-3.5 h-3.5 text-green-500" />{formatNumber(lead.view_count)} views</span>
                        {lead.country !== 'N/A' && <span className="flex items-center gap-1 text-xs text-surface-600"><Globe className="w-3.5 h-3.5 text-primary-500" />{lead.country}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {lead.email !== 'N/A' && <span className="flex items-center gap-1 text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-md"><Mail className="w-3 h-3" />{lead.email}</span>}
                        {lead.phone !== 'N/A' && <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md"><Phone className="w-3 h-3" />{lead.phone}</span>}
                        {lead.website !== 'N/A' && <span className="flex items-center gap-1 text-xs text-surface-600 bg-surface-100 px-2 py-1 rounded-md"><ExternalLink className="w-3 h-3" />Website</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {expandedRow === idx && (
                  <div className="px-5 pb-5 bg-surface-50/50 border-t border-surface-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-surface-500 uppercase flex items-center gap-2"><Mail className="w-3.5 h-3.5" />Contact</h4>
                        <div className="space-y-2">
                          {lead.email !== 'N/A' ? <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition"><Mail className="w-4 h-4" />{lead.email}</a> : <p className="text-sm text-surface-400 italic">No email</p>}
                          {lead.phone !== 'N/A' ? <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition"><Phone className="w-4 h-4" />{lead.phone}</a> : <p className="text-sm text-surface-400 italic">No phone</p>}
                          {lead.contact_person !== 'N/A' ? <div className="flex items-center gap-2 text-sm text-surface-700"><User className="w-4 h-4 text-accent-500" />{lead.contact_person}</div> : <p className="text-sm text-surface-400 italic">No contact person</p>}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-surface-500 uppercase flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5" />Stats</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-surface-500">Subscribers</span><span className="font-semibold text-surface-900">{formatNumber(lead.subscriber_count)}</span></div>
                          <div className="flex justify-between"><span className="text-surface-500">Videos</span><span className="font-semibold text-surface-900">{formatNumber(lead.video_count)}</span></div>
                          <div className="flex justify-between"><span className="text-surface-500">Views</span><span className="font-semibold text-surface-900">{formatNumber(lead.view_count)}</span></div>
                          <div className="flex justify-between"><span className="text-surface-500">Niche</span><span className="font-semibold text-surface-900">{lead.niche}</span></div>
                          <div className="flex justify-between"><span className="text-surface-500">Location</span><span className="font-semibold text-surface-900">{lead.location}</span></div>
                          {lead.published_at && <div className="flex justify-between"><span className="text-surface-500">Created</span><span className="font-semibold text-surface-900">{new Date(lead.published_at).toLocaleDateString()}</span></div>}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-surface-500 uppercase flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" />AI & Actions</h4>
                        {!lead.ai_enriched && (
                          <button onClick={e => { e.stopPropagation(); handleEnrich(lead.channel_id); }} disabled={enrichingId === lead.channel_id}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-lg">
                            {enrichingId === lead.channel_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                            {enrichingId === lead.channel_id ? 'Analyzing...' : 'AI Enrich with Gemini'}
                          </button>
                        )}
                        {lead.ai_enriched && lead.gemini_analysis && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <p className="text-xs text-purple-700 font-medium mb-1">AI Analysis:</p>
                            <p className="text-xs text-purple-600">{(() => { try { const a = JSON.parse(lead.gemini_analysis); return a.analysis_summary || a.business_type || 'Analysis complete'; } catch { return lead.gemini_analysis.substring(0, 100); } })()}</p>
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          {lead.custom_url && <a href={lead.custom_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-red-50 text-red-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-100 transition"><Youtube className="w-4 h-4" />Visit Channel</a>}
                          {lead.website !== 'N/A' && <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-surface-100 text-surface-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-surface-200 transition"><ExternalLink className="w-4 h-4" />Visit Website</a>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && leads.length === 0 && !error && (
        <div className="bg-white rounded-2xl shadow-sm border border-surface-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Youtube className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-surface-700 mb-2">YouTube Intelligence</h3>
          <p className="text-sm text-surface-500 max-w-md mx-auto">Search for YouTube channels in your niche to find business leads.</p>
        </div>
      )}
    </div>
  );
}
