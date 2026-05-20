// API Key Manager with rotation and fallback

const SERP_KEYS = [
  process.env.SERPAPI_KEY_1,
  process.env.SERPAPI_KEY_2,
  process.env.SERPAPI_KEY_3,
].filter(Boolean);

const YT_KEYS = [
  process.env.YOUTUBE_API_KEY_1,
  process.env.YOUTUBE_API_KEY_2,
].filter(Boolean);

let currentSerpIndex = 0;
let currentYtIndex = 0;

export function getSerpApiKey() {
  if (SERP_KEYS.length === 0) throw new Error('No SerpApi keys configured');
  return SERP_KEYS[currentSerpIndex];
}

export function rotateSerpApiKey() {
  currentSerpIndex = (currentSerpIndex + 1) % SERP_KEYS.length;
  return SERP_KEYS[currentSerpIndex];
}

export function getYouTubeKey() {
  if (YT_KEYS.length === 0) throw new Error('No YouTube API keys configured');
  return YT_KEYS[currentYtIndex];
}

export function rotateYouTubeKey() {
  currentYtIndex = (currentYtIndex + 1) % YT_KEYS.length;
  return YT_KEYS[currentYtIndex];
}

export function getGeminiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('No Gemini API key configured');
  return key;
}

export function getGoogleSheetsKey() {
  const key = process.env.GOOGLE_SHEETS_API_KEY;
  if (!key) throw new Error('No Google Sheets API key configured');
  return key;
}

export function getApiStatus() {
  return {
    serpApi: SERP_KEYS.length,
    youtube: YT_KEYS.length,
    gemini: !!process.env.GEMINI_API_KEY,
    googleSheets: !!process.env.GOOGLE_SHEETS_API_KEY,
  };
}
