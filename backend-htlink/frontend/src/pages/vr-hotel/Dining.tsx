import React from 'react';
import { Utensils } from 'lucide-react';

const VRHotelDining: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dining Options</h1>
          <p className="mt-2 text-gray-600">Showcase your restaurants and dining experiences</p>
        </div>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          + Add Dining
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Utensils size={48} className="mx-auto text-green-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Dining Management</h2>
        <p className="text-gray-600">Manage your hotel's restaurants, bars, and dining venues with virtual tours and menus.</p>
      </div>
    </div>
  );
};

export default VRHotelDining;
