// src/hooks/usePropertiesApi.ts
import { useState, useEffect } from 'react';
import { propertiesApi } from '../services/propertiesApi';
import { propertyPostsApi } from '../services/propertyPostsApi';
import { transformApiPropertyToUI, transformUIToApiPropertyCreate, transformUIToApiPropertyUpdate } from '../types/properties-api';
import type { Hotel, HotelFormData, HotelPost, TranslationData } from '../types/properties';

// Helper function to transform API post to UI format
const transformApiPostToUI = (apiPost: any, hotelId: string): HotelPost => {
  // Build translations array from API response.
  let translationsArray: any[] = [];
  if (apiPost.translations) {
    if (Array.isArray(apiPost.translations)) {
      translationsArray = apiPost.translations;
    } else if (typeof apiPost.translations === 'object') {
      // In case backend returns an object keyed by locale
      translationsArray = Object.keys(apiPost.translations).map((k) => ({ locale: k, ...apiPost.translations[k] }));
    }
  }

  // Fallback: if API returns flattened fields, create a single translation
  if (translationsArray.length === 0) {
    const fallbackLocale = apiPost.locale || 'en';
    translationsArray = [{ locale: fallbackLocale, title: apiPost.title || '', content: apiPost.content_html || apiPost.content || '' }];
  }

  // Choose preferred translation for top-level fields (prefer 'en', otherwise first)
  let preferred = translationsArray.find(t => t.locale === 'en') || translationsArray[0] || { title: '', content: '', locale: 'en' };

  // Helper to extract a readable title from HTML content
  const extractTitleFromHtml = (html: string | undefined): string => {
    if (!html) return '';
    try {
      // Try to find a heading tag first
      const headingMatch = html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
      if (headingMatch && headingMatch[1]) {
        return headingMatch[1].replace(/<[^>]*>/g, '').trim();
      }
      // Fallback: strip tags and take first 6 words
      const text = html.replace(/<[^>]*>/g, '').trim();
      const firstWords = text.split(/\s+/).slice(0, 6).join(' ');
      return firstWords.length > 0 ? (firstWords + (text.length > firstWords.length ? '...' : '')) : '';
    } catch (e) {
      return '';
    }
  };
  
  return {
    id: apiPost.id,
  title: preferred.title || extractTitleFromHtml(preferred.content_html || preferred.content) || 'Untitled',
  content: preferred.content_html || preferred.content || '',
  excerpt: (preferred.content_html || preferred.content || '').replace(/<[^>]*>/g, '').substring(0, 150) + '...',
    status: apiPost.status.toLowerCase() as 'published' | 'draft',
    hotelId: hotelId,
  locale: (preferred.locale as 'en' | 'vi' | 'ja') || 'en',
  translations: translationsArray as TranslationData[],
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
      // Create post and include translations in the same request.
      // The backend will associate translations with the created post_id.
  const content = postData.content || '<p>Content goes here...</p>';
  const title = postData.title || '';
  const locale = postData.locale || 'en';
      // If title provided and not present in content, prepend as <h2>
      const finalContent = title && !/(<h[1-3][\s\S]*?>)/i.test(content)
        ? `<h2>${title}</h2>\n${content}`
        : content;

      const apiPostData = {
        property_id: parseInt(hotelId),
        status: postData.status || 'draft',
        translations: [
          {
            locale,
            content: finalContent
          }
        ]
      };

      console.log('Creating property post via API (with translations):', apiPostData);
      const createdPost = await propertyPostsApi.createPropertyPost(apiPostData);
      console.log('Property post created successfully:', createdPost);

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

  // Prepare update data for propertyPostsApi - backend expects translations with locale + content
    const locale = postData.locale || (postData.translations && postData.translations[0]?.locale) || 'en';
    const rawContent = postData.content || (postData.translations && postData.translations[0]?.content) || '';
    const title = postData.title || '';
    let finalContentUpdate = rawContent;
    if (title) {
      if (/(<h[1-3][\s\S]*?>)([\s\S]*?)(<\/h[1-3]>)/i.test(rawContent)) {
        // Replace first heading with new title
        finalContentUpdate = rawContent.replace(/(<h[1-3][^>]*>)([\s\S]*?)(<\/h[1-3]>)/i, `<h2>${title}</h2>`);
      } else {
        finalContentUpdate = `<h2>${title}</h2>\n${rawContent}`;
      }
    }

    const updateData = {
      status: postData.status,
      translations: [
        {
          locale,
          content: finalContentUpdate
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
    try {
      // Ensure we have the post's property_id (hotel) from the server instead of relying on local state
      let postRecord: any = null;
      try {
        postRecord = await propertyPostsApi.getPropertyPost(postId);
        console.log('Fetched post record for translation refresh:', postRecord);
      } catch (fetchErr) {
        console.warn('Failed to fetch post record; will try to infer hotel from local state', fetchErr);
      }
      // Check existing translations for this post
      const existing = await propertyPostsApi.getPropertyPostTranslations(postId);
      const found = existing && existing.find((t: any) => t.locale === translationData.locale);
      const title = translationData.title || '';
      const raw = translationData.content || '';
      let final = raw;
      if (title) {
        if (/(<h[1-3][\s\S]*?>)([\s\S]*?)(<\/h[1-3]>)/i.test(raw)) {
          final = raw.replace(/(<h[1-3][^>]*>)([\s\S]*?)(<\/h[1-3]>)/i, `<h2>${title}</h2>`);
        } else {
          final = `<h2>${title}</h2>\n${raw}`;
        }
      }

      if (found) {
        console.log('Updating existing translation for locale', translationData.locale);
        await propertyPostsApi.updatePropertyPostTranslation(postId, translationData.locale, { content: final });
      } else {
        console.log('Creating new translation for locale', translationData.locale);
        await propertyPostsApi.createPropertyPostTranslation(postId, { locale: translationData.locale, content: final });
      }

      // Refresh posts for the hotel that contains this post. Prefer the server-provided property_id.
      let hotelId: string | null = null;
      if (postRecord && postRecord.property_id) {
        hotelId = String(postRecord.property_id);
      } else {
        for (const h of hotels) {
          if (h.posts.some((p) => p.id === postId)) {
            hotelId = h.id;
            break;
          }
        }
      }

      if (hotelId) {
        const apiPosts = await propertyPostsApi.getPropertyPosts({ property_id: parseInt(hotelId), skip: 0, limit: 100 });
        setHotels(prev => prev.map(h => h.id === hotelId ? { ...h, posts: apiPosts.map((apiPost:any) => transformApiPostToUI(apiPost, hotelId!)) } : h));
      } else {
        // Fallback: reload all
        await loadProperties();
      }

      return true;
    } catch (error) {
      console.error('Error translating post:', error);
      throw error;
    }
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