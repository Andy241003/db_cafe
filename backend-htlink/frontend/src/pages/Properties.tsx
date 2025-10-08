// src/pages/Properties.tsx
import React, { useState } from "react";
import { usePropertiesApi } from "../hooks/usePropertiesApi";
import { SearchFilters } from "../components/properties/SearchFilters";
import { HotelItem } from "../components/properties/HotelItem";
import { AddHotelModal } from "../components/properties/AddHotelModal";
import { EditHotelPostModal } from "../components/properties/EditHotelPostModal";
import { TranslateModal } from "../components/properties/TranslateModal";
import type { Hotel, HotelPost } from "../types/properties";
import { faPlus, faSpinner, faSync } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Properties: React.FC = () => {
  const {
    hotels,
    loading,
    searchQuery,
    statusFilter,
    setSearchQuery,
    setStatusFilter,
    createHotel,
    updateHotel,
    deleteHotel,
    createHotelPost,
    updateHotelPost,
    deleteHotelPost,
    translatePost,
    toggleHotelExpansion,
    isHotelExpanded,
    refreshProperties,
  } = usePropertiesApi();

  // Modal states
  const [isAddHotelModalOpen, setIsAddHotelModalOpen] = useState(false);
  const [isEditHotelModalOpen, setIsEditHotelModalOpen] = useState(false);
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);

  // Current editing states
  const [currentEditingHotel, setCurrentEditingHotel] = useState<Hotel | null>(null);
  const [currentEditingPost, setCurrentEditingPost] = useState<HotelPost | null>(null);
  const [currentTranslatingPost, setCurrentTranslatingPost] = useState<HotelPost | null>(null);
  const [currentHotelId, setCurrentHotelId] = useState<string>("");

  // Notification system
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showNotification = (message: string, type: "success" | "error" | "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handlers
  const handleOpenAddHotelModal = () => setIsAddHotelModalOpen(true);
  const handleCloseAddHotelModal = () => setIsAddHotelModalOpen(false);

  const handleAddPost = (hotelId: string) => {
    console.log('Add Post clicked for hotel:', hotelId);
    setCurrentHotelId(hotelId);
    setCurrentEditingPost(null);
    setIsEditPostModalOpen(true);
    console.log('Modal should be open now');
  };

  const handleEditPost = (post: HotelPost) => {
    setCurrentEditingPost(post);
    setCurrentHotelId(post.hotelId);
    setIsEditPostModalOpen(true);
  };

  const handleTranslatePost = (post: HotelPost) => {
    // open translate modal for existing post (also capture hotel id)
    setCurrentTranslatingPost(post);
    setCurrentHotelId(post.hotelId);
    setIsTranslateModalOpen(true);
  };

  const handleDeletePost = async (postId: number) => {
    if (window.confirm("Are you sure you want to delete this hotel post?")) {
      try {
        await deleteHotelPost(postId);
        showNotification("Hotel post deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting post:", error);
        showNotification("Error deleting post. Please try again.", "error");
      }
    }
  };

  const handleSaveHotel = async (formData: any) => {
    try {
      await createHotel(formData);
      handleCloseAddHotelModal();
      showNotification("Hotel created successfully!", "success");
    } catch (error) {
      console.error("Error creating hotel:", error);
      showNotification("Failed to create hotel.", "error");
    }
  };

  const handleSavePost = async (postData: any) => {
    console.log('Save Post called with data:', postData);
    console.log('Current hotel ID:', currentHotelId);
    console.log('Is editing?', !!currentEditingPost);
    
    try {
      if (currentEditingPost) {
        await updateHotelPost({ ...currentEditingPost, ...postData });
        showNotification("Post updated successfully!", "success");
      } else {
        console.log('Creating new post...');
        await createHotelPost(currentHotelId, postData);
        showNotification("Post created successfully!", "success");
      }
      setIsEditPostModalOpen(false);
    } catch (error) {
      console.error("Error saving post:", error);
      showNotification("Failed to save post.", "error");
    }
  };

  const handleSaveTranslation = async (translationData: any) => {
    // Create a new property post for the hotel using the translation content and locale
    if (currentHotelId) {
      try {
        const postData = {
          title: '',
          content: translationData.content,
          locale: translationData.locale,
          status: 'draft'
        };
        console.log('Creating new property post from translation for hotel:', currentHotelId, postData);
        await createHotelPost(currentHotelId, postData);
        setIsTranslateModalOpen(false);
        showNotification('Post created from translation successfully!', 'success');
        // Force refresh to ensure the newly created post appears in the list
        await refreshProperties();
      } catch (error) {
        console.error('Error creating post from translation:', error);
        showNotification('Failed to create post from translation.', 'error');
      }
      return;
    }

    // If no hotel context is available, attempt to update the existing post's translations as a fallback
    if (currentTranslatingPost) {
      try {
        await translatePost(currentTranslatingPost.id, translationData);
        setIsTranslateModalOpen(false);
        showNotification('Translation saved successfully!', 'success');
        await refreshProperties();
      } catch (error) {
        console.error('Error saving translation (fallback):', error);
        showNotification('Failed to save translation.', 'error');
      }
    }
  };

  const handleEditHotel = (hotel: Hotel) => {
    setCurrentEditingHotel(hotel);
    setIsEditHotelModalOpen(true);
  };

  const handleDeleteHotel = async (hotelId: string) => {
    if (window.confirm("Are you sure you want to delete this hotel? This action cannot be undone and will also delete all associated posts.")) {
      try {
        await deleteHotel(hotelId);
        showNotification("Hotel deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting hotel:", error);
        showNotification("Failed to delete hotel.", "error");
      }
    }
  };

  const handleSaveEditHotel = async (formData: any) => {
    if (!currentEditingHotel) return;
    try {
      await updateHotel(currentEditingHotel.id, formData);
      showNotification("Hotel updated successfully!", "success");
      setIsEditHotelModalOpen(false);
      setCurrentEditingHotel(null);
    } catch (error) {
      console.error("Error updating hotel:", error);
      showNotification("Failed to update hotel.", "error");
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      {notification && (
        <div className={`fixed top-20 right-6 px-4 py-2 rounded-md text-white ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`}
        >
          {notification.message}
        </div>
      )}

      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
          <p className="text-sm text-slate-600 mt-1">Manage your hotel properties and their content.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refreshProperties}
            className="bg-slate-600 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-slate-700 transition-colors"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faSync} spin={loading} />
            Refresh
          </button>
          <button
            onClick={handleOpenAddHotelModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Hotel
          </button>
        </div>
      </header>

      <SearchFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {loading ? (
        <div className="text-center py-10">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-slate-500" />
          <p className="mt-2 text-slate-600">Loading properties...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {hotels.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 text-6xl mb-4">🏨</div>
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No Properties Found</h3>
              <p className="text-slate-500 mb-4">
                {searchQuery || statusFilter 
                  ? "No properties match your current filters." 
                  : "Get started by adding your first hotel property."
                }
              </p>
              {!searchQuery && !statusFilter && (
                <button
                  onClick={handleOpenAddHotelModal}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors mx-auto"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Add Your First Hotel
                </button>
              )}
            </div>
          ) : (
            hotels.map((hotel) => (
              <HotelItem
                key={hotel.id}
                hotel={hotel}
                isExpanded={isHotelExpanded(hotel.id)}
                onToggleExpand={() => toggleHotelExpansion(hotel.id)}
                onAddPost={() => handleAddPost(hotel.id)}
                onEditPost={handleEditPost}
                onDeletePost={handleDeletePost}
                onTranslatePost={handleTranslatePost}
                onEditHotel={handleEditHotel}
                onDeleteHotel={handleDeleteHotel}
              />
            ))
          )}
        </div>
      )}

      <AddHotelModal
        isOpen={isAddHotelModalOpen}
        onClose={handleCloseAddHotelModal}
        onSave={handleSaveHotel}
      />

      <AddHotelModal
        isOpen={isEditHotelModalOpen}
        onClose={() => setIsEditHotelModalOpen(false)}
        onSave={handleSaveEditHotel}
        hotel={currentEditingHotel}
        isEditing={true}
      />

      <EditHotelPostModal
        isOpen={isEditPostModalOpen}
        onClose={() => setIsEditPostModalOpen(false)}
        onSave={handleSavePost}
        post={currentEditingPost}
      />

      <TranslateModal
        isOpen={isTranslateModalOpen}
        onClose={() => setIsTranslateModalOpen(false)}
        onSave={handleSaveTranslation}
        post={currentTranslatingPost}
      />
    </div>
  );
};

export default Properties;