import { useState, useEffect } from 'react';
import { featuresAPI, type Feature } from '../services/api';

interface UseFeatures {
  features: Feature[];
  loading: boolean;
  error: string | null;
  createFeature: (feature: Partial<Feature>) => Promise<void>;
  updateFeature: (id: number, feature: Partial<Feature>) => Promise<void>;
  deleteFeature: (id: number) => Promise<void>;
  refreshFeatures: () => Promise<void>;
}

export const useFeatures = (): UseFeatures => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('useFeatures: Fetching features from API...');
      console.log('🏢 Current tenant context:', {
        tenant_code: localStorage.getItem('tenant_code'),
        tenant_id: localStorage.getItem('tenant_id'),
        currentUser: JSON.parse(localStorage.getItem('currentUser') || '{}')
      });
      const data = await featuresAPI.getAll();
      console.log('useFeatures: API returned features for current tenant:', data);
      setFeatures(data);
    } catch (err) {
      console.error('useFeatures: Error fetching features:', err);
      setError('Failed to load features');
      setFeatures([]); // No fallback, use empty array to show real API issues
    } finally {
      setLoading(false);
    }
  };

  const createFeature = async (feature: Partial<Feature>) => {
    try {
      console.log('useFeatures: Creating feature with data:', feature);
      const newFeature = await featuresAPI.create(feature);
      console.log('useFeatures: Feature created successfully:', newFeature);
      setFeatures(prev => [...prev, newFeature]);
    } catch (err) {
      console.error('useFeatures: Error creating feature:', err);
      setError('Failed to create feature');
      throw err;
    }
  };

  const updateFeature = async (id: number, feature: Partial<Feature>) => {
    try {
      console.log('useFeatures: Updating feature ID:', id, 'with data:', feature);
      const updatedFeature = await featuresAPI.update(id, feature);
      console.log('useFeatures: Update API response:', updatedFeature);
      
      setFeatures(prev => {
        const updated = prev.map(f => f.id === id ? updatedFeature : f);
        console.log('useFeatures: Updated features state:', updated);
        return updated;
      });
    } catch (err) {
      console.error('Error updating feature:', err);
      setError('Failed to update feature');
      throw err;
    }
  };

  const deleteFeature = async (id: number) => {
    try {
      await featuresAPI.delete(id);
      setFeatures(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Error deleting feature:', err);
      setError('Failed to delete feature');
      throw err;
    }
  };

  const refreshFeatures = async () => {
    await fetchFeatures();
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  return {
    features,
    loading,
    error,
    createFeature,
    updateFeature,
    deleteFeature,
    refreshFeatures,
  };
};