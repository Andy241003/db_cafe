import React from 'react';
import { Users } from 'lucide-react';

const VRHotelContact: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Information</h1>
          <p className="mt-2 text-gray-600">Manage your hotel's contact details and communication channels</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Users size={48} className="mx-auto text-red-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Contact Management</h2>
        <p className="text-gray-600">Configure contact information, communication channels, and guest support details.</p>
      </div>
    </div>
  );
};

export default VRHotelContact;
