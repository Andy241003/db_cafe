import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions, useServiceAccess } from '../hooks/usePermissions';

type UserRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
type ServiceCode = 'travel-link' | 'vr-hotel';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requireOwner?: boolean;
  requireAdmin?: boolean;
  requireEditor?: boolean;
  requireService?: ServiceCode;
}

interface AccessDeniedProps {
  title: string;
  message: string;
  userRole?: UserRole | null;
  requiredRoles?: UserRole[];
  availableServices?: string[];
  onAction: () => void;
  actionLabel: string;
}

// Reusable Access Denied Component
const AccessDenied: React.FC<AccessDeniedProps> = ({
  title,
  message,
  userRole,
  requiredRoles,
  availableServices,
  onAction,
  actionLabel
}) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">{title}</h2>
      <p className="text-gray-700 mb-4">{message}</p>
      
      {userRole && (
        <p className="text-sm text-gray-500">
          Your current role: <span className="font-semibold">{userRole}</span>
        </p>
      )}
      
      {requiredRoles && requiredRoles.length > 0 && (
        <p className="text-sm text-gray-500 mt-2">
          Required roles: <span className="font-semibold">{requiredRoles.join(', ')}</span>
        </p>
      )}
      
      {availableServices && (
        <p className="text-sm text-gray-500">
          Available services: <span className="font-semibold">{availableServices.join(', ')}</span>
        </p>
      )}
      
      <button
        onClick={onAction}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        {actionLabel}
      </button>
    </div>
  </div>
);

// Role checking utilities
const useRoleAccess = () => {
  const permissions = usePermissions();
  const { role, isOwner, isAdmin, isEditor } = permissions;

  const checkRoleAccess = (
    requiredRoles?: UserRole[],
    requireOwner = false,
    requireAdmin = false,
    requireEditor = false
  ): { hasAccess: boolean; requiredRoles: UserRole[] } => {
    // Build effective required roles
    const effectiveRequiredRoles: UserRole[] = [];
    
    if (requireOwner) effectiveRequiredRoles.push('OWNER');
    if (requireAdmin) effectiveRequiredRoles.push('OWNER', 'ADMIN');
    if (requireEditor) effectiveRequiredRoles.push('OWNER', 'ADMIN', 'EDITOR');
    if (requiredRoles) effectiveRequiredRoles.push(...requiredRoles);

    // Remove duplicates
    const uniqueRequiredRoles = [...new Set(effectiveRequiredRoles)];
    
    // Check access based on role hierarchy
    let hasAccess = true;
    
    if (requireOwner && !isOwner) hasAccess = false;
    else if (requireAdmin && !isAdmin && !isOwner) hasAccess = false;
    else if (requireEditor && !isEditor && !isAdmin && !isOwner) hasAccess = false;
    else if (requiredRoles && requiredRoles.length > 0 && role && !requiredRoles.includes(role)) hasAccess = false;

    return { hasAccess, requiredRoles: uniqueRequiredRoles };
  };

  return { role, checkRoleAccess };
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  requireOwner = false,
  requireAdmin = false,
  requireEditor = false,
  requireService,
}) => {
  const { role, checkRoleAccess } = useRoleAccess();
  const serviceAccess = useServiceAccess();

  // Check if user is authenticated
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check service access first
  if (requireService) {
    const hasServiceAccess = 
      requireService === 'travel-link' ? serviceAccess.canAccessTravelLink : serviceAccess.canAccessVrHotel;

    if (!hasServiceAccess) {
      return (
        <AccessDenied
          title="Service Access Denied"
          message={`You don't have access to the ${requireService === 'travel-link' ? 'Travel Link' : 'VR Hotel'} service.`}
          availableServices={serviceAccess.availableServices}
          onAction={() => window.location.href = '/dashboard-selection'}
          actionLabel="Go to Dashboard Selection"
        />
      );
    }
  }

  // Check role access
  const { hasAccess, requiredRoles: effectiveRequiredRoles } = checkRoleAccess(
    requiredRoles, requireOwner, requireAdmin, requireEditor
  );

  if (!hasAccess) {
    let message = "You don't have permission to access this page.";
    
    if (requireOwner) {
      message = "This page is only accessible to OWNER users.";
    } else if (requireAdmin) {
      message = "This page is only accessible to OWNER and ADMIN users.";
    } else if (requireEditor) {
      message = "This page is only accessible to OWNER, ADMIN, and EDITOR users.";
    }

    return (
      <AccessDenied
        title="Access Denied"
        message={message}
        userRole={role}
        requiredRoles={effectiveRequiredRoles}
        onAction={() => window.history.back()}
        actionLabel="Go Back"
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
