// src/pages/Analytics.tsx
import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import type { Chart as ChartJS } from "chart.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faArrowUp, faArrowDown, faCalendar, faChevronDown } from "@fortawesome/free-solid-svg-icons";

// DateRange interface
export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
  period: 'month' | 'quarter' | 'year' | 'custom';
}

// DateRangePicker Component
interface DateRangePickerProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
}

const PRESET_RANGES: DateRange[] = [
  {
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    label: 'This Month',
    period: 'month'
  },
  {
    startDate: '2024-11-01',
    endDate: '2024-11-30',
    label: 'Last Month',
    period: 'month'
  },
  {
    startDate: '2024-10-01',
    endDate: '2024-12-31',
    label: 'This Quarter (Q4)',
    period: 'quarter'
  },
  {
    startDate: '2024-07-01',
    endDate: '2024-09-30',
    label: 'Last Quarter (Q3)',
    period: 'quarter'
  },
  {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    label: 'This Year (2024)',
    period: 'year'
  },
  {
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    label: 'Last Year (2023)',
    period: 'year'
  }
];

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  selectedRange,
  onRangeChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetSelect = (range: DateRange) => {
    onRangeChange(range);
    setIsOpen(false);
  };

  const handleCustomRangeApply = () => {
    if (customStartDate && customEndDate) {
      const customRange: DateRange = {
        startDate: customStartDate,
        endDate: customEndDate,
        label: `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`,
        period: 'custom'
      };
      onRangeChange(customRange);
      setIsOpen(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const groupedRanges = {
    month: PRESET_RANGES.filter(r => r.period === 'month'),
    quarter: PRESET_RANGES.filter(r => r.period === 'quarter'),
    year: PRESET_RANGES.filter(r => r.period === 'year')
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <FontAwesomeIcon icon={faCalendar} className="text-gray-500" />
        <span>{selectedRange.label}</span>
        <FontAwesomeIcon 
          icon={faChevronDown} 
          className={`text-gray-400 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-80"
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('preset')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'preset'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Quick Select
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'custom'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Custom Range
            </button>
          </div>

          <div className="p-4 max-h-80 overflow-y-auto">
            {activeTab === 'preset' ? (
              <div className="space-y-4">
                {/* Debug info */}
                <div className="text-xs text-gray-400 mb-2">
                  Total ranges: {PRESET_RANGES.length}
                </div>
                
                {/* Monthly */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Monthly ({groupedRanges.month.length})
                  </h4>
                  <div className="space-y-1">
                    {groupedRanges.month.map((range, index) => (
                      <button
                        key={`month-${index}`}
                        onClick={() => handlePresetSelect(range)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          selectedRange.label === range.label
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quarterly */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Quarterly ({groupedRanges.quarter.length})
                  </h4>
                  <div className="space-y-1">
                    {groupedRanges.quarter.map((range, index) => (
                      <button
                        key={`quarter-${index}`}
                        onClick={() => handlePresetSelect(range)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          selectedRange.label === range.label
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Yearly */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Yearly ({groupedRanges.year.length})
                  </h4>
                  <div className="space-y-1">
                    {groupedRanges.year.map((range, index) => (
                      <button
                        key={`year-${index}`}
                        onClick={() => handlePresetSelect(range)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          selectedRange.label === range.label
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCustomRangeApply}
                    disabled={!customStartDate || !customEndDate}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Analytics Component
const Analytics: React.FC = () => {
  // canvas refs
  const pageViewsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const trafficCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Chart instances (kept in refs so we can destroy them on cleanup)
  const pageViewsChartRef = useRef<ChartJS | null>(null);
  const trafficChartRef = useRef<ChartJS | null>(null);

  // UI state (filters)
  const [timeFilter, setTimeFilter] = useState<"7d" | "30d" | "90d">("30d");
  const [flowFilter, setFlowFilter] = useState<"all" | "new" | "returning">("all");
  
  // Date range state
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({
    startDate: '2024-11-01',
    endDate: '2024-11-30',
    label: 'Last Month',
    period: 'month'
  });
  
  // Mock data - in a real app, this would come from an API
  const [stats] = useState({
    pageViews: { value: "24,847", change: "+18.5%", positive: true },
    uniqueVisitors: { value: "8,423", change: "+12.3%", positive: true },
    avgSession: { value: "3m 42s", change: "+8.2%", positive: true },
    bounceRate: { value: "28.3%", change: "-5.4%", positive: false },
    featureClicks: { value: "15,673", change: "+24.1%", positive: true },
    vrTourViews: { value: "1,847", change: "+31.7%", positive: true },
  });

  // Create charts
  useEffect(() => {
    // destroy any existing charts
    pageViewsChartRef.current?.destroy();
    trafficChartRef.current?.destroy();

    // Page Views chart
    if (pageViewsCanvasRef.current) {
      pageViewsChartRef.current = new Chart(pageViewsCanvasRef.current, {
        type: "line",
        data: {
          labels: ["Dec 1", "Dec 3", "Dec 5", "Dec 7", "Dec 9", "Dec 11", "Dec 13", "Dec 15"],
          datasets: [
            {
              label: "Page Views",
              data: [1200, 1450, 1300, 1800, 1600, 2100, 1950, 2300].slice(0, timeFilter === '7d' ? 4 : 8),
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59,130,246,0.12)",
              fill: true,
              tension: 0.4,
            },
            {
              label: "Unique Visitors",
              data: [800, 950, 850, 1200, 1050, 1400, 1300, 1500].slice(0, timeFilter === '7d' ? 4 : 8),
              borderColor: "#10b981",
              backgroundColor: "rgba(16,185,129,0.08)",
              fill: false,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8, padding: 20 } } },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
          },
          elements: { point: { radius: 0, hitRadius: 10, hoverRadius: 5 } },
        },
      });
    }

    // Traffic sources doughnut chart
    if (trafficCanvasRef.current) {
      trafficChartRef.current = new Chart(trafficCanvasRef.current, {
        type: "doughnut",
        data: {
          labels: ["QR Code Scan", "Direct Link", "Social Media", "Search", "Referral"],
          datasets: [{
            data: [45, 25, 15, 10, 5],
            backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8, padding: 15 } } },
          cutout: "70%",
        },
      });
    }

    return () => {
      pageViewsChartRef.current?.destroy();
      trafficChartRef.current?.destroy();
    };
  }, [timeFilter, selectedDateRange]);

  const exportData = () => {
    console.log('Exporting data for range:', selectedDateRange);
    alert(`Exporting data for ${selectedDateRange.label}`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Analytics Overview</h2>
          <p className="text-gray-600 mt-1">Key metrics and performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker 
            selectedRange={selectedDateRange}
            onRangeChange={setSelectedDateRange}
          />
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors" 
            onClick={exportData}
          >
            <FontAwesomeIcon icon={faDownload} />
            Export
          </button>
        </div>
      </div>

      {/* Top stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-8">
        {Object.entries(stats).map(([key, stat]) => (
          <div key={key} className="bg-white p-5 rounded-xl shadow-sm flex flex-col">
            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
            <div className={`mt-3 text-sm flex items-center gap-1.5 ${stat.positive ? 'text-green-600' : 'text-orange-600'}`}>
              <FontAwesomeIcon icon={stat.positive ? faArrowUp : faArrowDown} />
              <span>{stat.change} from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Page Views Over Time</h3>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              {["7d", "30d", "90d"].map((filter) => (
                <button
                  key={filter}
                  className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${timeFilter === filter ? "bg-white text-blue-600 shadow-sm" : "bg-transparent text-gray-600 hover:bg-gray-200"}`}
                  onClick={() => setTimeFilter(filter as "7d" | "30d" | "90d")}
                >
                  {filter.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="h-80"><canvas ref={pageViewsCanvasRef} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Traffic Sources</h3>
          <div className="h-56"><canvas ref={trafficCanvasRef} /></div>
        </div>
      </div>

      {/* Data tables section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Most Viewed Pages</h3>
            <a href="#" className="text-sm text-blue-600 font-semibold hover:underline">View all</a>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left font-semibold text-gray-600 p-3">Page</th>
                <th className="text-right font-semibold text-gray-600 p-3">Views</th>
                <th className="text-right font-semibold text-gray-600 p-3">Trend</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="p-3 text-blue-600 hover:underline cursor-pointer">Welcome to Tabi Tower</td>
                <td className="p-3 text-right font-medium text-gray-800">4,523</td>
                <td className="p-3 text-right text-green-600">+15.2%</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3 text-blue-600 hover:underline cursor-pointer">Hotel Amenities</td>
                <td className="p-3 text-right font-medium text-gray-800">3,847</td>
                <td className="p-3 text-right text-green-600">+8.7%</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3 text-blue-600 hover:underline cursor-pointer">Restaurant & Dining</td>
                <td className="p-3 text-right font-medium text-gray-800">2,954</td>
                <td className="p-3 text-right text-green-600">+22.1%</td>
              </tr>
              <tr>
                <td className="p-3 text-blue-600 hover:underline cursor-pointer">Spa & Wellness</td>
                <td className="p-3 text-right font-medium text-gray-800">2,673</td>
                <td className="p-3 text-right text-red-600">-5.3%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Most Clicked Features</h3>
            <a href="#" className="text-sm text-blue-600 font-semibold hover:underline">View all</a>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left font-semibold text-gray-600 p-3">Feature</th>
                <th className="text-right font-semibold text-gray-600 p-3">Clicks</th>
                <th className="text-right font-semibold text-gray-600 p-3">CTR</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="p-3">WiFi Information</td>
                <td className="p-3 text-right font-medium text-gray-800">1,847</td>
                <td className="p-3 text-right text-gray-500">12.4%</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3">Room Service Menu</td>
                <td className="p-3 text-right font-medium text-gray-800">1,623</td>
                <td className="p-3 text-right text-gray-500">10.8%</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3">Pool Schedule</td>
                <td className="p-3 text-right font-medium text-gray-800">1,354</td>
                <td className="p-3 text-right text-gray-500">9.1%</td>
              </tr>
              <tr>
                <td className="p-3">Concierge Contact</td>
                <td className="p-3 text-right font-medium text-gray-800">1,267</td>
                <td className="p-3 text-right text-gray-500">8.5%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* User Flow */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">User Journey Flow</h3>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {["all", "new", "returning"].map((filter) => (
              <button
                key={filter}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors capitalize ${flowFilter === filter ? "bg-white text-blue-600 shadow-sm" : "bg-transparent text-gray-600 hover:bg-gray-200"}`}
                onClick={() => setFlowFilter(filter as "all" | "new" | "returning")}
              >
                {filter} Users
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {[
            { num: 1, title: "Landing Page", desc: "Initial hotel information page", users: "8,423", conversion: "100.0%" },
            { num: 2, title: "Feature Navigation", desc: "Users browse hotel features", users: "6,847", conversion: "81.3%" },
            { num: 3, title: "Service Details", desc: "View specific service information", users: "4,923", conversion: "58.4%" },
            { num: 4, title: "Contact/Action", desc: "Contact hotel or use services", users: "2,847", conversion: "33.8%" },
          ].map(step => (
            <div key={step.num} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">{step.num}</div>
                <div>
                  <h4 className="font-semibold text-gray-800">{step.title}</h4>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800">{step.users}</div>
                <div className="text-xs text-gray-500">{step.conversion}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;