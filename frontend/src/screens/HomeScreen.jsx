import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors, FontFamily } from '../theme';
import { fetchAllMatches } from '../services/api';
import { isEventVisible } from '../services/eventVisibility';

const HomeScreen = () => {
  const navigate = useNavigate();
  const [recentMatches, setRecentMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);


  useEffect(() => {
    const loadRecentMatches = async () => {
    try {
      const data = await fetchAllMatches();
      setRecentMatches(data || []);
    } catch (error) {
      console.error('Error loading recent matches:', error);
      setRecentMatches([]);
    } finally {
      setLoadingMatches(false);
    }
    };
    loadRecentMatches();
  }, []);

  const getEventIcon = (eventType) => {
    const t = (eventType || '').toLowerCase();
    if (t.includes('goal')) return { color: AppColors.primary, label: '⚽' };
    if (t.includes('foul')) return { color: '#FFC107', label: '🟨' };
    return { color: '#9e9e9e', label: '📌' };
  };

  const renderHeader = () => (
    <div style={styles.header}>
      <div style={styles.headerRow}>
        <div style={styles.headerColumn}>
          <p style={styles.welcomeText}>Welcome back</p>
          <div style={styles.titleRow}>
            <span style={styles.titleFooty}>Footy</span>
            <span style={styles.titleAI}>AI</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={styles.iconButton}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={AppColors.textPrimary} strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <div style={styles.iconButton}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={AppColors.textPrimary} strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuickActions = () => (
    <div style={styles.quickActions}>
      <p style={styles.sectionTitle}>Quick Actions</p>
      <div style={styles.actionRow}>
        <div style={{ ...styles.actionCard, flex: 1 }} onClick={() => navigate('/upload')}>
          <div style={{ ...styles.actionIcon, backgroundColor: `${AppColors.primary}1A` }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <p style={styles.actionLabel}>Upload Match</p>
        </div>
        <div style={{ ...styles.actionCard, flex: 1 }} onClick={() => navigate('/highlights')}>
          <div style={{ ...styles.actionIcon, backgroundColor: 'rgba(33, 150, 243, 0.1)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10 8 16 12 10 16 10 8"></polygon>
            </svg>
          </div>
          <p style={styles.actionLabel}>Highlights</p>
        </div>
      </div>
      <div style={{ ...styles.actionCard, width: '100%' }} onClick={() => navigate('/predictions')}>
        <div style={{ ...styles.actionIcon, backgroundColor: 'rgba(156, 39, 176, 0.1)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
        </div>
        <p style={styles.actionLabel}>AI Analysis</p>
      </div>
    </div>
  );

  const renderRecentMatchesSection = () => (
    <div style={styles.recentSection}>
      <div style={styles.sectionHeader}>
        <p style={styles.sectionTitle}>Recent Matches</p>
        <span style={styles.seeAll} onClick={() => navigate('/predictions')}>See All</span>
      </div>

      {loadingMatches ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyTitle}>Loading matches...</p>
        </div>
      ) : recentMatches.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📺</div>
          <p style={styles.emptyTitle}>No recent matches</p>
          <p style={styles.emptySubtitle}>Upload a match to get started</p>
        </div>
      ) : (
        recentMatches.slice(0, 5).map((match) => {
          const teams = match.teams || [];
          const plays = match.play || [];
          // const events = match.events || []; // Original all-event display.
          const events = (match.events || []).filter(isEventVisible);
          const teamA = teams[0]?.teamName || teams[0]?.T_name || 'Team A';
          const teamB = teams[1]?.teamName || teams[1]?.T_name || 'Team B';
          const scoreA = plays[0]?.score ?? 0;
          const scoreB = plays[1]?.score ?? 0;
          const goalCount = events.filter(e => ((e.eventType || e.Event_type || e.event) || '').toLowerCase().includes('goal')).length;
          const foulCount = events.filter(e => ((e.eventType || e.Event_type || e.event) || '').toLowerCase().includes('foul')).length;
          const matchId = match.matchId || match.M_id;
          const matchDate = match.matchDate || match.M_date || 'Recent';

          return (
            <div
              key={matchId}
              style={styles.matchCard}
              onClick={() => navigate('/summary', { state: { matchId } })}
            >
              {/* Match Header */}
              <div style={styles.matchCardHeader}>
                <div style={styles.matchBadge}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                  </svg>
                  <span style={styles.matchBadgeText}>AI Analyzed</span>
                </div>
                <span style={styles.matchDate}>{matchDate}</span>
              </div>

              {/* Teams + Score */}
              <div style={styles.matchTeamsRow}>
                <div style={styles.matchTeam}>
                  <div style={styles.teamCircle}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <span style={styles.matchTeamName}>{teamA}</span>
                </div>
                <div style={styles.matchScore}>
                  <span style={styles.matchScoreNum}>{scoreA}</span>
                  <span style={styles.matchScoreDash}>–</span>
                  <span style={styles.matchScoreNum}>{scoreB}</span>
                </div>
                <div style={styles.matchTeam}>
                  <div style={{ ...styles.teamCircle, opacity: 0.5 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <span style={styles.matchTeamName}>{teamB}</span>
                </div>
              </div>

              {/* Stats Chips */}
              {events.length > 0 && (
                <div style={styles.statsChipsRow}>
                  {goalCount > 0 && (
                    <div style={styles.statsChip}>
                      <span>⚽</span>
                      <span style={styles.statsChipText}>{goalCount} Goal{goalCount > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {foulCount > 0 && (
                    <div style={{ ...styles.statsChip, backgroundColor: '#FFF8E1', borderColor: '#FFC10733' }}>
                      <span>🟨</span>
                      <span style={{ ...styles.statsChipText, color: '#F57F17' }}>{foulCount} Foul{foulCount > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  <div style={{ ...styles.statsChip, backgroundColor: '#f5f5f5', borderColor: '#e0e0e0' }}>
                    <span>📊</span>
                    <span style={{ ...styles.statsChipText, color: '#757575' }}>{events.length} Total</span>
                  </div>
                </div>
              )}

              {/* Event Timeline */}
              {events.length > 0 && (
                <div style={styles.eventTimeline}>
                  <p style={styles.eventTimelineTitle}>EVENTS</p>
                  {events.slice(0, 4).map((event, idx) => {
                    const icon = getEventIcon(event.Event_type);
                    return (
                      <div key={event.E_id || idx} style={styles.eventItem}>
                        <span style={styles.eventEmoji}>{icon.label}</span>
                        <div style={styles.eventContent}>
                          <span style={styles.eventName}>{event.Event_name || event.Event_type}</span>
                          {event.Description && (
                            <span style={styles.eventDesc}>{event.Description}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {events.length > 4 && (
                    <p style={styles.moreEvents}>+{events.length - 4} more events</p>
                  )}
                </div>
              )}

              {/* View Summary CTA */}
              <div style={styles.matchCTA}>
                <span style={styles.matchCTAText}>View Full Summary</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
                  <path d="M9 18l6-6-6-6"></path>
                </svg>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.scrollContainer}>
        <div style={styles.content}>
          {renderHeader()}
          {renderQuickActions()}
          {renderRecentMatchesSection()}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: AppColors.backgroundLight,
    minHeight: '100vh',
    fontFamily: FontFamily,
  },
  scrollContainer: {
    height: 'calc(100vh - 60px)',
    overflowY: 'auto',
  },
  content: {
    paddingBottom: '80px',
  },
  header: {
    padding: '20px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontFamily: FontFamily,
    fontSize: '14px',
    color: '#9e9e9e',
    margin: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px',
  },
  titleFooty: {
    fontFamily: FontFamily,
    fontSize: '24px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  titleAI: {
    fontFamily: FontFamily,
    fontSize: '24px',
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  iconButton: {
    width: '44px',
    height: '44px',
    backgroundColor: AppColors.white,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    cursor: 'pointer',
  },
  quickActions: {
    padding: '0 20px',
  },
  sectionTitle: {
    fontFamily: FontFamily,
    fontSize: '18px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: '16px',
    textAlign: 'left',
  },
  actionRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
  },
  actionCard: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  actionIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  actionLabel: {
    fontFamily: FontFamily,
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center',
    margin: 0,
  },
  recentSection: {
    padding: '20px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  seeAll: {
    fontFamily: FontFamily,
    fontSize: '14px',
    color: AppColors.primary,
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyState: {
    padding: '32px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '48px',
    color: '#e0e0e0',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontFamily: FontFamily,
    fontSize: '14px',
    color: '#bdbdbd',
    marginBottom: '4px',
  },
  emptySubtitle: {
    fontFamily: FontFamily,
    fontSize: '12px',
    color: '#e0e0e0',
  },
  // Match Card
  matchCard: {
    backgroundColor: AppColors.white,
    borderRadius: '20px',
    marginBottom: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  matchCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px 8px',
  },
  matchBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: `${AppColors.primary}1A`,
    borderRadius: '12px',
  },
  matchBadgeText: {
    fontFamily: FontFamily,
    fontSize: '10px',
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  matchDate: {
    fontFamily: FontFamily,
    fontSize: '11px',
    color: '#9e9e9e',
  },
  matchTeamsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 20px 12px',
  },
  matchTeam: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '70px',
  },
  teamCircle: {
    width: '44px',
    height: '44px',
    backgroundColor: '#f5f5f5',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '6px',
  },
  matchTeamName: {
    fontFamily: FontFamily,
    fontSize: '12px',
    fontWeight: '600',
    color: AppColors.textPrimary,
    textAlign: 'center',
  },
  matchScore: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  matchScoreNum: {
    fontFamily: FontFamily,
    fontSize: '28px',
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  matchScoreDash: {
    fontFamily: FontFamily,
    fontSize: '20px',
    color: '#bdbdbd',
  },
  statsChipsRow: {
    display: 'flex',
    gap: '8px',
    padding: '0 16px 12px',
    flexWrap: 'wrap',
  },
  statsChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: `${AppColors.primary}0D`,
    borderRadius: '20px',
    border: `1px solid ${AppColors.primary}1A`,
  },
  statsChipText: {
    fontFamily: FontFamily,
    fontSize: '11px',
    fontWeight: '600',
    color: AppColors.primary,
  },
  eventTimeline: {
    padding: '0 16px 12px',
  },
  eventTimelineTitle: {
    fontFamily: FontFamily,
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: '1.5px',
    color: '#bdbdbd',
    marginBottom: '8px',
  },
  eventItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '6px 0',
    borderBottom: '1px solid #f5f5f5',
  },
  eventEmoji: {
    fontSize: '14px',
    marginTop: '2px',
  },
  eventContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  eventName: {
    fontFamily: FontFamily,
    fontSize: '13px',
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  eventDesc: {
    fontFamily: FontFamily,
    fontSize: '11px',
    color: '#9e9e9e',
    marginTop: '2px',
  },
  moreEvents: {
    fontFamily: FontFamily,
    fontSize: '11px',
    color: AppColors.primary,
    fontWeight: '600',
    marginTop: '6px',
    textAlign: 'center',
  },
  matchCTA: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '12px',
    borderTop: '1px solid #f5f5f5',
  },
  matchCTAText: {
    fontFamily: FontFamily,
    fontSize: '13px',
    fontWeight: 'bold',
    color: AppColors.primary,
  },
};

export default HomeScreen;
