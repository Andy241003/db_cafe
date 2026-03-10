import { Button, DatePicker, Form, Input, InputNumber, message, Modal, Select, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Edit, Eye, EyeOff, Languages, Percent, Plus, Tag as TagIcon, Trash2, Glasses, Play, Info } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import TranslationModal from '../../components/TranslationModal';
import { cafePromotionsApi, cafeLanguagesApi, cafeSettingsApi, type Promotion as ApiPromotion, type PromotionTranslation } from '../../services/cafeApi';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface Promotion {
  id: number;
  title: string;
  description?: string;
  promotion_type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'combo';
  discount_value?: number;
  valid_from: string;
  valid_to: string;
  is_displaying: boolean;
  is_featured: boolean;
  terms_conditions?: string;
  usage_limit?: number;
  current_usage?: number;
}

const CafePromotions: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [form] = Form.useForm();

  // Translation state
  const [translationModalVisible, setTranslationModalVisible] = useState(false);
  const [translatingPromotion, setTranslatingPromotion] = useState<ApiPromotion | null>(null);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['vi', 'en']);

  // Display status state
  const [isDisplaying, setIsDisplaying] = useState(true);
  const [savingDisplayStatus, setSavingDisplayStatus] = useState(false);
  const [vr360Link, setVr360Link] = useState('');
  const [vrTitle, setVrTitle] = useState('');
  const [savingVR, setSavingVR] = useState(false);

  useEffect(() => {
    loadPromotions();
    loadLanguageSettings();
  }, []);

  const loadLanguageSettings = async () => {
    try {
      const langs = await cafeLanguagesApi.getLanguageCodes();
      setSupportedLanguages(langs);
      
      // Load display status
      const settings = await cafeSettingsApi.getSettings();
      const displayStatus = settings.settings_json?.promotions_is_displaying ?? true;
      setIsDisplaying(displayStatus);
      setVr360Link(settings.settings_json?.promotions_vr360_link || '');
      setVrTitle(settings.settings_json?.promotions_vr_title || '');
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };

  const loadPromotions = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockPromotions: Promotion[] = [
        {
          id: 1,
          title: 'Happy Hour - 30% Off',
          description: 'Get 30% off on all beverages from 2-4 PM',
          promotion_type: 'percentage',
          discount_value: 30,
          valid_from: '2024-02-01T14:00:00',
          valid_to: '2024-02-28T16:00:00',
          is_displaying: true,
          is_featured: true,
          terms_conditions: 'Valid only during happy hours. Cannot be combined with other offers.',
          usage_limit: 1000,
          current_usage: 245
        },
        {
          id: 2,
          title: 'Buy 2 Get 1 Free',
          description: 'Buy any 2 drinks and get 1 free pastry',
          promotion_type: 'buy_x_get_y',
          valid_from: '2024-02-15T00:00:00',
          valid_to: '2024-03-15T23:59:59',
          is_displaying: true,
          is_featured: false,
          terms_conditions: 'Free pastry must be of equal or lesser value.',
          usage_limit: 500,
          current_usage: 89
        },
        {
          id: 3,
          title: 'Student Discount',
          description: '20% off for students with valid ID',
          promotion_type: 'percentage',
          discount_value: 20,
          valid_from: '2024-01-01T00:00:00',
          valid_to: '2024-12-31T23:59:59',
          is_displaying: true,
          is_featured: false,
          terms_conditions: 'Must present valid student ID. Valid all day.'
        },
        {
          id: 4,
          title: 'Valentine Special Combo',
          description: '2 coffees + 2 desserts for 150,000 VND',
          promotion_type: 'combo',
          discount_value: 150000,
          valid_from: '2024-02-10T00:00:00',
          valid_to: '2024-02-14T23:59:59',
          is_displaying: false,
          is_featured: false,
          terms_conditions: 'Limited availability. While stocks last.',
          usage_limit: 100,
          current_usage: 100
        },
      ];
      
      setPromotions(mockPromotions);
    } catch (error) {
      message.error('Failed to load promotions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const convertToEmbedUrl = (url: string): string => {
    if (!url) return url;
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  };

  const handleVR360Change = async (field: 'link' | 'title', value: string) => {
    try {
      setSavingVR(true);
      const currentSettings = await cafeSettingsApi.getSettings();
      const updates = { ...currentSettings.settings_json };
      
      if (field === 'link') {
        const embedUrl = convertToEmbedUrl(value);
        updates.promotions_vr360_link = embedUrl;
        setVr360Link(embedUrl);
      } else {
        updates.promotions_vr_title = value;
        setVrTitle(value);
      }
      
      await cafeSettingsApi.updateSettings({ settings_json: updates });
      message.success('VR360 settings saved');
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to save VR360 settings');
    } finally {
      setSavingVR(false);
    }
  };

  const handleAdd = () => {
    setEditingPromotion(null);
    form.resetFields();
    form.setFieldsValue({ 
      promotion_type: 'percentage',
      is_displaying: true,
      is_featured: false 
    });
    setModalVisible(true);
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    form.setFieldsValue({
      ...promotion,
      date_range: [dayjs(promotion.valid_from), dayjs(promotion.valid_to)]
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Delete Promotion',
      content: 'Are you sure you want to delete this promotion?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          message.success('Promotion deleted successfully');
          loadPromotions();
        } catch (error) {
          message.error('Failed to delete promotion');
        }
      },
    });
  };

  const handleEditPromotionTranslations = async (promotion: Promotion) => {
    try {
      const fullPromotion = await cafePromotionsApi.getPromotion(promotion.id);
      setTranslatingPromotion(fullPromotion);
      setTranslationModalVisible(true);
    } catch (error) {
      message.error('Failed to load promotion data');
    }
  };

  const handleSaveTranslations = async (translations: Record<string, Record<string, string>>) => {
    if (!translatingPromotion) return;

    try {
      const translationArray: PromotionTranslation[] = Object.entries(translations).map(([locale, data]) => ({
        locale,
        title: data.title || '',
        description: data.description || '',
        terms_and_conditions: data.terms_and_conditions || '',
      }));

      await cafePromotionsApi.updatePromotionTranslations(translatingPromotion.id, translationArray);
      message.success('Translations updated successfully');
      setTranslationModalVisible(false);
      setTranslatingPromotion(null);
      loadPromotions();
    } catch (error) {
      console.error('Error updating translations:', error);
      message.error('Failed to update translations');
      throw error;
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const { date_range, ...rest } = values;
      const payload = {
        ...rest,
        valid_from: date_range[0].toISOString(),
        valid_to: date_range[1].toISOString()
      };
      
      if (editingPromotion) {
        message.success('Promotion updated successfully');
      } else {
        message.success('Promotion created successfully');
      }
      setModalVisible(false);
      loadPromotions();
    } catch (error) {
      message.error('Failed to save promotion');
    }
  };

  const columns: ColumnsType<Promotion> = [
    {
      title: 'Promotion',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div className="flex items-center gap-2">
            <TagIcon className="w-4 h-4 text-red-600" />
            <span className="font-semibold">{text}</span>
            {record.is_featured && <Tag color="gold">Featured</Tag>}
          </div>
          <div className="text-xs text-gray-500 mt-1">{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Type & Value',
      key: 'discount',
      render: (_, record) => {
        const typeLabels = {
          percentage: 'Percentage',
          fixed_amount: 'Fixed Amount',
          buy_x_get_y: 'Buy X Get Y',
          combo: 'Combo Deal'
        };
        
        return (
          <div>
            <Tag color="blue">{typeLabels[record.promotion_type as keyof typeof typeLabels]}</Tag>
            {record.discount_value && (
              <div className="text-sm font-semibold text-red-600 mt-1 flex items-center gap-1">
                <Percent className="w-3 h-3" />
                {record.promotion_type === 'percentage' ? `${record.discount_value}%` : `${record.discount_value.toLocaleString()} VND`}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Valid Period',
      key: 'period',
      render: (_, record) => {
        const now = dayjs();
        const start = dayjs(record.valid_from);
        const end = dayjs(record.valid_to);
        
        let status = 'Active';
        let color = 'green';
        
        if (now.isBefore(start)) {
          status = 'Upcoming';
          color = 'blue';
        } else if (now.isAfter(end)) {
          status = 'Expired';
          color = 'default';
        }
        
        return (
          <div>
            <Tag color={color}>{status}</Tag>
            <div className="text-xs text-gray-500 mt-1">
              {start.format('MMM D')} - {end.format('MMM D, YYYY')}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_, record) => {
        if (!record.usage_limit) return <span className="text-gray-400">Unlimited</span>;
        
        const percentage = ((record.current_usage || 0) / record.usage_limit) * 100;
        const color = percentage >= 100 ? 'red' : percentage >= 80 ? 'orange' : 'green';
        
        return (
          <Tag color={color}>
            {record.current_usage || 0} / {record.usage_limit}
          </Tag>
        );
      },
    },
    {
      title: 'Visible',
      dataIndex: 'is_displaying',
      key: 'is_displaying',
      width: 80,
      render: (visible) => visible ? <Eye className="w-5 h-5 text-green-600" /> : <EyeOff className="w-5 h-5 text-gray-400" />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<Languages className="w-4 h-4" />}
            onClick={() => handleEditPromotionTranslations(record)}
            title="Edit Translations"
            className="text-blue-600"
          />
          <Button
            type="text"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => handleDelete(record.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Display Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Display Status - Promotions Section</h2>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isDisplaying ? 'text-green-600' : 'text-slate-500'}`}>
              {isDisplaying ? 'Displaying' : 'Hidden'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isDisplaying}
                onChange={async (e) => {
                  const newValue = e.target.checked;
                  try {
                    setSavingDisplayStatus(true);
                    const currentSettings = await cafeSettingsApi.getSettings();
                    await cafeSettingsApi.updateSettings({
                      settings_json: {
                        ...currentSettings.settings_json,
                        promotions_is_displaying: newValue
                      }
                    });
                    setIsDisplaying(newValue);
                    message.success(newValue ? 'Promotions section enabled' : 'Promotions section disabled');
                  } catch (error: any) {
                    message.error(error.response?.data?.detail || 'Failed to update display status');
                  } finally {
                    setSavingDisplayStatus(false);
                  }
                }}
                disabled={savingDisplayStatus}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
            </label>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Percent className="text-blue-600 text-xl mt-0.5" />
          <span className="text-blue-800 text-sm">
            When display is turned off, the "Promotions" section will not appear on the website. You can still edit and manage promotions.
          </span>
        </div>
      </div>

      {/* VR360 Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center gap-3">
          <Glasses className="text-purple-600 text-xl" />
          <h2 className="text-xl font-bold text-slate-800">VR360 Settings</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Link VR360 Panorama / YouTube Video
            </label>
            <input
              type="url"
              placeholder="https://example.com/panorama.jpg or https://youtube.com/watch?v=..."
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              value={vr360Link}
              onChange={(e) => handleVR360Change('link', e.target.value)}
              disabled={savingVR}
            />
            <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
              <Info className="mt-0.5 w-4 h-4" />
              <span>
                Enter the URL to a 360° panorama image (equirectangular JPG, min 4096x2048px) or YouTube video URL
              </span>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">VR Tour Title</label>
            <input
              type="text"
              placeholder="Enter VR tour title"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              value={vrTitle}
              onChange={(e) => handleVR360Change('title', e.target.value)}
              disabled={savingVR}
            />
          </div>
          
          {vr360Link && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="text-slate-600 w-5 h-5" />
                <h3 className="text-sm font-medium text-slate-700">VR360 Preview</h3>
              </div>
              
              <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                <div className="relative w-full" style={{ height: '500px' }}>
                  <iframe
                    src={vr360Link}
                    className="absolute top-0 left-0 w-full h-full"
                    allowFullScreen
                    title="VR360 Preview"
                    allow="xr-spatial-tracking; gyroscope; accelerometer"
                  />
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => window.open(vr360Link, '_blank')}
                  className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors inline-flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  View Fullscreen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions Management</h1>
          <p className="text-gray-600 mt-1">Manage special offers and discounts</p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Add Promotion
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <Table
          columns={columns}
          dataSource={promotions}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>

      {/* Modal */}
      <Modal
        title={editingPromotion ? 'Edit Promotion' : 'Add Promotion'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Promotion Title"
            name="title"
            rules={[{ required: true, message: 'Please enter promotion title' }]}
          >
            <Input placeholder="e.g., Happy Hour - 30% Off" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea rows={2} placeholder="Brief description of the promotion" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Promotion Type"
              name="promotion_type"
              rules={[{ required: true, message: 'Please select type' }]}
            >
              <Select>
                <Select.Option value="percentage">Percentage Discount</Select.Option>
                <Select.Option value="fixed_amount">Fixed Amount</Select.Option>
                <Select.Option value="buy_x_get_y">Buy X Get Y</Select.Option>
                <Select.Option value="combo">Combo Deal</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Discount Value" name="discount_value">
              <InputNumber 
                min={0} 
                className="w-full" 
                placeholder="Enter value"
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Valid Period"
            name="date_range"
            rules={[{ required: true, message: 'Please select valid period' }]}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              className="w-full"
            />
          </Form.Item>

          <Form.Item label="Terms & Conditions" name="terms_conditions">
            <TextArea rows={3} placeholder="Enter terms and conditions" />
          </Form.Item>

          <Form.Item label="Usage Limit" name="usage_limit">
            <InputNumber 
              min={0} 
              className="w-full" 
              placeholder="Leave empty for unlimited"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Show on Website" name="is_displaying" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item label="Featured Promotion" name="is_featured" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Translation Modal */}
      <TranslationModal
        visible={translationModalVisible}
        onClose={() => {
          setTranslationModalVisible(false);
          setTranslatingPromotion(null);
        }}
        onSave={handleSaveTranslations}
        fields={[
          { key: 'title', label: 'Promotion Title', type: 'input', required: true },
          { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
          { key: 'terms_and_conditions', label: 'Terms & Conditions', type: 'textarea', rows: 4 },
        ]}
        initialData={
          translatingPromotion?.translations?.reduce((acc, t) => {
            acc[t.locale] = {
              title: t.title || '',
              description: t.description || '',
              terms_and_conditions: t.terms_and_conditions || '',
            };
            return acc;
          }, {} as Record<string, Record<string, string>>)
        }
        supportedLanguages={supportedLanguages}
        title="Edit Promotion Translations"
      />
    </div>
  );
};

export default CafePromotions;
