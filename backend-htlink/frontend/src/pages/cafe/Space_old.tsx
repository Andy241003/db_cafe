import { Button, Form, Input, message, Tag, Upload } from 'antd';
import { Grid3x3, Plus, Save, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface Space {
  id: number;
  name: string;
  description: string;
  image_url?: string;
  amenities: string[];
  display_order: number;
}

interface SpaceData {
  banner_image_url?: string;
  spaces: Space[];
}

const CafeSpace: React.FC = () => {
  const [bannerForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SpaceData>({
    spaces: []
  });
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [spaceForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockData: SpaceData = {
        banner_image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200',
        spaces: [
          {
            id: 1,
            name: 'Indoor Area',
            description: 'Air-conditioned space, perfect for working and studying.',
            image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
            amenities: ['A/C', 'WiFi', 'Power outlets'],
            display_order: 1
          },
          {
            id: 2,
            name: 'Garden',
            description: 'Outdoor green space, surrounded by natural plants.',
            image_url: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=400',
            amenities: ['Fresh air', 'Great view', 'Pet friendly'],
            display_order: 2
          },
          {
            id: 3,
            name: 'Mezzanine',
            description: 'Private and quiet space, suitable for group meetings and focused work.',
            image_url: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=400',
            amenities: ['Quiet', 'Private', 'TV'],
            display_order: 3
          }
        ]
      };
      
      setData(mockData);
      bannerForm.setFieldsValue({ banner_image_url: mockData.banner_image_url });
    } catch (error) {
      message.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBanner = async (values: { banner_image_url: string }) => {
    try {
      // TODO: API call
      setData({ ...data, banner_image_url: values.banner_image_url });
      message.success('Banner image saved successfully');
    } catch (error) {
      message.error('Failed to save banner image');
    }
  };

  const handleAddSpace = () => {
    const newSpace: Space = {
      id: Date.now(),
      name: 'New space',
      description: 'Space description',
      amenities: [],
      display_order: data.spaces.length + 1
    };
    setEditingSpace(newSpace);
    spaceForm.setFieldsValue(newSpace);
  };

  const handleEditSpace = (space: Space) => {
    setEditingSpace(space);
    spaceForm.setFieldsValue(space);
  };

  const handleSaveSpace = async (values: any) => {
    try {
      if (editingSpace) {
        const isNew = !data.spaces.find(s => s.id === editingSpace.id);
        if (isNew) {
          setData({ ...data, spaces: [...data.spaces, { ...editingSpace, ...values }] });
        } else {
          setData({
            ...data,
            spaces: data.spaces.map(s => s.id === editingSpace.id ? { ...s, ...values } : s)
          });
        }
        message.success('Space saved successfully');
        setEditingSpace(null);
        spaceForm.resetFields();
      }
    } catch (error) {
      message.error('Failed to save space');
    }
  };

  const handleDeleteSpace = (id: number) => {
    setData({ ...data, spaces: data.spaces.filter(s => s.id !== id) });
    message.success('Space deleted successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Space Management</h1>
          <p className="text-gray-600 mt-1">Showcase different areas in your restaurant</p>
        </div>
        <Button type="primary" icon={<Plus className="w-4 h-4" />} onClick={handleAddSpace} className="bg-blue-600 hover:bg-blue-700">
          Add Space
        </Button>
      </div>

      {/* Banner Image */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Grid3x3 className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Panoramic Image</h2>
        </div>

        <Form
          form={bannerForm}
          layout="vertical"
          onFinish={handleSaveBanner}
        >
          <Form.Item label="Banner Image URL" name="banner_image_url">
            <Input placeholder="https://..." />
          </Form.Item>

          {data.banner_image_url && (
            <div className="mb-4">
              <img src={data.banner_image_url} alt="Banner" className="w-full h-80 object-cover rounded-lg" />
            </div>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<Save className="w-4 h-4" />} className="bg-blue-600 hover:bg-blue-700">
              Save
            </Button>
          </Form.Item>
        </Form>
      </div>

      {/* Spaces List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Space List</h2>
        <p className="text-sm text-gray-600 mb-4">Drag and drop items to change display order. Items on top will be displayed first.</p>

        <div className="space-y-4">
          {data.spaces.sort((a, b) => a.display_order - b.display_order).map((space, index) => (
            <div key={space.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  #{index + 1}
                </div>
                
                {space.image_url && (
                  <img src={space.image_url} alt={space.name} className="w-32 h-32 object-cover rounded-lg flex-shrink-0" />
                )}

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{space.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{space.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {space.amenities.map((amenity, idx) => (
                      <Tag key={idx} color="blue">{amenity}</Tag>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="text" icon={<Grid3x3 className="w-4 h-4" />} onClick={() => handleEditSpace(space)}>
                    Edit
                  </Button>
                  <Button type="text" danger icon={<Trash2 className="w-4 h-4" />} onClick={() => handleDeleteSpace(space.id)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Space Form */}
      {editingSpace && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {data.spaces.find(s => s.id === editingSpace.id) ? 'Edit Space' : 'Add New Space'}
          </h2>

          <Form
            form={spaceForm}
            layout="vertical"
            onFinish={handleSaveSpace}
          >
            <Form.Item label="Space name" name="name" rules={[{ required: true }]}>
              <Input placeholder="e.g., Indoor Area" />
            </Form.Item>

            <Form.Item label="Description" name="description">
              <TextArea rows={3} placeholder="Space description..." />
            </Form.Item>

            <Form.Item label="Image URL" name="image_url">
              <Input placeholder="https://..." />
            </Form.Item>

            <Form.Item label="Amenities (comma separated)" name="amenities">
              <Input placeholder="e.g., A/C, WiFi, Power outlets" onChange={(e) => {
                const amenities = e.target.value.split(',').map(a => a.trim()).filter(a => a);
                spaceForm.setFieldValue('amenities', amenities);
              }} />
            </Form.Item>

            <Form.Item label="Display order" name="display_order">
              <Input type="number" />
            </Form.Item>

            <div className="flex gap-3">
              <Button type="primary" htmlType="submit" icon={<Save className="w-4 h-4" />} className="bg-blue-600 hover:bg-blue-700">
                Save
              </Button>
              <Button onClick={() => { setEditingSpace(null); spaceForm.resetFields(); }}>
                Cancel
              </Button>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
};

export default CafeSpace;


