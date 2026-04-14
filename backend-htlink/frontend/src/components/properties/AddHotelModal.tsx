// src/components/properties/AddHotelModal.tsx
import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { IconSelector } from './IconSelector';
import { ColorSelector } from './ColorSelector';
import type { Hotel, HotelFormData } from '../../types/properties';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { getApiBaseUrl } from '../../utils/api';

interface AddHotelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: HotelFormData) => Promise<void>;
  hotel?: Hotel | null;
  isEditing?: boolean;
}

export const AddHotelModal: React.FC<AddHotelModalProps> = ({
  isOpen,
  onClose,
  onSave,
  hotel,
  isEditing = false
}) => {
  const quillRef = React.useRef<any>(null);
  const [formData, setFormData] = useState<HotelFormData>({
    name: hotel?.name || '',
    phone: hotel?.phone || '',
    email: hotel?.email || '',
    address: hotel?.address || '',
    vrLink: hotel?.vrLink || '',
    description: hotel?.description || '<p>Enter a description for the new hotel here.</p>',
    status: hotel?.status || 'active',
    icon: hotel?.icon || 'fa-building',
    color: hotel?.color || 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
  });
  const [loading, setLoading] = useState(false);

  // Image upload handler for Quill
  const imageHandler = React.useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const tenantCode = localStorage.getItem('tenant_code') || '';
        const token = localStorage.getItem('access_token') || '';
        
        const response = await fetch(`${getApiBaseUrl()}/media/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-Code': tenantCode
          },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Image uploaded successfully:', data);
          
          const imageUrl = data.url || data.file_path || data.public_url || data.path;
          console.log('📷 Image URL to insert:', imageUrl);
          
          if (!imageUrl) {
            console.error('❌ No URL found in response:', data);
            alert('Image uploaded but URL not found in response');
            return;
          }
          
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            const index = range?.index || 0;
            quill.insertEmbed(index, 'image', imageUrl);
            quill.setSelection(index + 1);
            console.log('✅ Image inserted at position:', index);
          } else {
            console.error('❌ Quill editor not found');
          }
        } else {
          const errorText = await response.text();
          console.error('❌ Upload failed:', response.status, errorText);
          alert(`Failed to upload image: ${response.status}`);
        }
      } catch (error) {
        console.error('Image upload error:', error);
        alert('Error uploading image');
      }
    };
  }, []);

  // Quill editor configuration
  const quillModules = React.useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
  }), [imageHandler]);

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'link', 'image'
  ];

  // Update form data when hotel prop changes (for editing)
  useEffect(() => {
    if (hotel && isEditing) {
      setFormData({
        name: hotel.name || '',
        phone: hotel.phone || '',
        email: hotel.email || '',
        address: hotel.address || '',
        vrLink: hotel.vrLink || '',
        description: hotel.description || '<p>Enter a description for the new hotel here.</p>',
        status: hotel.status || 'active',
        icon: hotel.icon || 'fa-building',
        color: hotel.color || 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
      });
    } else if (!isEditing) {
      // Reset form for new hotel
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        vrLink: '',
        description: '<p>Enter a description for the new hotel here.</p>',
        status: 'active',
        icon: 'fa-building',
        color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
      });
    }
  }, [hotel, isEditing]);

  const handleInputChange = (field: keyof HotelFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      alert('Please fill in Name, Phone, and Address fields.');
      return;
    }
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
      // Reset form after successful save
      setFormData({
        name: '', phone: '', email: '', address: '', vrLink: '',
        description: '<p>Enter a description for the new hotel here.</p>',
        status: 'active', icon: 'fa-building', color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
      });
    } catch (error) {
      console.error('Error saving hotel:', error);
      alert('Error saving hotel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[200] p-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        <header className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">
            {isEditing ? 'Edit Hotel' : 'Add New Hotel'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200">
            <FontAwesomeIcon icon={faTimes} className="text-slate-600" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow overflow-y-auto p-6 grid grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="col-span-2 space-y-5">
              <div>
                <label htmlFor="name" className="font-semibold text-slate-700 mb-1.5 block">Hotel Name</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Hotel Name"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="font-semibold text-slate-700 mb-1.5 block">Phone</label>
                  <input id="phone" type="text" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="+84 123 456 789" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                </div>
                <div>
                  <label htmlFor="email" className="font-semibold text-slate-700 mb-1.5 block">Email</label>
                  <input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="contact@hotel.com" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label htmlFor="address" className="font-semibold text-slate-700 mb-1.5 block">Address</label>
                <input id="address" type="text" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder="123 Main St, City" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" />
              </div>
              <div>
                <label className="font-semibold text-slate-700 mb-1.5 block">Description</label>
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={formData.description || ''}
                    onChange={(content: string) => handleInputChange('description', content)}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Enter hotel description..."
                    style={{ minHeight: '200px' }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  💡 Click the image icon to upload images. They will be saved on the server.
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-1 space-y-5">
              <div>
                <label className="font-semibold text-slate-700 mb-1.5 block">Status</label>
                <select value={formData.status} onChange={(e) => handleInputChange('status', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label htmlFor="vrLink" className="font-semibold text-slate-700 mb-1.5 block">VR Link</label>
                <input id="vrLink" type="text" value={formData.vrLink} onChange={(e) => handleInputChange('vrLink', e.target.value)} placeholder="https://example.com/vr-tour" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" />
              </div>
              <div>
                <label className="font-semibold text-slate-700 mb-1.5 block">Icon</label>
                <IconSelector selectedIcon={formData.icon} onSelect={(icon) => handleInputChange('icon', icon)} />
              </div>
              <div>
                <label className="font-semibold text-slate-700 mb-1.5 block">Color</label>
                <ColorSelector selectedColor={formData.color} onSelect={(color) => handleInputChange('color', color)} />
              </div>
            </div>
          </div>

          <footer className="p-5 border-t border-slate-200 flex justify-end items-center bg-white rounded-b-2xl">
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-semibold text-sm text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg font-semibold text-sm text-white bg-blue-600 flex items-center gap-2 hover:bg-blue-700 disabled:bg-blue-400"
              >
                <FontAwesomeIcon icon={loading ? faSpinner : faSave} spin={loading} />
                {loading ? 'Saving...' : (isEditing ? 'Update Hotel' : 'Save Hotel')}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};