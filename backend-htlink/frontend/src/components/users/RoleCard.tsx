// src/components/users/RoleCard.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faUserShield, faUserEdit, faUser } from '@fortawesome/free-solid-svg-icons';

interface RoleCardProps {
  title: string;
  count: number | string;
  description: string;
  iconClass: string;
  iconBg: string;
}

const RoleCard: React.FC<RoleCardProps> = ({ title, count, description, iconClass, iconBg }) => {
  const iconMap = {
    'fas fa-crown': faCrown,
    'fas fa-user-shield': faUserShield,
    'fas fa-user-edit': faUserEdit,
    'fas fa-user': faUser,
  };

  const icon = iconMap[iconClass as keyof typeof iconMap] || faUser;

  return (
    <div className="p-5 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="w-12 h-12 mx-auto mb-3 text-xl text-white rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="mb-1 text-base font-semibold">{title}</div>
      <div className="mb-1.5 text-2xl font-bold text-slate-900">{count}</div>
      <div className="text-xs text-slate-500">{description}</div>
    </div>
  );
};

export default RoleCard;