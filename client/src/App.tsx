
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import EditListingPage from './pages/EditListingPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ListingsPage from './pages/ListingsPage';
import CreateListingPage from './pages/CreateListingPage';
import ListingDetailsPage from './pages/ListingDetailsPage';
import CreateOfferPage from './pages/CreateOfferPage';
import SentOffersPage from './pages/SentOffersPage';
import ReceivedOffersPage from './pages/ReceivedOffersPage';
import MyTransactionsPage from './pages/MyTransactionsPage';
import MyListingsPage from './pages/MyListingsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminLayout from './components/admin/AdminLayout';
function AppRoutes() {
  const { token } = useAuth();

  return (
    <>
      <Navbar />

      <Routes>
        {/* Public homepage — guests see landing page, logged-in users see dashboard */}
        <Route
          path="/"
          element={ <HomePage />}
        />

        {/* Auth pages — redirect to dashboard if already logged in */}
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={token ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
        />

        {/* Public listing browsing — no authentication required */}
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/listings/:id" element={<ListingDetailsPage />} />

        {/* Protected routes — require authentication */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/listings/new" element={<CreateListingPage />} />
          <Route path="/listings/:id/offer" element={<CreateOfferPage />} />
          <Route path="/my-listings" element={<MyListingsPage />} />
<Route path="/listings/:id/edit" element={<EditListingPage />} />
          <Route path="/offers/sent" element={<SentOffersPage />} />
          <Route path="/offers/received" element={<ReceivedOffersPage />} />
          <Route path="/transactions" element={<MyTransactionsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
<Route element={<ProtectedRoute requiredRole="admin" />}>
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboardPage />} />
  </Route>
</Route>
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
