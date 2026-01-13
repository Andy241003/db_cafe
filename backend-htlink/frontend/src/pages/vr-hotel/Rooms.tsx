import React from 'react';
import { DoorOpen } from 'lucide-react';

const VRHotelRooms: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rooms Management</h1>
          <p className="mt-2 text-gray-600">Create and manage your virtual hotel rooms</p>
        </div>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          + Add Room
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <DoorOpen size={48} className="mx-auto text-blue-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Rooms Management</h2>
        <p className="text-gray-600">Create and manage virtual tours for your hotel rooms with 360° views and interactive elements.</p>
      </div>
    </div>
  );
};

export default VRHotelRooms;
