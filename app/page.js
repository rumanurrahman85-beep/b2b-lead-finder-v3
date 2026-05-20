'use client';

import { useState, useEffect } from 'react';
import Header from './components/Header.js';
import DirectorySearch from './components/DirectorySearch.js';
import YouTubeSearch from './components/YouTubeSearch.js';
import Dashboard from './components/Dashboard.js';

export default function Home() {
  const [activeTab, setActiveTab] = useState('directory');
  const [stats, setStats] = useState({ totalLeads: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data.success) setStats(data.stats);
      } catch (e) {
        // Silently fail
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-surface-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} stats={stats} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'directory' && <DirectorySearch />}
        {activeTab === 'youtube' && <YouTubeSearch />}
        {activeTab === 'dashboard' && <Dashboard />}
      </main>
      <footer className="border-t border-surface-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-surface-500">B2B Lead Finder Pro • Powered by SerpApi, YouTube Data API, Gemini AI & Supabase</p>
            <div className="flex items-center gap-4 text-sm text-surface-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
