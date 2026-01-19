import {
    faEdit,
    faEye,
    faFlag,
    faInfoCircle,
    faPlay,
    faPlus,
    faSave,
    faTimes,
    faTrash,
    faVrCardboard
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { vrHotelSettingsApi } from '../../services/vrHotelApi';
import type { Offer, OfferCreate, OfferTranslation, OfferUpdate } from '../../services/vrHotelOffersApi';
import vrHotelOffersApi from '../../services/vrHotelOffersApi';

interface FormOfferData {
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_NIGHT';
  discount_value: number;
  valid_from: string;
  valid_to: string;
  min_nights: number;
  applicable_room_types: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  vr_link: string;
  display_order: number;
  translations: Record<string, { title: string; description: string; terms_conditions: string }>;
}

interface Locale {
  locale_code: string;
  locale_name: string;
}

const VRHotelOffers: React.FC = () => {
  const [isDisplaying, setIsDisplaying] = useState(true);
  const [offersVR360Link, setOffersVR360Link] = useState('');
  const [offersVRTitle, setOffersVRTitle] = useState('');
  const [isSavingVR, setIsSavingVR] = useState(false);
  
  // Offers list state
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentLang, setCurrentLang] = useState('vi');
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([
    { locale_code: 'vi', locale_name: 'Tiếng Việt' },
    { locale_code: 'en', locale_name: 'English' },
    { locale_code: 'zh', locale_name: '中文' }
  ]);

  const discountTypes = [
    { value: 'PERCENTAGE', label: 'Percentage (%)' },
    { value: 'FIXED_AMOUNT', label: 'Fixed Amount (VND)' },
    { value: 'FREE_NIGHT', label: 'Free Night' }
  ];

  const [formData, setFormData] = useState<FormOfferData>({
    code: '',
    discount_type: 'PERCENTAGE',
    discount_value: 0,
    valid_from: '',
    valid_to: '',
    min_nights: 1,
    applicable_room_types: [],
    status: 'ACTIVE',
    vr_link: '',
    display_order: 0,
    translations: {}
  });

  // Initialize form translations
  useEffect(() => {
    const initialTranslations: Record<string, { title: string; description: string; terms_conditions: string }> = {};
    availableLocales.forEach(locale => {
      initialTranslations[locale.locale_code] = {
        title: '',
        description: '',
        terms_conditions: ''
      };
    });
    setFormData(prev => ({
      ...prev,
      translations: initialTranslations
    }));
  }, []);

  // Load offers and VR settings on mount
  useEffect(() => {
    loadOffers();
    loadVRSettings();
  }, []);

  const loadOffers = async () => {
    setIsLoading(true);
    try {
      const data = await vrHotelOffersApi.getOffers();
      setOffers(data);
    } catch (error) {
      console.error('Error loading offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVRSettings = async () => {
    try {
      const vrSettings = await vrHotelSettingsApi.getPageSettings('offers');
      if (vrSettings) {
        setOffersVR360Link(vrSettings.vr360_link || '');
        setOffersVRTitle(vrSettings.vr_title || '');
      }
    } catch (error) {
      console.error('Error loading VR settings:', error);
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
      await vrHotelSettingsApi.updatePageSettings('offers', {
        vr360_link: offersVR360Link,
        vr_title: offersVRTitle
      });
      toast.success('VR360 settings saved', { id: loadingToast, duration: 2000 });
    } catch (error: any) {
      console.error('Failed to save VR settings:', error);
      const errorMsg = error?.response?.data?.detail || 'Error saving VR360 settings';
      toast.error(errorMsg, { id: loadingToast, duration: 3000 });
    } finally {
      setIsSavingVR(false);
    }
  };

  const handleFullscreenVR = () => {
    if (offersVR360Link) {
      window.open(offersVR360Link, '_blank', 'fullscreen=yes');
    } else {
      toast.error('Please enter VR360 link.');
    }
  };

  const createOffer = () => {
    setEditingOffer(null);
    const initialTranslations: Record<string, { title: string; description: string; terms_conditions: string }> = {};
    availableLocales.forEach(locale => {
      initialTranslations[locale.locale_code] = {
        title: '',
        description: '',
        terms_conditions: ''
      };
    });
    setFormData({
      code: '',
      discount_type: 'PERCENTAGE',
      discount_value: 0,
      valid_from: '',
      valid_to: '',
      min_nights: 1,
      applicable_room_types: [],
      status: 'ACTIVE',
      vr_link: '',
      display_order: 0,
      translations: initialTranslations
    });
    setCurrentLang(availableLocales[0]?.locale_code || 'vi');
    setShowModal(true);
  };

  const editOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      code: offer.code,
      discount_type: offer.discount_type,
      discount_value: offer.discount_value || 0,
      valid_from: offer.valid_from || '',
      valid_to: offer.valid_to || '',
      min_nights: offer.min_nights,
      applicable_room_types: offer.applicable_room_types || [],
      status: offer.status,
      vr_link: offer.vr_link || '',
      display_order: offer.display_order,
      translations: {}
    });

    // Convert offer translations to form format
    const translations: Record<string, { title: string; description: string; terms_conditions: string }> = {};
    availableLocales.forEach(locale => {
      const existingTrans = offer.translations[locale.locale_code];
      translations[locale.locale_code] = {
        title: existingTrans?.title || '',
        description: existingTrans?.description || '',
        terms_conditions: existingTrans?.terms_conditions || ''
      };
    });

    setFormData(prev => ({
      ...prev,
      translations
    }));
    setCurrentLang(availableLocales[0]?.locale_code || 'vi');
    setShowModal(true);
  };

  const deleteOffer = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      try {
        await vrHotelOffersApi.deleteOffer(id);
        toast.success('Offer deleted successfully!');
        loadOffers();
      } catch (error) {
        console.error('Failed to delete offer:', error);
        toast.error('Failed to delete offer');
      }
    }
  };

  const closeModal = () => {
    if (window.confirm('Are you sure you want to close? Unsaved changes will be lost.')) {
      setShowModal(false);
      setEditingOffer(null);
    }
  };

  const saveOffer = async () => {
    // Validate all locales have titles
    const missingTitles = availableLocales.filter(
      locale => !formData.translations[locale.locale_code]?.title?.trim()
    );

    if (missingTitles.length > 0) {
      toast.error(`Please enter offer title for: ${missingTitles.map(l => l.locale_name || l.locale_code).join(', ')}`);
      return;
    }

    if (!formData.code.trim()) {
      toast.error('Please enter offer code');
      return;
    }

    try {
      setIsSaving(true);

      // Convert translations to API format
      const translations: OfferTranslation[] = Object.entries(formData.translations).map(
        ([locale, trans]) => ({
          locale,
          title: trans.title,
          description: trans.description || undefined,
          terms_conditions: trans.terms_conditions || undefined
        })
      );

      if (editingOffer) {
        // Update existing offer
        const updateData: OfferUpdate = {
          code: formData.code,
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          valid_from: formData.valid_from || undefined,
          valid_to: formData.valid_to || undefined,
          min_nights: formData.min_nights,
          applicable_room_types: formData.applicable_room_types,
          status: formData.status,
          vr_link: formData.vr_link || undefined,
          display_order: formData.display_order,
          translations
        };
        await vrHotelOffersApi.updateOffer(editingOffer.id, updateData);
        toast.success('Offer updated successfully!');
      } else {
        // Create new offer
        const createData: OfferCreate = {
          code: formData.code,
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          valid_from: formData.valid_from || undefined,
          valid_to: formData.valid_to || undefined,
          min_nights: formData.min_nights,
          applicable_room_types: formData.applicable_room_types,
          status: formData.status,
          vr_link: formData.vr_link || undefined,
          display_order: formData.display_order,
          translations
        };
        await vrHotelOffersApi.createOffer(createData);
        toast.success('Offer created successfully!');
      }

      setShowModal(false);
      setEditingOffer(null);
      await loadOffers();
    } catch (error: any) {
      console.error('Failed to save offer:', error);
      const message = error?.response?.data?.detail || 'Failed to save offer';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleTranslationChange = (locale: string, field: 'title' | 'description' | 'terms_conditions', value: string) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [locale]: {
          ...prev.translations[locale],
          [field]: value
        }
      }
    }));
  };

  const handlePreviewVR = () => {
    if (formData.vr_link) {
      window.open(formData.vr_link, '_blank', 'width=1200,height=800');
    } else {
      toast.error('Please enter VR360 link before preview.');
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
          <h2 className="text-xl font-bold text-slate-800">Display Status - Section Offers</h2>
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
            When display is turned off, the "Offers & Promotions" section will not appear on the website and all input fields will be disabled.
          </span>
        </div>
      </div>

      {/* VR360 Settings for Offers Page */}
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
              value={offersVR360Link}
              onChange={(e) => setOffersVR360Link(e.target.value)}
              disabled={!isDisplaying || isSavingVR}
            />
            <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
              <FontAwesomeIcon icon={faInfoCircle} className="mt-0.5" />
              <span>Enter the URL to a 360° panorama image for the offers listing page (recommended: equirectangular JPG, minimum 4096x2048px)</span>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">VR Tour Title</label>
            <input
              type="text"
              placeholder="Enter VR tour title"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              value={offersVRTitle}
              onChange={(e) => setOffersVRTitle(e.target.value)}
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

          {offersVR360Link && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faEye} className="text-slate-600" />
                <h3 className="text-sm font-medium text-slate-700">VR360 Preview</h3>
              </div>
              <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                <div className="relative w-full" style={{ height: '500px' }}>
                  <iframe
                    src={offersVR360Link}
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

      {/* Offers & Promotions Content */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Offers & Promotions Management</h2>
          <button
            onClick={createOffer}
            disabled={!isDisplaying}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            Create Offer
          </button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">
              <p>Loading...</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>No offers yet. Click "Create Offer" to add an offer.</p>
            </div>
          ) : (
            offers.map(offer => {
              const hasVR = offer.vr_link;
              return (
                <div key={offer.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {offer.translations['vi']?.title || offer.translations['en']?.title || offer.code}
                      </h3>
                      {hasVR && (
                        <FontAwesomeIcon icon={faVrCardboard} className="text-blue-600" title="Has VR360 Tour" />
                      )}
                    </div>
                    <div className="flex gap-6 text-sm text-slate-600">
                      <span>Code: {offer.code}</span>
                      <span>Discount: {
                        offer.discount_type === 'PERCENTAGE' ? `${offer.discount_value}%` :
                        offer.discount_type === 'FIXED_AMOUNT' ? `${offer.discount_value?.toLocaleString('vi-VN')} VND` :
                        'Free Night'
                      }</span>
                      {offer.valid_from && offer.valid_to && (
                        <span>Valid: {offer.valid_from} → {offer.valid_to}</span>
                      )}
                      <span>Status: <span className={`font-medium ${
                        offer.status === 'ACTIVE' ? 'text-green-600' :
                        offer.status === 'INACTIVE' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>{offer.status}</span></span>
                    </div>
                    {offer.translations['vi']?.description && (
                      <p className="text-sm text-slate-600 mt-2">{offer.translations['vi']?.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editOffer(offer)}
                      disabled={!isDisplaying}
                      className="px-4 py-2 border border-slate-600 text-slate-600 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteOffer(offer.id)}
                      disabled={!isDisplaying}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Offer Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-200 p-6 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">{editingOffer ? 'Edit Offer' : 'Create New Offer'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-2xl">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="p-6">
              {/* Language Tabs */}
              <div className="flex gap-2 mb-6 border-b border-slate-200">
                {availableLocales.map(locale => (
                  <button
                    key={locale.locale_code}
                    onClick={() => setCurrentLang(locale.locale_code)}
                    className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${
                      currentLang === locale.locale_code
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <FontAwesomeIcon icon={faFlag} />
                    {locale.locale_code.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Translation Content */}
              {availableLocales.map(locale => (
                currentLang === locale.locale_code && (
                  <div key={locale.locale_code} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Offer Title ({locale.locale_code}) *
                      </label>
                      <input
                        type="text"
                        value={formData.translations[locale.locale_code]?.title || ''}
                        onChange={(e) => handleTranslationChange(locale.locale_code, 'title', e.target.value)}
                        disabled={!isDisplaying}
                        placeholder="Example: Summer Special Discount"
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Description ({locale.locale_code})
                      </label>
                      <textarea
                        value={formData.translations[locale.locale_code]?.description || ''}
                        onChange={(e) => handleTranslationChange(locale.locale_code, 'description', e.target.value)}
                        disabled={!isDisplaying}
                        rows={2}
                        placeholder="Offer description..."
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Terms & Conditions ({locale.locale_code})
                      </label>
                      <textarea
                        value={formData.translations[locale.locale_code]?.terms_conditions || ''}
                        onChange={(e) => handleTranslationChange(locale.locale_code, 'terms_conditions', e.target.value)}
                        disabled={!isDisplaying}
                        rows={2}
                        placeholder="Terms and conditions..."
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                )
              ))}

              {/* Offer Details */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Voucher Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    disabled={!isDisplaying}
                    placeholder="Example: SUMMER2024"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Discount Type</label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) => handleInputChange('discount_type', e.target.value)}
                      disabled={!isDisplaying}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      {discountTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Discount Value {formData.discount_type === 'PERCENTAGE' && '(%)'}
                    </label>
                    <input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => handleInputChange('discount_value', Number(e.target.value))}
                      disabled={!isDisplaying}
                      placeholder="10"
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Valid From</label>
                    <input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => handleInputChange('valid_from', e.target.value)}
                      disabled={!isDisplaying}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Valid To</label>
                    <input
                      type="date"
                      value={formData.valid_to}
                      onChange={(e) => handleInputChange('valid_to', e.target.value)}
                      disabled={!isDisplaying}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Min Nights</label>
                    <input
                      type="number"
                      value={formData.min_nights}
                      onChange={(e) => handleInputChange('min_nights', Number(e.target.value))}
                      disabled={!isDisplaying}
                      placeholder="1"
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      disabled={!isDisplaying}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="EXPIRED">Expired</option>
                    </select>
                  </div>
                </div>

                {/* VR360 Link */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <FontAwesomeIcon icon={faVrCardboard}/>
                    VR360 Link For This Offer
                  </label>
                  <input
                    type="url"
                    value={formData.vr_link}
                    onChange={(e) => handleInputChange('vr_link', e.target.value)}
                    disabled={!isDisplaying}
                    placeholder="https://example.com/offer-vr.jpg"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
                    <FontAwesomeIcon icon={faInfoCircle} className="mt-0.5" />
                    <span>Enter the URL to this offer's 360° panorama image (optional)</span>
                  </p>
                  {formData.vr_link && (
                    <button
                      onClick={handlePreviewVR}
                      disabled={!isDisplaying}
                      type="button"
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:text-blue-300 disabled:cursor-not-allowed"
                    >
                      <FontAwesomeIcon icon={faEye} />
                      Preview VR360
                    </button>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-200 p-6 bg-slate-50 flex justify-end gap-4 sticky bottom-0">
                <button
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-6 py-2 border border-slate-600 text-slate-600 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Cancel
                </button>
                <button
                  onClick={saveOffer}
                  disabled={isSaving || !isDisplaying}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faSave} />
                  {isSaving ? 'Saving...' : editingOffer ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VRHotelOffers;
