import { Button, DatePicker, Form, Input, InputNumber, message, Modal, Select, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Calendar, Edit, Eye, EyeOff, Languages, Plus, Trash2, Glasses, Play, Info } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import TranslationModal from '../../components/TranslationModal';
import { cafeEventsApi, cafeLanguagesApi, cafeSettingsApi, type CafeEvent as ApiCafeEvent, type EventTranslation } from '../../services/cafeApi';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface CafeEvent {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  max_participants?: number;
  current_participants?: number;
  is_displaying: boolean;
  is_featured: boolean;
  registration_url?: string;
}

const CafeEvents: React.FC = () => {
  const [events, setEvents] = useState<CafeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CafeEvent | null>(null);
  const [form] = Form.useForm();

  // Translation state
  const [translationModalVisible, setTranslationModalVisible] = useState(false);
  const [translatingEvent, setTranslatingEvent] = useState<ApiCafeEvent | null>(null);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['vi', 'en']);

  // Display status state
  const [isDisplaying, setIsDisplaying] = useState(true);
  const [savingDisplayStatus, setSavingDisplayStatus] = useState(false);
  const [vr360Link, setVr360Link] = useState('');
  const [vrTitle, setVrTitle] = useState('');
  const [savingVR, setSavingVR] = useState(false);

  useEffect(() => {
    loadEvents();
    loadLanguageSettings();
  }, []);

  const loadLanguageSettings = async () => {
    try {
      const langs = await cafeLanguagesApi.getLanguageCodes();
      setSupportedLanguages(langs);
      
      // Load display status
      const settings = await cafeSettingsApi.getSettings();
      const displayStatus = settings.settings_json?.events_is_displaying ?? true;
      setIsDisplaying(displayStatus);
      setVr360Link(settings.settings_json?.events_vr360_link || '');
      setVrTitle(settings.settings_json?.events_vr_title || '');
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockEvents: CafeEvent[] = [
        {
          id: 1,
          title: 'Coffee Tasting Workshop',
          description: 'Learn about coffee origins and brewing techniques',
          start_date: '2024-02-15T14:00:00',
          end_date: '2024-02-15T17:00:00',
          status: 'upcoming',
          max_participants: 20,
          current_participants: 12,
          is_displaying: true,
          is_featured: true,
          registration_url: 'https://forms.gle/example'
        },
        {
          id: 2,
          title: 'Live Jazz Night',
          description: 'Enjoy live jazz music every Friday evening',
          start_date: '2024-02-16T19:00:00',
          end_date: '2024-02-16T22:00:00',
          status: 'upcoming',
          is_displaying: true,
          is_featured: false
        },
        {
          id: 3,
          title: 'Latte Art Competition',
          description: 'Show off your latte art skills',
          start_date: '2024-01-20T10:00:00',
          end_date: '2024-01-20T16:00:00',
          status: 'completed',
          max_participants: 15,
          current_participants: 15,
          is_displaying: false,
          is_featured: false
        },
      ];
      
      setEvents(mockEvents);
    } catch (error) {
      message.error('Failed to load events');
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
        updates.events_vr360_link = embedUrl;
        setVr360Link(embedUrl);
      } else {
        updates.events_vr_title = value;
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
    setEditingEvent(null);
    form.resetFields();
    form.setFieldsValue({ status: 'upcoming', is_displaying: true, is_featured: false });
    setModalVisible(true);
  };

  const handleEdit = (event: CafeEvent) => {
    setEditingEvent(event);
    form.setFieldsValue({
      ...event,
      date_range: [dayjs(event.start_date), dayjs(event.end_date)]
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Delete Event',
      content: 'Are you sure you want to delete this event?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          message.success('Event deleted successfully');
          loadEvents();
        } catch (error) {
          message.error('Failed to delete event');
        }
      },
    });
  };

  const handleEditEventTranslations = async (event: CafeEvent) => {
    try {
      // Load full event data from API to get translations
      const fullEvent = await cafeEventsApi.getEvent(event.id);
      setTranslatingEvent(fullEvent);
      setTranslationModalVisible(true);
    } catch (error) {
      message.error('Failed to load event data');
    }
  };

  const handleSaveTranslations = async (translations: Record<string, Record<string, string>>) => {
    if (!translatingEvent) return;

    try {
      const translationArray: EventTranslation[] = Object.entries(translations).map(([locale, data]) => ({
        locale,
        title: data.title || '',
        description: data.description || '',
        details: data.details || '',
      }));

      await cafeEventsApi.updateEventTranslations(translatingEvent.id, translationArray);
      message.success('Translations updated successfully');
      setTranslationModalVisible(false);
      setTranslatingEvent(null);
      loadEvents();
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
        start_date: date_range[0].toISOString(),
        end_date: date_range[1].toISOString()
      };
      
      if (editingEvent) {
        message.success('Event updated successfully');
      } else {
        message.success('Event created successfully');
      }
      setModalVisible(false);
      loadEvents();
    } catch (error) {
      message.error('Failed to save event');
    }
  };

  const columns: ColumnsType<CafeEvent> = [
    {
      title: 'Event',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="font-semibold">{text}</span>
            {record.is_featured && <Tag color="gold">Featured</Tag>}
          </div>
          <div className="text-xs text-gray-500 mt-1">{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Date & Time',
      key: 'date',
      render: (_, record) => (
        <div className="text-sm">
          <div>{dayjs(record.start_date).format('MMM D, YYYY HH:mm')}</div>
          <div className="text-gray-500">to {dayjs(record.end_date).format('MMM D, YYYY HH:mm')}</div>
        </div>
      ),
    },
    {
      title: 'Participants',
      key: 'participants',
      render: (_, record) => {
        if (!record.max_participants) return <span className="text-gray-400">Unlimited</span>;
        
        const percentage = ((record.current_participants || 0) / record.max_participants) * 100;
        const color = percentage >= 100 ? 'red' : percentage >= 70 ? 'orange' : 'green';
        
        return (
          <Tag color={color}>
            {record.current_participants || 0} / {record.max_participants}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          upcoming: 'blue',
          ongoing: 'green',
          completed: 'default',
          cancelled: 'red',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
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
            onClick={() => handleEditEventTranslations(record)}
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
          <h2 className="text-xl font-bold text-slate-800">Display Status - Events Section</h2>
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
                        events_is_displaying: newValue
                      }
                    });
                    setIsDisplaying(newValue);
                    message.success(newValue ? 'Events section enabled' : 'Events section disabled');
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
          <Calendar className="text-blue-600 text-xl mt-0.5" />
          <span className="text-blue-800 text-sm">
            When display is turned off, the "Events" section will not appear on the website. You can still edit and manage events.
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
          <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
          <p className="text-gray-600 mt-1">Manage cafe events and activities</p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Add Event
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <Table
          columns={columns}
          dataSource={events}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>

      {/* Modal */}
      <Modal
        title={editingEvent ? 'Edit Event' : 'Add Event'}
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
            label="Event Title"
            name="title"
            rules={[{ required: true, message: 'Please enter event title' }]}
          >
            <Input placeholder="e.g., Coffee Tasting Workshop" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea rows={3} placeholder="Describe the event" />
          </Form.Item>

          <Form.Item
            label="Date & Time"
            name="date_range"
            rules={[{ required: true, message: 'Please select date range' }]}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              className="w-full"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select>
                <Select.Option value="upcoming">Upcoming</Select.Option>
                <Select.Option value="ongoing">Ongoing</Select.Option>
                <Select.Option value="completed">Completed</Select.Option>
                <Select.Option value="cancelled">Cancelled</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Max Participants" name="max_participants">
              <InputNumber min={1} className="w-full" placeholder="Leave empty for unlimited" />
            </Form.Item>
          </div>

          <Form.Item label="Registration URL" name="registration_url">
            <Input placeholder="https://..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Show on Website" name="is_displaying" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item label="Featured Event" name="is_featured" valuePropName="checked">
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
          setTranslatingEvent(null);
        }}
        onSave={handleSaveTranslations}
        fields={[
          { key: 'title', label: 'Event Title', type: 'input', required: true },
          { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
          { key: 'details', label: 'Details', type: 'textarea', rows: 5 },
        ]}
        initialData={
          translatingEvent?.translations?.reduce((acc, t) => {
            acc[t.locale] = {
              title: t.title || '',
              description: t.description || '',
              details: t.details || '',
            };
            return acc;
          }, {} as Record<string, Record<string, string>>)
        }
        supportedLanguages={supportedLanguages}
        title="Edit Event Translations"
      />
    </div>
  );
};

export default CafeEvents;
