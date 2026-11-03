import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';
import { Spinner } from '../components/common/Spinner';

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'staff';
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas">
        <Spinner size="lg" message="Vérification de la session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (requiredRole === 'admin' && user?.role !== 'admin') {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
