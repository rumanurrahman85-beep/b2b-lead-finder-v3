// Safe email extraction
export function extractEmails(htmlText) {
  if (!htmlText) return null;
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = htmlText.match(regex) || [];
  const valid = matches.filter(e => {
    const l = e.toLowerCase();
    return !l.includes('.jpg') && !l.includes('.png') && !l.includes('.gif') &&
           !l.includes('example.com') && !l.includes('test.com');
  });
  return valid.length > 0 ? [...new Set(valid)][0] : null;
}

// Safe phone extraction
export function extractPhones(text) {
  if (!text) return null;
  const regex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const matches = text.match(regex) || [];
  return matches.length > 0 ? [...new Set(matches)][0] : null;
}

// Normalize URL
export function normalizeUrl(url) {
  if (!url || url === 'N/A') return null;
  let u = url.trim();
  if (!u.startsWith('http')) u = 'https://' + u;
  try { return new URL(u).href; } catch { return u; }
}

// Safe fetch with timeout
export async function safeFetch(url, opts = {}, timeout = 3000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

// CSV export
export function exportToCSV(data, filename) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const v = String(row[h] || '').replace(/"/g, '""');
      return v.includes(',') || v.includes('"') ? `"${v}"` : v;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Format numbers
export function formatNumber(num) {
  if (!num && num !== 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}
