// src/hooks/usePropertiesApi.ts
import { useState, useEffect } from 'react';
import { propertiesApi } from '../services/propertiesApi';
import { propertyPostsApi } from '../services/propertyPostsApi';
import { transformApiPropertyToUI, transformUIToApiPropertyCreate, transformUIToApiPropertyUpdate } from '../types/properties-api';
import type { Hotel, HotelFormData, HotelPost, TranslationData } from '../types/properties';

// Helper function to transform API post to UI format
const transformApiPostToUI = (apiPost: any, hotelId: string): HotelPost => {
  // Handle both array and object format for translations
  let translation: any = { title: '', content: '', content_html: '', locale: 'en' };
  
  if (apiPost.translations) {
    if (Array.isArray(apiPost.translations) && apiPost.translations.length > 0) {
      // Array format
      translation = apiPost.translations[0];
    } else if (typeof apiPost.translations === 'object' && !Array.isArray(apiPost.translations)) {
      // Object format - use the translations object directly
      translation = apiPost.translations;
    }
  }
  
  // Also check if translation data is directly on the post object (flattened format)
  if (!translation.title && apiPost.title) {
    translation.title = apiPost.title;
  }
  if (!translation.content_html && apiPost.content_html) {
    translation.content_html = apiPost.content_html;
  }
  if (!translation.locale && apiPost.locale) {
    translation.locale = apiPost.locale;
  }
  
  return {
    id: apiPost.id,
    title: translation.title || 'Untitled',
    content: translation.content_html || translation.content || '',
    excerpt: (translation.content_html || translation.content || '').replace(/<[^>]*>/g, '').substring(0, 150) + '...',
    status: apiPost.status.toLowerCase() as 'published' | 'draft',
    hotelId: hotelId,
    locale: (translation.locale as 'en' | 'vi' | 'ja') || 'en',
    slug: apiPost.slug,
    address: '',
    phone: '',
    vrLink: '',
    createdAt: apiPost.created_at,
    updatedAt: apiPost.updated_at || undefined
  };
};

