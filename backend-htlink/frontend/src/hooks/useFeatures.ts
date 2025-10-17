import { useState, useEffect } from 'react';
import { featuresAPI, type Feature } from '../services/api';

interface UseFeatures {
  features: Feature[];
  loading: boolean;
  error: string | null;
  createFeature: (feature: Partial<Feature>) => Promise<Feature>;
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
      const data = await featuresAPI.getAll();
      setFeatures(data);
      
      // Cache features in sessionStorage for faster subsequent loads
      try {
        sessionStorage.setItem('cached_features', JSON.stringify(data));
        sessionStorage.setItem('cached_features_time', Date.now().toString());
      } catch (e) {
        // Ignore cache errors
      }
    } catch (err) {
      console.error('Failed to load features:', err);
      setError('Failed to load features');
      
      // Try to load from cache
      try {
        const cached = sessionStorage.getItem('cached_features');
        if (cached) {
          setFeatures(JSON.parse(cached));
        } else {
          setFeatures([]);
        }
      } catch (e) {
        setFeatures([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const createFeature = async (feature: Partial<Feature>) => {
    try {
      const newFeature = await featuresAPI.create(feature);
      setFeatures(prev => [...prev, newFeature]);
      return newFeature; // Return the created feature
    } catch (err) {
      setError('Failed to create feature');
      throw err;
    }
  };

  const updateFeature = async (id: number, feature: Partial<Feature>) => {
    try {
      const updatedFeature = await featuresAPI.update(id, feature);
      
      setFeatures(prev => {
        const updated = prev.map(f => f.id === id ? updatedFeature : f);
        return updated;
      });
    } catch (err) {
      setError('Failed to update feature');
      throw err;
    }
  };

  const deleteFeature = async (id: number) => {
    try {
      await featuresAPI.delete(id);
      setFeatures(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      setError('Failed to delete feature');
      throw err;
    }
  };

  const refreshFeatures = async () => {
    await fetchFeatures();
  };

  useEffect(() => {
    // Try to load from cache first for instant display
    try {
      const cached = sessionStorage.getItem('cached_features');
      const cacheTime = sessionStorage.getItem('cached_features_time');
      
      // Use cache if less than 5 minutes old
      if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 5 * 60 * 1000) {
        setFeatures(JSON.parse(cached));
        setLoading(false);
        
        // Still refresh in background for fresh data
        fetchFeatures();
        return;
      }
    } catch (e) {
      // Ignore cache errors
    }
    
    // No valid cache, load normally
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