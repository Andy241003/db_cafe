import {
  faCheckCircle,
  faDownload,
  faExclamationTriangle,
  faFileExport,
  faFileImport,
  faSpinner,
  faUpload
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import vrHotelApi from '../../services/vrHotelApi';

interface ImportPreview {
  status: string;
  metadata: {
    export: {
      version: string;
      date: string;
      format: string;
    };
    property: {
      name: string;
      total_rooms: number;
      total_dining: number;
      total_services: number;
      total_facilities: number;
    };
  };
  summary: {
    locales: number;
    rooms: number;
    dining: number;
    services: number;
    facilities: number;
  };
  source_property: {
    source_property_name: string;
    source_property_id: number;
  };
  warnings: string[];
}

interface ImportResult {
  status: string;
  message: string;
  summary: {
    locales: number;
    rooms: number;
    dining: number;
    services: number;
    facilities: number;
  };
  next_steps: string[];
}

export default function ExportImport() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError('');
      
      const response = await vrHotelApi.exportPropertyTemplate();
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/['"]/g, '')
        : `property-export-${new Date().toISOString().split('T')[0]}.zip`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportPreview(null);
      setImportResult(null);
      setError('');
    }
  };

  const handlePreview = async () => {
    if (!importFile) return;

    try {
      setError('');
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await vrHotelApi.previewImportTemplate(formData);
      setImportPreview(response.data);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Preview failed');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    try {
      setIsImporting(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await vrHotelApi.importPropertyTemplate(formData);
      setImportResult(response.data);
      setImportPreview(null);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Export / Import Property Template</h1>

        {/* Export Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faFileExport} className="text-blue-600 text-2xl mr-3" />
            <h2 className="text-2xl font-bold">Export Property</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            Export all property content including rooms, dining, services, facilities, and their translations 
            to a ZIP file. This template can be imported to quickly set up a new property.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
            <h3 className="font-semibold mb-2">What will be exported:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All room types with translations</li>
              <li>All dining venues with translations</li>
              <li>All services with translations</li>
              <li>All facilities with translations</li>
              <li>Language settings and translations</li>
            </ul>
          </div>
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-400"
          >
            {isExporting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Export Property Template
              </>
            )}
          </button>
        </div>

        {/* Import Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faFileImport} className="text-green-600 text-2xl mr-3" />
            <h2 className="text-2xl font-bold">Import Property Template</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            Import a property template ZIP file to quickly populate this property with content.
            All data will use this property's ID automatically.
          </p>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select ZIP File
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-3xl mb-2" />
                  <p className="text-sm text-gray-600">
                    {importFile ? importFile.name : 'Click to select a ZIP file'}
                  </p>
                </div>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              
              {importFile && !importPreview && (
                <button
                  onClick={handlePreview}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                  Preview
                </button>
              )}
            </div>
          </div>

          {/* Preview */}
          {importPreview && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-3">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 mr-2" />
                  <h3 className="font-semibold">Import Preview</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Source Property</p>
                    <p className="font-semibold">{importPreview.source_property?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Export Date</p>
                    <p className="font-semibold">
                      {importPreview.metadata?.export_date 
                        ? new Date(importPreview.metadata.export_date).toLocaleDateString()
                        : 'Unknown'}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded p-3 mb-3">
                  <h4 className="font-semibold mb-2 text-sm">Contents to Import:</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Locales:</span>
                      <span className="ml-2 font-semibold">{importPreview.summary.locales}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Rooms:</span>
                      <span className="ml-2 font-semibold">{importPreview.summary.rooms}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Dining:</span>
                      <span className="ml-2 font-semibold">{importPreview.summary.dining}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Services:</span>
                      <span className="ml-2 font-semibold">{importPreview.summary.services}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Facilities:</span>
                      <span className="ml-2 font-semibold">{importPreview.summary.facilities}</span>
                    </div>
                  </div>
                </div>

                {importPreview.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <div className="flex items-start">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 mt-1 mr-2" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Important Notes:</h4>
                        <ul className="text-sm space-y-1">
                          {importPreview.warnings.map((warning, idx) => (
                            <li key={idx}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-400"
                >
                  {isImporting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faFileImport} className="mr-2" />
                      Confirm Import
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setImportPreview(null);
                    setImportFile(null);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-xl mr-2" />
                <h3 className="font-semibold text-lg">Import Successful!</h3>
              </div>
              
              <p className="mb-3">{importResult.message}</p>
              
              <div className="bg-white rounded p-3 mb-3">
                <h4 className="font-semibold mb-2 text-sm">Imported:</h4>
                <div className="grid grid-cols-5 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Locales:</span>
                    <span className="ml-2 font-semibold">{importResult.summary.locales}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Rooms:</span>
                    <span className="ml-2 font-semibold">{importResult.summary.rooms}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Dining:</span>
                    <span className="ml-2 font-semibold">{importResult.summary.dining}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Services:</span>
                    <span className="ml-2 font-semibold">{importResult.summary.services}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Facilities:</span>
                    <span className="ml-2 font-semibold">{importResult.summary.facilities}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <h4 className="font-semibold mb-2 text-sm">Next Steps:</h4>
                <ul className="text-sm space-y-1">
                  {importResult.next_steps.map((step, idx) => (
                    <li key={idx}>• {step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mr-2" />
                <p className="text-red-700 font-semibold">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
