'use client';

import { useState } from 'react';
import { Zap, Menu, X, BarChart3, Search, Youtube, Database } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, stats }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const tabs = [
    { id: 'directory', label: 'Directory Search', icon: Search, color: 'text-primary-600' },
    { id: 'youtube', label: 'YouTube Intelligence', icon: Youtube, color: 'text-red-500' },
    { id: 'dashboard', label: 'Analytics', icon: BarChart3, color: 'text-accent-600' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-surface-900 tracking-tight">
                Lead<span className="text-primary-600">Finder</span> Pro
              </h1>
              <p className="text-xs text-surface-500 -mt-0.5">B2B Intelligence Platform</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? tab.color : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-surface-100 rounded-full px-3 py-1.5">
              <Database className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs font-semibold text-surface-700">{stats?.totalLeads || 0} leads</span>
            </div>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-surface-100">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-surface-200 px-4 py-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMobileOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium ${
                  active ? 'bg-primary-50 text-primary-700' : 'text-surface-600 hover:bg-surface-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? tab.color : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
