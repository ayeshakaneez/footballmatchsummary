import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors, FontFamily } from '../theme';

const SplashScreen = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const animationRef = useRef();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/signin');
    }, 3000);

    const startTime = Date.now();
    const duration = 3000;
    const targetProgress = 0.65;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(targetProgress * (elapsed / duration), targetProgress);
      setProgress(newProgress);
      
      if (elapsed < duration) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      clearTimeout(timer);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.circle1} />
      <div style={styles.circle2} />
      
      <div style={styles.content}>
        <div style={styles.logoContainer}>
          <div style={styles.logoOuter}>
            <div style={styles.logoInner}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={AppColors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </div>
            <div style={styles.soccerBadge}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={AppColors.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a10 10 0 0 0 0 20"></path>
              </svg>
            </div>
          </div>
        </div>
        
        <div style={styles.textContainer}>
          <h1 style={styles.title}>
            <span style={styles.titleFooty}>Footy</span>
            <span style={styles.titleAI}>AI</span>
          </h1>
          <p style={styles.subtitle}>Smart Football Analytics</p>
        </div>
        
        <div style={styles.progressContainer}>
          <div style={styles.progressHeader}>
            <span style={styles.progressLabel}>INITIALIZING ENGINE</span>
            <span style={styles.progressPercent}>{Math.round(progress * 100)}%</span>
          </div>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${progress * 100}%`}} />
          </div>
        </div>
      </div>
      
      <div style={styles.footer}>
        <p style={styles.poweredBy}>POWERED BY ADVANCED DATA</p>
        <div style={styles.footerLine} />
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: AppColors.backgroundLight,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '20px',
    fontFamily: FontFamily,
    position: 'relative',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: '50%',
    backgroundColor: `${AppColors.primary}0D`,
    filter: `blur(100px)`,
  },
  circle2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: '50%',
    backgroundColor: `${AppColors.primary}0D`,
    filter: `blur(100px)`,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '340px',
    margin: '0 auto',
    width: '100%',
  },
  logoContainer: {
    marginBottom: '32px',
  },
  logoOuter: {
    position: 'relative',
    width: '140px',
    height: '140px',
  },
  logoInner: {
    width: '100%',
    height: '100%',
    backgroundColor: `${AppColors.primary}33`,
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 0 40px ${AppColors.primary}33`,
  },
  soccerBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '40px',
    height: '40px',
    backgroundColor: AppColors.primary,
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 0 8px ${AppColors.primary}33`,
  },
  textContainer: {
    textAlign: 'center',
    marginBottom: '64px',
  },
  title: {
    fontFamily: FontFamily,
    fontSize: '42px',
    fontWeight: 'bold',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  titleFooty: {
    color: AppColors.textPrimary,
  },
  titleAI: {
    color: AppColors.primary,
    fontWeight: '800',
  },
  subtitle: {
    fontFamily: FontFamily,
    fontSize: '16px',
    fontWeight: '300',
    color: AppColors.textPrimary,
    letterSpacing: '1px',
    marginTop: '4px',
  },
  progressContainer: {
    width: '100%',
    maxWidth: '180px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  progressLabel: {
    fontFamily: FontFamily,
    fontSize: '10px',
    fontWeight: '500',
    letterSpacing: '2px',
    color: AppColors.textPrimary,
  },
  progressPercent: {
    fontFamily: FontFamily,
    fontSize: '10px',
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  progressBar: {
    width: '100%',
    height: '6px',
    backgroundColor: `${AppColors.primary}1A`,
    borderRadius: '10px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: '10px',
    transition: 'width 0.1s ease',
  },
  footer: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  poweredBy: {
    fontFamily: FontFamily,
    fontSize: '11px',
    fontWeight: '500',
    letterSpacing: '4px',
    color: AppColors.textPrimary,
    marginBottom: '8px',
  },
  footerLine: {
    width: '30px',
    height: '4px',
    backgroundColor: `${AppColors.primary}33`,
    borderRadius: '2px',
    margin: '0 auto',
  },
};

export default SplashScreen;