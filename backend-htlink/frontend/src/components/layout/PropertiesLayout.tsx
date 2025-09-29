// src/components/layout/PropertiesLayout.tsx
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface PropertiesLayoutProps {
  children: React.ReactNode;
  onAddHotel?: () => void;
}

export const PropertiesLayout: React.FC<PropertiesLayoutProps> = ({ 
  children, 
  onAddHotel 
}) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <Header 
        title="Hotel Properties"
        breadcrumb="Home / Hotels"
        onAdd={onAddHotel}
      />
      {/* bọc children trong main-content */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};
