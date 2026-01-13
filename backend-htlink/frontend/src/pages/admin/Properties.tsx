// src/pages/Properties.tsx
import { faPlus, faSpinner, faSync } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import { AddHotelModal } from "../../components/properties/AddHotelModal";
import { EditHotelPostModal } from "../../components/properties/EditHotelPostModal";
import { HotelItem } from "../../components/properties/HotelItem";
import { SearchFilters } from "../../components/properties/SearchFilters";
import { TranslateModal } from "../../components/properties/TranslateModal";
import { usePropertiesApi } from "../../hooks/usePropertiesApi";
import type { Hotel, HotelPost } from "../../types/properties";

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

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

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
    // open translate modal for existing post (also capture hotel id)
    setCurrentTranslatingPost(post);
    setCurrentHotelId(post.hotelId);
    setIsTranslateModalOpen(true);
  };

  const handleDeletePost = (postId: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Hotel Post',
      message: 'Are you sure you want to delete this hotel post? This action cannot be undone.',
      confirmText: 'Delete Post',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteHotelPost(postId);
          toast.success("Hotel post deleted successfully!");
        } catch (error) {
          toast.error("Failed to delete hotel post.");
        }
      },
    });
  };

  const handleSaveHotel = async (formData: any) => {
    try {
      await createHotel(formData);
      handleCloseAddHotelModal();
      showNotification("Hotel created successfully!", "success");
    } catch (error) {
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
        await createHotelPost(currentHotelId, postData);
        setIsTranslateModalOpen(false);
        showNotification('Post created from translation successfully!', 'success');
        // Force refresh to ensure the newly created post appears in the list
        await refreshProperties();
      } catch (error) {
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
        showNotification('Failed to save translation.', 'error');
      }
    }
  };

  const handleEditHotel = (hotel: Hotel) => {
    setCurrentEditingHotel(hotel);
    setIsEditHotelModalOpen(true);
  };

  const handleDeleteHotel = (hotelId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Hotel',
      message: 'Are you sure you want to delete this hotel? This action cannot be undone and will also delete all associated posts.',
      confirmText: 'Delete Hotel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteHotel(hotelId);
          toast.success("Hotel deleted successfully!");
        } catch (error) {
          toast.error("Failed to delete hotel.");
        }
      },
    });
  };

  const handleSaveEditHotel = async (formData: any) => {
    if (!currentEditingHotel) return;
    try {
      await updateHotel(currentEditingHotel.id, formData);
      showNotification("Hotel updated successfully!", "success");
      setIsEditHotelModalOpen(false);
      setCurrentEditingHotel(null);
    } catch (error) {
      showNotification("Failed to update hotel.", "error");
    }
  };

  // Loading state
  if (loading && hotels.length === 0) {
    return (
      <div className="p-6 bg-slate-50 min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg font-semibold text-slate-700">Đang tải dữ liệu...</p>
          <p className="text-sm text-slate-500 mt-2">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

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

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
};

export default Properties;