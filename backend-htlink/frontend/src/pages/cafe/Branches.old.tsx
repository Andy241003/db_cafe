import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  faEdit,
  faEye,
  faFlag,
  faGripVertical,
  faImage,
  faInfoCircle,
  faLink,
  faMapMarkerAlt,
  faPhone,
  faPlus,
  faSave,
  faTimes,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import MediaPickerModal from '../../components/MediaPickerModal';
import { mediaApi } from '../../services/mediaApi';
import { cafeBranchesApi, type Branch, type BranchCreate, type BranchUpdate } from '../../services/cafeApi';

const CafeBranches: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/cafe/branches');
      // const data = await response.json();
      
      // Mock data
      const mockBranches: Branch[] = [
        {
          id: 1,
          name: 'DB Cafe - Downtown',
          address: '123 Main Street, District 1, Ho Chi Minh City',
          phone: '+84 28 1234 5678',
          email: 'downtown@dbcafe.vn',
          opening_hours: 'Mon-Fri: 7:00-22:00, Sat-Sun: 8:00-23:00',
          is_displaying: true,
          display_order: 1,
          vr360_link: 'https://example.com/vr/downtown'
        },
        {
          id: 2,
          name: 'DB Cafe - Uptown',
          address: '456 Park Avenue, District 3, Ho Chi Minh City',
          phone: '+84 28 8765 4321',
          email: 'uptown@dbcafe.vn',
          opening_hours: 'Daily: 7:00-22:00',
          is_displaying: true,
          display_order: 2
        },
        {
          id: 3,
          name: 'DB Cafe - Beach Side',
          address: '789 Beachfront Road, Vung Tau',
          phone: '+84 254 3333 4444',
          email: 'beach@dbcafe.vn',
          opening_hours: 'Daily: 6:00-24:00',
          is_displaying: false,
          display_order: 3
        },
      ];
      
      setBranches(mockBranches);
    } catch (error) {
      message.error('Failed to load branches');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingBranch(null);
    form.resetFields();
    form.setFieldsValue({ is_displaying: true, display_order: branches.length + 1 });
    setModalVisible(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    form.setFieldsValue(branch);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Delete Branch',
      content: 'Are you sure you want to delete this branch?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          // TODO: API call
          // await fetch(`/api/v1/cafe/branches/${id}`, { method: 'DELETE' });
          message.success('Branch deleted successfully');
          loadBranches();
        } catch (error) {
          message.error('Failed to delete branch');
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingBranch) {
        // TODO: API call
        message.success('Branch updated successfully');
      } else {
        // TODO: API call
        message.success('Branch created successfully');
      }
      setModalVisible(false);
      loadBranches();
    } catch (error) {
      message.error('Failed to save branch');
    }
  };

  const columns: ColumnsType<Branch> = [
    {
      title: 'Branch Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="font-semibold">{text}</span>
        </div>
      ),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div className="text-sm">
          {record.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>{record.phone}</span>
            </div>
          )}
          {record.email && <div className="text-gray-600">{record.email}</div>}
        </div>
      ),
    },
    {
      title: 'Opening Hours',
      dataIndex: 'opening_hours',
      key: 'opening_hours',
      ellipsis: true,
    },
    {
      title: 'VR360',
      dataIndex: 'vr360_link',
      key: 'vr360_link',
      render: (link) => link ? <Tag color="blue">Available</Tag> : <Tag>No VR</Tag>,
    },
    {
      title: 'Order',
      dataIndex: 'display_order',
      key: 'display_order',
      width: 80,
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
      width: 120,
      render: (_, record) => (
        <div className="flex gap-2">
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branch Management</h1>
          <p className="text-gray-600 mt-1">Manage your cafe locations</p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Add Branch
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <Table
          columns={columns}
          dataSource={branches}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>

      {/* Modal */}
      <Modal
        title={editingBranch ? 'Edit Branch' : 'Add Branch'}
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
            label="Branch Name"
            name="name"
            rules={[{ required: true, message: 'Please enter branch name' }]}
          >
            <Input placeholder="e.g., DB Cafe - Downtown" />
          </Form.Item>

          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: 'Please enter address' }]}
          >
            <TextArea rows={2} placeholder="Full address of the branch" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Phone Number" name="phone">
              <Input placeholder="+84 28 1234 5678" />
            </Form.Item>

            <Form.Item label="Email" name="email">
              <Input type="email" placeholder="branch@dbcafe.vn" />
            </Form.Item>
          </div>

          <Form.Item label="Opening Hours" name="opening_hours">
            <TextArea rows={2} placeholder="e.g., Mon-Fri: 7:00-22:00" />
          </Form.Item>

          <Form.Item label="VR360 Tour Link" name="vr360_link">
            <Input placeholder="https://..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Display Order" name="display_order">
              <Input type="number" />
            </Form.Item>

            <Form.Item label="Show on Website" name="is_displaying" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CafeBranches;
