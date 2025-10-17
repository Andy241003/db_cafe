import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AddFeatureModal from '../components/features/AddFeatureModal';
import EditFeatureModal from '../components/features/EditFeatureModal';
import EditPostModal from '../components/features/EditPostModal';
import TranslateModal from '../components/features/TranslateModal';
import ConfirmModal from '../components/common/ConfirmModal';
import { useFeaturesQuery } from '../hooks/useFeaturesQuery';
import { useCategoriesQuery } from '../hooks/useCategoriesQuery';
import type { UIPost } from '../services/api';
import { postsAPI, propertiesAPI, featuresAPI } from '../services/api';
import { autoDetectLanguage } from '../utils/languageDetection';

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
  
  // Read URL query params
  const [searchParams] = useSearchParams();
  
  // Convert API features to LocalFeature format for UI compatibility
  const [features, setFeatures] = useState<LocalFeature[]>([]);
  
  // Track which features have loaded posts (lazy loading)
  const [loadedPosts, setLoadedPosts] = useState<Map<number, UIPost[]>>(new Map());
  
  // Track posts count per feature (lightweight - loaded upfront)
  const [postsCounts, setPostsCounts] = useState<Map<number, number>>(new Map());

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Track which features are expanded (no persistence - starts collapsed)
  const [expandedFeatures, setExpandedFeatures] = useState<Set<number>>(new Set());

  // Set category filter from URL query param
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setCategoryFilter(categoryParam);
    }
  }, [searchParams]);

  // Note: Auto language detection is now handled globally in App.tsx
  // using the autoDetectLanguage() utility function

  // Lazy load posts for a single feature when expanded
  const loadPostsForFeature = async (featureId: number, forceReload = false) => {
    // Skip if already loaded (unless force reload)
    if (!forceReload && loadedPosts.has(featureId)) {
      return loadedPosts.get(featureId) || [];
    }
    
    try {
      const posts = await postsAPI.getAll(featureId, true);
      
      // Process posts into UIPost format
      const uiPosts: UIPost[] = [];
      posts.forEach((post: any) => {
        const translationsArray: any[] = [];
        if (post.translations) {
          if (Array.isArray(post.translations)) {
            translationsArray.push(...post.translations);
          } else if (typeof post.translations === 'object') {
            Object.keys(post.translations).forEach(k => {
              translationsArray.push({ locale: k, ...post.translations[k] });
            });
          }
        }

        if (translationsArray.length > 0) {
          translationsArray.forEach((t: any) => {
            const tInfo = getLocaleInfo(t.locale);
            const tRaw = t.content_html || '';
            const tExcerpt = tRaw.replace(/<[^>]*>/g, '').substring(0, 100);
            uiPosts.push({
              ...post,
              uiKey: `post-${post.id}-${t.locale}-${Date.now()}`,
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
      
      // Cache the loaded posts
      const newLoadedPosts = new Map(loadedPosts);
      newLoadedPosts.set(featureId, uiPosts);
      setLoadedPosts(newLoadedPosts);
      
      return uiPosts;
    } catch (error) {
      console.error('Failed to load posts for feature:', featureId, error);
      return [];
    }
  };



  // Load posts counts for all features (lightweight query)
  useEffect(() => {
    if (apiFeatures.length > 0) {
      const loadAllCounts = async () => {
        const counts = new Map<number, number>();
        
        // Load counts in parallel for all features
        await Promise.all(
          apiFeatures.map(async (feature) => {
            try {
              const count = await postsAPI.getCount(feature.id);
              counts.set(feature.id, count);
            } catch (error) {
              console.error(`Failed to load count for feature ${feature.id}:`, error);
              counts.set(feature.id, 0);
            }
          })
        );
        
        setPostsCounts(counts);
      };
      
      loadAllCounts();
    }
  }, [apiFeatures]); // Load counts when features change

  // Trigger auto-detect on mount
  useEffect(() => {
    autoDetectLanguage();
  }, []);

  // Convert API features to LocalFeature format when data loads (WITHOUT loading posts)
  // Re-run when locale changes
  useEffect(() => {
    if (apiFeatures.length > 0 && categories.length > 0) {
      const convertFeatures = () => {
        // Get current locale from localStorage (set by auto-detect or user selection)
        const uiLocale = (localStorage.getItem('locale') || 'en').toLowerCase();
        
        console.log(`🌍 Converting features with UI locale: ${uiLocale}`);
        
        const convertedFeatures: LocalFeature[] = apiFeatures.map(feature => {
          // Find category by id to get slug for filtering
          const category = categories.find(cat => cat.id === feature.category_id);
          
          // Get category title with fallback chain: uiLocale → en → name → slug
          const categoryLabel = category ? 
            (category.translations?.[uiLocale]?.title || 
             category.translations?.en?.title || 
             category.name || 
             category.slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())) 
            : 'general';
          const categorySlug = category ? category.slug : 'general';

          // Get feature title with fallback chain: uiLocale → en → formatted slug
          let featureTitle = feature.slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          if (feature.translations) {
            featureTitle = feature.translations[uiLocale]?.title || 
                          feature.translations.en?.title || 
                          featureTitle;
          }

          // DON'T load posts yet - will be loaded lazily when expanded
          return {
            id: feature.id,
            name: featureTitle,
            category: categoryLabel,
            categorySlug: categorySlug,
            icon: feature.icon_key || "fa-file-alt",
            iconColor: "linear-gradient(135deg, #667eea, #764ba2)",
            status: feature.is_system ? "inactive" : "active",
            posts: loadedPosts.get(feature.id) || [], // Use cached posts if available
          };
        });
        
        setFeatures(convertedFeatures);
      };

      convertFeatures();
    }
  }, [apiFeatures, categories, loadedPosts]); // Re-run when posts cache updates
  
  // Listen for locale changes from localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'locale' && e.newValue) {
        console.log(`🔄 Locale changed to: ${e.newValue}, re-converting features...`);
        // Trigger re-conversion by updating a state that's in the dependency array
        // Features will auto-update via the useEffect above
        window.location.reload(); // Simple approach: reload page
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-tab updates
    const handleLocaleChange = () => {
      console.log('🔄 Locale changed (same tab), re-converting features...');
      window.location.reload();
    };
    
    window.addEventListener('localeChanged', handleLocaleChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localeChanged', handleLocaleChange);
    };
  }, []);
  
  // Modal states
  const [isAddFeatureModalOpen, setIsAddFeatureModalOpen] = useState(false);
  const [isEditFeatureModalOpen, setIsEditFeatureModalOpen] = useState(false);
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<UIPost | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);
  
  // Confirm modal states
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

  // Filter features based on search and filters
  const filteredFeatures = useMemo(() => {
    return features.filter(feature => {
      const matchesSearch = feature.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || feature.categorySlug === categoryFilter;
      const matchesStatus = !statusFilter || feature.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [features, searchQuery, categoryFilter, statusFilter]);

  // Toggle feature expansion and lazy load posts
  const toggleFeature = async (featureId: number) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(featureId)) {
      newExpanded.delete(featureId);
    } else {
      newExpanded.add(featureId);
      
      // Lazy load posts when expanding
      if (!loadedPosts.has(featureId)) {
        const posts = await loadPostsForFeature(featureId);
        
        // Update the feature's posts in state
        setFeatures(prevFeatures => 
          prevFeatures.map(f => 
            f.id === featureId ? { ...f, posts } : f
          )
        );
      }
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

  const deletePost = (postId: number, locale: string, translations: any[], featureId: number) => {
    // Check if this post has multiple translations
    const hasMultipleTranslations = translations && translations.length > 1;

    if (hasMultipleTranslations) {
      // Show confirm modal for translation deletion
      setConfirmModal({
        isOpen: true,
        title: 'Delete Translation',
        message: `Are you sure you want to delete the ${locale.toUpperCase()} translation of this post?`,
        confirmText: 'Delete Translation',
        variant: 'warning',
        onConfirm: async () => {
          try {
            const { postsApi } = await import('../services/postsApi');
            await postsApi.deleteTranslation(postId, locale);
            toast.success(`${locale.toUpperCase()} translation deleted successfully!`);
            
            // Auto-refresh: Reload posts for this feature
            try {
              await refreshFeatures();
              
              // Update count
              const newCount = await postsAPI.getCount(featureId);
              const newCounts = new Map(postsCounts);
              newCounts.set(featureId, newCount);
              setPostsCounts(newCounts);
              
              // Reload posts if expanded
              if (expandedFeatures.has(featureId)) {
                console.log(`🔄 Auto-refreshing after deleting translation...`);
                
                const freshPosts = await loadPostsForFeature(featureId, true); // 👈 FORCE RELOAD
                
                // Update cache
                const newLoadedPosts = new Map(loadedPosts);
                newLoadedPosts.set(featureId, freshPosts);
                setLoadedPosts(newLoadedPosts);
                
                setFeatures(prevFeatures =>
                  prevFeatures.map(f =>
                    f.id === featureId ? { ...f, posts: freshPosts } : f
                  )
                );
                console.log(`✅ Posts refreshed! Remaining: ${freshPosts.length} posts`);
              }
            } catch (refreshError) {
              console.error('Refresh error:', refreshError);
              toast.error('Failed to refresh. Please manually reload.');
            }
          } catch (error: any) {
            toast.error(`Failed to delete translation: ${error.response?.data?.detail || error.message}`);
          }
        },
      });
    } else {
      // Show confirm modal for full post deletion
      setConfirmModal({
        isOpen: true,
        title: 'Delete Post',
        message: 'This is the last translation. Deleting it will remove the entire post. Continue?',
        confirmText: 'Delete Post',
        variant: 'danger',
        onConfirm: async () => {
          try {
            await postsAPI.delete(postId);
            toast.success('Post deleted successfully!');
            
            // Auto-refresh: Reload posts for this feature
            try {
              await refreshFeatures();
              
              // Update count
              const newCount = await postsAPI.getCount(featureId);
              const newCounts = new Map(postsCounts);
              newCounts.set(featureId, newCount);
              setPostsCounts(newCounts);
              
              // Reload posts if expanded
              if (expandedFeatures.has(featureId)) {
                console.log(`🔄 Auto-refreshing after deleting post...`);
                
                const freshPosts = await loadPostsForFeature(featureId, true); // 👈 FORCE RELOAD
                
                // Update cache
                const newLoadedPosts = new Map(loadedPosts);
                newLoadedPosts.set(featureId, freshPosts);
                setLoadedPosts(newLoadedPosts);
                
                setFeatures(prevFeatures =>
                  prevFeatures.map(f =>
                    f.id === featureId ? { ...f, posts: freshPosts } : f
                  )
                );
                console.log(`✅ Posts refreshed! Remaining: ${freshPosts.length} posts`);
              }
            } catch (refreshError) {
              console.error('Refresh error:', refreshError);
              toast.error('Failed to refresh. Please manually reload.');
            }
          } catch (error: any) {
            toast.error(`Failed to delete post: ${error.response?.data?.detail || error.message}`);
          }
        },
      });
    }
  };

  const handleEditFeature = (featureId: number) => {
    const apiFeature = apiFeatures.find(f => f.id === featureId);
    const localFeature = features.find(f => f.id === featureId);
    if (apiFeature && localFeature) {
      setSelectedFeature({ ...apiFeature, title: localFeature.name });
      setIsEditFeatureModalOpen(true);
    } else {
      toast.error('Feature not found');
    }
  };

  const handleDeleteFeature = (featureId: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Feature',
      message: 'Are you sure you want to delete this feature? This will also delete all associated posts.',
      confirmText: 'Delete Feature',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteFeature(featureId);
          toast.success('Feature deleted successfully!');
          
          // Auto-refresh: Reload features and counts
          await refreshFeatures();
          
          // Clear cache for deleted feature
          const newLoadedPosts = new Map(loadedPosts);
          newLoadedPosts.delete(featureId);
          setLoadedPosts(newLoadedPosts);
          
          const newCounts = new Map(postsCounts);
          newCounts.delete(featureId);
          setPostsCounts(newCounts);
        } catch (error) {
          toast.error('Failed to delete feature. Please try again.');
        }
      },
    });
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
        toast.success('Post updated successfully!');
      } else {
        await postsAPI.create(postPayload);
        toast.success('Post created successfully!');
      }
      
      setIsEditPostModalOpen(false);
      setSelectedPost(null);

      // Auto-refresh: Reload posts for the affected feature
      const featureId = selectedPost?.feature_id || selectedPost?.id;
      if (featureId) {
        try {
          // 1. Refresh features list
          await refreshFeatures();
          
          // 2. Reload posts count (always)
          const newCount = await postsAPI.getCount(featureId);
          const newCounts = new Map(postsCounts);
          newCounts.set(featureId, newCount);
          setPostsCounts(newCounts);
          
          // 3. Force reload posts immediately (if feature is expanded)
          if (expandedFeatures.has(featureId)) {
            console.log(`🔄 Auto-refreshing posts for feature ${featureId}...`);
            const freshPosts = await loadPostsForFeature(featureId, true); // 👈 FORCE RELOAD
            
            // Update cache
            const newLoadedPosts = new Map(loadedPosts);
            newLoadedPosts.set(featureId, freshPosts);
            setLoadedPosts(newLoadedPosts);
            
            // Update state with fresh posts
            setFeatures(prevFeatures =>
              prevFeatures.map(f =>
                f.id === featureId ? { ...f, posts: freshPosts } : f
              )
            );
            console.log(`✅ Posts refreshed successfully! Found ${freshPosts.length} posts`);
          }
        } catch (refreshError) {
          console.error('Refresh error:', refreshError);
          toast.error('Failed to refresh posts. Please manually reload.');
        }
      }
    } catch (error: any) {
      toast.error(`Failed to save post: ${error.response?.data?.detail || error.message}`);
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

      toast.success('Feature created successfully!');
      setIsAddFeatureModalOpen(false);
      
      // Auto-refresh: Reload all features and counts
      await refreshFeatures();
      
      // Reload counts for all features (including new one)
      if (apiFeatures.length > 0) {
        const counts = new Map<number, number>();
        await Promise.all(
          apiFeatures.map(async (feature) => {
            try {
              const count = await postsAPI.getCount(feature.id);
              counts.set(feature.id, count);
            } catch (error) {
              counts.set(feature.id, 0);
            }
          })
        );
        setPostsCounts(counts);
      }
    } catch (error) {
      toast.error('Failed to create feature. Please try again.');
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
      toast.success('Feature updated successfully!');
      setIsEditFeatureModalOpen(false);
      setSelectedFeature(null);
      
      // Auto-refresh: Reload counts after update
      if (apiFeatures.length > 0) {
        const counts = new Map<number, number>();
        await Promise.all(
          apiFeatures.map(async (feature) => {
            try {
              const count = await postsAPI.getCount(feature.id);
              counts.set(feature.id, count);
            } catch (error) {
              counts.set(feature.id, 0);
            }
          })
        );
        setPostsCounts(counts);
      }
    } catch (error) {
      toast.error('Failed to update feature. Please try again.');
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
        toast.success('Translation updated successfully!');
      } else {
        const createPayload = {
          locale: translationData.targetLanguage,
          title: translationData.title,
          content_html: translationData.content,
        };
        await postsApi.createTranslation(selectedPost.id, createPayload);
        toast.success('Translation created successfully!');
      }

      setIsTranslateModalOpen(false);

      // Auto-refresh: Reload posts for this feature to show new translation
      const featureId = selectedPost?.feature_id;
      if (featureId) {
        try {
          // 1. Refresh features list
          await refreshFeatures();
          
          // 2. Update count (translations may change count if it's a new locale)
          const newCount = await postsAPI.getCount(featureId);
          const newCounts = new Map(postsCounts);
          newCounts.set(featureId, newCount);
          setPostsCounts(newCounts);
          
          // 3. Force reload posts (if feature is expanded)
          if (expandedFeatures.has(featureId)) {
            console.log(`🔄 Auto-refreshing posts after translation for feature ${featureId}...`);
            
            const freshPosts = await loadPostsForFeature(featureId, true); // 👈 FORCE RELOAD
            
            // Update cache
            const newLoadedPosts = new Map(loadedPosts);
            newLoadedPosts.set(featureId, freshPosts);
            setLoadedPosts(newLoadedPosts);
            
            setFeatures(prevFeatures =>
              prevFeatures.map(f =>
                f.id === featureId ? { ...f, posts: freshPosts } : f
              )
            );
            console.log(`✅ Translation refreshed successfully! Found ${freshPosts.length} posts`);
          }
        } catch (refreshError) {
          console.error('Translation refresh error:', refreshError);
          toast.error('Failed to refresh posts. Please manually reload.');
        }
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

      toast.error(errorMessage);
    }
  };

  const getIconClass = (iconName: string) => {
    // If iconName is empty or undefined, return default
    if (!iconName) {
      return 'fas fa-file-alt';
    }

    // Map custom icon names to actual FontAwesome class names
    const iconMap: Record<string, string> = {
      // Common icons
      'lock': 'lock',
      'safe': 'lock',
      'vault': 'vault',
      'shield': 'shield-alt',
      'security': 'shield-alt',
      
      // Check-in/out & Access
      'check-in': 'sign-in-alt',
      'check-out': 'sign-out-alt',
      'access': 'key',
      'key': 'key',
      'door': 'door-open',
      
      // Amenities & Services
      'hot-tub-person': 'hot-tub',
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
      'ice-treat': 'ice-cream',
      'vending-machines': 'store',
      'convenience-store': 'store',
      'menu': 'list',
      'coupon': 'ticket',
      
      // Relaxation & Health
      'public-bath': 'bath',
      'sauna': 'hot-tub',
      'massage': 'hands-helping',
      'beauty-spa': 'spa',
      'fitness': 'dumbbell',
      'pool': 'swimming-pool',
      'yoga': 'leaf',
      
      // Services & Amenities
      'concierge': 'concierge-bell',
      'eco-cleaning': 'leaf',
      'coin-laundry': 'tshirt',
      'courier-service': 'truck',
      'locker-room': 'box-open',
      'pet-friendly': 'paw',
      'workspace': 'laptop',
      'original-goods': 'box-open',
      'hotel-chain': 'building',
      
      // Business & Events
      'conference-room': 'users',
      'seminar': 'chalkboard',
      'rental-space': 'key',
      'facility-congestion': 'chart-line',
      
      // Explore & Activities
      'sightseeing': 'map-marked-alt',
      'recommended-activity': 'thumbs-up',
      'playground': 'child',
      'self-organized-tour': 'map-signs',
      'bicycle-rental': 'bicycle',
      'kimono-rental': 'tshirt',
      'camp': 'campground',
      'sakura': 'leaf',
      'weather': 'cloud-sun',
      'local-events': 'calendar',
      
      // Info & Instructions
      'how-to-translate': 'language',
      'floor-guide': 'map',
      'survey': 'poll',
      'q-and-a': 'question-circle',
      'official-website': 'globe',
      
      // Safety & Regulations
      'smoking-area': 'smoking',
      'evacuation-plan': 'route',
      'covid-measures': 'shield-virus',
      'accommodation-terms': 'file-contract',
      
      // Additional common icons
      'wifi': 'wifi',
      'parking': 'parking',
      'restaurant': 'utensils',
      'gym': 'dumbbell',
      'spa': 'spa',
      'swimming-pool': 'swimming-pool',
      'bar': 'glass-martini-alt',
      'coffee': 'coffee',
      'breakfast': 'bacon',
      'luggage': 'suitcase-rolling',
      'taxi': 'taxi',
      'airport': 'plane',
      'train': 'train',
      'metro': 'subway',
      'bus': 'bus',
      'car': 'car',
      'bicycle': 'bicycle',
      'walk': 'walking',
      'wheelchair': 'wheelchair',
      'elevator': 'elevator',
      'stairs': 'stairs',
      'smoking': 'smoking',
      'no-smoking': 'smoking-ban',
      'pet': 'paw',
      'child': 'child',
      'family': 'users',
      'laundry': 'tshirt',
      'iron': 'iron',
      'hairdryer': 'fan',
      'tv': 'tv',
      'phone': 'phone',
      'computer': 'desktop',
      'printer': 'print',
      'fax': 'fax',
      'meeting': 'handshake',
      'presentation': 'presentation',
      'conference': 'users',
      'event': 'calendar-alt',
      'wedding': 'ring',
      'party': 'glass-cheers',
      'music': 'music',
      'cinema': 'film',
      'game': 'gamepad',
      'book': 'book',
      'newspaper': 'newspaper',
      'shopping': 'shopping-bag',
      'gift': 'gift',
      'credit-card': 'credit-card',
      'money': 'money-bill',
      'atm': 'money-bill-wave',
      'exchange': 'exchange-alt',
      'first-aid': 'first-aid',
      'pharmacy': 'pills',
      'doctor': 'user-md',
      'hospital': 'hospital',
      'ambulance': 'ambulance',
      'fire': 'fire-extinguisher',
      'police': 'shield-alt',
      'info': 'info-circle',
      'help': 'question-circle',
      'warning': 'exclamation-triangle',
      'danger': 'exclamation-circle',
      'success': 'check-circle',
      'error': 'times-circle',
      'star': 'star',
      'heart': 'heart',
      'home': 'home',
      'building': 'building',
      'hotel': 'hotel',
      'bed': 'bed',
      'bath': 'bath',
      'shower': 'shower',
      'toilet': 'toilet',
      'kitchen': 'utensils',
      'fridge': 'cube',
      'microwave': 'cube',
      'oven': 'fire',
      'dishwasher': 'sink',
      'washer': 'tshirt',
      'dryer': 'wind',
      'ac': 'snowflake',
      'heat': 'fire',
      'fan': 'fan',
      'light': 'lightbulb',
      'window': 'window-maximize',
      'balcony': 'door-open',
      'terrace': 'umbrella-beach',
      'garden': 'tree',
      'view': 'eye',
      'mountain': 'mountain',
      'beach': 'umbrella-beach',
      'sea': 'water',
      'lake': 'water',
      'river': 'water',
      'forest': 'tree',
      'park': 'tree',
      'city': 'city',
      'map': 'map-marked-alt',
      'location': 'map-marker-alt',
      'compass': 'compass',
      'flag': 'flag',
    };

    // Normalize iconName (lowercase, trim)
    const normalizedName = iconName.toLowerCase().trim();
    
    // Get mapped icon or use original
    const mappedIcon = iconMap[normalizedName] || normalizedName;
    
    // If already has fa- prefix, return as is with fas
    if (mappedIcon.startsWith('fa-')) {
      return `fas ${mappedIcon}`;
    }
    
    // Otherwise add fa- prefix
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
              // Use same locale detection as features
              const storedLocale = localStorage.getItem('locale');
              const browserLang = (navigator.language || (navigator as any).userLanguage || 'en').split('-')[0].toLowerCase();
              const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
              const userLocale = currentUser.default_locale || currentUser.locale;
              const uiLocale = (storedLocale || browserLang || userLocale || 'en').toLowerCase();
              
              // Get translated title with fallback chain: uiLocale → en → name → formatted slug
              const categoryTitle = category.translations?.[uiLocale]?.title || 
                                   category.translations?.en?.title || 
                                   category.name || 
                                   category.slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
              
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
                      <span>{postsCounts.get(feature.id) ?? feature.posts.length} posts</span>
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
                                deletePost(post.id, post.locale, translations, feature.id);
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

      {/* Modern Confirm Modal */}
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

export default Features;