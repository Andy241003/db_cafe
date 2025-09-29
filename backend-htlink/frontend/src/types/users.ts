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
}

export interface UserFormData {
  id?: number;
  name: string;
  email: string;
  role: Role | '';
  status: Status;
  permissions?: Record<string, boolean>;
}
