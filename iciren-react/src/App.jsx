import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

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

  return null;
}

function App() {
  return (
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
  );
}

export default App;
