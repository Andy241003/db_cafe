// src/components/users/UserModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { User, UserFormData, Role } from '../../types/users';

interface UserModalProps {
  isOpen: boolean;
  initialData?: User | null;
  onClose: () => void;
  onSave: (data: UserFormData) => Promise<void> | void;
}

const roleDescriptions: Record<Role, string> = {
  admin: 'Full property management and user control. Can manage all content and users.',
  editor: 'Can create and edit content, features, and posts. Cannot manage users.',
  viewer: 'Read-only access to view content and analytics. Cannot make changes.',
  owner: 'Full system access and tenant management',
};

const defaultPermissions = {
  categories: false,
  features: false,
  posts: true,
  media: true,
  analytics: false,
  users: false,
};

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  initialData = null,
  onClose,
  onSave,
}) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    id: undefined,
    name: '',
    email: '',
    role: '',
    status: 'active',
    permissions: { ...defaultPermissions },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          id: initialData.id,
          name: initialData.name ?? '',
          email: initialData.email ?? '',
          role: initialData.role ?? '',
          status: initialData.status ?? 'active',
          permissions: {
            ...defaultPermissions,
            ...(initialData.permissions ?? {}),
          },
        });
      } else {
        // Reset for new user
        setFormData({
          id: undefined,
          name: '',
          email: '',
          role: '',
          status: 'active',
          permissions: { ...defaultPermissions },
        });
      }
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!overlayRef.current) return;
      if (e.target === overlayRef.current) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [isOpen, onClose]);

  const handleChange = (
    field: keyof UserFormData,
    value: string | boolean | Record<string, boolean>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: UserFormData = {
      ...formData,
      permissions: formData.role === 'editor' ? formData.permissions : undefined,
    };
    await onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-800">
            {initialData ? 'Edit User' : 'Add New User'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            aria-label="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm bg-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm bg-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Role
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm bg-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                required
              >
                <option value="" disabled>Select a role</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              {formData.role && (
                <p className="mt-2 text-xs text-slate-500">
                  {roleDescriptions[formData.role as Role]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Status
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm bg-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.status}
                onChange={(e) =>
                  handleChange('status', e.target.value)
                }
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 border-t border-slate-200 pt-5 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              {initialData ? 'Save Changes' : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default UserModal;