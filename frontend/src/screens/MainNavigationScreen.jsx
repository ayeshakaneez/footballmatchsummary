import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors, FontFamily } from '../theme';
import HomeScreen from './HomeScreen';
import AIPredictionsScreen from './AIPredictionsScreen';
import AIVideoUpload from './AIVideoUpload';

const MainNavigationScreen = () => {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/signin');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/signin');
  };

  const pages = [
    <HomeScreen key="home" />,
    <AIPredictionsScreen key="predictions" />,
    <AIVideoUpload key="upload" />,
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <span style={styles.titleFooty}>Footy</span>
          <span style={styles.titleAI}>AI</span>
        </h1>
        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
      
      {pages[selectedIndex]}
      
      <div style={styles.bottomNav}>
        <NavItem icon="home" label="Home" index={0} selected={selectedIndex} onSelect={setSelectedIndex} />
        <NavItem icon="auto_awesome" label="Predictions" index={1} selected={selectedIndex} onSelect={setSelectedIndex} />
        <NavItem icon="video_call" label="AI Analyst" index={2} selected={selectedIndex} onSelect={setSelectedIndex} />
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, index, selected, onSelect }) => {
  const isSelected = selected === index;
  
  return (
    <div 
      style={styles.navItem} 
      onClick={() => onSelect(index)}
    >
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={isSelected ? AppColors.primary : '#9e9e9e'} 
        strokeWidth="2"
      >
        {icon === 'home' && <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>}
        {icon === 'auto_awesome' && <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>}
        {icon === 'video_call' && <path d="M23 7l-7 5 7 5V7z"></path>}
        {icon === 'video_call' && <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>}
      </svg>
      <span style={{...styles.navLabel, color: isSelected ? AppColors.primary : '#9e9e9e'}}>{label}</span>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    paddingBottom: '60px',
    fontFamily: FontFamily,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: AppColors.white,
    borderBottom: '1px solid #e0e0e0',
  },
  title: {
    fontFamily: FontFamily,
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
  },
  titleFooty: {
    color: AppColors.textPrimary,
  },
  titleAI: {
    color: AppColors.primary,
    fontWeight: '800',
  },
  logoutButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: AppColors.primary,
    color: AppColors.backgroundDark,
    fontFamily: FontFamily,
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    backgroundColor: AppColors.white,
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
    marginTop: '4px',
  },
};

export default MainNavigationScreen;