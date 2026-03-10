import { Button, DatePicker, Form, Input, InputNumber, message, Modal, Select, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Briefcase, Edit, Eye, EyeOff, Languages, Plus, Trash2, Glasses, Play, Info } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import TranslationModal from '../../components/TranslationModal';
import { cafeCareersApi, cafeLanguagesApi, cafeSettingsApi, type Career as ApiCareer, type CareerTranslation } from '../../services/cafeApi';

const { TextArea } = Input;

interface Career {
  id: number;
  position: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  salary_min?: number;
  salary_max?: number;
  location?: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'internship';
  status: 'open' | 'closed' | 'filled';
  is_urgent: boolean;
  is_displaying: boolean;
  deadline?: string;
}

const CafeCareers: React.FC = () => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);
  const [form] = Form.useForm();

  // Translation state
  const [translationModalVisible, setTranslationModalVisible] = useState(false);
  const [translatingCareer, setTranslatingCareer] = useState<ApiCareer | null>(null);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['vi', 'en']);

  // Display status state
  const [isDisplaying, setIsDisplaying] = useState(true);
  const [savingDisplayStatus, setSavingDisplayStatus] = useState(false);
  const [vr360Link, setVr360Link] = useState('');
  const [vrTitle, setVrTitle] = useState('');
  const [savingVR, setSavingVR] = useState(false);

  useEffect(() => {
    loadCareers();
    loadLanguageSettings();
  }, []);

  const loadLanguageSettings = async () => {
    try {
      const langs = await cafeLanguagesApi.getLanguageCodes();
      setSupportedLanguages(langs);
      
      // Load display status
      const settings = await cafeSettingsApi.getSettings();
      const displayStatus = settings.settings_json?.careers_is_displaying ?? true;
      setIsDisplaying(displayStatus);
      setVr360Link(settings.settings_json?.careers_vr360_link || '');
      setVrTitle(settings.settings_json?.careers_vr_title || '');
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };

  const loadCareers = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockCareers: Career[] = [
        {
          id: 1,
          position: 'Barista',
          description: 'We are looking for an experienced barista to join our team',
          requirements: 'Experience with espresso machines, latte art skills, customer service',
          benefits: 'Competitive salary, health insurance, training opportunities',
          salary_min: 8000000,
          salary_max: 12000000,
          location: 'Downtown Branch',
          employment_type: 'full_time',
          status: 'open',
          is_urgent: true,
          is_displaying: true,
          deadline: '2024-03-31'
        },
        {
          id: 2,
          position: 'Cafe Manager',
          description: 'Seeking an experienced manager to oversee operations',
          requirements: 'Management experience, F&B background, leadership skills',
          benefits: 'High salary, bonuses, career growth',
          salary_min: 15000000,
          salary_max: 20000000,
          location: 'All Branches',
          employment_type: 'full_time',
          status: 'open',
          is_urgent: false,
          is_displaying: true,
          deadline: '2024-04-15'
        },
        {
          id: 3,
          position: 'Part-time Server',
          description: 'Part-time position for weekends',
          requirements: 'Friendly attitude, no experience required',
          benefits: 'Flexible hours, staff discounts',
          salary_min: 40000,
          salary_max: 50000,
          location: 'Beach Side Branch',
          employment_type: 'part_time',
          status: 'closed',
          is_urgent: false,
          is_displaying: false
        },
      ];
      
      setCareers(mockCareers);
    } catch (error) {
      message.error('Failed to load career openings');
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
        updates.careers_vr360_link = embedUrl;
        setVr360Link(embedUrl);
      } else {
        updates.careers_vr_title = value;
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
    setEditingCareer(null);
    form.resetFields();
    form.setFieldsValue({ 
      employment_type: 'full_time',
      status: 'open',
      is_urgent: false,
      is_displaying: true 
    });
    setModalVisible(true);
  };

  const handleEdit = (career: Career) => {
    setEditingCareer(career);
    form.setFieldsValue({
      ...career,
      deadline: career.deadline ? dayjs(career.deadline) : null
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Delete Job Posting',
      content: 'Are you sure you want to delete this job posting?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          message.success('Job posting deleted successfully');
          loadCareers();
        } catch (error) {
          message.error('Failed to delete job posting');
        }
      },
    });
  };

  const handleEditCareerTranslations = async (career: Career) => {
    try {
      const fullCareer = await cafeCareersApi.getCareer(career.id);
      setTranslatingCareer(fullCareer);
      setTranslationModalVisible(true);
    } catch (error) {
      message.error('Failed to load career data');
    }
  };

  const handleSaveTranslations = async (translations: Record<string, Record<string, string>>) => {
    if (!translatingCareer) return;

    try {
      const translationArray: CareerTranslation[] = Object.entries(translations).map(([locale, data]) => ({
        locale,
        title: data.title || '',
        description: data.description || '',
        requirements: data.requirements || '',
        benefits: data.benefits || '',
      }));

      await cafeCareersApi.updateCareerTranslations(translatingCareer.id, translationArray);
      message.success('Translations updated successfully');
      setTranslationModalVisible(false);
      setTranslatingCareer(null);
      loadCareers();
    } catch (error) {
      console.error('Error updating translations:', error);
      message.error('Failed to update translations');
      throw error;
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        deadline: values.deadline ? values.deadline.format('YYYY-MM-DD') : null
      };
      
      if (editingCareer) {
        message.success('Job posting updated successfully');
      } else {
        message.success('Job posting created successfully');
      }
      setModalVisible(false);
      loadCareers();
    } catch (error) {
      message.error('Failed to save job posting');
    }
  };

  const columns: ColumnsType<Career> = [
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      render: (text, record) => (
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-green-600" />
            <span className="font-semibold">{text}</span>
            {record.is_urgent && <Tag color="red">Urgent</Tag>}
          </div>
          <div className="text-xs text-gray-500 mt-1">{record.location}</div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'employment_type',
      key: 'employment_type',
      render: (type) => {
        const labels = {
          full_time: 'Full Time',
          part_time: 'Part Time',
          contract: 'Contract',
          internship: 'Internship'
        };
        return <Tag>{labels[type as keyof typeof labels]}</Tag>;
      },
    },
    {
      title: 'Salary Range',
      key: 'salary',
      render: (_, record) => {
        if (!record.salary_min && !record.salary_max) return <span className="text-gray-400">Negotiable</span>;
        
        const min = record.salary_min?.toLocaleString() || '?';
        const max = record.salary_max?.toLocaleString() || '?';
        
        return (
          <span className="text-sm font-medium text-green-600">
            {min} - {max} VND
          </span>
        );
      },
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (deadline) => {
        if (!deadline) return <span className="text-gray-400">No deadline</span>;
        
        const daysLeft = dayjs(deadline).diff(dayjs(), 'day');
        const color = daysLeft < 7 ? 'red' : daysLeft < 14 ? 'orange' : 'blue';
        
        return (
          <Tag color={color}>
            {dayjs(deadline).format('MMM D, YYYY')} ({daysLeft}d left)
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
          open: 'green',
          closed: 'default',
          filled: 'blue',
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
            onClick={() => handleEditCareerTranslations(record)}
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
          <h2 className="text-xl font-bold text-slate-800">Display Status - Careers Section</h2>
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
                        careers_is_displaying: newValue
                      }
                    });
                    setIsDisplaying(newValue);
                    message.success(newValue ? 'Careers section enabled' : 'Careers section disabled');
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
          <Briefcase className="text-blue-600 text-xl mt-0.5" />
          <span className="text-blue-800 text-sm">
            When display is turned off, the "Careers" section will not appear on the website. You can still edit and manage career opportunities.
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
          <h1 className="text-2xl font-bold text-gray-900">Careers Management</h1>
          <p className="text-gray-600 mt-1">Manage job openings and recruitment</p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Add Job Posting
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <Table
          columns={columns}
          dataSource={careers}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>

      {/* Modal */}
      <Modal
        title={editingCareer ? 'Edit Job Posting' : 'Add Job Posting'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Position Title"
              name="position"
              rules={[{ required: true, message: 'Please enter position title' }]}
            >
              <Input placeholder="e.g., Barista" />
            </Form.Item>

            <Form.Item label="Location" name="location">
              <Input placeholder="e.g., Downtown Branch" />
            </Form.Item>
          </div>

          <Form.Item label="Job Description" name="description">
            <TextArea rows={3} placeholder="Describe the role and responsibilities" />
          </Form.Item>

          <Form.Item label="Requirements" name="requirements">
            <TextArea rows={3} placeholder="List the required skills and qualifications" />
          </Form.Item>

          <Form.Item label="Benefits" name="benefits">
            <TextArea rows={2} placeholder="What benefits do you offer?" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Minimum Salary (VND/month)" name="salary_min">
              <InputNumber 
                min={0} 
                className="w-full" 
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                placeholder="8,000,000"
              />
            </Form.Item>

            <Form.Item label="Maximum Salary (VND/month)" name="salary_max">
              <InputNumber 
                min={0} 
                className="w-full" 
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                placeholder="12,000,000"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item
              label="Employment Type"
              name="employment_type"
              rules={[{ required: true, message: 'Please select type' }]}
            >
              <Select>
                <Select.Option value="full_time">Full Time</Select.Option>
                <Select.Option value="part_time">Part Time</Select.Option>
                <Select.Option value="contract">Contract</Select.Option>
                <Select.Option value="internship">Internship</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select>
                <Select.Option value="open">Open</Select.Option>
                <Select.Option value="closed">Closed</Select.Option>
                <Select.Option value="filled">Filled</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Application Deadline" name="deadline">
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Show on Website" name="is_displaying" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item label="Mark as Urgent" name="is_urgent" valuePropName="checked">
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
          setTranslatingCareer(null);
        }}
        onSave={handleSaveTranslations}
        fields={[
          { key: 'title', label: 'Position Title', type: 'input', required: true },
          { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
          { key: 'requirements', label: 'Requirements', type: 'textarea', rows: 3 },
          { key: 'benefits', label: 'Benefits', type: 'textarea', rows: 3 },
        ]}
        initialData={
          translatingCareer?.translations?.reduce((acc, t) => {
            acc[t.locale] = {
              title: t.title || '',
              description: t.description || '',
              requirements: t.requirements || '',
              benefits: t.benefits || '',
            };
            return acc;
          }, {} as Record<string, Record<string, string>>)
        }
        supportedLanguages={supportedLanguages}
        title="Edit Career Translations"
      />
    </div>
  );
};

export default CafeCareers;
