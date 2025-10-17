import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featuresAPI, type Feature } from '../services/api';

export const useFeaturesQuery = () => {
  const queryClient = useQueryClient();

  // Main query to get all features
  const featuresQuery = useQuery({
    queryKey: ['features'],
    queryFn: () => featuresAPI.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation to create feature
  const createFeatureMutation = useMutation({
    mutationFn: (feature: Partial<Feature>) => featuresAPI.create(feature),
    onSuccess: () => {
      // Invalidate and refetch features
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });

  // Mutation to update feature
  const updateFeatureMutation = useMutation({
    mutationFn: ({ id, feature }: { id: number; feature: Partial<Feature> }) =>
      featuresAPI.update(id, feature),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });

  // Mutation to delete feature
  const deleteFeatureMutation = useMutation({
    mutationFn: (id: number) => featuresAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });

  return {
    features: featuresQuery.data || [],
    loading: featuresQuery.isLoading,
    error: featuresQuery.error ? 'Failed to load features' : null,
    createFeature: createFeatureMutation.mutateAsync,
    updateFeature: async (id: number, feature: Partial<Feature>) => {
      await updateFeatureMutation.mutateAsync({ id, feature });
    },
    deleteFeature: deleteFeatureMutation.mutateAsync,
    refreshFeatures: () => queryClient.invalidateQueries({ queryKey: ['features'] }),
  };
};
