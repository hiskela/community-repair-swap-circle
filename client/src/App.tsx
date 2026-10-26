
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ListingsPage from './pages/ListingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import CreateListingPage from './pages/CreateListingPage';
import ListingDetailsPage from './pages/ListingDetailsPage';
import CreateOfferPage from './pages/CreateOfferPage';
import SentOffersPage from './pages/SentOffersPage';
import ReceivedOffersPage from './pages/ReceivedOffersPage';
import MyTransactionsPage from './pages/MyTransactionsPage';

function AppRoutes() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={token ? '/dashboard' : '/login'} replace />}
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/listings" element={<ListingsPage />} />
      </Route>
<Route path="/listings/:id" element={<ListingDetailsPage />} />
<Route path="/listings/new" element={<CreateListingPage />} />
<Route path="/listings/:id/offer" element={<CreateOfferPage />} />
<Route path="/offers/sent" element={<SentOffersPage />} />
<Route path="/offers/received" element={<ReceivedOffersPage />} />
<Route path="/transactions" element={<MyTransactionsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
