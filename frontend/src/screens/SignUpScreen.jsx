import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors, FontFamily } from '../theme';
import { signUp } from '../services/api';

const SignUpScreen = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmError, setConfirmError] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setConfirmError(false);

    if (password !== confirmPassword) {
      setConfirmError(true);
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await signUp({ fullName: name, email, password });
      const data = await response.json();

      if (response.ok && data.success) {
        navigate('/signin');
      } else {
        setError(Array.isArray(data.detail) ? data.detail.map(item => item.msg).join('; ') : data.detail || data.message || 'Sign up failed');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const buttonStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: AppColors.primary,
    color: AppColors.backgroundDark,
    fontFamily: FontFamily,
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: loading ? 'not-allowed' : 'pointer',
    marginTop: '8px',
    opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={styles.container}>
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
        
        <h1 style={styles.title}>
          <span style={styles.titleFooty}>Footy</span>
          <span style={styles.titleAI}>AI</span>
        </h1>
        <p style={styles.subtitle}>Create Your Account</p>

        <form style={styles.form} onSubmit={handleSignUp}>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.inputContainer}>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.inputContainer}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.inputContainer}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.inputContainer}>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(false); setError(''); }}
              style={{
                ...styles.input,
                border: confirmError ? '1.5px solid #c62828' : `1px solid ${AppColors.primary}33`,
              }}
              required
            />
            {confirmError && (
              <p style={styles.confirmError}>Passwords do not match</p>
            )}
          </div>
          <button type="submit" style={buttonStyle}>Sign Up</button>
        </form>

        <div style={styles.switchContainer}>
          <p style={styles.switchText}>Already have an account?</p>
          <button style={styles.switchButton} onClick={() => navigate('/signin')}>Sign In</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: AppColors.backgroundLight,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: FontFamily,
  },
  content: {
    width: '100%',
    maxWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: '20px',
  },
  logoOuter: {
    position: 'relative',
    width: '100px',
    height: '100px',
  },
  logoInner: {
    width: '100%',
    height: '100%',
    backgroundColor: `${AppColors.primary}33`,
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 0 30px ${AppColors.primary}33`,
  },
  soccerBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '32px',
    height: '32px',
    backgroundColor: AppColors.primary,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontFamily,
    fontSize: '36px',
    fontWeight: 'bold',
    letterSpacing: '-0.5px',
    margin: '0 0 8px 0',
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
    fontSize: '14px',
    fontWeight: '300',
    color: AppColors.textSecondary,
    letterSpacing: '1px',
    margin: '0 0 32px 0',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '10px',
    border: `1px solid ${AppColors.primary}33`,
    backgroundColor: AppColors.white,
    fontFamily: FontFamily,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  error: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: '8px',
    fontFamily: FontFamily,
    fontSize: '14px',
    textAlign: 'center',
  },
  confirmError: {
    fontFamily: FontFamily,
    fontSize: '12px',
    color: '#c62828',
    margin: '4px 0 0 4px',
  },
  switchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
  },
  switchText: {
    fontFamily: FontFamily,
    fontSize: '14px',
    color: AppColors.textSecondary,
    margin: 0,
  },
  switchButton: {
    background: 'none',
    border: 'none',
    color: AppColors.primary,
    fontFamily: FontFamily,
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default SignUpScreen;
