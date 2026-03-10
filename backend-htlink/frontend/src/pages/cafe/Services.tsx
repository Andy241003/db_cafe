import { Button, Form, Input, Modal, Select, Switch, Tag, Popconfirm } from 'antd';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { cafeServicesApi, cafeLanguagesApi, type Service, type ServiceCreate, type ServiceUpdate, type ServiceTranslation } from '../../services/cafeApi';
import toast from 'react-hot-toast';
import MediaPickerModal from '../../components/MediaPickerModal';
import { getApiBaseUrl } from '../../utils/api';

const { TextArea } = Input;

const SERVICE_TYPES = [
  { value: 'room_service', label: 'Room Service' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'concierge', label: 'Concierge' },
  { value: 'airport_transfer', label: 'Airport Transfer' },
  { value: 'spa_service', label: 'Spa Service' },
  { value: 'tour_booking', label: 'Tour Booking' },
  { value: 'car_rental', label: 'Car Rental' },
  { value: 'babysitting', label: 'Babysitting' },
  { value: 'other', label: 'Other' },
];

const LANGUAGE_CONFIG: Record<string, { name: string; flag: string }> = {
  vi: { name: 'Tiếng Việt', flag: '🇻🇳' },
  en: { name: 'English', flag: '🇬🇧' },
  zh: { name: '中文', flag: '🇨🇳' },
};

