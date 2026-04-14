// src/types/users.ts
export type Role = 'owner' | 'admin' | 'editor' | 'viewer';
export type Status = 'active' | 'inactive';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: Status;
  lastLogin?: string;
  avatar?: string; // optional, nếu có ảnh
  initials?: string; // hiển thị avatar chữ
  permissions?: Record<string, boolean>; // chỉ dùng nếu role === 'editor'
  tenant_id?: number; // for permission checks and tenant isolation
  service_access?: number;
}

export interface UserFormData {
  id?: number;
  name: string;
  email: string;
  role: Role | '';
  status: Status;
  password?: string; // for new users only
  permissions?: Record<string, boolean>;
  service_access?: number;
}
