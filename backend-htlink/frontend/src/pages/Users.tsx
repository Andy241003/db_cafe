// src/pages/Users.tsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleCard from '../components/users/RoleCard';
import UserModal from '../components/users/UserModal';
import type { User, UserFormData } from '../types/users';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faEdit, faUserTimes } from '@fortawesome/free-solid-svg-icons';


const initialUsers: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@tabitower.com',
    role: 'owner',
    status: 'active',
    lastLogin: '2 hours ago',
    initials: 'JD',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@tabitower.com',
    role: 'admin',
    status: 'active',
    lastLogin: '1 day ago',
    initials: 'JS',
  },
  {
    id: 3,
    name: 'Mike Wilson',
    email: 'mike.wilson@tabitower.com',
    role: 'admin',
    status: 'active',
    lastLogin: '3 days ago',
    initials: 'MW',
  },
  {
    id: 4,
    name: 'Sarah Brown',
    email: 'sarah.brown@tabitower.com',
    role: 'editor',
    status: 'active',
    lastLogin: '5 hours ago',
    initials: 'SB',
  },
  {
    id: 5,
    name: 'Tom Johnson',
    email: 'tom.johnson@tabitower.com',
    role: 'editor',
    status: 'active',
    lastLogin: '1 week ago',
    initials: 'TJ',
  },
  {
    id: 6,
    name: 'Lisa Davis',
    email: 'lisa.davis@tabitower.com',
    role: 'editor',
    status: 'inactive',
    lastLogin: '1 month ago',
    initials: 'LD',
  },
  {
    id: 7,
    name: 'Bob Kim',
    email: 'bob.kim@tabitower.com',
    role: 'viewer',
    status: 'active',
    lastLogin: '2 days ago',
    initials: 'BK',
  }
];

const Users: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>(initialUsers);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Derived: counts per role
  const counts = useMemo(() => {
    const map = { owner: 0, admin: 0, editor: 0, viewer: 0 } as Record<string, number>;
    users.forEach(u => {
      map[u.role] = (map[u.role] || 0) + 1;
    });
    return map;
  }, [users]);

  // Filtered user list
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter(u => {
      const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesRole = !roleFilter || u.role === roleFilter;
      const matchesStatus = !statusFilter || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const openAddModal = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEditModal = (id: number) => {
    const u = users.find(x => x.id === id) ?? null;
    setEditingUser(u);
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Are you sure you want to remove this user? This action cannot be undone.')) return;
    setUsers(prev => prev.filter(u => u.id !== id));
    alert(`User ${id} removed successfully!`);
  };

  const handleSave = async (data: UserFormData) => {
    // If id provided -> update, else create new 
    if (data.id) {
      setUsers(prev => prev.map(u => u.id === data.id ? {
        ...u,
        name: data.name,
        email: data.email,
        role: (data.role as User['role']) ?? u.role,
        status: data.status,
        permissions: data.permissions ?? u.permissions,
      } : u));
    } else {
      const newId = Math.max(0, ...users.map(u => u.id)) + 1;
      const initials = data.name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
      const newUser: User = {
        id: newId,
        name: data.name,
        email: data.email,
        role: (data.role as User['role']) || 'viewer',
        status: data.status,
        lastLogin: 'Just now',
        initials,
        permissions: data.permissions,
      };
      setUsers(prev => [newUser, ...prev]);
    }
  };

  const handleViewFeatures = (categoryId: number) => {
    // from original users.html: not applicable here but keep function available
    navigate(`/features?category=${categoryId}`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage users and their permissions for your hotel property</p>
        </div>

        <div>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700" onClick={openAddModal}>
            <FontAwesomeIcon icon={faUserPlus} />
            Add User
          </button>
        </div>
      </div>

      {/* Roles Overview */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 mb-6">
        <RoleCard title="Owner" count={counts.owner} description="Full system access and tenant management" iconClass="fas fa-crown" iconBg="linear-gradient(135deg, #f59e0b, #d97706)" />
        <RoleCard title="Admin" count={counts.admin} description="Full property management and user control" iconClass="fas fa-user-shield" iconBg="linear-gradient(135deg, #3b82f6, #1d4ed8)" />
        <RoleCard title="Editor" count={counts.editor} description="Can create and edit content, features, and posts" iconClass="fas fa-user-edit" iconBg="linear-gradient(135deg, #10b981, #059669)" />
        <RoleCard title="Viewer" count={counts.viewer} description="Read-only access to view content and analytics" iconClass="fas fa-user" iconBg="linear-gradient(135deg, #8b5cf6, #7c3aed)" />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          id="searchInput"
          className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" id="roleFilter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>

        <select className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden bg-white border border-slate-200 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-800">Team Members</h3>
        </div>

        <table className="w-full border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold tracking-wider text-left text-slate-600 uppercase">User</th>
              <th className="px-5 py-3 text-xs font-semibold tracking-wider text-left text-slate-600 uppercase">Role</th>
              <th className="px-5 py-3 text-xs font-semibold tracking-wider text-left text-slate-600 uppercase">Status</th>
              <th className="px-5 py-3 text-xs font-semibold tracking-wider text-left text-slate-600 uppercase">Last Login</th>
              <th className="px-5 py-3 text-xs font-semibold tracking-wider text-left text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {filteredUsers.map(user => (
              <tr key={user.id} data-role={user.role} data-status={user.status}>
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white font-semibold text-sm flex items-center justify-center">
                      {user.initials ?? user.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">{user.name}</span>
                      <span className="text-xs text-slate-500">{user.email}</span>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4 whitespace-nowrap">
                  <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                    user.role === 'owner' ? 'bg-amber-100 text-amber-800' :
                    user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'editor' ? 'bg-green-100 text-green-800' : 'bg-violet-100 text-violet-800'
                  }`}>{user.role}</span>
                </td>

                <td className="px-5 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>

                <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                  {user.lastLogin}
                </td>

                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200" onClick={() => openEditModal(user.id)}>
                      <FontAwesomeIcon icon={faEdit} /> Edit
                    </button>
                    {user.role !== 'owner' && (
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200" onClick={() => handleDelete(user.id)}>
                        <FontAwesomeIcon icon={faUserTimes} /> Remove
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={modalOpen}
        initialData={editingUser}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default Users;