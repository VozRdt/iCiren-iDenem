import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import AboutPage from './pages/AboutPage';
import AuthPage from './pages/AuthPage';
import SellPage from './pages/SellPage';
import MyIdeasPage from './pages/MyIdeasPage';
import ProfilePage from './pages/ProfilePage';
import WalletPage from './pages/WalletPage';
import AdminPage from './pages/AdminPage';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  React.useEffect(() => {
    if (navType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [pathname, navType]);

  React.useEffect(() => {
    // Detect Supabase auth errors from URL hash (e.g. expired link)
    const hash = window.location.hash;
    if (hash && hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorDesc = params.get('error_description');
      if (errorDesc) {
        toast.error('Auth Error: ' + decodeURIComponent(errorDesc).replace(/\+/g, ' '), { duration: 5000 });
      }
      // Clean up the hash after reading
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Navbar />
          {/* Main Routes */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/sell" element={<SellPage />} />
            <Route path="/myideas" element={<MyIdeasPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
          <Footer />
          <Toaster position="bottom-right" />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
