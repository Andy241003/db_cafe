// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

// Define UserRole type locally to avoid import issues
type UserRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requireOwner?: boolean;
  requireAdmin?: boolean;
  requireEditor?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  requireOwner = false,
  requireAdmin = false,
  requireEditor = false,
}) => {
  const permissions = usePermissions();
  const { role, isOwner, isAdmin, isEditor } = permissions;

  // Check if user is authenticated
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requireOwner && !isOwner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-4">
            This page is only accessible to OWNER users.
          </p>
          <p className="text-sm text-gray-500">
            Your current role: <span className="font-semibold">{role}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin && !isOwner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-4">
            This page is only accessible to OWNER and ADMIN users.
          </p>
          <p className="text-sm text-gray-500">
            Your current role: <span className="font-semibold">{role}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (requireEditor && !isEditor && !isAdmin && !isOwner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-4">
            This page is only accessible to OWNER, ADMIN, and EDITOR users.
          </p>
          <p className="text-sm text-gray-500">
            Your current role: <span className="font-semibold">{role}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (requiredRoles && requiredRoles.length > 0 && role && !requiredRoles.includes(role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Your current role: <span className="font-semibold">{role}</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Required roles: <span className="font-semibold">{requiredRoles.join(', ')}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

