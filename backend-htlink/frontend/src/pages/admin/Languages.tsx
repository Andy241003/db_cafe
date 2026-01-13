import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Languages: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Settings page with localization tab
    navigate('/settings?tab=localization', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-sm text-slate-500">Redirecting to language settings...</p>
      </div>
    </div>
  );
};

export default Languages;
