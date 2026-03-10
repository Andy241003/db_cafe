import { Button, Form, Input, message, Switch, Upload } from 'antd';
import { Home, Plus, Save, Star, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface Feature {
  id: number;
  icon: string;
  title_vi: string;
  title_en?: string;
  description: string;
}

interface Value {
  id: number;
  title_vi: string;
  title_en?: string;
  description: string;
}

interface HomeAboutData {
  is_displaying: boolean;
  hero_title_vi?: string;
  hero_title_en?: string;
  hero_description?: string;
  hero_image_url?: string;
  features: Feature[];
  values: Value[];
}

const CafeHomeAbout: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HomeAboutData>({
    is_displaying: true,
    features: [],
    values: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockData: HomeAboutData = {
        is_displaying: true,
        hero_title_vi: 'Welcome to Coffee House',
        hero_title_en: 'Welcome to Coffee House',
        hero_description: 'Where flavors meet - Modern coffee space serving high-quality beverages.',
        hero_image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
        features: [
          { id: 1, icon: '☕', title_vi: 'Cà Phê Tuyệt Vời', title_en: 'Great Coffee', description: 'Premium coffee beans selected from famous growing regions.' },
          { id: 2, icon: '🏢', title_vi: 'Không Gian Đẹp', title_en: 'Beautiful Space', description: 'Modern design, comfortable for work and relaxation.' },
          { id: 3, icon: '📶', title_vi: 'Wifi Tốc Độ Cao', title_en: 'High-Speed Wifi', description: 'Fast and stable internet connection.' }
        ],
        values: [
          { id: 1, title_vi: 'Đam Mê', title_en: 'Passion', description: 'We are passionate about every cup of coffee.' },
          { id: 2, title_vi: 'Tận Tâm', title_en: 'Dedication', description: 'Serving customers wholeheartedly.' },
          { id: 3, title_vi: 'Chất Lượng', title_en: 'Quality', description: 'Committed to the best product quality.' }
        ]
      };
      
      setData(mockData);
      form.setFieldsValue(mockData);
    } catch (error) {
      message.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHero = async (values: any) => {
    try {
      // TODO: API call
      message.success('Hero section saved successfully');
      setData({ ...data, ...values });
    } catch (error) {
      message.error('Failed to save');
    }
  };

  const handleAddFeature = () => {
    const newFeature: Feature = {
      id: Date.now(),
      icon: '⭐',
      title_vi: 'New highlight',
      description: 'Highlight description'
    };
    setData({ ...data, features: [...data.features, newFeature] });
  };

  const handleDeleteFeature = (id: number) => {
    setData({ ...data, features: data.features.filter(f => f.id !== id) });
  };

  const handleAddValue = () => {
    const newValue: Value = {
      id: Date.now(),
      title_vi: 'New value',
      description: 'Value description'
    };
    setData({ ...data, values: [...data.values, newValue] });
  };

  const handleDeleteValue = (id: number) => {
    setData({ ...data, values: data.values.filter(v => v.id !== id) });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home & About</h1>
          <p className="text-gray-600 mt-1">Manage home page and introduction</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Display Status</span>
          <Switch checked={data.is_displaying} onChange={(checked) => setData({ ...data, is_displaying: checked })} />
          <span className="text-sm font-semibold text-green-600">{data.is_displaying ? 'Visible' : 'Hidden'}</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Home className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Hero Section</h2>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveHero}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Title (VI)" name="hero_title_vi">
              <Input placeholder="Welcome to Coffee House" />
            </Form.Item>

            <Form.Item label="Title (EN)" name="hero_title_en">
              <Input placeholder="Welcome to Coffee House" />
            </Form.Item>
          </div>

          <Form.Item label="Description" name="hero_description">
            <TextArea rows={3} placeholder="Brief description about the cafe..." />
          </Form.Item>

          <Form.Item label="Background image URL" name="hero_image_url">
            <Input placeholder="https://..." />
          </Form.Item>

          {data.hero_image_url && (
            <div className="mb-4">
              <img src={data.hero_image_url} alt="Hero" className="w-full h-64 object-cover rounded-lg" />
            </div>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<Save className="w-4 h-4" />} loading={loading} className="bg-blue-600 hover:bg-blue-700">
              Save
            </Button>
          </Form.Item>
        </Form>
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Highlights</h2>
          </div>
          <Button type="primary" icon={<Plus className="w-4 h-4" />} onClick={handleAddFeature} className="bg-blue-600 hover:bg-blue-700">
            Add
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.features.map((feature) => (
            <div key={feature.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{feature.icon}</div>
                <Button type="text" danger icon={<Trash2 className="w-4 h-4" />} onClick={() => handleDeleteFeature(feature.id)} />
              </div>
              <Input className="mb-2" value={feature.title_vi} placeholder="Title (VI)" onChange={(e) => {
                const updated = data.features.map(f => f.id === feature.id ? { ...f, title_vi: e.target.value } : f);
                setData({ ...data, features: updated });
              }} />
              <TextArea rows={2} value={feature.description} placeholder="Description" onChange={(e) => {
                const updated = data.features.map(f => f.id === feature.id ? { ...f, description: e.target.value } : f);
                setData({ ...data, features: updated });
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Core Values</h2>
          </div>
          <Button type="primary" icon={<Plus className="w-4 h-4" />} onClick={handleAddValue} className="bg-blue-600 hover:bg-blue-700">
            Add
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.values.map((value) => (
            <div key={value.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-900">{value.title_vi}</h3>
                <Button type="text" danger icon={<Trash2 className="w-4 h-4" />} onClick={() => handleDeleteValue(value.id)} />
              </div>
              <Input className="mb-2" value={value.title_vi} placeholder="Title (VI)" onChange={(e) => {
                const updated = data.values.map(v => v.id === value.id ? { ...v, title_vi: e.target.value } : v);
                setData({ ...data, values: updated });
              }} />
              <TextArea rows={2} value={value.description} placeholder="Description" onChange={(e) => {
                const updated = data.values.map(v => v.id === value.id ? { ...v, description: e.target.value } : v);
                setData({ ...data, values: updated });
              }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CafeHomeAbout;
