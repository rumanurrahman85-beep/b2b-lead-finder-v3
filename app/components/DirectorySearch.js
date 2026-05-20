'use client';

import { useState } from 'react';
import { Search, Download, Loader2, Database, Globe, Star, MapPin, Phone, Mail, User, ExternalLink, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import { exportToCSV } from '../lib/utils.js';

export default function DirectorySearch() {
  const [niche, setNiche] = useState('');
  const [location, setLocation] = useState('');
  const [smartExpand, setSmartExpand] = useState(true);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [history, setHistory] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!niche || !location) return;
    setLoading(true);
    setLeads([]);
    setSource('');
    setError(null);
    setStatus('Searching Google Maps...');

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, location, smartExpand }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setLeads(result.data || []);
        setSource(result.source || 'api');
        setHistory(prev => [{ niche, location, count: result.count, source: result.source, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
      } else {
        setError(result.error || 'Search failed');
      }
    } catch {
      setError('Failed to connect');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleExport = () => {
    if (leads.length === 0) return;
    exportToCSV(leads, `directory_${niche}_${location}_${Date.now()}.csv`);
  };

  const toggleRow = (idx) => setExpandedRow(expandedRow === idx ? null : idx);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-surface-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
            <Search className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-900">Directory Search</h2>
            <p className="text-sm text-surface-500">Find local businesses with contact details</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-700">Business Niche</label>
              <input type="text" placeholder="e.g., Roofers, Plumbers, Dentists..." value={niche} onChange={e => setNiche(e.target.value)}
                className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-surface-900 placeholder-surface-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-700">Location</label>
              <input type="text" placeholder="e.g., Austin, New York, London..." value={location} onChange={e => setLocation(e.target.value)}
                className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-surface-900 placeholder-surface-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all" required />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={smartExpand} onChange={e => setSmartExpand(e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-surface-600">Smart niche expansion</span>
            </label>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary-500/20">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              {loading ? 'Searching...' : 'Search Directory'}
            </button>
          </div>
        </form>
      </div>

      {status && (
        <div className="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-xl p-4 text-primary-700">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">{status}</span>
        </div>
      )}

      {source && !loading && (
        <div className="flex items-center gap-3">
          {source === 'cache' ? (
            <span className="badge badge-purple"><Database className="w-3 h-3" /> From Cache</span>
          ) : (
            <span className="badge badge-info"><Globe className="w-3 h-3" /> Fresh Search</span>
          )}
          {leads.length > 0 && <span className="badge badge-success"><CheckCircle className="w-3 h-3" /> {leads.length} leads</span>}
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
            <button key={i} onClick={() => { setNiche(h.niche); setLocation(h.location); }}
              className="text-xs bg-surface-100 hover:bg-surface-200 text-surface-600 px-2.5 py-1 rounded-full transition">
              {h.niche} in {h.location}
            </button>
          ))}
        </div>
      )}

      {leads.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-surface-100">
            <div>
              <h3 className="font-semibold text-surface-900">Results</h3>
              <p className="text-sm text-surface-500">{leads.length} businesses found</p>
            </div>
            <button onClick={handleExport}
              className="flex items-center gap-2 bg-surface-800 hover:bg-surface-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-lg">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50/80 border-b border-surface-100">
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase px-5 py-3">Company</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase px-5 py-3">Contact</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase px-5 py-3">Details</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {leads.map((lead, idx) => (
                  <>
                    <tr key={idx} className="table-row-hover cursor-pointer" onClick={() => toggleRow(idx)}>
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary-600">{lead.company_name?.charAt(0)?.toUpperCase() || '?'}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-surface-900 text-sm">{lead.company_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {lead.rating && <span className="flex items-center gap-1 text-xs text-amber-600"><Star className="w-3 h-3 fill-amber-500" />{lead.rating}</span>}
                              {lead.review_count > 0 && <span className="text-xs text-surface-400">({lead.review_count} reviews)</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          {lead.email !== 'N/A' && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-primary-500" /><span className="text-sm text-surface-700">{lead.email}</span></div>}
                          {lead.phone !== 'N/A' && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-green-500" /><span className="text-sm text-surface-700">{lead.phone}</span></div>}
                          {lead.contact_person !== 'N/A' && <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-accent-500" /><span className="text-sm text-surface-700">{lead.contact_person}</span></div>}
                          {lead.email === 'N/A' && lead.phone === 'N/A' && lead.contact_person === 'N/A' && <span className="text-xs text-surface-400 italic">No contact info</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-surface-400" /><span className="text-sm text-surface-600 max-w-[200px] truncate">{lead.address}</span></div>
                          {lead.website !== 'N/A' && (
                            <a href={lead.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition">
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="max-w-[200px] truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {expandedRow === idx ? <ChevronUp className="w-4 h-4 text-surface-400" /> : <ChevronDown className="w-4 h-4 text-surface-400" />}
                      </td>
                    </tr>
                    {expandedRow === idx && (
                      <tr className="bg-surface-50/50">
                        <td colSpan="4" className="px-5 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-surface-500 uppercase">Social Media</h4>
                              {Object.keys(lead.social_media || {}).length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(lead.social_media).map(([p, u]) => (
                                    <a key={p} href={u} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 bg-white border border-surface-200 rounded-lg px-3 py-1.5 text-xs font-medium text-surface-700 hover:border-primary-300 hover:text-primary-600 transition">
                                      <Share2 className="w-3 h-3" />{p.charAt(0).toUpperCase() + p.slice(1)}
                                    </a>
                                  ))}
                                </div>
                              ) : <p className="text-xs text-surface-400 italic">No social media</p>}
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-surface-500 uppercase">Business Info</h4>
                              <div className="space-y-1 text-sm text-surface-600">
                                <p><span className="text-surface-400">Niche:</span> {lead.niche}</p>
                                <p><span className="text-surface-400">Location:</span> {lead.location}</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-surface-500 uppercase">Actions</h4>
                              <div className="flex flex-wrap gap-2">
                                {lead.email !== 'N/A' && <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 bg-primary-50 text-primary-700 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-primary-100 transition"><Mail className="w-3 h-3" />Email</a>}
                                {lead.phone !== 'N/A' && <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 bg-green-50 text-green-700 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-green-100 transition"><Phone className="w-3 h-3" />Call</a>}
                                {lead.website !== 'N/A' && <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-surface-100 text-surface-700 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-surface-200 transition"><ExternalLink className="w-3 h-3" />Visit</a>}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && leads.length === 0 && !error && (
        <div className="bg-white rounded-2xl shadow-sm border border-surface-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-lg font-semibold text-surface-700 mb-2">Ready to Search</h3>
          <p className="text-sm text-surface-500 max-w-md mx-auto">Enter a business niche and location to find leads.</p>
        </div>
      )}
    </div>
  );
}
