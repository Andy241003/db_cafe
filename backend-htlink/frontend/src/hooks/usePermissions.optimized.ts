import { useState, useEffect, useMemo, useCallback } from 'react';

// Export types
export type UserRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  tenant_id: number;
  service_access?: number;
}

export interface Permissions {
  // User management
  canManageUsers: boolean;
  canCreateUser: boolean;
  canEditUser: boolean;
  canDeleteUser: boolean;
  canViewUsers: boolean;
  
  // Content management
  canCreateContent: boolean;
  canEditContent: boolean;
  canDeleteContent: boolean;
  canPublishContent: boolean;
  canArchiveContent: boolean;
  canViewContent: boolean;
  
  // Property management
  canCreateProperty: boolean;
  canEditProperty: boolean;
  canDeleteProperty: boolean;
  canViewProperties: boolean;
  
  // Media management
  canUploadMedia: boolean;
  canEditMedia: boolean;
  canDeleteMedia: boolean;
  canViewMedia: boolean;
  
  // Settings
  canManageSettings: boolean;
  canViewSettings: boolean;
  
  // Tenant management
  canManageTenant: boolean;
  canViewTenant: boolean;
  
  // Analytics
  canViewAnalytics: boolean;
  canExportAnalytics: boolean;
  
  // Role checks
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  role: UserRole | null;
}

interface ServiceAccess {
  serviceAccess: number;
  availableServices: string[];
  canAccessTravelLink: boolean;
  canAccessVrHotel: boolean;
  hasMultipleServices: boolean;
}

// Constants for permission calculations
const ROLE_HIERARCHY: Record<UserRole, number> = {
  'VIEWER': 1,
  'EDITOR': 2,
  'ADMIN': 3,
  'OWNER': 4
};

// Custom hook for user data with memoization
const useUserData = () => {
  const [user, setUser] = useState<User | null>(null);

  const getUserFromStorage = useCallback((): User | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const userData = getUserFromStorage();
    setUser(userData);

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        const newUser = getUserFromStorage();
        setUser(newUser);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [getUserFromStorage]);

  return user;
};

// Permission calculation utilities
const calculatePermissions = (role: UserRole | null): Permissions => {
  const isOwner = role === 'OWNER';
  const isAdmin = role === 'ADMIN';
  const isEditor = role === 'EDITOR';
  const isViewer = role === 'VIEWER';

  const isOwnerOrAdmin = isOwner || isAdmin;
  const canEdit = isOwner || isAdmin || isEditor;
  const isAuthenticated = role !== null;

  return {
    // User management
    canManageUsers: isOwnerOrAdmin,
    canCreateUser: isOwnerOrAdmin,
    canEditUser: isOwnerOrAdmin,
    canDeleteUser: isOwner,
    canViewUsers: isAuthenticated,
    
    // Content management
    canCreateContent: canEdit,
    canEditContent: canEdit,
    canDeleteContent: canEdit,
    canPublishContent: canEdit,
    canArchiveContent: canEdit,
    canViewContent: isAuthenticated,
    
    // Property management
    canCreateProperty: isOwnerOrAdmin,
    canEditProperty: isOwnerOrAdmin,
    canDeleteProperty: isOwnerOrAdmin,
    canViewProperties: isAuthenticated,
    
    // Media management
    canUploadMedia: canEdit,
    canEditMedia: canEdit,
    canDeleteMedia: canEdit,
    canViewMedia: isAuthenticated,
    
    // Settings
    canManageSettings: isOwnerOrAdmin,
    canViewSettings: isAuthenticated,
    
    // Tenant management
    canManageTenant: isOwner,
    canViewTenant: isAuthenticated,
    
    // Analytics
    canViewAnalytics: isAuthenticated,
    canExportAnalytics: isOwnerOrAdmin,
    
    // Role checks
    isOwner,
    isAdmin,
    isEditor,
    isViewer,
    role,
  };
};

export const usePermissions = (): Permissions => {
  const user = useUserData();
  
  return useMemo(() => {
    const role = user?.role?.toUpperCase() as UserRole | null;
    return calculatePermissions(role);
  }, [user?.role]);
};

// Service access hook with localStorage sync
export const useServiceAccess = (): ServiceAccess => {
  const [serviceAccess, setServiceAccess] = useState<number>(0);
  const [availableServices, setAvailableServices] = useState<string[]>(['travel-link']);

  const getServiceAccessFromStorage = useCallback(() => {
    const storedServiceAccess = localStorage.getItem('service_access');
    const storedServices = localStorage.getItem('available_services');
    
    return {
      access: storedServiceAccess ? Number(storedServiceAccess) : 0,
      services: storedServices ? JSON.parse(storedServices) : ['travel-link']
    };
  }, []);

  useEffect(() => {
    const { access, services } = getServiceAccessFromStorage();
    setServiceAccess(access);
    setAvailableServices(services);

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'service_access' || e.key === 'available_services') {
        const { access: newAccess, services: newServices } = getServiceAccessFromStorage();
        setServiceAccess(newAccess);
        setAvailableServices(newServices);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [getServiceAccessFromStorage]);

  return useMemo(() => ({
    serviceAccess,
    availableServices,
    canAccessTravelLink: availableServices.includes('travel-link'),
    canAccessVrHotel: availableServices.includes('vr-hotel'),
    hasMultipleServices: availableServices.length > 1,
  }), [serviceAccess, availableServices]);
};

// Utility hooks
export const useHasPermission = (permission: keyof Permissions): boolean => {
  const permissions = usePermissions();
  return permissions[permission] as boolean;
};

export const useUserRole = (): UserRole | null => {
  const permissions = usePermissions();
  return permissions.role;
};

export const useRoleLevel = (): number => {
  const role = useUserRole();
  return role ? ROLE_HIERARCHY[role] : 0;
};

// Check if user has minimum role level
export const useHasMinRole = (minRole: UserRole): boolean => {
  const currentLevel = useRoleLevel();
  const requiredLevel = ROLE_HIERARCHY[minRole];
  return currentLevel >= requiredLevel;
};