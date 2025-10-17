import { useQuery, useQueryClient } from '@tanstack/react-query';
import { postsAPI } from '../services/api';

// Hook to load posts for a specific feature with React Query
export const useFeaturePosts = (featureId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['feature-posts', featureId],
    queryFn: async () => {
      // Load WITH translations when enabled
      const posts = await postsAPI.getAll(featureId, true);
      return posts;
    },
    enabled, // Only fetch when enabled (for lazy loading)
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

// Hook to prefetch posts for a feature (background loading)
export const usePrefetchFeaturePosts = () => {
  const queryClient = useQueryClient();

  return (featureId: number) => {
    queryClient.prefetchQuery({
      queryKey: ['feature-posts', featureId],
      queryFn: async () => {
        const posts = await postsAPI.getAll(featureId, true);
        return posts;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Hook to invalidate (refresh) posts cache
export const useInvalidateFeaturePosts = () => {
  const queryClient = useQueryClient();

  return {
    // Invalidate specific feature posts
    invalidateFeature: (featureId: number) => {
      queryClient.invalidateQueries({ queryKey: ['feature-posts', featureId] });
    },
    // Invalidate all feature posts
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-posts'] });
    },
  };
};

// Hook to get posts count (metadata only - fast)
export const useFeaturePostsCount = (featureId: number) => {
  return useQuery({
    queryKey: ['feature-posts-count', featureId],
    queryFn: async () => {
      // Load WITHOUT translations for fast count
      const posts = await postsAPI.getAll(featureId, false);
      return posts.length;
    },
    staleTime: 5 * 60 * 1000,
  });
};
