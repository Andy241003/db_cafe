import React from 'react';
import { BookOpen } from 'lucide-react';

const VRHotelPolicies: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Policies</h1>
          <p className="mt-2 text-gray-600">Manage your hotel's policies and procedures</p>
        </div>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          + Add Policy
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <BookOpen size={48} className="mx-auto text-blue-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Policies Management</h2>
        <p className="text-gray-600">Define and manage check-in/check-out policies, cancellation policies, and other important procedures.</p>
      </div>
    </div>
  );
};

export default VRHotelPolicies;
