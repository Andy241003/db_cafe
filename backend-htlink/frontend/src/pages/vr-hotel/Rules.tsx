import {
    faEye,
    faFlag,
    faInfoCircle,
    faPlay,
    faSave,
    faUndo,
    faVrCardboard,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { propertyLocalesApi, type PropertyLocale } from '../../services/propertyLocalesApi';
import { vrHotelRulesApi, vrLanguagesApi, type Locale } from '../../services/vrHotelApi';

interface RulesContent {
  title: string;
  shortDescription: string;
  detailedContent: string;
}

interface RulesData {
  isDisplaying: boolean;
  content: Record<string, RulesContent>;
  vr360Link: string;
  vrTitle: string;
}

const Rules: React.FC = () => {
  const [activeLanguage, setActiveLanguage] = useState<string>('vi');
  const [isLoading, setIsLoading] = useState(false);
  const [availableLocales, setAvailableLocales] = useState<PropertyLocale[]>([]);
  const [localeNames, setLocaleNames] = useState<Record<string, Locale>>({});

  const [formData, setFormData] = useState<RulesData>({
    isDisplaying: true,
    content: {
      vi: {
        title: 'Quy định khách sạn',
        shortDescription: 'Vui lòng đọc kỹ các quy định của khách sạn để đảm bảo trải nghiệm lưu trú tốt nhất cho tất cả khách hàng.',
        detailedContent: `Quy định về giờ giấc:
- Giờ nghỉ đêm: Từ 22:00 đến 07:00 sáng hôm sau
- Không gây ồn ào sau 22:00 để tôn trọng sự yên tĩnh của khách khác
- TV và thiết bị âm thanh cần điều chỉnh âm lượng phù hợp

Quy định về hút thuốc:
- Khách sạn là khu vực KHÔNG HÚT THUỐC
- Hút thuốc chỉ được phép tại khu vực chỉ định bên ngoài
- Vi phạm sẽ bị phạt 1.000.000 VNĐ

Quy định về khách thăm:
- Khách thăm phải đăng ký tại quầy lễ tân
- Không cho phép khách qua đêm nếu không đăng ký
- Khách thăm phải rời khách sạn trước 22:00

Quy định về đồ ăn thức uống:
- Không nấu ăn trong phòng
- Không mang đồ ăn có mùi mạnh vào phòng
- Dịch vụ phòng có sẵn 24/7

Trách nhiệm với tài sản:
- Khách chịu trách nhiệm về tài sản cá nhân
- Báo ngay cho lễ tân nếu có hư hỏng trong phòng
- Mất chìa khóa phòng sẽ bị tính phí 200.000 VNĐ

An toàn & Bảo mật:
- Không để người lạ vào phòng
- Khóa cửa khi rời khỏi phòng
- Báo ngay cho lễ tân nếu phát hiện điều bất thường`,
      },
      en: {
        title: 'House Rules',
        shortDescription: 'Please read our hotel house rules carefully to ensure the best stay experience for all guests.',
        detailedContent: `Quiet Hours:
- Night time: From 22:00 to 07:00 next morning
- No loud noise after 22:00 to respect other guests' quietness
- TV and audio devices must be kept at appropriate volume

Smoking Policy:
- Hotel is a NON-SMOKING facility
- Smoking only allowed in designated outdoor areas
- Violation will result in 1,000,000 VND fine

Visitor Policy:
- Visitors must register at front desk
- No overnight guests without registration
- Visitors must leave hotel before 22:00

Food & Beverage Policy:
- No cooking in rooms
- No strong-smelling food in rooms
- Room service available 24/7

Property Responsibility:
- Guests responsible for personal belongings
- Report room damage to reception immediately
- Lost room key will incur 200,000 VND charge

Safety & Security:
- Do not allow strangers into your room
- Lock door when leaving room
- Report any suspicious activity to reception immediately`,
      },
    },
    vr360Link: '',
    vrTitle: 'Reception Area',
  });

  const [originalData, setOriginalData] = useState<RulesData>(formData);

  // Load locales and data on mount
  useEffect(() => {
    loadLocalesAndData();
  }, []);

  const loadLocalesAndData = async () => {
    setIsLoading(true);
    try {
      // Get property ID from localStorage
      const propertyId = localStorage.getItem('current_property_id');
      if (!propertyId) {
        toast.error('No property selected');
        return;
      }

      // Load all available locales from database to get display names
      const allLocales = await vrLanguagesApi.getAvailableLocales();
      const localeMap: Record<string, Locale> = {};
      allLocales.forEach(locale => {
        localeMap[locale.code] = locale;
      });
      setLocaleNames(localeMap);

      // Load available locales for this property
      const locales = await propertyLocalesApi.getLocales(parseInt(propertyId));
      const activeLocales = locales.filter(l => l.is_active);
      setAvailableLocales(activeLocales);

      // Set default active language
      const defaultLocale = activeLocales.find(l => l.is_default);
      if (defaultLocale) {
        setActiveLanguage(defaultLocale.locale_code);
      } else if (activeLocales.length > 0) {
        setActiveLanguage(activeLocales[0].locale_code);
      }

      // Initialize empty content for all locales if they don't exist
      const updatedContent = { ...formData.content };
      activeLocales.forEach(locale => {
        if (!updatedContent[locale.locale_code]) {
          updatedContent[locale.locale_code] = {
            title: '',
            shortDescription: '',
            detailedContent: '',
          };
        }
      });

      setFormData(prev => ({ ...prev, content: updatedContent }));

      // Load actual Rules data from API
      try {
        const response = await vrHotelRulesApi.getRules();
        
        // Merge API data with initialized content (ensure all locales exist)
        const mergedContent = { ...updatedContent };
        Object.keys(response.content || {}).forEach(locale => {
          if (mergedContent[locale]) {
            mergedContent[locale] = response.content[locale];
          }
        });
        
        setFormData({
          isDisplaying: response.isDisplaying ?? true,
          content: mergedContent,
          vr360Link: response.vr360Link || '',
          vrTitle: response.vrTitle || ''
        });
        
        setOriginalData({
          isDisplaying: response.isDisplaying ?? true,
          content: mergedContent,
          vr360Link: response.vr360Link || '',
          vrTitle: response.vrTitle || ''
        });
      } catch (error) {
        console.error('Failed to load Rules data:', error);
        // Keep the initialized empty structure
      }
      
    } catch (error) {
      console.error('Error loading locales and data:', error);
      toast.error('Failed to load language settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDisplay = async () => {
    const newDisplayingState = !formData.isDisplaying;
    setFormData(prev => ({ ...prev, isDisplaying: newDisplayingState }));
    
    try {
      await vrHotelSettingsApi.updatePageSettings('rules', {
        vr360_link: formData.vr360Link,
        vr_title: formData.vrTitle,
        is_displaying: newDisplayingState
      });
      toast.success(`Display status ${newDisplayingState ? 'enabled' : 'disabled'}!`);
    } catch (error: any) {
      console.error('Failed to save display status:', error);
      const errorMsg = error?.response?.data?.detail || 'Failed to save display status';
      toast.error(errorMsg);
      setFormData(prev => ({ ...prev, isDisplaying: !newDisplayingState }));
    }
  };

  const handleInputChange = (
    language: string,
    field: keyof RulesContent,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [language]: {
          ...prev.content[language],
          [field]: value,
        },
      },
    }));
  };

  const handleVRChange = (field: 'vr360Link' | 'vrTitle', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Call API to update Rules data
      await vrHotelRulesApi.updateRules(formData);
      
      setOriginalData(formData);
      toast.success('Rules saved successfully!');
    } catch (error) {
      console.error('Error saving Rules:', error);
      toast.error('Failed to save Rules. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to discard unsaved changes?')) {
      setFormData(originalData);
      toast.success('Changes discarded');
    }
  };

  const handlePreviewVR = () => {
    if (formData.vr360Link) {
      window.open(formData.vr360Link, '_blank', 'width=1200,height=800');
    } else {
      toast.error('Please enter VR360 link before preview.');
    }
  };

  const currentContent = formData.content[activeLanguage] || {
    title: '',
    shortDescription: '',
    detailedContent: '',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading Rules...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Display Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Display Status - Rules Section</h2>
            <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${formData.isDisplaying ? 'text-green-600' : 'text-slate-400'}`}>
                {formData.isDisplaying ? 'Displaying' : 'Hidden'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isDisplaying}
                  onChange={handleToggleDisplay}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600 text-xl mt-0.5" />
            <span className="text-blue-800 text-sm">
              When display is turned off, the "Rules" section will not appear on the website and all input fields will be disabled.
            </span>
          </div>
      </div>

      {/* Content Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h2 className="text-xl font-bold text-slate-800">Rules Content</h2>
        </div>
          {/* Language Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-200">
            {availableLocales.map(locale => {
              const localeInfo = localeNames[locale.locale_code];
              const displayName = localeInfo?.name || localeInfo?.native_name || locale.locale_code.toUpperCase();
              
              return (
                <button
                  key={locale.locale_code}
                  onClick={() => setActiveLanguage(locale.locale_code)}
                  className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${
                    activeLanguage === locale.locale_code
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <FontAwesomeIcon icon={faFlag} />
                  {displayName}
                </button>
              );
            })}
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={currentContent.title}
                  onChange={(e) => handleInputChange(activeLanguage, 'title', e.target.value)}
                  disabled={!formData.isDisplaying}
                  placeholder="Enter Rules title"
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Short Description
                </label>
                <textarea
                  value={currentContent.shortDescription}
                  onChange={(e) => handleInputChange(activeLanguage, 'shortDescription', e.target.value)}
                  disabled={!formData.isDisplaying}
                  placeholder="Enter short description about hotel"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Detailed Content
                </label>
                <textarea
                  value={currentContent.detailedContent}
                  onChange={(e) => handleInputChange(activeLanguage, 'detailedContent', e.target.value)}
                  disabled={!formData.isDisplaying}
                  placeholder="Enter detailed content about hotel"
                  rows={12}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed font-mono text-sm"
                />
              </div>
            </div>
      </div>

      {/* VR360 Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center gap-3">
          <FontAwesomeIcon icon={faVrCardboard} className="text-purple-600 text-xl" />
          <h2 className="text-xl font-bold text-slate-800">VR360 Settings</h2>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Link VR360 Panorama
            </label>
              <input
                type="url"
                value={formData.vr360Link}
                onChange={(e) => handleVRChange('vr360Link', e.target.value)}
                disabled={!formData.isDisplaying}
                placeholder="https://example.com/your-panorama.jpg"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
                <FontAwesomeIcon icon={faInfoCircle} className="mt-0.5" />
                <span>Enter the URL to a 360° panorama image (recommended: equirectangular JPG, minimum 4096x2048px)</span>
              </p>
            </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              VR Tour Title
            </label>
              <input
                type="text"
                value={formData.vrTitle}
                onChange={(e) => handleVRChange('vrTitle', e.target.value)}
                disabled={!formData.isDisplaying}
                placeholder="Enter VR tour title"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* VR Preview */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faEye} className="text-slate-600" />
              <h3 className="text-sm font-medium text-slate-700">VR360 Preview</h3>
            </div>
            <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50">
              {formData.vr360Link ? (
                <div className="relative w-full" style={{ height: '500px' }}>
                  <iframe
                    src={formData.vr360Link}
                    className="absolute top-0 left-0 w-full h-full"
                    allowFullScreen
                    title="VR360 Preview"
                    allow="xr-spatial-tracking; gyroscope; accelerometer"
                  />
                </div>
              ) : (
                <div className="p-8 text-center">
                  <FontAwesomeIcon icon={faVrCardboard} className="text-slate-400 text-5xl mb-3" />
                  <p className="text-slate-600 font-medium mb-1">VR360 Preview</p>
                  <p className="text-slate-500 text-sm">Enter VR360 link to preview</p>
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={handlePreviewVR}
                disabled={!formData.vr360Link || !formData.isDisplaying}
                className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                <FontAwesomeIcon icon={faPlay} />
                View Fullscreen
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faSave} />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={handleReset}
          disabled={isLoading}
          className="px-6 py-2 border border-slate-600 text-slate-600 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faUndo} />
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Rules;

