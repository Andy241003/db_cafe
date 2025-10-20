import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import type { UIPost } from '../../services/api';
import { localesApi, type Locale } from '../../services/localesApi';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: UIPost | null;
  onSave: (postData: any) => void;
}

const EditPostModal: React.FC<EditPostModalProps> = ({ isOpen, onClose, post, onSave }) => {
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [postForm, setPostForm] = useState({
    locale: 'en',
    title: '',
    slug: '',
    target: 'self',
    content: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    vrLink: ''
  });

  // Load available locales from API
  useEffect(() => {
    const loadLocales = async () => {
      try {
        const locales = await localesApi.getLocales();
        setAvailableLocales(locales);
      } catch (error) {
        console.error('Failed to load locales:', error);
        // Fallback
        setAvailableLocales([
          { code: 'en', name: 'English' },
          { code: 'vi', name: 'Vietnamese' }
        ]);
      }
    };
    if (isOpen) {
      loadLocales();
    }
  }, [isOpen]);

  useEffect(() => {
    if (post) {
      const formData = {
        locale: post.locale || 'en',
        title: post.title || '',
        slug: post.slug || '',
        target: 'self',
        content: post.content || 'Start writing your content here...',
        status: (post.status as 'draft' | 'published' | 'archived') || 'draft',
        vrLink: post.vr360_url || (post as any).vrLink || ''
      };

      setPostForm(formData);
    } else {
      setPostForm({
        locale: 'en',
        title: '',
        slug: '',
        target: 'self',
        content: 'Start writing your content here...',
        status: 'draft',
        vrLink: ''
      });
    }
  }, [post]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== SUBMITTING POST ===');
    console.log('Post form data:', postForm);
    onSave(postForm);
  };

  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center" onClick={handleModalClick}>
      <div className="bg-white rounded-xl p-6 w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-semibold text-slate-900">
            {post?.id ? `Edit Post #${post.id}` : 'Add New Post'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
            <select
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white"
              value={postForm.locale}
              onChange={(e) => setPostForm(prev => ({ ...prev, locale: e.target.value }))}
              required
            >
              <option value="">Select language...</option>
              {availableLocales.map((locale) => (
                <option key={locale.code} value={locale.code}>
                  {locale.code.toUpperCase()} - {locale.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Post Title</label>
            <input
              type="text"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              value={postForm.title}
              onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
              required
              placeholder="Enter post title..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">VR360 Tour Link</label>
            <input
              type="url"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              value={postForm.vrLink}
              onChange={(e) => setPostForm(prev => ({ ...prev, vrLink: e.target.value }))}
              placeholder="https://example.com/vr-tour"
            />
            <small className="text-slate-500 text-xs mt-1 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faInfoCircle} /> Optional: Link to virtual reality tour of the hotel
            </small>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug (URL-friendly identifier)</label>
            <input
              type="text"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
              value={postForm.slug}
              readOnly
              disabled
            />
            <small className="text-slate-500 text-xs mt-1 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faInfoCircle} /> Inherited from feature - cannot be changed
            </small>
          </div>

        

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
            <textarea
              className="w-full min-h-[250px] p-4 border border-slate-300 rounded-lg text-sm resize-y transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              value={postForm.content}
              onChange={(e) => setPostForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your content here... You can use HTML tags like <p>, <h1>, <h2>, <strong>, <em>, etc."
              required
            />
            <small className="text-slate-500 text-xs mt-1">
              You can use HTML formatting in your content.
            </small>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              value={postForm.status}
              onChange={(e) => setPostForm(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'archived' }))}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end mt-6 pt-5 border-t border-slate-200">
            <button type="button" className="bg-slate-50 text-gray-700 border border-slate-300 px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-slate-100" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="bg-green-600 text-white border-none px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors hover:bg-green-700">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;