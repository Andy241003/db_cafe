import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Header from '../../components/layout/Header';
import VRHotelSidebar from '../../components/layout/VRHotelSidebar';
import { isAuthenticated } from '../../services/api';

const VRHotelLayout: React.FC = () => {
  const location = useLocation();

  // Check authentication
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Map routes to page titles and breadcrumbs
  const getPageInfo = (pathname: string) => {
    const path = pathname.replace('/vr-hotel', '');
    switch (path) {
      case '':
      case '/':
        return { title: 'Dashboard', breadcrumb: 'VR Hotel / Dashboard' };
      case '/introduction':
        return { title: 'Introduction', breadcrumb: 'VR Hotel / Introduction' };
      case '/rooms':
        return { title: 'Rooms', breadcrumb: 'VR Hotel / Rooms' };
      case '/dining':
        return { title: 'Dining', breadcrumb: 'VR Hotel / Dining' };
      case '/offers':
        return { title: 'Offers', breadcrumb: 'VR Hotel / Offers' };
      case '/facilities':
        return { title: 'Facilities', breadcrumb: 'VR Hotel / Facilities' };
      case '/media':
        return { title: 'Media Library', breadcrumb: 'VR Hotel / Media Library' };
      case '/policies':
        return { title: 'Policies', breadcrumb: 'VR Hotel / Policies' };
      case '/rules':
        return { title: 'House Rules', breadcrumb: 'VR Hotel / Rules' };
      case '/contact':
        return { title: 'Contact', breadcrumb: 'VR Hotel / Contact' };
      case '/settings':
        return { title: 'Settings', breadcrumb: 'VR Hotel / Settings' };
      case '/activities':
        return { title: 'Activity Log', breadcrumb: 'VR Hotel / Activity Log' };
      case '/export-import':
        return { title: 'Export / Import', breadcrumb: 'VR Hotel / Export / Import' };
      default:
        return { title: 'Services', breadcrumb: 'VR Hotel / Services' };
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
    <div className="bg-slate-50 min-h-screen">
      <VRHotelSidebar />
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

export default VRHotelLayout;
