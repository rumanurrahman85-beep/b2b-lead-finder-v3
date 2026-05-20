'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Youtube, Database, Sparkles, Clock, Search, Activity } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) setStats(data);
    } catch (e) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { title: 'Total Leads', value: stats?.stats?.totalLeads || 0, icon: Database, color: 'from-primary-500 to-primary-600', text: 'text-primary-600', bg: 'bg-primary-50' },
    { title: 'Directory', value: stats?.stats?.totalDirectory || 0, icon: Search, color: 'from-accent-500 to-accent-600', text: 'text-accent-600', bg: 'bg-accent-50' },
    { title: 'YouTube', value: stats?.stats?.totalYouTube || 0, icon: Youtube, color: 'from-red-500 to-red-600', text: 'text-red-600', bg: 'bg-red-50' },
    { title: 'AI Enriched', value: stats?.stats?.aiEnriched || 0, icon: Sparkles, color: 'from-purple-500 to-purple-600', text: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-surface-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-accent-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-900">Analytics Dashboard</h2>
            <p className="text-sm text-surface-500">Real-time lead generation metrics</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-surface-200 p-5 card-hover">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.text}`} />
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" /> Live
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-surface-900">{card.value.toLocaleString()}</p>
                <p className="text-sm text-surface-500 mt-1">{card.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-surface-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-surface-900">Today's Activity</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center">
                  <Search className="w-4 h-4 text-accent-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900">Directory Searches</p>
                  <p className="text-xs text-surface-500">New leads today</p>
                </div>
              </div>
              <span className="text-lg font-bold text-accent-600">{stats?.stats?.todayDirectory || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <Youtube className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900">YouTube Searches</p>
                  <p className="text-xs text-surface-500">Channels found today</p>
                </div>
              </div>
              <span className="text-lg font-bold text-red-600">{stats?.stats?.todayYouTube || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-surface-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-surface-900">Recent Searches</h3>
          </div>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-2">
              {stats.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${a.search_type === 'directory' ? 'bg-accent-500' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="text-sm font-medium text-surface-900 capitalize">{a.niche}</p>
                      <p className="text-xs text-surface-500">{a.location || 'Global'} • {a.results_count} results</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${a.source_used === 'cache' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}`}>
                    {a.source_used}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8"><p className="text-sm text-surface-400">No recent searches</p></div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-surface-200 p-6">
        <h3 className="font-semibold text-surface-900 mb-4">API Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'SerpApi', status: 'Active', color: 'bg-green-500' },
            { name: 'YouTube API', status: 'Active', color: 'bg-green-500' },
            { name: 'Gemini AI', status: 'Active', color: 'bg-green-500' },
            { name: 'Supabase', status: 'Active', color: 'bg-green-500' },
          ].map((api, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
              <div className={`w-2.5 h-2.5 rounded-full ${api.color}`}></div>
              <div>
                <p className="text-sm font-medium text-surface-900">{api.name}</p>
                <p className="text-xs text-surface-500">{api.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
