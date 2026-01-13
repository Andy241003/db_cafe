import React from 'react';
import { Zap } from 'lucide-react';

const VRHotelFacilities: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facilities & Amenities</h1>
          <p className="mt-2 text-gray-600">Showcase your hotel facilities and amenities</p>
        </div>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          + Add Facility
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Zap size={48} className="mx-auto text-purple-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Facilities Management</h2>
        <p className="text-gray-600">Manage and showcase all your hotel's facilities, amenities, and services.</p>
      </div>
    </div>
  );
};

export default VRHotelFacilities;
