import { ArrowRight, Building2, CheckCircle, Crown, Globe, Hotel, Info, Lock, LogOut, Mail, Phone, Plane, TriangleAlert, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

interface ServiceAccessResponse {
  service_access: number;
  available_services: string[];
  user_id: number;
  email: string;
}

const DashboardSelection: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceAccessResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lockedService, setLockedService] = useState<string>('');

  useEffect(() => {
    const fetchUserServices = async () => {
      try {
        // Get current user info from localStorage
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        if (!user) {
          navigate('/login');
          return;
        }

        setCurrentUser(user);

        // Fetch service access from backend
        const response = await authAPI.getUserServices();
        setServices(response);

        // Store service access in localStorage for other components to use
        localStorage.setItem('service_access', response.service_access.toString());
        localStorage.setItem('available_services', JSON.stringify(response.available_services));

      } catch (error) {
        console.error('Error fetching user services:', error);
        toast.error('Failed to load available services');
        // Fallback to default service if error
        setTimeout(() => navigate('/'), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchUserServices();
  }, [navigate]);

  const handleServiceSelect = (serviceCode: string) => {
    if (serviceCode === 'travel-link') {
      navigate('/');
    } else if (serviceCode === 'vr-hotel') {
      navigate('/vr-hotel');
    }
  };

  const handleLockedClick = (serviceCode: string) => {
    setLockedService(serviceCode);
    setShowUpgradeModal(true);
  };

  const closeUpgradeModal = () => {
    setShowUpgradeModal(false);
    setLockedService('');
  };

  const contactUpgrade = () => {
    window.location.href = 'mailto:lienhe@vtlink.vn?subject=Upgrade%20Request';
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    const name = currentUser?.full_name || currentUser?.email || 'AD';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get role display
  const getRoleDisplay = () => {
    const roleMap: { [key: string]: string } = {
      'OWNER': 'Full Access',
      'ADMIN': 'Administrator',
      'EDITOR': 'Editor',
      'VIEWER': 'Viewer'
    };
    return roleMap[currentUser?.role] || currentUser?.role || 'User';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-slate-700">Loading...</p>
        </div>
      </div>
    );
  }

  const canAccessTravelLink = services?.available_services.includes('travel-link') ?? true;
  const canAccessVrHotel = services?.available_services.includes('vr-hotel') ?? false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* User Info */}
            <div className="flex items-center gap-4 bg-white/20 backdrop-blur-md rounded-2xl px-4 py-2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-base">
                {getUserInitials()}
              </div>
              <div>
                <div className="font-semibold text-white">
                  {currentUser?.full_name || currentUser?.email || 'Administrator'}
                </div>
                <div className="text-xs text-white/80">
                  {getRoleDisplay()}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl transition-all duration-200 font-medium border border-white/30"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Choose the dashboard you want to manage
          </h1>
        </div>

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Travel Link Card */}
          <div 
            onClick={() => !canAccessTravelLink && handleLockedClick('travel-link')}
            className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
            canAccessTravelLink ? 'hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:-translate-y-1 cursor-pointer' : 'opacity-60 cursor-pointer'
          }`}>
            {!canAccessTravelLink && (
              <div className="absolute top-6 right-6 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                <Lock size={12} />
                Locked
              </div>
            )}

            <div className="p-10">
              {/* Icon */}
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-8 mx-auto shadow-lg">
                <Plane size={40} className="text-white" />
              </div>

              {/* Title & Description */}
              <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Travel Link</h2>
              <p className="text-gray-600 mb-8 text-center leading-relaxed">
                Manage travel website, tours, bookings and travel services.
              </p>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-base text-gray-700">Manage tours & destinations</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-base text-gray-700">Booking & reservation system</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-base text-gray-700">Customer management</span>
                </div>
              </div>

              {/* Button */}
              <button
                onClick={() => canAccessTravelLink && handleServiceSelect('travel-link')}
                disabled={!canAccessTravelLink}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                  canAccessTravelLink
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {canAccessTravelLink ? (
                  <>
                    <ArrowRight size={20} />
                    Access Dashboard
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    Upgrade Required
                  </>
                )}
              </button>

              {/* Upgrade Notice */}
              {!canAccessTravelLink && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
                  <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-amber-700">
                    You need to upgrade to use this feature
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* VR Hotel Card */}
          <div 
            onClick={() => !canAccessVrHotel && handleLockedClick('vr-hotel')}
            className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
            canAccessVrHotel ? 'hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:-translate-y-1 cursor-pointer' : 'opacity-60 cursor-pointer'
          }`}>
            {!canAccessVrHotel && (
              <div className="absolute top-6 right-6 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                <Lock size={12} />
                Locked
              </div>
            )}

            <div className="p-10">
              {/* Icon */}
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-8 mx-auto shadow-lg">
                <Hotel size={40} className="text-white" />
              </div>

              {/* Title & Description */}
              <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">VR Hotel</h2>
              <p className="text-gray-600 mb-8 text-center leading-relaxed">
                Manage hotel with VR360 Panorama technology.
              </p>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-base text-gray-700">Manage rooms & services</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-base text-gray-700">VR360 virtual tours</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-base text-gray-700">Booking & voucher system</span>
                </div>
              </div>

              {/* Button */}
              <button
                onClick={() => canAccessVrHotel && handleServiceSelect('vr-hotel')}
                disabled={!canAccessVrHotel}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                  canAccessVrHotel
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {canAccessVrHotel ? (
                  <>
                    <ArrowRight size={20} />
                    Access Dashboard
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    Upgrade Required
                  </>
                )}
              </button>

              {/* Upgrade Notice */}
              {!canAccessVrHotel && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
                  <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-amber-700">
                    You need to upgrade to use this feature
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl animate-slideUp">
            {/* Header */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-8 rounded-t-3xl text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-5 flex items-center justify-center">
                <Lock size={40} />
              </div>
              <h2 className="text-3xl font-bold mb-2">Cần nâng cấp tài khoản</h2>
              <p className="text-white/90 text-lg">
                Bạn không có quyền truy cập vào <strong>{lockedService === 'vr-hotel' ? 'VR Hotel' : 'Travel Link'}</strong>
              </p>
            </div>

            {/* Body */}
            <div className="p-8">
              {/* Warning Box */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-lg mb-8">
                <div className="flex items-start gap-4">
                  <TriangleAlert size={24} className="text-amber-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-amber-900 mb-2">Quyền truy cập bị giới hạn</div>
                    <div className="text-amber-800 text-sm leading-relaxed">
                      Tài khoản của bạn hiện chỉ có quyền truy cập hạn chế. 
                      Vui lòng liên hệ với chúng tôi để nâng cấp lên gói Full Access.
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Left - Contact Info */}
                <div className="bg-slate-50 p-6 rounded-xl">
                  <h3 className="text-gray-900 font-semibold text-lg mb-5">Thông tin nhà cung cấp</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Building2 size={18} className="text-blue-500 flex-shrink-0" />
                      <div><strong>Công ty:</strong>Công ty Link – Kết nối Thương mại và Du lịch</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-blue-500 flex-shrink-0" />
                      <div>
                        <strong>Email:</strong>{' '}
                        <a href="mailto:lienhe@vtlink.vn" className="text-blue-600 font-semibold hover:underline">
                          hotro@vtlink.vn
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-blue-500 flex-shrink-0" />
                      <div>
                        <strong>Contact:</strong>{' '}
                        <a href="tel:+84965079360" className="text-blue-600 font-semibold hover:underline">
                          0965 079 360
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-blue-500 flex-shrink-0" />
                      <div>
                        <strong>Hotline:</strong>{' '}
                        <a href="tel:+84983558824" className="text-blue-600 font-semibold hover:underline">
                          0983 55 88 24
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe size={18} className="text-blue-500 flex-shrink-0" />
                      <div>
                        <strong>Website:</strong>{' '}
                        <a href="https://vtlink.link" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">
                          vtlink.link
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right - Upgrade Package */}
                <div className="bg-amber-50 border-2 border-amber-400 p-6 rounded-xl text-center flex flex-col justify-center">
                  <Crown size={48} className="text-amber-500 mx-auto mb-4" />
                  <div className="text-amber-900 font-semibold text-xl mb-2">Gói Full Access</div>
                  <div className="text-amber-700 text-sm mb-5">
                    Truy cập đầy đủ cả Travel Link & VR Hotel
                  </div>
                  <div className="bg-amber-400 p-4 rounded-xl shadow-lg">
                    <div className="text-amber-900 font-semibold text-lg flex items-center justify-center gap-2">
                      {/* <ArrowRight size={20} />  */}
                      Liên hệ ngay để được tư vấn
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={closeUpgradeModal}
                  className="flex-1 py-4 px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <X size={20} /> Hủy
                </button>
                <button
                  onClick={contactUpgrade}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-lg"
                >
                  <ArrowRight size={20} /> Nâng cấp ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSelection;
