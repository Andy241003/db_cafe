// Simple test Dashboard component
import React from 'react';

const TestDashboard: React.FC = () => {
  console.log('TestDashboard: Component rendered');
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard Test</h1>
      <p className="mt-4 text-gray-600">This is a simple test dashboard to verify the component is working.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800">Test Card 1</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">123</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800">Test Card 2</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">456</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800">Test Card 3</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">789</p>
        </div>
      </div>
    </div>
  );
};

export default TestDashboard;