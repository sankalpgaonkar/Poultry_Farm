import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth, homeFor } from './context/AuthContext';

// Every page is loaded on demand, so the first visit downloads only what it needs.
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const FarmerDashboard = lazy(() => import('./pages/FarmerDashboard'));
const BuyerDashboard = lazy(() => import('./pages/BuyerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main id="main" className="flex-grow">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

/** Only lets in a logged-in user with the right role; others go to login or their own dashboard. */
function RequireRole({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

/** Logged-in users opening /login or /signup go straight to their dashboard. */
function GuestOnly({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to={homeFor(user.role)} replace /> : children;
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <a href="#main" className="skip-link">Skip to main content</a>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader fullScreen />}>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                  <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="/farmer/*" element={<RequireRole role="Farmer"><FarmerDashboard /></RequireRole>} />
                <Route path="/buyer/*" element={<RequireRole role="Buyer"><BuyerDashboard /></RequireRole>} />
                <Route path="/admin/*" element={<RequireRole role="Admin"><AdminDashboard /></RequireRole>} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
}