const CafeServices: React.FC = () => {
  // Services state
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm] = Form.useForm();

  // Language state
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['vi', 'en']);
  const [currentServiceLocale, setCurrentServiceLocale] = useState('vi');
  const [serviceTranslations, setServiceTranslations] = useState<Record<string, ServiceTranslation>>({});

  // Media state
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [mediaPickerVisible, setMediaPickerVisible] = useState(false);

  // Load initial data
  useEffect(() => {
    loadLanguages();
    loadServices();
  }, []);

  const loadLanguages = async () => {
    try {
      const langs = await cafeLanguagesApi.getLanguageCodes();
      if (langs && langs.length > 0) {
        setSupportedLanguages(langs);
        setCurrentServiceLocale(langs[0]);
      }
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  };

  const loadServices = async () => {
    setServicesLoading(true);
    try {
      const data = await cafeServicesApi.getServices();
      setServices(data);
    } catch (error) {
      toast.error('Failed to load services');
      console.error(error);
    } finally {
      setServicesLoading(false);
    }
  };

  const handleAddService = () => {
    setEditingService(null);
    setServiceTranslations({});
    setSelectedImageId(null);
    setCurrentServiceLocale(supportedLanguages[0] || 'vi');
    serviceForm.resetFields();
    setModalVisible(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setSelectedImageId(service.primary_image_media_id || null);
    
    const translationMap: Record<string, ServiceTranslation> = {};
    service.translations.forEach(t => {
      translationMap[t.locale] = t;
    });
    setServiceTranslations(translationMap);
    setCurrentServiceLocale(supportedLanguages[0] || 'vi');

    serviceForm.setFieldsValue({
      code: service.code,
      service_type: service.service_type,
      availability: service.availability,
      price_information: service.price_information,
      vr360_tour_url: service.vr360_tour_url,
      booking_url: service.booking_url,
      is_active: service.is_active,
      display_order: service.display_order,
    });

    setModalVisible(true);
  };

  const handleServiceSubmit = async () => {
    try {
      const formValues = serviceForm.getFieldsValue();
      
      const translations: ServiceTranslation[] = Object.values(serviceTranslations);
      if (translations.length === 0) {
        toast.error('Please add at least one translation');
        return;
      }

      const payload: ServiceCreate = {
        code: formValues.code,
        service_type: formValues.service_type,
        availability: formValues.availability,
        price_information: formValues.price_information,
        vr360_tour_url: formValues.vr360_tour_url,
        booking_url: formValues.booking_url,
        primary_image_media_id: selectedImageId || undefined,
        is_active: formValues.is_active ?? true,
        display_order: formValues.display_order ?? 0,
        translations,
      };

      if (editingService) {
        await cafeServicesApi.updateService(editingService.id, payload);
        toast.success('Service updated successfully');
      } else {
        await cafeServicesApi.createService(payload);
        toast.success('Service created successfully');
      }

      setModalVisible(false);
      loadServices();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save service';
      toast.error(message);
      console.error(error);
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    try {
      await cafeServicesApi.deleteService(serviceId);
      toast.success('Service deleted successfully');
      loadServices();
    } catch (error) {
      toast.error('Failed to delete service');
      console.error(error);
    }
  };

  const handleOpenMediaPicker = () => {
    setMediaPickerVisible(true);
  };

  const handleMediaSelected = (mediaId: number) => {
    setSelectedImageId(mediaId);
    setMediaPickerVisible(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
          <p className="text-gray-600 mt-1">Manage your cafe/hotel services with multi-language support</p>
        </div>
        <Button 
          type="primary" 
          icon={<Plus className="w-4 h-4" />}
          onClick={handleAddService}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Add Service
        </Button>
      </div>

      {/* Services Table/List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {servicesLoading ? (
          <div className="p-8 text-center text-slate-600">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-slate-400 mb-2">No services yet</div>
            <p className="text-sm text-slate-500 mb-4">Click "Add Service" to create your first service</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-6 py-4 font-semibold text-slate-700">Code</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-700">Service Name</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-700">Type</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-700">Availability</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-700">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => {
                  const serviceName = service.translations.find(t => t.locale === 'vi')?.name ||
                                    service.translations.find(t => t.locale === 'en')?.name ||
                                    'Untitled';
                  const serviceTypeLabel = SERVICE_TYPES.find(t => t.value === service.service_type)?.label || service.service_type;

                  return (
                    <tr key={service.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <code className="text-sm bg-slate-100 px-2 py-1 rounded text-slate-700">
                          {service.code}
                        </code>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">{serviceName}</td>
                      <td className="px-6 py-4">
                        <Tag color="blue">{serviceTypeLabel}</Tag>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {service.availability || '—'}
                      </td>
                      <td className="px-6 py-4">
                        {service.is_active ? (
                          <Tag color="green">Active</Tag>
                        ) : (
                          <Tag color="red">Inactive</Tag>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            type="text"
                            size="small"
                            icon={<Edit className="w-4 h-4" />}
                            onClick={() => handleEditService(service)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Edit
                          </Button>
                          <Popconfirm
                            title="Delete Service"
                            description="Are you sure you want to delete this service?"
                            onConfirm={() => handleDeleteService(service.id)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<Trash2 className="w-4 h-4" />}
                            >
                              Delete
                            </Button>
                          </Popconfirm>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Service Modal - VR Hotel Style */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${
          modalVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setModalVisible(false)}
      />

      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="border-b border-slate-200 p-6 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">
                {editingService ? 'Edit Service' : 'Add Service'}
              </h3>
              <button
                onClick={() => setModalVisible(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <Form
                form={serviceForm}
                layout="vertical"
                onFinish={handleServiceSubmit}
              >
                {/* Language Tabs */}
                <div className="flex gap-2 mb-6 border-b border-slate-200">
                  {supportedLanguages.map((locale) => (
                    <button
                      key={locale}
                      onClick={() => setCurrentServiceLocale(locale)}
                      className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${
                        currentServiceLocale === locale
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      <span>{LANGUAGE_CONFIG[locale]?.flag}</span>
                      {LANGUAGE_CONFIG[locale]?.name || locale.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Translations Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Service Name {currentServiceLocale === 'vi' && <span className="text-red-500">*</span>}
                    </label>
                    <Input
                      placeholder="e.g., MAIA SPA"
                      value={serviceTranslations[currentServiceLocale]?.name || ''}
                      onChange={(e) => {
                        setServiceTranslations(prev => ({
                          ...prev,
                          [currentServiceLocale]: {
                            ...prev[currentServiceLocale],
                            locale: currentServiceLocale,
                            name: e.target.value
                          }
                        }));
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description (Optional)
                    </label>
                    <TextArea
                      rows={3}
                      placeholder="Enter a detailed service description..."
                      value={serviceTranslations[currentServiceLocale]?.description || ''}
                      onChange={(e) => {
                        setServiceTranslations(prev => ({
                          ...prev,
                          [currentServiceLocale]: {
                            ...prev[currentServiceLocale],
                            locale: currentServiceLocale,
                            description: e.target.value
                          }
                        }));
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Settings Section */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Service Code *</label>
                    <Input
                      placeholder="e.g., SV01"
                      defaultValue={editingService?.code || ''}
                      onChange={(e) => serviceForm.setFieldValue('code', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Service Type *</label>
                    <Select 
                      placeholder="Select service type"
                      defaultValue={editingService?.service_type}
                      onChange={(value) => serviceForm.setFieldValue('service_type', value)}
                      className="w-full"
                      options={SERVICE_TYPES}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Availability</label>
                    <Input
                      placeholder="e.g., 24/7, 9:00 AM - 10:00 PM"
                      defaultValue={editingService?.availability || ''}
                      onChange={(e) => serviceForm.setFieldValue('availability', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Price Information</label>
                    <Input
                      placeholder="e.g., Starting from $50, Free, Upon request"
                      defaultValue={editingService?.price_information || ''}
                      onChange={(e) => serviceForm.setFieldValue('price_information', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      🔗 VR360 Tour Link
                    </label>
                    <Input
                      type="url"
                      placeholder="https://example.com/vr360-tour"
                      defaultValue={editingService?.vr360_tour_url || ''}
                      onChange={(e) => serviceForm.setFieldValue('vr360_tour_url', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      📅 Booking URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://booking.example.com/service-reservation"
                      defaultValue={editingService?.booking_url || ''}
                      onChange={(e) => serviceForm.setFieldValue('booking_url', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
                      <span>ℹ️</span>
                      <span>Enter the direct booking/reservation URL for this service</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Display Order</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      defaultValue={editingService?.display_order || 0}
                      onChange={(e) => serviceForm.setFieldValue('display_order', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input 
                        type="checkbox"
                        defaultChecked={editingService?.is_active ?? true}
                        onChange={(e) => serviceForm.setFieldValue('is_active', e.target.checked)}
                        className="rounded"
                      />
                      Active
                    </label>
                  </div>
                </div>

                {/* Image Section */}
                <div className="mt-6 space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    🖼️ Service Image
                  </label>
                  <div className="mb-3">
                    <Button 
                      onClick={handleOpenMediaPicker}
                      type="primary"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                      Select Image
                    </Button>
                  </div>
                  {selectedImageId && (
                    <div className="mt-4">
                      <div className="relative group">
                        <img 
                          src={`${getApiBaseUrl()}/media/${selectedImageId}/view`}
                          alt="Service Image"
                          className="w-full h-40 object-cover rounded-md border-2 border-slate-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                          <Button
                            danger
                            size="small"
                            onClick={() => setSelectedImageId(null)}
                            className="bg-red-600 text-white hover:bg-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
                    <span>ℹ️</span>
                    <span>Use a professional image for better presentation</span>
                  </p>
                </div>
              </Form>
            </div>

            {/* Sticky Footer */}
            <div className="border-t border-slate-200 p-6 bg-slate-50 flex justify-end gap-4 sticky bottom-0">
              <Button
                onClick={() => setModalVisible(false)}
                className="px-6 py-2 border border-slate-600 text-slate-600 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleServiceSubmit}
                type="primary"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingService ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      {mediaPickerVisible && (
        <MediaPickerModal
          source="cafe"
          folder="services"
          kind="image"
          onSelect={handleMediaSelected}
          onClose={() => setMediaPickerVisible(false)}
        />
      )}
    </div>
  );
};

export default CafeServices;
