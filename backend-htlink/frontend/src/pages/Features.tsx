import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AddFeatureModal from '../components/features/AddFeatureModal';
import EditFeatureModal from '../components/features/EditFeatureModal';
import EditPostModal from '../components/features/EditPostModal';
import TranslateModal from '../components/features/TranslateModal';
import { useFeaturesQuery } from '../hooks/useFeaturesQuery';
import { useCategoriesQuery } from '../hooks/useCategoriesQuery';
import { usePropertySettings } from '../hooks/usePropertySettings';
import type { UIPost } from '../services/api';
import { postsAPI, propertiesAPI, featuresAPI } from '../services/api';

interface LocalFeature {
  id: number;
  name: string;
  category: string;
  categorySlug: string;
  icon: string;
  iconColor: string;
  status: 'active' | 'inactive';
  posts: UIPost[];
}

interface FormData {
  name: string;
  category: string;
  vrLink: string;
  slug: string;
  target: string;
  icon: string;
  color: string;
  description: string;
  status: string;
}

const Features: React.FC = () => {
  // Use React Query hooks for data fetching
  const { features: apiFeatures, loading, error, createFeature, updateFeature, deleteFeature, refreshFeatures } = useFeaturesQuery();
  const { categories, loading: categoriesLoading } = useCategoriesQuery();
  const { settings: propertySettings } = usePropertySettings();
  
  // Read URL query params
  const [searchParams] = useSearchParams();
  
  // Convert API features to LocalFeature format for UI compatibility
  const [features, setFeatures] = useState<LocalFeature[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedFeatures, setExpandedFeatures] = useState<Set<number>>(new Set());

  // Set category filter from URL query param
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setCategoryFilter(categoryParam);
    }
  }, [searchParams]);

  // Optimized: Load posts for all features in parallel with batching
  const loadPostsForFeatures = async (features: any[]) => {
    if (features.length === 0) return new Map();
    
    try {
      // Parallel batch loading - load posts for all features at once
      const postsPromises = features.map(async (feature: any) => {
        try {
          const posts = await postsAPI.getAll(feature.id, true);
          return { featureId: feature.id, posts };
        } catch (error) {
          return { featureId: feature.id, posts: [] };
        }
      });

      // Wait for all requests in parallel (instead of sequential)
      const postsResults = await Promise.all(postsPromises);
      
      const postsMap = new Map();
      postsResults.forEach(result => {
        postsMap.set(result.featureId, result.posts);
      });

      return postsMap;
    } catch (error) {
      console.error('Failed to load posts:', error);
      return new Map();
    }
  };



  // Convert API features to LocalFeature format when data loads
  useEffect(() => {
    if (apiFeatures.length > 0 && categories.length > 0) {
      const convertFeatures = async () => {
        // Determine current UI locale (try stored user/tenant values, fallback to 'en')
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const storedLocale = localStorage.getItem('locale') || localStorage.getItem('default_locale') || currentUser.default_locale || currentUser.locale;
        const uiLocale = (storedLocale || 'en').toLowerCase();

        // Optimized: Load posts for all features in parallel
        const postsMap = await loadPostsForFeatures(apiFeatures);
        
        const convertedFeatures: LocalFeature[] = apiFeatures.map(feature => {
          // Find category by id to get slug for filtering
          const category = categories.find(cat => cat.id === feature.category_id);
          // Choose translated category title if available for current UI locale
          const categoryLabel = category ? (category.translations?.[uiLocale]?.title || category.name || category.slug) : 'general';
          const categorySlug = category ? category.slug : 'general';

          // Get posts for this feature
          const featurePosts = postsMap.get(feature.id) || [];
          
          // The backend may return posts with a `translations` array when include_translations is true.
          // Expand each post and its translations into separate UIPost entries so all locales display.
          const uiPosts: UIPost[] = [];
          featurePosts.forEach((post: any) => {
            // Normalize translations to an array
            const translationsArray: any[] = [];
            if (post.translations) {
              if (Array.isArray(post.translations)) {
                translationsArray.push(...post.translations);
              } else if (typeof post.translations === 'object') {
                // API may return an object keyed by locale: { en: {...}, vi: {...} }
                Object.keys(post.translations).forEach(k => {
                  translationsArray.push({ locale: k, ...post.translations[k] });
                });
              }
            }

            // Always create UI entries for each translation
            if (translationsArray.length > 0) {
              translationsArray.forEach((t: any) => {
                const tInfo = getLocaleInfo(t.locale);
                const tRaw = t.content_html || '';
                const tExcerpt = tRaw.replace(/<[^>]*>/g, '').substring(0, 100);
                uiPosts.push({
                  ...post,
                  uiKey: `post-${post.id}-${t.locale}-${Date.now()}`, // Make truly unique
                  title: t.title || `Post ${post.id}`,
                  excerpt: tExcerpt ? tExcerpt + '...' : 'No content',
                  locale: t.locale || 'en',
                  localeName: tInfo.localeName,
                  flagClass: tInfo.flagClass,
                  content: tRaw,
                  slug: post.slug || '',
                  vr360_url: post.vr360_url || '',
                  status: post.status ? post.status.toLowerCase() : 'draft',
                  updatedAt: post.updated_at || post.created_at,
                  content_html: t.content_html,
                  translations: translationsArray
                });
              });
            }
          });

          // Get feature title from feature.translations (preferred) or fallback to post title or slug
          let featureTitle = feature.slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

          // Try to get title from feature translations first
          if (feature.translations && feature.translations[uiLocale]) {
            featureTitle = feature.translations[uiLocale].title;
          } else {
            // Fallback to post title
            const firstPost = featurePosts.find((p: any) => p.locale === uiLocale) || featurePosts[0];
            if (firstPost?.title) {
              featureTitle = firstPost.title;
            }
          }

          return {
            id: feature.id,
            name: featureTitle,
            category: categoryLabel,
            categorySlug: categorySlug,
            icon: feature.icon_key || "fa-file-alt",
            iconColor: "linear-gradient(135deg, #667eea, #764ba2)",
            status: feature.is_system ? "inactive" : "active",
            posts: uiPosts,
          };
        });
        setFeatures(convertedFeatures);

        // Expand first feature by default if any exist
        if (convertedFeatures.length > 0) {
          setExpandedFeatures(new Set([convertedFeatures[0].id]));
        }
      };

      convertFeatures();
    }
  }, [apiFeatures, categories]); // Only re-run when features or categories actually change
  
  // Modal states
  const [isAddFeatureModalOpen, setIsAddFeatureModalOpen] = useState(false);
  const [isEditFeatureModalOpen, setIsEditFeatureModalOpen] = useState(false);
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<UIPost | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);

  // Filter features based on search and filters
  const filteredFeatures = useMemo(() => {
    return features.filter(feature => {
      const matchesSearch = feature.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || feature.categorySlug === categoryFilter;
      const matchesStatus = !statusFilter || feature.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [features, searchQuery, categoryFilter, statusFilter]);

  // Toggle feature expansion
  const toggleFeature = (featureId: number) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(featureId)) {
      newExpanded.delete(featureId);
    } else {
      newExpanded.add(featureId);
    }
    setExpandedFeatures(newExpanded);
  };

  // Post management functions
  const handleEditPostClick = (post: UIPost) => {
    // Use content_html as primary source since that's what we store in DB
    const editPost = {
      ...post,
      content: (post as any).content_html || post.content || 'No content available. Start writing here...',
      title: post.title || `Post ${post.id}`,
      slug: post.slug || `post-${post.id}`,
      status: post.status || 'draft',
      feature_id: post.feature_id || (post as any).feature_id
    };

    setSelectedPost(editPost);
    setIsEditPostModalOpen(true);
  };

  const handleTranslateClick = (post: UIPost) => {
    setSelectedPost(post);
    setIsTranslateModalOpen(true);
  };

  const deletePost = async (postId: number, locale: string, translations: any[]) => {
    // Check if this post has multiple translations
    const hasMultipleTranslations = translations && translations.length > 1;

    try {
      if (hasMultipleTranslations) {
        // Only delete the translation for this locale
        if (window.confirm(`Are you sure you want to delete the ${locale.toUpperCase()} translation of this post?`)) {
          const { postsApi } = await import('../services/postsApi');
          await postsApi.deleteTranslation(postId, locale);
          alert(`${locale.toUpperCase()} translation deleted successfully!`);
          await refreshFeatures();
        }
      } else {
        // Delete the entire post (last translation)
        if (window.confirm('This is the last translation. Deleting it will remove the entire post. Continue?')) {
          await postsAPI.delete(postId);
          alert('Post deleted successfully!');
          await refreshFeatures();
        }
      }
    } catch (error: any) {
      alert(`Failed to delete post: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleEditFeature = (featureId: number) => {
    const apiFeature = apiFeatures.find(f => f.id === featureId);
    const localFeature = features.find(f => f.id === featureId);
    if (apiFeature && localFeature) {
      setSelectedFeature({ ...apiFeature, title: localFeature.name });
      setIsEditFeatureModalOpen(true);
    } else {
      alert('Feature not found');
    }
  };

  const handleDeleteFeature = async (featureId: number) => {
    if (window.confirm('Are you sure you want to delete this feature? This will also delete all associated posts.')) {
      try {
        await deleteFeature(featureId);
        alert('Feature deleted successfully!');
      } catch (error) {
        alert('Failed to delete feature. Please try again.');
      }
    }
  };

  const addPost = (featureId: number) => {
    // Find the feature to get its slug
    const feature = apiFeatures.find(f => f.id === featureId);
    const featureSlug = feature?.slug || '';

    // Create a new post object for the feature
    const newPost = {
      id: 0, // New post
      tenant_id: 1, // Default tenant
      property_id: 1, // Default property - TODO: get from context
      feature_id: featureId,
      slug: featureSlug, // Use feature's slug
      status: 'draft' as const,
      pinned: true,
      created_at: new Date().toISOString(),
      // UI fields
      title: '',
      excerpt: '',
      locale: 'en',
      localeName: 'English',
      flagClass: 'en',
      content: '',
      updatedAt: new Date().toISOString()
    };

    setSelectedPost(newPost);
    setIsEditPostModalOpen(true);
  };

  // Modal handlers
  const handleSavePost = async (postData: any) => {
    try {
      // Get user context for tenant and property
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const tenantId = parseInt(localStorage.getItem('tenant_id') || '1');

      // Get or create property_id
      let propertyId = currentUser.property_id;

      if (!propertyId) {
        try {
          const properties = await propertiesAPI.getAll();

          if (properties.length > 0) {
            propertyId = properties[0].id;
          } else {
            // Create default property if none exist
            const defaultProperty = await propertiesAPI.create({
              name: 'Default Hotel Property',
              tenant_id: tenantId,
              description: 'Auto-created default property for posts',
              address: ''
            });
            propertyId = defaultProperty.id;
          }
        } catch (propertyError) {
          throw new Error('Failed to get property information. Please contact administrator.');
        }
      }

      // Convert postData to API format
      const postPayload = {
        tenant_id: tenantId,
        property_id: propertyId,
        feature_id: selectedPost?.feature_id || selectedPost?.id || 1,
        slug: postData.slug || postData.title.toLowerCase().replace(/\s+/g, '-'),
        vr360_url: postData.vrLink || null,
        status: (postData.status || 'draft').toUpperCase(),
        pinned: true,
        title: postData.title,
        content_html: postData.content || '',
        locale: postData.locale || 'en'
      };

      if (selectedPost?.id && selectedPost.id > 0) {
        await postsAPI.update(selectedPost.id, postPayload);
        alert('Post updated successfully!');
      } else {
        await postsAPI.create(postPayload);
        alert('Post created successfully!');
      }
      
      setIsEditPostModalOpen(false);
      setSelectedPost(null);

      // Refresh data
      try {
        await refreshFeatures();

        if (apiFeatures.length > 0) {
          const postsMap = await loadPostsForFeatures(apiFeatures);
          
          // Update local features with fresh posts
          const updatedFeatures = features.map(feature => {
            const freshPosts = postsMap.get(feature.id) || [];
            const uiPosts: UIPost[] = [];
            
            freshPosts.forEach((post: any) => {
              // Normalize translations to array
              const translationsArray: any[] = [];
              if (post.translations) {
                if (Array.isArray(post.translations)) {
                  translationsArray.push(...post.translations);
                } else if (typeof post.translations === 'object') {
                  Object.keys(post.translations).forEach(k => translationsArray.push({ locale: k, ...post.translations[k] }));
                }
              }

              // Only create UI entries for translations (don't duplicate with main post)
              if (translationsArray.length > 0) {
                translationsArray.forEach((t: any) => {
                  const tInfo = getLocaleInfo(t.locale);
                  const tRaw = t.content_html || '';
                  const tExcerpt = tRaw.replace(/<[^>]*>/g, '').substring(0, 100);
                  uiPosts.push({
                    ...post,
                    uiKey: `post-${post.id}-trans-${t.locale}`,
                    title: t.title || post.title || `Post ${post.id}`,
                    excerpt: tExcerpt ? tExcerpt + '...' : 'No content',
                    locale: t.locale || 'en',
                    localeName: tInfo.localeName,
                    flagClass: tInfo.flagClass,
                    content: tRaw || '',
                    slug: post.slug || '',
                    vr360_url: post.vr360_url || '',
                    status: post.status ? post.status.toLowerCase() : 'draft',
                    updatedAt: post.updated_at || post.created_at,
                    content_html: t.content_html,
                    translations: translationsArray
                  });
                });
              }
            });
            
            return {
              ...feature,
              posts: uiPosts
            };
          });
          
          setFeatures(updatedFeatures);
        }
      } catch (refreshError) {
        window.location.reload();
      }
    } catch (error: any) {
      alert(`Failed to save post: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleSaveFeature = async (formData: FormData) => {
    try {
      const featureData = {
        slug: formData.slug,
        icon_key: formData.icon,
        category_id: categories.find(cat => cat.slug === formData.category)?.id || 1,
        tenant_id: 1,
        is_system: formData.status === 'inactive'
      };

      // Create feature first
      const newFeature = await createFeature(featureData);

      // Create feature translation for default locale (en)
      if (newFeature?.id) {
        try {
          await featuresAPI.createTranslation(
            newFeature.id,
            'en',
            {
              title: formData.name,
              short_desc: formData.description || ''
            }
          );
        } catch (translationError) {
          // Don't fail the whole operation if translation fails
        }
      }

      alert('Feature created successfully!');
      setIsAddFeatureModalOpen(false);
      await refreshFeatures();
    } catch (error) {
      alert('Failed to create feature. Please try again.');
    }
  };

  const handleSaveEditFeature = async (featureId: number, formData: any) => {
    try {
      const updateData = {
        slug: formData.slug,
        icon_key: formData.icon,
        category_id: categories.find(cat => cat.slug === formData.category)?.id || 1,
        tenant_id: 1,
        is_system: formData.status === 'inactive'
      };

      await updateFeature(featureId, updateData);

      // Update feature translations if name changed
      if (formData.name) {
        const currentFeature = apiFeatures.find(f => f.id === featureId);
        if (currentFeature?.translations) {
          const locales = Object.keys(currentFeature.translations);
          
          await Promise.all(locales.map(async (locale) => {
            try {
              if (currentFeature.translations) {
                await featuresAPI.updateTranslation(
                  featureId,
                  locale,
                  {
                    title: formData.name,
                    short_desc: currentFeature.translations[locale].short_desc
                  }
                );
              }
            } catch (transError) {
              // Silently fail individual translation updates
            }
          }));
        }
      }

      await refreshFeatures();
      alert('Feature updated successfully!');
      setIsEditFeatureModalOpen(false);
      setSelectedFeature(null);
    } catch (error) {
      alert('Failed to update feature. Please try again.');
    }
  };

  const handleTranslate = async (translationData: any) => {
    if (!selectedPost) return;

    try {
      // Import postsApi for translation operations
      const { postsApi } = await import('../services/postsApi');

      // Check if translation already exists for this locale
      const existingTranslation = (selectedPost as any).translations?.find(
        (t: any) => t.locale === translationData.targetLanguage
      );

      if (existingTranslation) {
        const updatePayload = {
          title: translationData.title,
          content_html: translationData.content,
        };
        await postsApi.updateTranslation(
          selectedPost.id,
          translationData.targetLanguage,
          updatePayload
        );
        alert('Translation updated successfully!');
      } else {
        const createPayload = {
          locale: translationData.targetLanguage,
          title: translationData.title,
          content_html: translationData.content,
        };
        await postsApi.createTranslation(selectedPost.id, createPayload);
        alert('Translation created successfully!');
      }

      setIsTranslateModalOpen(false);

      // Refresh data to show new translation
      await refreshFeatures();

      // Reload posts to update UI
      if (apiFeatures.length > 0) {
        const postsMap = await loadPostsForFeatures(apiFeatures);
        const updatedFeatures = features.map(feature => {
          const freshPosts = postsMap.get(feature.id) || [];
          const uiPosts: UIPost[] = [];
          
          freshPosts.forEach((post: any) => {
            // Normalize translations to array
            const translationsArray: any[] = [];
            if (post.translations) {
              if (Array.isArray(post.translations)) {
                translationsArray.push(...post.translations);
              } else if (typeof post.translations === 'object') {
                Object.keys(post.translations).forEach(k => translationsArray.push({ locale: k, ...post.translations[k] }));
              }
            }

            // Only create UI entries for translations (don't duplicate with main post)
            if (translationsArray.length > 0) {
              translationsArray.forEach((t: any) => {
                const tInfo = getLocaleInfo(t.locale);
                const tRaw = t.content_html || '';
                const tExcerpt = tRaw.replace(/<[^>]*>/g, '').substring(0, 100);
                uiPosts.push({
                  ...post,
                  uiKey: `post-${post.id}-trans-${t.locale}`,
                  title: t.title || post.title || `Post ${post.id}`,
                  excerpt: tExcerpt ? tExcerpt + '...' : 'No content',
                  locale: t.locale || 'en',
                  localeName: tInfo.localeName,
                  flagClass: tInfo.flagClass,
                  content: tRaw || '',
                  slug: post.slug || '',
                  vr360_url: post.vr360_url || '',
                  status: post.status ? post.status.toLowerCase() : 'draft',
                  updatedAt: post.updated_at || post.created_at,
                  content_html: t.content_html,
                  translations: translationsArray
                });
              });
            }
          });

          return {
            ...feature,
            posts: uiPosts
          };
        });

        setFeatures(updatedFeatures);
      }
    } catch (error: any) {
      // Show detailed error message
      let errorMessage = 'Failed to save translation';
      if (error.response?.data?.detail) {
        errorMessage += `: ${error.response.data.detail}`;
      } else if (error.response?.data) {
        errorMessage += `: ${JSON.stringify(error.response.data)}`;
      } else {
        errorMessage += `: ${error.message}`;
      }

      alert(errorMessage);
    }
  };

  const getIconClass = (iconName: string) => {
    // Map custom icon names to actual FontAwesome class names
    const iconMap: Record<string, string> = {
      'check-in': 'sign-in-alt',
      'check-out': 'sign-out-alt',
      'hot-tub-person': 'hot-tub',
      'access': 'key',
      'shuttle-bus': 'bus',
      'flight-service': 'plane-departure',
      'car-rental': 'car-side',
      'water-ladder': 'swimmer',
      'air-conditioning': 'snowflake',
      'morning-call': 'bell',
      'in-room-dining': 'utensils',
      'restaurant-reservation': 'calendar-check',
      'bar-lounge': 'cocktail',
      'tea-lounge': 'mug-hot',
      'drink-corner': 'glass-martini',
      'halal-food': 'leaf',
    };

    // Get mapped icon or use original
    const mappedIcon = iconMap[iconName] || iconName;
    
    if (mappedIcon.startsWith('fa-')) {
      return `fas ${mappedIcon}`;
    }
    return `fas fa-${mappedIcon}`;
  }

  // Map locale code to a human-friendly name and a short flag/label used in the UI
  const getLocaleInfo = (locale?: string) => {
    const code = (locale || 'en').toLowerCase();
    switch (code) {
      case 'vi':
        return { localeName: 'Tiếng Việt', flagClass: '🇻🇳' };
      case 'ja':
        return { localeName: '日本語', flagClass: '🇯🇵' };
      case 'ko':
        return { localeName: '한국어', flagClass: '🇰🇷' };
      case 'fr':
        return { localeName: 'Français', flagClass: '🇫🇷' };
      case 'zh':
        return { localeName: '中文', flagClass: '🇨🇳' };
      case 'en':
      default:
        return { localeName: 'English', flagClass: '🇬🇧' };
    }
  };

  // Handle loading and error states
  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Loading features...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Features</h3>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hotel Features & Posts</h2>
          <p className="text-sm text-slate-600 mt-1">Manage features and edit their content directly</p>
        </div>
        <button
          className="bg-blue-600 text-white border-none px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer flex items-center gap-2 transition-colors hover:bg-blue-700"
          onClick={() => setIsAddFeatureModalOpen(true)}
        >
          <i className="fas fa-plus"></i>
          Add Feature
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 mb-6 flex gap-4 items-center">
        <input
          type="text"
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          placeholder="Search features..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white min-w-[120px]"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categoriesLoading ? (
            <option disabled>Loading categories...</option>
          ) : (
            categories.map(category => {
              // Get default locale from property settings
              const defaultLocale = propertySettings.defaultLanguage || 'en';
              
              // Get translated title with fallback chain: defaultLocale -> en -> name -> slug
              const categoryTitle = category.translations?.[defaultLocale]?.title || 
                                   category.translations?.en?.title || 
                                   category.name || 
                                   category.slug.charAt(0).toUpperCase() + category.slug.slice(1);
              
              return (
                <option key={category.id} value={category.slug}>
                  {categoryTitle}
                </option>
              );
            })
          )}
        </select>
        <select
          className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white min-w-[120px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Features List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        
        <div 
          className="max-h-[70vh] overflow-y-auto" 
          style={{ 
            scrollBehavior: 'smooth',
            overscrollBehavior: 'contain',
            transform: 'translateZ(0)', // Hardware acceleration
            willChange: 'scroll-position' // Optimize for scrolling
          }}
        >
          {filteredFeatures.map(feature => (
          <div key={feature.id} className="border-b border-slate-200 last:border-b-0">
            <div
              className={`flex items-center p-4 cursor-pointer transition-all ${expandedFeatures.has(feature.id) ? 'bg-blue-50 border-b border-blue-200' : 'hover:bg-slate-50'}`}
              onClick={() => toggleFeature(feature.id)}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg text-white mr-4" style={{ background: feature.iconColor }}>
                <i className={getIconClass(feature.icon)}></i>
              </div>
              <div className="flex-1 flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{feature.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{feature.category}</span>
                    <div className="flex items-center gap-1.5">
                      <i className="fas fa-file-alt"></i>
                      <span>{feature.posts.length} posts</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${feature.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {feature.status}
                    </span>
                  </div>
                </div>
                
                {/* Feature Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditFeature(feature.id);
                    }}
                    title="Edit Feature"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFeature(feature.id);
                    }}
                    title="Delete Feature"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <i className={`fas fa-chevron-down text-slate-600 text-base transition-transform ${expandedFeatures.has(feature.id) ? 'rotate-180' : ''}`}></i>
            </div>
            
            <div 
              className={`bg-slate-50 transition-all duration-300 ease-in-out overflow-hidden ${
                expandedFeatures.has(feature.id) ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
              style={{ 
                transform: 'translateZ(0)', 
                backfaceVisibility: 'hidden' 
              }}
            >
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-base font-semibold text-slate-900">Posts in this Feature</h4>
                  <button
                    className="bg-green-600 text-white border-none px-4 py-2 rounded-md text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-colors hover:bg-green-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      addPost(feature.id);
                    }}
                  >
                    <i className="fas fa-plus"></i>
                    Add Post
                  </button>
                </div>
                
                {feature.posts.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    <div className="text-5xl text-slate-300 mb-4">
                      <i className="fas fa-plus-circle"></i>
                    </div>
                    <p>No posts created yet for this feature.</p>
                    <p>Click "Add Post" to create the first post.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {feature.posts.map(post => (
                      <div key={(post as any).uiKey || `${post.id}-${post.locale}`} className="bg-white border border-slate-200 rounded-lg p-4 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 font-semibold text-slate-900">
                            <span className="text-lg">{post.flagClass}</span>
                            {post.localeName}
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="px-2 py-1 border-none rounded text-xs font-medium cursor-pointer flex items-center gap-1 transition-all bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                              onClick={(e) => { e.stopPropagation(); handleEditPostClick(post); }}
                            >
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button
                              className="px-2 py-1 border-none rounded text-xs font-medium cursor-pointer flex items-center gap-1 transition-all bg-green-50 text-green-800 border border-green-200 hover:bg-green-100"
                              onClick={(e) => { e.stopPropagation(); handleTranslateClick(post); }}
                            >
                              <i className="fas fa-language"></i> Translate
                            </button>
                            <button
                              className="px-2 py-1 border-none rounded text-xs font-medium cursor-pointer flex items-center gap-1 transition-all bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Get all posts with same ID to count translations
                                const allPostVersions = feature.posts.filter(p => p.id === post.id);
                                const translations = allPostVersions.map(p => ({ locale: p.locale }));
                                deletePost(post.id, post.locale, translations);
                              }}
                            >
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </div>
                        <div className="text-slate-600 text-sm leading-normal">
                          <div className="font-semibold text-slate-900 mb-2">{post.title}</div>
                          <div className="line-clamp-2">{post.excerpt}</div>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${post.status === 'published' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                            {post.status}
                          </div>
                          <span>Updated: {post.updated_at || post.created_at}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Modals */}
      <AddFeatureModal
        isOpen={isAddFeatureModalOpen}
        onClose={() => setIsAddFeatureModalOpen(false)}
        onSave={handleSaveFeature}
      />

      <EditFeatureModal
        isOpen={isEditFeatureModalOpen}
        onClose={() => setIsEditFeatureModalOpen(false)}
        feature={selectedFeature}
        onSave={handleSaveEditFeature}
      />

      <EditPostModal
        isOpen={isEditPostModalOpen}
        onClose={() => setIsEditPostModalOpen(false)}
        post={selectedPost}
        onSave={handleSavePost}
      />

      <TranslateModal
        isOpen={isTranslateModalOpen}
        onClose={() => setIsTranslateModalOpen(false)}
        post={selectedPost}
        onTranslate={handleTranslate}
      />
    </div>
  );
};

export default Features;