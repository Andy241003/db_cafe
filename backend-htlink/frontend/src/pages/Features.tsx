import React, { useState, useEffect } from 'react';
import AddFeatureModal from '../components/features/AddFeatureModal';
import EditPostModal from '../components/features/EditPostModal';
import TranslateModal from '../components/features/TranslateModal';
import { useFeatures } from '../hooks/useFeatures';
import { useCategories } from '../hooks/useCategories';

interface Post {
  id: number;
  title: string;
  excerpt: string;
  locale: string;
  localeName: string;
  flagClass: string;
  status: 'published' | 'draft';
  updatedAt: string;
  content?: string;
}

interface LocalFeature {
  id: number;
  name: string;
  category: string;
  icon: string;
  iconColor: string;
  status: 'active' | 'inactive';
  posts: Post[];
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
  const { features: apiFeatures, loading, error } = useFeatures();
  const { categories, loading: categoriesLoading } = useCategories();
  
  // Convert API features to LocalFeature format for UI compatibility
  const [features, setFeatures] = useState<LocalFeature[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedFeatures, setExpandedFeatures] = useState<Set<number>>(new Set());

  // Debug logging
  useEffect(() => {
    console.log('Features Debug - API Features:', apiFeatures);
    console.log('Features Debug - Categories:', categories);
    console.log('Features Debug - Loading:', loading);
    console.log('Features Debug - Error:', error);
  }, [apiFeatures, categories, loading, error]);

  // Convert API features to LocalFeature format when data loads
  useEffect(() => {
    console.log('Converting features:', apiFeatures.length, 'features');
    if (apiFeatures.length > 0) {
      const convertedFeatures: LocalFeature[] = apiFeatures.map(feature => {
        // Find category by id to get slug for filtering
        const category = categories.find(cat => cat.id === feature.category_id);
        console.log('Converting feature:', feature, 'with category:', category);
        
        return {
          id: feature.id,
          name: feature.title || feature.slug, // Use title if available, otherwise slug
          category: category?.slug || "general", // Use category slug for filtering
          icon: feature.icon_key || "fa-file-alt",
          iconColor: "linear-gradient(135deg, #667eea, #764ba2)", // Default gradient
          status: "active" as const, // Default status
          posts: [], // Posts will be loaded separately
        };
      });
      console.log('Converted features:', convertedFeatures);
      setFeatures(convertedFeatures);
      
      // Expand first feature by default if any exist
      if (convertedFeatures.length > 0) {
        setExpandedFeatures(new Set([convertedFeatures[0].id]));
      }
    }
  }, [apiFeatures, categories]);
  
  // Modal states
  const [isAddFeatureModalOpen, setIsAddFeatureModalOpen] = useState(false);
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Filter features based on search and filters
  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || feature.category === categoryFilter;
    const matchesStatus = !statusFilter || feature.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

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
  const handleEditPostClick = (post: Post) => {
    setSelectedPost(post);
    setIsEditPostModalOpen(true);
  };

  const handleTranslateClick = (post: Post) => {
    setSelectedPost(post);
    setIsTranslateModalOpen(true);
  };

  const deletePost = (postId: number) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      alert(`Post #${postId} deleted successfully!`);
    }
  };

  const addPost = (featureId: number) => {
    console.log("Adding post to feature:", featureId);
    setSelectedPost(null);
    setIsEditPostModalOpen(true);
  };

  // Modal handlers
  const handleSavePost = (postData: any) => {
    console.log('Saving post:', postData);
    alert('Post saved successfully!');
    setIsEditPostModalOpen(false);
  };

  const handleSaveFeature = (formData: FormData) => {
    console.log('Saving feature:', formData);
    alert('Feature saved successfully!');
    setIsAddFeatureModalOpen(false);
  };

  const handleTranslate = (translationData: any) => {
    console.log('Translated data:', translationData);
    setIsTranslateModalOpen(false);
  };

  const getIconClass = (iconName: string) => {
    switch (iconName) {
      case 'fa-sign-in-alt': return 'fas fa-sign-in-alt';
      case 'fa-utensils': return 'fas fa-utensils';
      case 'fa-crown': return 'fas fa-crown';
      default: return 'fas fa-file-alt';
    }
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
                <div>
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
              </div>
              <i className={`fas fa-chevron-down text-slate-600 text-base transition-transform ${expandedFeatures.has(feature.id) ? 'rotate-180' : ''}`}></i>
            </div>
            
            <div className={`bg-slate-50 transition-all duration-300 ease-in-out overflow-hidden ${expandedFeatures.has(feature.id) ? 'max-h-[1000px]' : 'max-h-0'}`}>
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
                          <span>Updated: {post.updatedAt}</span>
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

      {/* Modals */}
      <AddFeatureModal
        isOpen={isAddFeatureModalOpen}
        onClose={() => setIsAddFeatureModalOpen(false)}
        onSave={handleSaveFeature}
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