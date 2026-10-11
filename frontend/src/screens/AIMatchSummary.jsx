import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppColors, FontFamily } from '../theme';
import { fetchMatchSummary, fetchLatestMatch, resolveVideoUrl } from '../services/api';
import { isEventVisible, visibleClips } from '../services/eventVisibility';
import './MatchMedia.css';

const AIMatchSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get navigation state variables
  const stateMatchId = location.state?.matchId;
  const stateResult = location.state?.result;
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = stateResult || (stateMatchId ? await fetchMatchSummary(stateMatchId) : await fetchLatestMatch());
        if (active) {
          setMatchData(data);
          setError(data ? null : 'No match data available. Please upload and process a match first.');
          setLoading(false);
        }
      } catch (err) {
        if (active) { setError(err.message); setLoading(false); }
      }
    }
    load();
    return () => { active = false; };
  }, [stateMatchId, stateResult]);

  // Helper to get team names
  const getTeamName = (index) => {
    if (matchData?.teams && matchData.teams.length > index) {
      const name = matchData.teams[index].teamName || matchData.teams[index].T_name;
      if (name) return name;
    }
    if (stateResult?.score_sheet && stateResult.score_sheet.length > index) {
      const sheetName = stateResult.score_sheet[index].team_name;
      if (sheetName) return sheetName;
    }
    if (index === 0) {
      return stateResult?.team_a_name || location.state?.team1Name || 'Home';
    }
    if (index === 1) {
      return stateResult?.team_b_name || location.state?.team2Name || 'Away';
    }
    return index === 0 ? 'Home' : 'Away';
  };

  // Helper to get scores
  const getScore = (index) => {
    if (matchData?.score_sheet) return matchData.score_sheet[index]?.score ?? 0;
    const teamId = matchData?.teams?.[index]?.teamId;
    return matchData?.play?.find(play => play.teamId === teamId)?.score ?? 0;
  };

  // Helper to get events
  const getEvents = () => {
    if (!matchData?.events) return [];
    // return matchData.events; // Restore to display shots, saves and passes too.
    return matchData.events.filter(isEventVisible);
  };

  // Get event counts
  const goalCount = getEvents().filter(e => ((e.eventType || e.Event_type || e.event) || '').toLowerCase().includes('goal')).length;
  const foulCount = getEvents().filter(e => ((e.eventType || e.Event_type || e.event) || '').toLowerCase().includes('foul')).length;

  if (loading) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
          </svg>
          <p style={{ fontFamily: FontFamily, color: '#9e9e9e', marginTop: '16px' }}>Loading match data...</p>
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div style={{ ...styles.container, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#bdbdbd" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p style={{ fontFamily: FontFamily, fontSize: '18px', fontWeight: 'bold', color: AppColors.textPrimary, marginTop: '16px', textAlign: 'center' }}>
          No Match Data Found
        </p>
        <p style={{ fontFamily: FontFamily, fontSize: '13px', color: '#9e9e9e', marginTop: '8px', textAlign: 'center', maxWidth: '280px' }}>
          {error || 'No match data available. Please upload and process a match first.'}
        </p>
        <button
          style={{ marginTop: '24px', padding: '12px 32px', backgroundColor: AppColors.primary, borderRadius: '24px', border: 'none', fontFamily: FontFamily, fontSize: '14px', fontWeight: 'bold', color: '#fff', cursor: 'pointer' }}
          onClick={() => navigate('/upload')}
        >
          Upload a Match
        </button>
        <button
          style={{ marginTop: '12px', padding: '10px 32px', backgroundColor: 'transparent', borderRadius: '24px', border: `1px solid ${AppColors.primary}`, fontFamily: FontFamily, fontSize: '14px', color: AppColors.primary, cursor: 'pointer' }}
          onClick={() => navigate('/home')}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.headerButton} onClick={() => navigate('/home')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={AppColors.textPrimary} strokeWidth="2">
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
        </button>
        <p style={styles.headerTitle}>AI Match Summary</p>
        <button style={styles.headerButton} onClick={() => navigate('/highlights', { state: { matchId: stateMatchId || matchData?.match?.matchId || matchData?.match_id } })}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </button>
      </div>

      <div style={styles.scrollContent}>
        {/* Scoreboard */}
        <div style={styles.scoreboard}>
          <div style={styles.scoreboardCard}>
            <div style={styles.cardHeader}>
              <div style={styles.leagueBadge}>
                <span style={styles.leagueText}>AI Analysis</span>
              </div>
              <span style={styles.statusTextSmall}>
                {matchData?.match?.matchDate ? new Date(matchData.match.matchDate).toLocaleDateString() : 'Today'}
              </span>
            </div>
            <div style={styles.teamsRow}>
              <div style={styles.teamColumn}>
                <div style={styles.teamLogo}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <p style={styles.teamName}>{getTeamName(0)}</p>
              </div>
              <div style={styles.scoreDisplay}>
                <span style={styles.scoreNumber}>{getScore(0)}</span>
                <span style={{ ...styles.scoreNumber, color: `${AppColors.primary}80` }}>-</span>
                <span style={styles.scoreNumber}>{getScore(1)}</span>
              </div>
              <div style={styles.teamColumn}>
                <div style={{ ...styles.teamLogo, opacity: 0.6 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <p style={styles.teamName}>{getTeamName(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <div style={styles.aiInsight}>
          <div style={styles.insightCard}>
            <div style={styles.insightHeader}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
              <span style={styles.insightTitle}>AI TACTICAL INSIGHT</span>
            </div>
            <p style={styles.insightText}>
              {/* stateResult?.summary_text can include hidden shot/save/pass details. */}
              {/* Original: stateResult?.summary_text || the generated text below. */}
              {
                `AI detected ${getEvents().length} events: ${goalCount} goal(s) and ${foulCount} foul(s). ` +
                `Match location: ${matchData?.match?.location || 'Unknown'}.`}
            </p>
          </div>
        </div>

        {/* Match Stats */}
        <div style={styles.matchStats}>
          <div style={styles.statsSection}>
            <p style={styles.statsTitle}>KEY METRICS</p>
            <div style={styles.statBarContainer}>
              <div style={styles.statBarHeader}>
                <span style={styles.statValue}>{goalCount}</span>
                <span style={styles.statLabel}>Goals Detected</span>
                <span style={styles.statValue}>{foulCount}</span>
              </div>
              <div style={styles.statBarBackground}>
                <div style={{ height: '100%', width: `${goalCount > 0 ? Math.max(20, (goalCount / Math.max(goalCount + foulCount, 1)) * 100) : 50}%`, backgroundColor: AppColors.primary, borderRadius: '3px 0 0 3px' }} />
                <div style={{ height: '100%', flex: 1, backgroundColor: '#e0e0e0' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', color: '#9e9e9e' }}>Goals</span>
                <span style={{ fontSize: '10px', color: '#9e9e9e' }}>Fouls</span>
              </div>
            </div>
            <div style={{ height: '12px' }} />
            <div style={styles.statBarContainer}>
              <div style={styles.statBarHeader}>
                <span style={styles.statValue}>{getEvents().length}</span>
                <span style={styles.statLabel}>Total Events</span>
                <span style={styles.statValue}>{stateResult?.processed_frames || 'N/A'}</span>
              </div>
              <div style={styles.statBarBackground}>
                <div style={{ height: '100%', width: '100%', backgroundColor: AppColors.primary, borderRadius: '3px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', color: '#9e9e9e' }}>Events</span>
                <span style={{ fontSize: '10px', color: '#9e9e9e' }}>Frames</span>
              </div>
            </div>
          </div>
        </div>

        {matchData.score_sheet && <section style={{ padding: 16 }}>
          <h2>Detected scorers</h2>
          {!(matchData.players || []).length && <p>No scorer identities were confirmed.</p>}
          {(matchData.players || []).map((player, index) => <article key={index} style={{ marginBottom: 20 }}>
            {player.player_image && <img src={resolveVideoUrl(player.player_image)} alt="Detected scorer" style={{ width: 100, maxHeight: 140, objectFit: 'contain' }} />}
            <p>{player.team_name || 'Team unavailable'} — {player.jersey_number == null ? 'Shirt number unavailable' : '#' + player.jersey_number} — {player.player_name || player.candidate_player_name || 'Name not in roster'}{player.unconfirmed ? ' (unconfirmed)' : ''}</p>
          </article>)}
        </section>}
        <section className="summary-highlights">
          <h2>Match highlights</h2>
          <div className="summary-highlight-grid">
            {/* All-event reel hidden because it can contain standalone shot clips.
            {(matchData.reel?.url || matchData.reelUrl) && <figure className="summary-highlight-card">
              <video aria-label="Match highlight reel" controls playsInline preload="metadata" src={resolveVideoUrl(matchData.reel?.url || matchData.reelUrl)} />
              <figcaption>Match highlight reel</figcaption>
            </figure>}
            */}
            {/* Original all-event clip selection retained for restoring the display:
            Array.from(new Map((matchData.clips || matchData.events?.filter(event => event.clipFileLocation).map(event => ({ url: event.clipFileLocation })) || []).filter(clip => clip.url).map(clip => [clip.url, clip])).values())
            */}
            {visibleClips(matchData).map((clip, index) => <figure key={clip.url} className="summary-highlight-card">
              <video aria-label={'Highlight ' + (index + 1)} controls playsInline preload="metadata" src={resolveVideoUrl(clip.url)} />
              <figcaption>Highlight {index + 1}</figcaption>
            </figure>)}
          </div>
        </section>

        {/* Match Timeline */}
        <div style={styles.matchTimeline}>
          <div style={styles.timelineSection}>
            <div style={styles.timelineHeader}>
              <p style={styles.timelineTitle}>MATCH EVENTS</p>
              <span style={styles.filterText}>{getEvents().length} events</span>
            </div>
            <div style={styles.timelineCard}>
              {getEvents().length === 0 ? (
                <p style={{ fontFamily: FontFamily, fontSize: '14px', color: '#9e9e9e', textAlign: 'center', padding: '20px' }}>
                  No events detected
                </p>
              ) : (
                getEvents().map((event, i) => {
                  const eventType = ((event.eventType || event.Event_type || event.event) || '').toLowerCase();
                  const color = eventType.includes('goal') ? AppColors.primary : eventType.includes('foul') ? '#FFC107' : '#9e9e9e';
                  const rawName = event.candidatePlayerName && event.identityUnconfirmed
                    ? `#${event.jerseyNumber} ${event.candidatePlayerName} (unconfirmed)`
                    : event.playerName || event.detected_player_name || event.detectedPlayerName;
                  const eventTitle = rawName || event.Event_name || event.eventName || event.player || (eventType ? `${eventType.toUpperCase()} Event` : 'Event');
                  const teamTag = event.teamName || event.detected_team_name ? `${event.teamName || event.detected_team_name} • ` : '';
                  const eventDetail = `${teamTag}${event.description || event.Description || (event.timeSec ? `At ${Math.floor(event.timeSec)}s` : 'Detected by AI')}`;
                  return (
                    <div key={event.eventId || event.E_id || i} style={styles.timelineItem}>
                      <div style={{ ...styles.timelineIcon, backgroundColor: `${color}33` }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
                          {eventType.includes('goal') && <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>}
                          {eventType.includes('goal') && <path d="M12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"></path>}
                          {eventType.includes('foul') && <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>}
                          {!eventType.includes('goal') && !eventType.includes('foul') && <circle cx="12" cy="12" r="10"></circle>}
                        </svg>
                      </div>
                      <div style={{ ...styles.timelineContent, paddingBottom: i === getEvents().length - 1 ? 0 : '24px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', color: eventType === 'goal' ? '#07811d' : '#65746a', marginBottom: '4px' }}>
                          {(eventType || 'event').replace(/_/g, ' ').toUpperCase()}
                        </p>
                        <p style={styles.timelinePlayer}>
                          {eventTitle}
                        </p>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <span style={styles.timelineDetail}>
                            {eventDetail}
                          </span>
                        </div>
                      </div>
                      {i < getEvents().length - 1 && <div style={styles.timelineLine} />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* View Highlights CTA */}
        <div style={{ padding: '16px' }}>
          <button
            style={styles.highlightsCTA}
            onClick={() => navigate('/highlights')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AppColors.textPrimary} strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            View Match Highlights
          </button>
        </div>

        <div style={{ height: '20px' }} />
      </div>

      {/* Bottom Nav */}
      <div style={styles.bottomNav}>
        {['Summary', 'Stats', 'Highlights', 'Home'].map((label, index) => (
          <div
            key={index}
            style={styles.navItem}
            onClick={() => {
              setSelectedIndex(index);
              if (label === 'Highlights') navigate('/highlights');
              if (label === 'Home') navigate('/home');
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={selectedIndex === index ? AppColors.primary : '#9e9e9e'}
              strokeWidth="2"
            >
              {index === 0 && <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>}
              {index === 1 && <path d="M3 3v18h18"></path>}
              {index === 2 && <polygon points="5 3 19 12 5 21 5 3"></polygon>}
              {index === 3 && <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>}
            </svg>
            <span style={{ ...styles.navLabel, color: selectedIndex === index ? AppColors.primary : '#9e9e9e' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: AppColors.backgroundLight,
    minHeight: '100vh',
    fontFamily: FontFamily,
    display: 'flex',
    flexDirection: 'column',
  },
  scrollContent: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: '80px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
  },
  headerButton: {
    width: '40px',
    height: '40px',
    backgroundColor: AppColors.white,
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    cursor: 'pointer',
  },
  headerTitle: {
    fontFamily: FontFamily,
    fontSize: '18px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    margin: 0,
  },
  scoreboard: {
    padding: '16px 16px 8px',
  },
  scoreboardCard: {
    backgroundColor: AppColors.white,
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e0e0e0',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  leagueBadge: {
    padding: '6px 12px',
    backgroundColor: `${AppColors.primary}1A`,
    borderRadius: '20px',
  },
  leagueText: {
    fontFamily: FontFamily,
    fontSize: '12px',
    fontWeight: '600',
    color: AppColors.primary,
  },
  statusTextSmall: {
    fontFamily: FontFamily,
    fontSize: '12px',
    color: '#757575',
  },
  teamsRow: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  teamColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  teamLogo: {
    width: '64px',
    height: '64px',
    backgroundColor: '#f5f5f5',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamName: {
    fontFamily: FontFamily,
    fontSize: '14px',
    fontWeight: 'bold',
    marginTop: '8px',
  },
  scoreDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  scoreNumber: {
    fontFamily: FontFamily,
    fontSize: '36px',
    fontWeight: '800',
  },
  aiInsight: {
    padding: '8px 16px',
  },
  insightCard: {
    backgroundColor: `${AppColors.primary}0D`,
    borderRadius: '16px',
    padding: '20px',
    border: `1px solid ${AppColors.primary}33`,
  },
  insightHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  insightTitle: {
    fontFamily: FontFamily,
    fontSize: '14px',
    fontWeight: 'bold',
    letterSpacing: '1px',
    color: AppColors.primary,
  },
  insightText: {
    fontFamily: FontFamily,
    fontSize: '15px',
    color: AppColors.textPrimary,
    lineHeight: 1.5,
  },
  matchStats: {
    padding: '8px 16px',
  },
  statsSection: {
    padding: '0 4px 12px',
  },
  statsTitle: {
    fontFamily: FontFamily,
    fontSize: '12px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    color: '#9e9e9e',
    marginBottom: '12px',
  },
  statBarContainer: {
    backgroundColor: AppColors.white,
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #e0e0e0',
  },
  statBarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  statValue: {
    fontFamily: FontFamily,
    fontSize: '12px',
    fontWeight: 'bold',
  },
  statLabel: {
    fontFamily: FontFamily,
    fontSize: '12px',
    color: '#757575',
  },
  statBarBackground: {
    display: 'flex',
    height: '6px',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  matchTimeline: {
    padding: '8px 16px',
  },
  timelineSection: {
    padding: '0 4px 12px',
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  timelineTitle: {
    fontFamily: FontFamily,
    fontSize: '12px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    color: '#9e9e9e',
  },
  filterText: {
    fontFamily: FontFamily,
    fontSize: '12px',
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  timelineCard: {
    backgroundColor: AppColors.white,
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #e0e0e0',
  },
  timelineItem: {
    display: 'flex',
    gap: '12px',
  },
  timelineIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: '24px',
  },
  timelineLine: {
    width: '1px',
    backgroundColor: '#e0e0e0',
    flex: 1,
  },
  timelinePlayer: {
    fontFamily: FontFamily,
    fontSize: '14px',
    fontWeight: 'bold',
  },
  timelineDetail: {
    fontFamily: FontFamily,
    fontSize: '12px',
    color: '#757575',
    marginTop: '2px',
  },
  highlightsCTA: {
    width: '100%',
    height: '52px',
    backgroundColor: AppColors.primary,
    borderRadius: '16px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: FontFamily,
    fontSize: '16px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    cursor: 'pointer',
    boxShadow: `0 0 12px ${AppColors.primary}33`,
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    backgroundColor: `${AppColors.white}CC`,
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
  },
  navLabel: {
    fontFamily: FontFamily,
    fontSize: '10px',
    fontWeight: 'bold',
  },
};

export default AIMatchSummary;
