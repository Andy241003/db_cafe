// src/components/properties/EditHotelPostModal.tsx
import React, { useState, useEffect } from 'react';
import { RichTextEditor } from './RichTextEditor';
import type { HotelPost } from '../../types/properties';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faSpinner, faImage } from '@fortawesome/free-solid-svg-icons';

interface EditHotelPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: HotelPost | null;
  onSave: (data: any) => Promise<void>;
}

export const EditHotelPostModal: React.FC<EditHotelPostModalProps> = ({
  isOpen,
  onClose,
  post,
  onSave
}) => {
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    phone: '',
    vrLink: '',
    content: '',
    status: 'draft' as 'draft' | 'published'
  });
  const [bannerPreviews, setBannerPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        address: post.address || '',
        phone: post.phone || '',
        vrLink: post.vrLink || '',
        content: post.content,
        status: post.status
      });
    } else {
      setFormData({
        title: '',
        address: '',
        phone: '',
        vrLink: '',
        content: '<p>Start writing your amazing hotel post here...</p>',
        status: 'draft'
      });
    }
    setBannerPreviews([]);
  }, [post, isOpen]);

  const handleInputChange = (field: string, value: string) => {
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
    if (!formData.title || !formData.content) {
      alert('Please fill in the title and content');
      return;
    }
    setLoading(true);
    await onSave(formData);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[200] p-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        <header className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">{post ? 'Edit Hotel Post' : 'Create New Hotel Post'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200">
            <FontAwesomeIcon icon={faTimes} className="text-slate-600" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow overflow-y-auto p-6 grid grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="col-span-2 space-y-5">
              <div>
                <label htmlFor="title" className="font-semibold text-slate-700 mb-1.5 block">Post Title</label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Grand Opening Special Offer"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 mb-1.5 block">Content</label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => handleInputChange('content', content)}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-1 space-y-5">
              <div>
                <label className="font-semibold text-slate-700 mb-1.5 block">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div>
                <label htmlFor="address" className="font-semibold text-slate-700 mb-1.5 block">Address</label>
                <input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Hotel address"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="phone" className="font-semibold text-slate-700 mb-1.5 block">Phone</label>
                <input
                  id="phone"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Contact phone number"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="vrLink" className="font-semibold text-slate-700 mb-1.5 block">VR Link</label>
                <input
                  id="vrLink"
                  type="text"
                  value={formData.vrLink}
                  onChange={(e) => handleInputChange('vrLink', e.target.value)}
                  placeholder="https://example.com/vr-tour"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 mb-1.5 block">Banners</label>
                <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-center">
                  <FontAwesomeIcon icon={faImage} className="text-3xl text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500 mb-2">Drag & drop images here or click to upload.</p>
                  <input type="file" id="banner-upload" multiple onChange={handleBannerChange} className="hidden" />
                  <label htmlFor="banner-upload" className="cursor-pointer text-blue-600 font-semibold text-sm hover:underline">
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
                {loading ? 'Saving...' : 'Save Post'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};