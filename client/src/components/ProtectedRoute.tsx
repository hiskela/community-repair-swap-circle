
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function ProtectedRoute() {
  const { token } = useAuth();
  const location = useLocation();

  if (token) return <Outlet />;

  const redirect = encodeURIComponent(location.pathname + location.search);
  return <Navigate to={`/register?redirect=${redirect}`} replace />;
}
