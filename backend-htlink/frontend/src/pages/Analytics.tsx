// src/pages/Analytics.tsx
import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import type { Chart as ChartJS } from "chart.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { useAnalytics } from "../hooks/useAnalytics";
import { usePermissions } from "../hooks/usePermissions";
// import { usePageTracking } from "../hooks/usePageTracking";
import LoadingSpinner from "../components/analytics/LoadingSpinner";
import ErrorMessage from "../components/analytics/ErrorMessage";

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
  const [isExporting, setIsExporting] = useState(false);
  
  // Use analytics hook
  const { data, loading, error, refreshData, exportData } = useAnalytics(timeFilter);

  // Get permissions
  const permissions = usePermissions();

  // Track page view - DISABLED to prevent double counting
  // usePageTracking('/analytics');
  
  // Set demo tenant for development
  useEffect(() => {
    if (!localStorage.getItem('tenant_id')) {
      localStorage.setItem('tenant_id', 'demo');
    }
  }, []);

  // Handle export
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      await exportData('xlsx');
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Create charts
  useEffect(() => {
    if (!data) return;

    // destroy any existing charts
    pageViewsChartRef.current?.destroy();
    trafficChartRef.current?.destroy();

    // Page Views chart
    if (pageViewsCanvasRef.current && data.chartData) {
      pageViewsChartRef.current = new Chart(pageViewsCanvasRef.current, {
        type: "line",
        data: {
          labels: data.chartData.labels,
          datasets: [
            {
              label: "Page Views",
              data: data.chartData.pageViews,
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59,130,246,0.12)",
              fill: true,
              tension: 0.4,
            },
            {
              label: "Unique Visitors",
              data: data.chartData.uniqueVisitors,
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
    if (trafficCanvasRef.current && data.trafficSources) {
      trafficChartRef.current = new Chart(trafficCanvasRef.current, {
        type: "doughnut",
        data: {
          labels: data.trafficSources.map(source => source.name),
          datasets: [{
            data: data.trafficSources.map(source => source.value),
            backgroundColor: data.trafficSources.map(source => source.color),
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
  }, [data, timeFilter]);

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen font-sans">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Analytics Overview</h2>
            <p className="text-gray-600 mt-1">Key metrics and performance insights</p>
          </div>
        </div>
        <LoadingSpinner size="large" text="Loading analytics data..." />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen font-sans">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Analytics Overview</h2>
            <p className="text-gray-600 mt-1">Key metrics and performance insights</p>
          </div>
        </div>
        <ErrorMessage message={error} onRetry={refreshData} />
      </div>
    );
  }

  // Show data (if available)
  if (!data) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen font-sans">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Analytics Overview</h2>
            <p className="text-gray-600 mt-1">Key metrics and performance insights</p>
          </div>
        </div>
        <div className="text-center text-gray-500 mt-12">No data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Analytics Overview</h2>
          <p className="text-gray-600 mt-1">Key metrics and performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          {permissions.canExportAnalytics && (
            <button
              className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleExportData}
              disabled={isExporting}
            >
              <FontAwesomeIcon icon={faDownload} />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          )}
        </div>
      </div>

      {/* Top stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-8">
        {Object.entries(data.stats).map(([key, stat]) => (
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
              {data.popularPages.map((page, index) => (
                <tr key={index} className={`border-b border-gray-100 ${index === data.popularPages.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="p-3 text-blue-600 hover:underline cursor-pointer">{page.page}</td>
                  <td className="p-3 text-right font-medium text-gray-800">{page.views.toLocaleString()}</td>
                  <td className={`p-3 text-right ${page.trendPositive ? 'text-green-600' : 'text-red-600'}`}>{page.trend}</td>
                </tr>
              ))}
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
              {data.popularFeatures.map((feature, index) => (
                <tr key={index} className={`border-b border-gray-100 ${index === data.popularFeatures.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="p-3">{feature.feature}</td>
                  <td className="p-3 text-right font-medium text-gray-800">{feature.clicks.toLocaleString()}</td>
                  <td className="p-3 text-right text-gray-500">{feature.ctr}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Analytics;