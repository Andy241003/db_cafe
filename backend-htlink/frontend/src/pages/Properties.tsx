// src/pages/Properties.tsx
import React, { useState } from "react";
import { useProperties } from "../hooks/useProperties";
import { SearchFilters } from "../components/properties/SearchFilters";
import { HotelItem } from "../components/properties/HotelItem";
import { AddHotelModal } from "../components/properties/AddHotelModal";
import { EditHotelPostModal } from "../components/properties/EditHotelPostModal";
import { TranslateModal } from "../components/properties/TranslateModal";
import type { HotelPost, TranslationData } from "../types/properties";
import { faPlus, faSpinner } from "@fortawesome/free-solid-svg-icons";
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
    createHotelPost,
    updateHotelPost,
    deleteHotelPost,
    translatePost,
    toggleHotelExpansion,
    isHotelExpanded,
  } = useProperties();

  // Modal states
  const [isAddHotelModalOpen, setIsAddHotelModalOpen] = useState(false);
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);

  // Current editing states
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
    setCurrentHotelId(hotelId);
    setCurrentEditingPost(null);
    setIsEditPostModalOpen(true);
  };

  const handleEditPost = (post: HotelPost) => {
    setCurrentEditingPost(post);
    setCurrentHotelId(post.hotelId);
    setIsEditPostModalOpen(true);
  };

  const handleTranslatePost = (post: HotelPost) => {
    setCurrentTranslatingPost(post);
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
    try {
      if (currentEditingPost) {
        await updateHotelPost({ ...currentEditingPost, ...postData });
        showNotification("Post updated successfully!", "success");
      } else {
        await createHotelPost(currentHotelId, postData);
        showNotification("Post created successfully!", "success");
      }
      setIsEditPostModalOpen(false);
    } catch (error) {
      console.error("Error saving post:", error);
      showNotification("Failed to save post.", "error");
    }
  };

  const handleSaveTranslation = async (translationData: TranslationData) => {
    if (!currentTranslatingPost) return;
    try {
      await translatePost(currentTranslatingPost.id, translationData);
      setIsTranslateModalOpen(false);
      showNotification("Translation saved successfully!", "success");
    } catch (error) {
      console.error("Error saving translation:", error);
      showNotification("Failed to save translation.", "error");
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
        <button
          onClick={handleOpenAddHotelModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} />
          Add Hotel
        </button>
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
          {hotels.map((hotel) => (
            <HotelItem
              key={hotel.id}
              hotel={hotel}
              isExpanded={isHotelExpanded(hotel.id)}
              onToggleExpand={() => toggleHotelExpansion(hotel.id)}
              onAddPost={() => handleAddPost(hotel.id)}
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
              onTranslatePost={handleTranslatePost}
            />
          ))}
        </div>
      )}

      <AddHotelModal
        isOpen={isAddHotelModalOpen}
        onClose={handleCloseAddHotelModal}
        onSave={handleSaveHotel}
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