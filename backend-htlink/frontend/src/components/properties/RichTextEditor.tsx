// src/components/properties/RichTextEditor.tsx
import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBold, faItalic, faUnderline, faStrikethrough, faListUl, faListOl, 
  faLink, faImage, faCode, faQuoteRight 
} from '@fortawesome/free-solid-svg-icons';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start typing...'
}) => {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  };

  const insertLink = () => {
    const url = prompt('Enter the URL:');
    if (url) formatText('createLink', url);
  };

  const insertImage = () => {
    const url = prompt('Enter the image URL:');
    if (url) formatText('insertImage', url);
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const toolbarButtons = [
    { icon: faBold, command: 'bold', title: 'Bold' },
    { icon: faItalic, command: 'italic', title: 'Italic' },
    { icon: faUnderline, command: 'underline', title: 'Underline' },
    { icon: faStrikethrough, command: 'strikethrough', title: 'Strikethrough' },
  ];

  const listButtons = [
    { icon: faListUl, command: 'insertUnorderedList', title: 'Unordered List' },
    { icon: faListOl, command: 'insertOrderedList', title: 'Ordered List' },
    { icon: faQuoteRight, command: 'formatBlock', value: 'blockquote', title: 'Blockquote' },
  ];

  const mediaButtons = [
    { icon: faLink, action: insertLink, title: 'Insert Link' },
    { icon: faImage, action: insertImage, title: 'Insert Image' },
  ];

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <select 
            onChange={(e) => formatText('formatBlock', e.target.value)}
            className="px-2 py-1.5 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="div">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
        </div>
        <div className="flex items-center gap-1 p-1 border-l border-r border-slate-200">
          {toolbarButtons.map(btn => (
            <button key={btn.command} type="button" onClick={() => formatText(btn.command)} title={btn.title} className="w-8 h-8 text-slate-600 hover:bg-slate-200 rounded-md">
              <FontAwesomeIcon icon={btn.icon} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 p-1 border-r border-slate-200">
          {listButtons.map(btn => (
            <button key={btn.command} type="button" onClick={() => formatText(btn.command, btn.value)} title={btn.title} className="w-8 h-8 text-slate-600 hover:bg-slate-200 rounded-md">
              <FontAwesomeIcon icon={btn.icon} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 p-1">
          {mediaButtons.map(btn => (
            <button key={btn.title} type="button" onClick={btn.action} title={btn.title} className="w-8 h-8 text-slate-600 hover:bg-slate-200 rounded-md">
              <FontAwesomeIcon icon={btn.icon} />
            </button>
          ))}
        </div>
        <div className="flex-grow" />
        <button type="button" onClick={() => setIsHtmlMode(!isHtmlMode)} title="Toggle HTML Mode" className={`w-8 h-8 text-slate-600 hover:bg-slate-200 rounded-md ${isHtmlMode ? 'bg-blue-100 text-blue-600' : ''}`}>
          <FontAwesomeIcon icon={faCode} />
        </button>
      </div>

      {isHtmlMode ? (
        <textarea
          value={content}
          onChange={handleHtmlChange}
          className="w-full h-64 p-4 font-mono text-sm bg-slate-900 text-green-400 outline-none resize-y"
          placeholder={placeholder}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          className="min-h-[250px] p-4 outline-none text-sm leading-relaxed text-slate-800 prose max-w-none"
          data-placeholder={placeholder}
        />
      )}
    </div>
  );
};