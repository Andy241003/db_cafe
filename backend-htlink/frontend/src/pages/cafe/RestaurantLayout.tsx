import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Header from '../../components/layout/Header';
import RestaurantSidebar from '../../components/layout/RestaurantSidebar';
import { isAuthenticated } from '../../services/api';

const RestaurantLayout: React.FC = () => {
  const location = useLocation();
  const baseSegment = '/restaurant';
  const sectionLabel = 'Restaurant';

  // Check authentication
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Map routes to page titles and breadcrumbs
  const getPageInfo = (pathname: string) => {
    const path = pathname.replace(baseSegment, '');
    switch (path) {
      case '':
      case '/':
        return { title: 'Dashboard', breadcrumb: `${sectionLabel} / Dashboard` };
      case '/users':
        return { title: 'User Management', breadcrumb: `${sectionLabel} / User Management` };
      case '/home':
        return { title: 'Home', breadcrumb: `${sectionLabel} / Home` };
      case '/about':
        return { title: 'About', breadcrumb: `${sectionLabel} / About` };
      case '/menu':
        return { title: 'Menu Management', breadcrumb: `${sectionLabel} / Menu` };
       case '/space':
        return { title: 'Space', breadcrumb: `${sectionLabel} / Space` };
      case '/branches':
        return { title: 'Branches', breadcrumb: `${sectionLabel} / Branches` };
      case '/events':
        return { title: 'Events', breadcrumb: `${sectionLabel} / Events` };
      case '/careers':
        return { title: 'Careers', breadcrumb: `${sectionLabel} / Careers` };
      case '/promotions':
        return { title: 'Promotions', breadcrumb: `${sectionLabel} / Promotions` };
      case '/gallery':
        return { title: 'Media Library', breadcrumb: `${sectionLabel} / Media Library` };
      case '/contact':
        return { title: 'Contact', breadcrumb: `${sectionLabel} / Contact` };
      case '/languages':
        return { title: 'Languages', breadcrumb: `${sectionLabel} / Languages` };
      case '/tenants':
        return { title: 'Tenant Settings', breadcrumb: `${sectionLabel} / Tenant Settings` };
      case '/settings':
        return { title: 'Settings', breadcrumb: `${sectionLabel} / Settings` };
      case '/activities':
        return { title: 'Activity Log', breadcrumb: `${sectionLabel} / Activity Log` };
      default:
        return { title: 'VR Restaurant', breadcrumb: sectionLabel };
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
      <RestaurantSidebar />
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

export default RestaurantLayout;





