import React, { useState, useEffect, useMemo } from 'react';
import AddFeatureModal from '../components/features/AddFeatureModal';
import EditFeatureModal from '../components/features/EditFeatureModal';
import EditPostModal from '../components/features/EditPostModalSimple';
import TranslateModal from '../components/features/TranslateModal';
import { useFeatures } from '../hooks/useFeatures';
import { useCategories } from '../hooks/useCategories';
import type { UIPost } from '../services/api';
import { postsAPI, propertiesAPI } from '../services/api';

interface LocalFeature {
  id: number;
  name: string;
  category: string;
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
  // Use real API data
  const { features: apiFeatures, loading, error, createFeature, updateFeature, deleteFeature, refreshFeatures } = useFeatures();
  const { categories, loading: categoriesLoading } = useCategories();
  
  // Convert API features to LocalFeature format for UI compatibility
  const [features, setFeatures] = useState<LocalFeature[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedFeatures, setExpandedFeatures] = useState<Set<number>>(new Set());

  // Load posts for all features
  const loadPostsForFeatures = async (features: any[]) => {
    const postsPromises = features.map(async (feature: any) => {
      try {
        const posts = await postsAPI.getAll(feature.id);
        console.log(`=== LOADED POSTS FOR FEATURE ${feature.slug} (ID: ${feature.id}) ===`);
        console.log(`Number of posts: ${posts.length}`);
        posts.forEach((post: any) => {
          console.log(`- Post ${post.id}: "${post.title}" | Content: "${post.content_html}"`);
        });
        return { featureId: feature.id, posts };
      } catch (error) {
        console.error(`Error loading posts for feature ${feature.id}:`, error);
        return { featureId: feature.id, posts: [] };
      }
    });
    
    const postsResults = await Promise.all(postsPromises);
    const postsMap = new Map();
    postsResults.forEach(result => {
      postsMap.set(result.featureId, result.posts);
    });
    
    return postsMap;
  };

  // Debug logging
  useEffect(() => {
    console.log('Features Debug - API Features:', apiFeatures);
    console.log('Features Debug - Categories:', categories);
    console.log('Features Debug - Loading:', loading);
    console.log('Features Debug - Error:', error);
  }, [apiFeatures, categories, loading, error]);

  // Convert API features to LocalFeature format when data loads
  useEffect(() => {
    console.log('=== FEATURE CONVERSION DEBUG ===');
    console.log('API Features:', apiFeatures.length, 'features, data:', apiFeatures);
    console.log('Categories:', categories.length, 'categories, data:', categories);
    
    if (apiFeatures.length > 0) {
      const convertFeatures = async () => {
        // Load posts for all features first
        const postsMap = await loadPostsForFeatures(apiFeatures);
        
        const convertedFeatures: LocalFeature[] = apiFeatures.map(feature => {
          // Find category by id to get slug for filtering
          const category = categories.find(cat => cat.id === feature.category_id);
          console.log('Converting feature:', feature.slug, 'icon_key:', feature.icon_key, 'is_system:', feature.is_system, 'category:', category?.slug);
          
          // Get posts for this feature
          const featurePosts = postsMap.get(feature.id) || [];
          console.log(`Posts for feature ${feature.slug}:`, featurePosts);
          
          const uiPosts: UIPost[] = featurePosts.map((post: any) => {
            console.log('Converting post:', post.id, 'title:', post.title, 'content_html:', post.content_html);
            
            return {
              ...post,
              title: post.title || `Post ${post.id}`,
              excerpt: post.content_html ? post.content_html.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : 'No content',
              locale: post.locale || 'en',
              localeName: 'English',
              flagClass: 'flag-icon-us', 
              content: post.content_html || '', // Ensure content is from content_html
              slug: post.slug || '',
              status: post.status ? post.status.toLowerCase() : 'draft',
              updatedAt: post.updated_at || post.created_at,
              // Also keep original fields for reference
              content_html: post.content_html
            };
          });
          
          console.log('Converted UI posts:', uiPosts);
          
          // Convert is_system to status for UI
          // is_system: false = active (normal feature)
          // is_system: true = inactive (system feature that can be disabled)
          
          return {
            id: feature.id,
            name: feature.title || feature.slug, // Use title if available, otherwise slug
            category: category?.slug || "general", // Use category slug for filtering
            icon: feature.icon_key || "fa-file-alt",
            iconColor: "linear-gradient(135deg, #667eea, #764ba2)", // Default gradient
            status: feature.is_system ? "inactive" : "active",
            posts: uiPosts, // Use loaded posts
          };
        });
        console.log('=== CONVERTED FEATURES WITH POSTS ===', convertedFeatures);
        setFeatures(convertedFeatures);
        
        // Expand first feature by default if any exist
        if (convertedFeatures.length > 0) {
          setExpandedFeatures(new Set([convertedFeatures[0].id]));
        }
      };
      
      convertFeatures();
    } else {
      console.log('No API features to convert yet...');
    }
  }, [apiFeatures, categories]);
  
