import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppColors, FontFamily } from '../theme';
import { fetchHighlights, resolveVideoUrl } from '../services/api';
import { isEventVisible } from '../services/eventVisibility';

const MatchHighlightsList = () => {
  const navigate = useNavigate();
  const matchId = useLocation().state?.matchId;
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const filters = ['All', 'Goals', 'Fouls'];


  useEffect(() => {
    const loadHighlights = async () => {
    try {
      const data = await fetchHighlights(matchId);
      // Handle both plain array and object-wrapped { value: [...] } responses
      const highlightsArray = Array.isArray(data) ? data : (data?.value || []);


      const mapped = highlightsArray.map((item) => {
        let displayTime = item.time || item.timestamp || '—';
        if (item.Event_name && item.Event_name.includes('at ')) {
          displayTime = item.Event_name.split('at ')[1];
        } else if (item.start_time !== undefined && item.start_time !== null) {
          const mins = Math.floor(item.start_time / 60).toString().padStart(2, '0');
          const secs = Math.floor(item.start_time % 60).toString().padStart(2, '0');
          displayTime = `${mins}:${secs}`;
        }

        const rawPath = item.VideoPath || item.videoPath || item.annotated_video || item.video_path || '';
        const videoPath = resolveVideoUrl(rawPath);

        const rawType = item.Event_type || item.type || item.title || 'Goal';
        const formattedType = rawType.charAt(0).toUpperCase() + rawType.slice(1);
        const playerName = item.player || item.Event_name || item.title || `${formattedType} Event`;

        return {
          id: item.E_id || item.id,
          matchId: item.matchId || item.match_id || item.M_id,
          time: displayTime,
          type: formattedType,
          player: playerName,
          title: item.title || `${formattedType} – ${displayTime}`,
          team: item.team || '',
          description: item.Description || item.description || 'Detected by AI analysis',
          videoPath: videoPath,
          teamHome: item.teamHome || 'Team 1',
          teamAway: item.teamAway || 'Team 2',
          scoreHome: item.scoreHome ?? '?',
          scoreAway: item.scoreAway ?? '?',
        };
      });
      // setHighlights(mapped); // Restore to show shots, saves and passes too.
      setHighlights(mapped.filter(isEventVisible));
    } catch (error) {
      console.error('Error loading highlights:', error);
      setHighlights([]);
    } finally {
      setLoading(false);
    }
    };
    loadHighlights();
  }, [matchId]);

  const filteredHighlights = highlights.filter((h) => {
    if (selectedFilter === 'All') return true;
    return h.type.toLowerCase() === selectedFilter.toLowerCase().replace(/s$/, '');
  });

  const getHighlightColor = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('goal')) return AppColors.primary;
    if (t.includes('foul')) return '#FFC107';
    if (t.includes('card')) return '#FFC107';
    // if (t.includes('save')) return '#2196F3'; // Save events are hidden in the UI.
    return AppColors.primary;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.headerButton} onClick={() => navigate('/upload')}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={AppColors.textPrimary} strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <h1 style={styles.headerTitle}>Match Highlights</h1>
        <button style={styles.headerButton} onClick={() => navigate('/home')}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={AppColors.textPrimary} strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          </svg>
        </button>
      </div>

      {/* Summary header */}
      <div style={styles.matchSummary}>
        <div style={styles.summaryBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
          <span style={{ fontFamily: FontFamily, fontSize: '11px', fontWeight: 'bold', color: AppColors.primary, letterSpacing: '1px' }}>
            AI-POWERED • {highlights.length} EVENTS DETECTED
          </span>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersContainer}>
        {filters.map((filter) => (
          <button
            key={filter}
            style={{
              ...styles.filterChip,
              backgroundColor: selectedFilter === filter ? AppColors.primary : AppColors.white,
              borderColor: selectedFilter === filter ? AppColors.primary : '#e0e0e0',
            }}
            onClick={() => setSelectedFilter(filter)}
          >
            <span style={{
              fontFamily: FontFamily,
              fontSize: '13px',
              fontWeight: '600',
              color: selectedFilter === filter ? AppColors.textPrimary : '#757575',
            }}>
              {filter === 'All' ? `All (${highlights.length})` : filter}
            </span>
          </button>
        ))}
      </div>

      {/* Highlights list */}
      <div style={styles.highlightsList}>
        {loading ? (
          <div style={styles.emptyState}>
            <p style={{ fontFamily: FontFamily, color: '#9e9e9e' }}>Loading highlights from database...</p>
          </div>
        ) : filteredHighlights.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎬</div>
            <p style={{ fontFamily: FontFamily, fontSize: '16px', fontWeight: 'bold', color: AppColors.textPrimary, marginBottom: '8px' }}>
              No highlights found
            </p>
            <p style={{ fontFamily: FontFamily, fontSize: '13px', color: '#9e9e9e' }}>
              Upload and analyze a match to see highlights here
            </p>
            <button
              style={{ ...styles.uploadCTA, marginTop: '16px' }}
              onClick={() => navigate('/upload')}
            >
              Upload Video
            </button>
          </div>
        ) : (
          filteredHighlights.map((highlight) => {
            const color = getHighlightColor(highlight.type);
            return (
              <div
                key={highlight.id}
                style={styles.highlightCard}
                onClick={() => navigate('/expanded', { state: { highlight } })}
              >
                <div style={styles.cardHeaderRow}>
                  <div style={{ ...styles.cardIcon, backgroundColor: `${color}33` }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
                      {highlight.type.toLowerCase().includes('goal') && <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>}
                      {highlight.type.toLowerCase().includes('goal') && <path d="M12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"></path>}
                      {highlight.type.toLowerCase().includes('foul') && <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>}
                      {!highlight.type.toLowerCase().includes('goal') && !highlight.type.toLowerCase().includes('foul') && <circle cx="12" cy="12" r="10"></circle>}
                    </svg>
                  </div>
                  <div style={styles.cardTitle}>
                    <p style={styles.cardEvent}>
                      {highlight.type || 'Event'} {highlight.time && highlight.time !== '—' ? `– ${highlight.time}` : ''}
                    </p>
                    {highlight.player && highlight.player !== highlight.type && (
                      <p style={styles.cardPlayer}>{highlight.player}</p>
                    )}
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#bdbdbd" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"></path>
                  </svg>
                </div>

                {/* Video Clip Preview */}
                {highlight.videoPath && (
                  <div style={styles.videoContainer} onClick={(e) => e.stopPropagation()}>
                    <video
                      src={highlight.videoPath}
                      controls
                      preload="metadata"
                      playsInline
                      style={styles.videoPlayer}
                    >
                      Your browser does not support video playback.
                    </video>
                  </div>
                )}

                {highlight.description && (
                  <div style={styles.aiSummary}>
                    <div style={styles.aiHeader}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                      </svg>
                      <span style={{ fontFamily: FontFamily, fontSize: '10px', fontWeight: 'bold', color: AppColors.primary, letterSpacing: '1px' }}>AI SUMMARY</span>
                    </div>
                    <p style={styles.aiText}>{highlight.description}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      {highlights.length > 0 && (
        <div style={styles.fabContainer}>
          <button
            style={styles.fab}
            onClick={() => {
              const targetMatchId = highlights.find(h => h.matchId)?.matchId;
              navigate('/summary', { state: { matchId: targetMatchId, highlights } });
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AppColors.white} strokeWidth="2">
              <path d="M3 3v18h18"></path>
            </svg>
            <span style={{ fontFamily: FontFamily, fontSize: '14px', fontWeight: 'bold', color: AppColors.white }}>
              VIEW FULL SUMMARY
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: AppColors.backgroundLight,
    minHeight: '100vh',
    fontFamily: FontFamily,
    paddingBottom: '100px',
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
  matchSummary: {
    padding: '8px 24px 16px',
    textAlign: 'center',
  },
  summaryBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: `${AppColors.primary}1A`,
    borderRadius: '20px',
  },
  filtersContainer: {
    display: 'flex',
    gap: '8px',
    padding: '0 16px',
    marginBottom: '16px',
    overflowX: 'auto',
  },
  filterChip: {
    height: '36px',
    padding: '0 16px',
    backgroundColor: AppColors.white,
    borderRadius: '20px',
    border: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  highlightsList: {
    padding: '0 16px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
  },
  uploadCTA: {
    padding: '12px 24px',
    backgroundColor: AppColors.primary,
    borderRadius: '24px',
    border: 'none',
    fontFamily: FontFamily,
    fontSize: '14px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    cursor: 'pointer',
  },
  highlightCard: {
    backgroundColor: AppColors.white,
    borderRadius: '16px',
    marginBottom: '16px',
    padding: '16px',
    border: '1px solid #e0e0e0',
    cursor: 'pointer',
  },
  cardHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  cardIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    flex: 1,
  },
  cardEvent: {
    fontFamily: FontFamily,
    fontSize: '14px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    margin: 0,
  },
  cardPlayer: {
    fontFamily: FontFamily,
    fontSize: '12px',
    color: '#9e9e9e',
    margin: 0,
  },
  aiSummary: {
    padding: '12px',
    backgroundColor: AppColors.backgroundLight,
    borderRadius: '8px',
    borderLeft: `4px solid ${AppColors.primary}`,
    marginTop: '12px',
  },
  aiHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '4px',
  },
  aiText: {
    fontFamily: FontFamily,
    fontSize: '12px',
    color: '#757575',
    lineHeight: 1.4,
    margin: 0,
  },
  fabContainer: {
    position: 'fixed',
    bottom: '24px',
    left: '24px',
    right: '24px',
    maxWidth: '400px',
    margin: '0 auto',
  },
  fab: {
    height: '56px',
    backgroundColor: AppColors.backgroundDark || '#1a1a2e',
    borderRadius: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    border: 'none',
  },
  videoContainer: {
    marginTop: '12px',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoPlayer: {
    width: '100%',
    aspectRatio: '16 / 9',
    objectFit: 'contain',
    borderRadius: '12px',
    display: 'block',
  },
};

export default MatchHighlightsList;
