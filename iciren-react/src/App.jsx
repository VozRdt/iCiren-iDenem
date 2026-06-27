import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { initGSAP, animateCurrentPage, getLenis } from './lib/animations';

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

function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  // Initialize GSAP once
  React.useEffect(() => {
    initGSAP();
  }, []);

  React.useEffect(() => {
    if (navType !== 'POP') {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }
    }

    // Trigger page animations after DOM updates
    const timer = setTimeout(() => {
      let pageName = 'home';
      if (pathname === '/') pageName = 'home';
      else if (pathname.startsWith('/explore')) pageName = 'explore';
      else if (pathname.startsWith('/sell')) pageName = 'sell';
      else if (pathname.startsWith('/about')) pageName = 'about';
      else if (pathname.startsWith('/myideas')) pageName = 'myideas';
      else if (pathname.startsWith('/auth')) pageName = 'auth';
      else if (pathname.startsWith('/profile')) pageName = 'profile';
      else if (pathname.startsWith('/admin')) pageName = 'admin';
      
      animateCurrentPage(pageName);
    }, 100);

    return () => clearTimeout(timer);
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
            <Route path="/explore" element={
              <ProtectedRoute>
                <ExplorePage />
              </ProtectedRoute>
            } />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/sell" element={
              <ProtectedRoute requireBankInfo={true}>
                <SellPage />
              </ProtectedRoute>
            } />
            <Route path="/myideas" element={
              <ProtectedRoute>
                <MyIdeasPage />
              </ProtectedRoute>
            } />
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
