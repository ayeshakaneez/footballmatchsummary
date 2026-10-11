import { isEventVisible } from './eventVisibility';

// =========================
// API CONFIGURATION — Python FastAPI backend only
// =========================
const API_BASE = (import.meta.env?.VITE_API_BASE_URL || `http://${window.location.hostname}:8001`).replace(/\/$/, '');

export const ApiConstants = {
  base: API_BASE,
  // Upload & processing
  uploadVideo: `${API_BASE}/api/processing/submit-file`,
  // Match data
  getAllMatches: `${API_BASE}/api/matches`,
  getMatchSummary: `${API_BASE}/api/matches`,
  // Auth
  signUp: `${API_BASE}/api/users/register`,
  signIn: `${API_BASE}/api/users/login`,
};

// =========================
// UPLOAD VIDEO
// =========================
export const uploadVideo = (file, onProgress, signal) => new Promise((resolve, reject) => {
  const form = new FormData();
  form.append('video', file);
  const xhr = new XMLHttpRequest();
  xhr.open('POST', ApiConstants.uploadVideo);
  const abort = () => xhr.abort();
  xhr.upload.onprogress = event => {
    if (event.lengthComputable) onProgress?.(event.loaded / event.total);
  };
  xhr.onload = () => {
    let data;
    try { data = JSON.parse(xhr.responseText); }
    catch { reject(new Error('Invalid upload response from the backend.')); return; }
    if (xhr.status < 200 || xhr.status >= 300) reject(new Error(typeof data.detail === 'string' ? data.detail : 'Upload failed.'));
    else if (!data.job_id) reject(new Error('The backend did not return a processing job ID.'));
    else resolve(data);
  };
  xhr.onerror = () => reject(new Error('Upload failed. Check the backend connection.'));
  xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'));
  xhr.onloadend = () => signal?.removeEventListener('abort', abort);
  if (signal?.aborted) { reject(new DOMException('Upload cancelled', 'AbortError')); return; }
  signal?.addEventListener('abort', abort, { once: true });
  xhr.send(form);
});

// =========================
// RUN AI MODEL
// =========================
async function requestJson(path, options = {}) {
  const response = await fetch(API_BASE + path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail;
    throw new Error(Array.isArray(detail) ? detail.map(item => item.msg).join('; ') : detail || 'Backend request failed (' + response.status + ').');
  }
  return data;
}
export const getJobStatus = (jobId, signal) => requestJson('/api/processing/status/' + encodeURIComponent(jobId), { signal });
export const getJobResult = async (jobId, signal) => {
  const data = await requestJson('/api/processing/result/' + encodeURIComponent(jobId), { signal });
  if (!data.result) throw new Error('The backend returned no analysis result.');
  return data.result;
};
export const confirmTeams = (jobId, names) => requestJson('/api/processing/confirm-teams/' + encodeURIComponent(jobId), {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(names),
});

// =========================
// FETCH ALL MATCHES
// =========================
export const fetchAllMatches = async () => {
  const matches = await requestJson('/api/matches');
  // The list contains metadata; cards also need each match's score sheet.
  return Promise.all(matches.map(async (match) => {
    const summary = await requestJson('/api/matches/' + encodeURIComponent(match.matchId));
    const teams = summary.teams || [];
    return {
      ...match,
      ...summary,
      play: teams.map(team => summary.play?.find(play => play.teamId === team.teamId)).filter(Boolean),
      // eventCount: summary.events?.length || 0, // Restore to count hidden events too.
      eventCount: (summary.events || []).filter(isEventVisible).length,
    };
  }));
};

// =========================
// FETCH MATCH SUMMARY BY ID
// =========================
export const fetchMatchSummary = async (matchId) => {
  try {
    const response = await fetch(`${ApiConstants.getMatchSummary}/${matchId}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (e) {
    console.error('Error fetching match summary:', e);
    return null;
  }
};

// =========================
// FETCH LATEST MATCH
// =========================
export const fetchLatestMatch = async () => {
  const matches = await requestJson('/api/matches');
  return matches.length ? fetchMatchSummary(matches[0].matchId) : null;
};

// =========================
// RESOLVE VIDEO URL UTILITY
// =========================
export const resolveVideoUrl = (rawPath) => {
  if (!rawPath) return '';
  let clean = String(rawPath).replace(/\\/g, '/');
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  if (!clean.startsWith('/')) clean = '/' + clean;
  return `${API_BASE}${clean}`;
};

// =========================
// FETCH ALL HIGHLIGHTS
// =========================
export const fetchHighlights = async (matchId) => {
  try {
    const summaries = matchId ? [await fetchMatchSummary(matchId)] : await fetchAllMatches();
    return summaries.filter(Boolean).flatMap((summary) =>
      (summary.events || [])
        .filter((e) => e.clipFileLocation || e.video_path || e.VideoPath)
        .map((e, idx) => ({
          id: e.eventId || e.E_id || idx + 1,
          matchId: summary.match?.matchId || summary.matchId,
          time: e.timeSec ? `${Math.floor(e.timeSec / 60)}:${Math.floor(e.timeSec % 60).toString().padStart(2, '0')}` : '0:00',
          type: (e.eventType || e.type || 'Event').replace(/_/g, ' '),
          player: e.candidatePlayerName && e.identityUnconfirmed
            ? `#${e.jerseyNumber} ${e.candidatePlayerName} (unconfirmed)`
            : e.playerName ? `${e.jerseyNumber == null ? '' : '#' + e.jerseyNumber + ' '}${e.playerName}`
            : e.detectedPlayerName || e.detected_player_name || e.Event_name || (e.jerseyNumber ? `#${e.jerseyNumber}` : 'Player'),
          title: e.eventName || `${(e.eventType || 'Event').toUpperCase()} - ${e.teamName || 'Match'}`,
          team: e.teamName || '',
          description: e.description || `${e.eventType || 'Event'} detected by AI`,
          videoPath: resolveVideoUrl(e.clipFileLocation || e.video_path || e.VideoPath),
          teamHome: summary.teams?.[0]?.teamName || 'Team 1',
          teamAway: summary.teams?.[1]?.teamName || 'Team 2',
          scoreHome: summary.play?.find(play => play.teamId === summary.teams?.[0]?.teamId)?.score ?? 0,
          scoreAway: summary.play?.find(play => play.teamId === summary.teams?.[1]?.teamId)?.score ?? 0,
        }))
    );
  } catch (e) {
    console.error('Error fetching highlights:', e);
    return [];
  }
};

// =========================
// FETCH HIGHLIGHTS FOR A MATCH
// =========================
export const fetchMatchHighlights = (matchId) => fetchHighlights(matchId);

// =========================
// AUTH — SIGN UP
// =========================
export const signUp = async (userData) => {
  try {
    const response = await fetch(ApiConstants.signUp, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response;
  } catch (e) {
    console.error('Error signing up:', e);
    throw e;
  }
};

// =========================
// AUTH — SIGN IN
// =========================
export const signIn = async (credentials) => {
  try {
    const response = await fetch(ApiConstants.signIn, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return response;
  } catch (e) {
    console.error('Error signing in:', e);
    throw e;
  }
};
