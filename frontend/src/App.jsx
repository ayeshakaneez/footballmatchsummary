import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SplashScreen from './screens/SplashScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import MatchHighlightsList from './screens/MatchHighlightsList';
import ExpandedHighlightView from './screens/ExpandedHighlightView';
import AIVideoUpload from './screens/AIVideoUpload';
import AIProcessingScreen from './screens/AIProcessingScreen';
import AIMatchSummary from './screens/AIMatchSummary';
import AIPredictionsScreen from './screens/AIPredictionsScreen';
import MainNavigationScreen from './screens/MainNavigationScreen';
import { AppColors } from './theme';
import './global.css';

function App() {
  return (
    <Router>
      <div style={{ backgroundColor: AppColors.backgroundLight, minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/signin" element={<SignInScreen />} />
          <Route path="/signup" element={<SignUpScreen />} />
          <Route path="/home" element={<MainNavigationScreen />} />
          <Route path="/highlights" element={<MatchHighlightsList />} />
          <Route path="/highlight-detail" element={<ExpandedHighlightView />} />
          <Route path="/expanded" element={<ExpandedHighlightView />} />
          <Route path="/upload" element={<AIVideoUpload />} />
          <Route path="/processing" element={<AIProcessingScreen />} />
          <Route path="/summary" element={<AIMatchSummary />} />
          <Route path="/predictions" element={<AIPredictionsScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;