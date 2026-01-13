import React from 'react';
import { Gift } from 'lucide-react';

const VRHotelOffers: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offers & Promotions</h1>
          <p className="mt-2 text-gray-600">Create and manage special offers and packages</p>
        </div>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          + Create Offer
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Gift size={48} className="mx-auto text-yellow-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Offers & Promotions</h2>
        <p className="text-gray-600">Create attractive offers and packages to boost bookings and guest engagement.</p>
      </div>
    </div>
  );
};

export default VRHotelOffers;
