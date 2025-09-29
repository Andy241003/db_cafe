// src/components/properties/HotelItem.tsx
import React from 'react';
import type { Hotel, HotelPost } from '../../types/properties';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMapMarkerAlt, faFileAlt, faVrCardboard, faChevronDown, faPlus, 
  faFileMedical, faEdit, faLanguage, faTrash, faBuilding, faCrown 
} from '@fortawesome/free-solid-svg-icons';

interface HotelItemProps {
  hotel: Hotel;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddPost: () => void;
  onEditPost: (post: HotelPost) => void;
  onTranslatePost: (post: HotelPost) => void;
  onDeletePost: (postId: number) => void;
}

export const HotelItem: React.FC<HotelItemProps> = ({
  hotel,
  isExpanded,
  onToggleExpand,
  onAddPost,
  onEditPost,
  onTranslatePost,
  onDeletePost
}) => {
  const getLocaleFlag = (locale: string) => {
    switch (locale) {
      case 'en': return '🇬🇧';
      case 'vi': return '🇻🇳';
      case 'ja': return '🇯🇵';
      default: return '🇬🇧';
    }
  };

  const getHotelIcon = (icon: string) => {
    switch(icon) {
      case 'fa-building': return faBuilding;
      case 'fa-crown': return faCrown;
      default: return faBuilding;
    }
  }

  const statusClass = hotel.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  const statusText = hotel.status === 'active' ? 'Active' : 'Inactive';

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <div 
        className="flex items-center p-4 cursor-pointer hover:bg-slate-50 transition-colors" 
        onClick={onToggleExpand}
      >
        <div className="flex items-center flex-grow gap-4">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white" 
            style={{ background: hotel.color }}
          >
            <FontAwesomeIcon icon={getHotelIcon(hotel.icon)} size="lg" />
          </div>
          <div className="flex-grow">
            <h3 className="font-bold text-slate-800 text-base">{hotel.name}</h3>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
              <div className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                <span>{hotel.address}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faFileAlt} />
                <span>{hotel.posts.length} posts</span>
              </div>
              {hotel.vrLink && (
                <a href={hotel.vrLink} className="flex items-center gap-1.5 text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <FontAwesomeIcon icon={faVrCardboard} />
                  VR Tour
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}>{statusText}</span>
          <FontAwesomeIcon 
            icon={faChevronDown} 
            className={`text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}>
        <div className="bg-slate-50 p-4 border-t border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-slate-700">Posts for this Hotel</h4>
            <button 
              className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md font-semibold text-xs flex items-center gap-2 hover:bg-slate-100 transition-colors" 
              onClick={onAddPost}
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Post
            </button>
          </div>
          
          {hotel.posts.length === 0 ? (
            <div className="text-center py-8 px-4 bg-white rounded-lg border-2 border-dashed border-slate-200">
              <FontAwesomeIcon icon={faFileMedical} className="text-4xl text-slate-300" />
              <p className="mt-3 font-semibold text-slate-600">No posts created yet.</p>
              <p className="text-sm text-slate-500">Click "Add Post" to create the first one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hotel.posts.map((post) => (
                <div key={post.id} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getLocaleFlag(post.locale)}</span>
                    <div>
                      <p className="font-semibold text-slate-800">{post.title}</p>
                      <p className="text-xs text-slate-500">
                        Status: <span className={`font-medium ${post.status === 'published' ? 'text-green-600' : 'text-amber-600'}`}>{post.status}</span>
                        <span className="mx-2">|</span>
                        Last updated: {post.updatedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onEditPost(post)} className="p-2 h-8 w-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-md"><FontAwesomeIcon icon={faEdit} /></button>
                    <button onClick={() => onTranslatePost(post)} className="p-2 h-8 w-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-md"><FontAwesomeIcon icon={faLanguage} /></button>
                    <button onClick={() => onDeletePost(post.id)} className="p-2 h-8 w-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-md"><FontAwesomeIcon icon={faTrash} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};