import {
  faEye,
  faInfoCircle,
  faPlay,
  faPlus,
  faSave,
  faVrCardboard
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { propertyLocalesApi, type PropertyLocale } from '../../services/propertyLocalesApi';
import { vrHotelSettingsApi } from '../../services/vrHotelApi';

const VRHotelServices: React.FC = () => {
  const [isDisplaying, setIsDisplaying] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [availableLocales, setAvailableLocales] = useState<PropertyLocale[]>([]);
  const [servicesVR360Link, setServicesVR360Link] = useState('');
  const [servicesVRTitle, setServicesVRTitle] = useState('');
  const [isSavingVR, setIsSavingVR] = useState(false);

  useEffect(() => {
    loadLocales();
  }, []);

  const loadLocales = async () => {
    setIsLoading(true);
    try {
      const propertyId = localStorage.getItem('current_property_id');
      if (!propertyId) {
        toast.error('No property selected');
        return;
      }

      const locales = await propertyLocalesApi.getLocales(parseInt(propertyId));
      const activeLocales = locales.filter(l => l.is_active);
      setAvailableLocales(activeLocales);
      
      // Load VR page settings from database
      const vrSettings = await vrHotelSettingsApi.getPageSettings('services');
      if (vrSettings) {
        setServicesVR360Link(vrSettings.vr360_link || '');
        setServicesVRTitle(vrSettings.vr_title || '');
      }
    } catch (error) {
      console.error('Error loading locales:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = () => {
    setIsDisplaying(!isDisplaying);
    toast.success('Display status updated!');
  };

  const saveVRSettings = async () => {
    const loadingToast = toast.loading('Saving VR360 settings...');
    setIsSavingVR(true);
    try {
      await vrHotelSettingsApi.updatePageSettings('services', {
        vr360_link: servicesVR360Link,
        vr_title: servicesVRTitle
      });
      toast.success('VR360 settings saved successfully!', { id: loadingToast, duration: 2000 });
    } catch (error: any) {
      console.error('Failed to save VR settings:', error);
      const errorMsg = error?.response?.data?.detail || 'Failed to save VR360 settings';
      toast.error(errorMsg, { id: loadingToast, duration: 3000 });
    } finally {
      setIsSavingVR(false);
    }
  };

  const handleFullscreenVR = () => {
    if (servicesVR360Link) {
      window.open(servicesVR360Link, '_blank', 'fullscreen=yes');
    } else {
      toast.error('Please enter VR360 link first.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Display Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Display Status - Services Section</h2>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isDisplaying ? 'text-green-600' : 'text-slate-400'}`}>
              {isDisplaying ? 'Displaying' : 'Hidden'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isDisplaying}
                onChange={toggleSection}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600 text-xl mt-0.5" />
          <span className="text-blue-800 text-sm">
            When display is turned off, the "Services" section will not appear on the website and all input fields will be disabled.
          </span>
        </div>
      </div>

      {/* VR360 Settings for Services Page */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center gap-3">
          <FontAwesomeIcon icon={faVrCardboard} className="text-purple-600 text-xl" />
          <h2 className="text-xl font-bold text-slate-800">VR360 Settings</h2>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Link VR360 Panorama</label>
            <input
              type="url"
              placeholder="https://example.com/your-panorama.jpg"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              value={servicesVR360Link}
              onChange={(e) => setServicesVR360Link(e.target.value)}
              disabled={!isDisplaying || isSavingVR}
            />
            <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
              <FontAwesomeIcon icon={faInfoCircle} className="mt-0.5" />
              <span>Enter the path to the 360° panorama image for the services list page (recommended: equirectangular JPG, minimum 4096x2048px)</span>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">VR Tour Title</label>
            <input
              type="text"
              placeholder="Enter VR tour title"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              value={servicesVRTitle}
              onChange={(e) => setServicesVRTitle(e.target.value)}
              disabled={!isDisplaying || isSavingVR}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveVRSettings}
              disabled={!isDisplaying || isSavingVR}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faSave} />
              {isSavingVR ? 'Saving...' : 'Save'}
            </button>
          </div>

          {servicesVR360Link && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faEye} className="text-slate-600" />
                <h3 className="text-sm font-medium text-slate-700">VR360 Preview</h3>
              </div>
              <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                <div className="relative w-full" style={{ height: '500px' }}>
                  <iframe
                    src={servicesVR360Link}
                    className="absolute top-0 left-0 w-full h-full"
                    allowFullScreen
                    title="VR360 Preview"
                    allow="xr-spatial-tracking; gyroscope; accelerometer"
                  />
                </div>
              </div>
              <div className="mt-4 text-center">
                <button
                  onClick={handleFullscreenVR}
                  disabled={!isDisplaying}
                  className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  <FontAwesomeIcon icon={faPlay} />
                  View Fullscreen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/*  className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Display Status - Services Section</h2>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isDisplaying ? 'text-green-600' : 'text-slate-400'}`}>
              {isDisplaying ? 'Displaying' : 'Hidden'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isDisplaying}
                onChange={toggleSection}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600 text-xl mt-0.5" />
          <span className="text-blue-800 text-sm">
            When display is turned off, the "Services" section will not appear on the website and all input fields will be disabled.
          </span>
        </div>
      </div>

      {/* Services Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Services Management</h2>
          <button 
            disabled={!isDisplaying}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add New Service
          </button>
        </div>
        
        <div className="text-center py-12 text-slate-500">
          <p className="mb-4">Services management features coming soon.</p>
          <p className="text-sm">Available languages: {availableLocales.map(l => l.locale_name || l.locale_code).join(', ')}</p>
        </div>
      </div>
    </div>
  );
};

export default VRHotelServices;
