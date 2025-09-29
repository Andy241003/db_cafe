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
      const data = await featuresAPI.getAll();
      console.log('useFeatures: API returned data:', data);
      setFeatures(data);
    } catch (err) {
      console.error('useFeatures: Error fetching features:', err);
      setError('Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  const createFeature = async (feature: Partial<Feature>) => {
    try {
      const newFeature = await featuresAPI.create(feature);
      setFeatures(prev => [...prev, newFeature]);
    } catch (err) {
      console.error('Error creating feature:', err);
      setError('Failed to create feature');
      throw err;
    }
  };

  const updateFeature = async (id: number, feature: Partial<Feature>) => {
    try {
      const updatedFeature = await featuresAPI.update(id, feature);
      setFeatures(prev => 
        prev.map(f => f.id === id ? updatedFeature : f)
      );
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