import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import type { UIPost } from '../../services/api';
import { localesApi, type Locale } from '../../services/localesApi';
import { usePropertySettings } from '../../hooks/usePropertySettings';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: UIPost | null;
  onSave: (postData: any) => void;
}

const EditPostModal: React.FC<EditPostModalProps> = ({ isOpen, onClose, post, onSave }) => {
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const { settings: propertySettings } = usePropertySettings();
  const quillRef = React.useRef<any>(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  const [postForm, setPostForm] = useState({
    locale: '',
    title: '',
    slug: '',
    target: 'self',
    content: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    vrLink: ''
  });

  // Image upload handler for Quill
  const imageHandler = React.useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Upload to server
      const formData = new FormData();
      formData.append('file', file);

      try {
        const tenantCode = localStorage.getItem('tenant_code') || '';
        const token = localStorage.getItem('access_token') || '';
        
        const response = await fetch('/api/v1/media/upload', {
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
          
          // Insert image into editor
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

  // Quill editor configuration with custom image handler
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

  // Load available locales from API
  useEffect(() => {
    const loadLocales = async () => {
      try {
        const locales = await localesApi.getLocales();
        setAvailableLocales(locales);
        console.log('Loaded locales for post modal:', locales);
      } catch (error) {
        console.error('Failed to load locales:', error);
        // Fallback to default locales
        setAvailableLocales([
          { code: 'en', name: 'English' },
          { code: 'vi', name: 'Vietnamese' },
          { code: 'ja', name: 'Japanese' }
        ]);
      }
    };
    if (isOpen) {
      loadLocales();
    }
  }, [isOpen]);

  useEffect(() => {
    console.log('=== EditPostModal useEffect ===');
    console.log('Post prop:', post);

    if (post) {
      console.log('Setting up form with post data:');
      console.log('- Title:', post.title);
      console.log('- Content:', post.content);
      console.log('- Slug:', post.slug);
      console.log('- VR360 URL:', post.vr360_url);

      setPostForm({
        locale: post.locale || 'en',
        title: post.title || '',
        slug: post.slug || '',
        target: 'self',
        content: post.content || 'No content available. Start writing here...',
        status: (post.status as 'draft' | 'published' | 'archived') || 'draft',
        vrLink: post.vr360_url || post.vrLink || ''
      });

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
            {post ? `Edit Post #${post.id}` : 'Add New Post'}
          </h3>
          <button className="bg-transparent border-none text-slate-500 cursor-pointer p-1 rounded hover:bg-slate-100 hover:text-slate-900" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
            <select
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              value={postForm.locale}
              onChange={(e) => setPostForm(prev => ({ ...prev, locale: e.target.value }))}
              required
            >
              <option value="">Select language...</option>
              {availableLocales
                .filter(locale => propertySettings.supportedLanguages.includes(locale.code))
                .map((locale) => (
                  <option key={locale.code} value={locale.code}>
                    {locale.code.toUpperCase()} - {locale.name}
                  </option>
                ))
              }
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Post Title</label>
            <input
              type="text"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              value={postForm.title}
              onChange={(e) => {
                const newTitle = e.target.value;
                // Don't auto-generate slug anymore - it comes from feature
                setPostForm(prev => ({ ...prev, title: newTitle }));
              }}
              required
            />
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Open Link In</label>
            <div className="flex gap-5 mt-1.5">
              <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                <input
                  type="radio"
                  name="target"
                  value="self"
                  checked={postForm.target === 'self'}
                  onChange={(e) => setPostForm(prev => ({ ...prev, target: e.target.value }))}
                  className="accent-blue-600 w-4 h-4"
                />
                <span>Current Page</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                <input
                  type="radio"
                  name="target"
                  value="blank"
                  checked={postForm.target === 'blank'}
                  onChange={(e) => setPostForm(prev => ({ ...prev, target: e.target.value }))}
                  className="accent-blue-600 w-4 h-4"
                />
                <span>New Tab</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Content</label>
              <button
                type="button"
                onClick={() => setIsHtmlMode(!isHtmlMode)}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
              >
                {isHtmlMode ? '👁️ Visual' : '</> HTML'}
              </button>
            </div>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              {isHtmlMode ? (
                <textarea
                  className="w-full px-3 py-2 font-mono text-xs min-h-[200px] focus:outline-none"
                  value={postForm.content}
                  onChange={(e) => setPostForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="<p>Write HTML here...</p>"
                />
              ) : (
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={postForm.content}
                  onChange={(value) => setPostForm(prev => ({ ...prev, content: value }))}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Write your content here..."
                  style={{ minHeight: '200px' }}
                />
              )}
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              💡 Click the image icon to upload images. They will be saved on the server. Toggle HTML mode to edit raw HTML.
            </p>
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