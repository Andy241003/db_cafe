import React from 'react';
import { BookOpen } from 'lucide-react';

const VRHotelRules: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">House Rules</h1>
          <p className="mt-2 text-gray-600">Set and manage your hotel's house rules</p>
        </div>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          + Add Rule
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <BookOpen size={48} className="mx-auto text-orange-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">House Rules Management</h2>
        <p className="text-gray-600">Define and communicate your hotel's house rules to guests in a clear and professional manner.</p>
      </div>
    </div>
  );
};

export default VRHotelRules;
