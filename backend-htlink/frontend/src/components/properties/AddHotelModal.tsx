// src/components/properties/AddHotelModal.tsx
import React, { useState } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { IconSelector } from './IconSelector';
import { ColorSelector } from './ColorSelector';
import type { HotelFormData } from '../../types/properties';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faSpinner, faImage } from '@fortawesome/free-solid-svg-icons';

interface AddHotelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: HotelFormData) => Promise<void>;
}

export const AddHotelModal: React.FC<AddHotelModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<HotelFormData>({
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
  const [bannerPreviews, setBannerPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof HotelFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const previews = Array.from(files).map(file => URL.createObjectURL(file));
      setBannerPreviews(previews);
    }
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
      setBannerPreviews([]);
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
          <h2 className="text-lg font-bold text-slate-800">Add New Hotel</h2>
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
                  placeholder="e.g., Tabi Tower Hotel"
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
                <RichTextEditor
                  content={formData.description || ''}
                  onChange={(content) => handleInputChange('description', content)}
                />
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
              <div>
                <label className="font-semibold text-slate-700 mb-1.5 block">Banners</label>
                <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-center">
                  <FontAwesomeIcon icon={faImage} className="text-3xl text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500 mb-2">Drag & drop images here or click to upload.</p>
                  <input type="file" id="banner-upload-add" multiple onChange={handleBannerChange} className="hidden" />
                  <label htmlFor="banner-upload-add" className="cursor-pointer text-blue-600 font-semibold text-sm hover:underline">
                    Browse files
                  </label>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {bannerPreviews.map((src, index) => (
                    <img key={index} src={src} alt={`Preview ${index}`} className="w-full h-20 object-cover rounded-md" />
                  ))}
                </div>
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
                {loading ? 'Saving...' : 'Save Hotel'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};