import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors, FontFamily } from '../theme';
import { fetchAllMatches } from '../services/api';

const AIPredictionsScreen = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);


  const loadMatches = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchAllMatches();
      setMatches(data || []);
    } catch (e) {
      console.error('Error loading matches:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    let active = true;
    fetchAllMatches().then(data => { if (active) setMatches(data || []); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingState />;
  if (error && matches.length === 0) return <ErrorState onRetry={loadMatches} />;
  if (matches.length === 0) return <EmptyState onUpload={() => navigate('/upload')} />;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/home')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={AppColors.textPrimary} strokeWidth="2">
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
        </button>
        <h1 style={styles.headerTitle}>AI Match Analysis</h1>
        <div style={{ width: '40px' }} />
      </div>

      {/* Stats Bar */}
      <div style={styles.statsBar}>
        <div style={styles.statItem}>
          <span style={styles.statNumber}>{matches.length}</span>
          <span style={styles.statLabel}>Matches</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <span style={styles.statNumber}>
            {matches.reduce((sum, m) => sum + (m.eventCount || 0), 0)}
          </span>
          <span style={styles.statLabel}>Events</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <span style={styles.statNumber}>AI</span>
          <span style={styles.statLabel}>Powered</span>
        </div>
      </div>

      {/* Match Cards */}
      <div style={styles.list}>
        {matches.map((match) => {
          const teams = match.teams || [];
          const plays = match.play || [];
          const teamA = teams[0]?.teamName || 'Team A';
          const teamB = teams[1]?.teamName || 'Team B';
          const scoreA = plays[0]?.score ?? 0;
          const scoreB = plays[1]?.score ?? 0;
          const eventCount = match.eventCount || 0;

          return (
            <div
              key={match.matchId}
              style={styles.card}
              onClick={() => navigate('/summary', { state: { matchId: match.matchId } })}
            >
              {/* Card Header */}
              <div style={styles.cardHeader}>
                <div style={styles.aiBadge}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                  </svg>
                  <span style={styles.aiBadgeText}>AI Analyzed</span>
                </div>
                <span style={styles.matchDate}>{match.matchDate ? new Date(match.matchDate).toLocaleDateString() : 'Unknown date'}</span>
              </div>

              {/* Teams Row */}
              <div style={styles.teamsRow}>
                <div style={styles.teamInfo}>
                  <div style={styles.teamLogo}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <p style={styles.teamName}>{teamA}</p>
                </div>

                <div style={styles.scoreSection}>
                  <div style={styles.scoreBox}>
                    <span style={styles.scoreNumber}>{scoreA}</span>
                    <span style={styles.scoreDash}>–</span>
                    <span style={styles.scoreNumber}>{scoreB}</span>
                  </div>
                  <span style={styles.matchLocation}>{match.location || ''}</span>
                </div>

                <div style={styles.teamInfo}>
                  <div style={{ ...styles.teamLogo, opacity: 0.6 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <p style={styles.teamName}>{teamB}</p>
                </div>
              </div>

              {/* Events Info */}
              <div style={styles.eventsRow}>
                <div style={styles.eventChip}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="10 8 16 12 10 16 10 8"></polygon>
                  </svg>
                  <span style={styles.eventChipText}>{eventCount} events detected</span>
                </div>
                <div style={styles.viewButton}>
                  <span style={styles.viewButtonText}>View Summary</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
                    <path d="M9 18l6-6-6-6"></path>
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div style={styles.centerState}>
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
      <line x1="12" y1="2" x2="12" y2="6"></line>
      <line x1="12" y1="18" x2="12" y2="22"></line>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
      <line x1="2" y1="12" x2="6" y2="12"></line>
      <line x1="18" y1="12" x2="22" y2="12"></line>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
    </svg>
    <p style={{ fontFamily: FontFamily, fontSize: '16px', color: '#9e9e9e', marginTop: '16px' }}>
      Loading match data...
    </p>
  </div>
);

const ErrorState = ({ onRetry }) => (
  <div style={styles.centerState}>
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f44336" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
    <p style={{ fontFamily: FontFamily, fontSize: '16px', color: AppColors.textPrimary, marginTop: '16px' }}>
      Failed to load matches
    </p>
    <p style={{ fontFamily: FontFamily, fontSize: '13px', color: '#9e9e9e', marginTop: '4px' }}>
      Make sure the C# API is running
    </p>
    <button style={styles.retryButton} onClick={onRetry}>Try Again</button>
  </div>
);

const EmptyState = ({ onUpload }) => (
  <div style={styles.centerState}>
    <div style={styles.emptyIcon}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#bdbdbd" strokeWidth="2">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
        <path d="M12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"></path>
      </svg>
    </div>
    <p style={{ fontFamily: FontFamily, fontSize: '18px', fontWeight: 'bold', color: AppColors.textPrimary, marginTop: '16px' }}>
      No matches analyzed yet
    </p>
    <p style={{ fontFamily: FontFamily, fontSize: '13px', color: '#9e9e9e', marginTop: '8px', textAlign: 'center', maxWidth: '260px' }}>
      Upload a match video and let AI analyze the key moments, events, and tactical patterns.
    </p>
    <button style={styles.uploadButton} onClick={onUpload}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AppColors.textPrimary} strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      Upload Match Video
    </button>
  </div>
);

const styles = {
  container: {
    backgroundColor: AppColors.backgroundLight,
    minHeight: '100vh',
    fontFamily: FontFamily,
    paddingBottom: '40px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
  },
  backButton: {
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
  statsBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    padding: '16px 20px',
    margin: '0 16px 16px',
    backgroundColor: AppColors.white,
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: FontFamily,
    fontSize: '20px',
    fontWeight: '800',
    color: AppColors.primary,
  },
  statLabel: {
    fontFamily: FontFamily,
    fontSize: '11px',
    color: '#9e9e9e',
    marginTop: '2px',
  },
  statDivider: {
    width: '1px',
    height: '32px',
    backgroundColor: '#e0e0e0',
  },
  list: {
    padding: '0 16px',
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: '20px',
    marginBottom: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
  },
  cardHeader: {
    padding: '16px 20px 8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: `${AppColors.primary}1A`,
    borderRadius: '12px',
  },
  aiBadgeText: {
    fontFamily: FontFamily,
    fontSize: '11px',
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  matchDate: {
    fontFamily: FontFamily,
    fontSize: '12px',
    color: '#9e9e9e',
  },
  teamsRow: {
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '80px',
  },
  teamLogo: {
    width: '56px',
    height: '56px',
    backgroundColor: '#f5f5f5',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  teamName: {
    fontFamily: FontFamily,
    fontSize: '13px',
    fontWeight: '600',
    color: AppColors.textPrimary,
    textAlign: 'center',
    margin: 0,
  },
  scoreSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  scoreBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  scoreNumber: {
    fontFamily: FontFamily,
    fontSize: '32px',
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  scoreDash: {
    fontFamily: FontFamily,
    fontSize: '24px',
    fontWeight: '300',
    color: '#bdbdbd',
  },
  matchLocation: {
    fontFamily: FontFamily,
    fontSize: '10px',
    color: '#bdbdbd',
    marginTop: '4px',
  },
  eventsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px 16px',
    borderTop: '1px solid #f5f5f5',
  },
  eventChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: `${AppColors.primary}0D`,
    borderRadius: '20px',
  },
  eventChipText: {
    fontFamily: FontFamily,
    fontSize: '12px',
    fontWeight: '500',
    color: AppColors.primary,
  },
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  viewButtonText: {
    fontFamily: FontFamily,
    fontSize: '13px',
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  centerState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    padding: '24px',
    fontFamily: FontFamily,
  },
  emptyIcon: {
    width: '80px',
    height: '80px',
    backgroundColor: '#f5f5f5',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    marginTop: '20px',
    padding: '12px 32px',
    backgroundColor: AppColors.primary,
    borderRadius: '24px',
    fontFamily: FontFamily,
    fontSize: '14px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    border: 'none',
    cursor: 'pointer',
  },
  uploadButton: {
    marginTop: '24px',
    padding: '14px 28px',
    backgroundColor: AppColors.primary,
    borderRadius: '24px',
    fontFamily: FontFamily,
    fontSize: '14px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: `0 4px 12px ${AppColors.primary}33`,
  },
};

export default AIPredictionsScreen;
