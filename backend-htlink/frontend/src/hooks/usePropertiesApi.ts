// src/hooks/usePropertiesApi.ts
import { useState, useEffect } from 'react';
import { propertiesApi } from '../services/propertiesApi';
import { transformApiPropertyToUI, transformUIToApiPropertyCreate, transformUIToApiPropertyUpdate } from '../types/properties-api';
import type { Hotel, HotelFormData, HotelPost, TranslationData } from '../types/properties';
import type { ApiProperty } from '../types/properties-api';

export const usePropertiesApi = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedHotels, setExpandedHotels] = useState<Set<string>>(new Set());

  // Load properties from API
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        const apiProperties = await propertiesApi.getProperties();
        
        // Transform API properties to UI format
        const transformedHotels = apiProperties.map(transformApiPropertyToUI);
        
        setHotels(transformedHotels);
      } catch (error) {
        console.error('Error loading properties:', error);
        // Set empty array on error
        setHotels([]);
      } finally {
        setLoading(false);
      }
    };

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
      
      setHotels(prev => [...prev, newHotel]);
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

  // Post management functions (Mock implementation for now)
  const createHotelPost = async (hotelId: string, postData: any) => {
    console.log('=== Creating post ===');
    console.log('Hotel ID:', hotelId);
    console.log('Post data:', postData);
    console.log('Current hotels before update:', hotels.map(h => ({ id: h.id, name: h.name, postsCount: h.posts.length })));
    
    // Mock implementation - create post locally
    const newPost: HotelPost = {
      id: Date.now(), // Simple ID generation
      hotelId: hotelId,
      title: postData.title || 'New Post',
      content: postData.content || 'Content goes here...',
      excerpt: postData.excerpt,
      slug: postData.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'new-post',
      status: postData.status || 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metaTitle: postData.metaTitle,
      metaDescription: postData.metaDescription,
    };
    
    console.log('New post created:', newPost);
    
    // Update local state - add post to the correct hotel
    setHotels(prev => {
      const updated = prev.map(hotel => {
        if (hotel.id === hotelId) {
          console.log(`Found hotel ${hotel.name}, adding post to ${hotel.posts.length} existing posts`);
          return {
            ...hotel,
            posts: [...hotel.posts, newPost]
          };
        }
        return hotel;
      });
      
      console.log('Hotels after update:', updated.map(h => ({ id: h.id, name: h.name, postsCount: h.posts.length })));
      return updated;
    });
    
    console.log('=== Post creation completed ===');
    return newPost;
  };

  const updateHotelPost = async (postData: HotelPost) => {
    console.log('Updating post:', postData);
    
    // Mock implementation - update post locally
    setHotels(prev => prev.map(hotel => {
      if (hotel.id === postData.hotelId) {
        return {
          ...hotel,
          posts: hotel.posts.map(post => 
            post.id === postData.id 
              ? { ...postData, updatedAt: new Date().toISOString() }
              : post
          )
        };
      }
      return hotel;
    }));
  };

  const deleteHotelPost = async (postId: number) => {
    console.log('Deleting post:', postId);
    
    // Mock implementation - remove post from local state
    setHotels(prev => prev.map(hotel => ({
      ...hotel,
      posts: hotel.posts.filter(post => post.id !== postId)
    })));
  };

  const translatePost = async (postId: number, translationData: TranslationData) => {
    console.log('Translating post:', postId, translationData);
    
    // Mock implementation - just log for now
    // In real implementation, this would create/update translations
  };

  // Refresh data
  const refreshProperties = async () => {
    try {
      setLoading(true);
      const apiProperties = await propertiesApi.getProperties();
      const transformedHotels = apiProperties.map(transformApiPropertyToUI);
      setHotels(transformedHotels);
    } catch (error) {
      console.error('Error refreshing properties:', error);
    } finally {
      setLoading(false);
    }
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