export const usePropertiesApi = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedHotels, setExpandedHotels] = useState<Set<string>>(new Set());

  // Load properties from API
  const loadProperties = async () => {
    try {
      setLoading(true);
      const apiProperties = await propertiesApi.getProperties();
      
      // Transform API properties to UI format
      const transformedHotels = apiProperties.map(transformApiPropertyToUI);
      
      // Load posts for each hotel using propertyPostsApi
      const hotelsWithPosts = await Promise.all(
        transformedHotels.map(async (hotel) => {
          try {
            const apiPosts = await propertyPostsApi.getPropertyPosts({
              property_id: parseInt(hotel.id),
              skip: 0,
              limit: 100
            });
            // Transform API posts to UI format
            const posts: HotelPost[] = apiPosts.map(apiPost => transformApiPostToUI(apiPost, hotel.id));
            return { ...hotel, posts };
          } catch (error) {
            console.error(`Error loading posts for hotel ${hotel.id}:`, error);
            return { ...hotel, posts: [] };
          }
        })
      );
      
      setHotels(hotelsWithPosts);
    } catch (error) {
      console.error('Error loading properties:', error);
      // Set empty array on error
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  // Filter hotels based on search and status
  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hotel.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === '' || hotel.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Hotel expansion state management
  const toggleHotelExpansion = (hotelId: string) => {
    setExpandedHotels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hotelId)) {
        newSet.delete(hotelId);
      } else {
        newSet.add(hotelId);
      }
      return newSet;
    });
  };

  const isHotelExpanded = (hotelId: string) => expandedHotels.has(hotelId);

  // Create new hotel/property
  const createHotel = async (formData: HotelFormData) => {
    try {
      const apiData = transformUIToApiPropertyCreate(formData);
      const newProperty = await propertiesApi.createProperty(apiData);
      const newHotel = transformApiPropertyToUI(newProperty);
      
      // Reload all properties to ensure we get any auto-created posts
      await loadProperties();
      
      return newHotel;
    } catch (error) {
      console.error('Error creating hotel:', error);
      throw error;
    }
  };

  // Update existing hotel/property
  const updateHotel = async (hotelId: string, formData: Partial<HotelFormData>) => {
    try {
      const apiData = transformUIToApiPropertyUpdate(formData);
      console.log('Updating hotel with data:', apiData);
      const updatedProperty = await propertiesApi.updateProperty(parseInt(hotelId), apiData);
      const updatedHotel = transformApiPropertyToUI(updatedProperty);
      
      setHotels(prev => prev.map(hotel => 
        hotel.id === hotelId ? updatedHotel : hotel
      ));
      return updatedHotel;
    } catch (error) {
      console.error('Error updating hotel:', error);
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as any;
        console.error('Response data:', axiosError.response?.data);
        console.error('Response status:', axiosError.response?.status);
      }
      throw error;
    }
  };

  // Delete hotel/property
  const deleteHotel = async (hotelId: string) => {
    try {
      await propertiesApi.deleteProperty(parseInt(hotelId));
      setHotels(prev => prev.filter(hotel => hotel.id !== hotelId));
    } catch (error) {
      console.error('Error deleting hotel:', error);
      throw error;
    }
  };

  // Post management functions
  const createHotelPost = async (hotelId: string, postData: any) => {
    console.log('=== Creating property post ===');
    console.log('Hotel ID:', hotelId);
    console.log('Post data:', postData);

    try {
      // Step 1: Create post (without translations)
      const apiPostData = {
        property_id: parseInt(hotelId),
        status: postData.status || 'draft',
        translations: [] // Empty translations
      };

      console.log('Creating property post via API:', apiPostData);
      const createdPost = await propertyPostsApi.createPropertyPost(apiPostData);
      console.log('Property post created successfully:', createdPost);

      // Step 2: Create translation for the post
      const slug = postData.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'new-post';
      const translationData = {
        locale: 'en',
        title: postData.title || 'New Post',
        slug: slug,
        short_description: postData.excerpt || '',
        content: postData.content || 'Content goes here...',
        thumbnail_url: postData.thumbnail || '',
      };

      console.log('Creating translation for post:', createdPost.id, translationData);
      await propertyPostsApi.createPropertyPostTranslation(createdPost.id!, translationData);
      console.log('Translation created successfully');

      // Reload posts for this specific hotel to get fresh data
      try {
        const apiPosts = await propertyPostsApi.getPropertyPosts({
          property_id: parseInt(hotelId),
          skip: 0,
          limit: 100
        });

        // Update the posts for this hotel in the state
        setHotels(prev => prev.map(hotel => {
          if (hotel.id === hotelId) {
            const updatedPosts: HotelPost[] = apiPosts.map(apiPost => transformApiPostToUI(apiPost, hotelId));

            console.log(`Updated hotel ${hotel.name} with ${updatedPosts.length} posts`);
            return { ...hotel, posts: updatedPosts };
          }
          return hotel;
        }));

        console.log('=== Property post creation completed ===');
        return createdPost;
      } catch (reloadError) {
        console.error('Error reloading posts after creation:', reloadError);
        // Fallback: reload all data if post reload fails
        await loadProperties();
        return createdPost;
      }
    } catch (error) {
      console.error('Error creating property post:', error);
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as any;
        console.error('Response data:', axiosError.response?.data);
        console.error('Response status:', axiosError.response?.status);
      }
      throw error;
    }
  };

  const updateHotelPost = async (postData: HotelPost) => {
    console.log('Updating property post:', postData);

    const slug = postData.slug || postData.title.toLowerCase().replace(/\s+/g, '-');

    // Prepare update data for propertyPostsApi
    const updateData = {
      status: postData.status,
      translations: [
        {
          locale: postData.locale || 'en',
          title: postData.title,
          slug: slug,
          short_description: postData.excerpt || '',
          content: postData.content,
          thumbnail_url: '',
        }
      ]
    };

    try {
      console.log('Updating property post via API with data:', updateData);

      // Update the post via propertyPostsApi
      const updatedPost = await propertyPostsApi.updatePropertyPost(postData.id, updateData);
      console.log('Property post updated successfully:', updatedPost);

      // Reload posts for this specific hotel only
      const hotelId = postData.hotelId;
      try {
        const apiPosts = await propertyPostsApi.getPropertyPosts({
          property_id: parseInt(hotelId),
          skip: 0,
          limit: 100
        });
        console.log('Fresh posts loaded for hotel:', hotelId, apiPosts);

        // Update only the posts for this hotel in the state
        setHotels(prev => prev.map(hotel => {
          if (hotel.id === hotelId) {
            const updatedPosts: HotelPost[] = apiPosts.map(apiPost => transformApiPostToUI(apiPost, hotelId));

            console.log('Updated hotel posts:', updatedPosts);
            return { ...hotel, posts: updatedPosts };
          }
          return hotel;
        }));

        console.log('Data updated after post update');
      } catch (reloadError) {
        console.error('Error reloading posts after update:', reloadError);
        // Fallback: reload all data if post reload fails
        await loadProperties();
      }
    } catch (error) {
      console.error('Error updating property post:', error);
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as any;
        console.error('Response data:', axiosError.response?.data);
        if (axiosError.response?.data?.detail) {
          console.error('Detailed errors:', axiosError.response.data.detail);
        }
        console.error('Response status:', axiosError.response?.status);
        console.error('Update data was:', updateData);
      }
      throw error;
    }
  };

  const deleteHotelPost = async (postId: number) => {
    console.log('Deleting property post:', postId);

    try {
      // Call propertyPostsApi to delete post
      await propertyPostsApi.deletePropertyPost(postId);

      // Remove post from local state after successful API call
      setHotels(prev => prev.map(hotel => ({
        ...hotel,
        posts: hotel.posts.filter(post => post.id !== postId)
      })));
    } catch (error) {
      console.error('Error deleting property post:', error);
      throw error;
    }
  };

  const translatePost = async (postId: number, translationData: TranslationData) => {
    console.log('Translating post:', postId, translationData);
    
    // Mock implementation - just log for now
    // In real implementation, this would create/update translations
  };

  // Refresh data
  const refreshProperties = async () => {
    await loadProperties();
  };

  return {
    hotels: filteredHotels,
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
  };
};