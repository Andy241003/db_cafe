import React from 'react';
import { useFeaturePosts } from '../../hooks/useFeaturesPosts';
import type { UIPost } from '../../services/api';

interface FeaturePostsProps {
  featureId: number;
  isExpanded: boolean;
  onEditPost: (post: UIPost) => void;
  onTranslatePost: (post: UIPost) => void;
  onDeletePost: (postId: number, locale: string, translations: any[]) => void;
  onAddPost: (featureId: number) => void;
}

// Map locale code to a human-friendly name and flag
const getLocaleInfo = (locale?: string) => {
  const code = (locale || 'en').toLowerCase();
  switch (code) {
    case 'vi':
      return { localeName: 'Vietnamese', flagClass: 'VN' };
    case 'ja':
      return { localeName: 'Japanese', flagClass: 'JP' };
    case 'ko':
      return { localeName: 'Korean', flagClass: 'KR' };
    case 'fr':
      return { localeName: 'French', flagClass: 'FR' };
    case 'zh':
      return { localeName: 'Chinese', flagClass: 'CN' };
    case 'en':
    default:
      return { localeName: 'English', flagClass: 'GB' };
  }
};

const FeaturePosts: React.FC<FeaturePostsProps> = ({
  featureId,
  isExpanded,
  onEditPost,
  onTranslatePost,
  onDeletePost,
  onAddPost,
}) => {
  // React Query hook - only fetch when expanded
  const { data: posts, isLoading, error } = useFeaturePosts(featureId, isExpanded);

  // Process posts into UIPost format
  const uiPosts: UIPost[] = React.useMemo(() => {
    if (!posts) return [];

    const processed: UIPost[] = [];
    posts.forEach((post: any) => {
      // Normalize translations to array
      const translationsArray: any[] = [];
      if (post.translations) {
        if (Array.isArray(post.translations)) {
          translationsArray.push(...post.translations);
        } else if (typeof post.translations === 'object') {
          Object.keys(post.translations).forEach(k =>
            translationsArray.push({ locale: k, ...post.translations[k] })
          );
        }
      }

      // Create UI entries for each translation
      if (translationsArray.length > 0) {
        translationsArray.forEach((t: any) => {
          const tInfo = getLocaleInfo(t.locale);
          const tRaw = t.content_html || '';
          const tExcerpt = tRaw.replace(/<[^>]*>/g, '').substring(0, 100);
          processed.push({
            ...post,
            uiKey: `post-${post.id}-trans-${t.locale}`,
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
            translations: translationsArray,
          });
        });
      }
    });

    return processed;
  }, [posts]);

  if (!isExpanded) return null;

  return (
    <div className="bg-slate-50 p-5">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-base font-semibold text-slate-900">Posts in this Feature</h4>
        <button
          className="bg-green-600 text-white border-none px-4 py-2 rounded-md text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-colors hover:bg-green-700"
          onClick={(e) => {
            e.stopPropagation();
            onAddPost(featureId);
          }}
        >
          <i className="fas fa-plus"></i>
          Add Post
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-10 text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p>Loading posts...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-10 text-red-500">
          <i className="fas fa-exclamation-triangle text-3xl mb-2"></i>
          <p>Failed to load posts</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && uiPosts.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <div className="text-5xl text-slate-300 mb-4">
            <i className="fas fa-plus-circle"></i>
          </div>
          <p>No posts created yet for this feature.</p>
          <p>Click "Add Post" to create the first post.</p>
        </div>
      )}

      {/* Posts List */}
      {!isLoading && !error && uiPosts.length > 0 && (
        <div className="flex flex-col gap-3">
          {uiPosts.map((post) => (
            <div
              key={post.uiKey || `${post.id}-${post.locale}`}
              className="bg-white border border-slate-200 rounded-lg p-4 transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <span className="text-lg">{post.flagClass}</span>
                  {post.localeName}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 border-none rounded text-xs font-medium cursor-pointer flex items-center gap-1 transition-all bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditPost(post);
                    }}
                  >
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button
                    className="px-2 py-1 border-none rounded text-xs font-medium cursor-pointer flex items-center gap-1 transition-all bg-green-50 text-green-800 border border-green-200 hover:bg-green-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTranslatePost(post);
                    }}
                  >
                    <i className="fas fa-language"></i> Translate
                  </button>
                  <button
                    className="px-2 py-1 border-none rounded text-xs font-medium cursor-pointer flex items-center gap-1 transition-all bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      const translations = post.translations || [];
                      onDeletePost(post.id, post.locale, translations);
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
                  <div
                    className={`w-2 h-2 rounded-full ${
                      post.status === 'published' ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                  ></div>
                  {post.status}
                </div>
                <span>Updated: {post.updated_at || post.created_at}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturePosts;
