import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, faInfoCircle, faLink, faBold, faItalic, faUnderline, faStrikethrough, 
  faListOl, faListUl, faIndent, faOutdent, faAlignLeft, faAlignCenter, faAlignRight, 
  faImage, faTable, faCode 
} from '@fortawesome/free-solid-svg-icons';

interface Post {
  id: number;
  title: string;
  excerpt: string;
  locale: string;
  localeName: string;
  flagClass: string;
  status: 'published' | 'draft';
  updatedAt: string;
  content?: string;
  vrLink?: string;
}

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onSave: (postData: any) => void;
}

const EditPostModal: React.FC<EditPostModalProps> = ({ isOpen, onClose, post, onSave }) => {
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  const [editorContent, setEditorContent] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  
  const [postForm, setPostForm] = useState({
    locale: '',
    title: '',
    slug: '',
    target: 'self',
    content: '',
    status: 'draft' as 'draft' | 'published',
    vrLink: ''
  });

  useEffect(() => {
    if (post) {
      setPostForm({
        locale: post.locale,
        title: post.title,
        slug: '',
        target: 'self',
        content: post.content || '',
        status: post.status,
        vrLink: post.vrLink || ''
      });
      setEditorContent(post.content || '');
      setHtmlContent(post.content || '');
    } else {
      setPostForm({
        locale: '',
        title: '',
        slug: '',
        target: 'self',
        content: '<p>Start writing your content here...</p>',
        status: 'draft',
        vrLink: ''
      });
      setEditorContent('<p>Start writing your content here...</p>');
      setHtmlContent('<p>Start writing your content here...</p>');
    }
    setEditorMode('visual');
  }, [post]);

  // Rich text editor functions
  const formatText = (command: string, value?: string) => {
    if (editorMode === 'html') return;
    document.execCommand(command, false, value);
    syncContentToHTML();
  };

  const formatHeading = (tag: string) => {
    if (editorMode === 'html' || !tag) return;
    if (tag === 'blockquote') {
      document.execCommand('formatBlock', false, '<blockquote>');
    } else {
      document.execCommand('formatBlock', false, `<${tag}>`);
    }
    syncContentToHTML();
  };

  const insertLink = () => {
    if (editorMode === 'html') return;
    const url = prompt('Enter the URL:');
    if (url) {
      document.execCommand('createLink', false, url);
      syncContentToHTML();
    }
  };

  const insertImage = () => {
    if (editorMode === 'html') return;
    const url = prompt('Enter the image URL:');
    if (url) {
      document.execCommand('insertImage', false, url);
      syncContentToHTML();
    }
  };

  const insertTable = () => {
    if (editorMode === 'html') return;
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    
    if (rows && cols) {
      let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
      for (let i = 0; i < parseInt(rows); i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < parseInt(cols); j++) {
          tableHTML += '<td style="padding: 8px; border: 1px solid #ddd;">Cell</td>';
        }
        tableHTML += '</tr>';
      }
      tableHTML += '</table>';
      
      document.execCommand('insertHTML', false, tableHTML);
      syncContentToHTML();
    }
  };

  const toggleEditorMode = () => {
    if (editorMode === 'visual') {
      setEditorMode('html');
      syncContentToHTML();
    } else {
      setEditorMode('visual');
      syncContentFromHTML();
    }
  };

  const syncContentToHTML = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setHtmlContent(content);
      setEditorContent(content);
    }
  };

  const syncContentFromHTML = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = htmlContent;
      setEditorContent(htmlContent);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = editorMode === 'html' ? htmlContent : editorContent;
    onSave({ ...postForm, content });
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
              <option value="vi">🇻🇳 Vietnamese</option>
              <option value="en">🇬🇧 English</option>
              <option value="fr">🇫🇷 French</option>
              <option value="jp">🇯🇵 Japanese</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug / External Link *</label>
            <input
              type="text"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              value={postForm.slug}
              onChange={(e) => setPostForm(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="e.g., swimming-pool or https://example.com/pool"
              required
            />
            <small className="text-slate-500 text-xs mt-1 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faLink} /> Enter a slug for internal page or a full URL for external link
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
            <div className="border border-slate-300 rounded-lg bg-white overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-300 p-2 flex gap-2 flex-wrap items-center">
                <div className="flex gap-1 items-center pr-2 border-r border-slate-300">
                  <button type="button" className="bg-white border border-slate-300 rounded p-1.5 cursor-pointer text-slate-500 text-xs transition-all w-8 h-8 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400" onClick={() => formatText('bold')} title="Bold">
                    <FontAwesomeIcon icon={faBold} />
                  </button>
                  <button type="button" className="bg-white border border-slate-300 rounded p-1.5 cursor-pointer text-slate-500 text-xs transition-all w-8 h-8 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400" onClick={() => formatText('italic')} title="Italic">
                    <FontAwesomeIcon icon={faItalic} />
                  </button>
                  <button type="button" className="bg-white border border-slate-300 rounded p-1.5 cursor-pointer text-slate-500 text-xs transition-all w-8 h-8 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400" onClick={() => formatText('underline')} title="Underline">
                    <FontAwesomeIcon icon={faUnderline} />
                  </button>
                  <button type="button" className="bg-white border border-slate-300 rounded p-1.5 cursor-pointer text-slate-500 text-xs transition-all w-8 h-8 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400" onClick={() => formatText('strikeThrough')} title="Strikethrough">
                    <FontAwesomeIcon icon={faStrikethrough} />
                  </button>
                </div>
                <div className="flex gap-1 items-center pr-2 border-r border-slate-300">
                  <button type="button" className="bg-white border border-slate-300 rounded p-1.5 cursor-pointer text-slate-500 text-xs transition-all w-8 h-8 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400" onClick={() => formatText('insertOrderedList')} title="Numbered List">
                    <FontAwesomeIcon icon={faListOl} />
                  </button>
                  <button type="button" className="bg-white border border-slate-300 rounded p-1.5 cursor-pointer text-slate-500 text-xs transition-all w-8 h-8 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400" onClick={() => formatText('insertUnorderedList')} title="Bullet List">
                    <FontAwesomeIcon icon={faListUl} />
                  </button>
                  <button type="button" className="bg-white border border-slate-300 rounded p-1.5 cursor-pointer text-slate-500 text-xs transition-all w-8 h-8 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400" onClick={() => formatText('indent')} title="Indent">
                    <FontAwesomeIcon icon={faIndent} />
                  </button>
                  <button type="button" className="bg-white border border-slate-300 rounded p-1.5 cursor-pointer text-slate-500 text-xs transition-all w-8 h-8 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400" onClick={() => formatText('outdent')} title="Outdent">
                    <FontAwesomeIcon icon={faOutdent} />
                  </button>
                </div>
                <div className="flex gap-1 items-center pr-2 border-r border-slate-300">
                  <button type="button" className="bg-white border border-slate-300 rounded p-1.5 cursor-pointer text-slate-500 text-xs transition-all w-8 h-8 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400" onClick={() => formatText('justifyLeft')} title="Align Left">
                    <FontAwesomeIcon icon={faAlignLeft} />
                  </button>
                  <button type="button" className="bg-white border border-slate-300 rounded p-1.5 cursor-pointer text-slate-500 text-xs transition-all w-8 h-8 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400" onClick={() => formatText('justifyCenter')} title="Align Center">
                    <FontAwesomeIcon icon={faAlignCenter} />
                  </button>
                  <button type="button" className="bg-white border border-slate-300 rounded p-1.5 cursor-pointer text-slate-500 text-xs transition-all w-8 h-8 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400" onClick={() => formatText('justifyRight')} title="Align Right">
                    <FontAwesomeIcon icon={faAlignRight} />
                  </button>
                </div>
                <div className="flex gap-1 items-center pr-2 border-r border-slate-300">
                  <button type="button" className="bg-white border border-slate-300 rounded p-1.5 cursor-pointer text-slate-500 text-xs transition-all w-8 h-8 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400" onClick={insertLink} title="Insert Link">
                    <FontAwesomeIcon icon={faLink} />
                  </button>
                  <button type="button" className="bg-white border border-slate-300 rounded p-1.5 cursor-pointer text-slate-500 text-xs transition-all w-8 h-8 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400" onClick={insertImage} title="Insert Image">
                    <FontAwesomeIcon icon={faImage} />
                  </button>
                  <button type="button" className="bg-white border border-slate-300 rounded p-1.5 cursor-pointer text-slate-500 text-xs transition-all w-8 h-8 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400" onClick={insertTable} title="Insert Table">
                    <FontAwesomeIcon icon={faTable} />
                  </button>
                </div>
                <div className="flex gap-1 items-center pr-2 border-r border-slate-300 last:border-r-0">
                  <select className="px-2 py-1 border border-slate-300 rounded text-xs bg-white text-slate-500 min-w-[100px] h-8" onChange={(e) => formatHeading(e.target.value)}>
                    <option value="">Normal Text</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="h4">Heading 4</option>
                    <option value="blockquote">Quote</option>
                  </select>
                </div>
                <div className="flex gap-1 items-center">
                  <button
                    type="button"
                    className={`bg-white border border-slate-300 rounded p-1.5 cursor-pointer text-slate-500 text-xs transition-all h-8 flex items-center justify-center gap-1.5 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400 ${editorMode === 'html' ? 'bg-blue-600 text-white border-blue-600' : ''}`}
                    onClick={toggleEditorMode}
                    title="Toggle HTML/Visual"
                  >
                    <FontAwesomeIcon icon={faCode} />
                    {editorMode === 'html' ? 'Visual' : 'HTML'}
                  </button>
                </div>
              </div>
              
              {editorMode === 'visual' ? (
                <div
                  ref={editorRef}
                  className="prose max-w-none min-h-[250px] p-4 outline-none text-sm leading-relaxed text-gray-800"
                  contentEditable
                  dangerouslySetInnerHTML={{ __html: editorContent }}
                  onInput={syncContentToHTML}
                />
              ) : (
                <textarea
                  className="font-mono text-sm leading-normal bg-slate-50 border-none outline-none resize-y min-h-[250px] p-4 w-full box-border"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  required
                />
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              value={postForm.status}
              onChange={(e) => setPostForm(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
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