  // Modal states
  const [isAddFeatureModalOpen, setIsAddFeatureModalOpen] = useState(false);
  const [isEditFeatureModalOpen, setIsEditFeatureModalOpen] = useState(false);
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<UIPost | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);

  // Filter features based on search and filters - NO LIMITS, show all features
  const filteredFeatures = useMemo(() => {
    console.log('Filtering features with:', { searchQuery, categoryFilter, statusFilter });
    console.log('Total features:', features.length);
    
    const filtered = features.filter(feature => {
      const matchesSearch = feature.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || feature.category === categoryFilter;
      const matchesStatus = !statusFilter || feature.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
    
    console.log('Filtered features count:', filtered.length);
    return filtered;
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
    console.log('=== EDIT POST DEBUG ===');
    console.log('Post ID:', post.id);
    console.log('Post title:', post.title);
    console.log('Post feature_id:', post.feature_id);
    console.log('Post content:', post.content);
    console.log('Post content_html:', (post as any).content_html);
    console.log('Full post object:', post);
    
    // Use content_html as primary source since that's what we store in DB
    const editPost = {
      ...post,
      content: (post as any).content_html || post.content || 'No content available. Start writing here...',
      title: post.title || `Post ${post.id}`,
      slug: post.slug || `post-${post.id}`,
      status: post.status || 'draft',
      feature_id: post.feature_id || (post as any).feature_id // Ensure feature_id is preserved
    };
    
    console.log('Prepared edit post:', editPost);
    console.log('Edit post feature_id:', editPost.feature_id);
    console.log('Edit post content to send to modal:', editPost.content);
    
    setSelectedPost(editPost);
    setIsEditPostModalOpen(true);
  };

  const handleTranslateClick = (post: UIPost) => {
    setSelectedPost(post);
    setIsTranslateModalOpen(true);
  };

  const deletePost = async (postId: number) => {
    console.log('Delete Post clicked:', postId);
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postsAPI.delete(postId);
        alert('Post deleted successfully!');
        
        // Refresh features to update posts list
        await refreshFeatures();
        
        // Force reload posts for updated features display
        if (apiFeatures.length > 0) {
          const postsMap = await loadPostsForFeatures(apiFeatures);
          
          // Update local features with fresh posts
          const updatedFeatures = features.map(feature => {
            const freshPosts = postsMap.get(feature.id) || [];
            const uiPosts: UIPost[] = freshPosts.map((post: any) => ({
              ...post,
              title: post.title || `Post ${post.id}`,
              excerpt: post.content_html ? post.content_html.substring(0, 100) + '...' : '',
              locale: 'en',
              localeName: 'English',
              flagClass: 'flag-icon-us',
              content: post.content_html,
              updatedAt: post.updated_at || post.created_at
            }));
            
            return {
              ...feature,
              posts: uiPosts
            };
          });
          
          console.log('Updated features after delete:', updatedFeatures);
          setFeatures(updatedFeatures);
        }
      } catch (error: any) {
        console.error('Error deleting post:', error);
        alert(`Failed to delete post: ${error.response?.data?.detail || error.message}`);
      }
    }
  };

  const handleEditFeature = (featureId: number) => {
    console.log('Editing feature ID:', featureId);
    const feature = apiFeatures.find(f => f.id === featureId);
    if (feature) {
      console.log('Found feature for editing:', feature);
      setSelectedFeature(feature);
      setIsEditFeatureModalOpen(true);
    } else {
      console.error('Feature not found for ID:', featureId);
      alert('Feature not found');
    }
  };

  const handleDeleteFeature = async (featureId: number) => {
    if (window.confirm('Are you sure you want to delete this feature? This will also delete all associated posts.')) {
      try {
        console.log('Deleting feature:', featureId);
        await deleteFeature(featureId);
        alert('Feature deleted successfully!');
      } catch (error) {
        console.error('Error deleting feature:', error);
        alert('Failed to delete feature. Please try again.');
      }
    }
  };

  const addPost = (featureId: number) => {
    console.log("Adding post to feature:", featureId);
    
    // Create a new post object for the feature
    const newPost = {
      id: 0, // New post
      tenant_id: 1, // Default tenant
      property_id: 1, // Default property - TODO: get from context
      feature_id: featureId,
      slug: '',
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
      console.log('=== SAVING POST ===');
      console.log('Post data from form:', postData);
      console.log('Selected post object:', selectedPost);
      
      // Get user context for tenant and property
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const tenantId = parseInt(localStorage.getItem('tenant_id') || '1');
      
      console.log('User context:', { currentUser, tenantId });
      
      // Get or create property_id
      let propertyId = currentUser.property_id;
      
      if (!propertyId) {
        try {
          console.log('No property_id in user context, fetching properties...');
          const properties = await propertiesAPI.getAll();
          console.log('Available properties:', properties);
          
          if (properties.length > 0) {
            propertyId = properties[0].id;
            console.log(`Using first available property: ${propertyId}`);
          } else {
            // Create default property if none exist
            console.log('No properties found, creating default property...');
            const defaultProperty = await propertiesAPI.create({
              name: 'Default Hotel Property',
              tenant_id: tenantId,
              description: 'Auto-created default property for posts',
              address: ''
            });
            propertyId = defaultProperty.id;
            console.log(`Created default property: ${propertyId}`);
          }
        } catch (propertyError) {
          console.error('Failed to get/create property:', propertyError);
          throw new Error('Failed to get property information. Please contact administrator.');
        }
      }
      
      // Convert postData to API format
      const postPayload = {
        tenant_id: tenantId,
        property_id: propertyId, // Now guaranteed to have a valid property_id
        feature_id: selectedPost?.feature_id || selectedPost?.id || 1,
        slug: postData.slug || postData.title.toLowerCase().replace(/\s+/g, '-'),
        status: (postData.status || 'draft').toUpperCase(),
        pinned: true,
        title: postData.title,
        content_html: postData.content || '',
        locale: postData.locale || 'en'
      };
      
      console.log('API payload to send:', postPayload);
      console.log('Update or Create?', selectedPost?.id && selectedPost.id > 0 ? 'UPDATE' : 'CREATE');
      
      if (selectedPost?.id && selectedPost.id > 0) {
        // Update existing post
        console.log(`Updating existing post ID: ${selectedPost.id}`);
        const updatedPost = await postsAPI.update(selectedPost.id, postPayload);
        console.log('Updated post response:', updatedPost);
        alert('Post updated successfully!');
      } else {
        // Create new post  
        console.log('Creating new post');
        const newPost = await postsAPI.create(postPayload);
        console.log('Created post response:', newPost);
        alert('Post created successfully!');
      }
      
      setIsEditPostModalOpen(false);
      setSelectedPost(null);
      
      // REFRESH DATA - Reload features and posts
      console.log('=== POST SAVED - REFRESHING DATA ===');
      try {
        // Method 1: Use the refreshFeatures hook to get fresh API data
        await refreshFeatures();
        console.log('✅ Features refreshed via hook');
        
        // Method 2: Force re-conversion of features with fresh posts
        if (apiFeatures.length > 0) {
          console.log('🔄 Reloading posts for all features...');
          const postsMap = await loadPostsForFeatures(apiFeatures);
          
          // Update local features with fresh posts
          const updatedFeatures = features.map(feature => {
            const freshPosts = postsMap.get(feature.id) || [];
            const uiPosts: UIPost[] = freshPosts.map((post: any) => ({
              ...post,
              title: post.title || `Post ${post.id}`,
              excerpt: post.content_html ? post.content_html.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : 'No content',
              locale: post.locale || 'en',
              localeName: 'English',
              flagClass: 'flag-icon-us',
              content: post.content_html || '',
              slug: post.slug || '',
              status: post.status ? post.status.toLowerCase() : 'draft',
              updatedAt: post.updated_at || post.created_at,
              content_html: post.content_html
            }));
            
            return {
              ...feature,
              posts: uiPosts
            };
          });
          
          setFeatures(updatedFeatures);
          console.log('✅ Local features updated with fresh posts');
        }
      } catch (refreshError) {
        console.error('❌ Failed to refresh data, trying page reload...', refreshError);
        // Fallback: Full page reload
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error saving post:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(`Failed to save post: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleSaveFeature = async (formData: FormData) => {
    try {
      console.log('Creating feature:', formData);
      
      // Convert FormData to API format
      const featureData = {
        slug: formData.slug,
        icon_key: formData.icon,
        category_id: categories.find(cat => cat.slug === formData.category)?.id || 1,
        tenant_id: 1, // Default tenant
        is_system: formData.status === 'inactive' // Convert status to is_system
      };
      
      console.log('API feature data:', featureData);
      await createFeature(featureData);
      alert('Feature created successfully!');
      setIsAddFeatureModalOpen(false);
    } catch (error) {
      console.error('Error creating feature:', error);
      alert('Failed to create feature. Please try again.');
    }
  };

  const handleSaveEditFeature = async (featureId: number, formData: any) => {
    try {
      console.log('Updating feature:', featureId, formData);
      
      // Convert FormData to API format
      const updateData = {
        slug: formData.slug,
        icon_key: formData.icon,
        category_id: categories.find(cat => cat.slug === formData.category)?.id || 1,
        tenant_id: 1,
        is_system: formData.status === 'inactive' // Convert status back to is_system
      };
      
      console.log('API update data:', updateData);
      await updateFeature(featureId, updateData);
      
      console.log('Feature updated successfully, refreshing data...');
      
      // Force refresh features list to show updated data
      await refreshFeatures();
      
      console.log('Data refreshed, closing modal...');
      alert('Feature updated successfully!');
      setIsEditFeatureModalOpen(false);
      setSelectedFeature(null);
    } catch (error) {
      console.error('Error updating feature:', error);
      alert('Failed to update feature. Please try again.');
    }
  };

  const handleTranslate = (translationData: any) => {
    console.log('Translated data:', translationData);
    setIsTranslateModalOpen(false);
  };

  const getIconClass = (iconName: string) => {
    console.log('getIconClass: Converting icon:', iconName);
    
    // Handle icons with fa- prefix
    if (iconName.startsWith('fa-')) {
      return `fas ${iconName}`;
    }
    
    // Handle icons without prefix - add fa- prefix
    const iconWithPrefix = `fa-${iconName}`;
    console.log('getIconClass: Added prefix:', iconWithPrefix);
    return `fas ${iconWithPrefix}`;
  }

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
            categories.map(category => (
              <option key={category.id} value={category.slug}>
                {category.slug.charAt(0).toUpperCase() + category.slug.slice(1)}
              </option>
            ))
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
                      <div key={post.id} className="bg-white border border-slate-200 rounded-lg p-4 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 font-semibold text-slate-900">
                            <div className={`w-5 h-3.5 rounded-sm flex items-center justify-center text-xs font-bold text-white ${post.flagClass === 'vi' ? 'bg-red-600' : 'bg-blue-900'}`}>
                              {post.flagClass.toUpperCase()}
                            </div>
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
                              onClick={(e) => { e.stopPropagation(); deletePost(post.id); }}
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