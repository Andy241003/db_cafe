// src/pages/Reports.tsx
import React, { useState } from 'react';
import ChartCard from '../components/ChartCard';

const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  const reportData = [
    {
      title: 'Total Revenue',
      value: '$24,567',
      change: '+12% vs last month',
      changeType: 'positive' as const,
      icon: 'fas fa-dollar-sign',
      iconBg: '#10b981'
    },
    {
      title: 'Bookings',
      value: '142',
      change: '+8% vs last month',
      changeType: 'positive' as const,
      icon: 'fas fa-calendar-check',
      iconBg: '#3b82f6'
    },
    {
      title: 'Occupancy Rate',
      value: '78%',
      change: '-2% vs last month',
      changeType: 'negative' as const,
      icon: 'fas fa-bed',
      iconBg: '#8b5cf6'
    },
    {
      title: 'Customer Rating',
      value: '4.8',
      change: '+0.2 vs last month',
      changeType: 'positive' as const,
      icon: 'fas fa-star',
      iconBg: '#f59e0b'
    }
  ];

  const handleExportReport = () => {
    console.log('Exporting report...');
    alert('Report exported successfully!');
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    console.log('Period changed to:', period);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <p className="text-gray-600 mt-1">Analytics and performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="1year">Last year</option>
          </select>
          
          {/* Export Button */}
          <button
            onClick={handleExportReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-download"></i>
            Export
          </button>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {reportData.map((card, index) => (
          <ChartCard
            key={index}
            title={card.title}
            value={card.value}
            change={card.change}
            changeType={card.changeType}
            icon={card.icon}
            iconBg={card.iconBg}
          />
        ))}
      </div>

      {/* Chart Placeholder */}.
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            Current Period
          </div>
        </div>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <i className="fas fa-chart-line text-4xl mb-3"></i>
            <p>Chart visualization would be implemented here</p>
            <p className="text-sm mt-1">Use libraries like Chart.js or Recharts</p>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { id: 'BK001', guest: 'John Smith', room: '101', checkin: '2024-01-15', status: 'Confirmed', amount: '$250' },
                { id: 'BK002', guest: 'Sarah Johnson', room: '205', checkin: '2024-01-16', status: 'Pending', amount: '$180' },
                { id: 'BK003', guest: 'Mike Brown', room: '310', checkin: '2024-01-17', status: 'Cancelled', amount: '$300' }
              ].map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {booking.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.guest}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.room}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.checkin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {booking.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;