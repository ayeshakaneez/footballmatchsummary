import { resolveVideoUrl } from '../services/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppColors, FontFamily } from '../theme';
import { isEventVisible } from '../services/eventVisibility';

const ExpandedHighlightView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const highlight = location.state?.highlight || {
    title: 'Goal',
    player: 'Bellingham',
    time: '23',
    teamHome: 'RMA',
    teamAway: 'BAR',
    scoreHome: 3,
    scoreAway: 2,
    description: 'Beautiful team move finished by Bellingham with a clinical finish.',
  };

  // An old browser-history entry must not reopen a now-hidden event.
  if (!isEventVisible(highlight)) {
    return <div style={styles.container}><p>This event is hidden from highlights.</p>
      <button onClick={() => navigate('/highlights')}>Back to highlights</button></div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button style={styles.topButton} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={AppColors.textPrimary} strokeWidth="2">
            <path d="M18 15l-6-6-6 6"></path>
          </svg>
        </button>
        <div style={styles.topCenter}>
          <p style={styles.topTitle}>MATCH HIGHLIGHTS</p>
          <p style={styles.topSubtitle}>Premier League • Week 24</p>
        </div>
        <button style={styles.topButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={AppColors.textPrimary} strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
        </button>
      </div>

      <div style={styles.videoPlayer}>
        <div style={styles.videoContainer}>
          {(() => {
            const rawPath = highlight.videoPath || highlight.VideoPath || highlight.annotated_video || highlight.video_path || '';

            const videoUrl = resolveVideoUrl(rawPath);
            if (!videoUrl) {
              return (
                <div style={styles.noVideoFallback}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <p style={styles.noVideoText}>No clip available for this event</p>
                </div>
              );
            }
            return (
              <video
                key={videoUrl}
                src={videoUrl}
                controls
                autoPlay={false}
                preload="metadata"
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '16px' }}
              >
                Your browser does not support video playback.
              </video>
            );
          })()}
        </div>
      </div>

      <div style={styles.eventDetails}>
        <div style={styles.eventHeader}>
          <div style={styles.eventInfo}>
            <div style={styles.aiBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
              <span>AI Insight</span>
            </div>
            <p style={styles.eventTitle}>{highlight.title || 'Highlight'}</p>
            <p style={styles.eventMeta}>{highlight.player} • {highlight.time} Minute</p>
          </div>
          <div style={styles.scoreBoxes}>
            <div style={styles.scoreBox}>
              <span style={styles.scoreTeam}>{highlight.teamHome?.substring(0, 3).toUpperCase() || 'RMA'}</span>
              <span style={styles.scoreValue}>{highlight.scoreHome ?? '—'}</span>
            </div>
            <div style={styles.scoreDivider}></div>
            <div style={styles.scoreBox}>
              <span style={styles.scoreTeam}>{highlight.teamAway?.substring(0, 3).toUpperCase() || 'BAR'}</span>
              <span style={styles.scoreValue}>{highlight.scoreAway ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.description}>
        <p style={styles.descriptionText}>{highlight.description}</p>
        {/* Shot/pass display chips retained here, disabled at the user's request.
        <div style={styles.statsRow}>
          {['Shots', 'Pass%', 'Tackles'].map((stat) => (
            <div key={stat} style={styles.statChip}>
              <span style={styles.statText}>{stat}</span>
            </div>
          ))}
        </div>
        */}
      </div>

      <div style={styles.relatedSection}>
        <p style={styles.relatedTitle}>Other Key Moments</p>
        <div style={styles.relatedRow}>
          {['52\'', '68\'', '83\''].map((time, i) => (
            <div key={i} style={styles.relatedItem}>
              <div style={styles.relatedThumb}>
                <span style={styles.relatedTime}>{time}</span>
                <div style={styles.relatedPlay}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AppColors.white} strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="10 8 16 12 10 16 10 8"></polygon>
                  </svg>
                </div>
              </div>
              <p style={styles.relatedTitle2}>Key Moment</p>
              <p style={styles.relatedSubtitle}>Description</p>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.actionRow}>
        <button style={styles.actionButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          Save Clip
        </button>
        <button style={styles.actionButtonPrimary}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AppColors.white} strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
          Quick Export
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: AppColors.backgroundLight,
    minHeight: '100vh',
    fontFamily: FontFamily,
    paddingBottom: '20px',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
  },
  topButton: {
    width: '40px',
    height: '40px',
    backgroundColor: AppColors.white,
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  topCenter: {
    textAlign: 'center',
  },
  topTitle: {
    fontFamily: FontFamily,
    fontSize: '14px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    color: AppColors.textPrimary,
    margin: 0,
  },
  topSubtitle: {
    fontFamily: FontFamily,
    fontSize: '12px',
    color: AppColors.textSecondary,
    margin: 0,
  },
  videoPlayer: {
    padding: '0 16px',
    width: '100%',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  videoContainer: {
    aspectRatio: '16 / 9',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    borderRadius: '16px',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVideoFallback: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%',
    height: '100%',
  },
  noVideoText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '13px',
    fontFamily: FontFamily,
    margin: 0,
    textAlign: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.26), transparent)',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '64px',
    height: '64px',
    backgroundColor: AppColors.primary,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 0 16px ${AppColors.primary}4D`,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '16px',
  },
  progressBar: {
    height: '6px',
    backgroundColor: `${AppColors.primary}33`,
    borderRadius: '3px',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: '3px',
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressControls: {
    display: 'flex',
    gap: '12px',
  },
  controlButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  eventDetails: {
    padding: '16px',
  },
  eventHeader: {
    backgroundColor: AppColors.white,
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    display: 'flex',
    justifyContent: 'space-between',
  },
  eventInfo: {
    flex: 1,
  },
  aiBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: `${AppColors.primary}1A`,
    borderRadius: '6px',
    marginBottom: '8px',
  },
  eventTitle: {
    fontFamily: FontFamily,
    fontSize: '20px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    margin: '0 0 4px 0',
  },
  eventMeta: {
    fontFamily: FontFamily,
    fontSize: '14px',
    color: AppColors.textSecondary,
  },
  scoreBoxes: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  scoreBox: {
    width: '50px',
    backgroundColor: AppColors.backgroundLight,
    borderRadius: '10px',
    padding: '8px',
    textAlign: 'center',
    border: `1px solid ${AppColors.primary}33`,
  },
  scoreTeam: {
    fontFamily: FontFamily,
    fontSize: '10px',
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  scoreValue: {
    fontFamily: FontFamily,
    fontSize: '18px',
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  scoreDivider: {
    width: '1px',
    height: '12px',
    backgroundColor: '#e0e0e0',
    margin: '4px auto',
  },
  description: {
    padding: '16px',
  },
  descriptionText: {
    fontFamily: FontFamily,
    fontSize: '14px',
    color: AppColors.textPrimary,
    lineHeight: 1.5,
    marginBottom: '16px',
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
  },
  statChip: {
    padding: '8px 12px',
    backgroundColor: AppColors.backgroundLight,
    borderRadius: '12px',
    border: `1px solid ${AppColors.primary}1A`,
  },
  statText: {
    fontFamily: FontFamily,
    fontSize: '12px',
    fontWeight: '500',
    color: AppColors.textPrimary,
  },
  relatedSection: {
    padding: '16px',
  },
  relatedTitle: {
    fontFamily: FontFamily,
    fontSize: '14px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: '12px',
  },
  relatedRow: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
  },
  relatedItem: {
    width: '130px',
    flexShrink: 0,
  },
  relatedThumb: {
    height: '80px',
    backgroundColor: '#e0e0e0',
    borderRadius: '12px',
    position: 'relative',
    marginBottom: '8px',
  },
  relatedTime: {
    position: 'absolute',
    bottom: '4px',
    right: '4px',
    padding: '2px 6px',
    backgroundColor: 'rgba(0,0,0,0.54)',
    borderRadius: '4px',
    fontFamily: FontFamily,
    fontSize: '8px',
    fontWeight: 'bold',
    color: AppColors.white,
  },
  relatedPlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedTitle2: {
    fontFamily: FontFamily,
    fontSize: '12px',
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    margin: '0 0 4px 0',
  },
  relatedSubtitle: {
    fontFamily: FontFamily,
    fontSize: '10px',
    color: '#9e9e9e',
    margin: 0,
  },
  actionRow: {
    padding: '16px',
    display: 'flex',
    gap: '12px',
  },
  actionButton: {
    flex: 1,
    height: '48px',
    backgroundColor: AppColors.white,
    borderRadius: '24px',
    border: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  actionButtonPrimary: {
    flex: 1,
    height: '48px',
    backgroundColor: AppColors.primary,
    borderRadius: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
};

export default ExpandedHighlightView;
