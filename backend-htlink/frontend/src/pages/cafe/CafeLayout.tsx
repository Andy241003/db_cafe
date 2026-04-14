import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Header from '../../components/layout/Header';
import CafeSidebar from '../../components/layout/CafeSidebar';
import { isAuthenticated } from '../../services/api';

const CafeLayout: React.FC = () => {
  const location = useLocation();

  // Check authentication
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Map routes to page titles and breadcrumbs
  const getPageInfo = (pathname: string) => {
    const path = pathname.replace('/cafe', '');
    switch (path) {
      case '':
      case '/':
        return { title: 'Dashboard', breadcrumb: 'Cafe / Dashboard' };
      case '/users':
        return { title: 'User Management', breadcrumb: 'Cafe / User Management' };
      case '/home-about':
        return { title: 'Home & About', breadcrumb: 'Cafe / Home & About' };
      case '/menu':
        return { title: 'Menu Management', breadcrumb: 'Cafe / Menu' };
       case '/space':
        return { title: 'Space', breadcrumb: 'Cafe / Space' };
      case '/branches':
        return { title: 'Branches', breadcrumb: 'Cafe / Branches' };
      case '/events':
        return { title: 'Events', breadcrumb: 'Cafe / Events' };
      case '/careers':
        return { title: 'Careers', breadcrumb: 'Cafe / Careers' };
      case '/promotions':
        return { title: 'Promotions', breadcrumb: 'Cafe / Promotions' };
      case '/gallery':
        return { title: 'Media Library', breadcrumb: 'Cafe / Media Library' };
      case '/contact':
        return { title: 'Contact', breadcrumb: 'Cafe / Contact' };
      case '/languages':
        return { title: 'Languages', breadcrumb: 'Cafe / Languages' };
      case '/settings':
        return { title: 'Settings', breadcrumb: 'Cafe / Settings' };
      case '/activities':
        return { title: 'Activity Log', breadcrumb: 'Cafe / Activity Log' };
      default:
        return { title: 'Cafe', breadcrumb: 'Cafe' };
    }
  };

  const pageInfo = getPageInfo(location.pathname);

  const handleSearch = (_query: string) => {
    // Implement global search logic here
  };

  const handleNotifications = () => {
    // Implement notification logic here
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <CafeSidebar />
      <div className="sm:ml-64">
        <Header 
          title={pageInfo.title} 
          breadcrumb={pageInfo.breadcrumb}
          onSearch={handleSearch}
          onNotificationClick={handleNotifications}
        />
        <main className="pt-20 px-6 pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CafeLayout;
