// src/hooks/usePermissions.ts
import { useState, useEffect } from 'react';

// Export UserRole type
export type UserRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

// Export User interface
export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  tenant_id: number;
}

export interface Permissions {
  // User management
  canManageUsers: boolean;
  canCreateUser: boolean;
  canEditUser: boolean;
  canDeleteUser: boolean;
  canViewUsers: boolean;
  
  // Content management (posts, categories, features)
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
  
  // General role checks
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  role: UserRole | null;
}

export const usePermissions = (): Permissions => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  const role = user?.role?.toUpperCase() as UserRole | null;

  // Helper functions
  const isOwner = role === 'OWNER';
  const isAdmin = role === 'ADMIN';
  const isEditor = role === 'EDITOR';
  const isViewer = role === 'VIEWER';

  const isOwnerOrAdmin = isOwner || isAdmin;
  const canEdit = isOwner || isAdmin || isEditor;

  return {
    // User management
    canManageUsers: isOwnerOrAdmin,
    canCreateUser: isOwnerOrAdmin,
    canEditUser: isOwnerOrAdmin,
    canDeleteUser: isOwner, // Only OWNER can delete users
    canViewUsers: true, // All authenticated users can view
    
    // Content management
    canCreateContent: canEdit, // OWNER, ADMIN, EDITOR
    canEditContent: canEdit, // OWNER, ADMIN, EDITOR
    canDeleteContent: isOwnerOrAdmin, // Only OWNER, ADMIN
    canPublishContent: canEdit, // OWNER, ADMIN, EDITOR
    canArchiveContent: isOwnerOrAdmin, // Only OWNER, ADMIN
    canViewContent: true, // All authenticated users
    
    // Property management
    canCreateProperty: isOwnerOrAdmin,
    canEditProperty: isOwnerOrAdmin,
    canDeleteProperty: isOwnerOrAdmin,
    canViewProperties: true, // All authenticated users
    
    // Media management
    canUploadMedia: canEdit, // OWNER, ADMIN, EDITOR
    canEditMedia: canEdit, // OWNER, ADMIN, EDITOR
    canDeleteMedia: isOwnerOrAdmin, // Only OWNER, ADMIN
    canViewMedia: true, // All authenticated users
    
    // Settings
    canManageSettings: isOwnerOrAdmin,
    canViewSettings: true, // All authenticated users
    
    // Tenant management
    canManageTenant: isOwner, // Only OWNER
    canViewTenant: true, // All authenticated users
    
    // Analytics
    canViewAnalytics: true, // All authenticated users
    canExportAnalytics: isOwnerOrAdmin, // Only OWNER, ADMIN
    
    // General role checks
    isOwner,
    isAdmin,
    isEditor,
    isViewer,
    role,
  };
};

// Hook to check if user has specific permission
export const useHasPermission = (permission: keyof Permissions): boolean => {
  const permissions = usePermissions();
  return permissions[permission] as boolean;
};

// Hook to get user role
export const useUserRole = (): UserRole | null => {
  const permissions = usePermissions();
  return permissions.role;
};

