
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

type ProtectedRouteProps = {
  requiredRole?: 'admin' | 'user';
};

export default function ProtectedRoute({
  requiredRole,
}: ProtectedRouteProps) {
  const { token, role } = useAuth();
  const location = useLocation();

  if (!token) {
    const redirect = encodeURIComponent(
      location.pathname + location.search,
    );

    return <Navigate to={`/register?redirect=${redirect}`} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
