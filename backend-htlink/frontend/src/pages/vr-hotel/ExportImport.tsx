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
    version: string;
    export_date: string;
    source_property: string;
    total_items: {
      introduction: number;
      policies: number;
      rules: number;
      contact: number;
      seo: number;
      settings: number;
      rooms: number;
      dining: number;
      services: number;
      facilities: number;
    };
  };
  summary: {
    locales: number;
    introduction?: number;
    policies?: number;
    rules?: number;
    contact?: number;
    seo?: number;
    settings?: number;
    rooms: number;
    dining: number;
    services: number;
    facilities: number;
  };
  source_property: {
    name: string;
    id: number;
  };
  warnings: string[];
}

interface ImportResult {
  status: string;
  message: string;
  summary: {
    locales: number;
    introduction?: number;
    policies?: number;
    rules?: number;
    contact?: number;
    seo?: number;
    settings?: number;
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Export / Import Property Template</h1>
        <p className="text-slate-600">
          Quickly duplicate property content and configuration to speed up new property setup
        </p>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faFileExport} className="text-blue-600 text-2xl" />
            <div>
              <h2 className="text-xl font-bold text-slate-800">Export Property</h2>
              <p className="text-slate-600 text-sm mt-1">
                Export all property content and configuration to a ZIP file
              </p>
            </div>
          </div>
        </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
            <h3 className="font-semibold mb-3">What will be exported:</h3>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <p className="font-semibold text-blue-700 mb-2">Configuration</p>
                <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                  <li>Language settings (Locales)</li>
                  <li>VR Hotel settings</li>
                  <li>Contact information</li>
                  <li>SEO metadata per locale</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-blue-700 mb-2">Content Pages</p>
                <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                  <li>Introduction content</li>
                  <li>Policies & Terms</li>
                  <li>House Rules</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-blue-700 mb-2">VR Items</p>
                <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                  <li>All rooms with translations</li>
                  <li>All dining venues with translations</li>
                  <li>All services with translations</li>
                  <li>All facilities with translations</li>
                </ul>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Images are not included. You'll need to upload images separately for the new property.
              </p>
            </div>
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faFileImport} className="text-green-600 text-2xl" />
            <div>
              <h2 className="text-xl font-bold text-slate-800">Import Property Template</h2>
              <p className="text-slate-600 text-sm mt-1">
                Import a property template ZIP file to quickly populate this property
              </p>
            </div>
          </div>
        </div>
          
          <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
            <h3 className="font-semibold mb-3">Import Information:</h3>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li><strong>Existing data:</strong> Configuration items (Settings, Contact, SEO) will be updated if they exist, or created if new</li>
                  <li><strong>New items:</strong> All VR items (Rooms, Dining, Services, Facilities) will be added as new entries</li>
                  <li><strong>Locales:</strong> Languages will be activated if not already present</li>
                </ul>
              </div>
              <div>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li><strong>Translations:</strong> All text content will be imported for each locale</li>
                  <li><strong>Review needed:</strong> Please verify booking URLs and pricing after import</li>
                </ul>
              </div>
            </div>
          </div>

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
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-lg mr-2" />
                  <h3 className="text-lg font-semibold text-slate-800">Import Preview</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Source Property</p>
                    <p className="font-semibold text-slate-800">{importPreview.source_property?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Export Date</p>
                    <p className="font-semibold text-slate-800">
                      {importPreview.metadata?.export_date 
                        ? new Date(importPreview.metadata.export_date).toLocaleDateString('en-GB')
                        : 'Unknown'}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-slate-800 mb-4">Contents to Import:</h4>
                  
                  {/* Simple Grid Layout */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Locales:</span>
                      <span className="font-semibold text-slate-800">{importPreview.summary.locales}</span>
                    </div>
                    {importPreview.summary.settings ? (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Settings:</span>
                        <span className="font-semibold text-slate-800">{importPreview.summary.settings}</span>
                      </div>
                    ) : null}
                    {importPreview.summary.contact ? (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Contact:</span>
                        <span className="font-semibold text-slate-800">{importPreview.summary.contact}</span>
                      </div>
                    ) : null}
                    {importPreview.summary.seo ? (
                      <div className="flex justify-between">
                        <span className="text-slate-600">SEO:</span>
                        <span className="font-semibold text-slate-800">{importPreview.summary.seo}</span>
                      </div>
                    ) : null}
                    {importPreview.summary.introduction ? (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Introduction:</span>
                        <span className="font-semibold text-slate-800">{importPreview.summary.introduction}</span>
                      </div>
                    ) : null}
                    {importPreview.summary.policies ? (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Policies:</span>
                        <span className="font-semibold text-slate-800">{importPreview.summary.policies}</span>
                      </div>
                    ) : null}
                    {importPreview.summary.rules ? (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Rules:</span>
                        <span className="font-semibold text-slate-800">{importPreview.summary.rules}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between">
                      <span className="text-slate-600">Rooms:</span>
                      <span className="font-semibold text-slate-800">{importPreview.summary.rooms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Dining:</span>
                      <span className="font-semibold text-slate-800">{importPreview.summary.dining}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Services:</span>
                      <span className="font-semibold text-slate-800">{importPreview.summary.services}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Facilities:</span>
                      <span className="font-semibold text-slate-800">{importPreview.summary.facilities}</span>
                    </div>
                  </div>
                </div>

                {importPreview.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 text-lg flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-2">Important Notes:</h4>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {importPreview.warnings.map((warning, idx) => (
                            <li key={idx}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-4">
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
              
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-800 mb-4">Imported Successfully</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Locales:</span>
                    <span className="font-semibold text-slate-800">{importResult.summary.locales}</span>
                  </div>
                  
                  {importResult.summary.settings ? (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Settings:</span>
                      <span className="font-semibold text-slate-800">{importResult.summary.settings}</span>
                    </div>
                  ) : null}
                  
                  {importResult.summary.contact ? (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Contact:</span>
                      <span className="font-semibold text-slate-800">{importResult.summary.contact}</span>
                    </div>
                  ) : null}
                  
                  {importResult.summary.seo ? (
                    <div className="flex justify-between">
                      <span className="text-slate-600">SEO:</span>
                      <span className="font-semibold text-slate-800">{importResult.summary.seo}</span>
                    </div>
                  ) : null}
                  
                  {importResult.summary.introduction ? (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Introduction:</span>
                      <span className="font-semibold text-slate-800">{importResult.summary.introduction}</span>
                    </div>
                  ) : null}
                  
                  {importResult.summary.policies ? (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Policies:</span>
                      <span className="font-semibold text-slate-800">{importResult.summary.policies}</span>
                    </div>
                  ) : null}
                  
                  {importResult.summary.rules ? (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Rules:</span>
                      <span className="font-semibold text-slate-800">{importResult.summary.rules}</span>
                    </div>
                  ) : null}
                  
                  <div className="flex justify-between">
                    <span className="text-slate-600">Rooms:</span>
                    <span className="font-semibold text-slate-800">{importResult.summary.rooms}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-600">Dining:</span>
                    <span className="font-semibold text-slate-800">{importResult.summary.dining}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-600">Services:</span>
                    <span className="font-semibold text-slate-800">{importResult.summary.services}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-600">Facilities:</span>
                    <span className="font-semibold text-slate-800">{importResult.summary.facilities}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-6">
                <h4 className="font-semibold mb-3 text-sm">Next Steps:</h4>
                <ul className="text-sm space-y-2">
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
  );
}
